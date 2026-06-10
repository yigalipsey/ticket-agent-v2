import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeApp,
  getAgent,
  initApp,
  truncateTables,
} from './helpers/app.helper';

describe('Venues E2E', () => {
  let countryId: number;
  let cityId: string;

  beforeAll(async () => {
    await initApp();
    await truncateTables();

    // Seed country
    const countryRes = await getAgent().post('/countries').send({
      name: 'אנגליה',
      name_en: 'England',
      slug: 'england',
    });
    countryId = (countryRes.body as { id: number }).id;

    // Seed city
    const cityRes = await getAgent().post('/cities').send({
      slug: 'london',
      name: 'לונדון',
      name_en: 'London',
      countryId,
    });
    cityId = (cityRes.body as { id: string }).id;
  });

  afterAll(async () => {
    await truncateTables();
    await closeApp();
  });

  it('GET /venues — empty DB returns 200 []', async () => {
    const res = await getAgent().get('/venues');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('POST /venues — valid body returns 201 with Venue shape', async () => {
    const res = await getAgent().post('/venues').send({
      slug: 'wembley-stadium',
      name: 'אצטדיון וומבלי',
      nameEn: 'Wembley Stadium',
      description: 'The national stadium',
      address: 'דרך וומבלי',
      addressEn: 'Wembley Way',
      capacity: 90000,
      latitude: '51.556021',
      longitude: '-0.279519',
      imageUrl: 'https://example.com/wembley.jpg',
      bannerUrl: 'https://example.com/wembley-banner.jpg',
      mapUrl: 'https://example.com/wembley-map.jpg',
      cityId,
      isPopular: true,
      apiFootballId: 101,
      seoContent: {
        metaTitle: 'Wembley Tickets',
        metaDescription: 'Buy tickets for Wembley matches.',
        heroTitle: 'Wembley Stadium',
        heroSubtitle: 'National Arena',
        blocks: [
          {
            type: 'standard',
            title: 'Info',
            body: 'Stadium info',
          },
        ],
      },
      faqs: [
        { question: 'Parking?', answer: 'Limited spaces.', order: 1 },
      ],
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      slug: 'wembley-stadium',
      name: 'אצטדיון וומבלי',
      name_en: 'Wembley Stadium',
      description: 'The national stadium',
      address: 'דרך וומבלי',
      address_en: 'Wembley Way',
      capacity: 90000,
      latitude: '51.556021',
      longitude: '-0.279519',
      image_url: 'https://example.com/wembley.jpg',
      banner_url: 'https://example.com/wembley-banner.jpg',
      map_url: 'https://example.com/wembley-map.jpg',
      city_id: cityId,
      is_popular: true,
      api_football_id: 101,
      seo_content: {
        metaTitle: 'Wembley Tickets',
        metaDescription: 'Buy tickets for Wembley matches.',
        heroTitle: 'Wembley Stadium',
        heroSubtitle: 'National Arena',
        blocks: [
          {
            type: 'standard',
            title: 'Info',
            body: 'Stadium info',
          },
        ],
      },
      faqs: [
        { question: 'Parking?', answer: 'Limited spaces.', order: 1 },
      ],
    });
  });

  it('GET /venues/:slug — existing slug returns 200 with matching Venue', async () => {
    const res = await getAgent().get('/venues/wembley-stadium');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      slug: 'wembley-stadium',
      name: 'אצטדיון וומבלי',
    });
  });

  it('GET /venues/:slug — unknown slug returns 404', async () => {
    const res = await getAgent().get('/venues/emirates-stadium');
    expect(res.status).toBe(404);
  });

  it('POST /venues — duplicate slug returns 409', async () => {
    const res = await getAgent().post('/venues').send({
      slug: 'wembley-stadium',
      name: 'וומבלי החדש',
      cityId,
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('slug already exists');
  });

  it('POST /venues — duplicate api_football_id returns 409', async () => {
    const res = await getAgent().post('/venues').send({
      slug: 'wembley-alternative',
      name: 'וומבלי אלטרנטיבי',
      cityId,
      apiFootballId: 101, // Duplicate of Wembley Stadium
    });
    expect(res.status).toBe(409);
    expect(res.body.message).toContain('api_football_id already exists');
  });

  it('POST /venues — non-existent cityId returns 400', async () => {
    const res = await getAgent().post('/venues').send({
      slug: 'stanford-bridge',
      name: 'סטנפורד ברידג׳',
      cityId: '00000000-0000-0000-0000-000000000000',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toContain('referenced city does not exist');
  });

  describe('GET /venues - filtering and searching', () => {
    let secondCityId: string;

    beforeAll(async () => {
      // Seed second city
      const cityRes = await getAgent().post('/cities').send({
        slug: 'manchester',
        name: 'מנצ׳סטר',
        name_en: 'Manchester',
        countryId,
      });
      secondCityId = (cityRes.body as { id: string }).id;

      // Seed venues
      await getAgent().post('/venues').send({
        slug: 'etihad-stadium',
        name: 'אצטדיון איתיחאד',
        nameEn: 'Etihad Stadium',
        cityId: secondCityId,
        isPopular: true,
      });

      await getAgent().post('/venues').send({
        slug: 'old-trafford',
        name: 'אולד טראפורד',
        nameEn: 'Old Trafford',
        cityId: secondCityId,
        isPopular: false,
      });
    });

    it('returns all 3 venues', async () => {
      const res = await getAgent().get('/venues');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
    });

    it('filters by popularOnly (?popular=true)', async () => {
      const res = await getAgent().get('/venues?popular=true');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2); // Wembley and Etihad
      const slugs = res.body.map((v: any) => v.slug);
      expect(slugs).toContain('wembley-stadium');
      expect(slugs).toContain('etihad-stadium');
      expect(slugs).not.toContain('old-trafford');
    });

    it('filters by cityId (?cityId=...)', async () => {
      const res = await getAgent().get(`/venues?cityId=${secondCityId}`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2); // Etihad and Old Trafford
      const slugs = res.body.map((v: any) => v.slug);
      expect(slugs).toContain('etihad-stadium');
      expect(slugs).toContain('old-trafford');
      expect(slugs).not.toContain('wembley-stadium');
    });

    it('searches venues by Hebrew name (?search=איתיחאד)', async () => {
      const res = await getAgent().get('/venues?search=איתיחאד');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].slug).toBe('etihad-stadium');
    });

    it('searches venues by English name (?search=trafford)', async () => {
      const res = await getAgent().get('/venues?search=trafford');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].slug).toBe('old-trafford');
    });

    it('combines search and popular (?search=stadium&popular=true)', async () => {
      const res = await getAgent().get('/venues?search=stadium&popular=true');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2); // Wembley Stadium and Etihad Stadium are popular
      const slugs = res.body.map((v: any) => v.slug);
      expect(slugs).toContain('wembley-stadium');
      expect(slugs).toContain('etihad-stadium');
    });
  });
});
