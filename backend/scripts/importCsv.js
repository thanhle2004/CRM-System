require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { parse } = require('csv-parse/sync');

const Customer = require('../src/models/Customer');
const User = require('../src/models/User');
const { computeEngagementScore, computeChurnScore } = require('../src/utils/scoring');

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((arg) => arg.startsWith('--'))
    .map((arg) => {
      const [key, value] = arg.replace('--', '').split('=');
      return [key, value ?? true];
    })
);

if (!args.file) {
  console.error('Usage: node scripts/importCsv.js --file=./data/customers.csv [--drop]');
  process.exit(1);
}

const CSV_PATH = path.resolve(args.file);
const BATCH_SIZE = 500;

const SEED_USERS = [
  {
    name: 'Admin',
    email: 'admin@sample.com',
    password: 'admin@123',
    role: 'admin',
  },
];

const COLUMN_MAP = {
  id: null,
  full_name: 'full_name',
  first_name: 'first_name',
  last_name: 'last_name',
  email: 'email',
  phone: 'phone',
  country: 'country',
  city: 'city',
  age: 'age',
  gender: 'gender',
  membership_years: 'membership_years',
  login_frequency: 'login_frequency',
  session_duration_avg: 'session_duration_avg',
  pages_per_session: 'pages_per_session',
  cart_abandonment_rate: 'cart_abandonment_rate',
  wishlist_items: 'wishlist_items',
  total_purchases: 'total_purchases',
  average_order_value: 'average_order_value',
  days_since_last_purchase: 'days_since_last_purchase',
  discount_usage_rate: 'discount_usage_rate',
  returns_rate: 'returns_rate',
  email_open_rate: 'email_open_rate',
  customer_service_calls: 'customer_service_calls',
  product_reviews_written: 'product_reviews_written',
  social_media_engagement_score: 'social_media_engagement_score',
  mobile_app_usage: 'mobile_app_usage',
  payment_method_diversity: 'payment_method_diversity',
  lifetime_value: 'lifetime_value',
  credit_balance: 'credit_balance',
  churned: 'churned',
  signup_quarter: 'signup_quarter',
};

const NUMBER_FIELDS = new Set([
  'age', 'membership_years', 'login_frequency', 'session_duration_avg',
  'pages_per_session', 'cart_abandonment_rate', 'wishlist_items',
  'total_purchases', 'average_order_value', 'days_since_last_purchase',
  'discount_usage_rate', 'returns_rate', 'email_open_rate',
  'customer_service_calls', 'product_reviews_written',
  'social_media_engagement_score', 'mobile_app_usage',
  'payment_method_diversity', 'lifetime_value', 'credit_balance',
]);

const BOOLEAN_FIELDS = new Set(['churned']);

function castRow(raw) {
  const doc = {};

  for (const [csvCol, schemaField] of Object.entries(COLUMN_MAP)) {
    if (!schemaField) continue;

    const rawKey = Object.keys(raw).find(
      (key) => key.trim().toLowerCase() === csvCol.toLowerCase()
    );

    if (rawKey === undefined) continue;

    const value = raw[rawKey];
    if (value === '' || value === 'NULL' || value === 'null' || value === undefined) {
      doc[schemaField] = null;
      continue;
    }

    if (BOOLEAN_FIELDS.has(schemaField)) {
      doc[schemaField] = value === '1' || value === 'true' || value === 'True' || value === true;
      continue;
    }

    if (NUMBER_FIELDS.has(schemaField)) {
      const numberValue = Number(value);
      doc[schemaField] = Number.isNaN(numberValue) ? null : numberValue;
      continue;
    }

    doc[schemaField] = String(value).trim();
  }

  if (!doc.full_name && doc.first_name && doc.last_name) {
    doc.full_name = `${doc.first_name} ${doc.last_name}`;
  }

  return doc;
}

async function seedAdminUsers() {
  const existingUsers = await User.find(
    { email: { $in: SEED_USERS.map((user) => user.email) } },
    { email: 1, _id: 0 }
  ).lean();

  const existingEmails = new Set(existingUsers.map((user) => user.email));
  const usersToCreate = [];

  for (const user of SEED_USERS) {
    if (existingEmails.has(user.email)) continue;

    usersToCreate.push({
      name: user.name,
      email: user.email,
      password_hash: await bcrypt.hash(user.password, 12),
      role: user.role,
    });
  }

  if (usersToCreate.length === 0) {
    console.log('[Seeder] Admin users already exist');
    return;
  }

  await User.insertMany(usersToCreate, { ordered: true });
  console.log(`[Seeder] Seeded ${usersToCreate.length} admin users`);
  console.log('[Seeder] Admin credentials:');
  SEED_USERS.forEach((user) => {
    console.log(`  - ${user.email} / ${user.password}`);
  });
}

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('Error: MONGO_URI is not defined in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);
  console.log('[Seeder] Connected to MongoDB');

  if (args.drop) {
    await Customer.deleteMany({});
    await User.deleteMany({});
    console.log('[Seeder] Dropped existing customers and users');
  }

  await seedAdminUsers();

  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const firstLine = raw.split('\n')[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    delimiter,
    skip_records_with_error: true,
  });

  console.log(`[Seeder] Parsed ${records.length} rows from CSV`);

  if (records.length === 0) {
    console.warn('[Seeder] No records found in CSV. Check delimiter or file content.');
    await mongoose.connection.close();
    return;
  }

  console.log('[Debug] Headers detected:', Object.keys(records[0]));
  const firstDoc = castRow(records[0]);
  console.log('[Debug] First doc mapped:', firstDoc.email ? firstDoc : 'Mapping failed. Check CSV headers');

  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const docs = batch
      .map((row) => {
        const doc = castRow(row);

        if (!doc.email || !doc.full_name || !doc.first_name || !doc.last_name) {
          skipped += 1;
          if (errors.length < 3) {
            errors.push('Missing required fields: email/full_name/first_name/last_name');
          }
          return null;
        }

        doc.engagement_score = computeEngagementScore(doc);
        const { score, risk } = computeChurnScore(doc);
        doc.churn_score = score;
        doc.churn_risk = risk;
        return doc;
      })
      .filter((doc) => doc !== null);

    if (docs.length === 0) continue;

    try {
      const result = await Customer.insertMany(docs, { ordered: false });
      inserted += result.length;
    } catch (err) {
      if (err.insertedDocs) inserted += err.insertedDocs.length;
      if (err.writeErrors) {
        skipped += err.writeErrors.length;
        if (errors.length < 3) {
          errors.push(err.writeErrors[0]?.errmsg || err.writeErrors[0]?.message || 'Write error');
        }
      } else {
        throw err;
      }
    }

    const pct = Math.round(((i + batch.length) / records.length) * 100);
    process.stdout.write(`\r[Seeder] Progress: ${pct}% (${inserted} inserted)`);
  }

  console.log(`\n[Seeder] Done - Inserted: ${inserted}, Skipped: ${skipped}`);
  if (errors.length) {
    console.warn('[Seeder] Sample errors:', errors);
  }

  await mongoose.connection.close();
  process.exit(0);
}

main().catch((err) => {
  console.error('[Seeder] Fatal error:', err);
  process.exit(1);
});
