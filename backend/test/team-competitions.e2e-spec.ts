import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeApp,
  getAgent,
  initApp,
  truncateTables,
} from './helpers/app.helper';

describe('Team Competitions E2E', () => {
  let countryId: number;
  let team1Id: string;
  let team2Id: string;
  let comp1Id: string;
  let comp2Id: string;

  beforeAll(async () => {
    await initApp();
    await truncateTables();

    // 1. Seed country
    const countryRes = await getAgent().post('/countries').send({
      name: 'ספרד',
      name_en: 'Spain',
      slug: 'spain',
    });
    countryId = (countryRes.body as { id: number }).id;

    // 2. Seed teams
    const team1Res = await getAgent().post('/teams').send({
      slug: 'real-madrid',
      name: 'ריאל מדריד',
      nameEn: 'Real Madrid',
      code: 'RMA',
    });
    team1Id = (team1Res.body as { id: string }).id;

    const team2Res = await getAgent().post('/teams').send({
      slug: 'barcelona',
      name: 'ברצלונה',
      nameEn: 'Barcelona',
      code: 'BAR',
    });
    team2Id = (team2Res.body as { id: string }).id;

    // 3. Seed competitions
    const comp1Res = await getAgent().post('/competitions').send({
      slug: 'la-liga',
      name: 'לה ליגה',
      name_en: 'La Liga',
      countryId,
      type: 'League',
    });
    comp1Id = (comp1Res.body as { id: string }).id;

    const comp2Res = await getAgent().post('/competitions').send({
      slug: 'copa-del-rey',
      name: 'גביע המלך',
      name_en: 'Copa del Rey',
      countryId,
      type: 'Cup',
    });
    comp2Id = (comp2Res.body as { id: string }).id;
  });

  afterAll(async () => {
    await truncateTables();
    await closeApp();
  });

  it('POST /team-competitions — valid link returns 201', async () => {
    const res = await getAgent().post('/team-competitions').send({
      teamId: team1Id,
      competitionId: comp1Id,
      season: '2024/2025',
      status: 'active',
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      team_id: team1Id,
      competition_id: comp1Id,
      season: '2024/2025',
      status: 'active',
    });
  });

  it('POST /team-competitions — another valid link returns 201', async () => {
    const res = await getAgent().post('/team-competitions').send({
      teamId: team1Id,
      competitionId: comp2Id,
      season: '2024/2025',
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('active'); // default is active
  });

  it('POST /team-competitions — duplicate mapping returns 409', async () => {
    const res = await getAgent().post('/team-competitions').send({
      teamId: team1Id,
      competitionId: comp1Id,
      season: '2024/2025',
    });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already associated');
  });

  it('POST /team-competitions — invalid season format returns 400', async () => {
    const res = await getAgent().post('/team-competitions').send({
      teamId: team2Id,
      competitionId: comp1Id,
      season: '2024-2025', // invalid format
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Season must be in format YYYY/YYYY');
  });

  it('POST /team-competitions — non-existent teamId returns 400', async () => {
    const res = await getAgent().post('/team-competitions').send({
      teamId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d', // Valid UUID v4 but non-existent
      competitionId: comp1Id,
      season: '2024/2025',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('referenced record does not exist');
  });

  it('GET /teams/:slug — retrieves active competitions', async () => {
    const res = await getAgent().get('/teams/real-madrid');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('real-madrid');
    expect(res.body.competitions).toBeDefined();
    expect(res.body.competitions.length).toBe(2);

    const compSlugs = res.body.competitions.map((c: any) => c.slug);
    expect(compSlugs).toContain('la-liga');
    expect(compSlugs).toContain('copa-del-rey');
  });

  it('GET /teams/:slug — team with no mappings returns empty array', async () => {
    const res = await getAgent().get('/teams/barcelona');

    expect(res.status).toBe(200);
    expect(res.body.competitions).toEqual([]);
  });

  it('GET /competitions/:slug — retrieves active teams', async () => {
    const res = await getAgent().get('/competitions/la-liga');

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe('la-liga');
    expect(res.body.teams).toBeDefined();
    expect(res.body.teams.length).toBe(1);
    expect(res.body.teams[0].slug).toBe('real-madrid');
  });

  it('PATCH /team-competitions/:teamId/:competitionId/:season — updates status', async () => {
    // Season is URL-encoded: 2024/2025 -> 2024%2F2025
    const res = await getAgent()
      .patch(`/team-competitions/${team1Id}/${comp2Id}/2024%2F2025`)
      .send({ status: 'eliminated' });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      team_id: team1Id,
      competition_id: comp2Id,
      season: '2024/2025',
      status: 'eliminated',
    });
  });

  it('GET /teams/:slug — team details exclude eliminated competitions', async () => {
    const res = await getAgent().get('/teams/real-madrid');

    expect(res.status).toBe(200);
    expect(res.body.competitions.length).toBe(1); // Only 'la-liga' (active), 'copa-del-rey' (eliminated) is omitted
    expect(res.body.competitions[0].slug).toBe('la-liga');
  });

  it('PATCH /team-competitions/:teamId/:competitionId/:season — returns 404 for unknown association', async () => {
    const res = await getAgent()
      .patch(`/team-competitions/${team2Id}/${comp2Id}/2024%2F2025`)
      .send({ status: 'active' });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('not found');
  });

  it('PATCH /team-competitions/:teamId/:competitionId/:season — returns 400 for invalid status value', async () => {
    const res = await getAgent()
      .patch(`/team-competitions/${team1Id}/${comp1Id}/2024%2F2025`)
      .send({ status: 'winner' }); // not in enum

    expect(res.status).toBe(400);
  });

  it('DELETE /team-competitions/:teamId/:competitionId/:season — unlinks association', async () => {
    const res = await getAgent()
      .delete(`/team-competitions/${team1Id}/${comp1Id}/2024%2F2025`);

    expect(res.status).toBe(200);

    const getRes = await getAgent().get('/teams/real-madrid');
    expect(getRes.body.competitions.length).toBe(0); // All unlinked or inactive
  });

  it('DELETE /team-competitions/:teamId/:competitionId/:season — returns 404 for unknown association', async () => {
    const res = await getAgent()
      .delete(`/team-competitions/${team1Id}/${comp1Id}/2024%2F2025`); // deleted in previous test

    expect(res.status).toBe(404);
  });
});
