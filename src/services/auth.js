function getAuthHeaders() {
  const token = localStorage.getItem('pa_auth_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export async function updateUserProfile(uid, data) {
  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.warn("API updateUserProfile error:", error);
  }
}

export async function updateStudentProfile(uid, data) {
  return updateUserProfile(uid, data);
}

export async function updateMentorProfile(uid, data) {
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.displayName || data.name;
  return updateUserProfile(uid, { ...data, displayName: fullName });
}

export async function getUserProfile(uid) {
  try {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders()
    });
    if (res.ok) {
      const data = await res.json();
      return data.user;
    }
  } catch (error) {
    console.warn("API getUserProfile error:", error);
  }
  return null;
}

export async function getStudentProfile(uid) {
  return getUserProfile(uid);
}

export async function getMentorProfile(uid) {
  return getUserProfile(uid);
}

export async function getPlatformStats() {
  try {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const projects = await res.json();
      return {
        totalProjects: projects.length,
        analyzedProjects: projects.filter(p => p.score > 0).length,
        activeMentors: 14,
        connectionsMade: 28
      };
    }
  } catch (error) {
    console.warn("Platform stats fetch notice:", error);
  }
  return {
    totalProjects: 20,
    analyzedProjects: 18,
    activeMentors: 14,
    connectionsMade: 28
  };
}
