import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UnifiedPurchasePage from './PurchasePage';
import axios from 'axios';
import { BrowserRouter as Router } from 'react-router-dom';

// Mock axios
jest.mock('axios');
const mockNavigate = jest.fn();

// Mock useNavigate
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
}));

describe('UnifiedPurchasePage Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorage.setItem('sessionId', 'mockSessionId');
        localStorage.setItem('user', 'mockUserId');
    });

    afterEach(() => {
        localStorage.clear();
    });

    test('renders all main sections', () => {
        render(
            <Router>
                <UnifiedPurchasePage />
            </Router>
        );

        expect(screen.getByText(/Payment Page/i)).toBeInTheDocument();
        expect(screen.getByText(/Address Information/i)).toBeInTheDocument();
        expect(screen.getByText(/Payment Information/i)).toBeInTheDocument();
        expect(screen.getByText(/Order Summary/i)).toBeInTheDocument();
    });

    test('toggles address section visibility', () => {
        render(
            <Router>
                <UnifiedPurchasePage />
            </Router>
        );

        fireEvent.click(screen.getByText(/Edit Address/i));
        expect(screen.getByPlaceholderText(/Full Name/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Close/i));
        expect(screen.queryByPlaceholderText(/Full Name/i)).toBeNull();
    });

    test('toggles payment section visibility', () => {
        render(
            <Router>
                <UnifiedPurchasePage />
            </Router>
        );

        fireEvent.click(screen.getByText(/Edit Payment/i));
        expect(screen.getByPlaceholderText(/Cardholder Name/i)).toBeInTheDocument();

        fireEvent.click(screen.getByText(/Close/i));
        expect(screen.queryByPlaceholderText(/Cardholder Name/i)).toBeNull();
    });

    test('handles address input changes correctly', () => {
        render(
            <Router>
                <UnifiedPurchasePage />
            </Router>
        );

        fireEvent.click(screen.getByText(/Edit Address/i));
        const fullNameInput = screen.getByPlaceholderText(/Full Name/i);

        fireEvent.change(fullNameInput, { target: { value: 'John Doe' } });
        expect(fullNameInput.value).toBe('John Doe');
    });

    test('fetches cart items on load', async () => {
        const mockCartItems = [
            { productId: 1, name: 'Item 1', price: 10, quantity: 2 },
            { productId: 2, name: 'Item 2', price: 20, quantity: 1 },
        ];

        axios.get.mockResolvedValueOnce({ status: 200, data: { items: mockCartItems } });

        render(
            <Router>
                <UnifiedPurchasePage />
            </Router>
        );

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith('/api/cart/get', { params: { sessionId: 'mockSessionId' } });
            expect(screen.getByText(/Item 1/i)).toBeInTheDocument();
            expect(screen.getByText(/Item 2/i)).toBeInTheDocument();
            expect(screen.getByText(/Product Total: \$40\.00/i)).toBeInTheDocument();
        });
    });

    test('alerts if address or payment is incomplete', () => {
        render(
            <Router>
                <UnifiedPurchasePage />
            </Router>
        );

        jest.spyOn(window, 'alert').mockImplementation(() => {});
        fireEvent.click(screen.getByText(/Complete Payment/i));

        expect(window.alert).toHaveBeenCalledWith('Please complete both Address and Payment Information before proceeding.');
    });

    

    
});