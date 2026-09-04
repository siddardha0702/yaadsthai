// ================================
// FIREBASE SETUP
// ================================

import { initializeApp }
    from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    getDoc,
    doc,
    where,
    serverTimestamp,
    deleteDoc,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";


// ================================
// FIREBASE CONFIGURATION
// ================================

const firebaseConfig = {
    apiKey: "AIzaSyDwPw2DS2KMJeFyQme4dWMSXPlaD1wMgvU",
    authDomain: "cognitive-gaming.firebaseapp.com",
    projectId: "cognitive-gaming",
    storageBucket: "cognitive-gaming.firebasestorage.app",
    messagingSenderId: "403629835058",
    appId: "1:403629835058:web:d02620e9f67073aef0cd2b",
    measurementId: "G-43X8ZQXE8G"
};


// ================================
// INITIALIZE FIREBASE
// ================================

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const auth = getAuth(app);


// ================================
// PATIENT ID
// ================================

const PATIENT_ID = "FG36ijukJQ5rqkOT8";


// ================================
// EXPORT
// ================================

export {
    app,
    db,
    auth,
    PATIENT_ID,

    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,

    collection,
    addDoc,
    getDocs,
    query,
    getDoc,
    doc,
    where,
    serverTimestamp,
    deleteDoc,
    setDoc,
    updateDoc
};