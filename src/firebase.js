import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDVFgw_hGcDQHf0iCo2adlkDOL6U7VsdaM",
  authDomain: "cubecon-2026.firebaseapp.com",
  projectId: "cubecon-2026",
  storageBucket: "cubecon-2026.firebasestorage.app",
  messagingSenderId: "661185183975",
  appId: "1:661185183975:web:c2daafe316604a349be242"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export default app;
