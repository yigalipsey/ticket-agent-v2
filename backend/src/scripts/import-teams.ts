import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { teamsTable } from '../features/teams/teams.schema';

// Load env from backend/.env
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

async function run() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not defined in environment.');
    process.exit(1);
  }

  const jsonFilePath = path.resolve(__dirname, '../../../temp-data/teams/cleaned_teams.json');
  if (!fs.existsSync(jsonFilePath)) {
    console.error(`JSON file not found at: ${jsonFilePath}`);
    process.exit(1);
  }

  console.log(`Reading teams from ${jsonFilePath}...`);
  const rawData = fs.readFileSync(jsonFilePath, 'utf8');
  const jsonData = JSON.parse(rawData);

  let teams: any[] = [];
  if (Array.isArray(jsonData)) {
    teams = jsonData;
  } else {
    teams = Object.values(jsonData).flat();
  }

  console.log('Connecting to database client...');
  const queryClient = postgres(databaseUrl, { ssl: 'require', max: 1 });
  console.log('Initializing Drizzle...');
  const db = drizzle(queryClient);

  try {
    let processedCount = 0;

    for (const team of teams) {
      if (!team.slug || !team.name) {
        console.warn(`Skipping invalid team record: ${JSON.stringify(team)}`);
        continue;
      }

      console.log(`Processing team ${processedCount + 1}/${teams.length}: ${team.slug}`);

      const mapped = {
        name: team.name,
        name_en: team.name_en || null,
        code: (team.code || '').substring(0, 3).toUpperCase(),
        slug: team.slug,
        shirt_image_url: team.shirtImageUrl || team.shirt_image_url || null,
        primary_color: team.primary_color || null,
        secondary_color: team.secondary_color || null,
        api_football_id: team.api_football_id !== undefined && team.api_football_id !== null ? Number(team.api_football_id) : null,
        is_popular: !!team.is_popular,
        is_national_team: !!team.is_national_team,
      };

      if (!mapped.code || mapped.code.length !== 3) {
        mapped.code = (mapped.name_en || 'TEM').substring(0, 3).toUpperCase().padEnd(3, 'X');
      }

      let existingTeam: any = null;

      // Find by slug first
      const bySlug = await db.select()
        .from(teamsTable)
        .where(eq(teamsTable.slug, mapped.slug))
        .limit(1);

      if (bySlug.length > 0) {
        existingTeam = bySlug[0];
      } else if (mapped.api_football_id !== null) {
        // If not found by slug, search by api_football_id
        const byApiId = await db.select()
          .from(teamsTable)
          .where(eq(teamsTable.api_football_id, mapped.api_football_id))
          .limit(1);
        if (byApiId.length > 0) {
          existingTeam = byApiId[0];
        }
      }

      if (existingTeam) {
        await db.update(teamsTable)
          .set({
            name: mapped.name,
            name_en: mapped.name_en,
            code: mapped.code,
            slug: mapped.slug,
            shirt_image_url: mapped.shirt_image_url,
            primary_color: mapped.primary_color,
            secondary_color: mapped.secondary_color,
            api_football_id: mapped.api_football_id,
            is_popular: mapped.is_popular,
            is_national_team: mapped.is_national_team,
            updated_at: new Date(),
          })
          .where(eq(teamsTable.id, existingTeam.id));
      } else {
        await db.insert(teamsTable).values(mapped);
      }

      processedCount++;
    }

    console.log(`Successfully imported/updated ${processedCount} teams.`);
  } catch (error) {
    console.error('Error importing teams:', error);
  } finally {
    console.log('Closing client connection...');
    await queryClient.end();
    console.log('Database connection closed.');
  }
}

run();
