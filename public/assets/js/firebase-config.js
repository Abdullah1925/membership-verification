import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    setPersistence,
    browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    setDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA44LCmmxKOufCDl_Qmu1glSmForMHfklw",
  authDomain: "mahrahcouncil.firebaseapp.com",
  projectId: "mahrahcouncil",
  storageBucket: "mahrahcouncil.firebasestorage.app",
  messagingSenderId: "234902373220",
  appId: "1:234902373220:web:f5e0597eaab78d8d653071"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

// Keep admins signed in across page reloads.
setPersistence(auth, browserLocalPersistence).catch(() => {});

export {
    app,
    auth,
    db,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    collection,
    addDoc,
    setDoc,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    query,
    orderBy
};