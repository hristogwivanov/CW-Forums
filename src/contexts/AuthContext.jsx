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
      const errorMessage = getFriendlyAuthErrorMessage(error);
      setAuthError(errorMessage);
      throw error;
    }
  }

  async function loginByUsername(username, password) {
    try {
      clearAuthError();
      return await loginService(username, password);
    } catch (error) {
      const errorMessage = getFriendlyAuthErrorMessage(error);
      setAuthError(errorMessage);
      throw error;
    }
  }

  const getFriendlyAuthErrorMessage = (error) => {
    const errorCode = error.code || '';
    
    const errorMessages = {
      'auth/invalid-credential': 'Incorrect username or password. Please try again.',
      'auth/user-not-found': 'No account found with this username. Please check your credentials.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/too-many-requests': 'Too many unsuccessful login attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your internet connection.',
      'auth/email-already-in-use': 'Email address already in use. Please try a different email address.',
      'auth/weak-password': 'Password is too weak. Please try a stronger password.',
      'auth/invalid-display-name': 'Invalid display name. Please try a different display name.'
    };
    
    return errorMessages[errorCode] || error.message || 'An error occurred during authentication. Please try again.';
  };

  async function logout() {
    try {
      clearAuthError();
      await logoutService();
    } catch (error) {
      const errorMessage = getFriendlyAuthErrorMessage(error);
      setAuthError(errorMessage);
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
