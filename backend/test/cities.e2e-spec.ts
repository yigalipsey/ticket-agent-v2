import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  closeApp,
  getAgent,
  initApp,
  truncateTables,
} from './helpers/app.helper';

describe('Cities E2E', () => {
  let countryId: number;

  beforeAll(async () => {
    await initApp();
    await truncateTables();

    const res = await getAgent().post('/countries').send({
      name: 'גרמניה',
      name_en: 'Germany',
      slug: 'germany',
    });
    countryId = (res.body as { id: number }).id;
  });

  afterAll(async () => {
    await truncateTables();
    await closeApp();
  });

  it('GET /cities — empty DB returns 200 []', async () => {
    const res = await getAgent().get('/cities');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /cities?popular=true — returns only popular cities', async () => {
    await getAgent().post('/cities').send({
      slug: 'popular-city',
      name: 'עיר פופולרית',
      countryId,
      isPopular: true,
    });
    await getAgent().post('/cities').send({
      slug: 'regular-city',
      name: 'עיר רגילה',
      countryId,
    });

    const allRes = await getAgent().get('/cities');
    expect(allRes.status).toBe(200);
    expect(allRes.body).toHaveLength(2);

    const popularRes = await getAgent().get('/cities?popular=true');
    expect(popularRes.status).toBe(200);
    expect(popularRes.body).toHaveLength(1);
    expect(popularRes.body[0]).toMatchObject({
      slug: 'popular-city',
      is_popular: true,
    });
  });

  it('POST /cities — valid body returns 201 with City shape', async () => {
    const res = await getAgent().post('/cities').send({
      slug: 'berlin',
      name: 'ברלין',
      name_en: 'Berlin',
      countryId,
    });
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      slug: 'berlin',
      name: 'ברלין',
      country_id: countryId,
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.created_at).toBeDefined();
  });

  it('GET /cities/:slug — existing slug returns 200 with matching City', async () => {
    const res = await getAgent().get('/cities/berlin');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      slug: 'berlin',
      name: 'ברלין',
      country_id: countryId,
    });
  });

  it('GET /cities/:slug — unknown slug returns 404', async () => {
    const res = await getAgent().get('/cities/nonexistent-city');
    expect(res.status).toBe(404);
  });

  it('POST /cities — non-existent countryId returns 400', async () => {
    const res = await getAgent().post('/cities').send({
      slug: 'munich',
      name: 'מינכן',
      countryId: 999999,
    });
    expect(res.status).toBe(400);
  });

  it('POST /cities — missing name returns 400 with validation error', async () => {
    const res = await getAgent().post('/cities').send({
      slug: 'hamburg',
      countryId,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('POST /cities — valid seoContent and faqs returns 201 with nested JSONB', async () => {
    const seoContent = {
      metaTitle: 'כרטיסים לברלין',
      metaDescription: 'מצאו את הכרטיסים הטובים ביותר לברלין',
      heroTitle: 'ברלין מחכה לכם',
      heroSubtitle: 'הופעות, ספורט ואירועים',
      blocks: [
        {
          type: 'general_history',
          title: 'למה ברלין?',
          body: 'עיר תרבותית עם הופעות בלתי נגמרות.',
        },
        {
          type: 'nightlife',
          title: 'חיי לילה',
          body: 'מועדונים וברים לכל טעם.',
        },
      ],
    };
    const faqs = [
      { question: 'איך מזמינים?', answer: 'בוחרים אירוע ומשלמים באשראי.', order: 1 },
    ];

    const res = await getAgent().post('/cities').send({
      slug: 'berlin-seo',
      name: 'ברלין',
      countryId,
      seoContent,
      faqs,
    });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      slug: 'berlin-seo',
      seo_content: seoContent,
      faqs,
    });
  });

  it('POST /cities — dynamic dashboard block types are accepted', async () => {
    const seoContent = {
      metaTitle: 'כרטיסים',
      metaDescription: 'תיאור',
      heroTitle: 'גיבור',
      heroSubtitle: 'כותרת משנה',
      blocks: [
        { type: 'israeli_players', title: 'שחקנים ישראלים', body: 'רשימת שחקנים.' },
        { type: 'stadium_info', title: 'האצטדיון', body: 'פרטי האצטדיון.' },
      ],
    };

    const res = await getAgent().post('/cities').send({
      slug: 'dynamic-blocks',
      name: 'עיר',
      countryId,
      seoContent,
    });

    expect(res.status).toBe(201);
    expect(res.body.seo_content).toEqual(seoContent);
  });

  it('POST /cities — empty seoContent block type returns 400', async () => {
    const res = await getAgent().post('/cities').send({
      slug: 'empty-block-type',
      name: 'עיר',
      countryId,
      seoContent: {
        metaTitle: 'כותרת',
        metaDescription: 'תיאור',
        heroTitle: 'גיבור',
        heroSubtitle: 'כותרת משנה',
        blocks: [{ type: '', title: 'בלוק', body: 'תוכן' }],
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });

  it('POST /cities — seoContent missing blocks returns 400', async () => {
    const res = await getAgent().post('/cities').send({
      slug: 'incomplete-seo',
      name: 'עיר',
      countryId,
      seoContent: {
        metaTitle: 'כותרת',
        metaDescription: 'תיאור',
        heroTitle: 'גיבור',
        heroSubtitle: 'כותרת משנה',
      },
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toBeDefined();
  });
});
