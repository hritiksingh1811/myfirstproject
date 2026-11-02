// Express app: REST API + (in production) the built React client.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { EmployeeService, ServiceError } from './services.js';

const wrap = (fn) => (req, res, next) => {
  try {
    fn(req, res, next);
  } catch (err) {
    next(err);
  }
};

/** @param {import('./store.js').Store} store */
export function createApp(store) {
  const service = new EmployeeService(store);
  const app = express();
  app.use(cors());
  app.use(express.json());

  const api = express.Router();

  api.get('/health', (req, res) => res.json({ ok: true }));
  api.get('/stats', wrap((req, res) => res.json(service.stats())));

  api.get('/employees', wrap((req, res) => {
    res.json(service.list({ status: req.query.status, search: req.query.search }));
  }));

  api.post('/employees', wrap((req, res) => {
    res.status(201).json(service.onboard(req.body || {}));
  }));

  api.get('/employees/:id', wrap((req, res) => {
    res.json(service.serialize(service.get(req.params.id)));
  }));

  api.delete('/employees/:id', wrap((req, res) => {
    service.remove(req.params.id);
    res.status(204).end();
  }));

  api.post('/employees/:id/offboard', wrap((req, res) => {
    res.json(service.startOffboarding(req.params.id, req.body || {}));
  }));

  api.patch('/tasks/:id', wrap((req, res) => {
    if (typeof req.body?.done !== 'boolean') {
      throw new ServiceError('Body must include "done": true|false');
    }
    res.json(service.setTaskDone(req.params.id, req.body.done));
  }));

  app.use('/api', api);

  // Serve the React build if it exists (production mode).
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    app.get(/^(?!\/api).*/, (req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err instanceof ServiceError) return res.status(err.status).json({ error: err.message });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
