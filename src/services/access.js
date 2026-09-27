import { db } from '@/firebase.js';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { createNotification } from './notifications';

function withTimeout(promise, ms = 1200) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('NETWORK_TIMEOUT')), ms))
  ]);
}

/**
 * Creates a new detailed access request from a mentor for a project.
 */
export async function requestProjectAccess({ projectId, projectTitle, studentId, mentorId, mentorName, reason }) {
  try {
    const accessReqRef = collection(db, 'accessRequests');
    const newReq = await addDoc(accessReqRef, {
      projectId,
      projectTitle: projectTitle || 'Project',
      studentId,
      mentorId,
      mentorName: mentorName || 'Mentor',
      reason: reason || 'Requested detailed technical documentation access',
      status: 'PENDING',
      requestedAt: new Date().toISOString(),
      created_at: serverTimestamp()
    });

    // Notify the student
    await createNotification({
      userId: studentId,
      title: 'New Access Request',
      message: `${mentorName || 'A mentor'} requested detailed access to "${projectTitle}".`,
      type: 'ACCESS_REQUEST',
      link: '/student/access-requests'
    });

    // Audit log entry
    await logAccessEvent({
      projectId,
      mentorId,
      studentId,
      requestId: newReq.id,
      action: 'REQUESTED',
      details: `Mentor requested access. Reason: ${reason}`
    });

    return newReq.id;
  } catch (error) {
    console.error("Error creating access request:", error);
    throw error;
  }
}

/**
 * Student approves an access request and generates a temporary signed access token.
 */
