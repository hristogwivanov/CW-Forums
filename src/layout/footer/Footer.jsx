import{ Link } from "react-router";
import styles from "./Footer.module.css";

export const Footer = () => {
    return (
        <footer>
            <Link to="/about">
                <div><p>Hristo Ivanov 2025</p></div>
            </Link>
        </footer>
    )
}