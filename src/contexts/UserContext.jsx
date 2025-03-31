import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { db } from "../../firebase.js";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [userDisplayName, setUserDisplayName] = useState(() => localStorage.getItem('userDisplayName') || "");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            if (!currentUser) {
                setUserData(null);
                setUserDisplayName(localStorage.getItem('userDisplayName') || "");
                setLoading(false);
                return;
            }

            try {
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    setUserData(data);
                    
                    if (data.username) {
                        setUserDisplayName(data.username);
                        localStorage.setItem('userDisplayName', data.username);
                    } else if (currentUser.displayName) {
                        setUserDisplayName(currentUser.displayName);
                        localStorage.setItem('userDisplayName', currentUser.displayName);
                    }
                } else {
                    const username = currentUser.displayName || localStorage.getItem('userDisplayName');
                    if (username && username !== "") {
                        const newUserData = {
                            email: currentUser.email,
                            username: username,
                            createdAt: new Date(),
                        };
                        
                        await setDoc(userRef, newUserData);
                        setUserData(newUserData);
                    }
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, [currentUser]);

    const updateDisplayName = (name) => {
        setUserDisplayName(name);
        localStorage.setItem('userDisplayName', name);
        
        if (currentUser && userData) {
            const userRef = doc(db, 'users', currentUser.uid);
            updateDoc(userRef, { username: name })
                .catch(error => console.error("Error updating display name:", error));
        }
    };

    const getUserById = async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            
            return userSnap.exists() ? userSnap.data() : null;
        } catch (error) {
            console.error("Error getting user by ID:", error);
            return null;
        }
    };

    const getUserByUsername = async (username) => {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', username));
            const snapshot = await getDocs(q);
            
            return !snapshot.empty ? snapshot.docs[0].data() : null;
        } catch (error) {
            console.error("Error getting user by username:", error);
            return null;
        }
    };

    const value = {
        userData,
        userDisplayName,
        userName: userDisplayName || "",
        updateDisplayName,
        getUserById,
        getUserByUsername,
    };

    return (
        <UserContext.Provider value={value}>
            {!loading ? children : <p>Loading user data...</p>}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);