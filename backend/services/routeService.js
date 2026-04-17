import Route from '../models/Route.js';

export const getAllRoutes = async () => {
  const routes = await Route.find().sort({ route_id: 1 }).lean();
  return routes;
};

export const createRoute = async (routeData) => {
  const latestRoute = await Route.findOne().sort({ route_id: -1 }).lean();
  const nextId = latestRoute ? latestRoute.route_id + 1 : 1;
  const route = new Route({
    route_id: nextId,
    route_name: routeData.route_name,
    start_stop: routeData.start_stop,
    end_stop: routeData.end_stop,
    total_distance: routeData.total_distance,
    stops: routeData.stops
  });
  await route.save();
  return route.toObject();
};

export const updateRoute = async (routeId, updateData) => {
  const updatedRoute = await Route.findOneAndUpdate(
    { route_id: parseInt(routeId) },
    updateData,
    { new: true }
  ).lean();
  return updatedRoute;
};

export const deleteRoute = async (routeId) => {
  const result = await Route.findOneAndDelete({ route_id: parseInt(routeId) });
  return result;
};
