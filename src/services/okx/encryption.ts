import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const IV_LENGTH = 16;

/**
 * Get encryption key from environment variable or generate one
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  // Ensure key is 32 bytes for AES-256
  const hash = crypto.createHash('sha256');
  hash.update(key);
  return hash.digest();
}

/**
 * Encrypt a string value
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    
    // Generate random IV
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine IV + tag + encrypted text
    const combined = Buffer.concat([
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    // Return as base64 string
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt a string value
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    
    // Decode from base64
    const combined = Buffer.from(encryptedText, 'base64');
    
    // Extract IV, tag, and encrypted text
    const iv = combined.slice(0, IV_LENGTH);
    const tag = combined.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
    const encrypted = combined.slice(IV_LENGTH + TAG_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash a value (one-way, for comparison)
 */
export function hash(text: string): string {
  return crypto
    .createHash('sha256')
    .update(text)
    .digest('hex');
}