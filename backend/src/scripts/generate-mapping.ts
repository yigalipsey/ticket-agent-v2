import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  const mongoUrl = 'mongodb+srv://yigalipsey:iGyGLlIePMRXMzO1@ticketagentcluster.koqkrqx.mongodb.net/ticket-agent?retryWrites=true&w=majority&appName=TicketAgentCluster';
  const baseDir = path.resolve(__dirname, '../../../temp-data/teams');

  console.log('Connecting to MongoDB...');
  const client = new MongoClient(mongoUrl);
  try {
    await client.connect();
    const db = client.db();
    console.log(`Connected to database: ${db.databaseName}`);
    
    // Fetch all suppliers
    const suppliersCol = db.collection('suppliers');
    const suppliers = await suppliersCol.find({}).toArray();
    console.log(`Found ${suppliers.length} suppliers in database.`);

    // Fetch all teams
    const teamsCol = db.collection('teams');
    const dbTeams = await teamsCol.find({}).toArray();
    console.log(`Found ${dbTeams.length} total teams.`);

    for (const supplier of suppliers) {
      const supplierId = supplier._id.toString();
      
      // Determine folder name
      let folderName = '';
      if (supplierId === '692c5e80270da1b2ea057dd9') {
        folderName = '365';
      } else {
        const candidate = supplier.externalIds?.internalCode || supplier.internalCode || supplier.slug || supplier.nameEn || supplier.name || supplierId;
        folderName = String(candidate).trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '_');
      }

      const targetDir = path.join(baseDir, folderName);
      const targetFile = path.join(targetDir, 'mapping.json');

      const mappings: Record<string, { slug: string; name: string; supplierTeamName: string; apiFootballId: number | null }> = {};

      for (const team of dbTeams) {
        const suppliersInfo = team.suppliersInfo || [];
        for (const match of suppliersInfo) {
          const refStr = match.supplierRef ? match.supplierRef.toString() : '';
          if (refStr === supplierId) {
            const extId = match.supplierExternalId || match.supplierTeamId || match.supplierTeamName || '';
            if (extId) {
              mappings[extId] = {
                slug: team.slug || '',
                name: team.name || '',
                supplierTeamName: match.supplierTeamName || '',
                apiFootballId: team.externalIds?.apiFootball !== undefined && team.externalIds?.apiFootball !== null 
                  ? Number(team.externalIds.apiFootball) 
                  : null
              };
            }
          }
        }
      }

      const count = Object.keys(mappings).length;
      if (count > 0) {
        // Ensure directory exists
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // Write to file
        fs.writeFileSync(targetFile, JSON.stringify(mappings, null, 2), 'utf8');
        console.log(`Supplier "${supplier.name}" -> Directory "${folderName}": extracted ${count} mappings.`);
      } else {
        console.log(`Supplier "${supplier.name}" -> Directory "${folderName}": 0 mappings (skipped).`);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}
run();
