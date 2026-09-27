// ─── Scoring Criteria ────────────────────────────────────────────────────────
export const SCORING_CRITERIA = [
  {
    id: 'problem_relevance',
    label: 'Problem Relevance',
    weight: 12,
    description: 'Is the problem clearly defined, real, significant and evidenced?',
  },
  {
    id: 'solution_quality',
    label: 'Solution Quality',
    weight: 10,
    description: 'Does the solution logically address the problem? Is it technically coherent?',
  },
  {
    id: 'innovation',
    label: 'Innovation / Novelty',
    weight: 10,
    description: 'Novel approach, novel combination of technologies, differentiation from existing solutions.',
  },
  {
    id: 'technical_implementation',
    label: 'Technical Implementation',
    weight: 15,
    description: 'Actual implementation evidence: code, hardware, architecture, APIs, working modules.',
  },
  {
    id: 'prototype_completeness',
    label: 'Prototype Completeness',
    weight: 10,
    description: 'Current development stage: idea → PoC → prototype → working prototype → MVP → demo.',
  },
  {
    id: 'feasibility',
    label: 'Feasibility',
    weight: 10,
    description: 'Technical, resource, cost and implementation feasibility.',
  },
  {
    id: 'validation',
    label: 'Validation / Evidence',
    weight: 10,
    description: 'Testing, experimental results, user feedback, benchmarks, real-world measurements.',
  },
  {
    id: 'scalability',
    label: 'Scalability',
    weight: 6,
    description: 'Can the solution scale to more users, larger datasets, and greater complexity?',
  },
  {
    id: 'social_impact',
    label: 'Social / Real-World Impact',
    weight: 6,
    description: 'Potential users affected, social, environmental, and economic value.',
  },
  {
    id: 'industry_potential',
    label: 'Industry / Market Potential',
    weight: 5,
    description: 'Industry applicability, potential customers, adoption possibility.',
  },
  {
    id: 'documentation',
    label: 'Documentation Quality',
    weight: 3,
    description: 'README, architecture docs, setup instructions, technical clarity.',
  },
  {
    id: 'deployment_readiness',
    label: 'Deployment Readiness',
    weight: 3,
    description: 'Deployment status, reliability, security, infrastructure readiness.',
  },
]

export const TOTAL_WEIGHT = SCORING_CRITERIA.reduce((s, c) => s + c.weight, 0) // 100

// ─── Score Bands ─────────────────────────────────────────────────────────────
export const SCORE_BANDS = [
  { min: 90, max: 100, label: 'Highly Developed Evidence',            color: 'brand-green' },
  { min: 75, max: 89,  label: 'Strong Development Evidence',          color: 'brand-blue'  },
  { min: 60, max: 74,  label: 'Promising — Requires Development',     color: 'brand-cyan'  },
  { min: 40, max: 59,  label: 'Early Development',                    color: 'brand-amber' },
  { min: 0,  max: 39,  label: 'Insufficient Evidence / Early Stage',  color: 'brand-rose'  },
]

// ─── Evidence Levels ─────────────────────────────────────────────────────────
export const EVIDENCE_LEVELS = {
  A: { label: 'Level A — Verified',   description: 'Working demo, test results, GitHub, hardware prototype, real testing', color: 'text-green-400' },
  B: { label: 'Level B — Documented', description: 'Architecture diagrams, screenshots, code snippets, dataset results',   color: 'text-blue-400'  },
  C: { label: 'Level C — Described',  description: 'README, PPT, project description, student explanation',                color: 'text-amber-400' },
  D: { label: 'Level D — Claimed',    description: 'Statements without supporting evidence',                               color: 'text-rose-400'  },
}

// ─── Confidence Levels ───────────────────────────────────────────────────────
export const CONFIDENCE = {
  HIGH:   { label: 'HIGH',   color: 'text-green-400', bg: 'bg-green-400/10' },
  MEDIUM: { label: 'MEDIUM', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  LOW:    { label: 'LOW',    color: 'text-rose-400',  bg: 'bg-rose-400/10'  },
}

// Helper to create dual object/string items
function createOptionItem(name) {
  return {
    id: name,
    value: name,
    label: name,
    toString() { return name; }
  };
}

// ─── Project Types ───────────────────────────────────────────────────────────
export const PROJECT_TYPES = [
  'Software',
  'Hardware',
  'AI/ML',
  'IoT',
  'Embedded Systems',
  'Web Application',
  'Mobile Application',
  'Research',
  'Business/Product',
  'Social Innovation',
  'Robotics',
  'Blockchain',
  'Other',
].map(createOptionItem)

// ─── Domains ─────────────────────────────────────────────────────────────────
export const DOMAINS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Computer Vision',
  'Natural Language Processing',
  'Healthcare / MedTech',
  'AgriTech',
  'EdTech',
  'FinTech',
  'CleanTech / Environment',
  'Smart Cities / IoT',
  'Cybersecurity',
  'Robotics / Automation',
  'Blockchain / Web3',
  'Supply Chain',
  'Social Impact',
  'Space Technology',
  'Manufacturing',
  'Transportation',
  'Energy',
  'Other',
].map(createOptionItem)

// ─── Development Stages ──────────────────────────────────────────────────────
export const DEV_STAGES = [
  'Idea / Concept',
  'Research Phase',
  'Proof of Concept',
  'Prototype',
  'Working Prototype',
  'MVP',
  'Beta',
  'Deployed / Production',
].map(createOptionItem)

// ─── Support Types ───────────────────────────────────────────────────────────
export const SUPPORT_TYPES = [
  'Technical Mentorship',
  'Funding',
  'Industry Validation',
  'Product Development',
  'Business Guidance',
  'Infrastructure',
  'Manufacturing',
  'Deployment',
  'Incubation',
  'Networking',
  'Research Collaboration',
  'Legal / IP',
].map(createOptionItem)

// ─── Lifecycle Stages ────────────────────────────────────────────────────────
export const LIFECYCLE_STAGES = [
  'Hackathon Completed',
  'Submitted',
  'AI Analyzed',
  'Published',
  'Discovered',
  'Mentor Interest',
  'Connection',
  'Mentorship',
  'Prototype Improvement',
  'Industry Validation',
  'Funding / Incubation',
  'Adoption',
  'Deployment',
].map(createOptionItem)

// ─── User Roles ───────────────────────────────────────────────────────────────
export const USER_ROLES = {
  STUDENT:      'student',
  MENTOR:       'mentor',
  INVESTOR:     'investor',
  INDUSTRIALIST:'industrialist',
  ADMIN:        'admin',
}

export const MENTOR_ROLES = ['mentor', 'investor', 'industrialist']

// ─── Emulator ports ──────────────────────────────────────────────────────────
export const EMULATOR_PORTS = {
  AUTH:      9099,
  FIRESTORE: 8080,
  STORAGE:   9199,
  FUNCTIONS: 5001,
  HOSTING:   5000,
  UI:        4000,
}
