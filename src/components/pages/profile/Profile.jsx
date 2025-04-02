import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { db } from '../../../../firebase';
import { 
    doc, 
    getDoc, 
    collection, 
    query, 
    where, 
    orderBy, 
    getDocs,
    limit 
} from 'firebase/firestore';
import styles from './profile.module.css';

export const Profile = () => {
    const { userId } = useParams();
    const { currentUser } = useAuth();
    const [userProfile, setUserProfile] = useState(null);
    const [threads, setThreads] = useState([]);
    const [replies, setReplies] = useState([]);
    const [stats, setStats] = useState({ threads: 0, replies: 0 });
    const [activeTab, setActiveTab] = useState('threads');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                setLoading(true);
                
                const targetUserId = userId || (currentUser ? currentUser.uid : null);
                
                if (!targetUserId) {
                    setError('User not found');
                    setLoading(false);
                    return;
                }
                
                const userRef = doc(db, 'users', targetUserId);
                const userSnap = await getDoc(userRef);
                
                if (!userSnap.exists()) {
                    setError('User profile not found');
                    setLoading(false);
                    return;
                }
                
                setUserProfile({
                    id: userSnap.id,
                    ...userSnap.data()
                });
                
                const threadsQuery = query(
                    collection(db, 'threads'),
                    where('createdBy', '==', targetUserId),
                    orderBy('createdAt', 'desc')
                );
                
                const threadsSnapshot = await getDocs(threadsQuery);
                const threadsData = threadsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setThreads(threadsData);
                
                const repliesQuery = query(
                    collection(db, 'posts'),
                    where('createdBy', '==', targetUserId),
                    orderBy('createdAt', 'desc')
                );
                
                const repliesSnapshot = await getDocs(repliesQuery);
                const repliesData = repliesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                const firstPostIds = threadsData.map(thread => thread.firstPostId).filter(Boolean);
                const filteredReplies = repliesData.filter(reply => !firstPostIds.includes(reply.id));
                
                setReplies(filteredReplies);
                
                setStats({
                    threads: threadsData.length,
                    replies: filteredReplies.length
                });
                
                setError('');
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserProfile();
    }, [userId, currentUser]);
    
    const formatDate = (timestamp) => {
        if (!timestamp) return 'N/A';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };
    
    if (loading) {
        return <div className={styles.profileContainer}>Loading profile...</div>;
    }
    
    if (error) {
        return <div className={styles.profileContainer}>{error}</div>;
    }
    
    if (!userProfile) {
        return <div className={styles.profileContainer}>User profile not found</div>;
    }
    
    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileHeader}>
                <img 
                    src={userProfile.profilePic || 'https://via.placeholder.com/120'} 
                    alt={userProfile.username || 'User'} 
                    className={styles.profileAvatar}
                />
                
                <div className={styles.profileInfo}>
                    <h2 className={styles.username}>{userProfile.username || 'Anonymous User'}</h2>
                    <div className={styles.joinDate}>
                        Joined: {formatDate(userProfile.createdAt)}
                    </div>
                    {userProfile.bio && (
                        <p>{userProfile.bio}</p>
                    )}
                </div>
            </div>
            
            <div className={styles.statsContainer}>
                <div className={styles.statItem}>
                    <div className={styles.statValue}>{stats.threads}</div>
                    <div className={styles.statLabel}>Threads</div>
                </div>
                
                <div className={styles.statItem}>
                    <div className={styles.statValue}>{stats.replies}</div>
                    <div className={styles.statLabel}>Replies</div>
                </div>
            </div>
            
            <div className={styles.tabContainer}>
                <div className={styles.tabList}>
                    <div 
                        className={`${styles.tab} ${activeTab === 'threads' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('threads')}
                    >
                        Threads
                    </div>
                    <div 
                        className={`${styles.tab} ${activeTab === 'replies' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('replies')}
                    >
                        Replies
                    </div>
                </div>
                
                <div className={styles.activityContainer}>
                    {activeTab === 'threads' && (
                        <div className={styles.activityList}>
                            {threads.length === 0 ? (
                                <div className={styles.noActivity}>No threads created yet</div>
                            ) : (
                                threads.map(thread => (
                                    <div key={thread.id} className={styles.activityItem}>
                                        <div className={styles.activityIcon}>
                                            <i className="fas fa-comment-alt"></i>
                                        </div>
                                        <div className={styles.activityContent}>
                                            <div className={styles.activityTitle}>
                                                <Link to={`/thread/${thread.id}`}>{thread.title}</Link>
                                            </div>
                                            <div className={styles.activityDate}>
                                                {formatDate(thread.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'replies' && (
                        <div className={styles.activityList}>
                            {replies.length === 0 ? (
                                <div className={styles.noActivity}>No replies posted yet</div>
                            ) : (
                                replies.map(reply => (
                                    <div key={reply.id} className={styles.activityItem}>
                                        <div className={styles.activityIcon}>
                                            <i className="fas fa-reply"></i>
                                        </div>
                                        <div className={styles.activityContent}>
                                            <div className={styles.activityTitle}>
                                                <Link to={`/thread/${reply.threadId}`}>
                                                    {reply.content.length > 100 
                                                        ? reply.content.substring(0, 100) + '...' 
                                                        : reply.content}
                                                </Link>
                                            </div>
                                            <div className={styles.activityDate}>
                                                {formatDate(reply.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};