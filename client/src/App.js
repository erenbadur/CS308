import React, { useEffect, useState } from 'react';  // Import useEffect and useState for fetching data
import logo from './logo.svg';
import './App.css';

function App() {
  // State to store the fetched data
  const [data, setData] = useState(null);

  // useEffect to fetch data when the component mounts
  useEffect(() => {
    // Fetch from your backend
    fetch('/api/some-endpoint')  // This will be proxied to http://localhost:3001/api/some-endpoint
      .then(response => response.json())
      .then(data => {
        console.log(data);  // Log the data to the console for debugging
        setData(data);  // Set the fetched data into state
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);  // Empty array means this effect runs only once when the component mounts

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>

      {/* Display fetched data or a loading message */}
      <div>
        {data ? (
          <div>
            <h2>Data from Backend:</h2>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        ) : (
          <p>Loading data from backend...</p>
        )}
      </div>
    </div>
  );
}

export default App;
