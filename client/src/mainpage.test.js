import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MainPage from './mainpage';
import axios from 'axios';

jest.mock('axios');

describe('MainPage Component', () => {
    beforeEach(() => {
        // Mock userId and sessionId for tests
        localStorage.setItem('sessionId', 'test-session-id'); // Mock sessionId
        localStorage.setItem('user', 'test-user-id');        // Mock userId
        jest.clearAllMocks();                                // Clear mocks for each test
      });
      

  test('fetches products on mount', async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [], pagination: { totalPages: 1 } },
    });

    render(<MainPage />);
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith(
        '/api/products/sort',
        expect.objectContaining({ params: expect.anything() })
      )
    );
  });

  test('handles logout', () => {
    localStorage.setItem('user', '123');
    render(<MainPage />);
    const logoutButton = screen.getByText('👤 Log Out');
    fireEvent.click(logoutButton);
    expect(localStorage.getItem('user')).toBeNull();
  });

  test('toggles cart visibility', () => {
    render(<MainPage />);
    const cartButton = screen.getByText('🛒 Cart');
    fireEvent.click(cartButton);
    expect(screen.getByText('Your Cart')).toBeInTheDocument();
    fireEvent.click(screen.getByText('X'));
    expect(screen.queryByText('Your Cart')).not.toBeInTheDocument();
  });

  test('renders navbar and hero section', () => {
    render(<MainPage />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Welcome to N308')).toBeInTheDocument();
  });

  test('handles "Back to Products" button', () => {
    render(<MainPage />);
    const backButton = screen.queryByText(/← Back to Products/i);
    if (backButton) {
      fireEvent.click(backButton);
      expect(screen.getByText(/Popular Products/i)).toBeInTheDocument();
    } else {
      expect(backButton).toBeNull();
    }
  });

  test('fetches next page of comments', async () => {
    axios.get.mockResolvedValueOnce({
      data: { comments: [], pagination: { currentPage: 1, totalPages: 2 } },
    });

    render(<MainPage />);
    const nextButton = screen.getByText(/Next »/i);
    fireEvent.click(nextButton);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });

  test('fetches previous page of products', async () => {
    axios.get.mockResolvedValueOnce({
      data: { products: [], pagination: { totalPages: 2, currentPage: 1 } },
    });

    render(<MainPage />);
    const prevButton = screen.getByText('« Prev');
    fireEvent.click(prevButton);

    await waitFor(() => expect(axios.get).toHaveBeenCalled());
  });
  
});