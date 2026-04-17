import * as routeService from '../services/routeService.js';

export const listRoutes = async (req, res, next) => {
  try {
    const routes = await routeService.getAllRoutes();
    res.json({ data: routes });
  } catch (err) {
    next(err);
  }
};

export const createRoute = async (req, res, next) => {
  try {
    const route = await routeService.createRoute(req.body);
    res.status(201).json({ data: route });
  } catch (err) {
    next(err);
  }
};

export const updateRouteData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const route = await routeService.updateRoute(id, req.body);
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json({ data: route });
  } catch (err) {
    next(err);
  }
};

export const removeRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await routeService.deleteRoute(id);
    if (!result) return res.status(404).json({ error: 'Route not found' });
    res.json({ message: 'Route successfully deleted' });
  } catch (err) {
    next(err);
  }
};
