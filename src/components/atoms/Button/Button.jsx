import styles from './button.module.css'

export const Button = ({ type, text, className, disabled, loading }) => {
    return (
        <button 
            type={type} 
            className={`${styles.button} ${className || ''} ${loading ? styles.loading : ''}`}
            disabled={disabled || loading}
        >
            {loading ? 'Processing...' : text}
        </button>
    )
}