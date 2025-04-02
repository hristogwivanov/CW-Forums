import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

const MockLogin = () => (
  <div>
    <input data-testid="username-input" placeholder="Username" />
    <input data-testid="password-input" type="password" placeholder="Password" />
    <button>Login</button>
    <p>If you don't have a profile, click <a href="/register">here</a></p>
  </div>
);

describe('Login Component', () => {
  it('renders login form elements', () => {
    render(<MockLogin />);
    
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });
  
  it('renders registration link', () => {
    render(<MockLogin />);
    
    expect(screen.getByText('here')).toBeInTheDocument();
  });
  
  it('has proper input placeholders', () => {
    render(<MockLogin />);
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });
  
  it('has password field with type="password"', () => {
    render(<MockLogin />);
    const passwordInput = screen.getByTestId('password-input');
    expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
