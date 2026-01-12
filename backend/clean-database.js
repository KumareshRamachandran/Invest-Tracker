import dotenv from 'dotenv';
import supabase from './src/config/supabase.js';

dotenv.config();

async function cleanDatabase() {
  try {
    console.log('Cleaning database...');

    const { error: stocksError } = await supabase
      .from('stocks')
      .delete()
      .neq('id', 0);

    if (stocksError) {
      console.error('Error deleting stocks:', stocksError);
    } else {
      console.log('Successfully deleted all stocks');
    }

    const { error: watchlistsError } = await supabase
      .from('watchlists')
      .delete()
      .neq('id', 0);

    if (watchlistsError) {
      console.error('Error deleting watchlists:', watchlistsError);
    } else {
      console.log('Successfully deleted all watchlists');
    }

    console.log('Database cleaning completed');
  } catch (error) {
    console.error('Error cleaning database:', error);
  }
}

cleanDatabase();
