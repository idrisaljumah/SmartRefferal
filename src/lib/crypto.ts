/**
 * Web Crypto API wrapper for encrypting PHI at rest
 */

import type { EncryptedData } from '../types';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;

/**
 * Derive encryption key from device-specific entropy
 */
async function deriveKey(salt: Uint8Array): Promise<CryptoKey> {
  // In production, combine with device fingerprint or user PIN
  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('device-derived-key-material'), // Replace with secure device ID
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(data: string): Promise<EncryptedData> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(salt);

  const encodedData = new TextEncoder().encode(data);
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encodedData
  );

  return {
    iv: bufferToBase64(iv),
    data: bufferToBase64(new Uint8Array(encryptedBuffer)),
    salt: bufferToBase64(salt)
  };
}

/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(encrypted: EncryptedData): Promise<string> {
  const salt = base64ToBuffer(encrypted.salt);
  const iv = base64ToBuffer(encrypted.iv);
  const data = base64ToBuffer(encrypted.data);
  const key = await deriveKey(salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Compute SHA-256 checksum of a blob
 */
export async function computeChecksum(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return bufferToHex(new Uint8Array(hashBuffer));
}

/**
 * Verify blob checksum
 */
export async function verifyChecksum(blob: Blob, expectedChecksum: string): Promise<boolean> {
  const actualChecksum = await computeChecksum(blob);
  return actualChecksum === expectedChecksum.toLowerCase();
}

// Utility functions
function bufferToBase64(buffer: Uint8Array): string {
  return btoa(String.fromCharCode(...buffer));
}

function base64ToBuffer(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}