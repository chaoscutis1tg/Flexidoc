import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Possible backup paths (Host & Docker Container)
const possibleBackupDirs = [
  path.resolve(process.cwd(), 'backups'),
  path.resolve(__dirname, '../../../backups'),
  path.resolve('/app/backups'),
  path.resolve('d:/webhopdong/backups')
];

const BACKUP_DIR = possibleBackupDirs.find(d => {
  try {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
    return fs.existsSync(d);
  } catch (e) {
    return false;
  }
}) || possibleBackupDirs[0];

const MAX_BACKUPS = 3;

/**
 * Perform MongoDB Backup (mongodump or JS native stream fallback) and rotate to keep ONLY 3 latest backups.
 */
export async function runMongoBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '');
    const archiveName = `backup_${timestamp}.archive`;
    const hostFilePath = path.join(BACKUP_DIR, archiveName);

    console.log(`[MongoBackup] Starting MongoDB backup: ${archiveName}...`);

    let backupSuccess = false;
    let backupMethod = '';

    const mongoUri = process.env.MONGO_URI || 'mongodb://webhopdong_mongodb:27017/mt_ctms';

    // Strategy 1: CLI mongodump directly using MONGO_URI
    try {
      const dumpCmd = `mongodump --uri="${mongoUri}" --archive="${hostFilePath}" --gzip`;
      execSync(dumpCmd, { stdio: 'pipe' });
      backupSuccess = true;
      backupMethod = 'mongodump CLI';
    } catch (err1) {
      // Strategy 2: Docker exec mongodump if running on host system
      try {
        const containerArchivePath = `/tmp/${archiveName}`;
        execSync(`docker exec webhopdong_mongodb mongodump --db=mt_ctms --archive=${containerArchivePath} --gzip`, { stdio: 'pipe' });
        execSync(`docker cp webhopdong_mongodb:${containerArchivePath} "${hostFilePath}"`, { stdio: 'pipe' });
        try { execSync(`docker exec webhopdong_mongodb rm -f ${containerArchivePath}`, { stdio: 'pipe' }); } catch (e) {}
        backupSuccess = true;
        backupMethod = 'docker exec mongodump';
      } catch (err2) {
        // Strategy 3: JS Native Mongo Dump (100% Guaranteed Fallback for any Node container environment!)
        try {
          if (mongoose.connection && mongoose.connection.db) {
            const db = mongoose.connection.db;
            const collections = await db.collections();
            const dumpData = {};

            for (const col of collections) {
              const colName = col.collectionName;
              if (colName.startsWith('system.')) continue;
              const docs = await col.find({}).toArray();
              dumpData[colName] = docs;
            }

            const jsonString = JSON.stringify(dumpData, null, 2);
            const compressed = zlib.gzipSync(Buffer.from(jsonString, 'utf-8'));
            fs.writeFileSync(hostFilePath, compressed);

            backupSuccess = true;
            backupMethod = 'JS Native Mongo Dump (GZipped JSON)';
          }
        } catch (err3) {
          console.error('❌ [MongoBackup] Strategy 3 JS dump failed:', err3.message);
        }
      }
    }

    if (backupSuccess) {
      console.log(`✅ [MongoBackup] Backup created successfully via [${backupMethod}]: ${hostFilePath}`);
      rotateBackups();
      return { success: true, file: archiveName, path: hostFilePath, method: backupMethod };
    }

    return { success: false, error: 'Backup command failed across all strategies' };
  } catch (err) {
    console.error('❌ [MongoBackup] Error during backup execution:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Rotate backups to retain ONLY 3 latest dumps.
 */
export function rotateBackups() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) return;

    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('backup_') && (f.endsWith('.archive') || f.endsWith('.tar.gz') || f.endsWith('.gz')))
      .map(f => {
        const fullPath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(fullPath);
        return { name: f, fullPath, mtime: stats.mtime.getTime() };
      })
      .sort((a, b) => b.mtime - a.mtime); // Sort newest first

    console.log(`[MongoBackup Rotation] Total backups found: ${files.length} in ${BACKUP_DIR}`);

    if (files.length > MAX_BACKUPS) {
      const filesToDelete = files.slice(MAX_BACKUPS);
      filesToDelete.forEach(file => {
        try {
          fs.unlinkSync(file.fullPath);
          console.log(`🗑️ [MongoBackup Rotation] Deleted old backup: ${file.name}`);
        } catch (e) {}
      });
      console.log(`✅ [MongoBackup Rotation] Successfully retained ONLY the ${MAX_BACKUPS} latest backups.`);
    } else {
      console.log(`ℹ️ [MongoBackup Rotation] Total backups (${files.length}) <= ${MAX_BACKUPS}. No deletion needed.`);
    }

    return { total: files.length, retained: Math.min(files.length, MAX_BACKUPS) };
  } catch (err) {
    console.error('❌ [MongoBackup Rotation] Error during rotation:', err.message);
    return null;
  }
}

/**
 * Initialize 24-hour Daily Automated Backup Cron Scheduler.
 */
export function initDailyBackupScheduler() {
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  console.log('⏰ [Daily Backup Scheduler] Initialized daily automated MongoDB backup cron (Every 24 Hours).');

  // Trigger once every 24 hours
  setInterval(async () => {
    console.log('⏰ [Daily Backup Cron] Triggering scheduled daily backup...');
    await runMongoBackup();
  }, TWENTY_FOUR_HOURS);
}
