import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeApp,
  getAgent,
  initApp,
  truncateTables,
} from './helpers/app.helper';

describe('Teams E2E', () => {
  beforeAll(async () => {
    await initApp();
    await truncateTables();
  });

  afterAll(async () => {
    await truncateTables();
    await closeApp();
  });

  it('GET /teams — empty DB returns 200 []', async () => {
    const res = await getAgent().get('/teams');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /teams — valid body returns 201 with Team shape and normalized fields', async () => {
    const res = await getAgent().post('/teams').send({
      code: 'liv',
      slug: 'liverpool',
      name: 'ליברפול',
      nameEn: 'Liverpool',
      isPopular: true,
      primaryColor: '#c8102e',
      secondaryColor: '#00b2a9',
      shirtImageUrl: 'https://media.p1travel.com/Liverpool.svg',
      imageUrl: 'https://res.cloudinary.com/liverpool.jpg',
      apiFootballId: 40,
      seoContent: {
        metaTitle: 'Liverpool Tickets',
        metaDescription: 'Buy tickets for Liverpool FC matches.',
        heroTitle: 'Liverpool FC Tickets',
        heroSubtitle: 'Matches at Anfield',
        blocks: [
          {
            type: 'standard',
            title: 'Tickets Info',
            body: 'Information about ticketing.',
          },
        ],
      },
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      code: 'LIV', // Normalized to uppercase
      slug: 'liverpool',
      name: 'ליברפול',
      name_en: 'Liverpool', // Mapped to snake_case in db
      is_popular: true,
      primary_color: '#C8102E', // Normalized to uppercase
      secondary_color: '#00B2A9', // Normalized to uppercase
      shirt_image_url: 'https://media.p1travel.com/Liverpool.svg',
      image_url: 'https://res.cloudinary.com/liverpool.jpg',
      api_football_id: 40,
    });
    expect(res.body.created_at).toBeDefined();
    expect(res.body.updated_at).toBeDefined();
    expect(res.body.seo_content).toEqual({
      metaTitle: 'Liverpool Tickets',
      metaDescription: 'Buy tickets for Liverpool FC matches.',
      heroTitle: 'Liverpool FC Tickets',
      heroSubtitle: 'Matches at Anfield',
      blocks: [
        {
          type: 'standard',
          title: 'Tickets Info',
          body: 'Information about ticketing.',
        },
      ],
    });
  });

  it('GET /teams/:slug — existing slug returns 200 with matching Team', async () => {
    const res = await getAgent().get('/teams/liverpool');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      slug: 'liverpool',
      code: 'LIV',
    });
  });

  it('GET /teams/:slug — unknown slug returns 404', async () => {
    const res = await getAgent().get('/teams/manchester-united');
    expect(res.status).toBe(404);
  });

  it('POST /teams — duplicate slug returns 409', async () => {
    const res = await getAgent().post('/teams').send({
      code: 'lfc',
      slug: 'liverpool',
      name: 'ליברפול ב',
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('slug already exists');
  });

  it('POST /teams — duplicate api_football_id returns 409', async () => {
    const res = await getAgent().post('/teams').send({
      code: 'che',
      slug: 'chelsea',
      name: 'צ׳לסי',
      apiFootballId: 40, // Duplicate of Liverpool
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('api_football_id already exists');
  });

  it('POST /teams — invalid code constraints return 400', async () => {
    // Non-alphabetic code
    let res = await getAgent().post('/teams').send({
      code: '123',
      slug: 'chelsea',
      name: 'צ׳לסי',
    });
    expect(res.status).toBe(400);

    // Code too long
    res = await getAgent().post('/teams').send({
      code: 'CHEL',
      slug: 'chelsea',
      name: 'צ׳לסי',
    });
    expect(res.status).toBe(400);

    // Code too short
    res = await getAgent().post('/teams').send({
      code: 'CH',
      slug: 'chelsea',
      name: 'צ׳לסי',
    });
    expect(res.status).toBe(400);
  });

  it('POST /teams — invalid color constraint returns 400', async () => {
    // Missing leading '#'
    let res = await getAgent().post('/teams').send({
      code: 'CHE',
      slug: 'chelsea',
      name: 'צ׳לסי',
      primaryColor: '034694',
    });
    expect(res.status).toBe(400);

    // Invalid characters
    res = await getAgent().post('/teams').send({
      code: 'CHE',
      slug: 'chelsea',
      name: 'צ׳לסי',
      primaryColor: '#03469G',
    });
    expect(res.status).toBe(400);

    // Too short
    res = await getAgent().post('/teams').send({
      code: 'CHE',
      slug: 'chelsea',
      name: 'צ׳לסי',
      primaryColor: '#03469',
    });
    expect(res.status).toBe(400);
  });

  describe('GET /teams - filtering and searching', () => {
    beforeAll(async () => {
      // Seed two more teams
      await getAgent().post('/teams').send({
        code: 'ars',
        slug: 'arsenal',
        name: 'ארסנל',
        nameEn: 'Arsenal',
        isPopular: false,
      });

      await getAgent().post('/teams').send({
        code: 'mci',
        slug: 'manchester-city',
        name: 'מנצ׳סטר סיטי',
        nameEn: 'Manchester City',
        isPopular: true,
      });
    });

    it('returns all 3 seeded teams', async () => {
      const res = await getAgent().get('/teams');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });

    it('filters by popularOnly (?popular=true)', async () => {
      const res = await getAgent().get('/teams?popular=true');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2); // Liverpool and Man City
      const slugs = res.body.map((t: any) => t.slug);
      expect(slugs).toContain('liverpool');
      expect(slugs).toContain('manchester-city');
      expect(slugs).not.toContain('arsenal');
    });

    it('searches teams by Hebrew name (?search=ארסנל)', async () => {
      const res = await getAgent().get('/teams?search=ארסנל');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].slug).toBe('arsenal');
    });

    it('searches teams by English name case-insensitively (?search=city)', async () => {
      const res = await getAgent().get('/teams?search=city');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].slug).toBe('manchester-city');
    });

    it('searches teams by slug case-insensitively (?search=pool)', async () => {
      const res = await getAgent().get('/teams?search=pool');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].slug).toBe('liverpool');
    });

    it('combines search and popular (?search=chester&popular=true)', async () => {
      const res = await getAgent().get('/teams?search=chester&popular=true');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].slug).toBe('manchester-city');
    });
  });
});
