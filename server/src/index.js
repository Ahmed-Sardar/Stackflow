const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const projectEnv = path.resolve(__dirname, '../../.env');
const serverEnv = path.resolve(__dirname, '../.env');
if (fs.existsSync(projectEnv)) dotenv.config({ path: projectEnv });
if (fs.existsSync(serverEnv)) dotenv.config({ path: serverEnv });

const routes = require('./routes');
const { errorHandler } = require('./middleware/errors');

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  const missing = ['MONGODB_URI', 'JWT_SECRET'].filter(key => !process.env[key]);
  console.error(`Missing required configuration: ${missing.join(', ')}. Set it in the workspace or server .env file.`);
  process.exit(1);
}

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));
app.get('/api/health', (req, res) => res.json({ data: { status: 'ok' } }));
app.use('/api', routes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
} else {
  app.use((req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
}
app.use(errorHandler);

mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.listen(process.env.PORT || 4000, () => console.log(`StockFlow API listening on port ${process.env.PORT || 4000}`));
}).catch(error => {
  console.error('Database connection failed:', error.message);
  process.exit(1);
});
