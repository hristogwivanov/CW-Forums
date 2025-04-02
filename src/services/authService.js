import { auth, db } from '../../firebase.js';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  setDoc
} from 'firebase/firestore';

export async function signup(email, password, username) {
  try {
    const usersRef = collection(db, 'users');
    const usernameQuery = query(usersRef, where('username', '==', username));
    const usernameSnapshot = await getDocs(usernameQuery);
    
    if (!usernameSnapshot.empty) {
      const error = new Error('Username already exists!');
      error.code = 'auth/username-already-in-use';
      throw error;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      await updateProfile(newUser, { displayName: username });
      localStorage.setItem('userDisplayName', username);
      await storeUserData(username, email, newUser.uid);
      await newUser.reload();
      
      return newUser;
    } catch (authError) {
      console.error("Firebase auth error:", authError);
      throw authError;
    }
  } catch (error) {
    console.error("Signup error:", error);
    throw error;
  }
}

export async function storeUserData(username, email, userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      username,
      email,
      userId,
      createdAt: new Date(),
      role: 'user',
      profilePic: 'https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg'
    });
  } catch (error) {
    throw error;
  }
}

export async function loginByUsername(username, password) {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    
    let snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No user found with that username.');
    }

    const userDoc = snapshot.docs[0].data();
    const userEmail = userDoc.email;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
      const user = userCredential.user;
      
      try {
        await updateProfile(user, { displayName: username });
      } catch (profileError) {
        console.error("Error updating profile:", profileError);
      }
      
      localStorage.setItem('userDisplayName', username);
      
      try {
        await user.reload();
      } catch (reloadError) {
        console.error("Error reloading user:", reloadError);
      }
      
      return user;
    } catch (authError) {
      if (authError.code === 'auth/invalid-credential' || authError.code === 'auth/wrong-password') {
        throw new Error('Incorrect username or password. Please try again.');
      }
      throw new Error(authError.message || 'Authentication error. Please try again.');
    }
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
}

export async function logout() {
  localStorage.removeItem('userDisplayName');
  return signOut(auth);
}
