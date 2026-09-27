import { db, storage, functions } from '@/firebase.js';
import { 
  collection, 
  addDoc, 
  setDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { calculateScore } from '@/utils/scoringEngine';

// Timeout helper to prevent Firebase network promises from hanging UI indefinitely
function withTimeout(promise, ms = 1200) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), ms))
  ]);
}

const SEED_PROJECTS = [
  {
    id: 'proj_healthcare_ai_01',
    title: 'Autonomous AI Diagnostic & Triage System',
    domain: 'Healthcare / MedTech',
    description: 'An AI-driven clinical decision support and triage assistant utilizing computer vision and NLP for rapid patient risk stratification.',
    problemStatement: 'Rural clinics face diagnostic delays due to specialist scarcity and high patient volume.',
    proposedSolution: 'Deploy edge-AI vision and language models on low-power devices for instant preliminary triage.',
    technologies: ['Python', 'PyTorch', 'FastAPI', 'React', 'Docker'],
    lifecycleStage: 'Working Prototype',
    lifecycle_stage: 'Working Prototype',
    stage: 'Working Prototype',
    score: 92,
    overallScore: 92,
    completionPercentage: 92,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Technical Mentorship', 'Industry Validation', 'Funding']
  },
  {
    id: 'proj_agritech_iot_02',
    title: 'Smart Soil & Hydroponic Monitoring Sensor Mesh',
    domain: 'AgriTech',
    description: 'IoT sensor network for precision agriculture providing real-time soil moisture, NPK ratios, and automated irrigation control.',
    problemStatement: 'Water wastage and improper fertilizer application lower crop yield and degrade soil quality.',
    proposedSolution: 'Solar-powered wireless mesh nodes sending real-time analytics to a farmer mobile dashboard.',
    technologies: ['ESP32', 'LoRaWAN', 'Node.js', 'React Native', 'MQTT'],
    lifecycleStage: 'Prototype',
    lifecycle_stage: 'Prototype',
    stage: 'Prototype',
    score: 87,
    overallScore: 87,
    completionPercentage: 87,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Manufacturing', 'Product Development', 'Funding']
  },
  {
    id: 'proj_cybersecurity_03',
    title: 'Zero-Trust Microsegmentation for Cloud Infrastructure',
    domain: 'Cybersecurity',
    description: 'Automated policy engine that enforces dynamic microsegmentation and anomalous traffic detection across multi-cloud K8s clusters.',
    problemStatement: 'Lateral movement in cloud breaches remains undetected due to permissive internal networking.',
    proposedSolution: 'eBPF-based kernel observation and AI anomaly detection for automated traffic isolation.',
    technologies: ['Go', 'eBPF', 'Kubernetes', 'Terraform', 'React'],
    lifecycleStage: 'MVP',
    lifecycle_stage: 'MVP',
    stage: 'MVP',
    score: 94,
    overallScore: 94,
    completionPercentage: 94,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Technical Mentorship', 'Deployment', 'Industry Validation']
  },
  {
    id: 'proj_cleantech_energy_04',
    title: 'Distributed Microgrid Energy Router & Battery Balancer',
    domain: 'CleanTech / Environment',
    description: 'Smart energy router optimizing solar generation, battery storage, and peer-to-peer microgrid trading for residential communities.',
    problemStatement: 'Grid instability and inefficient battery utilization slow renewable energy adoption.',
    proposedSolution: 'Bidirectional power converter governed by predictive AI generation models.',
    technologies: ['C++', 'Embedded C', 'Python', 'WebSockets', 'InfluxDB'],
    lifecycleStage: 'Proof of Concept',
    lifecycle_stage: 'Proof of Concept',
    stage: 'Proof of Concept',
    score: 83,
    overallScore: 83,
    completionPercentage: 83,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Business Guidance', 'Incubation', 'Networking']
  },
  {
    id: 'proj_ai_vision_05',
    title: 'Multimodal Vision-Language Model for Document Intelligence',
    domain: 'Artificial Intelligence',
    description: 'High-throughput document extraction pipeline combining OCR with LLM reasoning for financial audit automated processing.',
    problemStatement: 'Manual invoice and tax document processing requires thousands of man-hours.',
    proposedSolution: 'End-to-end multimodal pipeline extracting structured JSON with 99.2% precision.',
    technologies: ['Python', 'Transformers', 'OpenCV', 'FastAPI', 'PostgreSQL'],
    lifecycleStage: 'Deployed / Production',
    lifecycle_stage: 'Deployed / Production',
    stage: 'Deployed / Production',
    score: 96,
    overallScore: 96,
    completionPercentage: 96,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Technical Mentorship', 'Infrastructure', 'Funding']
  },
  {
    id: 'proj_edtech_gamify_06',
    title: 'Adaptive Learning Assistant & Gamified STEM Platform',
    domain: 'EdTech',
    description: 'Personalized AI tutor that adapts problem difficulty based on real-time student cognitive load and error patterns.',
    problemStatement: 'One-size-fits-all STEM education leads to high dropout rates in foundational math and physics.',
    proposedSolution: 'Interactive gamified learning node engine with real-time feedback loops.',
    technologies: ['React', 'TypeScript', 'Node.js', 'Tailwind', 'MongoDB'],
    lifecycleStage: 'Beta',
    lifecycle_stage: 'Beta',
    stage: 'Beta',
    score: 88,
    overallScore: 88,
    completionPercentage: 88,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Product Development', 'Incubation', 'Networking']
  },
  {
    id: 'proj_robotics_auto_07',
    title: 'Autonomous Warehouse Swarm Robot Fleet Controller',
    domain: 'Robotics / Automation',
    description: 'Centralized ROS2 swarm management software enabling collaborative path planning and dynamic obstacle avoidance.',
    problemStatement: 'E-commerce fulfillment centers experience traffic bottlenecks with uncoordinated AGV robots.',
    proposedSolution: 'Decentralized auction-based task allocation algorithm running on ROS2 nodes.',
    technologies: ['ROS2', 'C++', 'Python', 'Gazebo', 'Docker'],
    lifecycleStage: 'Working Prototype',
    lifecycle_stage: 'Working Prototype',
    stage: 'Working Prototype',
    score: 91,
    overallScore: 91,
    completionPercentage: 91,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Manufacturing', 'Industry Validation', 'Technical Mentorship']
  },
  {
    id: 'proj_fintech_fraud_08',
    title: 'Real-Time Graph Analytics Anti-Money Laundering Engine',
    domain: 'FinTech',
    description: 'Sub-millisecond graph query engine detecting complex circular transaction schemes across banking networks.',
    problemStatement: 'Traditional rule-based fraud detection misses intricate multi-hop money laundering patterns.',
    proposedSolution: 'Heterogeneous graph neural network analyzing transaction topology in real time.',
    technologies: ['Rust', 'Neo4j', 'Kafka', 'Python', 'GraphQL'],
    lifecycleStage: 'MVP',
    lifecycle_stage: 'MVP',
    stage: 'MVP',
    score: 90,
    overallScore: 90,
    completionPercentage: 90,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Legal / IP', 'Funding', 'Business Guidance']
  },
  {
    id: 'proj_space_tech_09',
    title: 'SmallSat CubeSat Orbital Telemetry & Debris Avoidance',
    domain: 'Space Technology',
    description: 'Onboard edge computer executing real-time orbital propagation and laser communication link tracking.',
    problemStatement: 'Commercial CubeSats lack automated collision avoidance manoeuvres due to power limitations.',
    proposedSolution: 'Low-power FPGA accelerator calculating conjunction assessment and thruster burns.',
    technologies: ['VHDL', 'C', 'Python', 'RTOS', 'STK'],
    lifecycleStage: 'Proof of Concept',
    lifecycle_stage: 'Proof of Concept',
    stage: 'Proof of Concept',
    score: 89,
    overallScore: 89,
    completionPercentage: 89,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Research Collaboration', 'Infrastructure', 'Technical Mentorship']
  },
  {
    id: 'proj_smart_cities_10',
    title: 'Intelligent Traffic Signal Mesh & Emergency Vehicle Priority',
    domain: 'Smart Cities / IoT',
    description: 'City-wide computer vision grid dynamically altering traffic signals to grant green corridors for ambulances.',
    problemStatement: 'Emergency response times in urban centers are slowed by static traffic light schedules.',
    proposedSolution: 'YOLO edge nodes connected via 5G transmitting signal override requests.',
    technologies: ['Python', 'OpenCV', 'MQTT', 'Docker', 'React'],
    lifecycleStage: 'Working Prototype',
    lifecycle_stage: 'Working Prototype',
    stage: 'Working Prototype',
    score: 86,
    overallScore: 86,
    completionPercentage: 86,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Industry Validation', 'Deployment', 'Networking']
  },
  {
    id: 'proj_ml_predictive_11',
    title: 'Predictive Industrial Equipment Failure & Anomaly Suite',
    domain: 'Machine Learning',
    description: 'Vibration and acoustic analytics platform forewarning factory engineers of bearing wear 30 days in advance.',
    problemStatement: 'Unplanned industrial downtime costs manufacturing plants millions in lost output.',
    proposedSolution: 'Time-series Transformer models analyzing high-frequency accelerometer streams.',
    technologies: ['Python', 'TensorFlow', 'TimescaleDB', 'FastAPI', 'Vue.js'],
    lifecycleStage: 'Working Prototype',
    lifecycle_stage: 'Working Prototype',
    stage: 'Working Prototype',
    score: 93,
    overallScore: 93,
    completionPercentage: 93,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Industry Validation', 'Manufacturing', 'Funding']
  },
  {
    id: 'proj_cv_medical_12',
    title: 'High-Speed Microscopic Cell Counting & Segmentation',
    domain: 'Computer Vision',
    description: 'Automated pathology slide scanner identifying malignant cell structures with sub-micron accuracy.',
    problemStatement: 'Manual histopathology slide reviews suffer from inter-observer variability.',
    proposedSolution: 'U-Net segmentation pipeline integrated with motorized optical microscope hardware.',
    technologies: ['C++', 'OpenCV', 'PyTorch', 'Qt', 'CUDA'],
    lifecycleStage: 'MVP',
    lifecycle_stage: 'MVP',
    stage: 'MVP',
    score: 91,
    overallScore: 91,
    completionPercentage: 91,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Technical Mentorship', 'Research Collaboration', 'Incubation']
  },
  {
    id: 'proj_nlp_legal_13',
    title: 'Legal Contract Compliance & Risk Clause Extraction Engine',
    domain: 'Natural Language Processing',
    description: 'Domain-adapted LLM highlighting non-standard indemnification clauses and regulatory non-compliance.',
    problemStatement: 'Reviewing enterprise vendor contracts requires extensive billable legal hours.',
    proposedSolution: 'Fine-tuned LLaMA model performing automated clause extraction and risk scoring.',
    technologies: ['Python', 'HuggingFace', 'FastAPI', 'React', 'Elasticsearch'],
    lifecycleStage: 'Beta',
    lifecycle_stage: 'Beta',
    stage: 'Beta',
    score: 88,
    overallScore: 88,
    completionPercentage: 88,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Legal / IP', 'Business Guidance', 'Funding']
  },
  {
    id: 'proj_web3_decentralized_14',
    title: 'Decentralized Carbon Credit Registry & Verification Protocol',
    domain: 'Blockchain / Web3',
    description: 'Immutable ledger logging satellite verified reforestation plots to issue fraud-proof carbon offsets.',
    problemStatement: 'Double-counting and opaque verification undermine trust in voluntary carbon markets.',
    proposedSolution: 'Zero-Knowledge rollups verifying remote-sensing biomass metrics on-chain.',
    technologies: ['Solidity', 'Circom', 'TypeScript', 'Ethers.js', 'Next.js'],
    lifecycleStage: 'Proof of Concept',
    lifecycle_stage: 'Proof of Concept',
    stage: 'Proof of Concept',
    score: 85,
    overallScore: 85,
    completionPercentage: 85,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Legal / IP', 'Networking', 'Incubation']
  },
  {
    id: 'proj_supply_chain_15',
    title: 'Cold-Chain Pharmaceutical Visibility & Temperature Sensor Track',
    domain: 'Supply Chain',
    description: 'GPS and Bluetooth Low Energy sensor puck tracking vaccine temperature integrity across transit routes.',
    problemStatement: 'Temperature spikes during transit render thousands of bio-pharmaceutical shipments void.',
    proposedSolution: 'Real-time cellular logger broadcasting excursion alerts to freight dispatchers.',
    technologies: ['Embedded C', 'BLE', 'Cellular IoT', 'Node.js', 'React'],
    lifecycleStage: 'Working Prototype',
    lifecycle_stage: 'Working Prototype',
    stage: 'Working Prototype',
    score: 90,
    overallScore: 90,
    completionPercentage: 90,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Manufacturing', 'Industry Validation', 'Deployment']
  },
  {
    id: 'proj_social_impact_16',
    title: 'Accessible Sign-Language Real-Time Speech Translator',
    domain: 'Social Impact',
    description: 'Wearable motion-capture glove and smartphone app translating sign language into audible speech.',
    problemStatement: 'Speech and hearing-impaired individuals face communication barriers in everyday services.',
    proposedSolution: 'Flex-sensor gloves coupled with mobile neural network speech synthesis.',
    technologies: ['Arduino', 'Python', 'TensorFlow Lite', 'Flutter', 'Bluetooth'],
    lifecycleStage: 'Working Prototype',
    lifecycle_stage: 'Working Prototype',
    stage: 'Working Prototype',
    score: 94,
    overallScore: 94,
    completionPercentage: 94,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Product Development', 'Funding', 'Technical Mentorship']
  },
  {
    id: 'proj_manufacturing_17',
    title: 'Automated Optical Inspection for Defect Detection on PCB Lines',
    domain: 'Manufacturing',
    description: 'High-speed camera conveyor system detecting micro-solder bridges and missing SMT components.',
    problemStatement: 'Manual PCB inspection cannot keep pace with high-throughput SMT placement lines.',
    proposedSolution: 'Multi-angle illumination ring paired with spatial deep-learning anomaly detectors.',
    technologies: ['Python', 'OpenCV', 'PyTorch', 'Industrial PLC', 'C#'],
    lifecycleStage: 'MVP',
    lifecycle_stage: 'MVP',
    stage: 'MVP',
    score: 92,
    overallScore: 92,
    completionPercentage: 92,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Manufacturing', 'Industry Validation', 'Infrastructure']
  },
  {
    id: 'proj_transportation_18',
    title: 'Electric Bus Fleet Dynamic Charging & Route Optimization',
    domain: 'Transportation',
    description: 'Scheduling algorithm coordinating depot charger power limits with transit route battery depletion.',
    problemStatement: 'Simultaneous depot charging causes peak demand power penalties for municipal transit.',
    proposedSolution: 'Mixed-integer linear programming optimizer assigning staggered charging slots.',
    technologies: ['Python', 'OR-Tools', 'FastAPI', 'React', 'PostgreSQL'],
    lifecycleStage: 'Proof of Concept',
    lifecycle_stage: 'Proof of Concept',
    stage: 'Proof of Concept',
    score: 87,
    overallScore: 87,
    completionPercentage: 87,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Business Guidance', 'Deployment', 'Networking']
  },
  {
    id: 'proj_energy_storage_19',
    title: 'Next-Gen Solid-State Battery Thermal Management Controller',
    domain: 'Energy',
    description: 'Active liquid cooling manifold regulating thermal gradients during ultra-fast battery charging.',
    problemStatement: 'Thermal runaway risks limit maximum charge rates in solid-state battery cells.',
    proposedSolution: 'Model predictive thermal control algorithm driving variable speed coolant pumps.',
    technologies: ['MATLAB/Simulink', 'C++', 'CAN bus', 'Python', 'LabVIEW'],
    lifecycleStage: 'Prototype',
    lifecycle_stage: 'Prototype',
    stage: 'Prototype',
    score: 89,
    overallScore: 89,
    completionPercentage: 89,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Research Collaboration', 'Manufacturing', 'Funding']
  },
  {
    id: 'proj_other_domain_20',
    title: 'Cross-Domain Modular Open-Hardware Platform & Sensor Rig',
    domain: 'Other',
    description: 'Universal plug-and-play research kit bridging hardware peripherals to cloud analytics pipelines.',
    problemStatement: 'Interdisciplinary projects suffer from fragmented hardware-software compatibility.',
    proposedSolution: 'Standardized connector shield and auto-discovery driver library.',
    technologies: ['C++', 'Python', 'React', 'WebSockets', 'KiCAD'],
    lifecycleStage: 'Working Prototype',
    lifecycle_stage: 'Working Prototype',
    stage: 'Working Prototype',
    score: 88,
    overallScore: 88,
    completionPercentage: 88,
    is_published: true,
    isPublished: true,
    uploaded_by: 'student_demo_user',
    support_required: ['Technical Mentorship', 'Product Development', 'Incubation']
  }
];

