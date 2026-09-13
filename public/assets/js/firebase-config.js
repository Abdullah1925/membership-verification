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

/**
 * Normalize a Google Drive share link into a clean, embeddable preview URL.
 *
 * Accepts:
 *   https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing
 *   https://drive.google.com/file/d/<FILE_ID>/preview
 *   https://drive.google.com/uc?export=download&id=<FILE_ID>
 * Returns https://drive.google.com/file/d/<FILE_ID>/preview.
 * Non-Drive URLs pass through unchanged.
 */
function normalizeDriveUrl(value) {
    if (!value) return "";

    const url = String(value).trim();
    const gdrive = url.match(/drive\.google\.com\/file\/d\/([^/?]+)/);
    if (gdrive) return `https://drive.google.com/file/d/${gdrive[1]}/preview`;

    const uc = url.match(/drive\.google\.com\/uc[^#]*[?&]id=([^&#]+)/);
    if (uc) return `https://drive.google.com/file/d/${uc[1]}/preview`;

    return url;
}

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
    orderBy,
    normalizeDriveUrl
};