import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Possible backup paths (Host & Docker Container)
const possibleBackupDirs = [
  path.resolve(process.cwd(), 'backups'),
  path.resolve(__dirname, '../../../backups'),
  path.resolve('d:/webhopdong/backups'),
  '/app/backups'
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
 * Perform MongoDB Backup (mongodump) and rotate to keep ONLY 3 latest backups.
 */
export function runMongoBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').replace(/\..+/, '');
    const archiveName = `backup_${timestamp}.archive`;
    const containerArchivePath = `/tmp/${archiveName}`;
    const hostFilePath = path.join(BACKUP_DIR, archiveName);

    console.log(`[MongoBackup] Starting MongoDB backup: ${archiveName}...`);

    let backupSuccess = false;

    // 1. Try Docker exec mongodump (Production & Containerized)
    try {
      const dumpCmd = `docker exec webhopdong_mongodb mongodump --db=mt_ctms --archive=${containerArchivePath} --gzip`;
      execSync(dumpCmd, { stdio: 'pipe' });

      const copyCmd = `docker cp webhopdong_mongodb:${containerArchivePath} "${hostFilePath}"`;
      execSync(copyCmd, { stdio: 'pipe' });

      try {
        execSync(`docker exec webhopdong_mongodb rm -f ${containerArchivePath}`, { stdio: 'pipe' });
      } catch (e) {}

      backupSuccess = true;
    } catch (dockerErr) {
      // Fallback: Local mongodump if docker exec is unavailable
      try {
        const localDumpCmd = `mongodump --uri="mongodb://localhost:27017/mt_ctms" --archive="${hostFilePath}" --gzip`;
        execSync(localDumpCmd, { stdio: 'pipe' });
        backupSuccess = true;
      } catch (localErr) {
        console.error('❌ [MongoBackup] Both Docker & Local mongodump failed:', localErr.message);
      }
    }

    if (backupSuccess) {
      console.log(`✅ [MongoBackup] Backup created successfully: ${hostFilePath}`);
      rotateBackups();
      return { success: true, file: archiveName, path: hostFilePath };
    }

    return { success: false, error: 'Backup command failed' };
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
        fs.unlinkSync(file.fullPath);
        console.log(`🗑️ [MongoBackup Rotation] Deleted old backup: ${file.name}`);
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
