Role: You are a Principal Software Architect and Lead Backend Engineer.Context & Goal:
We are building a comprehensive CPALE (CPA Licensure Examination) Test Bank and Mock Exam System. We have established a standardized JSON seeder pipeline to extract exam questions across multiple review centers (ReSA, CPAR, PRTC, etc.) and tag them with PRC Table of Specifications (TOS) metadata.  We are now shifting from the Data Extraction Phase to the System Architecture & Implementation Phase. We need to design a scalable database schema, query engine, and dynamic TOS exam generator that consumes our seeded JSON data.  Core Requirements to Plan & Design:1. Database Schema Design (SQL / Prisma ORM)Design a database schema that efficiently stores and indexes the seeded JSON items.  Entities needed: Questions, Choices, TOS_Categories, Sources, Exams, UserExamSessions, UserAnswers.Indexing: Ensure fast lookup on tosCode, subject, difficulty, cognitiveLevel, and source.center.  Deduplication Strategy: Incorporate the canonicalConcept field to flag or merge duplicate questions coming from different review centers.  2. Seeder Ingestion PipelineWrite a robust TypeScript / Node.js / Python ingestion script that takes our populated JSON arrays, validates them, and inserts/upserts them into the database cleanly without corrupting existing records.3. Dynamic TOS Exam Generation AlgorithmPlan the algorithm that generates customized mock exams based on official PRC TOS allocations.  Weighting & Constraints: Must allow picking a subject (e.g., RFBT) and dynamically assembling an exam according to PRC weights (e.g., 30% Easy, 40% Moderate, 30% Difficult across specified TOS categories).  Randomization & Anti-Repetition: Prevent users from seeing duplicate questions in back-to-back exam sessions while maintaining exact TOS percentage requirements.4. API Endpoints ArchitectureOutline the core REST/gRPC/GraphQL endpoints for:POST /api/seeder/ingest (Batch bulk insertion for admins)POST /api/exams/generate (Generate TOS-compliant exam session)POST /api/exams/:id/submit (Evaluate answers, store score, return rationales)Sample Seeder JSON Record for Reference Schema:JSON[
  {
    "id": "rfbt-b51-001",
    "prompt": "In an obligation to deliver a specific or determinate thing subject to a suspensive condition...",
    "choices": [
      { "id": "a", "text": "The creditor bears the impairment" },
      { "id": "b", "text": "The debtor bears the impairment" },
      { "id": "c", "text": "The creditor can choose to exact fulfillment..." },
      { "id": "d", "text": "The creditor can ask for rescission..." }
    ],
    "correctChoiceId": "a",
    "rationale": "Under Art. 1189 of the Civil Code...",
    "source": {
      "center": "ReSA",
      "batch": "Batch 51 - May 2026 CPALE",
      "examType": "Final Pre-Board Examination"
    },
    "tos": {
      "subject": "RFBT",
      "topicCategory": "Law on Business Transactions",
      "subTopic": "Obligations",
      "tosCode": "A.1",
      "cognitiveLevel": "Applying",
      "difficulty": "Moderate"
    },
    "canonicalConcept": "In conditional obligations to deliver a determinate thing, loss/deterioration without fault..."
  }
]