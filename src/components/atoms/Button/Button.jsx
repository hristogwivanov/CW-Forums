import styles from './button.module.css'
export const Button = ({ type, text }) => {
    return (
        <button type={type}>{text}</button>
    )
}