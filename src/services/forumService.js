import { db } from '../../firebase.js';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  doc, 
  getDoc,
  updateDoc,
  orderBy,
  where,
  serverTimestamp,
  deleteDoc,
  increment
} from 'firebase/firestore';

export async function getCategories() {
  try {
    const categoriesRef = collection(db, 'categories');
    const q = query(categoriesRef, orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting categories:", error);
    throw error;
  }
}

export async function getCategoryById(categoryId) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    const categorySnap = await getDoc(categoryRef);
    
    if (!categorySnap.exists()) {
      return null;
    }
    
    return {
      id: categorySnap.id,
      ...categorySnap.data()
    };
  } catch (error) {
    console.error("Error getting category:", error);
    throw error;
  }
}

export async function getThreadsByCategory(categoryId) {
  try {
    const threadsRef = collection(db, 'threads');
    const q = query(
      threadsRef, 
      where('categoryId', '==', categoryId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting threads:", error);
    throw error;
  }
}

export async function getThreadWithPosts(threadId) {
  try {
    const threadRef = doc(db, 'threads', threadId);
    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
      throw new Error('Thread not found');
    }
    
    const thread = {
      id: threadSnap.id,
      ...threadSnap.data()
    };
    
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef, 
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc')
    );
    const postsSnap = await getDocs(q);
    
    const posts = postsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return { thread, posts };
  } catch (error) {
    console.error("Error getting thread with posts:", error);
    throw error;
  }
}

export async function createThread(categoryId, title, content, userId, username) {
  try {
    const threadsRef = collection(db, 'threads');
    const newThread = {
      categoryId,
      title,
      createdBy: userId,
      createdByUsername: username,
      createdAt: serverTimestamp(),
      lastPostAt: serverTimestamp(),
      postCount: 1
    };
    
    const threadDocRef = await addDoc(threadsRef, newThread);
    
    const postsRef = collection(db, 'posts');
    const newPost = {
      threadId: threadDocRef.id,
      content,
      createdBy: userId,
      createdByUsername: username,
      createdAt: serverTimestamp()
    };
    
    await addDoc(postsRef, newPost);
    return threadDocRef.id;
  } catch (error) {
    console.error("Error creating thread:", error);
    throw error;
  }
}

export async function createPost(threadId, content, userId, username) {
  try {
    const postsRef = collection(db, 'posts');
    const newPost = {
      threadId,
      content,
      createdBy: userId,
      createdByUsername: username,
      createdAt: serverTimestamp()
    };
    
    const postDocRef = await addDoc(postsRef, newPost);
    
    const threadRef = doc(db, 'threads', threadId);
    await updateDoc(threadRef, {
      lastPostAt: serverTimestamp(),
      postCount: increment(1)
    });
    
    return postDocRef.id;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
}

export async function isUserAdmin(userId) {
  try {
    if (!userId) {
      return false;
    }
    
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      if (userData.hasOwnProperty('role')) {
        return userData.role === 'admin';
      } else {
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function createCategory(name) {
  try {
    const categoriesRef = collection(db, 'categories');
    
    const q = query(categoriesRef, orderBy('order', 'desc'));
    const querySnapshot = await getDocs(q);
    const highestOrder = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().order || 0;
    
    const newCategory = {
      name: name,
      description: '',
      threadCount: 0,
      order: highestOrder + 1,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(categoriesRef, newCategory);
    return {
      id: docRef.id,
      ...newCategory
    };
  } catch (error) {
    throw error;
  }
}