import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDb } from './config/db.js';
import busRoutes from './routes/busRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import routeRoutes from './routes/routeRoutes.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

import { startExpiryRefundWorker } from './services/cronService.js';

dotenv.config();

// Connect to MongoDB
initDb();

const app = express();
app.use(cors());
app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Initialize Automatic Expiry & Refund Monitor
startExpiryRefundWorker();
console.log('--- Automatic Refund Monitor Started ---');

app.use('/auth', authRoutes);
app.use('/payment', paymentRoutes);
app.use('/bus', busRoutes);
app.use('/ticket', ticketRoutes);
app.use('/routes', routeRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});
app.get("/", (req, res) => {
  res.send("Backend working 🚍🔥");
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
