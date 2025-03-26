import { auth, db } from '../../firebase.js';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export async function signup(email, password, username) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const newUser = userCredential.user;

  await updateProfile(newUser, { displayName: username });

  await storeUsernameEmailMapping(username, email);

  return newUser;
}

async function storeUsernameEmailMapping(username, email) {
  const usersRef = collection(db, 'users');
  await getDocs(query(usersRef, where('username', '==', username))).then(async (snapshot) => {
    if (!snapshot.empty) {
      return;
    }
    const docData = { username, email };
    const { addDoc } = await import('firebase/firestore');
    await addDoc(usersRef, docData);
  });
}

export async function loginByUsername(username, password) {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('username', '==', username));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('No user found with that username.');
  }

  const userDoc = snapshot.docs[0].data();
  const userEmail = userDoc.email;

  const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
  return userCredential.user;
}