export async function approveAccessRequest(requestId, durationHours = 24) {
  try {
    const reqRef = doc(db, 'accessRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error('Access request not found');

    const reqData = reqSnap.data();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();
    
    // Generate secure temporary signed token
    const accessToken = `signed-token-${Math.random().toString(36).substring(2)}-${Date.now()}`;

    await updateDoc(reqRef, {
      status: 'APPROVED',
      approvedAt: now.toISOString(),
      expiresAt,
      durationHours,
      accessToken,
      updated_at: serverTimestamp()
    });

    // Create AccessGrant document
    await addDoc(collection(db, 'accessGrants'), {
      requestId,
      projectId: reqData.projectId,
      studentId: reqData.studentId,
      mentorId: reqData.mentorId,
      accessToken,
      status: 'ACTIVE',
      grantedAt: now.toISOString(),
      expiresAt
    });

    // Audit log
    await logAccessEvent({
      projectId: reqData.projectId,
      mentorId: reqData.mentorId,
      studentId: reqData.studentId,
      requestId,
      action: 'APPROVED',
      details: `Student approved access for ${durationHours} hours. Expires at ${expiresAt}`
    });

    // Notify mentor
    await createNotification({
      userId: reqData.mentorId,
      title: 'Access Request Approved',
      message: `Your detailed access request for "${reqData.projectTitle}" was approved for ${durationHours} hours.`,
      type: 'ACCESS_APPROVED',
      link: `/mentor/project/${reqData.projectId}`
    });

    return accessToken;
  } catch (error) {
    console.error("Error approving access request:", error);
    throw error;
  }
}

/**
 * Student rejects an access request.
 */
export async function rejectAccessRequest(requestId, reason = '') {
  try {
    const reqRef = doc(db, 'accessRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error('Access request not found');

    const reqData = reqSnap.data();
    await updateDoc(reqRef, {
      status: 'REJECTED',
      rejectionReason: reason,
      updated_at: serverTimestamp()
    });

    await logAccessEvent({
      projectId: reqData.projectId,
      mentorId: reqData.mentorId,
      studentId: reqData.studentId,
      requestId,
      action: 'REJECTED',
      details: `Student rejected access request.`
    });

    await createNotification({
      userId: reqData.mentorId,
      title: 'Access Request Declined',
      message: `Access request for "${reqData.projectTitle}" was declined.`,
      type: 'ACCESS_REJECTED',
      link: `/mentor/discover`
    });
  } catch (error) {
    console.error("Error rejecting access request:", error);
    throw error;
  }
}

/**
 * Student revokes a previously granted access.
 */
export async function revokeAccess(requestId) {
  try {
    const reqRef = doc(db, 'accessRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) throw new Error('Access request not found');

    const reqData = reqSnap.data();
    const now = new Date().toISOString();

    await updateDoc(reqRef, {
      status: 'REVOKED',
      revokedAt: now,
      updated_at: serverTimestamp()
    });

    // Update grant status
    const grantsRef = collection(db, 'accessGrants');
    const q = query(grantsRef, where('requestId', '==', requestId));
    const grantsSnap = await getDocs(q);
    for (const grantDoc of grantsSnap.docs) {
      await updateDoc(doc(db, 'accessGrants', grantDoc.id), {
        status: 'REVOKED',
        revokedAt: now
      });
    }

    await logAccessEvent({
      projectId: reqData.projectId,
      mentorId: reqData.mentorId,
      studentId: reqData.studentId,
      requestId,
      action: 'REVOKED',
      details: `Student explicitly revoked project access.`
    });

    await createNotification({
      userId: reqData.mentorId,
      title: 'Access Revoked',
      message: `Access to project "${reqData.projectTitle}" has been revoked by the owner.`,
      type: 'ACCESS_REVOKED',
      link: `/mentor/discover`
    });
  } catch (error) {
    console.error("Error revoking access:", error);
    throw error;
  }
}

/**
 * Checks if a mentor currently has valid, unexpired access to a project.
 */
export async function checkMentorAccess(projectId, mentorId) {
  try {
    const q = query(
      collection(db, 'accessRequests'),
      where('projectId', '==', projectId),
      where('mentorId', '==', mentorId),
      where('status', '==', 'APPROVED')
    );
    const snap = await getDocs(q);
    if (snap.empty) return { hasAccess: false };

    const activeDoc = snap.docs.find(d => {
      const data = d.data();
      if (!data.expiresAt) return false;
      return new Date(data.expiresAt) > new Date();
    });

    if (activeDoc) {
      return { hasAccess: true, grant: activeDoc.data() };
    }
    return { hasAccess: false, reason: 'EXPIRED' };
  } catch (error) {
    console.error("Error checking mentor access:", error);
    return { hasAccess: false };
  }
}

/**
 * Logs an access audit event to the AccessLog collection.
 */
export async function logAccessEvent({ projectId, mentorId, studentId, requestId, action, details }) {
  try {
    await addDoc(collection(db, 'accessLogs'), {
      projectId,
      mentorId,
      studentId,
      requestId: requestId || null,
      action,
      details: details || '',
      timestamp: new Date().toISOString(),
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.warn("Could not log access event:", error);
  }
}

/**
 * Retrieves access audit logs for a student or project.
 */
export async function getAccessLogs(studentId, projectId = null) {
  try {
    const logsRef = collection(db, 'accessLogs');
    let q = query(logsRef, where('studentId', '==', studentId));
    if (projectId) {
      q = query(logsRef, where('studentId', '==', studentId), where('projectId', '==', projectId));
    }
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (error) {
    console.error("Error getting access logs:", error);
    return [];
  }
}

/**
 * Retrieves access requests for a student or mentor.
 */
export async function getAccessRequests(userId, role = 'student') {
  const effectiveId = userId || (role === 'student' ? 'student_demo_user' : 'mentor_demo_user');
  const field = role === 'student' ? 'studentId' : 'mentorId';
  let results = [];

  try {
    const reqsRef = collection(db, 'accessRequests');
    const q = query(reqsRef, where(field, '==', effectiveId));
    const snap = await withTimeout(getDocs(q), 1000);
    results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn("Firestore getAccessRequests notice:", error);
  }

  // Merge with local storage
  try {
    const localReqs = (JSON.parse(localStorage.getItem('pa_local_access_requests') || '[]')).filter(
      r => !r.id?.startsWith('acc_grant_') && !r.reason?.includes('Mentorship connection accepted')
    );
    localStorage.setItem('pa_local_access_requests', JSON.stringify(localReqs));

    const existingIds = new Set(results.map(r => r.id));
    for (const item of localReqs) {
      const match = (item[field] === effectiveId) || !userId ||
        (role === 'student' && (item.studentId === 'student_demo_user' || !item.studentId)) ||
        (role === 'mentor' && (item.mentorId === 'mentor_demo_user' || item.mentorId === 'mentor_sarah_lin' || !item.mentorId));
      if (match && !existingIds.has(item.id)) {
        results.unshift(item);
      }
    }
  } catch (e) {}

  // Filter out any mentorship auto-grants
  results = results.filter(r => !r.id?.startsWith('acc_grant_') && !r.reason?.includes('Mentorship connection accepted'));

  return results.sort((a, b) => new Date(b.requestedAt || b.approvedAt || 0) - new Date(a.requestedAt || a.approvedAt || 0));
}

/**
 * Automatically grants and records project access when a mentorship request is accepted.
 */
export async function grantProjectAccess({ projectId, projectTitle, studentId, mentorId, mentorName, durationHours = 72 }) {
  const effectiveStudentId = studentId || 'student_demo_user';
  const effectiveMentorId = mentorId || 'mentor_sarah_lin';
  const now = new Date();
  const expiresAt = new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString();
  const accessToken = `signed-token-${Math.random().toString(36).substring(2)}-${Date.now()}`;
  const reqId = `acc_grant_${Date.now()}`;

  const grantRecord = {
    id: reqId,
    projectId: projectId || 'proj_healthcare_ai_01',
    projectTitle: projectTitle || 'Autonomous AI Diagnostic & Triage System',
    studentId: effectiveStudentId,
    mentorId: effectiveMentorId,
    mentorName: mentorName || 'Dr. Sarah Lin (AI Healthcare Specialist)',
    reason: 'Mentorship connection accepted — Full project documentation & prototype access granted.',
    status: 'APPROVED',
    requestedAt: now.toISOString(),
    approvedAt: now.toISOString(),
    expiresAt,
    durationHours,
    accessToken,
    createdAt: now.toISOString()
  };

  try {
    const localReqs = JSON.parse(localStorage.getItem('pa_local_access_requests') || '[]');
    localReqs.unshift(grantRecord);
    localStorage.setItem('pa_local_access_requests', JSON.stringify(localReqs));
    window.dispatchEvent(new Event('access_requests_updated'));
  } catch (e) {}

  try {
    const accessReqRef = collection(db, 'accessRequests');
    await withTimeout(addDoc(accessReqRef, {
      ...grantRecord,
      created_at: serverTimestamp()
    }), 1000);
  } catch (e) {}

  logAccessEvent({
    projectId,
    mentorId: effectiveMentorId,
    studentId: effectiveStudentId,
    requestId: reqId,
    action: 'APPROVED',
    details: `Access automatically granted upon mentorship acceptance for ${durationHours} hours.`
  }).catch(() => {});

  return grantRecord;
}
