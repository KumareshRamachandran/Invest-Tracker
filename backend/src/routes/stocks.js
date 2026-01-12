import express from 'express';
import Stock from '../models/Stock.js';
import stockPriceService from '../services/stockPriceService.js';
import axios from 'axios';
import supabase from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.get('/test-finnhub/:ticker', async (req, res) => {
  try {
    const { ticker } = req.params;

    const response = await axios.get('https://finnhub.io/api/v1/quote', {
      params: {
        symbol: ticker,
        token: process.env.FINNHUB_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Finnhub test failed',
      details: error.response?.data || error.message,
      apiKey: process.env.FINNHUB_API_KEY ? 'Present' : 'Missing'
    });
  }
});

router.get('/test-search/:query', async (req, res) => {
  try {
    const { query } = req.params;

    const response = await axios.get('https://finnhub.io/api/v1/search', {
      params: {
        q: query,
        token: process.env.FINNHUB_API_KEY
      }
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Finnhub search test failed',
      details: error.response?.data || error.message,
      apiKey: process.env.FINNHUB_API_KEY ? 'Present' : 'Missing'
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ result: [] });
    }

    const response = await axios.get(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(q)}&token=${process.env.FINNHUB_API_KEY}`
    );

    if (!response.data?.result) {
      return res.json({ result: [] });
    }

    let filteredResults = response.data.result.filter(
      stock =>
        stock.symbol &&
        stock.description &&
        ['NASDAQ', 'NYSE', 'BATS', 'ARCA'].includes(stock.primaryExchange)
    );

    if (filteredResults.length === 0) {
      filteredResults = response.data.result.filter(
        stock => stock.symbol && stock.description && stock.type === 'Common Stock'
      );
    }

    if (filteredResults.length === 0) {
      filteredResults = response.data.result.filter(
        stock => stock.symbol && stock.description
      );
    }

    res.json({ result: filteredResults.slice(0, 10) });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to search stocks',
      details: error.response?.data || error.message
    });
  }
});

router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('user_id', req.user.id)
      .gt('shares', 0)
      .eq('is_in_watchlist', false)
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

router.get('/:ticker/history', async (req, res) => {
  try {
    const { ticker } = req.params;
    const history = [];
    const today = new Date();
    let currentPrice = (await stockPriceService.getQuote(ticker))?.currentPrice || 100;

    for (let i = 30; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      currentPrice = Math.max(currentPrice + (Math.random() - 0.5) * 5, 1);
      history.push({
        date: date.toISOString().split('T')[0],
        price: parseFloat(currentPrice.toFixed(2))
      });
    }

    res.json({ history });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stock history' });
  }
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    const { name, ticker, shares, buy_price, target_price } = req.body;

    const parsedShares = parseFloat(shares);
    const parsedBuyPrice = parseFloat(buy_price);
    const parsedTargetPrice = parseFloat(target_price || buy_price);

    const quote = await stockPriceService.getStockQuote(ticker);

    const stockData = {
      name: name.trim(),
      ticker: ticker.toUpperCase().trim(),
      shares: parsedShares,
      buy_price: parsedBuyPrice,
      current_price: quote.c,
      target_price: parsedTargetPrice,
      is_in_watchlist: false,
      user_id: req.user.id,
      last_updated: new Date()
    };

    const stock = await Stock.create(stockData);
    res.status(201).json(stock);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const stock = await Stock.findByPk(req.params.id);
    if (!stock || stock.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await stock.update({
      ...req.body,
      last_updated: new Date()
    });

    res.json(stock);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const stock = await Stock.findByPk(req.params.id);
    if (!stock || stock.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await stock.destroy();
    res.json({ message: 'Stock deleted successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to delete stock' });
  }
});

router.get('/summary', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('user_id', req.user.id)
      .gt('shares', 0)
      .eq('is_in_watchlist', false);

    if (error) throw error;

    let totalValue = 0;
    let totalGain = 0;

    for (const stock of data) {
      const value = stock.shares * stock.current_price;
      const cost = stock.shares * stock.buy_price;
      totalValue += value;
      totalGain += value - cost;
    }

    res.json({
      totalValue,
      totalGain,
      totalGainPercent:
        totalValue > 0 ? (totalGain / (totalValue - totalGain)) * 100 : 0,
      stockCount: data.length
    });
  } catch {
    res.status(500).json({ error: 'Failed to get portfolio summary' });
  }
});

export default router;
