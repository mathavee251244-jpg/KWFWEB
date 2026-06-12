import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';

import authRouter from './routes/auth.js';
import ticketsRouter from './routes/tickets.js';
import usersRouter from './routes/users.js';
import otRouter from './routes/ot.js';
import servicesRouter from './routes/services.js';
import chatRouter from './routes/chat.js';
import docsRouter from './routes/docs.js';
import { setupSockets } from './sockets/index.js';
import { setIO } from './lib/notify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT   = Number(process.env.PORT) || 3001;
const isProd = process.env.NODE_ENV === 'production';

// In production the frontend is served from the same origin,
// so CORS is not required. In dev we proxy from port 5173.
const corsOrigin = isProd ? false : 'http://localhost:5173';

const app = express();

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve built frontend in production
if (isProd) {
  const distPath = path.join(__dirname, '../dist');
  app.use(express.static(distPath));
}

app.use('/api/auth',     authRouter);
app.use('/api/tickets',  ticketsRouter);
app.use('/api/users',    usersRouter);
app.use('/api/ot',       otRouter);
app.use('/api/services', servicesRouter);
app.use('/api/chat',     chatRouter);
app.use('/api/docs',     docsRouter);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// SPA fallback — let React Router handle all non-API paths
if (isProd) {
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: isProd ? {} : { origin: 'http://localhost:5173', credentials: true },
  transports: ['websocket', 'polling'],
});

setIO(io);
setupSockets(io);

const host = isProd ? '0.0.0.0' : 'localhost';
httpServer.listen(PORT, host, () => {
  console.log(`\n  IT Helpdesk  →  http://${host}:${PORT}`);
  if (isProd) console.log('  Mode: production (serving built frontend)');
  console.log('  Socket.IO    →  ws://' + host + ':' + PORT);
  console.log('  Run `npm run seed` to seed the database on first start.\n');
});
