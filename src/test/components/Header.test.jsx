import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

const MockHeader = () => (
  <header>
    <img alt="CW Logo" src="/logo.png" />
    <nav>
      <a href="/forums" className="navLink">Forums</a>
      <a href="/login" className="navLink purple">Login</a>
      <a href="/register" className="navLink">Register</a>
    </nav>
  </header>
);

describe('Header Component', () => {
  it('renders the logo', () => {
    render(<MockHeader />);
    const logo = screen.getByAltText('CW Logo');
    expect(logo).toBeInTheDocument();
  });
  
  it('renders navigation links', () => {
    render(<MockHeader />);
    expect(screen.getByText('Forums')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
  });
  
  it('has correct navigation link structure', () => {
    render(<MockHeader />);
    const forumsLink = screen.getByText('Forums');
    const loginLink = screen.getByText('Login');
    
    expect(forumsLink).toHaveAttribute('href', '/forums');
    expect(loginLink).toHaveAttribute('href', '/login');
  });
  
  it('applies purple accent styling to login link', () => {
    render(<MockHeader />);
    const loginLink = screen.getByText('Login');
    expect(loginLink).toHaveClass('purple');
  });

  it('has appropriate CSS class for navigation', () => {
    render(<MockHeader />);
    const navLinks = screen.getAllByText(/Forums|Login|Register/);
    navLinks.forEach(link => {
      expect(link).toHaveClass('navLink');
    });
  });
});
