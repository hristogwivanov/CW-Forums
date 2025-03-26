import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebase';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAuthenticated = !!currentUser;
  const userName = currentUser?.displayName || '';

  const value = {
    currentUser,
    isAuthenticated,
    userName
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <p>Loading...</p> : children}
    </AuthContext.Provider>
  );
}
