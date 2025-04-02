import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../../contexts/AuthContext';
import { useUser } from '../../../contexts/UserContext';

import { Link } from 'react-router';
import { Button } from '../../atoms/Button/Button';

export const Register = () => {
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { signup, clearAuthError } = useAuth();
    const { updateDisplayName } = useUser();

    const navigate = useNavigate();
    const location = useLocation();

    const registerHandler = async () => {

        if (username.length < 3) {
            setError('Username must be at least 3 characters long');
            return;
        }

        const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/;
        if (!emailRegex.test(email)) {
            setError('Invalid email address');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        clearAuthError();
        setLoading(true);

        try {
            await signup(email, password, username);
            updateDisplayName(username);
            const prevRoute = location.state?.from;

            if (prevRoute === '/login' || prevRoute === '/register') {
              navigate('/forums');
            } else if (prevRoute) {
              navigate(prevRoute);
            } else {
              navigate('/forums');
            }
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please use a different email or try logging in.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password is too weak. Please use a stronger password.');
            } else {
                setError(err.message || 'An error occurred while registering');
            }
            console.error('Registration error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await registerHandler();
    };

    return (
        <section id="registerPage">
            {error && <p className="errorMessage">{error}</p>}
            {!error && <br />}

            <form id="register" className="registerForm" onSubmit={handleSubmit}>
                <div className="inputDiv">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                </div>
                <div className="inputDiv">
                    <input
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="inputDiv">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="inputDiv">
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>

                <Button
                    type="submit"
                    text="Register"
                    disabled={loading}
                    loading={loading}
                />

                <p className="field">
                    <span>
                        If you already have a profile, click{" "}
                        <Link to="/login" className="purple">here</Link>
                    </span>
                </p>
            </form>
        </section>
    );
};
