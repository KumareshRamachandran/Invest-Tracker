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

const corsOptions = {
  origin: [
    'https://track-portfolio.vercel.app',
    'https://invest-tracker-pi.vercel.app',
    'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Apply CORS
app.use(cors(corsOptions));

// Handle preflight with SAME options
app.options('*', cors(corsOptions));

app.use(express.json());

// Health check (NO manual CORS needed)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running'
  });
});

// Routes
app.use('/api/stocks', stockRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/news', newsRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
