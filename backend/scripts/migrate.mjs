#!/usr/bin/env node
/**
 * Copies store data between MongoDB databases and moves product photos into GridFS.
 *
 *   # Local dev: load photos from ./uploads into the local database's GridFS
 *   node scripts/migrate.mjs --media-only --to "mongodb://127.0.0.1:27099/store"
 *
 *   # Go live: copy products, settings, admins and their photos to Atlas
 *   node scripts/migrate.mjs --from "mongodb://127.0.0.1:27099/store" --to "<atlas uri>"
 *
 * Options:
 *   --uploads <dir>   folder with legacy photo files (default ./uploads)
 *   --overwrite       replace documents in non-empty target collections
 *   --media-only      only copy photos (no documents)
 *
 * Only photos referenced by products or the hero setting are copied. Existing files in the
 * target are left alone, so the script is safe to run more than once.
 */
import mongoose from 'mongoose';
import { existsSync, readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const { MongoClient, GridFSBucket } = mongoose.mongo;
const COLLECTIONS = ['products', 'settings', 'admins'];
const TYPES = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif' };

function args() {
  const out = { uploads: './uploads', overwrite: false, mediaOnly: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--from') out.from = argv[++i];
    else if (a === '--to') out.to = argv[++i];
    else if (a === '--uploads') out.uploads = argv[++i];
    else if (a === '--overwrite') out.overwrite = true;
    else if (a === '--media-only') out.mediaOnly = true;
    else throw new Error(`Unknown option ${a}`);
  }
  if (!out.to) throw new Error('--to <mongodb uri> is required');
  if (!out.mediaOnly && !out.from) throw new Error('--from <mongodb uri> is required (or use --media-only)');
  return out;
}

const redact = (uri) => uri.replace(/\/\/([^@/]+)@/, '//***@');

/** "/uploads/abc.jpg" -> "abc.jpg" */
const fileOf = (url) => (typeof url === 'string' && url.startsWith('/uploads/') ? url.slice('/uploads/'.length) : null);

async function referencedFiles(db) {
  const names = new Set();
  for await (const p of db.collection('products').find({}, { projection: { images: 1 } })) {
    for (const url of p.images ?? []) {
      const f = fileOf(url);
      if (f) names.add(f);
    }
  }
  const settings = await db.collection('settings').findOne({});
  const hero = fileOf(settings?.heroImage);
  if (hero) names.add(hero);
  return names;
}

async function main() {
  const opts = args();
  const target = await new MongoClient(opts.to).connect();
  const source = opts.from ? await new MongoClient(opts.from).connect() : null;
  const to = target.db();
  const from = source?.db();

  console.log(`Target: ${redact(opts.to)} (db "${to.databaseName}")`);
  if (from) console.log(`Source: ${redact(opts.from)} (db "${from.databaseName}")`);

  // 1. Documents
  if (!opts.mediaOnly) {
    for (const name of COLLECTIONS) {
      const docs = await from.collection(name).find({}).toArray();
      const existing = await to.collection(name).countDocuments();
      if (existing && !opts.overwrite) {
        throw new Error(`Target collection "${name}" already has ${existing} documents. Re-run with --overwrite to replace them.`);
      }
      if (existing) await to.collection(name).deleteMany({});
      if (docs.length) await to.collection(name).insertMany(docs);
      console.log(`  ${name}: copied ${docs.length}`);
    }
    // Recreate indexes the app relies on (unique slugs / emails); the app also builds them on boot.
    await to.collection('products').createIndex({ slug: 1 }, { unique: true });
    await to.collection('admins').createIndex({ email: 1 }, { unique: true });
  }

  // 2. Photos referenced by the (now copied) data
  const wanted = await referencedFiles(to);
  const toBucket = new GridFSBucket(to, { bucketName: 'media' });
  const fromBucket = from ? new GridFSBucket(from, { bucketName: 'media' }) : null;
  const uploadsDir = resolve(opts.uploads);
  let copied = 0;
  let skipped = 0;
  const missing = [];

  for (const filename of wanted) {
    if (await toBucket.find({ filename }).limit(1).hasNext()) {
      skipped++;
      continue;
    }
    const contentType = TYPES[extname(filename).toLowerCase()] ?? 'application/octet-stream';
    let data = null;

    const diskPath = join(uploadsDir, filename);
    if (existsSync(diskPath)) data = readFileSync(diskPath);
    else if (fromBucket && (await fromBucket.find({ filename }).limit(1).hasNext())) {
      const chunks = [];
      for await (const chunk of fromBucket.openDownloadStreamByName(filename)) chunks.push(chunk);
      data = Buffer.concat(chunks);
    }

    if (!data) {
      missing.push(filename);
      continue;
    }
    await new Promise((ok, fail) => {
      const up = toBucket.openUploadStream(filename, { metadata: { contentType } });
      up.once('error', fail).once('finish', ok);
      up.end(data);
    });
    copied++;
  }

  console.log(`  photos: ${copied} copied, ${skipped} already there, ${missing.length} missing`);
  if (missing.length) console.log(`  missing files: ${missing.join(', ')}`);

  await Promise.all([target.close(), source?.close()]);
}

main().catch((err) => {
  console.error(`Migration failed: ${err.message}`);
  process.exit(1);
});
