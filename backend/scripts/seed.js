import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Bus from '../models/Bus.js';
import Route from '../models/Route.js';
import User from '../models/User.js';
import Ticket from '../models/Ticket.js';

dotenv.config();

const routesData = [
  {
    route_id: 1, route_name: 'Visakhapatnam - Vijayawada', start_stop: 'Visakhapatnam', end_stop: 'Vijayawada', total_distance: 350.0,
    stops: [
      { stop_id: 1, stop_name: 'Visakhapatnam', stop_order: 1, distance_from_start: 0.0 },
      { stop_id: 2, stop_name: 'Anakapalle', stop_order: 2, distance_from_start: 35.0 },
      { stop_id: 3, stop_name: 'Tuni', stop_order: 3, distance_from_start: 70.0 },
      { stop_id: 4, stop_name: 'Annavaram', stop_order: 4, distance_from_start: 105.0 },
      { stop_id: 5, stop_name: 'Rajahmundry', stop_order: 6, distance_from_start: 175.0 },
      { stop_id: 6, stop_name: 'Vijayawada', stop_order: 11, distance_from_start: 350.0 }
    ]
  },
  {
    route_id: 2, route_name: 'Vijayawada - Tirupati', start_stop: 'Vijayawada', end_stop: 'Tirupati', total_distance: 415.0,
    stops: [
      { stop_id: 11, stop_name: 'Vijayawada', stop_order: 1, distance_from_start: 0.0 },
      { stop_id: 12, stop_name: 'Guntur', stop_order: 3, distance_from_start: 83.0 },
      { stop_id: 13, stop_name: 'Ongole', stop_order: 5, distance_from_start: 166.0 },
      { stop_id: 14, stop_name: 'Nellore', stop_order: 7, distance_from_start: 249.0 },
      { stop_id: 15, stop_name: 'Tirupati', stop_order: 11, distance_from_start: 415.0 }
    ]
  }
];

const busesData = [
  { bus_id: 1, bus_code: 'B001', bus_number: 'AP26 Z 5468', depot: 'Vijayawada Depot', bus_type: 'PALLE VELUGU', assigned_routes: [1] },
  { bus_id: 2, bus_code: 'B002', bus_number: 'AP31 Z 6902', depot: 'Nellore Depot', bus_type: 'ULTRA PALLE VELUGU', assigned_routes: [2] },
  { bus_id: 3, bus_code: 'B003', bus_number: 'AP37 Z 6745', depot: 'Nellore Depot', bus_type: 'EXPRESS', assigned_routes: [2] },
  { bus_id: 4, bus_code: 'B004', bus_number: 'AP27 Z 1918', depot: 'Kurnool Depot', bus_type: 'METRO', assigned_routes: [1] },
  { bus_id: 5, bus_code: 'B005', bus_number: 'AP33 Z 9934', depot: 'Vijayawada Depot', bus_type: 'DELUXE', assigned_routes: [1, 2] }
];

const usersData = [
  { user_id: 1, name: 'Guest Passenger', phone: '0000000000', role: 'GUEST' }
];

const seedDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected. Clearing existing data...');
    
    await Route.deleteMany({});
    await Bus.deleteMany({});
    await User.deleteMany({});
    await Ticket.deleteMany({});

    console.log('Inserting seed data...');
    
    await Route.insertMany(routesData);
    await Bus.insertMany(busesData);
    await User.insertMany(usersData);
    
    console.log('Database Seeding Completed!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seedDB();
