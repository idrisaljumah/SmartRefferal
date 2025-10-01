Deployment Checklist & Integration Guide
Pre-Deployment Checklist
1. Model Preparation
Seed Models (Bundled)

Obtain redistributable quantized GGUF models (≤50MB each)

Verify licenses allow redistribution (MIT, Apache-2.0, etc.)

Place seed models in public/models/ directory:

llm-seed-q8.gguf - Tiny LLM for immediate use

stt-whisper-tiny.bin - Whisper tiny for STT

Compute SHA256 checksums: sha256sum public/models/*.gguf

Update checksums in src/lib/model-manager.ts manifest

High-Accuracy Models (CDN-Hosted)

Upload larger models to CDN (e.g., Cloudflare R2, AWS S3)

Enable CORS headers on CDN

Generate signed URLs or use public URLs

Update MODEL_REGISTRY_URL in src/lib/model-manager.ts

Update model URLs and checksums in manifest

2. WASM Runtime Integration
llama.cpp WASM
# Clone and build llama.cpp with WASM support
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
mkdir build-wasm && cd build-wasm
emconfigure cmake .. -DLLAMA_WASM=ON
emmake make
# Copy llama.wasm and llama.js to public/wasm/

whisper.cpp WASM
# Clone and build whisper.cpp with WASM support
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make libwhisper.wasm
# Copy whisper.wasm and whisper.js to public/wasm/

Update Runtime Bindings

Replace mock implementations in src/lib/wasm-runtime.ts

Import actual WASM modules

Test inference on sample inputs

Verify memory management (no leaks)

3. License Verification
# Run license verification script
npm run verify-models


All bundled models have approved licenses

Restricted models are marked as redistributable: false

Model manifest includes license URLs

Attribution notices added to UI footer

4. Security Hardening
Encryption

Replace placeholder device key in src/lib/crypto.ts

Implement device fingerprinting or user PIN

Test encryption/decryption roundtrip

Verify encrypted data cannot be read without key

Content Security Policy

Review CSP headers in index.html

Add trusted CDN domains to connect-src

Enable wasm-unsafe-eval for WASM execution

Test CSP doesn't block legitimate resources

HTTPS

Deploy only to HTTPS domains

Configure HSTS headers

Test service worker registration (requires HTTPS)

5. Performance Optimization
Bundle Size
# Analyze bundle size
npm run build
npx vite-bundle-visualizer


Seed models ≤50MB each

Total initial bundle ≤200MB

Code splitting configured

Lazy loading for heavy components

Caching Strategy

Service worker precaches app shell

Seed models precached on install

Runtime caching for external models

Cache versioning strategy defined

6. Testing
Device Testing Matrix

Chrome Desktop (Windows/Mac/Linux)

Firefox Desktop

Edge Desktop

Safari Desktop (Mac)

Chrome Mobile (Android)

Safari Mobile (iOS)

Low-end Android device (2GB RAM)

Mid-range device (4GB RAM)

High-end device (8GB+ RAM)

Functional Tests

Install PWA ("Add to Home Screen")

Generate referral with seed model (offline)

Background model download completes

Generate referral with upgraded model

Voice recording and transcription

PDF export works offline

FHIR export generates valid JSON

Data persists after app restart

Works in airplane mode

Performance Tests

First contentful paint <2s

Time to interactive <5s

Inference latency <10s (seed model)

Memory usage <500MB (mobile)

No memory leaks during extended use

7. Compliance & Legal
PHI Handling

Legal review of local storage approach

Privacy policy updated

User consent flow implemented

Audit logging enabled

Data retention policy defined

Medical Device Regulations

Determine if app qualifies as medical device

Consult regulatory expert (FDA, CE, etc.)

Implement required disclaimers

Clinical validation if required

Model Licenses

All licenses documented in LICENSES.md

Attribution displayed in app

Compliance with model terms of use

Redistribution rights verified

8. Deployment
Build
npm run build

Deploy to Hosting

Upload dist/ to hosting (Netlify, Vercel, Cloudflare Pages)

Configure redirects for SPA routing

Set cache headers for static assets

Enable compression (gzip/brotli)

CDN Configuration

Upload models to CDN

Set long cache TTL (1 year)

Enable range requests for resumable downloads

Configure CORS headers

Monitoring

Set up error tracking (Sentry, etc.)

Configure analytics (privacy-preserving)

Monitor service worker activation rate

Track model download success rate

Model Integration Guide
Recommended Models
LLM Options
Seed Model (Bundled)

Model: TinyLlama-1.1B-Chat-v1.0 (Q8_0)

Size: ~1.1GB → quantized to ~45MB

License: Apache-2.0 ✅ Redistributable

Source: https://huggingface.co/TinyLlama/TinyLlama-1.1B-Chat-v1.0

Quantization: llama.cpp Q8_0 format

Small Model (Auto-Download)

Model: Phi-2 (Q4_K_M)

Size: ~1.6GB → quantized to ~180MB

License: MIT ✅ Redistributable

Source: https://huggingface.co/microsoft/phi-2

Medium Model (Auto-Download)

Model: Llama-2-7B-Chat (Q4_K_M)

Size: ~7GB → quantized to ~420MB

License: Llama-2 ⚠️ Download-only (requires user acceptance)

Source: https://huggingface.co/meta-llama/Llama-2-7b-chat-hf

STT Options
Seed Model (Bundled)

Model: Whisper Tiny

Size: ~75MB

License: MIT ✅ Redistributable

Languages: 99 languages including Arabic

Source: https://github.com/openai/whisper

Upgraded Model (Auto-Download)

Model: Whisper Base

Size: ~140MB

License: MIT ✅ Redistributable

Better accuracy for medical terminology

Quantization Guide
# Install llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp
make

# Convert HuggingFace model to GGUF
python convert.py /path/to/model --outfile model-f16.gguf

# Quantize to Q8_0 (seed model)
./quantize model-f16.gguf model-q8.gguf Q8_0

# Quantize to Q4_K_M (production model)
./quantize model-f16.gguf model-q4.gguf Q4_K_M

# Verify model works
./main -m model-q8.gguf -p "Test prompt" -n 50

Model Manifest Schema
{
  id: string;              // Unique identifier
  name: string;            // Display name
  type: 'llm' | 'stt';     // Model type
  version: string;         // Version number
  size: number;            // Size in bytes
  quantization: string;    // Q8_0, Q4_K_M, etc.
  capabilities: string[];  // Features supported
  license: string;         // SPDX license identifier
  redistributable: boolean; // Can be bundled?
  checksum: string;        // SHA256 hash
  signature?: string;      // Optional GPG signature
  url?: string;            // Download URL (if not bundled)
  isSeed: boolean;         // Is this a seed model?
}

Fallback Strategies
Device Lacks WebAssembly

Display error message

Offer server-based inference (if user consents and is online)

Provide simplified heuristic-based suggestions

Insufficient Memory

Use smallest seed model only

Disable background model downloads

Implement aggressive garbage collection

Offer text-only mode (no STT)

No Storage Quota

Request persistent storage permission

Warn user about limited offline capability

Use in-memory cache only

Disable referral history

Slow Network

Show download progress with pause/resume

Allow user to defer model downloads

Prioritize seed model availability

Implement exponential backoff for retries

Production Recommendations
Hosting

Cloudflare Pages: Free, global CDN, automatic HTTPS

Vercel: Excellent DX, edge functions available

Netlify: Good PWA support, form handling

Model CDN

Cloudflare R2: S3-compatible, no egress fees

AWS S3 + CloudFront: Reliable, scalable

Backblaze B2: Cost-effective for large files

Monitoring

Sentry: Error tracking, performance monitoring

Plausible: Privacy-friendly analytics

Lighthouse CI: Automated performance audits

CI/CD Pipeline
# .github/workflows/deploy.yml
name: Deploy PWA
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run verify-models  # License check
      - run: npm run build
      - run: npm run test
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CF_API_TOKEN }}

Support & Resources
WASM ML Projects

llama.cpp: https://github.com/ggerganov/llama.cpp

whisper.cpp: https://github.com/ggerganov/whisper.cpp

Transformers.js: https://huggingface.co/docs/transformers.js

ONNX Runtime Web: https://onnxruntime.ai/docs/tutorials/web/

Model Sources

Hugging Face: https://huggingface.co/models

GGUF Models: https://huggingface.co/models?library=gguf

Whisper Models: https://github.com/openai/whisper

PWA Resources

Workbox: https://developers.google.com/web/tools/workbox

PWA Builder: https://www.pwabuilder.com/

Web.dev PWA Guide: https://web.dev/progressive-web-apps/

Troubleshooting
Service Worker Not Registering

Ensure HTTPS (or localhost)

Check browser console for errors

Verify sw.js is accessible

Clear browser cache and retry

Models Not Loading

Check network tab for 404s

Verify checksums match

Ensure CORS headers on CDN

Check IndexedDB quota

WASM Errors

Verify WASM files are served with correct MIME type

Check CSP allows wasm-unsafe-eval

Ensure sufficient memory available

Test in different browsers

Performance Issues

Profile with Chrome DevTools

Check for memory leaks

Reduce model size (more aggressive quantization)

Implement model sharding

Last Updated: 2025-10-01
Version: 1.0.0