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
