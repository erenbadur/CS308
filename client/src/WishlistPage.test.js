import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import WishlistPage from './WishlistPage'; // Update this path to your WishlistPage component
import { BrowserRouter } from 'react-router-dom';

describe('WishlistPage Component', () => {
    beforeEach(() => {
        // Mock fetch API
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        wishlist: [],
                    }),
            })
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderWishlistPage = () =>
        render(
            <BrowserRouter>
                <WishlistPage />
            </BrowserRouter>
        );

    test('displays items when there are products in the wishlist', async () => {
        // Mock fetch to return wishlist items
        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        wishlist: [
                            { productId: { name: 'Product 1', price: 100, discount: true } },
                            { productId: { name: 'Product 2', price: 200, discount: false } },
                        ],
                    }),
            })
        );

        renderWishlistPage();

        const product1 = await screen.findByText('Product 1');
        const product2 = await screen.findByText('Product 2');

        expect(product1).toBeInTheDocument();
        expect(product2).toBeInTheDocument();
    });

    test('displays price and discount status for each item', async () => {
        // Mock fetch to return wishlist items
        fetch.mockImplementationOnce(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve({
                        wishlist: [
                            { productId: { name: 'Product 1', price: 100, discount: true } },
                            { productId: { name: 'Product 2', price: 200, discount: false } },
                        ],
                    }),
            })
        );

        renderWishlistPage();

        const price1 = await screen.findByText('Price: $100');
        const discount1 = await screen.findByText('Discount');

        const price2 = await screen.findByText('Price: $200');
        const noDiscount = await screen.findByText('No Discount');

        expect(price1).toBeInTheDocument();
        expect(discount1).toBeInTheDocument();
        expect(price2).toBeInTheDocument();
        expect(noDiscount).toBeInTheDocument();
    });

    test('displays empty message when there are no products', async () => {
        // Default fetch mock returns an empty wishlist
        renderWishlistPage();

        const emptyMessage = await screen.findByText(/Your wishlist is currently empty. Please check again after adding items to your wishlist./i);
        expect(emptyMessage).toBeInTheDocument();
    });
});