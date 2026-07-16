// Hostinger Production Entrypoint for Express Preset
process.env.NODE_ENV = 'production';

// Load the compiled and optimized production server bundle
require('./dist/server.cjs');
