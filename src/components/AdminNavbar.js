import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import './Hero.css'; // We'll reuse some styles

function AdminNavbar() {
  const { setUser } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <nav className="navbar admin-navbar">
      <div className="navbar-brand">
        <Link to="/admin" className="navbar-logo">TCG Master</Link>
      </div>
      <div className="admin-nav-right">
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default AdminNavbar;
