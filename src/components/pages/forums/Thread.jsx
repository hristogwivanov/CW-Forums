import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  getThreadWithPosts,
  createPost,
  isUserAdmin,
  isUserModerator,
  deleteThread,
  getCategoryById,
  updateThread,
  updatePost,
  deletePost
} from '../../../services/forumService';
import styles from './thread.module.css';
import Modal from '../../../components/organisms/modals/Modal';

export const Thread = () => {
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [editThreadModal, setEditThreadModal] = useState(false);
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [editingFirstPost, setEditingFirstPost] = useState(false);
  const [editedFirstPostContent, setEditedFirstPostContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [isModeratorUser, setIsModeratorUser] = useState(false);
  const [editPostModal, setEditPostModal] = useState(false);
  const [currentEditingPost, setCurrentEditingPost] = useState(null);
  const [editedPostContent, setEditedPostContent] = useState('');
  const [showDeletePostConfirm, setShowDeletePostConfirm] = useState(false);
  const [currentDeletingPost, setCurrentDeletingPost] = useState(null);

  const { threadId } = useParams();
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadThreadAndPosts = async () => {
      try {
        setLoading(true);
        
        const { thread: threadData, posts: postsData } = await getThreadWithPosts(threadId);
        
        if (!threadData) {
          setError('Thread not found');
          setLoading(false);
          return;
        }
        
        setThread(threadData);
        setPosts(postsData);
        
        if (threadData.categoryId) {
          const categoryData = await getCategoryById(threadData.categoryId);
          setCategory(categoryData);
        }
        
        setError('');
      } catch (err) {
        console.error('Error loading thread data:', err);
        setError('Failed to load thread data');
      } finally {
        setLoading(false);
      }
    };
    
    loadThreadAndPosts();
  }, [threadId]);

  useEffect(() => {
    const checkUserRoles = async () => {
      if (currentUser) {
        try {
          const adminResult = await isUserAdmin(currentUser);
          const modResult = await isUserModerator(currentUser);
          
          setIsAdminUser(adminResult);
          setIsModeratorUser(modResult);
        } catch (error) {
          console.error("Error checking user roles:", error);
          setIsAdminUser(false);
          setIsModeratorUser(false);
        }
      } else {
        setIsAdminUser(false);
        setIsModeratorUser(false);
      }
    };
    
    checkUserRoles();
  }, [currentUser]);

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      navigate('/login', { state: { from: `/thread/${threadId}` } });
      return;
    }
    
    if (!newPostContent.trim()) {
      setError('Post content cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      
      await createPost(
        threadId,
        newPostContent,
        currentUser.uid,
        currentUser.displayName || 'Anonymous User'
      );
      
      const { posts: updatedPosts } = await getThreadWithPosts(threadId);
      setPosts(updatedPosts);
      
      setNewPostContent('');
      setError('');
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleEditThread = () => {
    if (!currentUser || (!isAdminUser && !isModeratorUser && thread.createdBy !== currentUser.uid)) {
      setError('You do not have permission to edit this thread');
      return;
    }
    
    setNewThreadTitle(thread.title);
    
    if (posts.length > 0) {
      setEditedFirstPostContent(posts[0].content);
    }
    
    setEditThreadModal(true);
    setEditingFirstPost(true);
  };

  const handleUpdateThread = async (e) => {
    e.preventDefault();
    
    if (!newThreadTitle.trim()) {
      setError('Thread title cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      
      await updateThread(
        threadId,
        newThreadTitle,
        editedFirstPostContent,
        currentUser.uid
      );
      
      const { thread: updatedThread, posts: updatedPosts } = await getThreadWithPosts(threadId);
      setThread(updatedThread);
      setPosts(updatedPosts);
      
      setEditThreadModal(false);
      setEditingFirstPost(false);
      setError('');
    } catch (err) {
      console.error('Error updating thread:', err);
      setError('Failed to update thread');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThread = () => {
    if (!currentUser || (!isAdminUser && !isModeratorUser && thread.createdBy !== currentUser.uid)) {
      setError('You do not have permission to delete this thread');
      return;
    }
    
    setShowDeleteConfirm(true);
  };

  const confirmDeleteThread = async () => {
    try {
      await deleteThread(threadId, currentUser.uid);
      
      if (thread && thread.categoryId) {
        navigate(`/categories/${thread.categoryId}`);
      } else {
        navigate('/forums');
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
      
      if (error.message && error.message.includes("Permission denied")) {
        setError(error.message);
      } else {
        setError(`Failed to delete thread: ${error.message || 'Unknown error'}`);
      }
      
      setShowDeleteConfirm(false);
    }
  };

  const cancelDeleteThread = () => {
    setShowDeleteConfirm(false);
  };

  const handleEditPost = (post) => {
    if (!currentUser) {
      setError('You must be logged in to edit posts');
      return;
    }
    
    if (!isAdminUser && !isModeratorUser && post.createdBy !== currentUser.uid) {
      setError('You do not have permission to edit this post');
      return;
    }
    
    setCurrentEditingPost(post);
    setEditedPostContent(post.content);
    setEditPostModal(true);
  };

  const handleUpdatePost = async (e) => {
    e.preventDefault();
    
    if (!editedPostContent.trim()) {
      setError('Post content cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      
      await updatePost(
        currentEditingPost.id,
        editedPostContent,
        currentUser.uid
      );
      
      const { posts: updatedPosts } = await getThreadWithPosts(threadId);
      setPosts(updatedPosts);
      
      setEditPostModal(false);
      setCurrentEditingPost(null);
      setEditedPostContent('');
      setError('');
    } catch (err) {
      console.error('Error updating post:', err);
      if (err.message && err.message.includes('Permission denied')) {
        setError(err.message);
      } else {
        setError('Failed to update post');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = (post) => {
    if (!currentUser) {
      setError('You must be logged in to delete posts');
      return;
    }
    
    if (!isAdminUser && !isModeratorUser && post.createdBy !== currentUser.uid) {
      setError('You do not have permission to delete this post');
      return;
    }
    
    setCurrentDeletingPost(post);
    setShowDeletePostConfirm(true);
  };

  const confirmDeletePost = async () => {
    try {
      setLoading(true);
      
      await deletePost(
        currentDeletingPost.id,
        threadId,
        currentUser.uid
      );
      
      const { posts: updatedPosts } = await getThreadWithPosts(threadId);
      setPosts(updatedPosts);
      
      setShowDeletePostConfirm(false);
      setCurrentDeletingPost(null);
      setError('');
    } catch (err) {
      console.error('Error deleting post:', err);
      if (err.message && err.message.includes('Permission denied') || 
          err.message.includes('Cannot delete the first post')) {
        setError(err.message);
      } else {
        setError('Failed to delete post');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelDeletePost = () => {
    setShowDeletePostConfirm(false);
    setCurrentDeletingPost(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && !thread) {
    return (
      <div className={styles.threadContainer}>
        <div className={styles.loading}>Loading thread...</div>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div className={styles.threadContainer}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.threadContainer}>
      <div className={styles.breadcrumbs}>
        <Link to="/forums">Forums</Link>
        {category && (
          <>
            <span> &gt; </span>
            <Link to={`/categories/${category.id}`}>{category.name}</Link>
          </>
        )}
        <span> &gt; </span>
        <span className={styles.currentPage}>{thread?.title}</span>
      </div>

      <div className={styles.threadHeader}>
        <h1>{thread?.title}</h1>
        
        {currentUser && (isAdminUser || isModeratorUser || thread?.createdBy === currentUser.uid) && (
          <div className={styles.threadActions}>
            <button 
              className={`${styles.actionButton} ${styles.editButton}`}
              onClick={handleEditThread}
              title="Edit Thread"
            >
              ✎ Edit
            </button>
            <button 
              className={`${styles.actionButton} ${styles.deleteButton}`}
              onClick={handleDeleteThread}
              title="Delete Thread"
            >
              ✕ Delete
            </button>
          </div>
        )}
      </div>

      <div className={styles.postsList}>
        {posts.map((post, index) => (
          <div key={post.id} className={styles.postItem} id={`post-${post.id}`}>
            <div className={styles.postHeader}>
              <div className={styles.postAuthor}>
                <strong>{post.createdByUsername}</strong>
              </div>
              <div className={styles.postDate}>
                {formatDate(post.createdAt)}
                {post.isEdited && <span className={styles.editedBadge}> (edited {formatDate(post.editedAt)})</span>}
              </div>
            </div>
            <div className={styles.postContent}>
              {post.content}
            </div>
            {currentUser && (isAdminUser || isModeratorUser || post.createdBy === currentUser.uid) && index > 0 && (
              <div className={styles.postActions}>
                <button 
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={() => handleEditPost(post)}
                  title="Edit Reply"
                >
                  ✎ Edit
                </button>
                <button 
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDeletePost(post)}
                  title="Delete Reply"
                >
                  ✕ Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAuthenticated ? (
        <div className={styles.replyForm}>
          <h3>Post a Reply</h3>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleSubmitPost}>
            <textarea
              className={styles.replyTextarea}
              placeholder="Write your reply here..."
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              required
            />
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Posting...' : 'Post Reply'}
            </button>
          </form>
        </div>
      ) : (
        <div className={styles.loginPrompt}>
          <p>You need to be logged in to reply to this thread.</p>
          <Link to="/login" className={styles.loginButton}>
            Login
          </Link>
        </div>
      )}

      {editThreadModal && (
        <Modal
          isOpen={editThreadModal}
          onClose={() => setEditThreadModal(false)}
          title="Edit Thread"
        >
          <form onSubmit={handleUpdateThread} className={styles.editThreadForm}>
            <div className={styles.formGroup}>
              <label htmlFor="threadTitle">Thread Title:</label>
              <input
                type="text"
                id="threadTitle"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                className={styles.formInput}
                required
              />
            </div>
            
            {editingFirstPost && (
              <div className={styles.formGroup}>
                <label htmlFor="firstPostContent">First Post Content:</label>
                <textarea
                  id="firstPostContent"
                  value={editedFirstPostContent}
                  onChange={(e) => setEditedFirstPostContent(e.target.value)}
                  className={styles.formTextarea}
                  required
                />
              </div>
            )}
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setEditThreadModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editPostModal && (
        <Modal
          isOpen={editPostModal}
          onClose={() => setEditPostModal(false)}
          title="Edit Reply"
        >
          <form onSubmit={handleUpdatePost} className={styles.editPostForm}>
            <div className={styles.formGroup}>
              <label htmlFor="postContent">Content:</label>
              <textarea
                id="postContent"
                value={editedPostContent}
                onChange={(e) => setEditedPostContent(e.target.value)}
                className={styles.formTextarea}
                required
              />
            </div>
            
            <div className={styles.formActions}>
              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setEditPostModal(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={cancelDeleteThread}
          title="Confirm Delete"
        >
          <div className={styles.confirmDelete}>
            <p>Are you sure you want to delete this thread? This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button 
                onClick={confirmDeleteThread}
                className={styles.deleteButton}
              >
                Delete Thread
              </button>
              <button 
                onClick={cancelDeleteThread}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showDeletePostConfirm && (
        <Modal
          isOpen={showDeletePostConfirm}
          onClose={cancelDeletePost}
          title="Confirm Delete"
        >
          <div className={styles.confirmDelete}>
            <p>Are you sure you want to delete this reply? This action cannot be undone.</p>
            <div className={styles.confirmActions}>
              <button 
                onClick={confirmDeletePost}
                className={styles.deleteButton}
              >
                Delete Reply
              </button>
              <button 
                onClick={cancelDeletePost}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};