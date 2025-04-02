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
  increment,
  limit
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
    
    return querySnapshot.docs.map(doc => {
      const threadData = doc.data();
      return {
        id: doc.id,
        ...threadData,
        replyCount: threadData.postCount ? threadData.postCount - 1 : 0
      };
    });
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
    
    const postsPromises = postsSnap.docs.map(async doc => {
      const postData = doc.data();
      const userProfilePic = await getUserProfilePic(postData.createdBy);
      const userPostCount = await getUserPostCount(postData.createdBy);
      
      return {
        id: doc.id,
        ...postData,
        profilePic: userProfilePic,
        userPostCount: userPostCount
      };
    });
    
    const posts = await Promise.all(postsPromises);
    
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
    
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      threadCount: increment(1)
    });
    
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

    const uid = typeof userId === 'object' && userId.uid ? userId.uid : userId;
    
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      if (userData.hasOwnProperty('role')) {
        return userData.role === 'admin';
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function isUserModerator(userId) {
  try {
    if (!userId) {
      return false;
    }
    
    const uid = typeof userId === 'object' && userId.uid ? userId.uid : userId;
    
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      
      if (userData.hasOwnProperty('role')) {
        return userData.role === 'moderator';
      } else {
        return false;
      }
    }
    return false;
  } catch (error) {
    console.error("Error checking moderator status:", error);
    return false;
  }
}

export async function createCategory(name, description = '') {
  try {
    const categoriesRef = collection(db, 'categories');
    
    const q = query(categoriesRef, orderBy('order', 'desc'));
    const querySnapshot = await getDocs(q);
    const highestOrder = querySnapshot.empty ? 0 : querySnapshot.docs[0].data().order || 0;
    
    const newCategory = {
      name: name,
      description: description,
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

export async function updateCategory(categoryId, name, description) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      name: name,
      description: description
    });
    
    return true;
  } catch (error) {
    console.error("Error updating category:", error);
    throw error;
  }
}

export async function updateCategoryOrder(categoryId, newOrder) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      order: newOrder
    });
    return true;
  } catch (error) {
    console.error("Error updating category order:", error);
    throw error;
  }
}

