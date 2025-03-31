import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // State for users and products
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for form inputs
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('users');

  // API URLs 
 // const USER_API_URL = process.env.REACT_APP_USER_API_URL || 'http://localhost:5001/api/users';
  const USER_API_URL = process.env.REACT_APP_USER_API_URL || 'http://localhost:5001/users';
 // const PRODUCT_API_URL = process.env.REACT_APP_PRODUCT_API_URL || 'http://localhost:5002/api/products';
  const PRODUCT_API_URL = process.env.REACT_APP_PRODUCT_API_URL || 'http://localhost:5002/products';
  
  // Fetch users and products on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersResponse, productsResponse] = await Promise.all([
          fetch(USER_API_URL),
          fetch(PRODUCT_API_URL)
        ]);
        
        if (!usersResponse.ok) throw new Error('Failed to fetch users');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        
        const usersData = await usersResponse.json();
        const productsData = await productsResponse.json();
        
        setUsers(usersData);
        setProducts(productsData);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [USER_API_URL, PRODUCT_API_URL]);

  // Handle user form submission
  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(USER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email }),
      });
      
      if (!response.ok) throw new Error('Failed to create user');
      
      const newUser = await response.json();
      setUsers([...users, newUser]);
      setUsername('');
      setEmail('');
    } catch (err) {
      setError(err.message);
      console.error('Error creating user:', err);
    }
  };

  // Handle product form submission
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(PRODUCT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: productName, 
          description: productDescription, 
          price: parseFloat(productPrice) 
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create product');
      
      const newProduct = await response.json();
      setProducts([...products, newProduct]);
      setProductName('');
      setProductDescription('');
      setProductPrice('');
    } catch (err) {
      setError(err.message);
      console.error('Error creating product:', err);
    }
  };

  return (
    <div className="app">
      <header>
        <h1>Microservices Demo</h1>
        <div className="tabs">
          <button 
            className={activeTab === 'users' ? 'active' : ''} 
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={activeTab === 'products' ? 'active' : ''} 
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <main>
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'users' && (
              <div className="section">
                <h2>Users</h2>
                <form onSubmit={handleUserSubmit} className="form">
                  <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input
                      type="text"
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">Add User</button>
                </form>
                
                <div className="list-container">
                  <h3>User List</h3>
                  {users.length === 0 ? (
                    <p>No users found.</p>
                  ) : (
                    <ul className="list">
                      {users.map((user) => (
                        <li key={user.id} className="list-item">
                          <div className="list-item-header">
                            <strong>{user.username}</strong>
                          </div>
                          <div className="list-item-content">
                            <p>Email: {user.email}</p>
                            <p>Created: {new Date(user.created_at).toLocaleString()}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'products' && (
              <div className="section">
                <h2>Products</h2>
                <form onSubmit={handleProductSubmit} className="form">
                  <div className="form-group">
                    <label htmlFor="productName">Name:</label>
                    <input
                      type="text"
                      id="productName"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="productDescription">Description:</label>
                    <textarea
                      id="productDescription"
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="productPrice">Price:</label>
                    <input
                      type="number"
                      id="productPrice"
                      step="0.01"
                      min="0"
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="submit-btn">Add Product</button>
                </form>
                
                <div className="list-container">
                  <h3>Product List</h3>
                  {products.length === 0 ? (
                    <p>No products found.</p>
                  ) : (
                    <ul className="list">
                      {products.map((product) => (
                        <li key={product.id} className="list-item">
                          <div className="list-item-header">
                            <strong>{product.name}</strong>
                            <span className="price">${product.price.toFixed(2)}</span>
                          </div>
                          <div className="list-item-content">
                            <p>{product.description}</p>
                            <p>Created: {new Date(product.created_at).toLocaleString()}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <footer>
        <p>Microservices Demo &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

export default App;
