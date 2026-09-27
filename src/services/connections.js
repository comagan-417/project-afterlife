/**
 * Connections and Mentorship service
 * Connects directly to backend API with session token authentication.
 */

function getAuthHeaders() {
  const token = localStorage.getItem('pa_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Create a mentorship / guidance request from mentor to student project.
 */
export async function createConnectionRequest(mentorId, studentId, projectId, supportType, message) {
  try {
    const res = await fetch('/api/mentorship-requests', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        projectId,
        supportType: supportType || 'Technical Guidance',
        message: message || ''
      })
    });

    const data = await res.json();
    if (res.ok) {
      window.dispatchEvent(new Event('connections_updated'));
      window.dispatchEvent(new CustomEvent('guidance_request_created', { detail: data }));
      return data;
    }
    
    // Throw descriptive error from server (e.g., 409 Conflict duplicate message)
    throw new Error(data.error || data.message || 'Failed to create guidance request');
  } catch (err) {
    console.error("API createConnectionRequest error:", err);
    throw err;
  }
}

export const requestGuidance = createConnectionRequest;

/**
 * Get all mentorship connections for currently authenticated user.
 */
export async function getUserConnections(userId, role = 'mentor') {
  try {
    const endpoint = role === 'student' ? '/api/mentorship-requests/student' : 
                     role === 'mentor' ? '/api/mentorship-requests/mentor' : '/api/my-mentorships';
    const res = await fetch(endpoint, {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("API getUserConnections error:", err);
  }
  return [];
}

export async function getStudentConnections(studentId) {
  return getUserConnections(studentId, 'student');
}

export async function getStudentGuidanceRequests() {
  return getUserConnections(null, 'student');
}

export async function getMentorGuidanceRequests() {
  return getUserConnections(null, 'mentor');
}

/**
 * Accept a guidance / mentorship request (Student action).
 */
export async function acceptGuidanceRequest(requestId) {
  try {
    const res = await fetch(`/api/mentorship-requests/${requestId}/accept`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (res.ok) {
      window.dispatchEvent(new Event('connections_updated'));
      window.dispatchEvent(new Event('projects_updated'));
      return data;
    }
    throw new Error(data.error || 'Failed to accept guidance request');
  } catch (err) {
    console.error("API acceptGuidanceRequest error:", err);
    throw err;
  }
}

/**
 * Decline a guidance / mentorship request (Student action).
 */
export async function declineGuidanceRequest(requestId) {
  try {
    const res = await fetch(`/api/mentorship-requests/${requestId}/decline`, {
      method: 'PATCH',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (res.ok) {
      window.dispatchEvent(new Event('connections_updated'));
      window.dispatchEvent(new Event('projects_updated'));
      return data;
    }
    throw new Error(data.error || 'Failed to decline guidance request');
  } catch (err) {
    console.error("API declineGuidanceRequest error:", err);
    throw err;
  }
}

/**
 * Update connection status (accept / decline / active) - backwards compatibility.
 */
export async function updateConnectionStatus(connectionId, status) {
  const normStatus = (status || '').toLowerCase();
  if (normStatus === 'accepted' || normStatus === 'active') {
    return acceptGuidanceRequest(connectionId);
  }
  if (normStatus === 'declined' || normStatus === 'rejected') {
    return declineGuidanceRequest(connectionId);
  }

  try {
    const res = await fetch(`/api/mentorships/${connectionId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      window.dispatchEvent(new Event('connections_updated'));
      return await res.json();
    }
    const err = await res.json();
    throw new Error(err.error || 'Failed to update mentorship status');
  } catch (e) {
    console.error("API updateConnectionStatus error:", e);
    throw e;
  }
}

/**
 * Accepts mentorship connection.
 */
export async function acceptMentorshipConnection({ connectionId }) {
  if (connectionId) {
    return await acceptGuidanceRequest(connectionId);
  }
}

/**
 * Toggle save/unsave a project for a mentor.
 */
export async function toggleSaveProject(mentorId, projectId) {
  try {
    // Check if currently saved
    const savedRes = await fetch('/api/my-saved-projects', { headers: getAuthHeaders() });
    let isCurrentlySaved = false;
    if (savedRes.ok) {
      const list = await savedRes.json();
      isCurrentlySaved = list.some(p => p.id === projectId);
    }

    if (isCurrentlySaved) {
      await fetch(`/api/saved-projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      window.dispatchEvent(new CustomEvent('saved_projects_updated', { detail: { projectId, isSaved: false } }));
      return false;
    } else {
      await fetch('/api/saved-projects', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ projectId })
      });
      window.dispatchEvent(new CustomEvent('saved_projects_updated', { detail: { projectId, isSaved: true } }));
      return true;
    }
  } catch (err) {
    console.warn("Save project toggle error:", err);
    return false;
  }
}

export async function getMentorMentorships(mentorId) {
  return getUserConnections(mentorId, 'mentor');
}

export async function getStudentMentorships(studentId) {
  return getUserConnections(studentId, 'student');
}
