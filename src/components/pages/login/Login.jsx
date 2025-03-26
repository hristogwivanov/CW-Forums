import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import { Button } from '../../atoms/button/Button';
import { loginByUsername } from '../../../services/authService';

export const Login = () => {
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const loginHandler = async (formData) => {
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await loginByUsername(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'An error occurred while logging in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="loginPage">
      {error && <p className="errorMessage">{error}</p>}
      {!error && <br />}

      <form id="login" className="loginForm" action={loginHandler}>
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
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          text="Login"
          disabled={loading}
        />

        <p className="field">
          <span>
            If you don't have a profile, click{' '}
            <Link to="/register">here</Link>
          </span>
        </p>
      </form>
    </section>
  );
};
