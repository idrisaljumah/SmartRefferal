import { useState, useRef } from 'react';
import type { DeviceCapabilities, ReferralOutput, InferenceRequest } from '../types';
import { runLLMInference, runSTTInference } from '../lib/wasm-runtime';
import { saveReferral } from '../lib/storage';
import { exportToPDF, exportToFHIR, exportFHIRToJSON, downloadFile } from '../lib/export';
import './ReferralGenerator.css';

interface Props {
  capabilities: DeviceCapabilities;
}

type Step = 'input' | 'generating' | 'review';

export default function ReferralGenerator({ capabilities }: Props) {
  const [step, setStep] = useState<Step>('input');
  const [inputText, setInputText] = useState('');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [isRecording, setIsRecording] = useState(false);
  const [referral, setReferral] = useState<ReferralOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  async function handleGenerate() {
    if (!inputText.trim()) {
      setError('Please enter clinical information');
      return;
    }

    setStep('generating');
    setError(null);

    try {
      const request: InferenceRequest = {
        input: inputText,
        language,
        modelId: capabilities.recommendedModel,
        maxTokens: 512
      };

      const response = await runLLMInference(request);
      setReferral(response.output);
      
      // Auto-save to local storage
      await saveReferral(response.output);
      
      setStep('review');
    } catch (err) {
      console.error('[Generator] Inference failed:', err);
      setError(err instanceof Error ? err.message : 'Generation failed');
      setStep('input');
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('[Generator] Recording failed:', err);
      setError('Microphone access denied');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }

  async function transcribeAudio(audioBlob: Blob) {
    setStep('generating');
    setError(null);

    try {
      const sttResponse = await runSTTInference({
        audioBlob,
        language,
        modelId: 'stt-whisper-tiny'
      });

      setInputText(sttResponse.transcription);
      setStep('input');
    } catch (err) {
      console.error('[Generator] Transcription failed:', err);
      setError(err instanceof Error ? err.message : 'Transcription failed');
      setStep('input');
    }
  }

  async function handleExportPDF() {
    if (!referral) return;

    try {
      const pdfBlob = await exportToPDF(referral);
      const filename = `referral-${referral.id.slice(0, 8)}.pdf`;
      downloadFile(pdfBlob, filename);
    } catch (err) {
      console.error('[Generator] PDF export failed:', err);
      setError('PDF export failed');
    }
  }

  async function handleExportFHIR() {
    if (!referral) return;

    try {
      const fhir = exportToFHIR(referral);
      const fhirBlob = exportFHIRToJSON(fhir);
      const filename = `referral-fhir-${referral.id.slice(0, 8)}.json`;
      downloadFile(fhirBlob, filename);
    } catch (err) {
      console.error('[Generator] FHIR export failed:', err);
      setError('FHIR export failed');
    }
  }

  function handleReset() {
    setStep('input');
    setInputText('');
    setReferral(null);
    setError(null);
  }

  function updateReferralField(field: keyof ReferralOutput, value: any) {
    if (!referral) return;
    setReferral({ ...referral, [field]: value });
  }

  if (step === 'generating') {
    return (
      <div className="generator-container">
        <div className="generating-card">
          <div className="spinner"></div>
          <h3>Generating Referral...</h3>
          <p>Processing with on-device AI model</p>
        </div>
      </div>
    );
  }

  if (step === 'review' && referral) {
    return (
      <div className="generator-container">
        <div className="review-card">
          <h2>Review & Edit Referral</h2>

          {error && <div className="error-banner">{error}</div>}

          <div className="form-group">
            <label>Specialty</label>
            <input
              type="text"
              value={referral.specialty}
              onChange={(e) => updateReferralField('specialty', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Acuteness</label>
            <select
              value={referral.acuteness}
              onChange={(e) => updateReferralField('acuteness', e.target.value)}
            >
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </div>

          <div className="form-group">
            <label>Timeframe</label>
            <input
              type="text"
              value={referral.timeframe}
              onChange={(e) => updateReferralField('timeframe', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Reason for Referral</label>
            <textarea
              rows={3}
              value={referral.reason}
              onChange={(e) => updateReferralField('reason', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Clinical Summary</label>
            <textarea
              rows={5}
              value={referral.clinicalSummary}
              onChange={(e) => updateReferralField('clinicalSummary', e.target.value)}
            />
          </div>

          <div className="confidence-badge">
            Confidence: {(referral.confidence * 100).toFixed(0)}%
          </div>

          <div className="action-buttons">
            <button className="btn-primary" onClick={handleExportPDF}>
              📄 Export PDF
            </button>
            <button className="btn-secondary" onClick={handleExportFHIR}>
              🔗 Export FHIR
            </button>
            <button className="btn-secondary" onClick={handleReset}>
              ↻ New Referral
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="generator-container">
      <div className="input-card">
        <h2>New Referral Request</h2>

        {error && <div className="error-banner">{error}</div>}

        <div className="language-selector">
          <label>
            <input
              type="radio"
              name="language"
              value="en"
              checked={language === 'en'}
              onChange={() => setLanguage('en')}
            />
            English
          </label>
          <label>
            <input
              type="radio"
              name="language"
              value="ar"
              checked={language === 'ar'}
              onChange={() => setLanguage('ar')}
            />
            العربية
          </label>
        </div>

        <div className="form-group">
          <label>Clinical Information</label>
          <textarea
            rows={8}
            placeholder={
              language === 'ar'
                ? 'أدخل المعلومات السريرية للمريض...'
                : 'Enter patient clinical information...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          />
        </div>

        <div className="input-methods">
          <button
            className="btn-primary"
            onClick={handleGenerate}
            disabled={!inputText.trim()}
          >
            ✨ Generate Referral
          </button>

          <div className="divider">or</div>

          {!isRecording ? (
            <button className="btn-secondary" onClick={startRecording}>
              🎤 Record Voice
            </button>
          ) : (
            <button className="btn-danger" onClick={stopRecording}>
              ⏹️ Stop Recording
            </button>
          )}
        </div>

        <div className="info-box">
          <p>
            🔒 All processing happens locally on your device. No data is sent to external servers.
          </p>
        </div>
      </div>
    </div>
  );
}