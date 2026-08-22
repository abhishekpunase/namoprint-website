import { useEffect, useMemo, useRef, useState } from 'react'
import { FiCrosshair, FiPlus, FiTrash2, FiUploadCloud } from 'react-icons/fi'
import { AdminToggle } from './ui/AdminToggle'
import { analyzeMockupFile, analyzeMockupFromUrl, defaultInsetBox } from '../../utils/mockupAnalyzer'
import { getObjectContainFit, photoBoxToStyle, resolveMockupLayout } from '../../utils/mockupLayout'

const ANALYZE_OPTS = { forAdmin: true }
const emptyBox = () => ({ x: 0, y: 0, width: 100, height: 100, rotate: 0, borderRadius: 0 })

function normalizeBox(box = {}) {
  return {
    x: Number(box.x) || 0,
    y: Number(box.y) || 0,
    width: Math.max(8, Number(box.width) || 100),
    height: Math.max(8, Number(box.height) || 100),
    rotate: Number(box.rotate) || 0,
    borderRadius: Number(box.borderRadius ?? box.radius) || 0,
    ...(box.clipPath ? { clipPath: box.clipPath } : {}),
    ...(box.slotShape ? { slotShape: box.slotShape } : {}),
  }
}

export function MockupEditor({ value, onChange, onUploadFrame, uploading = false }) {
  const previewRef = useRef(null)
  const dragRef = useRef(null)
  const [activeBoxIndex, setActiveBoxIndex] = useState(0)
  const [analyzing, setAnalyzing] = useState(false)
  const [layoutFit, setLayoutFit] = useState({ left: 0, top: 0, width: 100, height: 100 })

  const canvasW = Number(value.canvasWidth || 1000)
  const canvasH = Number(value.canvasHeight || 1000)
  const mockupCanvas = useMemo(() => ({ width: canvasW, height: canvasH }), [canvasW, canvasH])
  const multiSlot = Boolean(value.multiSlot)
  const boxes = useMemo(() => {
    if (multiSlot && value.photoBoxes?.length) return value.photoBoxes.map(normalizeBox)
    return [normalizeBox(value.photoBox || emptyBox())]
  }, [multiSlot, value.photoBoxes, value.photoBox])
  const activeBox = boxes[activeBoxIndex] || boxes[0] || emptyBox()

  useEffect(() => {
    let cancelled = false
    resolveMockupLayout(value.frameImage, mockupCanvas, boxes)
      .then((layout) => {
        if (!cancelled) setLayoutFit(layout.fit || getObjectContainFit(mockupCanvas, mockupCanvas))
      })
      .catch(() => {
        if (!cancelled) setLayoutFit(getObjectContainFit(mockupCanvas, mockupCanvas))
      })
    return () => {
      cancelled = true
    }
  }, [value.frameImage, mockupCanvas, boxes.length])

  const boxStyle = (box) =>
    photoBoxToStyle(box, mockupCanvas, {
      fit: layoutFit,
      transparent: true,
    })

  const patchBox = (index, patch) => {
    const nextBoxes = boxes.map((box, i) => (i === index ? normalizeBox({ ...box, ...patch }) : box))
    if (multiSlot) {
      onChange({ photoBoxes: nextBoxes, photoBox: nextBoxes[0] })
    } else {
      onChange({ photoBox: nextBoxes[0], photoBoxes: [] })
    }
  }

  const patchActive = (patch) => patchBox(activeBoxIndex, patch)

  const applyAnalysis = (analysis) => {
    onChange({
      canvasWidth: String(analysis.canvasWidth),
      canvasHeight: String(analysis.canvasHeight),
      photoBox: normalizeBox(analysis.photoBox),
      photoBoxes: (analysis.photoBoxes || []).map(normalizeBox),
      multiSlot: Boolean(analysis.multiSlot),
      slotCount: analysis.slotCount,
      analyzeError: '',
    })
    setActiveBoxIndex(0)
  }

  const handleFrameUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAnalyzing(true)
    try {
      const analysis = await analyzeMockupFile(file, ANALYZE_OPTS)
      const url = await onUploadFrame(file)
      onChange({
        ...(url ? { frameImage: url } : {}),
        canvasWidth: String(analysis.canvasWidth),
        canvasHeight: String(analysis.canvasHeight),
        photoBox: normalizeBox(analysis.photoBox),
        photoBoxes: (analysis.photoBoxes || []).map(normalizeBox),
        multiSlot: Boolean(analysis.multiSlot),
        slotCount: analysis.slotCount,
        analyzeError: '',
      })
      setActiveBoxIndex(0)
    } catch (err) {
      onChange({ analyzeError: err.message })
    } finally {
      setAnalyzing(false)
      event.target.value = ''
    }
  }

  const autoDetect = async () => {
    if (!value.frameImage) return
    setAnalyzing(true)
    try {
      const analysis = await analyzeMockupFromUrl(value.frameImage, ANALYZE_OPTS)
      applyAnalysis(analysis)
    } catch (err) {
      onChange({ analyzeError: err.message })
    } finally {
      setAnalyzing(false)
    }
  }

  /** Convert pointer delta (px) → canvas units using object-contain fit */
  const pointerToCanvasDelta = (dxPx, dyPx, rect, fit) => {
    const fitW = Math.max(1, ((Number(fit?.width) || 100) / 100) * rect.width)
    const fitH = Math.max(1, ((Number(fit?.height) || 100) / 100) * rect.height)
    return {
      dx: (dxPx / fitW) * canvasW,
      dy: (dyPx / fitH) * canvasH,
    }
  }

  const pointerToCanvasPoint = (clientX, clientY, rect, fit) => {
    const fitLeft = ((Number(fit?.left) || 0) / 100) * rect.width
    const fitTop = ((Number(fit?.top) || 0) / 100) * rect.height
    const fitW = Math.max(1, ((Number(fit?.width) || 100) / 100) * rect.width)
    const fitH = Math.max(1, ((Number(fit?.height) || 100) / 100) * rect.height)
    return {
      x: ((clientX - rect.left - fitLeft) / fitW) * canvasW,
      y: ((clientY - rect.top - fitTop) / fitH) * canvasH,
    }
  }

  const startDrag = (event, mode, boxIndex = activeBoxIndex) => {
    event.preventDefault()
    event.stopPropagation()
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return

    const box = boxes[boxIndex] || activeBox
    setActiveBoxIndex(boxIndex)

    const center = {
      x: Number(box.x) + Number(box.width) / 2,
      y: Number(box.y) + Number(box.height) / 2,
    }
    const pointer = pointerToCanvasPoint(event.clientX, event.clientY, rect, layoutFit)
    const startAngle = (Math.atan2(pointer.y - center.y, pointer.x - center.x) * 180) / Math.PI

    dragRef.current = {
      mode,
      rect,
      fit: { ...layoutFit },
      startX: event.clientX,
      startY: event.clientY,
      orig: { ...box },
      boxIndex,
      startAngle,
      origRotate: Number(box.rotate) || 0,
    }
    window.addEventListener('pointermove', onDrag)
    window.addEventListener('pointerup', stopDrag)
  }

  const onDrag = (event) => {
    const ds = dragRef.current
    if (!ds) return

    if (ds.mode === 'rotate') {
      const pointer = pointerToCanvasPoint(event.clientX, event.clientY, ds.rect, ds.fit)
      const cx = ds.orig.x + ds.orig.width / 2
      const cy = ds.orig.y + ds.orig.height / 2
      const angle = (Math.atan2(pointer.y - cy, pointer.x - cx) * 180) / Math.PI
      let next = Math.round(ds.origRotate + (angle - ds.startAngle))
      // normalize to -180..180 for nicer inputs
      next = ((next + 180) % 360) - 180
      if (next <= -180) next += 360
      patchBox(ds.boxIndex, { rotate: next })
      return
    }

    const { dx, dy } = pointerToCanvasDelta(event.clientX - ds.startX, event.clientY - ds.startY, ds.rect, ds.fit)

    if (ds.mode === 'move') {
      patchBox(ds.boxIndex, {
        x: Math.round(Math.max(0, Math.min(canvasW - ds.orig.width, ds.orig.x + dx))),
        y: Math.round(Math.max(0, Math.min(canvasH - ds.orig.height, ds.orig.y + dy))),
      })
      return
    }

    // resize from bottom-right
    patchBox(ds.boxIndex, {
      width: Math.round(Math.max(24, Math.min(canvasW - ds.orig.x, ds.orig.width + dx))),
      height: Math.round(Math.max(24, Math.min(canvasH - ds.orig.y, ds.orig.height + dy))),
    })
  }

  const stopDrag = () => {
    dragRef.current = null
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', stopDrag)
  }

  const addPhotoBox = () => {
    const inset =
      typeof defaultInsetBox === 'function'
        ? normalizeBox(defaultInsetBox(canvasW, canvasH, 0.2))
        : normalizeBox({
            x: Math.round(canvasW * 0.2),
            y: Math.round(canvasH * 0.2),
            width: Math.round(canvasW * 0.6),
            height: Math.round(canvasH * 0.6),
          })
    const next = [...boxes, inset]
    onChange({ multiSlot: true, photoBoxes: next, photoBox: next[0] })
    setActiveBoxIndex(next.length - 1)
  }

  const removePhotoBox = (index) => {
    if (boxes.length <= 1) return
    const next = boxes.filter((_, i) => i !== index)
    onChange({
      multiSlot: next.length > 1,
      photoBoxes: next.length > 1 ? next : [],
      photoBox: next[0],
    })
    setActiveBoxIndex(0)
  }

  const busy = uploading || analyzing

  return (
    <div className="admin-mockup-editor admin-mockup-editor-stacked">
      <div className="admin-mockup-preview-wrap">
        <div className="admin-mockup-preview-head">
          <span className="admin-mockup-preview-title">Mockup preview</span>
          {multiSlot && boxes.length > 1 ? (
            <span className="admin-mockup-slot-badge">{boxes.length} photo slots</span>
          ) : (
            <span className="admin-mockup-slot-badge">Single photo</span>
          )}
        </div>

        <div
          ref={previewRef}
          className="admin-mockup-preview admin-mockup-preview-large"
          style={{ aspectRatio: `${canvasW} / ${canvasH}` }}
        >
          {value.frameImage ? (
            <div
              className="admin-mockup-fit"
              style={{
                left: `${layoutFit.left}%`,
                top: `${layoutFit.top}%`,
                width: `${layoutFit.width}%`,
                height: `${layoutFit.height}%`,
              }}
            >
              <img src={value.frameImage} alt="" className="admin-mockup-frame" draggable={false} />
            </div>
          ) : (
            <div className="admin-mockup-empty">Upload a PNG/SVG collage frame to begin</div>
          )}

          {value.frameImage &&
            boxes.map((box, index) => {
              const active = index === activeBoxIndex
              return (
                <div
                  key={index}
                  className={`admin-mockup-box ${active ? 'is-active' : ''}`}
                  style={boxStyle(box)}
                  onPointerDown={(e) => startDrag(e, 'move', index)}
                >
                  <span className="admin-mockup-box-label">Slot {index + 1}</span>
                  {active ? (
                    <>
                      <button
                        type="button"
                        className="admin-mockup-rotate-handle"
                        title="Drag to rotate"
                        aria-label="Rotate slot"
                        onPointerDown={(e) => startDrag(e, 'rotate', index)}
                      />
                      <button
                        type="button"
                        className="admin-mockup-resize-handle"
                        title="Drag to resize"
                        aria-label="Resize slot"
                        onPointerDown={(e) => startDrag(e, 'resize', index)}
                      />
                    </>
                  ) : null}
                </div>
              )
            })}
        </div>

        <p className="admin-mockup-preview-tip">
          Drag slot to move · top knob to rotate · corner handle to resize
        </p>
      </div>

      <div className="admin-mockup-controls">
        <label className="btn btn-ghost admin-upload-btn">
          <FiUploadCloud />{' '}
          {busy ? 'Processing…' : value.frameImage ? 'Replace product mockup frame' : 'Upload product mockup frame (PNG/SVG)'}
          <input
            type="file"
            accept="image/png,image/svg+xml,image/webp,image/jpeg"
            hidden
            onChange={handleFrameUpload}
            disabled={busy}
          />
        </label>

        {value.frameImage && (
          <>
            <button type="button" className="btn btn-ghost" onClick={autoDetect} disabled={busy}>
              <FiCrosshair /> {analyzing ? 'Detecting slots…' : 'Auto-detect all photo slots'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onChange({ frameImage: '' })}>
              Remove mockup
            </button>
          </>
        )}

        <AdminToggle
          label="Collage / multi-photo slots"
          checked={multiSlot}
          onChange={(e) =>
            onChange({
              multiSlot: e.target.checked,
              photoBoxes: e.target.checked ? boxes : [],
              photoBox: boxes[0],
            })
          }
        />

        {multiSlot && (
          <div className="admin-mockup-slot-tabs">
            {boxes.map((_, index) => (
              <button
                key={index}
                type="button"
                className={index === activeBoxIndex ? 'is-active' : ''}
                onClick={() => setActiveBoxIndex(index)}
              >
                Slot {index + 1}
              </button>
            ))}
            <button type="button" onClick={addPhotoBox}>
              <FiPlus /> Add slot
            </button>
            {boxes.length > 1 && (
              <button type="button" onClick={() => removePhotoBox(activeBoxIndex)}>
                <FiTrash2 /> Remove slot
              </button>
            )}
          </div>
        )}

        <div className="admin-mockup-grid">
          <label>
            Canvas width
            <input
              type="number"
              min="1"
              value={value.canvasWidth}
              onChange={(e) => onChange({ canvasWidth: e.target.value })}
            />
          </label>
          <label>
            Canvas height
            <input
              type="number"
              min="1"
              value={value.canvasHeight}
              onChange={(e) => onChange({ canvasHeight: e.target.value })}
            />
          </label>
          <label>
            Photo X
            <input
              type="number"
              value={activeBox.x ?? 0}
              onChange={(e) => patchActive({ x: Number(e.target.value) })}
            />
          </label>
          <label>
            Photo Y
            <input
              type="number"
              value={activeBox.y ?? 0}
              onChange={(e) => patchActive({ y: Number(e.target.value) })}
            />
          </label>
          <label>
            Photo width
            <input
              type="number"
              value={activeBox.width ?? 0}
              onChange={(e) => patchActive({ width: Number(e.target.value) })}
            />
          </label>
          <label>
            Photo height
            <input
              type="number"
              value={activeBox.height ?? 0}
              onChange={(e) => patchActive({ height: Number(e.target.value) })}
            />
          </label>
          <label>
            Rotate (°)
            <input
              type="number"
              step="1"
              value={activeBox.rotate ?? 0}
              onChange={(e) => patchActive({ rotate: Number(e.target.value) })}
            />
          </label>
          <label>
            Corner radius
            <input
              type="number"
              min="0"
              value={activeBox.borderRadius ?? 0}
              onChange={(e) => patchActive({ borderRadius: Number(e.target.value) })}
            />
          </label>
        </div>

        <p className="admin-mockup-hint">
          Drag the orange slot to align with the frame opening. Use the top knob to rotate, corner to resize.
          {multiSlot
            ? ` ${boxes.length} slot${boxes.length === 1 ? '' : 's'} configured. Customers upload one photo per slot.`
            : ' Single photo window.'}
          {value.analyzeError ? ` Error: ${value.analyzeError}` : ''}
        </p>
      </div>
    </div>
  )
}
