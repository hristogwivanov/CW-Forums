import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getCategories, isUserAdmin } from '../../../services/forumService';
import styles from './forums.module.css';

export const Forums = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCategory, setNewCategory] = useState({
        name: '',
        description: '',
        order: 0
    });
    
    const { currentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoading(true);
                const categoriesData = await getCategories();
                setCategories(categoriesData);
                setError('');
            } catch (err) {
                console.error('Error loading categories:', err);
                setError('Failed to load forum categories');
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);
    
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (currentUser) {
                console.log('Checking admin status for user:', currentUser.uid);
                const adminStatus = await isUserAdmin(currentUser.uid);
                console.log('Admin status result:', adminStatus);
                setIsAdmin(adminStatus);
            } else {
                console.log('No current user, setting isAdmin to false');
                setIsAdmin(false);
            }
        };
        
        checkAdminStatus();
    }, [currentUser]);

    const handleCreateThread = () => {
        if (!isAuthenticated) {
            navigate('/login', { state: { from: '/forums' } });
            return;
        }
        
        navigate('/forums/create-thread');
    };
    
    const handleShowCreateForm = () => {
        setShowCreateForm(true);
    };

    if (loading) {
        return (
            <div className={styles.forumsContainer}>
                <div className={styles.loading}>Loading categories...</div>
            </div>
        );
    }

    return (
        <div className={styles.forumsContainer}>
            <div className={styles.forumsHeader}>
                <h1>Crypto Forums</h1>
                {isAdmin && (
                    <button 
                        className={styles.createCategoryBtn}
                        onClick={handleShowCreateForm}
                    >
                        Create New Category
                    </button>
                )}
            </div>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            <div className={styles.categoriesList}>
                {categories.length === 0 ? (
                    <div className={styles.noCategories}>No categories found</div>
                ) : (
                    categories.map(category => (
                        <div key={category.id} className={styles.categoryCard}>
                            <div className={styles.categoryContent}>
                                <div className={styles.categoryHeader}>
                                    <h2>
                                        <Link to={`/forums/category/${category.id}`}>
                                            {category.name}
                                        </Link>
                                    </h2>
                                    <span className={styles.threadCount}>
                                        {category.threadCount || 0} threads
                                    </span>
                                </div>
                                <p className={styles.categoryDescription}>{category.description}</p>
                                
                                <button 
                                    className={styles.newThreadBtn}
                                    onClick={() => handleCreateThread(category.id)}
                                >
                                    New Thread
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};