import Bus from '../models/Bus.js';
import Route from '../models/Route.js';

export const fetchBusWithRouteAndStops = async (busCode) => {
  const bus = await Bus.findOne({ bus_code: busCode.toUpperCase() }).lean();
  if (!bus) return null;

  let route = null;
  if (bus.assigned_routes && bus.assigned_routes.length > 0) {
    route = await Route.findOne({ route_id: bus.assigned_routes[0] }).lean();
  }

  if (!route) {
      return {
          bus_id: bus.bus_id,
          bus_code: bus.bus_code,
          bus_number: bus.bus_number,
          depot: bus.depot,
          status: bus.status,
          stops: []
      };
  }

  return {
    bus_id: bus.bus_id,
    bus_code: bus.bus_code,
    bus_number: bus.bus_number,
    bus_type: bus.bus_type,
    depot_id: bus.depot_id,
    depot_name: bus.depot_name,
    status: bus.status,
    route_id: route.route_id,
    route_name: route.route_name,
    start_stop: route.start_stop,
    end_stop: route.end_stop,
    total_distance: route.total_distance,
    stops: route.stops ? route.stops.sort((a, b) => a.stop_order - b.stop_order) : []
  };
};

export const searchBusesByStops = async (from, to) => {
  const routes = await Route.find({ 
    'stops.stop_name': new RegExp(`^${from}$`, 'i') 
  }).lean();

  const validRoutes = routes.filter(r => {
    const fromStop = r.stops.find(s => s.stop_name.toLowerCase() === from.toLowerCase());
    const toStop = r.stops.find(s => s.stop_name.toLowerCase() === to.toLowerCase());
    return fromStop && toStop && fromStop.stop_order < toStop.stop_order;
  });

  const validRouteIds = validRoutes.map(r => r.route_id);

  if (validRouteIds.length === 0) return [];
  const buses = await Bus.find({ assigned_routes: { $in: validRouteIds } }).lean();

  return buses.map(bus => {
      const matchRoute = validRoutes.find(r => bus.assigned_routes.includes(r.route_id));
      return {
          ...bus,
          route_id: matchRoute.route_id,
          route_name: matchRoute.route_name,
          start_stop: matchRoute.start_stop,
          end_stop: matchRoute.end_stop,
          stops: matchRoute.stops
      };
  });
};

export const createBus = async (busData) => {
  const latestBus = await Bus.findOne().sort({ bus_id: -1 }).lean();
  const nextId = latestBus ? latestBus.bus_id + 1 : 1;
  const bus = new Bus({
    bus_id: nextId,
    bus_code: busData.bus_code.toUpperCase(),
    bus_number: busData.bus_number,
    bus_type: busData.bus_type,
    depot_id: busData.depot_id || 'DP01',
    depot_name: busData.depot_name || 'Central Depot',
    status: 'ACTIVE',
    assigned_routes: busData.route_id ? [parseInt(busData.route_id)] : []
  });
  await bus.save();
  return bus.toObject();
};

export const getAllBuses = async () => {
  return await Bus.find().sort({ bus_id: 1 }).lean();
};

export const updateBus = async (busCode, updateData) => {
  // Map correct depot structures
  const fields = { ...updateData };
  if (fields.route_id) {
    fields.assigned_routes = [parseInt(fields.route_id)];
  }
  
  const updatedBus = await Bus.findOneAndUpdate(
    { bus_code: busCode.toUpperCase() }, 
    fields, 
    { new: true }
  ).lean();
  return updatedBus;
};

export const deleteBus = async (busCode) => {
  const result = await Bus.findOneAndDelete({ bus_code: busCode.toUpperCase() });
  return result;
};
