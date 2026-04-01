import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import './Balance.css';
import { useNavigate } from 'react-router-dom';

const Balance = () => {
  const { user, setUser } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleTopUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate amount
    const numericAmount = parseFloat(amount.replace(/[^\d]/g, ''));
    if (isNaN(numericAmount) || numericAmount < 100000) {
      setError('Minimum top-up amount is Rp. 100,000');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/${user.id}/balance`, {
        amount: numericAmount
      });
      
      // Update user context with new balance
      const updatedUser = {
        ...user,
        balance: response.data.balance
      };
      
      setUser(updatedUser);
      setSuccessMessage(`Successfully topped up Rp. ${numericAmount.toLocaleString('id-ID')}`);
      setAmount('');
    } catch (err) {
      console.error('Top-up error:', err);
      setError(err.response?.data?.message || 'Failed to process top-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectQuickAmount = (value) => {
    setAmount(value);
    setError('');
  };

  const quickAmounts = [
    'Rp. 100,000', 'Rp. 150,000', 'Rp. 200,000',
    'Rp. 300,000', 'Rp. 400,000', 'Rp. 450,000',
    'Rp. 500,000', 'Rp. 800,000', 'Rp. 1,000,000'
  ];

  const formatCurrency = (value) => {
    if (!value) return '';
    
    // Remove non-digits
    const numericValue = value.replace(/[^\d]/g, '');
    
    // Format with thousand separators
    return `Rp. ${parseInt(numericValue || 0).toLocaleString('id-ID')}`;
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value;
    setAmount(formatCurrency(rawValue));
    setError('');
  };

  if (!user) {
    return <div className="balance-container">Loading...</div>;
  }

  return (
    <div className="balance-container">
      <div className="balance-header">
        <h1>Saldo Anda</h1>
        <div className="balance-display">
          <span className="currency">Rp</span>
          {parseFloat(user.balance || 0).toLocaleString('id-ID')}
        </div>
      </div>
      
      <div className="topup-form">
        <h3>Top Up Saldo</h3>
        
        <div className="topup-input-container">
          <input
            type="text"
            className="topup-input"
            placeholder="Masukkan jumlah"
            value={amount}
            onChange={handleAmountChange}
          />
          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
        </div>
        
        <div className="quick-amount-grid">
          {quickAmounts.map((quickAmount, index) => (
            <button
              key={index}
              className="quick-amount-button"
              onClick={() => selectQuickAmount(quickAmount)}
            >
              {quickAmount}
            </button>
          ))}
        </div>
        
        <button
          className="topup-button"
          onClick={handleTopUp}
          disabled={loading || !amount || parseFloat(amount.replace(/[^\d]/g, '')) < 100000}
        >
          {loading ? (
            <>
              Processing... <span className="loading-indicator"></span>
            </>
          ) : (
            'Top Up'
          )}
        </button>
      </div>
    </div>
  );
};

export default Balance;
