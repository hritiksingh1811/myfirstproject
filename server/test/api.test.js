import assert from 'node:assert/strict';
import { beforeEach, describe, test } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { OFFBOARDING_CHECKLIST, ONBOARDING_CHECKLIST } from '../src/checklists.js';
import { Store } from '../src/store.js';

const newHire = {
  firstName: 'Asha',
  lastName: 'Verma',
  email: 'asha@example.com',
  department: 'Engineering',
  jobTitle: 'Software Engineer',
  manager: 'Ravi Kumar',
  startDate: '2026-11-10',
};

let app;
beforeEach(() => {
  app = createApp(new Store(null)); // in-memory store per test
});

const create = (body = newHire) => request(app).post('/api/employees').send(body);

describe('onboarding', () => {
  test('creates employee with onboarding checklist', async () => {
    const res = await create().expect(201);
    assert.equal(res.body.status, 'onboarding');
    assert.equal(res.body.fullName, 'Asha Verma');
    assert.equal(res.body.tasks.length, ONBOARDING_CHECKLIST.length);
    assert.equal(res.body.tasks[0].dueDate, '2026-10-27'); // start - 14 days
  });

  test('validates required fields and email', async () => {
    const res = await create({ firstName: 'X' }).expect(400);
    assert.match(res.body.error, /Missing required fields/);
    await create({ ...newHire, email: 'nope' }).expect(400);
  });

  test('rejects duplicate email', async () => {
    await create().expect(201);
    await create({ ...newHire, email: 'ASHA@example.com' }).expect(409);
  });

  test('becomes active when all onboarding tasks are done, and back if untick', async () => {
    const { body } = await create();
    let last;
    for (const t of body.tasks) {
      last = await request(app).patch(`/api/tasks/${t.id}`).send({ done: true }).expect(200);
    }
    assert.equal(last.body.status, 'active');
    assert.equal(last.body.onboardingProgress, 100);

    const undo = await request(app).patch(`/api/tasks/${body.tasks[0].id}`).send({ done: false });
    assert.equal(undo.body.status, 'onboarding');
  });
});

describe('offboarding', () => {
  test('starts offboarding and exits when checklist completed', async () => {
    const { body } = await create();
    const off = await request(app)
      .post(`/api/employees/${body.id}/offboard`)
      .send({ endDate: '2027-03-31', exitReason: 'Relocation' })
      .expect(200);
    assert.equal(off.body.status, 'offboarding');
    const offTasks = off.body.tasks.filter((t) => t.process === 'offboarding');
    assert.equal(offTasks.length, OFFBOARDING_CHECKLIST.length);

    let last;
    for (const t of offTasks) {
      last = await request(app).patch(`/api/tasks/${t.id}`).send({ done: true });
    }
    assert.equal(last.body.status, 'exited');
  });

  test('rejects invalid end date and double offboarding', async () => {
    const { body } = await create();
    await request(app).post(`/api/employees/${body.id}/offboard`).send({ endDate: '2020-01-01' }).expect(400);
    await request(app).post(`/api/employees/${body.id}/offboard`).send({ endDate: '2027-01-01' }).expect(200);
    await request(app).post(`/api/employees/${body.id}/offboard`).send({ endDate: '2027-01-01' }).expect(400);
  });
});

describe('queries', () => {
  test('lists, filters, searches, stats and delete', async () => {
    await create();
    await create({ ...newHire, firstName: 'Ben', email: 'ben@example.com', department: 'Sales' });

    assert.equal((await request(app).get('/api/employees')).body.length, 2);
    assert.equal((await request(app).get('/api/employees?search=sales')).body.length, 1);
    assert.equal((await request(app).get('/api/employees?status=active')).body.length, 0);

    const stats = (await request(app).get('/api/stats')).body;
    assert.equal(stats.total, 2);
    assert.equal(stats.counts.onboarding, 2);

    await request(app).delete('/api/employees/1').expect(204);
    await request(app).get('/api/employees/1').expect(404);
  });

  test('task update requires boolean done', async () => {
    const { body } = await create();
    await request(app).patch(`/api/tasks/${body.tasks[0].id}`).send({}).expect(400);
    await request(app).patch('/api/tasks/999').send({ done: true }).expect(404);
  });
});
