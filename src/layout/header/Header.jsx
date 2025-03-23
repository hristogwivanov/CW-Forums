import { Link } from "react-router";
import styles from "./Header.module.css";

export const Header = () => {
    return (
        <header>
            <div className={styles.headerContainer}>
                <Link to="/">
                    <img src="/images/CW-logo.png" alt="CW Logo" className={styles.logo} />
                </Link>
                <nav>
                    <ul>
                        <li>
                            <Link to="/">Forums</Link>
                        </li>
                        <li>
                            <Link to="/login">Login</Link>
                        </li>
                        <li>
                            <Link to="/register">Register</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    )
}