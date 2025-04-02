import styles from './button.module.css'

export const Button = ({ type, text, className }) => {
    return (
        <button 
            type={type} 
            className={`${styles.button} ${className || ''}`}
        >
            {text}
        </button>
    )
}