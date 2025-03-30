import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userDisplayName, setUserDisplayName] = useState(() => {
    return localStorage.getItem('userDisplayName') || "User";
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        
        if (user.displayName) {
          setUserDisplayName(user.displayName);
          localStorage.setItem('userDisplayName', user.displayName);
        } else {
          const storedName = localStorage.getItem('userDisplayName');
          if (storedName) {
            setUserDisplayName(storedName);
          }
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateDisplayName = (name) => {
    setUserDisplayName(name);
    localStorage.setItem('userDisplayName', name);
  };

  function logout() {
    localStorage.removeItem('userDisplayName');
    setUserDisplayName("User");
    signOut(auth);
  }

  const isAuthenticated = !!currentUser;
  const userName = userDisplayName || "User";

  const value = {
    currentUser,
    isAuthenticated,
    userName,
    updateDisplayName,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <p>Loading...</p> : children}
    </AuthContext.Provider>
  );
}
