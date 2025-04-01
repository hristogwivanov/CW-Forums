import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getThreadsByCategory, getCategoryById, createThread, updateThread, deleteThread, isUserAdmin, isUserModerator, getThreadWithPosts } from '../../../services/forumService';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../../../firebase.js';
import styles from './category.module.css';
import Modal from '../../../components/organisms/modals/Modal';

export const Category = () => {
    const [category, setCategory] = useState(null);
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [selectedThread, setSelectedThread] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [threadToDelete, setThreadToDelete] = useState(null);
    const [isAdminUser, setIsAdminUser] = useState(false);
    const [isModeratorUser, setIsModeratorUser] = useState(false);
    
    const { categoryId } = useParams();
    const { currentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    
    useEffect(() => {
        const loadCategoryAndThreads = async () => {
            try {
                setLoading(true);
                
                const categoryData = await getCategoryById(categoryId);
                if (!categoryData) {
                    setError('Category not found');
                    setLoading(false);
                    return;
                }
                setCategory(categoryData);
                
                const threadsData = await getThreadsByCategory(categoryId);
                setThreads(threadsData);
                
                setError('');
            } catch (err) {
                console.error('Error loading category data:', err);
                setError('Failed to load category data');
            } finally {
                setLoading(false);
            }
        };
        
        loadCategoryAndThreads();
    }, [categoryId]);
    
    useEffect(() => {
        const checkUserRoles = async () => {
            if (currentUser) {
                try {
                    const adminResult = await isUserAdmin(currentUser);
                    const modResult = await isUserModerator(currentUser);
                    
                    console.log("User role check:", {
                        userId: currentUser.uid,
                        isAdmin: adminResult,
                        isModerator: modResult
                    });
                    
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
    
    const handleCreateThread = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/categories/${categoryId}` } });
            return;
        }
        
        setModalMode('create');
        setNewThreadTitle('');
        setNewThreadContent('');
        setSelectedThread(null);
        setModalOpen(true);
    };
    
    const handleCancelCreate = () => {
        setModalOpen(false);
        setNewThreadTitle('');
        setNewThreadContent('');
    };
    
    const handleSubmitThread = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            setError('You must be logged in to create a thread');
            return;
        }
        
        try {
            if (modalMode === 'create') {
                await createThread(
                    categoryId,
                    newThreadTitle,
                    newThreadContent,
                    currentUser.uid,
                    currentUser.displayName || 'Anonymous'
                );
            } else if (modalMode === 'edit') {
                await updateThread(
                    selectedThread.id,
                    newThreadTitle,
                    newThreadContent,
                    currentUser.uid
                );
            }
            
            setNewThreadTitle('');
            setNewThreadContent('');
            setModalOpen(false);
            
            const threadsData = await getThreadsByCategory(categoryId);
            setThreads(threadsData);
            
            setError('');
        } catch (error) {
            console.error('Error creating thread:', error);
            setError('Failed to create thread');
        }
    };
    
    const handleEditThread = async (thread) => {
        if (!currentUser || (!isAdminUser && !isModeratorUser && thread.createdBy !== currentUser.uid)) {
            setError('You do not have permission to edit this thread');
            return;
        }
        
        setModalMode('edit');
        setSelectedThread(thread);
        setNewThreadTitle(thread.title);
        
        try {
            const { thread: threadData, posts } = await getThreadWithPosts(thread.id);
            if (posts && posts.length > 0) {
                setNewThreadContent(posts[0].content);
            } else {
                setNewThreadContent('');
            }
            setModalOpen(true);
        } catch (error) {
            console.error('Error fetching thread content:', error);
            setError('Failed to load thread content for editing');
        }
    };
    
    const handleDeleteThread = async (thread) => {
        if (!currentUser || (!isAdminUser && !isModeratorUser && thread.createdBy !== currentUser.uid)) {
            setError('You do not have permission to delete this thread');
            return;
        }
        
        setThreadToDelete(thread.id);
        setShowDeleteConfirm(true);
    };
    
    const confirmDeleteThread = async () => {
        try {
            await deleteThread(threadToDelete, currentUser.uid);
            const threadsData = await getThreadsByCategory(categoryId);
            setThreads(threadsData);
            setShowDeleteConfirm(false);
            setThreadToDelete(null);
        } catch (error) {
            console.error('Error deleting thread:', error);
            
            if (error.message && error.message.includes("Permission denied")) {
                setError(error.message);
            } else {
                setError(`Failed to delete thread: ${error.message || 'Unknown error'}`);
            }
        }
    };
    
    const cancelDeleteThread = () => {
        setShowDeleteConfirm(false);
        setThreadToDelete(null);
    };
    
    const canManageThread = (thread) => {
        if (!currentUser) {
            console.log("No current user, denying permissions");
            return false;
        }
        
        const isAdmin = isAdminUser;
        const isMod = isModeratorUser;
        const isCreator = thread.createdBy === currentUser.uid;
        
        console.log("Permission check:", {
            threadId: thread.id,
            threadCreator: thread.createdBy,
            currentUserId: currentUser.uid,
            isAdmin,
            isMod,
            isCreator,
            hasPermission: isAdmin || isMod || isCreator
        });
        
        return isAdmin || isMod || isCreator;
    };
    
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        
        const day = date.getDate();
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
            'July', 'August', 'September', 'October', 'November', 'December'];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        
        let hours = date.getHours();
        let minutes = date.getMinutes();
        
        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        
        return `${day} ${month} ${year}, ${hours}:${minutes}`;
    };

    if (loading) {
        return (
            <div className={styles.categoryContainer}>
                <div className={styles.loading}>Loading category data...</div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className={styles.categoryContainer}>
                <div className={styles.errorMessage}>{error}</div>
                <Link to="/forums" className={styles.backButton}>Back to Forums</Link>
            </div>
        );
    }
    
    if (!category) {
        return (
            <div className={styles.categoryContainer}>
                <div className={styles.errorMessage}>Category not found</div>
                <Link to="/forums" className={styles.backButton}>Back to Forums</Link>
            </div>
        );
    }
    
    return (
        <div className={styles.categoryContainer}>
            <div className={styles.categoryHeader}>
                <div>
                    <h1>{category.name}</h1>
                    <p className={styles.categoryDescription}>{category.description}</p>
                </div>
                <div className={styles.categoryActions}>
                    {isAuthenticated && (
                        <button 
                            className={styles.createThreadBtn}
                            onClick={handleCreateThread}
                        >
                            Create New Thread
                        </button>
                    )}
                    <Link to="/forums" className={styles.backButton}>
                        Back to Forums
                    </Link>
                </div>
            </div>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <Modal 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)}
                title={modalMode === 'create' ? 'Create New Thread' : 'Edit Thread'}
            >
                <form onSubmit={handleSubmitThread}>
                    <div className={styles.formGroup}>
                        <label htmlFor="threadTitle">Thread Title</label>
                        <input
                            type="text"
                            id="threadTitle"
                            value={newThreadTitle}
                            onChange={(e) => setNewThreadTitle(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label htmlFor="threadContent">Content</label>
                        <textarea
                            id="threadContent"
                            value={newThreadContent}
                            onChange={(e) => setNewThreadContent(e.target.value)}
                            rows="5"
                            required
                        />
                    </div>
                    
                    <div className={styles.formActions}>
                        <button 
                            type="button" 
                            className={`${styles.formButton} ${styles.cancelButton}`}
                            onClick={handleCancelCreate}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className={styles.formButton}
                        >
                            {modalMode === 'create' ? 'Create Thread' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Modal>
            
            <Modal
                isOpen={showDeleteConfirm}
                onClose={cancelDeleteThread}
                title="Confirm Deletion"
            >
                <div className={styles.confirmDeleteContent}>
                    <p>Are you sure you want to delete this thread? This action cannot be undone.</p>
                    <div className={styles.formActions}>
                        <button 
                            type="button" 
                            className={`${styles.formButton} ${styles.cancelButton}`}
                            onClick={cancelDeleteThread}
                        >
                            Cancel
                        </button>
                        <button 
                            type="button" 
                            className={`${styles.formButton} ${styles.deleteButton}`}
                            onClick={confirmDeleteThread}
                        >
                            Delete Thread
                        </button>
                    </div>
                </div>
            </Modal>
            
            {threads.length === 0 ? (
                <div className={styles.noThreads}>
                    <p>There are no threads in this category yet.</p>
                    <p>Be the first to start a discussion!</p>
                </div>
            ) : (
                <div className={styles.threadsList}>
                    <div className={styles.threadsHeader}>
                        <div className={styles.threadTitle}>Thread</div>
                        <div className={styles.threadAuthor}>Author</div>
                        <div className={styles.threadReplies}>Replies</div>
                        <div className={styles.threadLastPost}>Last Post</div>
                        <div className={styles.threadActions}>Actions</div>
                    </div>
                    
                    {threads.map(thread => (
                        <div key={thread.id} className={styles.threadItem}>
                            <div className={styles.threadTitle}>
                                <Link to={`/forums/thread/${thread.id}`}>
                                    {thread.title}
                                </Link>
                                {thread.isPinned && <span className={styles.pinnedThread}>Pinned</span>}
                                <p className={styles.threadPreview}>{thread.preview}</p>
                            </div>
                            <div className={styles.threadAuthor}>
                                <span>{thread.createdByUsername || 'Anonymous'}</span>
                            </div>
                            <div className={styles.threadReplies}>
                                {thread.replyCount || 0}
                            </div>
                            <div className={styles.threadLastPost}>
                                {thread.lastPost ? (
                                    <span className={styles.threadDate}>
                                        {formatDate(thread.lastPost.createdAt)}
                                    </span>
                                ) : (
                                    <span className={styles.threadDate}>
                                        {formatDate(thread.createdAt)}
                                    </span>
                                )}
                            </div>
                            <div className={styles.threadActions}>
                                {currentUser && (isAdminUser || isModeratorUser || thread.createdBy === currentUser.uid) ? (
                                    <>
                                        <button 
                                            className={`${styles.orderButton} ${styles.editButton}`}
                                            onClick={() => handleEditThread(thread)}
                                            title="Edit Thread"
                                        >
                                            ✎
                                        </button>
                                        <button 
                                            className={`${styles.orderButton} ${styles.deleteButton}`}
                                            onClick={() => handleDeleteThread(thread)}
                                            title="Delete Thread"
                                        >
                                            ✕
                                        </button>
                                    </>
                                ) : (
                                    <span></span> 
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};