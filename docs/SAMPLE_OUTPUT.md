Sample JSON I/O Examples
Referral Output (Internal Format)
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": 1696118400000,
  "specialty": "Cardiology",
  "reason": "Evaluation of chest pain and cardiac risk assessment",
  "acuteness": "urgent",
  "timeframe": "1-2 weeks",
  "duration": "30-45 minutes",
  "clinicalSummary": "Patient is a 58-year-old male presenting with intermittent chest pain over the past 3 weeks. Pain is described as pressure-like, substernal, radiating to left arm. Associated with exertion, relieved by rest. No prior cardiac history. Risk factors include hypertension, hyperlipidemia, and family history of CAD. ECG shows non-specific ST changes. Troponin negative. Requires urgent cardiology evaluation for possible stress testing and further risk stratification.",
  "attachments": [],
  "confidence": 0.87,
  "modelUsed": "llm-small-q4",
  "language": "en"
}

FHIR ReferralRequest Export
{
  "resourceType": "ReferralRequest",
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "meta": {
    "versionId": "1",
    "lastUpdated": "2023-10-01T00:00:00.000Z",
    "profile": [
      "http://hl7.org/fhir/StructureDefinition/ReferralRequest"
    ]
  },
  "status": "draft",
  "intent": "proposal",
  "priority": "urgent",
  "subject": {
    "reference": "Patient/example",
    "display": "Anonymous Patient"
  },
  "occurrencePeriod": {
    "start": "2023-10-01",
    "end": "2023-10-15"
  },
  "authoredOn": "2023-10-01T00:00:00.000Z",
  "requester": {
    "agent": {
      "reference": "Practitioner/example",
      "display": "Dr. Example"
    }
  },
  "specialty": {
    "coding": [
      {
        "system": "http://snomed.info/sct",
        "code": "394579002",
        "display": "Cardiology"
      }
    ]
  },
  "reasonCode": [
    {
      "text": "Evaluation of chest pain and cardiac risk assessment"
    }
  ],
  "description": "Patient is a 58-year-old male presenting with intermittent chest pain over the past 3 weeks. Pain is described as pressure-like, substernal, radiating to left arm. Associated with exertion, relieved by rest. No prior cardiac history. Risk factors include hypertension, hyperlipidemia, and family history of CAD. ECG shows non-specific ST changes. Troponin negative. Requires urgent cardiology evaluation for possible stress testing and further risk stratification.",
  "supportingInfo": []
}

Arabic Language Example
{
  "id": "660f9511-f3ac-52e5-b827-557766551111",
  "timestamp": 1696118400000,
  "specialty": "طب القلب",
  "reason": "تقييم ألم الصدر وتقييم مخاطر القلب",
  "acuteness": "urgent",
  "timeframe": "1-2 أسابيع",
  "duration": "30-45 دقيقة",
  "clinicalSummary": "المريض رجل يبلغ من العمر 58 عامًا يعاني من ألم متقطع في الصدر على مدار الأسابيع الثلاثة الماضية. يوصف الألم بأنه يشبه الضغط، تحت القص، يمتد إلى الذراع الأيسر. مرتبط بالمجهود، يخف بالراحة. لا يوجد تاريخ قلبي سابق. عوامل الخطر تشمل ارتفاع ضغط الدم، وارتفاع الدهون، وتاريخ عائلي لأمراض الشرايين التاجية. تخطيط القلب يظهر تغيرات ST غير محددة. التروبونين سلبي. يتطلب تقييم قلبي عاجل لاختبار الإجهاد المحتمل وتقييم المخاطر الإضافي.",
  "attachments": [],
  "confidence": 0.82,
  "modelUsed": "llm-small-q4",
  "language": "ar"
}

STT Response Example
{
  "transcription": "Patient presents with chest pain radiating to left arm. Pain started three weeks ago. Associated with exertion. Patient has history of hypertension and high cholesterol. ECG shows ST changes. Recommend urgent cardiology referral.",
  "confidence": 0.89,
  "language": "en",
  "segments": [
    {
      "text": "Patient presents with chest pain radiating to left arm.",
      "start": 0.0,
      "end": 3.2
    },
    {
      "text": "Pain started three weeks ago.",
      "start": 3.2,
      "end": 5.1
    },
    {
      "text": "Associated with exertion.",
      "start": 5.1,
      "end": 6.8
    },
    {
      "text": "Patient has history of hypertension and high cholesterol.",
      "start": 6.8,
      "end": 10.2
    },
    {
      "text": "ECG shows ST changes.",
      "start": 10.2,
      "end": 12.0
    },
    {
      "text": "Recommend urgent cardiology referral.",
      "start": 12.0,
      "end": 14.5
    }
  ]
}

