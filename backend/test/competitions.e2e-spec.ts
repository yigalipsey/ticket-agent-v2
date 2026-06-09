import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeApp,
  getAgent,
  initApp,
  truncateTables,
} from './helpers/app.helper';

describe('Competitions E2E', () => {
  let countryId: number;

  beforeAll(async () => {
    await initApp();
    await truncateTables();

    const res = await getAgent().post('/countries').send({
      name: 'אנגליה',
      name_en: 'England',
      slug: 'england',
    });
    countryId = (res.body as { id: number }).id;
  });

  afterAll(async () => {
    await truncateTables();
    await closeApp();
  });

  it('GET /competitions — empty DB returns 200 []', async () => {
    const res = await getAgent().get('/competitions');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /competitions?popular=true — returns only popular competitions', async () => {
    await getAgent().post('/competitions').send({
      slug: 'popular-league',
      name: 'ליגה פופולרית',
      countryId,
      isPopular: true,
    });
    await getAgent().post('/competitions').send({
      slug: 'regular-league',
      name: 'ליגה רגילה',
      countryId,
    });

    const allRes = await getAgent().get('/competitions');
    expect(allRes.status).toBe(200);
    expect(allRes.body).toHaveLength(2);

    const popularRes = await getAgent().get('/competitions?popular=true');
    expect(popularRes.status).toBe(200);
    expect(popularRes.body).toHaveLength(1);
    expect(popularRes.body[0]).toMatchObject({
      slug: 'popular-league',
      is_popular: true,
    });
  });

  it('GET /competitions?type=Cup — returns only cup competitions', async () => {
    await getAgent().post('/competitions').send({
      slug: 'fa-cup',
      name: 'גביע האנגלי',
      countryId,
      type: 'Cup',
    });
    await getAgent().post('/competitions').send({
      slug: 'premier-league',
      name: 'פרמייר ליג',
      countryId,
      type: 'League',
    });

    const cupRes = await getAgent().get('/competitions?type=Cup');
    expect(cupRes.status).toBe(200);
    expect(cupRes.body.every((c: { type: string }) => c.type === 'Cup')).toBe(
      true,
    );
    expect(cupRes.body.some((c: { slug: string }) => c.slug === 'fa-cup')).toBe(
      true,
    );
  });

  it('POST /competitions — valid body returns 201 with Competition shape', async () => {
    const res = await getAgent().post('/competitions').send({
      slug: 'championship',
      name: 'צ\'מפיונשיפ',
      name_en: 'Championship',
      countryId,
      type: 'League',
      apiCompetitionId: 40,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      slug: 'championship',
      name: 'צ\'מפיונשיפ',
      name_en: 'Championship',
      country_id: countryId,
      type: 'League',
      api_competition_id: 40,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
  });

  it('GET /competitions/:slug — existing slug returns 200 with raw row (no parent JOIN)', async () => {
    const parentRes = await getAgent().post('/competitions').send({
      slug: 'parent-league',
      name: 'ליגה ראשית',
      countryId,
    });
    const parentId = (parentRes.body as { id: string }).id;

    await getAgent().post('/competitions').send({
      slug: 'child-cup',
      name: 'גביע',
      countryId,
      type: 'Cup',
      parentCompetitionId: parentId,
    });

    const res = await getAgent().get('/competitions/child-cup');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      slug: 'child-cup',
      type: 'Cup',
      parent_competition_id: parentId,
    });
    expect(res.body.parent).toBeUndefined();
  });

  it('GET /competitions/:slug — unknown slug returns 404', async () => {
    const res = await getAgent().get('/competitions/nonexistent-competition');
    expect(res.status).toBe(404);
  });

  it('POST /competitions — non-existent countryId returns 400', async () => {
    const res = await getAgent().post('/competitions').send({
      slug: 'orphan-league',
      name: 'ליגה יתומה',
      countryId: 999999,
    });
    expect(res.status).toBe(400);
  });

  it('POST /competitions — non-existent parentCompetitionId returns 400', async () => {
    const res = await getAgent().post('/competitions').send({
      slug: 'bad-parent',
      name: 'ליגה עם הורה שגוי',
      countryId,
      parentCompetitionId: '00000000-0000-0000-0000-000000000000',
    });
    expect(res.status).toBe(400);
  });

  it('POST /competitions — duplicate slug returns 409', async () => {
    const res = await getAgent().post('/competitions').send({
      slug: 'championship',
      name: 'כפול',
      countryId,
    });
    expect(res.status).toBe(409);
  });

  it('POST /competitions — duplicate apiCompetitionId returns 409', async () => {
    const res = await getAgent().post('/competitions').send({
      slug: 'duplicate-api-id',
      name: 'ליגה כפולה',
      countryId,
      apiCompetitionId: 40,
    });
    expect(res.status).toBe(409);
  });

  it('POST /competitions — missing name returns 400 with validation error', async () => {
    const res = await getAgent().post('/competitions').send({
      slug: 'no-name',
      countryId,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('POST /competitions — invalid type returns 400', async () => {
    const res = await getAgent().post('/competitions').send({
      slug: 'bad-type',
      name: 'סוג שגוי',
      countryId,
      type: 'Tournament',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });
});
