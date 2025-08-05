// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLzxWyEvisDbhb4XOech2aPYmdUbSc7fY",
  authDomain: "carterasai-831f4.firebaseapp.com",
  projectId: "carterasai-831f4",
  storageBucket: "carterasai-831f4.appspot.com",
  messagingSenderId: "980259778594",
  appId: "1:980259778594:web:8acfd5a13e17c8a4399a7b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
