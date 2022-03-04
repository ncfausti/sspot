/* eslint-disable react/prop-types */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  Firestore,
} from 'firebase/firestore';
import {
  User,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import log from 'electron-log';
import firebaseConfig from '../../config/firebaseConfig';

const fbase = initializeApp(firebaseConfig);
const auth = getAuth(fbase);

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function login(email: string, password: string) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    // returns a promise
    return auth.signOut();
  }

  useEffect(() => {
    return onAuthStateChanged(auth, (user: User) => {
      // Do not render application until we have a user set for the
      // first time
      log.info(user);
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
