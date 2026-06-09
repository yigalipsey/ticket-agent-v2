import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeApp,
  getAgent,
  initApp,
  truncateTables,
} from './helpers/app.helper';

describe('Countries E2E', () => {
  beforeAll(async () => {
    await initApp();
    await truncateTables();
  });

  afterAll(async () => {
    await truncateTables();
    await closeApp();
  });

  it('GET /countries — empty DB returns 200 []', async () => {
    const res = await getAgent().get('/countries');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /countries — valid body returns 201 with Country shape', async () => {
    const res = await getAgent().post('/countries').send({
      name: 'ישראל',
      name_en: 'Israel',
      slug: 'israel',
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      name: 'ישראל',
      name_en: 'Israel',
      slug: 'israel',
    });
    expect(res.body.created_at).toBeDefined();
  });

  it('GET /countries/:slug — existing slug returns 200 with matching Country', async () => {
    const res = await getAgent().get('/countries/israel');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'ישראל',
      slug: 'israel',
    });
  });

  it('GET /countries/:slug — unknown slug returns 404', async () => {
    const res = await getAgent().get('/countries/nonexistent-slug');
    expect(res.status).toBe(404);
  });

  it('POST /countries — missing name returns 400 with validation error', async () => {
    const res = await getAgent().post('/countries').send({
      slug: 'some-country',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('POST /countries — duplicate slug returns 409', async () => {
    const res = await getAgent().post('/countries').send({
      name: 'Duplicate',
      slug: 'israel',
    });
    expect(res.status).toBe(409);
  });
});
