import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import supabase from './config/supabase.js';
import stockRoutes from './routes/stocks.js';
import assetRoutes from './routes/assets.js';
import newsRoutes from './routes/news.js';
import stockPriceService from './services/stockPriceService.js';

dotenv.config();

const app = express();

app.use(
  cors({
    origin: [
      'https://track-portfolio.vercel.app',
      'http://localhost:5173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

app.options('*', cors());

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.json({ status: 'ok', message: 'Server is running' });
});

app.use('/api/stocks', stockRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/news', newsRoutes);

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    stockPriceService.startPeriodicUpdates();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default app;
