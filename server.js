// Hostinger / Phusion Passenger / cPanel Universal Production Entrypoint
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

process.env.NODE_ENV = 'production';

const require = createRequire(import.meta.url);
const distServerPath = path.join(process.cwd(), 'dist', 'server.cjs');

if (fs.existsSync(distServerPath)) {
  require('./dist/server.cjs');
} else {
  console.error('[Hostinger Boot] Error: dist/server.cjs file not found.');
}
