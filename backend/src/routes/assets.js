import express from 'express';
import Asset from '../models/Asset.js';
import assetPriceService from '../services/assetPriceService.js';
import axios from 'axios';
import supabase from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateUser, async (req, res) => {
  try {
    console.log('Fetching assets stocks for user:', req.user.id);

    const { data: assets, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', req.user.id)
      .gt('grams', 0)
      .order('name', { ascending: true });

    if (error) throw error;

    console.log(`Found ${assets.length} assets for user ${req.user.id}`);
    res.json(assets);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

router.post('/', authenticateUser, async (req, res) => {
  console.log('came here in routes/assets/path section ..... ');
  try {
    const { name, grams, buy_price } = req.body;
    console.log('Received request to add stock for user:', req.user.id, req.body);

    if (!name || !grams || !buy_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parsedGrams = parseFloat(grams);
    const parsedBuyPrice = parseFloat(buy_price);

    if (isNaN(parsedGrams) || parsedGrams <= 0) {
      throw new Error('Invalid number of grams');
    }

    if (isNaN(parsedBuyPrice) || parsedBuyPrice <= 0) {
      throw new Error('Invalid buy price');
    }

    const ticker = name === 'Gold' ? 'XAU' : 'XAG';
    const quote = await assetPriceService.getAssetQuote(ticker);

    const assetData = {
      name: name.trim(),
      grams: parsedGrams,
      buy_price: parsedBuyPrice,
      current_price:
        name === 'Gold'
          ? quote.rates.USDXAU / 28.34
          : quote.rates.USDXAG / 28.34,
      user_id: req.user.id,
      last_updated: new Date()
    };

    const asset = await Asset.create(assetData);
    res.status(201).json(asset);
  } catch (error) {
    console.error('Error adding stock:', error);
    res.status(400).json({ error: error.message || 'Failed to add stock' });
  }
});

export default router;
