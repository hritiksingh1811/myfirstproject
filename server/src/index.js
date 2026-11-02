import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { Store } from './store.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataFile = process.env.DATA_FILE || path.resolve(here, '../data/db.json');
const port = Number(process.env.PORT) || 4000;

createApp(new Store(dataFile)).listen(port, () => {
  console.log(`API listening on http://localhost:${port} (data: ${dataFile})`);
});
