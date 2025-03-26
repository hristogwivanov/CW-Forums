import { auth } from '../../firebase.js';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export async function signup(email, password, username) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const newUser = userCredential.user;
  
  await updateProfile(newUser, { displayName: username });
  
  return newUser;
}
