const request = require('supertest');
const app = require('./server');
const db = require('./db');

async function runTests() {
  const resAll = await request(app).get('/tasks');
  if (resAll.status !== 200) throw new Error('GET /tasks failed');

  const resOne = await request(app).get('/tasks/1');
  if (resOne.status !== 200 || resOne.body.id !== 1) throw new Error('GET /tasks/1 failed');

  const resNotFound = await request(app).get('/tasks/999');
  if (resNotFound.status !== 404) throw new Error('GET /tasks/999 failed');

  const resEmptyTitle = await request(app).post('/tasks').send({ title: '' });
  if (resEmptyTitle.status !== 400 || resEmptyTitle.body.error !== 'Title is required') {
    throw new Error('POST /tasks empty title validation failed');
  }

  const resCreate = await request(app).post('/tasks').send({ title: 'Build SQLite API' });
  if (resCreate.status !== 201 || resCreate.body.title !== 'Build SQLite API' || !resCreate.body.id) {
    throw new Error('POST /tasks create failed');
  }

  const createdId = resCreate.body.id;

  const resPut = await request(app).put(`/tasks/${createdId}`).send({ done: true, title: 'Build SQLite API (Completed)' });
  if (resPut.status !== 200 || resPut.body.done !== true || resPut.body.title !== 'Build SQLite API (Completed)') {
    throw new Error('PUT /tasks/:id failed');
  }

  const resPut404 = await request(app).put('/tasks/999').send({ title: 'Nonexistent' });
  if (resPut404.status !== 404) throw new Error('PUT /tasks/999 failed to return 404');

  const resPut400 = await request(app).put(`/tasks/${createdId}`).send({ title: '' });
  if (resPut400.status !== 400) throw new Error('PUT /tasks/:id empty title failed to return 400');

  const resStats = await request(app).get('/stats');
  if (resStats.status !== 200 || typeof resStats.body.total !== 'number') {
    throw new Error('GET /stats failed');
  }

  const resDelete = await request(app).delete(`/tasks/${createdId}`);
  if (resDelete.status !== 204) throw new Error('DELETE /tasks/:id failed');

  const resGetDeleted = await request(app).get(`/tasks/${createdId}`);
  if (resGetDeleted.status !== 404) throw new Error('Deleted task still exists!');

  const resDelete404 = await request(app).delete('/tasks/999');
  if (resDelete404.status !== 404) throw new Error('DELETE /tasks/999 failed to return 404');

  console.log('[SUCCESS] All integration tests passed successfully!');
}

runTests().catch(err => {
  console.error('[ERROR] Test failed:', err.message);
  process.exit(1);
});
