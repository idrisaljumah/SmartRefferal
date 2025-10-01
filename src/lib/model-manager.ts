/**
 * Model Manager - handles model lifecycle, download, verification, and loading
 */

import type { ModelMetadata, ModelManifest, DownloadProgress, DeviceCapabilities } from '../types';
import { detectCapabilities, checkStorageAvailability } from './capabilities';
import { computeChecksum, verifyChecksum } from './crypto';
import {
  saveModel,
  getModel,
  getModelMetadata,
  getAllModels,
  isModelReady,
  saveDownloadProgress,
  getDownloadProgress,
  clearDownloadProgress
} from './storage';

const MODEL_REGISTRY_URL = 'https://models.example.com'; // Replace with actual CDN
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

/**
 * Model manifest (hardcoded for demo; fetch from CDN in production)
 */
const DEFAULT_MANIFEST: ModelManifest = {
  version: '1.0.0',
  lastUpdated: Date.now(),
  models: [
    {
      id: 'llm-seed-q8',
      name: 'Seed LLM (Q8)',
      type: 'llm',
      version: '1.0',
      size: 45 * 1024 * 1024, // 45MB
      quantization: 'Q8_0',
      capabilities: ['referral-generation', 'en', 'ar'],
      license: 'Apache-2.0',
      redistributable: true,
      checksum: 'abc123...', // Replace with actual SHA256
      isSeed: true
    },
    {
      id: 'llm-small-q4',
      name: 'Small LLM (Q4)',
      type: 'llm',
      version: '1.0',
      size: 180 * 1024 * 1024, // 180MB
      quantization: 'Q4_K_M',
      capabilities: ['referral-generation', 'en', 'ar', 'high-accuracy'],
      license: 'Apache-2.0',
      redistributable: true,
      checksum: 'def456...',
      url: `${MODEL_REGISTRY_URL}/llm-small-q4.gguf`,
      isSeed: false
    },
    {
      id: 'llm-medium-q4',
      name: 'Medium LLM (Q4)',
      type: 'llm',
      version: '1.0',
      size: 420 * 1024 * 1024, // 420MB
      quantization: 'Q4_K_M',
      capabilities: ['referral-generation', 'en', 'ar', 'high-accuracy', 'complex-cases'],
      license: 'Llama-2',
      redistributable: false, // Must download from official source
      checksum: 'ghi789...',
      url: `${MODEL_REGISTRY_URL}/llm-medium-q4.gguf`,
      isSeed: false
    },
    {
      id: 'stt-whisper-tiny',
      name: 'Whisper Tiny (STT)',
      type: 'stt',
      version: '1.0',
      size: 75 * 1024 * 1024, // 75MB
      quantization: 'Q5_1',
      capabilities: ['stt', 'en', 'ar'],
      license: 'MIT',
      redistributable: true,
      checksum: 'jkl012...',
      isSeed: true
    },
    {
      id: 'stt-whisper-base',
      name: 'Whisper Base (STT)',
      type: 'stt',
      version: '1.0',
      size: 140 * 1024 * 1024, // 140MB
      quantization: 'Q5_1',
      capabilities: ['stt', 'en', 'ar', 'high-accuracy'],
      license: 'MIT',
      redistributable: true,
      checksum: 'mno345...',
      url: `${MODEL_REGISTRY_URL}/stt-whisper-base.bin`,
      isSeed: false
    }
  ]
};

/**
 * Initialize model manager - ensure seed models are available
 */
export async function initializeModelManager(): Promise<void> {
  console.log('[ModelManager] Initializing...');
  
  // Detect device capabilities
  const capabilities = await detectCapabilities();
  console.log('[ModelManager] Device capabilities:', capabilities);
  
  // Ensure seed models are available
  await ensureSeedModels();
  
  // Start background fetch of recommended models
  await startBackgroundModelFetch(capabilities);
}

/**
 * Ensure seed models are cached (bundled with app)
 */
async function ensureSeedModels(): Promise<void> {
  const seedModels = DEFAULT_MANIFEST.models.filter(m => m.isSeed);
  
  for (const model of seedModels) {
    const ready = await isModelReady(model.id);
    if (!ready) {
      console.log(`[ModelManager] Loading seed model: ${model.id}`);
      await loadSeedModel(model);
    } else {
      console.log(`[ModelManager] Seed model already cached: ${model.id}`);
    }
  }
}

/**
 * Load seed model from bundled assets
 */
