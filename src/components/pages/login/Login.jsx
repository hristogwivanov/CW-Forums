import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../../../contexts/AuthContext";
import { useUser } from "../../../contexts/UserContext";
import { Link } from "react-router";
import { Button } from "../../atoms/Button/Button";

export const Login = () => {
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginByUsername, authError, clearAuthError } = useAuth();
  const { updateDisplayName } = useUser();

  const navigate = useNavigate();
  const location = useLocation();

  const loginHandler = async (formData) => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    setError("");
    clearAuthError();
    setLoading(true);

    try {
      const user = await loginByUsername(username, password);
      
      if (user.displayName) {
        updateDisplayName(user.displayName);
      } else {
        updateDisplayName(username);
      }
      
      const prevRoute = location.state?.from;

      if (prevRoute === "/login" || prevRoute === "/register") {
        navigate("/forums");
      } else if (prevRoute) {
        navigate(prevRoute);
      } else {
        navigate("/forums");
      }
    } catch (err) {
      setError(err.message || "Failed to login. Please check your credentials.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loginHandler();
  };

  return (
    <section id="loginPage">
      {error && <p className="errorMessage">{error}</p>}
      {!error && <br />}

      <form id="login" className="loginForm" onSubmit={handleSubmit}>
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
          loading={loading}
        />

        <p className="field">
          <span>
            If you don't have a profile, click <Link to="/register" className="purple">here</Link>
          </span>
        </p>
      </form>
    </section>
  );
};
