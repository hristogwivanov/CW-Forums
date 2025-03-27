import React from "react";
import { useNavigate } from "react-router";
import styles from "./NotFound.module.css";

export const NotFound = () => {
  const navigate = useNavigate();
  const handleGoHome = () => {
    navigate("/forums");
  };
  return (
    <section className={styles.notFound}>
      <h1>404 – Not Found</h1>
      <p>Oops! The page you’re looking for doesn’t exist.</p>
      <button onClick={handleGoHome}>Go back to Forums</button>
    </section>
  );
};
