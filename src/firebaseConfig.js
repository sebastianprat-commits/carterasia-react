// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLzxWyEvisDbhb4XOech2aPYmdUbSc7fY",
  authDomain: "carterasai-831f4.firebaseapp.com",
  projectId: "carterasai-831f4",
  storageBucket: "carterasai-831f4.firebasestorage.app",
  messagingSenderId: "980259778594",
  appId: "1:980259778594:web:8acfd5a13e17c8a4399a7b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
