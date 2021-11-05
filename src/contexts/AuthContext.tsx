/* eslint-disable react/prop-types */
import React, { useContext, useEffect, useState } from 'react';
import { auth } from '../../config/firebaseConfig';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState();
  const [loading, setLoading] = useState(true);

  function login(email, password) {
    // returns a promise
    return auth.signInWithEmailAndPassword(email, password);
  }

  function logout() {
    // returns a promise
    return auth.signOut();
  }

  // useEffect so not in render and only runs once
  useEffect(() => {
    return auth.onAuthStateChanged((user) => {
      // Do not render application until we have a user set for the
      // first time
      setCurrentUser(user);
      setLoading(false);
    });
  }, []);

  const value = {
    currentUser,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
