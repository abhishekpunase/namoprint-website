import {
  getCustomizationPreviewUrl,
  getCustomizationSummaryLines,
  getCustomizationSummaryText,
} from '../../utils/customizationDisplay'
import { resolveMediaUrl } from '../../utils/mediaUrl'
import { PreviewFrame } from '../product/PreviewFrame'

export function CustomizationPreview({ item, previewUrl, className = '' }) {
  const customization = item?.customization || {}
  const product = item?.product && typeof item.product === 'object' ? item.product : null
  const sourcePhotoUrl = customization.photoUrl
  const photoCount = Math.max(customization.slotPhotos?.length || 0, customization.photos?.length || 0)
  const hasUploadedPhoto = Boolean(
    sourcePhotoUrl && photoCount === 1,
  )
  const hasMockup = Boolean(
    product?.mockup?.frameImage || product?.mockup?.photoBox || product?.mockup?.photoBoxes?.length,
  )
  const variant =
    product?.variants?.find((entry) => String(entry._id) === String(item?.variantId)) ||
    item?.variantSnapshot
  const canvas = product?.mockup?.canvas || { width: 1, height: 1 }
  const aspectRatio = Number(canvas.width) / Number(canvas.height) || 1
  const frameWidth = Math.min(100, 100 * aspectRatio)
  const frameHeight = Math.min(100, 100 / aspectRatio)

  if (hasUploadedPhoto && hasMockup) {
    return (
      <div className={`flex h-full w-full items-center justify-center overflow-hidden ${className}`.trim()}>
        <div
          className="relative flex max-h-full max-w-full items-center justify-center"
          style={{ width: `${frameWidth}%`, height: `${frameHeight}%` }}
        >
          <PreviewFrame
            product={product}
            variant={variant}
            photoUrl={sourcePhotoUrl}
            crop={customization.slotPhotos?.[0]?.crop || customization.photos?.[0]?.crop}
            text={customization.text || {}}
            options={customization.options || {}}
            compact
            minimal
          />
        </div>
      </div>
    )
  }

  if (!previewUrl) return null
  return (
    <img
      src={resolveMediaUrl(previewUrl)}
      alt="Customer design preview"
      className={`h-full w-full object-contain ${className}`.trim()}
    />
  )
}

export function CustomizationSummary({
  customization,
  item,
  variant = 'store',
  showPreview = true,
  showTitle = true,
  compact = false,
  className = '',
}) {
  const lines = getCustomizationSummaryLines(customization)
  const previewUrl = getCustomizationPreviewUrl(item || { customization })
  const summaryText = getCustomizationSummaryText(customization)
  const hasCustomization = customization && typeof customization === 'object' && Object.keys(customization).length > 0

  if (!lines.length && !previewUrl) {
    if (!hasCustomization) return null
    if (compact) {
      return (
        <p className={`customization-summary customization-summary--compact ${className}`.trim()}>
          Custom design saved with this item.
        </p>
      )
    }
    return null
  }

  const isAdmin = variant === 'admin'
  const isChips = variant === 'chips'

  if (isChips && lines.length) {
    return (
      <ul className={`flex flex-wrap gap-1.5 ${className}`.trim()}>
        {lines.map(({ label, value }) => (
          <li
            key={`${label}-${value}`}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
            title={`${label}: ${value}`}
          >
            <span className="shrink-0 font-medium text-slate-500">{label}:</span>
            <span className="truncate">{value}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (compact) {
    return (
      <p className={`customization-summary customization-summary--compact ${className}`.trim()}>
        {summaryText || 'Custom design saved with this item.'}
      </p>
    )
  }

  return (
    <div
      className={`customization-summary ${isAdmin ? 'ord-customization' : 'customization-summary--store'} ${className}`.trim()}
    >
      {showTitle ? <strong>{isAdmin ? 'Customization' : 'Your design'}</strong> : null}
      {showPreview && previewUrl ? (
        <div className={isAdmin ? 'ord-customization__preview' : 'customization-summary__preview'}>
          <CustomizationPreview item={item || { customization }} previewUrl={previewUrl} />
        </div>
      ) : null}
      {lines.length ? (
        <dl className={isAdmin ? 'ord-customization__list' : 'customization-summary__list'}>
          {lines.map(({ label, value }) => (
            <div
              key={`${label}-${value}`}
              className={isAdmin ? 'ord-customization__row' : 'customization-summary__row'}
            >
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}
