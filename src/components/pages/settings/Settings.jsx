import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, storage } from '../../../../firebase.js';
import { updatePassword, updateEmail, EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import styles from './settings.module.css';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
    const { currentUser } = useAuth();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [profilePic, setProfilePic] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedImage, setSelectedImage] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [userData, setUserData] = useState(null);
    
    const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
    const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
    const [imageUploadLoading, setImageUploadLoading] = useState(false);
    const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
    
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    
    const navigate = useNavigate();
    
    useEffect(() => {
        const fetchUserData = async () => {
            if (currentUser) {
                try {
                    const userRef = doc(db, 'users', currentUser.uid);
                    const userSnap = await getDoc(userRef);
                    
                    if (userSnap.exists()) {
                        const data = userSnap.data();
                        setUserData(data);
                        setUsername(data.username || '');
                        setEmail(currentUser.email || '');
                        setProfilePic(data.profilePic || '');
                    }
                } catch (err) {
                    console.error('Error fetching user data:', err);
                    setError('Failed to load user data');
                }
            }
        };
        
        fetchUserData();
    }, [currentUser]);
    
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            setError('You must be logged in to update your profile');
            return;
        }
        
        setProfileUpdateLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                username: username
            });
            
            if (email !== currentUser.email) {
                await updateEmail(currentUser, email);
            }
            
            setSuccess('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err);
            setError('Failed to update profile: ' + err.message);
        } finally {
            setProfileUpdateLoading(false);
        }
    };
    
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        
        if (!currentUser) {
            setError('You must be logged in to change your password');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        
        setPasswordChangeLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const credential = EmailAuthProvider.credential(
                currentUser.email,
                currentPassword
            );
            
            await reauthenticateWithCredential(currentUser, credential);
            await updatePassword(currentUser, newPassword);
            
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSuccess('Password changed successfully!');
        } catch (err) {
            console.error('Error changing password:', err);
            
            if (err.code === 'auth/wrong-password') {
                setError('Current password is incorrect');
            } else {
                setError('Failed to change password: ' + err.message);
            }
        } finally {
            setPasswordChangeLoading(false);
        }
    };
    
    const handleImageSelect = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfilePic(event.target.result);
                setSelectedImage(file);
                setSuccess('Image selected. Click "Upload Image" to save it to your profile.');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleImageUpload = async () => {
        if (!selectedImage) {
            setError('Please select an image first');
            return;
        }
        
        setImageUploadLoading(true);
        setError('');
        setSuccess('');
        
        try {
            const reader = new FileReader();
            const readFile = new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = (error) => reject(error);
                reader.readAsDataURL(selectedImage);
            });
            
            const dataUrl = await readFile;
            
            const userRef = doc(db, 'users', currentUser.uid);
            await updateDoc(userRef, {
                profilePic: dataUrl
            });
            
            setProfilePic(dataUrl);
            setSelectedImage(null);
            setSuccess('Profile picture updated successfully!');
        } catch (err) {
            console.error('Error in upload process:', err);
            setError(`Error updating profile picture: ${err.message}`);
        } finally {
            setImageUploadLoading(false);
        }
    };
    
    const handleDeleteAccount = async (e) => {
        e.preventDefault();
        
        if (!deletePassword) {
            setError('Please enter your password to confirm account deletion');
            return;
        }
        
        setDeleteAccountLoading(true);
        setError('');
        
        try {
            const credential = EmailAuthProvider.credential(
                currentUser.email,
                deletePassword
            );
            
            await reauthenticateWithCredential(currentUser, credential);
            
            const userRef = doc(db, 'users', currentUser.uid);
            await deleteDoc(userRef);
            
            const threadsQuery = query(collection(db, 'threads'), where('userId', '==', currentUser.uid));
            const threadsSnapshot = await getDocs(threadsQuery);
            const deleteThreadsPromises = threadsSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteThreadsPromises);
            
            const repliesQuery = query(collection(db, 'replies'), where('userId', '==', currentUser.uid));
            const repliesSnapshot = await getDocs(repliesQuery);
            const deleteRepliesPromises = repliesSnapshot.docs.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteRepliesPromises);
            
            await deleteUser(currentUser);
            
            navigate('/');
        } catch (err) {
            console.error('Error deleting account:', err);
            setDeleteAccountLoading(false);
            
            if (err.code === 'auth/wrong-password') {
                setError('Incorrect password. Account deletion failed.');
            } else if (err.code === 'auth/requires-recent-login') {
                setError('For security reasons, please log out and log back in before deleting your account.');
            } else {
                setError(`Failed to delete account: ${err.message}`);
            }
        }
    };
    
    const toggleDeleteConfirm = () => {
        setShowDeleteConfirm(!showDeleteConfirm);
        setDeletePassword('');
        setError('');
    };
    
    if (!userData) {
        return <div className={styles.settingsContainer}>Loading user data...</div>;
    }
    
    return (
        <div className={styles.settingsContainer}>
            <div className={styles.header}>
                <h1>Account Settings</h1>
            </div>
            
            {error && <div className={`${styles.message} ${styles.errorMessage}`}>{error}</div>}
            {success && <div className={`${styles.message} ${styles.successMessage}`}>{success}</div>}
            
            <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                    <h2>Profile Information</h2>
                </div>
                <div className={styles.sectionContent}>
                    <div className={styles.profilePicSection}>
                        <div className={styles.profilePicContainer}>
                            <img 
                                src={profilePic || 'https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg'} 
                                alt="Profile" 
                                className={styles.profilePic}
                            />
                        </div>
                        <div className={styles.profilePicButtons}>
                            <input 
                                type="file" 
                                id="profile-pic-upload" 
                                onChange={handleImageSelect} 
                                accept="image/*"
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="profile-pic-upload" className={styles.actionButton}>
                                Select Image
                            </label>
                            {selectedImage && (
                                <button 
                                    className={`${styles.actionButton} ${styles.primaryButton}`}
                                    onClick={handleImageUpload}
                                    disabled={imageUploadLoading}
                                >
                                    {imageUploadLoading ? 'Uploading...' : 'Upload Image'}
                                </button>
                            )}
                        </div>
                    </div>
                    
                    <form onSubmit={handleProfileUpdate}>
                        <div className={styles.formGroup}>
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className={styles.buttonGroup}>
                            <button 
                                type="submit" 
                                className={`${styles.actionButton} ${styles.primaryButton}`}
                                disabled={profileUpdateLoading}
                            >
                                {profileUpdateLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                    <h2>Change Password</h2>
                </div>
                <div className={styles.sectionContent}>
                    <form onSubmit={handlePasswordChange}>
                        <div className={styles.formGroup}>
                            <label htmlFor="current-password">Current Password</label>
                            <input
                                type="password"
                                id="current-password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="new-password">New Password</label>
                            <input
                                type="password"
                                id="new-password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className={styles.formGroup}>
                            <label htmlFor="confirm-password">Confirm New Password</label>
                            <input
                                type="password"
                                id="confirm-password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        
                        <div className={styles.buttonGroup}>
                            <button 
                                type="submit" 
                                className={`${styles.actionButton} ${styles.primaryButton}`}
                                disabled={passwordChangeLoading}
                            >
                                {passwordChangeLoading ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                    <h2>Account Actions</h2>
                </div>
                <div className={styles.sectionContent}>
                    <p>Danger zone! These actions cannot be undone.</p>
                    <div className={styles.buttonGroup}>
                        {!showDeleteConfirm ? (
                            <button 
                                type="button"
                                className={`${styles.actionButton} ${styles.dangerButton}`}
                                onClick={toggleDeleteConfirm}
                            >
                                Delete Account
                            </button>
                        ) : (
                            <div className={styles.deleteConfirmation}>
                                <p className={styles.warningText}>
                                    This action is irreversible. All your data, including profile information, 
                                    threads, and replies will be permanently deleted.
                                </p>
                                
                                <form onSubmit={handleDeleteAccount}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="deletePassword">Enter your password to confirm:</label>
                                        <input
                                            type="password"
                                            id="deletePassword"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    
                                    <div className={styles.buttonGroup}>
                                        <button 
                                            type="button" 
                                            className={styles.actionButton}
                                            onClick={toggleDeleteConfirm}
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className={`${styles.actionButton} ${styles.dangerButton}`}
                                            disabled={deleteAccountLoading}
                                        >
                                            {deleteAccountLoading ? 'Deleting...' : 'Permanently Delete Account'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};