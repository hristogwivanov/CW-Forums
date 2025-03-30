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
  getDocs,
} from 'firebase/firestore';

export async function signup(email, password, username) {
  const usersRef = collection(db, 'users');
  const usernameQuery = query(usersRef, where('username', '==', username));
  const usernameSnapshot = await getDocs(usernameQuery);
  
  if (!usernameSnapshot.empty) {
    throw new Error('Username already exists!');
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const newUser = userCredential.user;

  await updateProfile(newUser, { displayName: username });
  
  localStorage.setItem('userDisplayName', username);
  
  await storeUsernameEmailMapping(username, email, 'user');
  
  await newUser.reload();
  
  return newUser;
}


async function storeUsernameEmailMapping(username, email, role = 'user') {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(query(usersRef, where('username', '==', username)));
    
    if (!snapshot.empty) {
      return;
    }
    
    const docData = { username, email, role };
    const { addDoc } = await import('firebase/firestore');
    await addDoc(usersRef, docData);
  } catch (error) {
    console.warn("Error storing username-email mapping:", error.message);
  }
}


export async function loginByUsername(username, password) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    
    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (firestoreError) {
      console.warn("Firestore error when retrieving user:", firestoreError.message);
      throw new Error('Unable to retrieve user information. Please try again later.');
    }

    if (snapshot.empty) {
      throw new Error('No user found with that username.');
    }

    const userDoc = snapshot.docs[0].data();
    const userEmail = userDoc.email;

    const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
    const user = userCredential.user;
    
    try {
      await updateProfile(user, { displayName: username });
    } catch (profileError) {
      console.warn("Error updating profile:", profileError.message);
    }
    
    localStorage.setItem('userDisplayName', username);
    
    try {
      await user.reload();
    } catch (reloadError) {
      console.warn("Error reloading user profile:", reloadError.message);
    }
    
    return user;
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
}
