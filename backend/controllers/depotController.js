import Depot from '../models/Depot.js';

export const listDepots = async (req, res, next) => {
  try {
    const depots = await Depot.find().lean();
    res.json({ data: depots });
  } catch (err) {
    next(err);
  }
};

export const createDepot = async (req, res, next) => {
  try {
    const { depot_id, name } = req.body;
    if (!depot_id || !name) return res.status(400).json({ error: 'Missing required depot parameters' });
    
    // allow creation if exists just return it, else create
    let depot = await Depot.findOne({ depot_id });
    if (!depot) {
      depot = new Depot({ depot_id: depot_id.toUpperCase().trim(), name });
      await depot.save();
    }
    res.status(201).json({ data: depot });
  } catch (err) {
    next(err);
  }
};
