/**
 * IndexedDB wrapper for storing models, referrals, and metadata
 */

import { openDB, type IDBPDatabase } from 'idb';
import type { ReferralOutput, ModelMetadata, EncryptedData } from '../types';
import { encrypt, decrypt } from './crypto';

const DB_NAME = 'clinical-referral-db';
const DB_VERSION = 1;

interface ReferralDB {
  referrals: {
    key: string;
    value: {
      id: string;
      encrypted: EncryptedData;
      timestamp: number;
    };
  };
  models: {
    key: string;
    value: {
      id: string;
      metadata: ModelMetadata;
      blob: Blob;
      verified: boolean;
    };
  };
  modelManifest: {
    key: string;
    value: {
      version: string;
      data: string;
      lastUpdated: number;
    };
  };
  downloadProgress: {
    key: string;
    value: {
      modelId: string;
      bytesDownloaded: number;
      totalBytes: number;
      chunks: Blob[];
    };
  };
}

let dbInstance: IDBPDatabase<ReferralDB> | null = null;

/**
 * Initialize database
 */
export async function initDB(): Promise<IDBPDatabase<ReferralDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ReferralDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Referrals store
      if (!db.objectStoreNames.contains('referrals')) {
        const referralStore = db.createObjectStore('referrals', { keyPath: 'id' });
        referralStore.createIndex('timestamp', 'timestamp');
      }

      // Models store
      if (!db.objectStoreNames.contains('models')) {
        const modelStore = db.createObjectStore('models', { keyPath: 'id' });
        modelStore.createIndex('type', 'metadata.type');
      }

      // Model manifest store
      if (!db.objectStoreNames.contains('modelManifest')) {
        db.createObjectStore('modelManifest', { keyPath: 'version' });
      }

      // Download progress store
      if (!db.objectStoreNames.contains('downloadProgress')) {
        db.createObjectStore('downloadProgress', { keyPath: 'modelId' });
      }
    }
  });

  return dbInstance;
}

/**
 * Save referral (encrypted)
 */
export async function saveReferral(referral: ReferralOutput): Promise<void> {
  const db = await initDB();
  const encrypted = await encrypt(JSON.stringify(referral));
  
  await db.put('referrals', {
    id: referral.id,
    encrypted,
    timestamp: referral.timestamp
  });
}

/**
 * Get referral by ID (decrypted)
 */
export async function getReferral(id: string): Promise<ReferralOutput | null> {
  const db = await initDB();
  const record = await db.get('referrals', id);
  
  if (!record) return null;
  
  const decrypted = await decrypt(record.encrypted);
  return JSON.parse(decrypted);
}

/**
 * Get all referrals (decrypted)
 */
export async function getAllReferrals(): Promise<ReferralOutput[]> {
  const db = await initDB();
  const records = await db.getAll('referrals');
  
  const referrals = await Promise.all(
    records.map(async (record) => {
      const decrypted = await decrypt(record.encrypted);
      return JSON.parse(decrypted);
    })
  );
  
  return referrals.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * Delete referral
 */
export async function deleteReferral(id: string): Promise<void> {
  const db = await initDB();
  await db.delete('referrals', id);
}

/**
 * Save model blob
 */
export async function saveModel(
  metadata: ModelMetadata,
  blob: Blob,
  verified: boolean
): Promise<void> {
  const db = await initDB();
  await db.put('models', {
    id: metadata.id,
    metadata,
    blob,
    verified
  });
}

/**
 * Get model blob
 */
export async function getModel(modelId: string): Promise<Blob | null> {
  const db = await initDB();
  const record = await db.get('models', modelId);
  return record?.blob || null;
}

/**
 * Get model metadata
 */
export async function getModelMetadata(modelId: string): Promise<ModelMetadata | null> {
  const db = await initDB();
  const record = await db.get('models', modelId);
  return record?.metadata || null;
}

/**
 * Get all models
 */
export async function getAllModels(): Promise<ModelMetadata[]> {
  const db = await initDB();
  const records = await db.getAll('models');
  return records.map(r => r.metadata);
}

/**
 * Check if model exists and is verified
 */
export async function isModelReady(modelId: string): Promise<boolean> {
  const db = await initDB();
  const record = await db.get('models', modelId);
  return record?.verified || false;
}

/**
 * Save download progress
 */
export async function saveDownloadProgress(
  modelId: string,
  bytesDownloaded: number,
  totalBytes: number,
  chunks: Blob[]
): Promise<void> {
  const db = await initDB();
  await db.put('downloadProgress', {
    modelId,
    bytesDownloaded,
    totalBytes,
    chunks
  });
}

/**
 * Get download progress
 */
export async function getDownloadProgress(modelId: string) {
  const db = await initDB();
  return await db.get('downloadProgress', modelId);
}

/**
 * Clear download progress
 */
export async function clearDownloadProgress(modelId: string): Promise<void> {
  const db = await initDB();
  await db.delete('downloadProgress', modelId);
}

/**
 * Get storage usage estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0,
      percentage: estimate.quota ? ((estimate.usage || 0) / estimate.quota) * 100 : 0
    };
  }
  return { usage: 0, quota: 0, percentage: 0 };
}