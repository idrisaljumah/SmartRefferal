import { useState, useEffect } from 'react';
import type { DeviceCapabilities, DownloadProgress, ModelMetadata } from '../types';
import { getAvailableModels, getModelManifest } from '../lib/model-manager';
import { getStorageEstimate } from '../lib/storage';
import './ModelStatus.css';

interface Props {
  capabilities: DeviceCapabilities;
  downloadProgress: DownloadProgress[];
}

export default function ModelStatus({ capabilities, downloadProgress }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [models, setModels] = useState<ModelMetadata[]>([]);
  const [storageInfo, setStorageInfo] = useState({ usage: 0, quota: 0, percentage: 0 });

  useEffect(() => {
    loadModelInfo();
    loadStorageInfo();
  }, [downloadProgress]);

  async function loadModelInfo() {
    const availableModels = await getAvailableModels();
    setModels(availableModels);
  }

  async function loadStorageInfo() {
    const info = await getStorageEstimate();
    setStorageInfo(info);
  }

  const activeDownloads = downloadProgress.filter(p => p.status === 'downloading');
  const hasActiveDownloads = activeDownloads.length > 0;

  return (
    <div className="model-status">
      <div className="status-bar" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="status-left">
          <span className="status-indicator">
            {hasActiveDownloads ? '⏳' : '✅'}
          </span>
          <span className="status-text">
            {hasActiveDownloads
              ? `Downloading models (${activeDownloads.length})...`
              : `${models.length} model(s) ready`}
          </span>
        </div>
        <div className="status-right">
          <span className="capability-badge">
            {capabilities.hasWebGPU ? '⚡ GPU' : '🖥️ CPU'}
          </span>
          <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
        </div>
      </div>

      {isExpanded && (
        <div className="status-details">
          <div className="section">
            <h4>Device Capabilities</h4>
            <ul>
              <li>WebAssembly: {capabilities.hasWebAssembly ? '✅' : '❌'}</li>
              <li>WebGPU: {capabilities.hasWebGPU ? '✅' : '❌'}</li>
              <li>Memory: ~{capabilities.availableMemoryGB} GB</li>
              <li>CPU Cores: {capabilities.cpuCores}</li>
              <li>Device Type: {capabilities.isMobile ? 'Mobile' : 'Desktop'}</li>
              <li>Recommended Model: {capabilities.recommendedModel}</li>
            </ul>
          </div>

          <div className="section">
            <h4>Available Models</h4>
            {models.length === 0 ? (
              <p className="empty-state">No models loaded yet</p>
            ) : (
              <ul className="model-list">
                {models.map(model => (
                  <li key={model.id} className="model-item">
                    <div className="model-name">
                      {model.type === 'llm' ? '🧠' : '🎤'} {model.name}
                    </div>
                    <div className="model-meta">
                      {(model.size / (1024 * 1024)).toFixed(0)} MB • {model.quantization}
                      {model.isSeed && <span className="seed-badge">SEED</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {downloadProgress.length > 0 && (
            <div className="section">
              <h4>Download Progress</h4>
              {downloadProgress.map(progress => (
                <div key={progress.modelId} className="progress-item">
                  <div className="progress-header">
                    <span>{progress.modelId}</span>
                    <span className="progress-status">{progress.status}</span>
                  </div>
                  {progress.status === 'downloading' && (
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${progress.percentage}%` }}
                      />
                    </div>
                  )}
                  {progress.status === 'downloading' && (
                    <div className="progress-text">
                      {(progress.bytesDownloaded / (1024 * 1024)).toFixed(1)} MB / 
                      {(progress.totalBytes / (1024 * 1024)).toFixed(1)} MB 
                      ({progress.percentage.toFixed(0)}%)
                    </div>
                  )}
                  {progress.error && (
                    <div className="progress-error">{progress.error}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="section">
            <h4>Storage</h4>
            <div className="storage-info">
              <div className="storage-bar">
                <div
                  className="storage-fill"
                  style={{ width: `${storageInfo.percentage}%` }}
                />
              </div>
              <div className="storage-text">
                {(storageInfo.usage / (1024 * 1024)).toFixed(0)} MB used of{' '}
                {(storageInfo.quota / (1024 * 1024)).toFixed(0)} MB 
                ({storageInfo.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}