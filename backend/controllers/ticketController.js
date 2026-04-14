import * as ticketService from '../services/ticketService.js';

export const createTicket = async (req, res, next) => {
  try {
    const { user_id, bus_id, route_id, from_stop_id, to_stop_id, payment_id, fare } = req.body;
    
    // minimal validation
    if (!bus_id || !route_id || !from_stop_id || !to_stop_id || !payment_id) {
       return res.status(400).json({ error: 'Missing required ticket or payment parameters.' });
    }

    const ticket = await ticketService.generateTicket({
      user_id, bus_id, route_id, from_stop_id, to_stop_id, payment_id, fare
    });
    
    res.status(201).json({ message: 'Ticket Created', data: ticket });
  } catch (err) {
    next(err);
  }
};

export const validateTicket = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const validationResult = await ticketService.checkTicketValidity(uuid);
    
    if (!validationResult) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ data: validationResult });
  } catch (err) {
    next(err);
  }
};

export const getUserTickets = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const tickets = await ticketService.fetchTicketsByUser(userId);
    res.json({ data: tickets });
  } catch (err) {
    next(err);
  }
};

export const getRecentTickets = async (req, res, next) => {
  try {
    const tickets = await ticketService.fetchRecentTickets();
    res.json({ data: tickets });
  } catch (err) {
    next(err);
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    const stats = await ticketService.calculateAdminStats();
    res.json({ data: stats });
  } catch (err) {
    next(err);
  }
};
