import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

import apiRouter from './server/routes/api.router.js';
import scanRouter from './server/routes/scan.router.js';

dotenv.config();

const app = express();
const PORT = 3000;

// ============================================================================
// GLOBAL SECURITY HEADERS & EXPOSURES (OWASP Top 10 Hardened Profile)
// ============================================================================
// Webhook endpoints require express.raw body parsing for Stripe signature verification
app.use(['/api/v1/billing/webhook', '/api/billing/webhook'], express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  
  // Custom Content Security Policy (Allows iframe embedding for AI Studio preview)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' ws: wss: https://generativelanguage.googleapis.com; frame-ancestors *;"
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
    const { createServer: createViteServer } = await import('vite');
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Karrents Secure Node] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("[Fatal Startup Failure] Failed to start Karrents server:", err);
});
