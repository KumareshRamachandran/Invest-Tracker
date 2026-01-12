import axios from 'axios';
import Stock from '../models/Stock.js';
import supabase from '../config/supabase.js';

const METAL_API_KEY = process.env.METAL_API_KEY;
const METAL_BASE_URL = 'https://api.metalpriceapi.com/v1';

const getAssetQuote = async (ticker) => {
  try {
    console.log('Fetching quote for ticker:', ticker);

    const response = await axios.get(`${METAL_BASE_URL}/latest`, {
      params: {
        api_key: METAL_API_KEY,
        base: 'USD',
        currencies: ticker
      }
    });

    console.log('Quote response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    return null;
  }
};

export default { getAssetQuote };
