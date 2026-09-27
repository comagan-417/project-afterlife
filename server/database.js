import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(__dirname, 'afterlife.db');

export function initDatabase() {
  const db = new DatabaseSync(DB_PATH);

  // Enforce foreign key constraints
  db.exec('PRAGMA foreign_keys = ON;');

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('student', 'mentor', 'investor', 'industrialist', 'admin')),
      institution TEXT,
      department TEXT,
      organization TEXT,
      domain TEXT,
      domains_json TEXT,
      skills_json TEXT,
      support_types_json TEXT,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
  `);

  // Create Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      domain TEXT,
      problem_statement TEXT,
      proposed_solution TEXT,
      technologies_json TEXT,
      lifecycle_stage TEXT DEFAULT 'Submitted',
      score INTEGER DEFAULT 0,
      is_published INTEGER DEFAULT 1,
      access_status TEXT DEFAULT 'RESTRICTED',
      team_members_json TEXT,
      support_required_json TEXT,
      sha256_fingerprint TEXT,
      file_data_json TEXT,
      assigned_mentor_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(assigned_mentor_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published);
  `);

  // Migration safeguard for existing database files
  try {
    const tableInfo = db.prepare("PRAGMA table_info(projects)").all();
    const hasAssignedMentor = tableInfo.some(col => col.name === 'assigned_mentor_id');
    if (!hasAssignedMentor) {
      db.exec('ALTER TABLE projects ADD COLUMN assigned_mentor_id TEXT;');
    }
    db.exec('CREATE INDEX IF NOT EXISTS idx_projects_assigned_mentor ON projects(assigned_mentor_id);');
  } catch (err) {
    // Ignore migration error if already exists
  }

  // Create Mentorships table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mentorships (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      support_type TEXT,
      message TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'accepted', 'active', 'completed', 'declined', 'rejected')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_mentorships_user_id ON mentorships(user_id);
    CREATE INDEX IF NOT EXISTS idx_mentorships_student_id ON mentorships(student_id);
    CREATE INDEX IF NOT EXISTS idx_mentorships_project_id ON mentorships(project_id);
  `);

  // Create Saved Projects table
  db.exec(`
    CREATE TABLE IF NOT EXISTS saved_projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      saved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE(user_id, project_id)
    );
    CREATE INDEX IF NOT EXISTS idx_saved_projects_user_id ON saved_projects(user_id);
  `);

  // Create Access Requests table
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_requests (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      mentor_id TEXT NOT NULL,
      reason TEXT,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(mentor_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_access_requests_student_id ON access_requests(student_id);
    CREATE INDEX IF NOT EXISTS idx_access_requests_mentor_id ON access_requests(mentor_id);
  `);

  // Create Notifications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'general',
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
  `);

  // Seed showcase public projects if users table is empty
  seedInitialData(db);

  return db;
}

function seedInitialData(db) {
  const checkStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE id = ?');
  const result = checkStmt.get('sys_showcase_author');
  
  if (result && result.count > 0) {
    return; // Already seeded
  }

  // Create system showcase author
  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, salt, role, institution, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  insertUser.run(
    'sys_showcase_author',
    'Project Afterlife Showcase',
    'showcase@afterlife.dev',
    'none',
    'none',
    'student',
    'Global Innovation Archive'
  );

  const insertProject = db.prepare(`
    INSERT INTO projects (
      id, user_id, title, description, domain, problem_statement, proposed_solution,
      technologies_json, lifecycle_stage, score, is_published, support_required_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP)
  `);

  const SEED_PROJECTS = [
    {
      id: 'proj_showcase_01',
      title: 'Autonomous AI Diagnostic & Triage System',
      domain: 'Healthcare / MedTech',
      description: 'An AI-driven clinical decision support and triage assistant utilizing computer vision and NLP for rapid patient risk stratification.',
      problem_statement: 'Rural clinics face diagnostic delays due to specialist scarcity and high patient volume.',
      proposed_solution: 'Deploy edge-AI vision and language models on low-power devices for instant preliminary triage.',
      technologies: ['Python', 'PyTorch', 'FastAPI', 'React', 'Docker'],
      lifecycle_stage: 'Working Prototype',
      score: 92,
      support_required: ['Technical Mentorship', 'Industry Validation', 'Funding']
    },
    {
      id: 'proj_showcase_02',
      title: 'Smart Soil & Hydroponic Monitoring Sensor Mesh',
      domain: 'AgriTech',
      description: 'IoT sensor network for precision agriculture providing real-time soil moisture, NPK ratios, and automated irrigation control.',
      problem_statement: 'Water wastage and improper fertilizer application lower crop yield and degrade soil quality.',
      proposed_solution: 'Solar-powered wireless mesh nodes sending real-time analytics to a farmer mobile dashboard.',
      technologies: ['ESP32', 'LoRaWAN', 'Node.js', 'React Native', 'MQTT'],
      lifecycle_stage: 'Prototype',
      score: 87,
      support_required: ['Manufacturing', 'Product Development', 'Funding']
    },
    {
      id: 'proj_showcase_03',
      title: 'Zero-Trust Microsegmentation for Cloud Infrastructure',
      domain: 'Cybersecurity',
      description: 'Automated policy engine that enforces dynamic microsegmentation and anomalous traffic detection across multi-cloud K8s clusters.',
      problem_statement: 'Lateral movement in cloud breaches remains undetected due to permissive internal networking.',
      proposed_solution: 'eBPF-based kernel observation and AI anomaly detection for automated traffic isolation.',
      technologies: ['Go', 'eBPF', 'Kubernetes', 'Terraform', 'React'],
      lifecycle_stage: 'MVP',
      score: 94,
      support_required: ['Technical Mentorship', 'Deployment', 'Industry Validation']
    },
    {
      id: 'proj_showcase_04',
      title: 'Distributed Microgrid Energy Router & Battery Balancer',
      domain: 'CleanTech / Environment',
      description: 'Smart energy router optimizing solar generation, battery storage, and peer-to-peer microgrid trading for residential communities.',
      problem_statement: 'Grid instability and inefficient battery utilization slow renewable energy adoption.',
      proposed_solution: 'Bidirectional power converter governed by predictive AI generation models.',
      technologies: ['C++', 'Embedded C', 'Python', 'WebSockets', 'InfluxDB'],
      lifecycle_stage: 'Proof of Concept',
      score: 83,
      support_required: ['Business Guidance', 'Incubation', 'Networking']
    }
  ];

  for (const p of SEED_PROJECTS) {
    insertProject.run(
      p.id,
      'sys_showcase_author',
      p.title,
      p.description,
      p.domain,
      p.problem_statement,
      p.proposed_solution,
      JSON.stringify(p.technologies),
      p.lifecycle_stage,
      p.score,
      JSON.stringify(p.support_required)
    );
  }
}

let dbInstance = null;
export function getDb() {
  if (!dbInstance) {
    dbInstance = initDatabase();
  }
  return dbInstance;
}