Model Manifest Example
{
  "version": "1.0.0",
  "lastUpdated": 1696118400000,
  "models": [
    {
      "id": "llm-seed-q8",
      "name": "Seed LLM (Q8)",
      "type": "llm",
      "version": "1.0",
      "size": 47185920,
      "quantization": "Q8_0",
      "capabilities": ["referral-generation", "en", "ar"],
      "license": "Apache-2.0",
      "redistributable": true,
      "checksum": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
      "isSeed": true
    },
    {
      "id": "llm-small-q4",
      "name": "Small LLM (Q4)",
      "type": "llm",
      "version": "1.0",
      "size": 188743680,
      "quantization": "Q4_K_M",
      "capabilities": ["referral-generation", "en", "ar", "high-accuracy"],
      "license": "Apache-2.0",
      "redistributable": true,
      "checksum": "b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1",
      "url": "https://models.example.com/llm-small-q4.gguf",
      "isSeed": false
    },
    {
      "id": "stt-whisper-tiny",
      "name": "Whisper Tiny (STT)",
      "type": "stt",
      "version": "1.0",
      "size": 78643200,
      "quantization": "Q5_1",
      "capabilities": ["stt", "en", "ar"],
      "license": "MIT",
      "redistributable": true,
      "checksum": "c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2",
      "isSeed": true
    }
  ]
}

Device Capabilities Example
{
  "hasWebAssembly": true,
  "hasWebGPU": true,
  "availableMemoryGB": 8,
  "cpuCores": 8,
  "isMobile": false,
  "recommendedModel": "llm-medium-q4"
}

Download Progress Event
{
  "modelId": "llm-small-q4",
  "bytesDownloaded": 94371840,
  "totalBytes": 188743680,
  "percentage": 50.0,
  "status": "downloading"
}

Encrypted Data Example
{
  "iv": "YWJjZGVmZ2hpamtsbW5vcA==",
  "data": "ZW5jcnlwdGVkX2RhdGFfaGVyZV9sb25nX2Jhc2U2NF9zdHJpbmc=",
  "salt": "c2FsdF9mb3Jfa2V5X2Rlcml2YXRpb24="
}

Inference Request Example
{
  "input": "Patient presents with chest pain radiating to left arm. Pain started three weeks ago. Associated with exertion. Patient has history of hypertension and high cholesterol. ECG shows ST changes.",
  "language": "en",
  "modelId": "llm-small-q4",
  "maxTokens": 512
}

Inference Response Example
{
  "output": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": 1696118400000,
    "specialty": "Cardiology",
    "reason": "Evaluation of chest pain and cardiac risk assessment",
    "acuteness": "urgent",
    "timeframe": "1-2 weeks",
    "duration": "30-45 minutes",
    "clinicalSummary": "Patient is a 58-year-old male presenting with intermittent chest pain...",
    "attachments": [],
    "confidence": 0.87,
    "modelUsed": "llm-small-q4",
    "language": "en"
  },
  "tokensUsed": 342,
  "inferenceTimeMs": 4523,
  "modelUsed": "llm-small-q4"
}

Storage Estimate Example
{
  "usage": 314572800,
  "quota": 10737418240,
  "percentage": 2.93
}

Validation Rules
Referral Output

id: UUID v4 format

timestamp: Unix timestamp (milliseconds)

specialty: Non-empty string

acuteness: One of: "routine", "urgent", "emergency"

confidence: Float between 0.0 and 1.0

language: ISO 639-1 code ("en", "ar")

FHIR ReferralRequest

Must conform to FHIR R4 specification

status: One of: "draft", "active", "completed", "cancelled"

intent: One of: "proposal", "plan", "order"

priority: One of: "routine", "urgent", "asap", "stat"

Model Metadata

checksum: 64-character hex string (SHA256)

size: Positive integer (bytes)

license: Valid SPDX identifier

url: Valid HTTPS URL (if not bundled)

Error Response Examples
Model Not Found
{
  "error": "ModelNotFoundError",
  "message": "Model 'llm-invalid' not found in registry",
  "code": "MODEL_NOT_FOUND"
}

Checksum Verification Failed
{
  "error": "IntegrityError",
  "message": "Checksum verification failed for model 'llm-small-q4'",
  "code": "CHECKSUM_MISMATCH",
  "expected": "a1b2c3...",
  "actual": "x9y8z7..."
}

Insufficient Storage
{
  "error": "StorageError",
  "message": "Insufficient storage quota for model download",
  "code": "QUOTA_EXCEEDED",
  "required": 188743680,
  "available": 52428800
}


Note: All timestamps are in milliseconds since Unix epoch. All sizes are in bytes.