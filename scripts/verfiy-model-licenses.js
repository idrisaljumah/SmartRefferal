/**
 * Build-time script to verify model licenses and redistribution rights
 * Run before build to ensure compliance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Model manifest location
const MANIFEST_PATH = path.join(__dirname, '../src/lib/model-manager.ts');

// Allowed licenses for redistribution
const ALLOWED_LICENSES = [
  'MIT',
  'Apache-2.0',
  'BSD-3-Clause',
  'CC-BY-4.0',
  'CC0-1.0'
];

// Licenses requiring special handling (download-only, not bundled)
const RESTRICTED_LICENSES = [
  'Llama-2',
  'Llama-3',
  'GPT-NeoX',
  'OPT-175B'
];

console.log('🔍 Verifying model licenses...\n');

// Read manifest (in production, this would parse the actual manifest file)
const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf-8');

// Extract model definitions (simplified parsing)
const modelMatches = manifestContent.matchAll(/license:\s*'([^']+)'/g);
const redistributableMatches = manifestContent.matchAll(/redistributable:\s*(true|false)/g);

const licenses = Array.from(modelMatches).map(m => m[1]);
const redistributable = Array.from(redistributableMatches).map(m => m[1] === 'true');

let hasErrors = false;
let warnings = [];

licenses.forEach((license, index) => {
  const isRedistributable = redistributable[index];
  
  console.log(`Model ${index + 1}:`);
  console.log(`  License: ${license}`);
  console.log(`  Redistributable: ${isRedistributable}`);
  
  // Check if license allows redistribution
  if (isRedistributable && !ALLOWED_LICENSES.includes(license)) {
    if (RESTRICTED_LICENSES.includes(license)) {
      console.log(`  ⚠️  WARNING: License "${license}" requires download-only distribution`);
      warnings.push(`Model ${index + 1} should be marked as redistributable: false`);
    } else {
      console.log(`  ❌ ERROR: Unknown license "${license}"`);
      hasErrors = true;
    }
  } else if (isRedistributable) {
    console.log(`  ✅ OK: Can be bundled with app`);
  } else {
    console.log(`  ℹ️  INFO: Will be downloaded from external source`);
  }
  
  console.log('');
});

// Check for bundled model files
const modelsDir = path.join(__dirname, '../public/models');
if (fs.existsSync(modelsDir)) {
  const modelFiles = fs.readdirSync(modelsDir);
  console.log(`\n📦 Found ${modelFiles.length} bundled model file(s):`);
  
  modelFiles.forEach(file => {
    const stats = fs.statSync(path.join(modelsDir, file));
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`  - ${file} (${sizeMB} MB)`);
    
    // Warn if bundled model is too large
    if (stats.size > 100 * 1024 * 1024) {
      warnings.push(`Model file "${file}" is large (${sizeMB} MB) - consider external hosting`);
    }
  });
}

// Summary
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ LICENSE VERIFICATION FAILED');
  console.log('\nPlease fix the license issues above before building.');
  process.exit(1);
} else if (warnings.length > 0) {
  console.log('⚠️  LICENSE VERIFICATION PASSED WITH WARNINGS');
  warnings.forEach(w => console.log(`  - ${w}`));
  console.log('\nBuild can proceed, but review warnings above.');
} else {
  console.log('✅ LICENSE VERIFICATION PASSED');
  console.log('\nAll models comply with redistribution requirements.');
}
console.log('='.repeat(60) + '\n');