/*
Migration script for chargings collection (CommonJS version).
Usage:
  - Set `GOOGLE_APPLICATION_CREDENTIALS` to a service account JSON path, or pass the path as first arg.
  - Dry-run (default): `node scripts/migrate_chargings.cjs --dry`
  - Commit changes: `node scripts/migrate_chargings.cjs --commit`
*/

const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry') || !argv.includes('--commit');

// initialize admin
if (process.env.GOOGLE_APPLICATION_CREDENTIALS && fs.existsSync(process.env.GOOGLE_APPLICATION_CREDENTIALS)) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
} else if (argv[0] && fs.existsSync(argv[0])) {
  const serviceAccount = require(argv[0]);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} else {
  console.error('Service account not found. Set GOOGLE_APPLICATION_CREDENTIALS or pass path as first arg.');
  process.exit(1);
}

const db = getFirestore();

(async () => {
  console.log('Starting migration (DRY RUN =', DRY, ')');

  const snap = await db.collection('chargings').get();
  console.log('Found', snap.size, 'charging docs');

  // group by userId + year-month
  const groups = new Map();

  snap.forEach(doc => {
    const data = doc.data();
    const userId = data.userId || 'unknown';
    const date = new Date(data.date);
    const year = date.getFullYear();
    const month = date.getMonth();
    const key = `${userId}::${year}-${month}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ id: doc.id, data });
  });

  console.log('Groups to process:', groups.size);

  const updates = [];

  for (const [key, docs] of groups.entries()) {
    const [userIdPart] = key.split('::');
    const userId = userIdPart;

    // fetch user profile
    let userProfile = null;
    try {
      const udoc = await db.collection('users').doc(userId).get();
      if (udoc.exists) userProfile = udoc.data();
    } catch (e) {
      console.warn('Could not load user', userId, e.message);
    }

    const providerVariableRate = (userProfile && userProfile.providerVariableRate) ? userProfile.providerVariableRate : 0;
    const providerFixedMonthlyFee = (userProfile && userProfile.providerFixedMonthlyFee) ? userProfile.providerFixedMonthlyFee : 0;

    const monthTotalKwh = docs.reduce((s, d) => s + (d.data.kwhCharged || 0), 0);

    // compute updates for each doc
    for (const { id, data } of docs) {
      const k = data.kwhCharged || 0;
      const energyCost = (typeof data.energyCost === 'number') ? data.energyCost : 0;
      const areraCost = k * energyCost;
      const providerVar = k * providerVariableRate;
      const fixedPortion = monthTotalKwh > 0 ? (k / monthTotalKwh) * providerFixedMonthlyFee : 0;
      const total = areraCost + providerVar + fixedPortion;
      updates.push({ id, areraCost, providerVariableCost: providerVar, providerFixedPortion: fixedPortion, totalCost: total });
    }
  }

  console.log('Prepared updates for', updates.length, 'docs');

  if (DRY) {
    console.log('Dry run - showing first 20 updates:');
    console.log(updates.slice(0, 20));
    console.log('Run with --commit to apply changes.');
    process.exit(0);
  }

  // apply updates in batches of 400
  const BATCH_SIZE = 400;
  let i = 0;
  while (i < updates.length) {
    const batch = db.batch();
    const slice = updates.slice(i, i + BATCH_SIZE);
    for (const u of slice) {
      const ref = db.collection('chargings').doc(u.id);
      batch.update(ref, {
        areraCost: u.areraCost,
        providerVariableCost: u.providerVariableCost,
        providerFixedPortion: u.providerFixedPortion,
        totalCost: u.totalCost
      });
    }
    await batch.commit();
    console.log('Committed batch', Math.min(i + BATCH_SIZE, updates.length), '/', updates.length);
    i += BATCH_SIZE;
  }

  console.log('Migration completed.');
  process.exit(0);
})();
