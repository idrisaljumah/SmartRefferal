import { useEffect, useState } from 'react';
import { initializeModelManager } from './lib/model-manager';
import { initDB } from './lib/storage';
import { detectCapabilities } from './lib/capabilities';
import ReferralGenerator from './components/ReferralGenerator';
import ModelStatus from './components/ModelStatus';
import type { DeviceCapabilities, DownloadProgress } from './types';
import './App.css';

function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeApp();
    
    // Listen for model download progress
    const handleProgress = (event: Event) => {
      const customEvent = event as CustomEvent<DownloadProgress>;
      setDownloadProgress(prev => {
        const existing = prev.find(p => p.modelId === customEvent.detail.modelId);
        if (existing) {
          return prev.map(p => 
            p.modelId === customEvent.detail.modelId ? customEvent.detail : p
          );
        }
        return [...prev, customEvent.detail];
      });
    };
    
    window.addEventListener('model-download-progress', handleProgress);
    return () => window.removeEventListener('model-download-progress', handleProgress);
  }, []);

  async function initializeApp() {
    try {
      console.log('[App] Initializing...');
      
      // Initialize database
      await initDB();
      
      // Detect capabilities
      const caps = await detectCapabilities();
      setCapabilities(caps);
      
      // Initialize model manager (loads seed models + starts background fetch)
      await initializeModelManager();
      
      setIsInitialized(true);
      console.log('[App] Initialization complete');
    } catch (err) {
      console.error('[App] Initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Initialization failed');
    }
  }

  if (error) {
    return (
      <div className="app-container error">
        <div className="error-card">
          <h2>⚠️ Initialization Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!isInitialized || !capabilities) {
    return (
      <div className="app-container loading">
        <div className="loading-card">
          <div className="spinner"></div>
          <h2>Initializing Clinical Referral Generator</h2>
          <p>Loading offline AI models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container" dir={capabilities.isMobile ? 'ltr' : 'ltr'}>
      <header className="app-header">
        <h1>🏥 Clinical Referral Generator</h1>
        <p className="subtitle">Secure Offline AI-Powered Referrals</p>
      </header>

      <ModelStatus 
        capabilities={capabilities}
        downloadProgress={downloadProgress}
      />

      <main className="app-main">
        <ReferralGenerator capabilities={capabilities} />
      </main>

      <footer className="app-footer">
        <p>
          🔒 All data processed locally • No PHI leaves your device • 
          {capabilities.hasWebGPU ? ' WebGPU Accelerated' : ' CPU Mode'}
        </p>
      </footer>
    </div>
  );
}

export default App;