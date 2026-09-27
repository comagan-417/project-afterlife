import { db } from '@/firebase.js';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';

export async function getProjectAnalysis(projectId) {
  try {
    const analysisRef = doc(db, 'projectAnalysis', projectId);
    const analysisSnap = await getDoc(analysisRef);
    if (analysisSnap.exists()) {
      return { id: analysisSnap.id, ...analysisSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting project analysis:", error);
    throw error;
  }
}

export async function getProjectScore(projectId) {
  try {
    const scoresRef = collection(db, 'projectScores');
    const q = query(scoresRef, where("project_id", "==", projectId), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() };
    }
    return null;
  } catch (error) {
    console.error("Error getting project score:", error);
    throw error;
  }
}

export async function getProjectScoreHistory(projectId) {
  try {
    const scoresRef = collection(db, 'projectScores');
    const q = query(scoresRef, where("project_id", "==", projectId), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting project score history:", error);
    throw error;
  }
}

export async function getProjectEvidence(projectId) {
  try {
    const evidenceRef = collection(db, 'projectEvidence');
    const q = query(evidenceRef, where("project_id", "==", projectId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error getting project evidence:", error);
    throw error;
  }
}

export async function getProjectTechnologies(projectId) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      return projectSnap.data().technologies || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting project technologies:", error);
    throw error;
  }
}

export async function getSupportRequirements(projectId) {
  try {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);
    if (projectSnap.exists()) {
      return projectSnap.data().support_required || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting support requirements:", error);
    throw error;
  }
}

export function watchProjectScore(projectId, callback) {
  const scoresRef = collection(db, 'projectScores');
  const q = query(scoresRef, where("project_id", "==", projectId), orderBy("created_at", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      callback({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error watching project score:", error);
  });
}

export function watchProjectAnalysis(projectId, callback) {
  const analysisRef = doc(db, 'projectAnalysis', projectId);
  
  return onSnapshot(analysisRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error watching project analysis:", error);
  });
}

export { triggerAnalysis, triggerReanalysis } from './projects.js'


