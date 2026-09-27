import React, { createContext, useContext, useState, useEffect } from 'react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = 'pa_auth_token';

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session from token
  useEffect(() => {
    async function initSession() {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            const userObj = {
              ...data.user,
              uid: data.user.id // Backwards compatibility for uid
            };
            setCurrentUser(userObj);
            setUserProfile(userObj);
          } else {
            clearSession();
          }
        } else {
          clearSession();
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      } finally {
        setLoading(false);
      }
    }

    initSession();
  }, []);

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('pa_user_session');
    localStorage.removeItem('pa_local_projects');
    localStorage.removeItem('pa_local_connections');
    localStorage.removeItem('pa_local_saved_projects');
    setCurrentUser(null);
    setUserProfile(null);
  }

  async function login(email, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }

    const { token, user } = data;
    localStorage.setItem(TOKEN_KEY, token);

    const userObj = {
      ...user,
      uid: user.id
    };

    setCurrentUser(userObj);
    setUserProfile(userObj);

    return { user: userObj, profile: userObj, role: userObj.role };
  }

  async function registerStudent(formData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        role: 'student'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    const { token, user } = data;
    localStorage.setItem(TOKEN_KEY, token);

    const userObj = {
      ...user,
      uid: user.id
    };

    setCurrentUser(userObj);
    setUserProfile(userObj);

    return { user: userObj, profile: userObj, role: userObj.role };
  }

  async function registerMentor(formData) {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        role: formData.role || 'mentor'
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    const { token, user } = data;
    localStorage.setItem(TOKEN_KEY, token);

    const userObj = {
      ...user,
      uid: user.id
    };

    setCurrentUser(userObj);
    setUserProfile(userObj);

    return { user: userObj, profile: userObj, role: userObj.role };
  }

  async function logout() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
    }
    clearSession();
  }

  const value = {
    currentUser,
    userProfile,
    userRole: userProfile?.role || currentUser?.role || 'student',
    token: localStorage.getItem(TOKEN_KEY),
    login,
    logout,
    registerStudent,
    registerMentor,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <LoadingSpinner fullscreen text="Connecting to Project Afterlife..." />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export { AuthContext };
