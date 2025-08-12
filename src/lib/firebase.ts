import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    "projectId": "restotrack-9dp14",
    "appId": "1:919738285862:web:d272f1bec824d2baee8be7",
    "storageBucket": "restotrack-9dp14.appspot.com",
    "apiKey": "AIzaSyD8M48DUz5lB9XpH4WTNri_jgs5ViDLnxs",
    "authDomain": "restotrack-9dp14.firebaseapp.com",
    "measurementId": "",
    "messagingSenderId": "919738285862"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };
