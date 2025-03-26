import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Header.module.css';

export const Header = () => {
  const { isAuthenticated, userName, currentUser } = useAuth();

  return (
    <header>
      <div className={styles.headerContainer}>
        <Link to="/">
          <img
            src="/images/CW-logo.png"
            alt="CW Logo"
            className={styles.logo}
          />
        </Link>
        <nav>
          {isAuthenticated ? (
            <ul>
              <li>Hello, {userName || 'User'}</li>
              <li>
                <Link to="/forum">Forum</Link>
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
                <Link to="/logout">Logout</Link>
              </li>
            </ul>
          ) : (
            <ul>
              <li>
                <Link to="/forum">Forum</Link>
              </li>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </ul>
          )}
        </nav>
      </div>
    </header>
  );
};
