import { createClient } from '@base44/sdk';
import { writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'data');
const RAW_DIR = resolve(DATA_DIR, 'base44-raw');

mkdirSync(RAW_DIR, { recursive: true });

const APP_ID = '68ae310c7e166df6a2a697f1';
const base44 = createClient({ appId: APP_ID });

const ENTITIES = [
  // Already pulled but re-pulling for completeness
  'Rep',
  'Station',
  // New entities from screenshots
  'FormDocument',
  'StationUpdate',
  'LawFirm',
  'Suggestion',
  'AdminAudit',
  'AppVersion',
  'AppBackup',
  'BackupSettings',
  'BackupLog',
  'RedirectRule',
  'ChangePolicy',
  'FeaturedSubscription',
  'PaymentRecord',
  'LegalUpdate',
  'Job',
  'WikiArticle',
  'ForumPost',
  'ForumReply',
  'FirmReview',
  'ArticleVersion',
  'EmailCampaign',
];

// Some entity names might be truncated in the UI — try variations
const ENTITY_ALIASES = {
  'FormDocument': ['FormDocument', 'FormDocumentTemplate', 'FormDocur'],
  'StationUpdate': ['StationUpdate', 'StationUpd', 'StationUpdates'],
  'AdminAudit': ['AdminAudit', 'AdminAuditLog', 'AdminAudi'],
  'AppVersion': ['AppVersion', 'AppVersio', 'AppVersionHistory'],
  'BackupSettings': ['BackupSettings', 'BackupSett'],
  'RedirectRule': ['RedirectRule', 'RedirectRul', 'RedirectRules'],
  'ChangePolicy': ['ChangePolicy', 'ChangePoli'],
  'FeaturedSubscription': ['FeaturedSubscription', 'FeaturedSu', 'FeaturedSub'],
  'PaymentRecord': ['PaymentRecord', 'PaymentRe', 'PaymentReceipt'],
  'LegalUpdate': ['LegalUpdate', 'LegalUpdat', 'LegalUpdates'],
  'ForumReply': ['ForumReply', 'ForumRepl', 'ForumReplies'],
  'FirmReview': ['FirmReview', 'FirmReviews'],
  'ArticleVersion': ['ArticleVersion', 'ArticleVersi'],
  'EmailCampaign': ['EmailCampaign', 'EmailCamp'],
};

async function fetchAll(entityName) {
  const LIMIT = 500;
  let skip = 0;
  const all = [];

  while (true) {
    const batch = await base44.entities[entityName].list('-created_date', LIMIT, skip);
    all.push(...batch);
    if (batch.length < LIMIT) break;
    skip += LIMIT;
  }

  return all;
}

async function tryFetch(primaryName) {
  const aliases = ENTITY_ALIASES[primaryName] || [primaryName];
  
  for (const name of aliases) {
    try {
      const data = await fetchAll(name);
      return { name, data };
    } catch {
      // Try next alias
    }
  }
  return { name: primaryName, data: null };
}

console.log('=== Base44 Full Entity Extraction ===');
console.log(`App ID: ${APP_ID}`);
console.log(`Entities to try: ${ENTITIES.length}\n`);

const results = {};
const summary = [];

for (const entity of ENTITIES) {
  process.stdout.write(`  ${entity}... `);
  const { name: resolvedName, data } = await tryFetch(entity);
  
  if (data !== null) {
    results[resolvedName] = data;
    const count = data.length;
    summary.push({ entity: resolvedName, count });
    console.log(`${count} records (as "${resolvedName}")`);
    
    // Save raw data
    writeFileSync(
      resolve(RAW_DIR, `${resolvedName}.json`),
      JSON.stringify(data, null, 2)
    );
    
    // Log fields from first record
    if (count > 0) {
      console.log(`    Fields: ${Object.keys(data[0]).join(', ')}`);
    }
  } else {
    summary.push({ entity, count: -1 });
    console.log('NOT FOUND (tried all aliases)');
  }
}

console.log('\n=== EXTRACTION SUMMARY ===\n');
console.log('Entity'.padEnd(25) + 'Records'.padEnd(10) + 'Status');
console.log('-'.repeat(50));

let totalRecords = 0;
let found = 0;
let notFound = 0;

summary.forEach(({ entity, count }) => {
  if (count >= 0) {
    console.log(entity.padEnd(25) + String(count).padEnd(10) + (count > 0 ? 'HAS DATA' : 'EMPTY'));
    totalRecords += count;
    found++;
  } else {
    console.log(entity.padEnd(25) + 'N/A'.padEnd(10) + 'NOT FOUND');
    notFound++;
  }
});

console.log('-'.repeat(50));
console.log(`Total: ${found} entities found, ${notFound} not found, ${totalRecords} total records`);
console.log(`\nRaw data saved to: data/base44-raw/`);

base44.cleanup();
console.log('\n=== DONE ===');
