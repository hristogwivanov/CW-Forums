import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useUser } from "../../contexts/UserContext";
import styles from "./Header.module.css";

export const Header = () => {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const { userName } = useUser();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <header>
      <div className={styles.headerContainer}>
        <Link to="/forums">
          <img
            src="/images/CW-logo.png"
            alt="CW Logo"
            className={styles.logo}
          />
        </Link>
        <nav>
          {isAuthenticated ? (
            <ul>
              <li>{userName ? `Hi, ${userName}` : 'Welcome'}</li>
              <li>
                <Link to="/forums">Forums</Link>
              </li>
              {currentUser && (
                <li>
                  <Link to={`/Profile/${currentUser.uid}`}>Profile</Link>
                </li>
              )}
              <li>
                <Link to="/settings">Settings</Link>
              </li>
              <li>
                <Link to="#" onClick={handleLogout}>Logout</Link>
              </li>
            </ul>
          ) : (
            <ul>
              <li>
                <Link to="/forums">Forums</Link>
              </li>
              <li>
                <Link to="/login" state={{ from: location.pathname }}>Login</Link>
              </li>
              <li>
                <Link to="/register" state={{ from: location.pathname }}>Register</Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
};