function getAuthHeaders() {
  const token = localStorage.getItem('pa_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function getProject(projectId) {
  if (!projectId) return null;
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id,
        project: data,
        ...data
      };
    }
  } catch (error) {
    console.warn("API getProject error:", error);
  }

  // Fallback to showcase seed if matches
  const seedFound = SEED_PROJECTS.find(p => p.id === projectId);
  if (seedFound) {
    return {
      id: seedFound.id,
      project: { ...seedFound },
      ...seedFound
    };
  }

  return null;
}

export async function createProject(studentId, projectData) {
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(projectData)
    });

    if (res.ok) {
      const data = await res.json();
      return data.id;
    }
    const err = await res.json();
    throw new Error(err.error || 'Failed to create project');
  } catch (error) {
    console.error("API createProject error:", error);
    throw error;
  }
}

export async function updateProject(projectId, data) {
  try {
    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update project');
    }
    return await res.json();
  } catch (error) {
    console.error("API updateProject error:", error);
    throw error;
  }
}

export async function getStudentProjects(studentId) {
  try {
    const res = await fetch('/api/my-projects', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn("API getStudentProjects error:", error);
  }
  return [];
}

export async function getPublishedProjects(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.domain) params.set('domain', filters.domain);
    const url = `/api/projects${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const list = await res.json();
      if (list && list.length > 0) return list;
    }
  } catch (error) {
    console.warn("API getPublishedProjects error:", error);
  }
  return SEED_PROJECTS;
}

export async function saveProjectForMentor(mentorId, projectId) {
  try {
    const res = await fetch('/api/saved-projects', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ projectId })
    });
    return res.ok;
  } catch (error) {
    console.error("Error saving project:", error);
  }
}

export async function getSavedProjects(mentorId) {
  try {
    const res = await fetch('/api/my-saved-projects', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Error getting saved projects:", error);
  }
  return [];
}

export async function uploadProjectFile(userId, projectId, file) {
  let fileUrl = '';
  try {
    const fileRef = ref(storage, `projects/${userId}/${projectId}/${file.name}`);
    await withTimeout(uploadBytes(fileRef, file), 1200);
    fileUrl = await withTimeout(getDownloadURL(fileRef), 1200);
  } catch (storageErr) {
    console.warn("Storage upload notice (using secure local object reference):", storageErr);
    fileUrl = URL.createObjectURL(file);
  }

  const fileData = {
    project_id: projectId,
    projectId: projectId,
    user_id: userId,
    uploadedBy: userId,
    uploaded_by: userId,
    file_name: file.name,
    file_url: fileUrl,
    content_type: file.type || 'application/octet-stream',
    size: file.size,
    uploadedAt: new Date().toISOString()
  };

  try {
    const projectFilesRef = collection(db, 'projectFiles');
    await withTimeout(addDoc(projectFilesRef, {
      ...fileData,
      uploaded_at: serverTimestamp()
    }), 1200);
  } catch (e) {
    console.warn("Error saving file record to Firestore:", e);
  }

  try {
    const localFiles = JSON.parse(localStorage.getItem('pa_local_files') || '[]');
    localFiles.unshift(fileData);
    localStorage.setItem('pa_local_files', JSON.stringify(localFiles));
  } catch (e) {}

  return fileUrl;
}

export async function uploadProjectFiles(userId, projectId, files) {
  const results = [];
  if (!files || files.length === 0) return results;
  for (const file of files) {
    const url = await uploadProjectFile(userId, projectId, file);
    results.push({ file: file.name, url });
  }
  return results;
}

export async function getProjectFiles(projectId) {
  let results = [];
  try {
    const projectFilesRef = collection(db, 'projectFiles');
    const q = query(projectFilesRef, where("project_id", "==", projectId));
    const querySnapshot = await withTimeout(getDocs(q), 1200);
    if (!querySnapshot.empty) {
      results = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      const q2 = query(projectFilesRef, where("projectId", "==", projectId));
      const querySnapshot2 = await withTimeout(getDocs(q2), 1200);
      results = querySnapshot2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (error) {
    console.warn("Error getting project files from Firestore:", error);
  }

  try {
    const localFiles = JSON.parse(localStorage.getItem('pa_local_files') || '[]');
    const matching = localFiles.filter(f => f.projectId === projectId || f.project_id === projectId);
    const existingNames = new Set(results.map(r => r.file_name));
    for (const f of matching) {
      if (!existingNames.has(f.file_name)) {
        results.push(f);
      }
    }
  } catch (e) {}

  return results;
}

export async function runDeterministicEvaluation(projectId, projectData = {}) {
  const probStmt = projectData.problemStatement || '';
  const desc = projectData.description || '';
  const propSol = projectData.proposedSolution || '';
  const techs = Array.isArray(projectData.technologies) ? projectData.technologies : [];
  const comps = Array.isArray(projectData.components) ? projectData.components : [];
  const devStatus = projectData.developmentStatus || projectData.status || '';
  const github = projectData.githubUrl || projectData.github_url || '';
  const demo = projectData.demoUrl || projectData.demo_url || '';
  const video = projectData.videoUrl || projectData.video_url || '';
  const feedback = projectData.judgeFeedback || '';
  const prevScore = projectData.previousScore || 0;
  const team = Array.isArray(projectData.teamMembers) ? projectData.teamMembers : [];
  const domain = projectData.domain || 'Software';

  const probLen = probStmt.length;
  const probScore = probLen > 80 ? 4 : probLen > 30 ? 3 : probLen > 10 ? 2 : 1;
  const solLen = propSol.length + desc.length;
  const solScore = solLen > 150 ? 4 : solLen > 60 ? 3 : solLen > 20 ? 2 : 1;
  const novScore = (techs.length >= 3 || domain.includes('AI') || domain.includes('Vision') || domain.includes('Space')) ? 4 : (techs.length >= 1 ? 3 : 2);
  const implScore = (github && (techs.length > 0 || comps.length > 0)) ? 4 : (github || techs.length >= 2 || comps.length >= 2) ? 3 : (techs.length > 0 ? 2 : 1);
  const protoScore = (demo || video || devStatus.includes('Deployed') || devStatus.includes('MVP')) ? 4 : (devStatus.includes('Working') || devStatus.includes('Prototype')) ? 3 : (devStatus.includes('Proof') || devStatus.includes('Research')) ? 2 : 1;
  const feasScore = (comps.length > 0 && desc.length > 50) ? 4 : (techs.length > 0 || comps.length > 0) ? 3 : 2;
  const validScore = (feedback || prevScore > 0) ? 4 : (demo || video) ? 3 : (github ? 2 : 1);
  const scaleScore = (techs.some(t => /cloud|react|node|python|ai|ml|aws|docker|kubernetes/i.test(t)) || desc.length > 100) ? 4 : 3;
  const impactScore = (/health|agri|edtech|clean|social|city|cyber/i.test(domain) || probLen > 60) ? 4 : 3;
  const marketScore = (devStatus.includes('MVP') || devStatus.includes('Deployed') || demo) ? 4 : 3;
  const totalTextLen = probLen + desc.length + propSol.length;
  const docScore = totalTextLen > 250 ? 4 : totalTextLen > 100 ? 3 : 2;
  const deployScore = (devStatus.includes('Deployed') || devStatus.includes('MVP') || demo) ? 4 : (devStatus.includes('Working') ? 3 : 2);

  const rubricScores = {
    problem_relevance: { rubric_score: probScore, evidence: probLen > 50 ? `Detailed problem statement provided: "${probStmt.slice(0, 70)}..."` : 'Problem statement provided in proposal.', evidence_source: 'Project Proposal', evidence_level: probScore >= 3 ? 'A' : 'C', strength: 'Domain-specific problem targeting.', weakness: probLen < 50 ? 'Could expand user problem validation.' : 'Edge-case boundary user surveys needed.', recommendation: 'Perform target user interviews.', confidence: probScore >= 3 ? 'HIGH' : 'LOW' },
    solution_quality: { rubric_score: solScore, evidence: solLen > 100 ? `Proposed solution details documented: "${propSol.slice(0, 70)}..."` : 'Solution outline provided.', evidence_source: 'System Architecture', evidence_level: solScore >= 3 ? 'B' : 'C', strength: 'Logical solution model.', weakness: 'Detailed component interactions need documentation.', recommendation: 'Document hardware/software interface parameters.', confidence: solScore >= 3 ? 'HIGH' : 'MEDIUM' },
    innovation_novelty: { rubric_score: novScore, evidence: techs.length > 0 ? `Technologies identified: ${techs.join(', ')}.` : 'Tech stack specified.', evidence_source: 'Tech Stack', evidence_level: novScore >= 3 ? 'B' : 'C', strength: 'Modern component integration.', weakness: 'Prior art analysis recommended.', recommendation: 'Conduct patentability search.', confidence: 'MEDIUM' },
    technical_implementation: { rubric_score: implScore, evidence: github ? `Codebase repository linked: ${github}` : 'Technical architecture documented.', evidence_source: 'Source Code', evidence_level: github ? 'A' : 'C', strength: github ? 'Open codebase verification available.' : 'Core technical design defined.', weakness: github ? 'Automated test coverage can be expanded.' : 'GitHub repository link missing.', recommendation: 'Add automated unit tests.', confidence: github ? 'HIGH' : 'LOW' },
    prototype_completeness: { rubric_score: protoScore, evidence: demo ? `Live prototype demo linked: ${demo}` : `Development stage reported: ${devStatus || 'Idea'}`, evidence_source: 'Demo Verification', evidence_level: demo ? 'A' : 'C', strength: 'Identified implementation stage.', weakness: demo ? 'Field trial testing required.' : 'Live working demo link recommended.', recommendation: 'Publish video walkthrough or live demo link.', confidence: demo ? 'HIGH' : 'MEDIUM' },
    feasibility: { rubric_score: feasScore, evidence: comps.length > 0 ? `Hardware/Software components specified: ${comps.join(', ')}.` : 'Standard components used.', evidence_source: 'BOM / Component List', evidence_level: 'B', strength: 'Practically achievable implementation.', weakness: 'BOM cost optimization potential.', recommendation: 'Bench-test under stress conditions.', confidence: 'MEDIUM' },
    validation_evidence: { rubric_score: validScore, evidence: feedback ? `Judge feedback provided: "${feedback.slice(0, 60)}..."` : (prevScore ? `Previous score: ${prevScore}` : 'Bench validation stage.'), evidence_source: 'Validation Records', evidence_level: validScore >= 3 ? 'B' : 'D', strength: validScore >= 3 ? 'External validation evidence recorded.' : 'Initial testing phase.', weakness: 'Expand sample size for testing.', recommendation: 'Document user testing metrics.', confidence: validScore >= 3 ? 'HIGH' : 'LOW' },
    scalability: { rubric_score: scaleScore, evidence: 'Modular application architecture.', evidence_source: 'System Architecture', evidence_level: 'B', strength: 'Decoupled system components.', weakness: 'Cloud scaling infrastructure evaluation needed.', recommendation: 'Implement asynchronous message queues.', confidence: 'MEDIUM' },
    social_real_world_impact: { rubric_score: impactScore, evidence: `Target Domain: ${domain}`, evidence_source: 'Impact Statement', evidence_level: 'B', strength: 'Direct real-world applicability.', weakness: 'Deployment distribution model needed.', recommendation: 'Partner with incubators.', confidence: 'HIGH' },
    industry_market_potential: { rubric_score: marketScore, evidence: `Market application in ${domain}.`, evidence_source: 'Market Analysis', evidence_level: 'C', strength: 'Identified target market.', weakness: 'Competitor benchmarking required.', recommendation: 'Perform competitor analysis.', confidence: 'MEDIUM' },
    documentation_quality: { rubric_score: docScore, evidence: `Total documentation volume: ${totalTextLen} characters.`, evidence_source: 'Project Record', evidence_level: docScore >= 3 ? 'B' : 'C', strength: 'Structured problem and solution statement.', weakness: 'API documentation can be added.', recommendation: 'Add OpenAPI or README documentation.', confidence: 'HIGH' },
    deployment_readiness: { rubric_score: deployScore, evidence: `Lifecycle status: ${devStatus || 'Submitted'}`, evidence_source: 'Deployment Audit', evidence_level: 'C', strength: 'Clear developmental trajectory.', weakness: 'Production packaging and enclosures needed.', recommendation: 'Prepare production-ready packaging.', confidence: 'MEDIUM' }
  };

  const scoreResult = calculateScore(rubricScores);

  const pDefScore = Math.min(10, Math.max(2, Math.round((probScore / 4) * 10)));
  const dArchScore = Math.min(15, Math.max(3, Math.round((solScore / 4) * 15)));
  const implScoreVal = Math.min(25, Math.max(5, Math.round((implScore / 4) * 25)));
  const testValScore = Math.min(20, Math.max(4, Math.round((validScore / 4) * 20)));
  const docScoreVal = Math.min(10, Math.max(2, Math.round((docScore / 4) * 10)));
  const innovScoreVal = Math.min(10, Math.max(2, Math.round((novScore / 4) * 10)));
  const demoScoreVal = Math.min(10, Math.max(2, Math.round((protoScore / 4) * 10)));

  const totalCalculated = pDefScore + dArchScore + implScoreVal + testValScore + docScoreVal + innovScoreVal + demoScoreVal;

  const fullScoreRecord = {
    projectId: projectId,
    totalScore: totalCalculated,
    overallScore: totalCalculated,
    final_score: totalCalculated,
    display_score: totalCalculated,
    score_band: scoreResult.score_band,
    scoreBand: scoreResult.score_band,
    breakdown: scoreResult.breakdown,
    evidence_coverage: scoreResult.evidence_coverage,
    evidenceCoverage: scoreResult.evidence_coverage,
    confidence: scoreResult.confidence,
    confidenceLevel: scoreResult.confidence,
    calculatedAt: new Date().toISOString()
  };

  try {
    await withTimeout(setDoc(doc(db, 'projectScores', projectId), {
      ...fullScoreRecord,
      updatedAt: serverTimestamp()
    }, { merge: true }), 1200);

    await withTimeout(setDoc(doc(db, 'projects', projectId), {
      score: totalCalculated,
      completionPercentage: totalCalculated,
      analysis_status: 'complete',
      is_published: true,
      isPublished: true,
      updated_at: serverTimestamp()
    }, { merge: true }), 1200);
  } catch (e) {
    console.warn("Error persisting evaluation result to Firestore:", e);
  }

  try {
    const localScores = JSON.parse(localStorage.getItem('pa_local_scores') || '{}');
    localScores[projectId] = fullScoreRecord;
    localStorage.setItem('pa_local_scores', JSON.stringify(localScores));
  } catch (e) {}

  return {
    ...scoreResult,
    totalScore: totalCalculated,
    display_score: totalCalculated,
    final_score: totalCalculated,
    overallScore: totalCalculated
  };
}

export async function triggerAnalysis(projectId) {
  try {
    const res = await fetch(`/api/projects/${projectId}/analyze`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (error) {
    console.warn("API analyze error:", error);
  }
  const project = await getProject(projectId);
  return await runDeterministicEvaluation(projectId, project?.project || project || {});
}

export async function triggerReanalysis(projectId) {
  return triggerAnalysis(projectId);
}

export async function getProjectScore(projectId) {
  try {
    const snap = await withTimeout(getDoc(doc(db, 'projectScores', projectId)), 1200);
    if (snap.exists()) return { id: snap.id, ...snap.data() };

    const scoresRef = collection(db, 'projectScores');
    const q = query(scoresRef, where("projectId", "==", projectId));
    const querySnapshot = await withTimeout(getDocs(q), 1200);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
  } catch (error) {
    console.warn('Error getting project score from Firestore:', error);
  }

  try {
    const localScores = JSON.parse(localStorage.getItem('pa_local_scores') || '{}');
    if (localScores[projectId]) return localScores[projectId];
  } catch (e) {}

  try {
    const proj = await getProject(projectId);
    if (proj) {
      return await runDeterministicEvaluation(projectId, proj.project || proj);
    }
  } catch (e) {}

  return null;
}

export async function getProjectData(projectId) {
  const p = await getProject(projectId);
  const score = await getProjectScore(projectId);
  return {
    project: p || {},
    projectScore: score,
    projectAnalysis: p || {}
  };
}
