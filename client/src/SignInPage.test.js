import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignInPage from './SignInPage';

// Mock fetch globally for all tests
global.fetch = jest.fn();

describe('SignInPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mock data before each test
  });


  test('clears error and success messages when close button is clicked', async () => {
    render(<SignInPage />);

    // Simulate an error message
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText(/An error occurred during sign up/i)).toBeInTheDocument();
    });

    const closeErrorButton = screen.getByText(/Close/i);
    fireEvent.click(closeErrorButton);

    expect(screen.queryByText(/An error occurred during sign up/i)).toBeNull();
  });

  
});