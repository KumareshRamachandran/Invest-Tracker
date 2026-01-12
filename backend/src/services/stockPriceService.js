import axios from 'axios';
import Stock from '../models/Stock.js';
import supabase from '../config/supabase.js';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const getStockQuote = async (ticker) => {
  try {
    const response = await axios.get(`${FINNHUB_BASE_URL}/quote`, {
      params: {
        symbol: ticker,
        token: FINNHUB_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
};

const getHistoricalData = async (ticker) => {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - 30 * 24 * 60 * 60;

    const response = await axios.get(
      `${FINNHUB_BASE_URL}/stock/candle`,
      {
        params: {
          symbol: ticker,
          resolution: 'D',
          from: start,
          to: end,
          token: FINNHUB_API_KEY
        }
      }
    );

    if (response.data.s === 'no_data') {
      throw new Error('No historical data available');
    }

    const { t: timestamps, c: closingPrices } = response.data;
    return timestamps.map((timestamp, index) => ({
      timestamp: new Date(timestamp * 1000).toISOString(),
      price: closingPrices[index].toFixed(2)
    }));
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

const updateStockPrices = async () => {
  try {
    const { data: stocks, error } = await supabase
      .from('stocks')
      .select('*')
      .or('shares.gt.0,is_in_watchlist.eq.true');

    if (error || !stocks?.length) return;

    for (const stock of stocks) {
      const quote = await getStockQuote(stock.ticker);
      if (quote?.c > 0) {
        await supabase
          .from('stocks')
          .update({
            current_price: quote.c,
            last_updated: new Date().toISOString()
          })
          .eq('id', stock.id);
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
  } catch (error) {
    console.error('Error in updateStockPrices:', error);
  }
};

const startPeriodicUpdates = () => {
  updateStockPrices();
  setInterval(updateStockPrices, 5 * 60 * 1000);
};

export default{
  getStockQuote,
  getHistoricalData,
  updateStockPrices,
  startPeriodicUpdates
};
