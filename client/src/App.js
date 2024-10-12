import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);

  // Fetch products from the backend when the component loads
  useEffect(() => {
    fetch('/api/products')
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error('Error fetching products:', error));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Online Store</h1>
        <div className="product-list">
          {products.length > 0 ? (
            products.map((product) => (
              <div key={product.id} className="product">
                <h2>{product.name}</h2>
                <p>{product.description}</p>
                <p>${product.price.toFixed(2)}</p>
              </div>
            ))
          ) : (
            <p>Loading products...</p>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;