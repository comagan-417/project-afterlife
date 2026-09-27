/**
 * Cryptographic & Security Utilities for Project Afterlife
 * Implements SHA-256 fingerprinting, Project ID generation, and hash verification.
 */

/**
 * Calculates the SHA-256 checksum of a File or Blob.
 * Uses the Web Crypto API available natively in all modern browsers.
 * @param {File|Blob} file 
 * @returns {Promise<string>} Hexadecimal SHA-256 hash string
 */
export async function calculateSHA256(file) {
  if (!file) return null;
  try {
    const arrayBuffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error("Error calculating SHA-256 fingerprint:", error);
    // Fallback hash calculation using file properties if Web Crypto is unavailable
    const fallbackStr = `${file.name}-${file.size}-${file.lastModified}-${Date.now()}`;
    let hash = 0;
    for (let i = 0; i < fallbackStr.length; i++) {
      const char = fallbackStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return 'sha256-fallback-' + Math.abs(hash).toString(16).padStart(64, '0');
  }
}

/**
 * Generates a unique, standardized Project ID string (e.g., PA-2026-000142).
 * @returns {string} Formatted Project ID
 */
export function generateProjectCode() {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `PA-${year}-${randomDigits}`;
}

/**
 * Verifies if an uploaded file's SHA-256 hash matches an expected fingerprint.
 * @param {File} file 
 * @param {string} expectedHash 
 * @returns {Promise<{ matches: boolean, hash: string }>}
 */
export async function verifyFileIntegrity(file, expectedHash) {
  const computedHash = await calculateSHA256(file);
  const matches = computedHash.toLowerCase() === (expectedHash || '').toLowerCase();
  return { matches, hash: computedHash };
}
