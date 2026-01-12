import dotenv from 'dotenv';
import { initializeDatabase } from '../migrations/init.js';

dotenv.config({ path: '.env.railway' });

console.log('Using database URL:', process.env.DATABASE_URL);

initializeDatabase()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
