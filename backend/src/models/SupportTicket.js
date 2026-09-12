import mongoose from 'mongoose';

export const SUPPORT_ISSUE_TYPES = [
  'Order Issue',
  'Delivery Issue',
  'Product Damaged',
  'Wrong Product Received',
  'Missing Product',
  'Payment Issue',
  'Refund Issue',
  'Return / Replacement',
  'Product Question',
  'Other',
];

export const SUPPORT_STATUSES = [
  'Open',
  'Under Review',
  'In Progress',
  'Waiting for Customer',
  'Resolved',
  'Closed',
];

const messageSchema = new mongoose.Schema(
  {
    sender: { type: String, enum: ['customer', 'support'], required: true },
    name: { type: String, trim: true, default: '' },
    message: { type: String, required: true, trim: true },
    attachments: { type: [String], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true, index: true, trim: true, uppercase: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    phone: { type: String, required: true, trim: true },
    orderNo: { type: String, trim: true, default: '' },
    issueType: { type: String, enum: SUPPORT_ISSUE_TYPES, required: true },
    subject: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    attachments: { type: [String], default: [] },
    status: { type: String, enum: SUPPORT_STATUSES, default: 'Open', index: true },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true },
);

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ email: 1, createdAt: -1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
