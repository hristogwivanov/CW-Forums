import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getThreadsByCategory, getCategoryById } from '../../../services/forumService';
import styles from './category.module.css';

export const Category = () => {
    const [category, setCategory] = useState(null);
    const [threads, setThreads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
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
            navigate('/login', { state: { from: `/forums/category/${categoryId}` } });
            return;
        }
        
        navigate(`/forums/category/${categoryId}/create-thread`);
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
                                <span>{thread.authorName}</span>
                                <span className={styles.threadDate}>
                                    {new Date(thread.createdAt.toDate()).toLocaleDateString()}
                                </span>
                            </div>
                            <div className={styles.threadReplies}>
                                {thread.replyCount || 0}
                            </div>
                            <div className={styles.threadLastPost}>
                                {thread.lastPost ? (
                                    <>
                                        <span>by {thread.lastPost.authorName}</span>
                                        <span className={styles.threadDate}>
                                            {new Date(thread.lastPost.createdAt.toDate()).toLocaleDateString()}
                                        </span>
                                    </>
                                ) : (
                                    <span>No replies yet</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};