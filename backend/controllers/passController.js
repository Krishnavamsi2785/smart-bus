import * as passService from '../services/passService.js';

export const previewPrice = async (req, res, next) => {
  try {
    const { route_id, from_stop_id, to_stop_id, pass_type, duration } = req.query;
    if (!route_id || !from_stop_id || !to_stop_id || !pass_type || !duration) {
      return res.json({ data: null }); // Not enough params yet
    }
    const result = await passService.calculatePassPrice(route_id, from_stop_id, to_stop_id, pass_type, parseInt(duration));
    res.json({ data: result });
  } catch (err) {
    res.json({ data: null, error: err.message });
  }
};

export const applyPass = async (req, res, next) => {
  try {
    const payload = req.body;
    const pass = await passService.applyForPass(payload);
    res.status(201).json({ message: 'Pass Application Triggered', data: pass });
  } catch (err) {
    next(err);
  }
};

export const fetchUserPass = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const pass = await passService.getUserPass(userId);
    res.json({ data: pass });
  } catch (err) {
    next(err);
  }
};

export const fetchDepotPasses = async (req, res, next) => {
  try {
    const { depotId } = req.params;
    const passes = await passService.getDepotApplications(depotId);
    res.json({ data: passes });
  } catch (err) {
    next(err);
  }
};

export const approvePass = async (req, res, next) => {
  try {
    const { pass_id } = req.body;
    const pass = await passService.acceptPass(pass_id);
    res.json({ message: 'Pass Approved', data: pass });
  } catch (err) {
    next(err);
  }
};

export const payPass = async (req, res, next) => {
  try {
    const { pass_id, payment_id } = req.body;
    const pass = await passService.executePayment(pass_id, payment_id);
    res.json({ message: 'Payment Secure, Pass Activated', data: pass });
  } catch (err) {
    next(err);
  }
};

export const renewPass = async (req, res, next) => {
  try {
    const { pass_id } = req.body;
    const pass = await passService.requestRenewal(pass_id);
    res.json({ message: 'Renewal Protocol Initialized', data: pass });
  } catch (err) {
    next(err);
  }
};

export const deletePassRecord = async (req, res, next) => {
  try {
    const { pass_id } = req.params;
    const result = await passService.deletePass(pass_id);
    res.json({ message: 'Pass deleted', data: result });
  } catch (err) {
    next(err);
  }
};

export const fetchApprovedDepotPasses = async (req, res, next) => {
  try {
    const { depotId } = req.params;
    const passes = await passService.getApprovedDepotPasses(depotId);
    res.json({ data: passes });
  } catch (err) {
    next(err);
  }
};

export const fetchPassRevenue = async (req, res, next) => {
  try {
    const { depot_id } = req.query;
    const result = await passService.getPassRevenueSummary(depot_id || null);
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
};
