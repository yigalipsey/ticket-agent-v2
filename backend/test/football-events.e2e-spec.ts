import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeApp,
  getAgent,
  getDb,
  initApp,
  truncateTables,
} from './helpers/app.helper';
import { sql } from 'drizzle-orm';

describe('Football Events E2E', () => {
  let countryId: number;
  let cityId: string;
  let venueId: string;
  let competitionId: string;
  let homeTeamId: string;
  let awayTeamId: string;

  beforeAll(async () => {
    await initApp();
    await truncateTables();
    await getDb().execute(sql`ALTER SEQUENCE football_events_event_number_seq RESTART WITH 20000`);

    // 1. Seed country
    const countryRes = await getAgent().post('/countries').send({
      name: 'אנגליה',
      name_en: 'England',
      slug: 'england',
    });
    countryId = (countryRes.body as { id: number }).id;

    // 2. Seed city
    const cityRes = await getAgent().post('/cities').send({
      slug: 'london',
      name: 'לונדון',
      name_en: 'London',
      countryId,
    });
    cityId = (cityRes.body as { id: string }).id;

    // 3. Seed venue
    const venueRes = await getAgent().post('/venues').send({
      slug: 'emirates-stadium',
      name: 'אצטדיון האמירויות',
      nameEn: 'Emirates Stadium',
      cityId,
    });
    venueId = (venueRes.body as { id: string }).id;

    // 4. Seed competition
    const compRes = await getAgent().post('/competitions').send({
      name: 'פרמייר ליג',
      name_en: 'Premier League',
      slug: 'premier-league',
      countryId: countryId,
    });
    competitionId = (compRes.body as { id: string }).id;

    // 5. Seed teams
    const team1 = await getAgent().post('/teams').send({
      name: 'ארסנל',
      nameEn: 'Arsenal',
      code: 'ARS',
      slug: 'arsenal',
    });
    homeTeamId = (team1.body as { id: string }).id;

    const team2 = await getAgent().post('/teams').send({
      name: 'צ׳לסי',
      nameEn: 'Chelsea',
      code: 'CHE',
      slug: 'chelsea',
    });
    awayTeamId = (team2.body as { id: string }).id;
  });

  afterAll(async () => {
    await truncateTables();
    await closeApp();
  });

  it('GET /football-events — empty DB returns 200 []', async () => {
    const res = await getAgent().get('/football-events');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  describe('POST /football-events — validation rules', () => {
    it('should reject creation when venue_id is missing', async () => {
      const res = await getAgent().post('/football-events').send({
        startsAt: new Date().toISOString(),
        competitionId,
        homeTeamId,
        awayTeamId,
      });
      expect(res.status).toBe(400);
    });

    it('should reject creation when venue_id does not exist', async () => {
      const res = await getAgent().post('/football-events').send({
        startsAt: new Date().toISOString(),
        competitionId,
        venueId: '00000000-0000-0000-0000-000000000000',
        homeTeamId,
        awayTeamId,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('referenced venue does not exist');
    });

    it('should reject creation when competition_id does not exist', async () => {
      const res = await getAgent().post('/football-events').send({
        startsAt: new Date().toISOString(),
        competitionId: '00000000-0000-0000-0000-000000000000',
        venueId,
        homeTeamId,
        awayTeamId,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('referenced competition does not exist');
    });

    it('should reject creation when home_team_id does not exist', async () => {
      const res = await getAgent().post('/football-events').send({
        startsAt: new Date().toISOString(),
        competitionId,
        venueId,
        homeTeamId: '00000000-0000-0000-0000-000000000000',
        awayTeamId,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('referenced home team does not exist');
    });

    it('should reject creation when away_team_id does not exist', async () => {
      const res = await getAgent().post('/football-events').send({
        startsAt: new Date().toISOString(),
        competitionId,
        venueId,
        homeTeamId,
        awayTeamId: '00000000-0000-0000-0000-000000000000',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('referenced away team does not exist');
    });

    it('should reject creation when both homeTeamId and homeTeamName are set', async () => {
      const res = await getAgent().post('/football-events').send({
        startsAt: new Date().toISOString(),
        competitionId,
        venueId,
        homeTeamId,
        homeTeamName: 'Arsenal FC',
        awayTeamId,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Exactly one of homeTeamId or homeTeamName must be set.');
    });

    it('should reject creation when neither homeTeamId nor homeTeamName is set', async () => {
      const res = await getAgent().post('/football-events').send({
        startsAt: new Date().toISOString(),
        competitionId,
        venueId,
        awayTeamId,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Exactly one of homeTeamId or homeTeamName must be set.');
    });

    it('should reject creation when both awayTeamId and awayTeamName are set', async () => {
      const res = await getAgent().post('/football-events').send({
        startsAt: new Date().toISOString(),
        competitionId,
        venueId,
        homeTeamId,
        awayTeamId,
        awayTeamName: 'Chelsea FC',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Exactly one of awayTeamId or awayTeamName must be set.');
    });

    it('should reject creation when neither awayTeamId nor awayTeamName is set', async () => {
      const res = await getAgent().post('/football-events').send({
        startsAt: new Date().toISOString(),
        competitionId,
        venueId,
        homeTeamId,
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Exactly one of awayTeamId or awayTeamName must be set.');
    });

    it('should successfully create an event with valid resolved teams and return 201', async () => {
      const startsAt = '2026-10-15T18:00:00.000Z';
      const res = await getAgent().post('/football-events').send({
        startsAt,
        competitionId,
        venueId,
        homeTeamId,
        awayTeamId,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        event_number: 20000,
        starts_at: startsAt,
        status: 'scheduled',
        competition_id: competitionId,
        home_team_id: homeTeamId,
        away_team_id: awayTeamId,
        venue_id: venueId,
        home_team_name: null,
        away_team_name: null,
        slug: 'arsenal-vs-chelsea-2026-10-15',
      });
    });

    it('should successfully create an event with TBD display names and auto-generate slug', async () => {
      const startsAt = '2026-10-16T20:00:00.000Z';
      const res = await getAgent().post('/football-events').send({
        startsAt,
        competitionId,
        venueId,
        homeTeamName: 'Winner of Match A',
        awayTeamName: 'Winner of Match B',
        hasTbdTeam: true,
      });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(String),
        event_number: 20001,
        starts_at: startsAt,
        home_team_id: null,
        away_team_id: null,
        home_team_name: 'Winner of Match A',
        away_team_name: 'Winner of Match B',
        has_tbd_team: true,
        slug: 'winner-of-match-a-vs-winner-of-match-b-2026-10-16',
      });
    });

    it('should resolve slug collision deterministically by appending suffix', async () => {
      const startsAt = '2026-10-15T18:00:00.000Z';
      const res = await getAgent().post('/football-events').send({
        startsAt,
        competitionId,
        venueId,
        homeTeamId,
        awayTeamId,
      });

      expect(res.status).toBe(201);
      expect(res.body.slug).toBe('arsenal-vs-chelsea-2026-10-15-1');
    });
  });

  describe('GET /football-events/:event_number', () => {
    it('should retrieve a single event by event_number', async () => {
      const res = await getAgent().get('/football-events/20000');
      expect(res.status).toBe(200);
      expect(res.body.slug).toBe('arsenal-vs-chelsea-2026-10-15');
    });

    it('should return 404 if event_number is not found', async () => {
      const res = await getAgent().get('/football-events/99999');
      expect(res.status).toBe(404);
    });

    it('should return 400 if event_number parameter is not a number', async () => {
      const res = await getAgent().get('/football-events/abc');
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /football-events/:id', () => {
    let eventId: string;

    beforeAll(async () => {
      const listRes = await getAgent().get('/football-events');
      eventId = (listRes.body[0] as { id: string }).id;
    });

    it('should successfully update status and tags', async () => {
      const res = await getAgent().patch(`/football-events/${eventId}`).send({
        status: 'postponed',
        tags: ['derby', 'hot'],
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('postponed');
      expect(res.body.tags).toEqual(['derby', 'hot']);
    });

    it('should return 400 if id parameter is not a valid UUID', async () => {
      const res = await getAgent().patch('/football-events/123').send({
        status: 'postponed',
      });
      expect(res.status).toBe(400);
    });

    it('should validate team XOR when updating', async () => {
      const res = await getAgent().patch(`/football-events/${eventId}`).send({
        homeTeamName: 'Arsenal FC Update', // would violate XOR because homeTeamId is set on event
      });
      expect(res.status).toBe(400);
    });

    it('should reject update if venueId is set to null', async () => {
      const res = await getAgent().patch(`/football-events/${eventId}`).send({
        venueId: null,
      });
      expect(res.status).toBe(400);
    });

    it('should reject update if venueId does not exist', async () => {
      const res = await getAgent().patch(`/football-events/${eventId}`).send({
        venueId: '00000000-0000-0000-0000-000000000000',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('referenced venue does not exist');
    });

    it('should reject update if competitionId does not exist', async () => {
      const res = await getAgent().patch(`/football-events/${eventId}`).send({
        competitionId: '00000000-0000-0000-0000-000000000000',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('referenced competition does not exist');
    });

    it('should reject update if homeTeamId does not exist', async () => {
      const res = await getAgent().patch(`/football-events/${eventId}`).send({
        homeTeamId: '00000000-0000-0000-0000-000000000000',
        homeTeamName: null, // clear name to maintain XOR
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('referenced home team does not exist');
    });

    it('should successfully update team reference using partial state merge', async () => {
      const res = await getAgent().patch(`/football-events/${eventId}`).send({
        homeTeamId: null,
        homeTeamName: 'Arsenal Update FC',
      });
      expect(res.status).toBe(200);
      expect(res.body.home_team_id).toBeNull();
      expect(res.body.home_team_name).toBe('Arsenal Update FC');
    });
  });

  describe('GET /football-events - querying and filters', () => {
    it('should filter events by slug query parameter', async () => {
      const res = await getAgent().get('/football-events?slug=arsenal-vs-chelsea-2026-10-15');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].event_number).toBe(20000);
    });

    it('should filter events by competitionId', async () => {
      const res = await getAgent().get(`/football-events?competitionId=${competitionId}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });

    it('should filter events by venueId', async () => {
      const res = await getAgent().get(`/football-events?venueId=${venueId}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });
  });
});
