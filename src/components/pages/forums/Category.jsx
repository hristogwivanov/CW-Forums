import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getThreadsByCategory, getCategoryById, createThread, updateThread, deleteThread, isUserAdmin, isUserModerator } from '../../../services/forumService';
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
    
    const handleCreateThread = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: `/categories/${categoryId}` } });
            return;
        }
        
        setModalMode('create');
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
                    newThreadContent
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
    
    const handleEditThread = (thread) => {
        setModalMode('edit');
        setSelectedThread(thread);
        setNewThreadTitle(thread.title);
        setNewThreadContent(thread.content);
        setModalOpen(true);
    };
    
    const handleDeleteThread = async (threadId) => {
        try {
            await deleteThread(threadId);
            const threadsData = await getThreadsByCategory(categoryId);
            setThreads(threadsData);
        } catch (error) {
            console.error('Error deleting thread:', error);
            setError('Failed to delete thread');
        }
    };
    
    const canManageThread = (thread) => {
        return isUserAdmin(currentUser) || isUserModerator(currentUser) || thread.createdBy === currentUser.uid;
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
                    <button 
                        className={styles.createThreadBtn}
                        onClick={handleCreateThread}
                    >
                        Create New Thread
                    </button>
                    <Link to="/forums" className={styles.backButton}>
                        Back to Forums
                    </Link>
                </div>
            </div>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <Modal 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)}
            >
                <h3>{modalMode === 'create' ? 'Create New Thread' : 'Edit Thread'}</h3>
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
                            className={styles.textArea}
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
                                {canManageThread(thread) && (
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
                                            onClick={() => handleDeleteThread(thread.id)}
                                            title="Delete Thread"
                                        >
                                            ✕
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};