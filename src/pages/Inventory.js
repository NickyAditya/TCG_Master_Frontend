import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Shop.css'; // We'll reuse some of the Shop styles

function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  // Cek status login user saat komponen dimuat
  useEffect(() => {
    // Ambil data dari localStorage atau session
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserId(user.id);
        console.log('User logged in:', user.username);
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    } else {
      console.log('No user data found in localStorage');
    }

    // Tambahkan event listener untuk login/logout
    const handleUserLogin = (event) => {
      console.log('Login event detected in Inventory');
      const user = event.detail;
      setIsLoggedIn(true);
      setUserId(user.id);
    };

    const handleUserLogout = () => {
      console.log('Logout event detected in Inventory');
      setIsLoggedIn(false);
      setUserId(null);
    };

    window.addEventListener('userLogin', handleUserLogin);
    window.addEventListener('userLogout', handleUserLogout);

    return () => {
      window.removeEventListener('userLogin', handleUserLogin);
      window.removeEventListener('userLogout', handleUserLogout);
    };
  }, []);

  // Fetch inventory data from API when userId is available
  useEffect(() => {
    if (!isLoggedIn || !userId) {
      setLoading(false);
      return;
    }

    const fetchInventory = async () => {
      setLoading(true);
      setError('');
      
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/inventory/${userId}`);
        setInventory(response.data);
      } catch (err) {
        console.error('Error fetching inventory:', err);
        setError('Failed to load your inventory. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInventory();
  }, [isLoggedIn, userId]);
  // Fungsi untuk memverifikasi login ulang secara manual
  // eslint-disable-next-line no-unused-vars
  const checkLoginStatus = () => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setIsLoggedIn(true);
        setUserId(user.id);
        alert(`Logged in as: ${user.username} (ID: ${user.id})`);
      } catch (err) {
        console.error('Error parsing user data:', err);
        setIsLoggedIn(false);
        setUserId(null);
        alert('Error reading login data');
      }
    } else {
      setIsLoggedIn(false);
      setUserId(null);
      alert('Not logged in');
    }
  };

  // Fallback image for cards without images
  const handleImageError = (e) => {
    e.target.src = '/images/cards/card-placeholder.jpg';
  };

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1>My Card Inventory</h1>
        <p>Manage your collection of trading cards</p>
        {/* Login status indicator */}
        <div className="login-status">
          {/* <span>{isLoggedIn ? `Logged in (User ID: ${userId})` : 'Not logged in'}</span> */}
          {/* <button className="check-login-btn" onClick={checkLoginStatus}>
            Refresh Login Status
          </button> */}
        </div>
      </div>
      
      <div className="shop-content">
        {!isLoggedIn ? (
          <div className="no-results">
            <h3>Please Login First</h3>
            <p>You need to be logged in to view your inventory</p>
          </div>
        ) : loading ? (
          <div className="loading">Loading your inventory...</div>
        ) : error ? (
          <div className="error-message">
            <h3>Error loading inventory</h3>
            <p>{error}</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="no-results">
            <h3>No cards in your inventory</h3>
            <p>Visit the shop to find some awesome cards!</p>
          </div>
        ) : (
          <div className="card-grid">
            {inventory.map(card => (
              <div className="card-item" key={card.id}>
                <div className="card-image">
                  <img 
                    src={card.image} 
                    alt={card.name}
                    onError={handleImageError} 
                  />
                </div>
                <div className="card-details">
                  <h3 className="card-name">{card.name}</h3>
                  <div className="card-meta">
                    <span className="card-set">{card.set}</span>
                    <span className={`card-rarity ${card.rarity ? card.rarity.toLowerCase().replace(' ', '-') : 'common'}`}>
                      {card.rarity || 'Common'}
                    </span>
                  </div>
                  <div className="inventory-details">
                    <p>Condition: {card.condition}</p>
                    <p>Added: {new Date(card.purchase_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="card-game-tag">
                  <span className={`game-tag ${card.category}`}>
                    {card.category === 'pokemon' ? 'Pokémon' : 
                     card.category === 'yugioh' ? 'Yu-Gi-Oh!' : 'MTG'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;
