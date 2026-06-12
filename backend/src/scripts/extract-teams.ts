import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file if available
function loadEnv() {
  const possiblePaths = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend/.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(__dirname, '../../../.env'),
  ];
  for (const envPath of possiblePaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const firstEqual = trimmed.indexOf('=');
            if (firstEqual > 0) {
              const key = trimmed.substring(0, firstEqual).trim();
              const val = trimmed.substring(firstEqual + 1).trim();
              // strip quotes if any
              let cleanVal = val;
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                cleanVal = val.substring(1, val.length - 1);
              }
              if (!process.env[key]) {
                process.env[key] = cleanVal;
              }
            }
          }
        }
        console.log(`Loaded environment variables from ${envPath}`);
        break;
      } catch (err) {
        console.warn(`Failed to read env file at ${envPath}:`, err);
      }
    }
  }
}

// Generate web-standard SEO slug
function generateSlug(nameEn: string | undefined | null): string {
  if (!nameEn) return '';
  let slug = nameEn.toLowerCase().trim();
  // replace spaces/underscores with a single hyphen
  slug = slug.replace(/[\s_]+/g, '-');
  // remove any character that is not a-z, 0-9, or a-hyphen
  slug = slug.replace(/[^a-z0-9\-]/g, '');
  // replace multiple consecutive hyphens with a single hyphen
  slug = slug.replace(/-+/g, '-');
  // strip leading/trailing hyphens
  slug = slug.replace(/^-+|-+$/g, '');
  return slug;
}

async function run() {
  loadEnv();

  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) {
    console.error('Error: MONGO_URL environment variable is not defined.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(mongoUrl);

  try {
    await client.connect();
    const db = client.db();
    console.log(`Successfully connected to database: ${db.databaseName}`);

    const teamsCollection = db.collection('teams');
    console.log('Fetching teams from collection...');
    const dbTeams = await teamsCollection.find({}).toArray();
    console.log(`Found ${dbTeams.length} teams in database.`);

    const cleanedTeams: any[] = [];
    const slugsSet = new Set<string>();

    for (const team of dbTeams) {
      const name = team.name || '';
      const nameEn = team.name_en || '';
      
      // Code validation and fallback
      let code = typeof team.code === 'string' ? team.code.trim().toUpperCase() : '';
      if (code.length !== 3) {
        code = nameEn.substring(0, 3).toUpperCase();
      }

      // Safe integer extraction
      const apiFootballVal = team.externalIds?.apiFootball;
      const api_football_id = (apiFootballVal !== undefined && apiFootballVal !== null)
        ? parseInt(String(apiFootballVal), 10)
        : null;

      const primary_color = team.primaryColor || null;
      const secondary_color = team.secondaryColor || null;
      const is_popular = typeof team.isPopular === 'boolean' ? team.isPopular : false;
      const shirtImageUrl = team.shirtImageUrl || team.shirt_image_url || null;

      const countryEn = team.country_en;
      const is_national_team = (nameEn && countryEn && nameEn.trim().toLowerCase() === countryEn.trim().toLowerCase()) ? true : false;

      // Determine competition_slug dynamically
      let competition_slug = 'europe';
      if (countryEn === 'Spain') {
        competition_slug = 'la-liga';
      } else if (countryEn === 'England') {
        competition_slug = 'premier-league';
      } else if (countryEn === 'Italy') {
        competition_slug = 'serie-a';
      } else if (countryEn === 'Germany') {
        competition_slug = 'bundesliga';
      } else if (countryEn === 'France') {
        competition_slug = 'ligue-1';
      }

      // Slug generation
      const slug = generateSlug(nameEn);
      if (slug) {
        slugsSet.add(slug);
      }

      cleanedTeams.push({
        name,
        name_en: nameEn,
        slug,
        code,
        api_football_id,
        primary_color,
        secondary_color,
        is_popular,
        is_national_team,
        competition_slug,
        shirtImageUrl,
      });
    }

    // Resolve directory paths
    let baseDir = process.cwd();
    if (!fs.existsSync(path.join(baseDir, 'temp-data')) && fs.existsSync(path.join(baseDir, '../temp-data'))) {
      baseDir = path.resolve(baseDir, '..');
    }
    const outputDir = path.join(baseDir, 'temp-data/teams');

    // Create directory programmatically if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      console.log(`Creating directory: ${outputDir}`);
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write Main Extraction File (Grouped by competition_slug)
    const groupedTeams: { [key: string]: any[] } = {};
    for (const team of cleanedTeams) {
      const key = team.competition_slug || 'europe';
      if (!groupedTeams[key]) {
        groupedTeams[key] = [];
      }
      groupedTeams[key].push(team);
    }

    const cleanedTeamsPath = path.join(outputDir, 'cleaned_teams.json');
    fs.writeFileSync(cleanedTeamsPath, JSON.stringify(groupedTeams, null, 2), 'utf8');
    console.log(`Successfully wrote grouped cleaned teams to: ${cleanedTeamsPath}`);

    // Write Slugs-Only File (now containing both api_football_id and slug)
    const slugsOnlyPath = path.join(outputDir, 'slugs_only.json');
    const slugMapping = cleanedTeams.map(t => ({
      api_football_id: t.api_football_id,
      slug: t.slug
    }));
    fs.writeFileSync(slugsOnlyPath, JSON.stringify(slugMapping, null, 2), 'utf8');
    console.log(`Successfully wrote ${slugMapping.length} entries to: ${slugsOnlyPath}`);

  } catch (error) {
    console.error('An error occurred during extraction:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

run();
