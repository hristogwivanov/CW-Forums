import React, { useState } from 'react';
import { Link } from 'react-router';
import { Button } from '../../atoms/button/Button';
import { useNavigate } from 'react-router';

export const Register = () => {
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // const { signup } = useAuth();
    const navigate = useNavigate();

    const registerHandler = async (formData) => {

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
        setLoading(true);

        try {
            await signup(email, password, username);
            navigate('/');
        } catch (err) {
            setError(err.message || 'An error occurred while registering');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section id="registerPage">
            {error && <p className="errorMessage">{error}</p>}
            {!error && <br />}

            <form id="register" className="registerForm" action={registerHandler}>
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
                />

                <p className="field">
                    <span>
                        If you already have a profile, click{" "}
                        <Link to="/login">here</Link>
                    </span>
                </p>
            </form>
        </section>
    );
};
