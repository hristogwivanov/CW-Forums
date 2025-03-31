import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getCategories, isUserAdmin, createCategory } from '../../../services/forumService';
import styles from './forums.module.css';

export const Forums = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    const { currentUser, isAuthenticated } = useAuth();
    const navigate = useNavigate();

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

    useEffect(() => {
        loadCategories();
    }, []);
    
    useEffect(() => {
        const checkAdminStatus = async () => {
            if (currentUser) {
                const adminStatus = await isUserAdmin(currentUser.uid);
                setIsAdmin(adminStatus);
            } else {
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
        setNewCategoryName('');
    };

    const handleCancelCreate = () => {
        setShowCreateForm(false);
    };

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        
        if (!newCategoryName.trim()) {
            setError('Category name is required');
            return;
        }
        
        try {
            setLoading(true);
            await createCategory(newCategoryName.trim());
            setShowCreateForm(false);
            setNewCategoryName('');
            await loadCategories();
        } catch (err) {
            setError('Failed to create category: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading && categories.length === 0) {
        return (
            <div className={styles.forumsContainer}>
                <div className={styles.loading}>Loading categories...</div>
            </div>
        );
    }

    return (
        <div className={styles.forumsContainer}>
            <div className={styles.forumsHeader}>
                {isAdmin && (
                    <button 
                        className={styles.createCategoryBtn}
                        onClick={handleShowCreateForm}
                    >
                        Create New Category
                    </button>
                )}
                <h1>Crypto Forums</h1>
            </div>
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            
            {showCreateForm && (
                <div className={styles.categoryForm}>
                    <h3>Create New Category</h3>
                    <form onSubmit={handleCreateCategory}>
                        <div className={styles.formGroup}>
                            <label htmlFor="categoryName">Category Name</label>
                            <input
                                type="text"
                                id="categoryName"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
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
                                Create Category
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
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
                                {category.description && (
                                    <p className={styles.categoryDescription}>{category.description}</p>
                                )}
                                
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