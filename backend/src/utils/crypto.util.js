import crypto from 'crypto';
import { config } from '../config/env.js';

const SECRET = config.jwtSecret || 'mt_ctms_super_secret_jwt_key_2026_change_in_production';
const KEY = crypto.createHash('sha256').update(SECRET).digest(); // 256-bit Key

export const encryptPayload = (data) => {
  if (data === null || data === undefined) return data;
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
    const text = JSON.stringify(data);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return iv.toString('base64') + ':' + encrypted;
  } catch (err) {
    console.error('[CryptoUtil] Payload Encryption error:', err);
    return null;
  }
};

export const decryptPayload = (encryptedStr) => {
  if (!encryptedStr || typeof encryptedStr !== 'string' || !encryptedStr.includes(':')) {
    return null;
  }
  try {
    const [ivB64, encB64] = encryptedStr.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, iv);
    let decrypted = decipher.update(encB64, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  } catch (err) {
    console.error('[CryptoUtil] Payload Decryption error:', err);
    return null;
  }
};
