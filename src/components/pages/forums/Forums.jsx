import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { 
    getCategories, 
    isUserAdmin, 
    createCategory, 
    moveCategoryUp, 
    moveCategoryDown,
    deleteCategory,
    updateCategory
} from '../../../services/forumService';
import styles from './forums.module.css';

export const Forums = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDescription, setNewCategoryDescription] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [editCategoryName, setEditCategoryName] = useState('');
    const [editCategoryDescription, setEditCategoryDescription] = useState('');
    
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
        setNewCategoryDescription('');
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
            await createCategory(newCategoryName.trim(), newCategoryDescription.trim());
            setShowCreateForm(false);
            setNewCategoryName('');
            setNewCategoryDescription('');
            await loadCategories();
        } catch (err) {
            setError('Failed to create category: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveUp = async (categoryId, currentOrder) => {
        try {
            setLoading(true);
            const success = await moveCategoryUp(categoryId, currentOrder);
            if (success) {
                await loadCategories();
            }
        } catch (err) {
            setError('Failed to move category: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleMoveDown = async (categoryId, currentOrder) => {
        try {
            setLoading(true);
            const success = await moveCategoryDown(categoryId, currentOrder);
            if (success) {
                await loadCategories();
            }
        } catch (err) {
            setError('Failed to move category: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCategory = async (categoryId, categoryName) => {
        if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This action cannot be undone.`)) {
            try {
                await deleteCategory(categoryId);
                loadCategories();
                setError('');
            } catch (error) {
                setError('Failed to delete category');
                console.error(error);
            }
        }
    };

    const handleEditCategory = (category) => {
        setEditingCategory(category);
        setEditCategoryName(category.name);
        setEditCategoryDescription(category.description || '');
    };

    const handleCancelEdit = () => {
        setEditingCategory(null);
        setEditCategoryName('');
        setEditCategoryDescription('');
    };

    const handleUpdateCategory = async (e) => {
        e.preventDefault();
        
        if (!editCategoryName.trim()) {
            setError('Category name is required');
            return;
        }
        
        try {
            setLoading(true);
            await updateCategory(editingCategory.id, editCategoryName.trim(), editCategoryDescription.trim());
            setEditingCategory(null);
            await loadCategories();
            setError('');
        } catch (err) {
            setError('Failed to update category: ' + err.message);
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
            </div>
            
            {error && <div className={styles.errorMessage}>{error}</div>}

            {editingCategory && (
                <div className={styles.formContainer}>
                    <h3>Edit Category</h3>
                    <form onSubmit={handleUpdateCategory}>
                        <div className={styles.formGroup}>
                            <label htmlFor="editCategoryName">Category Name</label>
                            <input
                                type="text"
                                id="editCategoryName"
                                value={editCategoryName}
                                onChange={(e) => setEditCategoryName(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="editCategoryDescription">Description (optional)</label>
                            <textarea
                                id="editCategoryDescription"
                                value={editCategoryDescription}
                                onChange={(e) => setEditCategoryDescription(e.target.value)}
                                rows="3"
                            />
                        </div>
                        
                        <div className={styles.formActions}>
                            <button 
                                type="button" 
                                className={`${styles.formButton} ${styles.cancelButton}`}
                                onClick={handleCancelEdit}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className={styles.formButton}
                            >
                                Update Category
                            </button>
                        </div>
                    </form>
                </div>
            )}
            
            <div className={styles.categoriesList}>
                {categories.length === 0 ? (
                    <div className={styles.noCategories}>No categories found</div>
                ) : (
                    categories.map((category) => (
                        <div key={category.id} className={styles.categoryCard}>
                            <div className={styles.categoryContent}>
                                <div className={styles.categoryHeader}>
                                    <div className={styles.titleWithControls}>
                                        <h2>
                                            <Link to={`/categories/${category.id}`} className={styles.categoryLink}>
                                                {category.name}
                                            </Link>
                                        </h2>
                                        
                                        {isAdmin && (
                                            <div className={styles.categoryAdminControls}>
                                                <button 
                                                    className={`${styles.orderButton} ${styles.upButton}`}
                                                    onClick={() => handleMoveUp(category.id, category.order)}
                                                    title="Move Up"
                                                >
                                                    ↑
                                                </button>
                                                <button 
                                                    className={`${styles.orderButton} ${styles.downButton}`}
                                                    onClick={() => handleMoveDown(category.id, category.order)}
                                                    title="Move Down"
                                                >
                                                    ↓
                                                </button>
                                                <button 
                                                    className={`${styles.orderButton} ${styles.editButton}`}
                                                    onClick={() => handleEditCategory(category)}
                                                    title="Edit Category"
                                                >
                                                    ✎
                                                </button>
                                                <button 
                                                    className={`${styles.orderButton} ${styles.deleteButton}`}
                                                    onClick={() => handleDeleteCategory(category.id, category.name)}
                                                    title="Delete Category"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <span className={styles.threadCount}>
                                        {category.threadCount} {category.threadCount === 1 ? 'Thread' : 'Threads'}
                                    </span>
                                </div>
                                
                                {category.description && (
                                    <p className={styles.categoryDescription}>{category.description}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {isAdmin && (
                <div className={styles.bottomActions}>
                    <button 
                        className={styles.createCategoryBtn}
                        onClick={handleShowCreateForm}
                    >
                        Create New Category
                    </button>
                </div>
            )}
            
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
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="categoryDescription">Description (Optional)</label>
                            <textarea
                                id="categoryDescription"
                                value={newCategoryDescription}
                                onChange={(e) => setNewCategoryDescription(e.target.value)}
                                rows="3"
                                className={styles.textArea}
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
        </div>
    );
};