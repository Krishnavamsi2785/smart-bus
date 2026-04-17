import * as busService from '../services/busService.js';

export const getBusDetails = async (req, res, next) => {
  try {
    const { code } = req.params;
    const busDetails = await busService.fetchBusWithRouteAndStops(code);
    
    if (!busDetails) {
      return res.status(404).json({ error: 'Bus not found or no active route assigned' });
    }
    
    res.json({ data: busDetails });
  } catch (err) {
    next(err);
  }
};

export const searchBuses = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: 'Source and destination are required' });
    }
    const buses = await busService.searchBusesByStops(from, to);
    res.json({ data: buses });
  } catch (err) {
    next(err);
  }
};

export const createBus = async (req, res, next) => {
  try {
    const bus = await busService.createBus(req.body);
    res.status(201).json({ data: bus });
  } catch (err) {
    next(err);
  }
};

export const listBuses = async (req, res, next) => {
  try {
    const buses = await busService.getAllBuses();
    res.json({ data: buses });
  } catch (err) {
    next(err);
  }
};

export const updateBusData = async (req, res, next) => {
  try {
    const { code } = req.params;
    const bus = await busService.updateBus(code, req.body);
    if (!bus) return res.status(404).json({ error: 'Bus not found' });
    res.json({ data: bus });
  } catch (err) {
    next(err);
  }
};

export const removeBus = async (req, res, next) => {
  try {
    const { code } = req.params;
    const result = await busService.deleteBus(code);
    if (!result) return res.status(404).json({ error: 'Bus not found' });
    res.json({ message: 'Bus successfully deleted' });
  } catch (err) {
    next(err);
  }
};
