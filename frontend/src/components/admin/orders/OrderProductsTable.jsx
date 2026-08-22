import { useState } from 'react'
import { Download, Eye, X } from 'lucide-react'
import { formatCurrency } from '../../../utils/format'
import { CustomizationSummary } from '../../shared/CustomizationSummary'
import { TShirtPrintAssets } from '../../shared/TShirtPrintAssets'
import { isTShirtLineItem } from '../../../utils/tShirtOrderAssets'
import { getOrderItemDesignPreviewUrl } from '../../../utils/orderAdminUtils'
import { resolveMediaUrl } from '../../../utils/mediaUrl'
import { api } from '../../../services/api'

function DesignLightbox({ url, title, onClose }) {
  if (!url) return null
  return (
    <div className="ord-modal-root ord-design-lightbox" role="dialog" aria-modal="true">
      <button type="button" className="ord-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="ord-design-lightbox__panel">
        <div className="ord-design-lightbox__head">
          <strong>{title}</strong>
          <button type="button" className="ord-icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <img src={resolveMediaUrl(url)} alt={title} className="ord-design-lightbox__img" />
      </div>
    </div>
  )
}

export function OrderProductsTable({ items = [], orderId, orderNo }) {
  const [lightbox, setLightbox] = useState(null)
  const [downloadingId, setDownloadingId] = useState('')
  const [downloadError, setDownloadError] = useState('')

  const handleDownload = async (item) => {
    if (!orderId || !item?._id) return
    setDownloadError('')
    setDownloadingId(item._id)
    try {
      await api.adminDownloadOrderDesign(orderId, item._id, orderNo, item.sku)
    } catch (err) {
      setDownloadError(err.message || 'Download failed')
    } finally {
      setDownloadingId('')
    }
  }

  if (!items.length) {
    return <p className="ord-subpanel__hint">No line items.</p>
  }

  return (
    <div className="ord-products-wrap">
      {downloadError ? <div className="ord-alert ord-alert--error">{downloadError}</div> : null}
      <table className="ord-products-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>Qty</th>
            <th>Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const variant = item.variantSnapshot || {}
            const lineTotal = (item.unitPrice || 0) * (item.quantity || 0)
            const designUrl = getOrderItemDesignPreviewUrl(item)
            return (
              <tr key={item._id || `${item.sku}-${item.title}`}>
                <td>
                  <strong>{item.title}</strong>
                  <small>{item.sku}</small>
                  {isTShirtLineItem(item) ? (
                    <TShirtPrintAssets
                      item={item}
                      orderId={orderId}
                      orderNo={orderNo}
                      variant="admin"
                      className="ord-products-tshirt-assets"
                      onPreview={setLightbox}
                    />
                  ) : null}
                  <CustomizationSummary customization={item.customization} item={item} variant="admin" />
                  {!isTShirtLineItem(item) ? (
                    <div className="ord-products-design-actions">
                      <button
                        type="button"
                        className="ord-btn ord-btn--ghost ord-btn--view-design"
                        disabled={!designUrl}
                        onClick={() => setLightbox({ url: designUrl, title: item.title })}
                      >
                        <Eye size={15} /> View
                      </button>
                      <button
                        type="button"
                        className="ord-btn ord-btn--primary"
                        disabled={!item._id || !orderId || downloadingId === item._id}
                        onClick={() => handleDownload(item)}
                      >
                        <Download size={15} />
                        {downloadingId === item._id ? 'Preparing…' : 'Download print file (320 DPI)'}
                      </button>
                    </div>
                  ) : null}
                  {item.productionFileUrl && (
                    <a href={item.productionFileUrl} target="_blank" rel="noreferrer" className="ord-production-link">
                      Production file
                    </a>
                  )}
                </td>
                <td>
                  {[variant.label, variant.size, variant.material, variant.frameType, item.customization?.qualityLabel]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.unitPrice || 0)}</td>
                <td>{formatCurrency(lineTotal)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {lightbox ? (
        <DesignLightbox url={lightbox.url} title={lightbox.title} onClose={() => setLightbox(null)} />
      ) : null}
    </div>
  )
}
