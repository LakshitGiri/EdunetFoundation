import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, query, where, getDocs,
  updateDoc, doc, deleteDoc, orderBy
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCJZcI3GSI_YJrtRgOCxa1u_ABiY1kxwQI",
  authDomain: "movie-base-ec6e1.firebaseapp.com",
  projectId: "movie-base-ec6e1",
  storageBucket: "movie-base-ec6e1.firebasestorage.app",
  messagingSenderId: "186148460695",
  appId: "1:186148460695:web:8a73f772c294128b6471d2",
  measurementId: "G-R6Y5CTQTTR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export async function ensureAnonymousUser() {
  if (!auth.currentUser) await signInAnonymously(auth);
}

const commentsRef = (movieId) => query(
  collection(db, "comments"),
  where("movieId", "==", movieId),
  orderBy("createdAt", "desc")
);

export async function addComment(movieId, text, rating) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await addDoc(collection(db, "comments"), {
    movieId, userId: user.uid, text, rating, createdAt: new Date()
  });
}

export async function getComments(movieId) {
  const snapshot = await getDocs(commentsRef(movieId));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateComment(commentId, text, rating) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await updateDoc(doc(db, "comments", commentId), { text, rating });
}

export async function deleteComment(commentId) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  await deleteDoc(doc(db, "comments", commentId));
}

export { auth, onAuthStateChanged };
