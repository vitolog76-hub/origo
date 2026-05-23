import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAyt_G3_fY9H3FOknFl_6Z3oJZkyE4-89w",
  authDomain: "origo-5fa9b.firebaseapp.com",
  projectId: "origo-5fa9b",
  storageBucket: "origo-5fa9b.firebasestorage.app",
  messagingSenderId: "808455875744",
  appId: "1:808455875744:web:20e3c17fbf313cf9d4edc5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);