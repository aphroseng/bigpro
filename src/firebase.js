// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // 👈 1. Ongeramo iyi line

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_NNEMv2-s3K3z02ukVtxV4Y0QGDV3tmM",
  authDomain: "rentapp-d4bec.firebaseapp.com",
  projectId: "rentapp-d4bec",
  storageBucket: "rentapp-d4bec.firebasestorage.app",
  messagingSenderId: "100709224618",
  appId: "1:100709224618:web:0eb10ddc8c57a2df4440d3",
  measurementId: "G-1BYX1CKYPB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. Injiza iyi line ngo icyumba cya Database (Firestore) gitangire gukora kandi cyoherezwe hanze
export const db = getFirestore(app);