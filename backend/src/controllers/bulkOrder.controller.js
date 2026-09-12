import { BulkOrderInquiry } from '../models/BulkOrderInquiry.js';
import { sendBulkOrderEmail } from '../services/mail.service.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const submitBulkOrderInquiry = asyncHandler(async (req, res) => {
  const inquiry = await BulkOrderInquiry.create({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    company: req.body.company || '',
    productInterest: req.body.productInterest || '',
    quantity: req.body.quantity || '',
    message: req.body.message || '',
  });

  try {
    await sendBulkOrderEmail(inquiry.toObject());
  } catch (error) {
    console.warn('[bulk-order] email notify failed:', error.message);
  }

  res.status(201).json({
    success: true,
    message: 'Thanks! We received your bulk order request and will contact you soon.',
    inquiryId: inquiry._id,
  });
});

export const listAdminBulkOrders = asyncHandler(async (req, res) => {
  const status = String(req.query.status || '').trim();
  const filter = {};
  if (['new', 'contacted', 'quoted', 'closed'].includes(status)) {
    filter.status = status;
  }

  const inquiries = await BulkOrderInquiry.find(filter).sort('-createdAt').lean();
  res.json({ success: true, inquiries });
});

export const updateAdminBulkOrder = asyncHandler(async (req, res) => {
  const inquiry = await BulkOrderInquiry.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!inquiry) throw new ApiError(404, 'Bulk order inquiry not found');
  res.json({ success: true, inquiry });
});

export const deleteAdminBulkOrder = asyncHandler(async (req, res) => {
  const inquiry = await BulkOrderInquiry.findByIdAndDelete(req.params.id);
  if (!inquiry) throw new ApiError(404, 'Bulk order inquiry not found');
  res.json({ success: true, message: 'Inquiry deleted.' });
});
