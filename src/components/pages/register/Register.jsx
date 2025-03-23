import React, { useState } from 'react';
import { Button } from '../../atoms/button/Button';

export const Register = () => {
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const submitHandler = (e) => {
        e.preventDefault();
        if (username.length < 3) {
            setError('Username must be at least 3 characters long');
            return;
        }
        setError('');
    }
    return (
        <section id="registerPage">
            {error && <p className="errorMessage">{error}</p>}
            <form className="registerForm" onSubmit={submitHandler}>
                <div className="inputDiv">
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="inputDiv">
                    <input
                        type="text"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="inputDiv">
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="inputDiv">
                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <Button type="submit" text="Register" />
            </form>
        </section>
    )
}