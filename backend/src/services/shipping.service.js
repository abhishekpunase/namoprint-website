import { ApiError } from '../utils/apiError.js';
import { createShiprocketOrder, hasShiprocketShipment, testShiprocketConnection } from './shiprocket.service.js';
import { getShiprocketConfig } from './storeSettings.service.js';

export const isShiprocketConfigured = async () => {
  const config = await getShiprocketConfig();
  return config.enabled && Boolean(config.email && config.password);
};

export const createShipmentDraft = async ({ order }) => {
  const configured = await isShiprocketConfigured();
  if (!configured) {
    return {
      provider: 'manual',
      trackingUrl: undefined,
      lastError: 'Shiprocket credentials not configured. Add them in Admin → Integrations.',
      note: 'Shiprocket credentials not configured. Add them in Admin → Integrations.',
    };
  }

  try {
    return await createShiprocketOrder(order);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, err.message || 'Failed to create Shiprocket shipment');
  }
};

export async function applyShiprocketToOrder(order, { strict = false } = {}) {
  if (hasShiprocketShipment(order)) {
    return { ok: true, skipped: true, shipment: order.shipment };
  }

  const configured = await isShiprocketConfigured();
  if (!configured) {
    const shipment = {
      ...(order.shipment?.toObject?.() || order.shipment || {}),
      provider: 'manual',
      lastError: 'Shiprocket is not configured. Add API credentials in Admin → Integrations.',
      note: 'Shiprocket is not configured.',
    };
    order.shipment = shipment;
    if (strict) throw new ApiError(503, shipment.lastError);
    return { ok: false, shipment };
  }

  try {
    const shipment = await createShipmentDraft({ order });
    order.shipment = {
      ...(order.shipment?.toObject?.() || order.shipment || {}),
      ...shipment,
      lastError: undefined,
    };
    order.statusHistory.push({
      status: order.status,
      note: shipment.note || 'Order sent to Shiprocket for shipping.',
    });
    return { ok: true, shipment };
  } catch (err) {
    const message = err.message || 'Failed to create Shiprocket shipment';
    order.shipment = {
      ...(order.shipment?.toObject?.() || order.shipment || {}),
      provider: 'shiprocket',
      lastError: message,
      note: message,
    };
    if (strict) throw err instanceof ApiError ? err : new ApiError(502, message);
    return { ok: false, shipment: order.shipment, error: message };
  }
}

export { testShiprocketConnection };
