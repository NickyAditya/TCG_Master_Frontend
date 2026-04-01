import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Hero.css'; // Using the existing CSS file
import { AuthContext } from '../App'; // Import the context

function Navbar() {
  console.log("Navbar component is rendering..."); // Debug log
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  // Get user state from context
  const { user, setUser } = useContext(AuthContext);
  console.log("User from context:", user); // Debug log
  // Effect to sync the local user state with props and localStorage
  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      // Fallback to localStorage if props are not provided
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setCurrentUser(parsedUser);
          // Also update the parent component if setUser is provided
          if (setUser) setUser(parsedUser);
        }
      } catch (error) {
        console.error("Error reading user from localStorage:", error);
      }
    }
  }, [user, setUser]);
  
  // Effect to fetch the latest user balance from the server
  useEffect(() => {
    if (currentUser && currentUser.id) {
      // Fetch latest user data including balance
      const fetchUserBalance = async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/${currentUser.id}`);
          if (response.ok) {
            const userData = await response.json();
            // Only update if balance is different to avoid unnecessary rerenders
            if (userData.balance !== currentUser.balance) {
              const updatedUser = {
                ...currentUser,
                balance: userData.balance
              };
              setCurrentUser(updatedUser);
              // Update in context/localStorage if needed
              if (setUser) setUser(updatedUser);
            }
          }
        } catch (error) {
          console.error("Error fetching user balance:", error);
        }
      };
      
      fetchUserBalance();
      // Set up a periodic refresh every 60 seconds
      const intervalId = setInterval(fetchUserBalance, 60000);
      return () => clearInterval(intervalId);
    }  }, [currentUser, setUser]);  
  
  // Handle userLogin events  
  useEffect(() => {
    const handleUserLogin = (event) => {
      console.log("Navbar detected login:", event.detail);
      setCurrentUser(event.detail);
    };

    window.addEventListener('userLogin', handleUserLogin);
    
    return () => {
      window.removeEventListener('userLogin', handleUserLogin);
    };
  }, []); // Empty dependency array is correct here since we only want to set up the listener once
  
  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdownContainer = document.querySelector('.user-dropdown-container');
      if (dropdownContainer && !dropdownContainer.contains(event.target) && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
    if (setUser) setUser(null);
    navigate('/');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <nav className="navbar" style={{backgroundColor: '#1e1e1e', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 1000}}>
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo" style={{fontSize: '1.5rem', fontWeight: 'bold', color: '#ffce00', textDecoration: 'none'}}>TCG Master</Link>
        <button className="menu-toggle" onClick={toggleMenu}>
          {isMenuOpen ? '✕' : '☰'}
        </button>
      </div>
        <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`} style={{listStyle: 'none', display: 'flex', gap: '25px', alignItems: 'center', margin: 0, padding: 0}}>
        <li><Link to="/" onClick={() => setIsMenuOpen(false)} style={{color: 'white', textDecoration: 'none'}}>Home</Link></li>
        <li><Link to="/shop" onClick={() => setIsMenuOpen(false)} style={{color: 'white', textDecoration: 'none'}}>Shop</Link></li>
        
        {currentUser ? (
          <>            <li className="user-dropdown-container">
              <div className="user-greeting" onClick={toggleDropdown} style={{color: 'white'}}>
                Hello, {currentUser.username || currentUser.email}
                <i className='bx bx-chevron-down'></i>
                {currentUser.balance !== undefined && (
                  <span className="user-balance">Rp. {parseFloat(currentUser.balance).toLocaleString('id-ID')}</span>
                )}
              </div>
              {isDropdownOpen && (
                <div className="user-dropdown">
                  <Link to="/inventory" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Inventory</Link>
                  <Link to="/balance" className="dropdown-item" onClick={() => setIsDropdownOpen(false)}>Saldo</Link>
                  <div className="dropdown-item" onClick={handleLogout}>Logout</div>
                </div>
              )}
            </li>
            {currentUser.role === 'admin' && (
              <li><Link to="/admin" onClick={() => setIsMenuOpen(false)} style={{color: 'white', textDecoration: 'none'}}>Admin Dashboard</Link></li>
            )}
          </>
        ) : (
          <li><Link to="/login" onClick={() => setIsMenuOpen(false)} className="login-btn" style={{padding: '8px 16px', backgroundColor: '#ffce00', color: '#1e1e1e', borderRadius: '4px', fontWeight: 'bold', textDecoration: 'none'}}>Login</Link></li>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;