import crypto from 'node:crypto';
import { getDb } from './database.js';

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hash a password securely using scrypt and salt.
 */
export function hashPassword(password, existingSalt = null) {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

/**
 * Verify password against stored hash and salt using constant-time comparison.
 */
export function verifyPassword(password, storedHash, salt) {
  const { hash } = hashPassword(password, salt);
  const bufA = Buffer.from(hash, 'hex');
  const bufB = Buffer.from(storedHash, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Create a new authenticated session in the database.
 */
export function createSession(userId) {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  const stmt = db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(token, userId, expiresAt);

  return { token, expiresAt };
}

/**
 * Invalidate/destroy a session.
 */
export function destroySession(token) {
  if (!token) return;
  const db = getDb();
  const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
  stmt.run(token);
}

/**
 * Invalidate all sessions for a user.
 */
export function destroyAllUserSessions(userId) {
  if (!userId) return;
  const db = getDb();
  const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
  stmt.run(userId);
}

/**
 * Validate session token and retrieve authenticated user.
 */
export function getSessionUser(token) {
  if (!token) return null;
  const db = getDb();

  const stmt = db.prepare(`
    SELECT s.token, s.expires_at, u.id, u.name, u.email, u.role,
           u.institution, u.department, u.organization, u.domain,
           u.domains_json, u.skills_json, u.support_types_json, u.bio,
           u.created_at
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `);
  const row = stmt.get(token);

  if (!row) return null;

  if (row.expires_at < Date.now()) {
    // Expired session -> clean it up
    destroySession(token);
    return null;
  }

  // Parse JSON fields
  let domains = [];
  let skills = [];
  let supportTypes = [];
  try { domains = JSON.parse(row.domains_json || '[]'); } catch (e) {}
  try { skills = JSON.parse(row.skills_json || '[]'); } catch (e) {}
  try { supportTypes = JSON.parse(row.support_types_json || '[]'); } catch (e) {}

  return {
    id: row.id,
    name: row.name,
    displayName: row.name,
    email: row.email,
    role: row.role,
    institution: row.institution,
    department: row.department,
    organization: row.organization,
    domain: row.domain,
    domains,
    skills,
    supportTypes,
    bio: row.bio,
    createdAt: row.created_at
  };
}
