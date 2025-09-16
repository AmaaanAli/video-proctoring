import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCeFVJFhM9HaxPQDOal12NjQ951Uhf1Zgc",
  authDomain: "video-proctoring-1e65c.firebaseapp.com",
  projectId: "video-proctoring-1e65c",
  storageBucket: "video-proctoring-1e65c.firebasestorage.app",
  messagingSenderId: "18905375112",
  appId: "1:18905375112:web:fa0122dd4489d863c99a3d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;





