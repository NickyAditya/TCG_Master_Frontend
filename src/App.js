import React, { useEffect, useState, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import CarouselCards from './components/CarouselCards';
import Features from './components/Features';
import Footer from './components/Footer';

import Auth from './pages/Auth';
import AdminDashboard from './pages/AdminDashboard';
import Shop from './pages/Shop';
import Inventory from './pages/Inventory';
import Balance from './pages/Balance';

// Create a context for user authentication state
export const AuthContext = createContext(null);

// Styling untuk menghilangkan jarak
const noGapStyle = {
  display: 'flex',
  flexDirection: 'column',
}

const componentStyle = {
  margin: 0,
  padding: 0,
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Enhanced setUser function that updates both state and localStorage
  const updateUser = (userData) => {
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('userLogin', { detail: userData }));
    } else {
      localStorage.removeItem('user');
      setUser(null);
      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('userLogout'));
    }
  };

  useEffect(() => {
    const checkUserAuth = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse user data:", error);
          localStorage.removeItem('user'); // Clear invalid data
        }
      }
      setLoading(false);
    };

    // Initialize user state from localStorage
    checkUserAuth();

    // Handle user login events from Auth component
    const handleUserLogin = (event) => {
      console.log("User login detected:", event.detail);
      setUser(event.detail);
    };

    // Handle user logout events
    const handleUserLogout = () => {
      console.log("User logout detected");
      setUser(null);
    };

    // Add event listeners for auth state changes
    window.addEventListener('userLogin', handleUserLogin);
    window.addEventListener('userLogout', handleUserLogout);
    window.addEventListener('storage', (e) => {
      if (e.key === 'user') {
        checkUserAuth();
      }
    });

    return () => {
      // Clean up event listeners
      window.removeEventListener('userLogin', handleUserLogin);
      window.removeEventListener('userLogout', handleUserLogout);
      window.removeEventListener('storage', checkUserAuth);
    };
  }, []);

  // Protected route component
  const ProtectedRoute = ({ element, allowedRole }) => {
    if (loading) return <div>Loading...</div>;
    
    if (!user) {
      return <Navigate to="/login" />;
    }
    
    if (allowedRole && user.role !== allowedRole) {
      return <Navigate to="/" />;
    }
    
    return element;
  };

  return (
    <AuthContext.Provider value={{ user, setUser: updateUser }}>
      <Router>
        <Routes>
          {/* Admin routes - only AdminNavbar shown for admin users */}
          <Route 
            path="/admin/*" 
            element={<ProtectedRoute element={<AdminDashboard />} allowedRole="admin" />} 
          />
          
          {/* Auth route - no navbar */}
          <Route 
            path="/login" 
            element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/'} /> : <Auth />} 
          />
          
          {/* User routes - show regular navbar */}
          <Route path="/" element={
            <>
              <Navbar />
              {/* Container untuk menghilangkan gap */}
              <div style={noGapStyle}>
                <div style={componentStyle}>
                  <CarouselCards /> {/* 1. Carousel pertama */}
                </div>
                <div style={componentStyle}>
                  <Hero /> {/* 2. Hero kedua */}
                </div>
                <div style={componentStyle}>
                  <Features /> {/* 3. Features ketiga */}
                </div>
              </div>
              <Footer />
            </>
          } />
          <Route path="/shop" element={
            <>
              <Navbar />
              <Shop />
              <Footer />
            </>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute element={
              <>
                <Navbar />
                <Inventory />
                <Footer />
              </>
            } />
          } />

          <Route path="/balance" element={
            <ProtectedRoute element={
              <>
                <Navbar />
                <Balance />
                <Footer />
              </>
            } />
          } />
          
          {/* Add a catch-all redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;