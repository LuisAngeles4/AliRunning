// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBwihLvVSqspLTIYXwX6OVj8vZHlZnqzEo",
    authDomain: "alirunning.firebaseapp.com",
    projectId: "alirunning",
    storageBucket: "alirunning.firebasestorage.app",
    messagingSenderId: "343162122660",
    appId: "1:343162122660:web:0e7ecfdb2df84e513b5131",
    measurementId: "G-08J1D5C60G"
}

const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);
export const db = getFirestore(app);