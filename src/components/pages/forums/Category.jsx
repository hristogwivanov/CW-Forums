import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getThreadsByCategory, getCategoryById, createThread } from '../../../services/forumService';
import styles from './category.module.css';

export const Category = () => {
    const [category, setCategory] = useState(null);
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newThreadTitle, setNewThreadTitle] = useState('');
    const [newThreadContent, setNewThreadContent] = useState('');
    
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
        
        setShowCreateForm(true);
    };
    
    const handleCancelCreate = () => {
        setShowCreateForm(false);
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
            await createThread(
                categoryId,
                newThreadTitle,
                newThreadContent,
                currentUser.uid,
                currentUser.displayName || 'Anonymous'
            );
            
            setNewThreadTitle('');
            setNewThreadContent('');
            setShowCreateForm(false);
            
            const threadsData = await getThreadsByCategory(categoryId);
            setThreads(threadsData);
            
            setError('');
        } catch (error) {
            console.error('Error creating thread:', error);
            setError('Failed to create thread');
        }
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
            
            {showCreateForm && (
                <div className={styles.threadForm}>
                    <h3>Create New Thread</h3>
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
                                Create Thread
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
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
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};