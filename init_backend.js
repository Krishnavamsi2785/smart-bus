import fs from 'fs';
import path from 'path';

const baseDir = path.join(process.cwd(), 'backend');

const dirs = [
  'config',
  'controllers',
  'routes',
  'services'
];

dirs.forEach(d => fs.mkdirSync(path.join(baseDir, d), { recursive: true }));

const files = {
  'package.json': `{
  "name": "bus-ticketing-backend",
  "version": "1.0.0",
  "main": "server.js",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "pg": "^8.11.5",
    "uuid": "^9.0.1"
  }
}`,

  '.env': `PORT=5000
DB_USER=postgres
DB_HOST=localhost
DB_NAME=busticketing
DB_PASSWORD=postgres
DB_PORT=5432
`,

  'config/db.js': `import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// A helper function to initialize db changes if needed
export const initDb = async () => {
  try {
    // We add a ticket_uuid to tickets table if it doesn't exist
    await pool.query(\`
      ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_uuid VARCHAR(36) UNIQUE;
    \`);
    console.log("Database initialized check passed.");
  } catch (err) {
    console.error("DB Init Error:", err.message);
  }
};
`,

  'server.js': `import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './config/db.js';
import busRoutes from './routes/busRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import routeRoutes from './routes/routeRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize DB schema additions mapping
initDb();

// Routes
app.use('/bus', busRoutes);
app.use('/ticket', ticketRoutes);
app.use('/routes', routeRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
`,

  'routes/busRoutes.js': `import express from 'express';
import { getBusDetails } from '../controllers/busController.js';

const router = express.Router();

router.get('/:code', getBusDetails);

export default router;
`,

  'routes/ticketRoutes.js': `import express from 'express';
import { createTicket, validateTicket } from '../controllers/ticketController.js';

const router = express.Router();

router.post('/create', createTicket);
router.get('/:uuid', validateTicket);

export default router;
`,

  'routes/routeRoutes.js': `import express from 'express';
import { listRoutes } from '../controllers/routeController.js';

const router = express.Router();

router.get('/', listRoutes);

export default router;
`,

  'controllers/busController.js': `import * as busService from '../services/busService.js';

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
`,

  'services/busService.js': `import { pool } from '../config/db.js';

export const fetchBusWithRouteAndStops = async (busCode) => {
  // 1. Fetch Bus and basic Route
  const busQuery = \`
    SELECT b.bus_id, b.bus_code, b.bus_number, b.depot, b.status,
           r.route_id, r.route_name, r.start_stop, r.end_stop, r.total_distance
    FROM buses b
    JOIN bus_routes br ON b.bus_id = br.bus_id
    JOIN routes r ON br.route_id = r.route_id
    WHERE b.bus_code = $1 LIMIT 1
  \`;
  const busResult = await pool.query(busQuery, [busCode]);
  
  if (busResult.rows.length === 0) return null;
  
  const busData = busResult.rows[0];
  
  // 2. Fetch all stops for the found route
  const stopsQuery = \`
    SELECT stop_id, stop_name, stop_order, distance_from_start
    FROM stops
    WHERE route_id = $1
    ORDER BY stop_order ASC
  \`;
  const stopsResult = await pool.query(stopsQuery, [busData.route_id]);
  
  return {
    ...busData,
    stops: stopsResult.rows
  };
};
`,

  'controllers/ticketController.js': `import * as ticketService from '../services/ticketService.js';

export const createTicket = async (req, res, next) => {
  try {
    const { user_id, bus_id, route_id, from_stop_id, to_stop_id } = req.body;
    
    // minimal validation
    if (!bus_id || !route_id || !from_stop_id || !to_stop_id) {
       return res.status(400).json({ error: 'Missing required ticket parameters.' });
    }

    const ticket = await ticketService.generateTicket({
      user_id, bus_id, route_id, from_stop_id, to_stop_id
    });
    
    res.status(201).json({ message: 'Ticket Created', data: ticket });
  } catch (err) {
    next(err);
  }
};

export const validateTicket = async (req, res, next) => {
  try {
    const { uuid } = req.params;
    const validationResult = await ticketService.checkTicketValidity(uuid);
    
    if (!validationResult) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json({ data: validationResult });
  } catch (err) {
    next(err);
  }
};
`,

  'services/ticketService.js': `import { pool } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

export const generateTicket = async (ticketData) => {
  const { user_id, bus_id, route_id, from_stop_id, to_stop_id } = ticketData;

  // 1. Fetch stop orders to calculate fare
  const stopsQuery = \`
    SELECT stop_id, stop_order
    FROM stops
    WHERE stop_id = $1 OR stop_id = $2
  \`;
  const stopsResult = await pool.query(stopsQuery, [from_stop_id, to_stop_id]);
  
  if (stopsResult.rows.length !== 2) {
    throw new Error('Invalid start or end stop');
  }
  
  const stop1 = stopsResult.rows.find(s => s.stop_id === from_stop_id);
  const stop2 = stopsResult.rows.find(s => s.stop_id === to_stop_id);
  
  // Fare logic: (to_stop_order - from_stop_order) * 2
  // We use Math.abs just in case they are reversed, but generally it's positive.
  let fare = Math.abs(stop2.stop_order - stop1.stop_order) * 2;
  if (fare === 0) fare = 2; // Minimum fare
  
  // 2. Generate UUID and Times
  const ticketUuid = uuidv4();
  const issueTime = new Date();
  const expiryTime = new Date(issueTime.getTime() + 15 * 60000); // 15 mins expiry
  
  // 3. Insert into DB
  const insertQuery = \`
    INSERT INTO tickets (ticket_uuid, user_id, bus_id, route_id, from_stop_id, to_stop_id, fare, issue_time, expiry_time, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING * 
  \`;
  
  const result = await pool.query(insertQuery, [
    ticketUuid, user_id, bus_id, route_id, from_stop_id, to_stop_id, fare, issueTime, expiryTime, 'VALID'
  ]);
  
  return result.rows[0];
};

export const checkTicketValidity = async (uuid) => {
  const query = \`
    SELECT ticket_uuid, fare, issue_time, expiry_time, status
    FROM tickets
    WHERE ticket_uuid = $1
  \`;
  const result = await pool.query(query, [uuid]);
  
  if (result.rows.length === 0) return null;
  
  const ticket = result.rows[0];
  const now = new Date();
  
  // Check if expired
  let currentStatus = ticket.status;
  if (now > ticket.expiry_time) {
    currentStatus = 'EXPIRED';
    // Optional: Update DB to reflect expired state
    await pool.query('UPDATE tickets SET status = $1 WHERE ticket_uuid = $2', ['EXPIRED', uuid]);
  }
  
  return {
    ...ticket,
    current_status: currentStatus,
    is_valid: currentStatus === 'VALID'
  };
};
`,

  'controllers/routeController.js': `import * as routeService from '../services/routeService.js';

export const listRoutes = async (req, res, next) => {
  try {
    const routes = await routeService.getAllRoutes();
    res.json({ data: routes });
  } catch (err) {
    next(err);
  }
};
`,

  'services/routeService.js': `import { pool } from '../config/db.js';

export const getAllRoutes = async () => {
  const query = 'SELECT * FROM routes ORDER BY route_id ASC';
  const result = await pool.query(query);
  return result.rows;
};
`
};

for (const [filepath, content] of Object.entries(files)) {
  fs.writeFileSync(path.join(baseDir, filepath), content);
}
console.log('Backend structure generated successfully.');