export async function moveCategoryUp(categoryId, currentOrder) {
  try {
    const categoriesRef = collection(db, 'categories');
    const q = query(
      categoriesRef, 
      where('order', '<', currentOrder),
      orderBy('order', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    const aboveCategory = querySnapshot.docs[0];
    const aboveCategoryData = aboveCategory.data();
    
    await updateCategoryOrder(categoryId, aboveCategoryData.order);
    await updateCategoryOrder(aboveCategory.id, currentOrder);
    
    return true;
  } catch (error) {
    console.error("Error moving category up:", error);
    throw error;
  }
}

export async function moveCategoryDown(categoryId, currentOrder) {
  try {
    const categoriesRef = collection(db, 'categories');
    const q = query(
      categoriesRef, 
      where('order', '>', currentOrder),
      orderBy('order', 'asc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return false;
    }
    
    const belowCategory = querySnapshot.docs[0];
    const belowCategoryData = belowCategory.data();

    await updateCategoryOrder(categoryId, belowCategoryData.order);
    await updateCategoryOrder(belowCategory.id, currentOrder);
    
    return true;
  } catch (error) {
    console.error("Error moving category down:", error);
    throw error;
  }
}

export async function deleteCategory(categoryId) {
  try {
    const categoryRef = doc(db, 'categories', categoryId);
    
    await deleteDoc(categoryRef);
    
    return true;
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
}

export async function updateThread(threadId, title, content, userId) {
  try {
    if (!userId) {
      throw new Error("User ID is required to update a thread");
    }
    
    const threadRef = doc(db, 'threads', threadId);
    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
      throw new Error("Thread not found");
    }
    
    const threadData = threadSnap.data();
    
    const isCreator = threadData.createdBy === userId;
    const isAdmin = await isUserAdmin(userId);
    const isModerator = await isUserModerator(userId);
    
    if (!isCreator && !isAdmin && !isModerator) {
      throw new Error("Permission denied: You can only edit your own threads");
    }
    
    await updateDoc(threadRef, {
      title: title,
      updatedAt: serverTimestamp()
    });
    
    if (content !== null) {
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('threadId', '==', threadId),
        orderBy('createdAt', 'asc'),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const firstPost = querySnapshot.docs[0];
        const postRef = doc(db, 'posts', firstPost.id);
        await updateDoc(postRef, {
          content: content,
          updatedAt: serverTimestamp()
        });
      }
    }
    
    return threadId;
  } catch (error) {
    console.error("Error updating thread:", error);
    throw error;
  }
}

export async function deleteThread(threadId, userId) {
  try {
    if (!userId) {
      throw new Error("User ID is required to delete a thread");
    }
    
    const threadRef = doc(db, 'threads', threadId);
    const threadSnap = await getDoc(threadRef);
    
    if (!threadSnap.exists()) {
      throw new Error('Thread not found');
    }
    
    const threadData = threadSnap.data();
    const categoryId = threadData.categoryId;
    
    const isCreator = threadData.createdBy === userId;
    const isAdmin = await isUserAdmin(userId);
    const isModerator = await isUserModerator(userId);
    
    if (!isCreator && !isAdmin && !isModerator) {
      throw new Error("Permission denied: You can only delete your own threads");
    }
    
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('threadId', '==', threadId));
    const querySnapshot = await getDocs(q);
    
    const deletionPromises = querySnapshot.docs.map(postDoc => 
      deleteDoc(doc(db, 'posts', postDoc.id))
    );
    
    await Promise.all(deletionPromises);
    
    await deleteDoc(threadRef);
    
    const categoryRef = doc(db, 'categories', categoryId);
    await updateDoc(categoryRef, {
      threadCount: increment(-1)
    });
    
    return true;
  } catch (error) {
    console.error("Error deleting thread:", error);
    throw error;
  }
}

export async function updatePost(postId, content, userId) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }
    
    const postData = postSnap.data();
    
    const isAdmin = await isUserAdmin(userId);
    const isModerator = await isUserModerator(userId);
    
    if (!isAdmin && !isModerator && postData.createdBy !== userId) {
      throw new Error('Permission denied: You do not have permission to edit this post');
    }
    
    await updateDoc(postRef, {
      content,
      editedAt: serverTimestamp(),
      isEdited: true
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error updating post:", error);
    throw error;
  }
}

export async function deletePost(postId, threadId, userId) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }
    
    const postData = postSnap.data();
    
    const isAdmin = await isUserAdmin(userId);
    const isModerator = await isUserModerator(userId);
    
    if (!isAdmin && !isModerator && postData.createdBy !== userId) {
      throw new Error('Permission denied: You do not have permission to delete this post');
    }
    
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef, 
      where('threadId', '==', threadId),
      orderBy('createdAt', 'asc'),
      limit(1)
    );
    const firstPostSnap = await getDocs(q);
    
    if (!firstPostSnap.empty && firstPostSnap.docs[0].id === postId) {
      throw new Error('Cannot delete the first post of a thread. Delete the entire thread instead.');
    }
    
    await deleteDoc(postRef);
    
    const threadRef = doc(db, 'threads', threadId);
    await updateDoc(threadRef, {
      postCount: increment(-1)
    });
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting post:", error);
    throw error;
  }
}

export async function getUserProfilePic(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      return userData.profilePic || 'https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg';
    }
    
    return 'https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg';
  } catch (error) {
    console.error("Error getting user profile pic:", error);
    return 'https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg';
  }
}

export async function getUserPostCount(userId) {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('createdBy', '==', userId));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.size;
  } catch (error) {
    console.error("Error getting user post count:", error);
    return 0;
  }
}