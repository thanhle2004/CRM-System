/**
 * scripts/importCsv.js
 * * One-shot CSV → MongoDB seeder.
 * Cải tiến với xử lý BOM, tự động nhận diện biến môi trường và logging chi tiết.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { parse } = require('csv-parse/sync');

const Customer = require('../src/models/Customer');
const { computeEngagementScore, computeChurnScore } = require('../src/utils/scoring');

// ── Parse CLI args ─────────────────────────────────────────────────────────
const args = Object.fromEntries(
    process.argv.slice(2)
        .filter(a => a.startsWith('--'))
        .map(a => {
            const [key, val] = a.replace('--', '').split('=');
            return [key, val ?? true];
        })
);

if (!args.file) {
    console.error('❌ Usage: node scripts/importCsv.js --file=./data/customers.csv [--drop]');
    process.exit(1);
}

const CSV_PATH = path.resolve(args.file);

// ── CSV column → schema field mappings ────────────────────────────────────
const COLUMN_MAP = {
    id: null, // MongoDB tự tạo _id
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

        // Tìm key khớp (xử lý trim và case-insensitive)
        const rawKey = Object.keys(raw).find(
            k => k.trim().toLowerCase() === csvCol.toLowerCase()
        );

        if (rawKey === undefined) continue;

        let val = raw[rawKey];
        if (val === '' || val === 'NULL' || val === 'null' || val === undefined) {
            doc[schemaField] = null;
            continue;
        }

        if (BOOLEAN_FIELDS.has(schemaField)) {
            doc[schemaField] = val === '1' || val === 'true' || val === 'True' || val === true;
        } else if (NUMBER_FIELDS.has(schemaField)) {
            const n = Number(val);
            doc[schemaField] = isNaN(n) ? null : n;
        } else {
            doc[schemaField] = String(val).trim();
        }
    }

    // Fallback cho full_name
    if (!doc.full_name && doc.first_name && doc.last_name) {
        doc.full_name = `${doc.first_name} ${doc.last_name}`;
    }
    return doc;
}

const BATCH_SIZE = 500;

async function main() {
    const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

    if (!MONGO_URI) {
        console.error('❌ Error: MONGO_URI is not defined in .env');
        process.exit(1);
    }

    await mongoose.connect(MONGO_URI);
    console.log('[Seeder] ✅ Connected to MongoDB');

    if (args.drop) {
        await Customer.deleteMany({});
        console.log('[Seeder] 🗑️ Dropped existing collection');
    }

    // ── Đọc và Parse CSV ───────────────────────────────────────────────────
    const raw = fs.readFileSync(CSV_PATH, 'utf8');

    // 🔥 Detect delimiter
    const firstLine = raw.split('\n')[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';

    const records = parse(raw, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
        delimiter: delimiter,
        skip_records_with_error: true
    });

    console.log(`[Seeder] 📊 Parsed ${records.length} rows from CSV`);

    if (records.length === 0) {
        console.warn('[Seeder] ⚠️ No records found in CSV. Check delimiter or file content.');
        await mongoose.connection.close();
        return;
    }

    // Debug thử dòng đầu tiên
    console.log('[Debug] Headers detected:', Object.keys(records[0]));
    const testDoc = castRow(records[0]);
    console.log('[Debug] First doc mapped:', testDoc.email ? testDoc : '❌ Mapping Failed (Check CSV headers)');

    let inserted = 0;
    let skipped = 0;
    const errors = [];

    // ── Xử lý Batch ────────────────────────────────────────────────────────
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const docs = batch.map(row => {
            const doc = castRow(row);

            // Chỉ tính điểm nếu mapping thành công (có email hoặc tên)
            if (doc.email || doc.full_name) {
                doc.engagement_score = computeEngagementScore(doc);
                const { score, risk } = computeChurnScore(doc);
                doc.churn_score = score;
                doc.churn_risk = risk;
                return doc;
            }
            return null;
        }).filter(d => d !== null);

        if (docs.length === 0) continue;

        try {
            const result = await Customer.insertMany(docs, { ordered: false });
            inserted += result.length;
        } catch (err) {
            if (err.insertedDocs) inserted += err.insertedDocs.length;
            if (err.writeErrors) {
                skipped += err.writeErrors.length;
                if (errors.length < 3) errors.push(err.writeErrors[0].errmsg);
            }
        }

        const pct = Math.round(((i + batch.length) / records.length) * 100);
        process.stdout.write(`\r[Seeder] Progress: ${pct}% (${inserted} inserted)`);
    }

    console.log(`\n[Seeder] 🎉 Done — Inserted: ${inserted}, Skipped: ${skipped}`);
    if (errors.length) {
        console.warn('[Seeder] Sample errors:', errors);
    }

    await mongoose.connection.close();
    process.exit(0);
}

main().catch(err => {
    console.error('[Seeder] 💀 Fatal error:', err);
    process.exit(1);
});