async function loadSeedModel(metadata: ModelMetadata): Promise<void> {
  try {
    // In production, seed models are bundled in public/models/
    const response = await fetch(`/models/${metadata.id}.gguf`);
    if (!response.ok) {
      throw new Error(`Failed to load seed model: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Verify checksum
    const valid = await verifyChecksum(blob, metadata.checksum);
    if (!valid) {
      throw new Error(`Checksum verification failed for ${metadata.id}`);
    }
    
    // Save to IndexedDB
    await saveModel(metadata, blob, true);
    console.log(`[ModelManager] Seed model loaded: ${metadata.id}`);
  } catch (error) {
    console.error(`[ModelManager] Failed to load seed model ${metadata.id}:`, error);
    throw error;
  }
}

/**
 * Start background fetch of recommended models
 */
export async function startBackgroundModelFetch(capabilities: DeviceCapabilities): Promise<void> {
  const recommendedModelId = capabilities.recommendedModel;
  const model = DEFAULT_MANIFEST.models.find(m => m.id === recommendedModelId);
  
  if (!model || model.isSeed) {
    console.log('[ModelManager] No additional models to fetch');
    return;
  }
  
  // Check if already downloaded
  const ready = await isModelReady(model.id);
  if (ready) {
    console.log(`[ModelManager] Model already available: ${model.id}`);
    return;
  }
  
  // Check storage availability
  const hasStorage = await checkStorageAvailability(model.size / (1024 * 1024));
  if (!hasStorage) {
    console.warn('[ModelManager] Insufficient storage for model download');
    return;
  }
  
  console.log(`[ModelManager] Starting background fetch: ${model.id}`);
  
  // Start download in background (non-blocking)
  downloadModelInBackground(model).catch(error => {
    console.error(`[ModelManager] Background download failed:`, error);
  });
}

/**
 * Download model in background with chunking and resume support
 */
async function downloadModelInBackground(metadata: ModelMetadata): Promise<void> {
  if (!metadata.url) {
    throw new Error(`No URL specified for model ${metadata.id}`);
  }
  
  try {
    // Check for existing progress
    const progress = await getDownloadProgress(metadata.id);
    const startByte = progress?.bytesDownloaded || 0;
    
    console.log(`[ModelManager] Downloading ${metadata.id} from byte ${startByte}`);
    
    // Fetch with range header for resume support
    const response = await fetch(metadata.url, {
      headers: startByte > 0 ? { Range: `bytes=${startByte}-` } : {}
    });
    
    if (!response.ok && response.status !== 206) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    const totalBytes = parseInt(response.headers.get('Content-Length') || '0') + startByte;
    const reader = response.body?.getReader();
    
    if (!reader) {
      throw new Error('Response body is not readable');
    }
    
    const chunks: Uint8Array[] = progress?.chunks.map(b => new Uint8Array(b as any)) || [];
    let bytesDownloaded = startByte;
    
    // Read stream in chunks
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      chunks.push(value);
      bytesDownloaded += value.length;
      
      // Save progress periodically
      if (chunks.length % 10 === 0) {
        const progressBlobs = chunks.map(c => new Blob([c]));
        await saveDownloadProgress(metadata.id, bytesDownloaded, totalBytes, progressBlobs);
      }
      
      // Emit progress event
      emitDownloadProgress({
        modelId: metadata.id,
        bytesDownloaded,
        totalBytes,
        percentage: (bytesDownloaded / totalBytes) * 100,
        status: 'downloading'
      });
    }
    
    // Combine chunks into single blob
    const modelBlob = new Blob(chunks);
    
    // Verify checksum
    console.log(`[ModelManager] Verifying ${metadata.id}...`);
    emitDownloadProgress({
      modelId: metadata.id,
      bytesDownloaded: totalBytes,
      totalBytes,
      percentage: 100,
      status: 'verifying'
    });
    
    const valid = await verifyChecksum(modelBlob, metadata.checksum);
    if (!valid) {
      throw new Error(`Checksum verification failed for ${metadata.id}`);
    }
    
    // Save to IndexedDB
    await saveModel(metadata, modelBlob, true);
    await clearDownloadProgress(metadata.id);
    
    console.log(`[ModelManager] Model downloaded and verified: ${metadata.id}`);
    emitDownloadProgress({
      modelId: metadata.id,
      bytesDownloaded: totalBytes,
      totalBytes,
      percentage: 100,
      status: 'complete'
    });
  } catch (error) {
    console.error(`[ModelManager] Download failed for ${metadata.id}:`, error);
    emitDownloadProgress({
      modelId: metadata.id,
      bytesDownloaded: 0,
      totalBytes: metadata.size,
      percentage: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

/**
 * Emit download progress event (for UI updates)
 */
function emitDownloadProgress(progress: DownloadProgress): void {
  window.dispatchEvent(new CustomEvent('model-download-progress', { detail: progress }));
}

/**
 * Get model blob for inference
 */
export async function loadModelForInference(modelId: string): Promise<Blob> {
  const blob = await getModel(modelId);
  if (!blob) {
    throw new Error(`Model not found: ${modelId}`);
  }
  
  const metadata = await getModelMetadata(modelId);
  if (!metadata) {
    throw new Error(`Model metadata not found: ${modelId}`);
  }
  
  // Verify integrity before use
  const valid = await verifyChecksum(blob, metadata.checksum);
  if (!valid) {
    throw new Error(`Model integrity check failed: ${modelId}`);
  }
  
  return blob;
}

/**
 * Get available models
 */
export async function getAvailableModels(): Promise<ModelMetadata[]> {
  return await getAllModels();
}

/**
 * Get model manifest
 */
export function getModelManifest(): ModelManifest {
  return DEFAULT_MANIFEST;
}

/**
 * Check if a specific model is ready
 */
export async function checkModelReady(modelId: string): Promise<boolean> {
  return await isModelReady(modelId);
}