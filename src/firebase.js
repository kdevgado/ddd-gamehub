import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBCCSxn1eU_-rJTotU5BWBWNngOMKLNpRA",
  authDomain: "ddd-gamehub.firebaseapp.com",
  projectId: "ddd-gamehub",
  storageBucket: "ddd-gamehub.firebasestorage.app",
  messagingSenderId: "743737146474",
  appId: "1:743737146474:web:e18efb897670079c3ade13",
  measurementId: "G-T55VB1YCCP"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

export async function ensureAnonymousUser() {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}
