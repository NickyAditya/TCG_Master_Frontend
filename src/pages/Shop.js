import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import './Shop.css';
import { AuthContext } from '../App'; // Import the AuthContext

function Shop() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Cart state
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartTotal, setCartTotal] = useState(0);
  // Get user context
  const { user, setUser } = useContext(AuthContext);
  // Success Popup state
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('tcgMasterCart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error('Failed to load cart from localStorage:', err);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tcgMasterCart', JSON.stringify(cart));
  }, [cart]);
  
  // Initial fetch when component mounts - only run once
  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
    const fetchCards = async () => {
    setLoading(true);
    setError(''); // Clear any previous errors
    
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cards`);
      
      // Process the cards from the database
      const dbCards = response.data;
      
      // Store all cards so we can filter without making API calls
      setAllCards(dbCards);
      
      // Apply filters based on the selected category and search query
      filterCards(dbCards);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Failed to load cards. Please check your database connection or contact support.');
      setLoading(false);
      setCards([]); // Clear cards on error
    }
  };
  // Store all cards in state so we can filter them without making API calls
  const [allCards, setAllCards] = useState([]);

  // Fetch cards only once on component mount
  useEffect(() => {
    fetchCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Filter cards when category or search changes
  useEffect(() => {
    if (allCards.length > 0) {
      setLoading(true);
      // Use setTimeout to prevent UI freezing during filtering
      setTimeout(() => {
        filterCards(allCards);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery]);
  const filterCards = (allDbCards) => {
    // Don't need to set loading again during filtering if we're already in loading state
    
    // Convert database cards to the format expected by our UI
    const formattedCards = allDbCards.map(card => ({
      id: card.id,
      name: card.name,
      price: parseFloat(card.price),
      image: card.image || '/images/cards/card-placeholder.jpg',
      rarity: card.rarity || 'Common',
      set: card.card_set || '',
      inStock: card.stock > 0,
      stockCount: card.stock,
      category: card.game // 'pokemon', 'yugioh', or 'mtg'
    }));
    
    let filteredCards = [];
    
    // Apply category filter
    if (selectedCategory === 'all') {
      filteredCards = formattedCards;
    } else {
      filteredCards = formattedCards.filter(card => card.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      filteredCards = filteredCards.filter(card => 
        card.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Always ensure we have at least 8 cards (2 rows of 4) for consistent layout
    // or a multiple of 4 cards to fill complete rows
    const cardsPerRow = 4;
    const minRows = 2;
    
    // Calculate how many cards we need to have complete rows
    const totalRows = Math.max(minRows, Math.ceil(filteredCards.length / cardsPerRow));
    const targetCardCount = totalRows * cardsPerRow;
    
    // Create final array with active cards first
    let finalCards = [...filteredCards];
    
    // Add empty placeholder cards if needed to complete rows
    if (finalCards.length < targetCardCount) {
      // How many placeholders do we need?
      const placeholdersNeeded = targetCardCount - finalCards.length;
      
      // Add placeholders
      for (let i = 0; i < placeholdersNeeded; i++) {
        finalCards.push({ 
          id: `placeholder-${i}`, 
          name: '', 
          price: 0, 
          image: '',
          rarity: '',
          set: '',
          inStock: false,
          category: 'placeholder',
          isPlaceholder: true
        });
      }
    }
    
    setCards(finalCards);
    setLoading(false);
  };
  
  // Handle category selection
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };
  
  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Fallback image for cards without images
  const handleImageError = (e) => {
    e.target.src = '/images/cards/card-placeholder.jpg';
  };

  // Cart functions
  const addToCart = (card) => {
    // Check if item is already in cart
    const existingItem = cart.find(item => item.id === card.id);
    
    if (existingItem) {
      // Item exists, increase quantity
      const updatedCart = cart.map(item => 
        item.id === card.id ? { ...item, quantity: item.quantity + 1 } : item
      );
      setCart(updatedCart);
    } else {
      // Item doesn't exist, add it with quantity 1
      setCart([...cart, { ...card, quantity: 1 }]);
    }
    
    // Open cart when item is added
    setCartOpen(true);
  };

  const removeFromCart = (cardId) => {
    setCart(cart.filter(item => item.id !== cardId));
  };

  const updateQuantity = (cardId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(cardId);
      return;
    }

    setCart(cart.map(item => 
      item.id === cardId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Calculate cart total whenever cart changes
  useEffect(() => {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setCartTotal(total);
  }, [cart]);

  // Toggle cart visibility
  const toggleCart = () => {
    setCartOpen(!cartOpen);
  };

  // Process checkout - mengirim kartu ke inventory user
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
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
      console.log('Login event detected');
      const user = event.detail;
      setIsLoggedIn(true);
      setUserId(user.id);
    };

    const handleUserLogout = () => {
      console.log('Logout event detected');
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
  // Fungsi untuk memproses checkout
  const handleCheckout = async () => {
    // Reset pesan error dan sukses
    setCheckoutError('');
    setCheckoutMessage('');
    
    // Jika tidak ada barang di keranjang
    if (cart.length === 0) {
      setCheckoutError('Keranjang belanja kosong');
      return;
    }

    // Periksa login dengan lebih teliti
    const userData = localStorage.getItem('user');
    if (!userData) {
      setCheckoutError('Silakan login terlebih dahulu untuk menyelesaikan pembelian');
      setIsLoggedIn(false);
      setUserId(null);
      return;
    }
    
    let userObj;
    try {
      userObj = JSON.parse(userData);
      if (!userObj.id) {
        throw new Error('Invalid user data');
      }
      // Pastikan status login sudah benar
      setIsLoggedIn(true);
      setUserId(userObj.id);
    } catch (err) {
      setCheckoutError('Data login tidak valid. Silakan login kembali.');
      console.error('Invalid user data:', err);
      return;
    }
    
    console.log('User verification passed:', userObj.username);
    setIsCheckingOut(true);
    
    try {
      // Ambil data user yang paling update dari localStorage
      const currentUserData = localStorage.getItem('user');
      let currentUserId = userId;
      
      if (currentUserData) {
        try {
          const currentUser = JSON.parse(currentUserData);
          currentUserId = currentUser.id;
          console.log('Current User ID from localStorage:', currentUserId);
          // Update userId jika berubah
          if (currentUserId !== userId) {
            setUserId(currentUserId);
          }
        } catch (err) {
          console.error('Error parsing current user data:', err);
        }
      }
      
      // Format data untuk dikirim ke server
      const orderData = {
        userId: currentUserId,
        items: cart.map(item => ({
          cardId: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: cartTotal
      };
      
      console.log('Sending checkout data to server:', orderData);
      console.log('Cart items:', cart);

      // Kirim request ke server
      // Coba gunakan endpoint inventory langsung
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/inventory/add`, orderData);
      
      if (response.status === 200 || response.status === 201) {
        // Jika berhasil, kosongkan cart dan tampilkan pesan sukses
        setCheckoutMessage('Pembelian berhasil! Kartu telah ditambahkan ke inventory Anda');
        clearCart(); // Kosongkan cart setelah checkout berhasil
        
        // Use the updated balance from server response or fallback to calculation
        const updatedBalance = response.data.updatedBalance !== undefined
          ? response.data.updatedBalance
          : parseFloat(user.balance) - cartTotal;
        
        // Update user's balance in context and localStorage
        if (user && setUser) {
          // Update user object with the new balance
          const updatedUser = {
            ...user,
            balance: updatedBalance
          };
          
          // Update context and localStorage
          setUser(updatedUser);
          console.log('Updated user balance to:', updatedBalance);
        }
        
        // Show success popup notification
        setShowSuccessPopup(true);
        
        setTimeout(() => {
          setCartOpen(false); // Tutup modal cart
          setCheckoutMessage('');
        }, 3000);

        // Auto-hide success popup after 3 seconds
        setTimeout(() => {
          setShowSuccessPopup(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      console.error('Error details:', err.response?.data || 'No response data');
      
      // Tampilkan pesan yang lebih detail
      if (err.response) {
        // Special handling for insufficient funds error
        if (err.response.status === 400 && err.response.data?.message === 'Insufficient funds') {
          const { balance, required, shortfall } = err.response.data;
          setCheckoutError(
            `Saldo tidak mencukupi. Saldo Anda: Rp ${parseFloat(balance).toLocaleString('id-ID')}, ` +
            `Total belanja: Rp ${parseFloat(required).toLocaleString('id-ID')}, ` +
            `Kekurangan: Rp ${parseFloat(shortfall).toLocaleString('id-ID')}. ` +
            `Silakan top up saldo Anda terlebih dahulu.`
          );
        } else {
          setCheckoutError(`Error (${err.response.status}): ${err.response.data?.message || JSON.stringify(err.response.data)}`);
        }
      } else if (err.request) {
        setCheckoutError('Server tidak merespons. Mohon cek koneksi Anda.');
      } else {
        setCheckoutError(`Error: ${err.message}`);
      }
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="shop-container">
      {/* Success Popup Notification */}
      {showSuccessPopup && (
        <div className="success-popup">
          <span className="icon">✓</span>
          <span>Kartu berhasil dibeli!</span>
        </div>
      )}
      
      <div className="shop-header">
        <h1>TCG Card Shop</h1>
        <p>Browse our premium selection of trading cards from Pokémon, Yu-Gi-Oh!, and Magic: The Gathering</p>
        {/* Login status indicator */}
        <div className="login-status">
          {/* <span>{isLoggedIn ? `Logged in (User ID: ${userId})` : 'Not logged in'}</span> */}
          {/* <button className="check-login-btn" onClick={checkLoginStatus}>
            Refresh Login Status
          </button> */}
        </div>
      </div>
      
      {/* Cart button */}
      <div className="cart-icon-container">
        <button 
          className="cart-icon-button" 
          onClick={toggleCart}
          aria-label="Open shopping cart"
        >
          <span className="material-icons">shopping_cart</span>
          {cart.length > 0 && (
            <span className="cart-badge">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
          )}
        </button>
      </div>

      {/* Shopping Cart Sidebar */}
      <div className={`cart-sidebar ${cartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-cart" onClick={toggleCart}>×</button>
        </div>
        
        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            <>
              {cart.map(item => (
                <div className="cart-item" key={`cart-${item.id}`}>
                  <div className="cart-item-image">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      onError={handleImageError}
                    />
                  </div>
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <p className="cart-item-price">Rp.  {item.price.toFixed(2)}</p>
                    <div className="quantity-controls">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="item-quantity">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stockCount}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-subtotal">
                    Rp.{(item.price * item.quantity).toFixed(2)}
                  </div>
                  <button 
                    className="remove-item"
                    onClick={() => removeFromCart(item.id)}
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    ×
                  </button>
                </div>
              ))}
              
              <div className="cart-summary">
                <div className="cart-total">
                  <span>Total:</span>
                  <span>Rp.{cartTotal.toFixed(2)}</span>
                </div>
                {checkoutMessage && (
                  <div className="checkout-message success">
                    {checkoutMessage}
                  </div>
                )}
                {checkoutError && (
                  <div className="checkout-message error">
                    {checkoutError}
                  </div>
                )}
                <div className="cart-actions">
                  <button className="clear-cart" onClick={clearCart} disabled={isCheckingOut}>
                    {isCheckingOut ? 'Memproses...' : 'Clear Cart'}
                  </button>
                  <button 
                    className="checkout-button"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isCheckingOut}
                  >
                    {!isLoggedIn ? 'Login untuk Checkout' : 
                     isCheckingOut ? 'Memproses...' : 'Proceed to Checkout'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Overlay for closing cart when clicking outside */}
      {cartOpen && (
        <div className="cart-overlay" onClick={toggleCart}></div>
      )}
      
      <div className="shop-filters">
        <div className="filter-group">
          <div className="category-tabs">
            <button 
              className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('all')}
            >
              All Cards
            </button>
            <button 
              className={`category-tab ${selectedCategory === 'pokemon' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('pokemon')}
            >
              Pokémon
            </button>
            <button 
              className={`category-tab ${selectedCategory === 'yugioh' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('yugioh')}
            >
              Yu-Gi-Oh!
            </button>
            <button 
              className={`category-tab ${selectedCategory === 'mtg' ? 'active' : ''}`}
              onClick={() => handleCategoryChange('mtg')}
            >
              Magic: The Gathering
            </button>
          </div>
        </div>
        
        <div className="search-bar">
          <input 
            type="text" 
            placeholder="Search cards..." 
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>
        <div className="shop-content">
        {loading ? (
          <div className="loading">Loading cards...</div>
        ) : error ? (
          <div className="error-message">
            <h3>Error loading cards</h3>
            <p>{error}</p>
          </div>
        ) : cards.length === 0 ? (
          <div className="no-results">
            <h3>No cards found</h3>
            <p>Try changing your search criteria</p>
          </div>
        ) : (
          <div className="card-grid">
            {/* Fill with actual cards and placeholders to maintain consistent layout */}
            {cards.map(card => (
              card.isPlaceholder ? (
                // Placeholder cards - invisible but maintain grid structure
                <div 
                  className="card-item placeholder" 
                  key={`placeholder-${card.id}`} 
                  aria-hidden="true"
                ></div>
              ) : (
                // Real cards with content
                <div className="card-item" key={`${card.category}-${card.id}`}>
                  <div className="card-image">
                    <img 
                      src={card.image} 
                      alt={card.name}
                      onError={handleImageError} 
                      loading="lazy"
                    />
                    {!card.inStock && <span className="out-of-stock">Out of Stock</span>}
                  </div>
                  <div className="card-details">
                    <h3 className="card-name">{card.name}</h3>
                    <div className="card-meta">
                      <span className="card-set">{card.set}</span>                      
                      <span className={`card-rarity ${card.rarity ? card.rarity.toLowerCase().replace(' ', '-') : 'common'}`}>
                        {card.rarity || 'Common'}
                      </span>
                    </div>
                    <div className="card-purchase">
                      <span className="card-price">Rp.{card.price.toFixed(2)}</span>
                      <button 
                        className="add-to-cart" 
                        disabled={!card.inStock}
                        onClick={() => card.inStock && addToCart(card)}
                      >
                        {card.inStock ? 'Add to Cart' : 'Sold Out'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="card-game-tag">
                    <span className={`game-tag ${card.category}`}>
                      {card.category === 'pokemon' ? 'Pokémon' : 
                       card.category === 'yugioh' ? 'Yu-Gi-Oh!' : 'MTG'}
                    </span>
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Shop;