import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import apiRouter from './server/routes/api.router.js';
import scanRouter from './server/routes/scan.router.js';

dotenv.config();

const app = express();
const rawPort = process.env.PORT;
const isSocket = rawPort && isNaN(Number(rawPort));
const PORT = isSocket ? rawPort : (rawPort ? parseInt(rawPort, 10) : 3000);

// ============================================================================
// GLOBAL SECURITY HEADERS & EXPOSURES (OWASP Top 10 Hardened Profile)
// ============================================================================
app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  
  // Custom Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: referrer; connect-src 'self' ws: wss: https://generativelanguage.googleapis.com;"
  );

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-XSRF-TOKEN, X-CSRF-TOKEN');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ============================================================================
// MOUNT DECOUPLED ROUTERS
// ============================================================================
app.use('/api', apiRouter);
app.use('/api', scanRouter);

// ============================================================================
// VITE OR STATIC SERVING RUNTIME ENVIRONMENT
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (isSocket) {
    app.listen(PORT, () => {
      console.log(`[Karrents Secure Node] Running on socket ${PORT}`);
    });
  } else {
    app.listen(PORT as number, '0.0.0.0', () => {
      console.log(`[Karrents Secure Node] Running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer().catch(err => {
  console.error("[Fatal Startup Failure] Failed to start Karrents server:", err);
});
