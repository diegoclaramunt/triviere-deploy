import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import mongoose from 'mongoose';
import { loadConfig } from './config.mjs';

const config = loadConfig();
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browserDirectory = path.resolve(__dirname, '../dist/frontend/browser');

const itemSchema = new mongoose.Schema(
  { label: { type: String, required: true, trim: true, maxlength: 100 } },
  { timestamps: true, versionKey: false },
);
const Item = mongoose.model('ClientItem', itemSchema, config.mongoCollection);

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

const api = express.Router();

api.get('/health/live', (_request, response) => {
  response.json({ status: 'ok' });
});

api.get('/health/ready', async (_request, response) => {
  try {
    if (mongoose.connection.readyState !== 1) throw new Error('not connected');
    await mongoose.connection.db.admin().ping();
    response.json({ status: 'ok', mongo: 'connected' });
  } catch {
    response.status(503).json({ status: 'unavailable', mongo: 'disconnected' });
  }
});

api.get('/config', (_request, response) => {
  response.json({
    appName: config.appName,
    clientName: config.clientName,
    basePath: config.basePath,
  });
});

api.get('/items', async (_request, response, next) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 }).limit(20).lean();
    response.json(items);
  } catch (error) {
    next(error);
  }
});

api.post('/items', async (request, response, next) => {
  try {
    const label = typeof request.body?.label === 'string' ? request.body.label.trim() : '';
    if (!label || label.length > 100) {
      return response.status(400).json({ error: 'label debe tener entre 1 y 100 caracteres' });
    }
    const item = await Item.create({ label });
    return response.status(201).json(item);
  } catch (error) {
    return next(error);
  }
});

app.use(`${config.basePath}/api`, api);

app.get('/', (_request, response) => response.redirect(302, `${config.basePath}/`));
app.use(config.basePath, express.static(browserDirectory, { index: false }));
app.get(config.basePath, (_request, response) => response.sendFile(path.join(browserDirectory, 'index.html')));
app.get(`${config.basePath}/{*route}`, (_request, response) =>
  response.sendFile(path.join(browserDirectory, 'index.html')),
);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Error interno' });
});

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`Aplicación disponible en http://0.0.0.0:${config.port}${config.basePath}/`);
});

async function connectMongo() {
  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB conectado; colección: ${config.mongoCollection}`);
  } catch (error) {
    console.error('MongoDB no disponible; reintentando en 5 segundos', error.message);
    setTimeout(connectMongo, 5000).unref();
  }
}

connectMongo();

async function shutdown(signal) {
  console.log(`${signal} recibido; cerrando servidor`);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
