import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { signup as signupService, loginByUsername as loginService, logout as logoutService } from '../services/authService';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  const clearAuthError = () => {
    setAuthError(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function signup(email, password, username) {
    try {
      clearAuthError();
      return await signupService(email, password, username);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  async function loginByUsername(username, password) {
    try {
      clearAuthError();
      return await loginService(username, password);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  async function logout() {
    try {
      clearAuthError();
      await logoutService();
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  }

  const value = {
    currentUser,
    isAuthenticated: !!currentUser,
    signup,
    loginByUsername,
    logout,
    authError,
    clearAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : <p>Loading...</p>}
    </AuthContext.Provider>
  );
}
