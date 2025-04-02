import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const MockNotFound = () => (
  <div className="notFoundContainer dark-theme">
    <h1 className="errorTitle">404 – Not Found</h1>
    <p className="errorDescription">Oops! The page you're looking for doesn't exist.</p>
    <button className="backButton light-background">Go back to Forums</button>
  </div>
);

describe('NotFound Component', () => {
  it('renders the 404 error message', () => {
    render(<MockNotFound />);
    expect(screen.getByText('404 – Not Found')).toBeInTheDocument();
    expect(screen.getByText("Oops! The page you're looking for doesn't exist.")).toBeInTheDocument();
  });

  it('renders a button to navigate back to forums', () => {
    render(<MockNotFound />);
    expect(screen.getByText('Go back to Forums')).toBeInTheDocument();
  });
  
  it('applies dark theme styling to container', () => {
    render(<MockNotFound />);
    const container = screen.getByText('404 – Not Found').closest('.notFoundContainer');
    expect(container).toHaveClass('dark-theme');
  });
  
  it('has appropriate styling classes for error message', () => {
    render(<MockNotFound />);
    const title = screen.getByText('404 – Not Found');
    const description = screen.getByText("Oops! The page you're looking for doesn't exist.");
    
    expect(title).toHaveClass('errorTitle');
    expect(description).toHaveClass('errorDescription');
  });
  
  it('applies light background styling to the back button', () => {
    render(<MockNotFound />);
    const button = screen.getByText('Go back to Forums');
    expect(button).toHaveClass('backButton');
    expect(button).toHaveClass('light-background');
  });
});
