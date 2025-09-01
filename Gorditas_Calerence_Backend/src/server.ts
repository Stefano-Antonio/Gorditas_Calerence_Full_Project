import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import mongoose from 'mongoose';
import Usuario from '../src/models/Usuario';

// Routes
import authRoutes from './routes/auth';
import ordenesRoutes from './routes/ordenes';
import inventarioRoutes from './routes/inventario';
import reportesRoutes from './routes/reportes';
import catalogosRoutes from './routes/catalogos';
import Mesa from '../src/models/Mesa'; // Ajusta la ruta si es necesario
import Orden from '../src/models/Orden'; // Ajusta la ruta si es necesario
dotenv.config();





const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/inventario', inventarioRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/catalogos', catalogosRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  console.log(`API documentation available at http://localhost:${PORT}/api/auth`);
});

export default app;