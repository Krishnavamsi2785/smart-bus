import Ticket from '../models/Ticket.js';
import Route from '../models/Route.js';
import Bus from '../models/Bus.js';
import { v4 as uuidv4 } from 'uuid';

export const generateTicket = async (ticketData) => {
  const { user_id, bus_id, route_id, from_stop_id, to_stop_id, fare: frontendFare } = ticketData;

  const route = await Route.findOne({ route_id: route_id }).lean();
  if (!route || !route.stops) throw new Error('Invalid route');

  // Strict coercion to ensure types match between req body and schema
  const parsedFrom = parseInt(from_stop_id);
  const parsedTo = parseInt(to_stop_id);

  const stop1 = route.stops.find(s => s.stop_id === parsedFrom);
  const stop2 = route.stops.find(s => s.stop_id === parsedTo);

  if (!stop1 || !stop2) throw new Error('Invalid start or end stop');

  let fare = frontendFare;
  if (!fare) {
    fare = Math.abs(stop2.stop_order - stop1.stop_order) * 2;
    if (fare === 0) fare = 2; // Minimum fare
  }
  
  const distance = Math.abs(parseFloat(stop2.distance_from_start) - parseFloat(stop1.distance_from_start));
  const durationMinutes = Math.max(15, Math.ceil(distance * 2)); // 2 mins per km, min 15 mins
  
  const ticketUuid = uuidv4();
  const issueTime = new Date();
  const expiryTime = new Date(issueTime.getTime() + durationMinutes * 60000);
  
  const ticket = new Ticket({
    ticket_uuid: ticketUuid,
    user_id: parseInt(user_id) || null,
    bus_id: parseInt(bus_id),
    route_id: parseInt(route_id),
    from_stop_id: parsedFrom,
    to_stop_id: parsedTo,
    fare,
    issue_time: issueTime,
    expiry_time: expiryTime,
    status: 'VALID'
  });

  await ticket.save();
  return ticket.toObject();
};

export const checkTicketValidity = async (uuid) => {
  const ticket = await Ticket.findOne({ ticket_uuid: uuid });
  if (!ticket) return null;
  
  const now = new Date();
  
  // Check if expired
  let currentStatus = ticket.status;
  if (now > ticket.expiry_time && currentStatus === 'VALID') {
    currentStatus = 'EXPIRED';
    ticket.status = 'EXPIRED';
    await ticket.save();
  }
  
  return {
    ...ticket.toObject(),
    current_status: currentStatus,
    is_valid: currentStatus === 'VALID'
  };
};

export const fetchTicketsByUser = async (userId) => {
  if (!userId) return [];
  const tickets = await Ticket.find({ user_id: parseInt(userId) })
    .sort({ issue_time: -1 })
    .lean();
    
  if (!tickets.length) return [];
  
  const busIds = [...new Set(tickets.map(t => t.bus_id))];
  const routeIds = [...new Set(tickets.map(t => t.route_id))];
  
  const buses = await Bus.find({ bus_id: { $in: busIds } }).lean();
  const routes = await Route.find({ route_id: { $in: routeIds } }).lean();
  
  const busMap = buses.reduce((acc, b) => { acc[b.bus_id] = b; return acc; }, {});
  const routeMap = routes.reduce((acc, r) => { acc[r.route_id] = r; return acc; }, {});
  
  return tickets.map(t => {
    const bus = busMap[t.bus_id];
    const route = routeMap[t.route_id];
    let fromName = t.from_stop_id;
    let toName = t.to_stop_id;
    
    if (route && route.stops) {
      const start = route.stops.find(s => s.stop_id === t.from_stop_id);
      const end = route.stops.find(s => s.stop_id === t.to_stop_id);
      if (start) fromName = start.stop_name;
      if (end) toName = end.stop_name;
    }
    
    return {
      ...t,
      bus_code: bus ? bus.bus_code : 'N/A',
      bus_type: bus ? bus.bus_type : 'STANDARD',
      from: fromName,
      to: toName
    };
  });
};

export const fetchRecentTickets = async () => {
  return await Ticket.find().sort({ issue_time: -1 }).limit(50).lean();
};

export const calculateAdminStats = async () => {
  const totalTickets = await Ticket.countDocuments();
  const result = await Ticket.aggregate([
    { $group: { _id: null, revenue: { $sum: "$fare" } } }
  ]);
  const revenue = result.length ? result[0].revenue : 0;
  return { totalTickets, revenue };
};
