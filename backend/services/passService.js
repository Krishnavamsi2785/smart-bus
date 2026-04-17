import Pass from '../models/Pass.js';
import Route from '../models/Route.js';
import { v4 as uuidv4 } from 'uuid';

export const calculatePassPrice = async (route_id, from_stop_id, to_stop_id, pass_type, duration_months) => {
  const route = await Route.findOne({ route_id: parseInt(route_id) }).lean();
  if (!route || !route.stops) throw new Error('Invalid route parameter map.');

  const parsedFrom = parseInt(from_stop_id);
  const parsedTo = parseInt(to_stop_id);
  const stop1 = route.stops.find(s => s.stop_id === parsedFrom);
  const stop2 = route.stops.find(s => s.stop_id === parsedTo);

  if (!stop1 || !stop2) throw new Error('Invalid stop nodes provided.');

  // Use stop_order as distance fallback if distance_from_start is missing/zero
  let dist1 = parseFloat(stop1.distance_from_start) || (stop1.stop_order - 1) * 3;
  let dist2 = parseFloat(stop2.distance_from_start) || (stop2.stop_order - 1) * 3;

  let distance = Math.abs(dist2 - dist1);
  if (distance < 5) distance = 5; // Minimum 5km buffer

  // Math: distance * Base Rate * 2 ways * 30 days * months * discount multiplier
  let price = 0;
  if (pass_type === 'SILVER') {
    price = distance * 0.60 * 2 * 30 * duration_months * 0.45;
  } else if (pass_type === 'GOLD') {
    price = distance * 1.00 * 2 * 30 * duration_months * 0.55;
  } else if (pass_type === 'PLATINUM') {
    price = distance * 1.00 * 2 * 30 * duration_months * 0.65;
  }

  return { price: Math.ceil(price), distance: Math.round(distance) };
};

export const applyForPass = async (payload) => {
  const { user_id, pass_type, duration, depot_id, route_id, from_stop_id, to_stop_id, applicant_details, documents } = payload;
  
  // Mathematically calculate pricing before construction
  const { price } = await calculatePassPrice(route_id, from_stop_id, to_stop_id, pass_type, duration);
  
  const passId = `PASS-${uuidv4().substring(0,8).toUpperCase()}`;

  // Platinum doesn't require Depot verification loop. It instantly moves to Payment Phase (APPROVED)
  const initialStatus = pass_type === 'PLATINUM' ? 'APPROVED' : 'PENDING';

  const route = await Route.findOne({ route_id: parseInt(route_id) }).lean();
  const from_stop = route.stops.find(s => s.stop_id === parseInt(from_stop_id))?.stop_name || 'Start';
  const to_stop = route.stops.find(s => s.stop_id === parseInt(to_stop_id))?.stop_name || 'End';

  const newPass = new Pass({
    pass_id: passId,
    user_id,
    pass_type,
    status: initialStatus,
    duration,
    price,
    depot_id,
    route_id,
    from_stop,
    to_stop,
    applicant_details,
    documents
  });

  await newPass.save();
  return newPass.toObject();
};

export const getUserPass = async (user_id) => {
  return await Pass.findOne({ user_id: user_id }).sort({ createdAt: -1 }).lean();
};

export const getDepotApplications = async (depot_id) => {
  return await Pass.find({ depot_id, status: { $in: ['PENDING', 'PENDING_RENEWAL'] } }).sort({ createdAt: -1 }).lean();
};

export const acceptPass = async (pass_id) => {
  const pass = await Pass.findOne({ pass_id });
  if (!pass) throw new Error('Pass object not found');
  
  pass.status = 'APPROVED';
  await pass.save();
  return pass;
};

export const executePayment = async (pass_id, payment_id) => {
  const pass = await Pass.findOne({ pass_id });
  if (!pass) throw new Error('Pass object not found');

  pass.status = 'ACTIVE';
  const validFrom = new Date();
  const validUntil = new Date();
  validUntil.setMonth(validUntil.getMonth() + pass.duration);
  pass.valid_from = validFrom;
  pass.valid_until = validUntil;
  if (payment_id) pass.payment_id = payment_id;
  
  await pass.save();
  return pass;
};

export const requestRenewal = async (pass_id) => {
  const pass = await Pass.findOne({ pass_id });
  if (!pass) throw new Error('Pass object not found');
  
  if (pass.pass_type === 'PLATINUM') {
    pass.status = 'APPROVED';
  } else {
    pass.status = 'PENDING_RENEWAL';
  }
  
  await pass.save();
  return pass;
};

export const deletePass = async (pass_id) => {
  const result = await Pass.deleteOne({ pass_id });
  if (result.deletedCount === 0) throw new Error('Pass not found');
  return { deleted: true };
};

export const getApprovedDepotPasses = async (depot_id) => {
  return await Pass.find({ depot_id, status: { $in: ['APPROVED', 'ACTIVE'] } }).sort({ createdAt: -1 }).lean();
};

export const getPassRevenueSummary = async (depot_id) => {
  const query = depot_id ? { status: 'ACTIVE', depot_id } : { status: 'ACTIVE' };
  const passes = await Pass.find(query).lean();
  const total = passes.reduce((sum, p) => sum + (p.price || 0), 0);
  return { total, count: passes.length, passes };
};
