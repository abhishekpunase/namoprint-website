import { SupportTicket } from '../models/SupportTicket.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function normalizeTicketId(value = '') {
  return String(value || '').trim().toUpperCase().replace(/^#/, '');
}

async function nextTicketId() {
  const last = await SupportTicket.findOne().sort({ createdAt: -1 }).select('ticketId').lean();
  const raw = last?.ticketId ? Number(String(last.ticketId).replace(/\D/g, '')) : 10240;
  const next = (Number.isFinite(raw) ? raw : 10240) + 1;
  return `NP-${String(next).padStart(5, '0')}`;
}

function canAccessTicket(ticket, user, email) {
  if (user?.role === 'admin') return true;
  if (user?._id && ticket.user && String(ticket.user) === String(user._id)) return true;
  if (email && String(ticket.email).toLowerCase() === String(email).toLowerCase()) return true;
  return false;
}

export const createSupportTicket = asyncHandler(async (req, res) => {
  const ticketId = await nextTicketId();
  const attachments = Array.isArray(req.body.attachments) ? req.body.attachments.filter(Boolean) : [];

  const ticket = await SupportTicket.create({
    ticketId,
    user: req.user?._id,
    customerName: req.body.customerName,
    email: req.body.email,
    phone: req.body.phone,
    orderNo: req.body.orderNo || '',
    issueType: req.body.issueType,
    subject: req.body.subject,
    description: req.body.description,
    attachments,
    status: 'Open',
    messages: [
      {
        sender: 'customer',
        name: req.body.customerName,
        message: req.body.description,
        attachments,
      },
    ],
  });

  res.status(201).json({ success: true, ticket });
});

export const listMySupportTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({
    $or: [{ user: req.user._id }, { email: req.user.email }],
  })
    .sort('-updatedAt')
    .lean();

  res.json({ success: true, tickets });
});

export const trackSupportTicket = asyncHandler(async (req, res) => {
  const ticketId = normalizeTicketId(req.params.ticketId);
  const ticket = await SupportTicket.findOne({ ticketId }).lean();
  if (!ticket) throw new ApiError(404, 'Ticket not found. Check the Ticket ID and try again.');
  res.json({ success: true, ticket });
});

export const getSupportTicket = asyncHandler(async (req, res) => {
  const key = normalizeTicketId(req.params.id);
  const ticket = key.startsWith('NP-')
    ? await SupportTicket.findOne({ ticketId: key })
    : await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  const publicLookup = key.startsWith('NP-')
  if (!publicLookup && !canAccessTicket(ticket, req.user, req.query.email)) {
    throw new ApiError(403, 'You do not have access to this ticket')
  }

  res.json({ success: true, ticket });
});

export const replySupportTicket = asyncHandler(async (req, res) => {
  const key = normalizeTicketId(req.params.id);
  const ticket = key.startsWith('NP-')
    ? await SupportTicket.findOne({ ticketId: key })
    : await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  const email = req.body.email || req.user?.email;
  if (!canAccessTicket(ticket, req.user, email)) {
    throw new ApiError(403, 'You do not have access to this ticket');
  }
  if (ticket.status === 'Closed') {
    throw new ApiError(400, 'This ticket is closed and cannot accept new replies.');
  }

  ticket.messages.push({
    sender: 'customer',
    name: req.user?.name || ticket.customerName,
    message: req.body.message,
    attachments: Array.isArray(req.body.attachments) ? req.body.attachments.filter(Boolean) : [],
  });

  if (ticket.status === 'Waiting for Customer' || ticket.status === 'Resolved') {
    ticket.status = 'In Progress';
  }

  await ticket.save();
  res.json({ success: true, ticket });
});

export const listAdminSupportTickets = asyncHandler(async (req, res) => {
  const status = String(req.query.status || '').trim();
  const filter = {};
  if (status && status !== 'all') filter.status = status;

  const tickets = await SupportTicket.find(filter).sort('-updatedAt').lean();
  res.json({ success: true, tickets });
});

export const updateAdminSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true },
  );
  if (!ticket) throw new ApiError(404, 'Ticket not found');
  res.json({ success: true, ticket });
});

export const replyAdminSupportTicket = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Ticket not found');

  ticket.messages.push({
    sender: 'support',
    name: req.user?.name || 'Namo Print Support',
    message: req.body.message,
    attachments: Array.isArray(req.body.attachments) ? req.body.attachments.filter(Boolean) : [],
  });

  if (['Open', 'Under Review'].includes(ticket.status)) {
    ticket.status = 'In Progress';
  }

  await ticket.save();
  res.json({ success: true, ticket });
});
