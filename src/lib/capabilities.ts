/**
 * Device capability detection for model selection
 */

import type { DeviceCapabilities } from '../types';

/**
 * Detect device capabilities
 */
export async function detectCapabilities(): Promise<DeviceCapabilities> {
  const hasWebAssembly = typeof WebAssembly !== 'undefined';
  const hasWebGPU = 'gpu' in navigator;
  
  // Estimate available memory (heuristic)
  const availableMemoryGB = estimateAvailableMemory();
  
  // CPU cores
  const cpuCores = navigator.hardwareConcurrency || 2;
  
  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  // Recommend model based on capabilities
  const recommendedModel = selectRecommendedModel({
    hasWebAssembly,
    hasWebGPU,
    availableMemoryGB,
    cpuCores,
    isMobile
  });
  
  return {
    hasWebAssembly,
    hasWebGPU,
    availableMemoryGB,
    cpuCores,
    isMobile,
    recommendedModel
  };
}

/**
 * Estimate available memory (GB)
 */
function estimateAvailableMemory(): number {
  // @ts-ignore - deviceMemory is experimental
  if ('deviceMemory' in navigator) {
    // @ts-ignore
    return navigator.deviceMemory as number;
  }
  
  // Fallback heuristic based on user agent
  const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? 2 : 4; // Conservative estimate
}

/**
 * Select recommended model based on capabilities
 */
function selectRecommendedModel(caps: Omit<DeviceCapabilities, 'recommendedModel'>): string {
  // High-end device: use full model
  if (caps.hasWebGPU && caps.availableMemoryGB >= 4 && caps.cpuCores >= 4) {
    return 'llm-medium-q4';
  }
  
  // Mid-range device: use quantized model
  if (caps.hasWebAssembly && caps.availableMemoryGB >= 2) {
    return 'llm-small-q4';
  }
  
  // Low-end device: use seed model only
  return 'llm-seed-q8';
}

/**
 * Check if WebGPU is available and functional
 */
export async function checkWebGPU(): Promise<boolean> {
  if (!('gpu' in navigator)) return false;
  
  try {
    const adapter = await navigator.gpu.requestAdapter();
    return adapter !== null;
  } catch {
    return false;
  }
}

/**
 * Check if device has sufficient storage
 */
export async function checkStorageAvailability(requiredMB: number): Promise<boolean> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const availableMB = ((estimate.quota || 0) - (estimate.usage || 0)) / (1024 * 1024);
    return availableMB >= requiredMB;
  }
  return true; // Assume available if API not supported
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return await navigator.storage.persist();
  }
  return false;
}

/**
 * Check if running in secure context (required for many APIs)
 */
export function isSecureContext(): boolean {
  return window.isSecureContext;
}

/**
 * Get performance tier (1-3, higher is better)
 */
export function getPerformanceTier(caps: DeviceCapabilities): 1 | 2 | 3 {
  if (caps.hasWebGPU && caps.availableMemoryGB >= 4 && caps.cpuCores >= 4) {
    return 3; // High-end
  }
  if (caps.hasWebAssembly && caps.availableMemoryGB >= 2) {
    return 2; // Mid-range
  }
  return 1; // Low-end
}