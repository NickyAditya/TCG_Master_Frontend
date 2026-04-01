import React, { useEffect, useState, useContext } from 'react';
import './Auth.css';
import './AuthStyles.css'; // Import our scoped styles
import 'boxicons/css/boxicons.min.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App'; // Import the context

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useContext(AuthContext);

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  
  // States for password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  
  // States for password validation
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasNumber: false
  });
  
  // State to track if all password requirements are met
  const [allRequirementsMet, setAllRequirementsMet] = useState(false);
  
  // Track if password field has been focused at least once
  const [passwordTouched, setPasswordTouched] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/');
      return;
    }    
    const container = document.getElementById('auth-container');
    setTimeout(() => {
      container.classList.add('sign-in');
    }, 200);
  }, [navigate]);

  // Validate password as user types
  useEffect(() => {
    const password = registerData.password;
    
    const validations = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password)
    };
    
    setPasswordValidation(validations);
    
    // Check if all requirements are met
    const requirementsMet = 
      validations.minLength && 
      validations.hasUppercase && 
      validations.hasNumber;
    
    setAllRequirementsMet(requirementsMet);
  }, [registerData.password]);

  const toggle = () => {
    setError('');    
    const container = document.getElementById('auth-container');
    container.classList.toggle('sign-in');
    container.classList.toggle('sign-up');
    
    // Reset password validation states when toggling
    setPasswordTouched(false);
    setAllRequirementsMet(false);
  };  

  // Simplify error messages to minimum text
  const getSimplifiedError = (err) => {
    if (!err.response) return 'Connection error';
    
    const message = err.response.data?.message || '';
    
    // Common error messages - make them very short
    if (message.includes('User not found')) return 'User not found';
    if (message.includes('Invalid password')) return 'Wrong password';
    if (message.includes('already exists')) return 'User already exists';
    if (message.includes('Email already')) return 'Email already used';
    
    // Return a very short version of the original message or generic error
    return message.slice(0, 25) || 'Error occurred';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/login', loginData);
      const userData = res.data;

      // Update the global user state through context
      if (setUser) {
        setUser(userData);
      }

      setTimeout(() => {
        if (userData.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      }, 100);
    } catch (err) {
      // Set very concise error
      setError(getSimplifiedError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password requirements
    const { minLength, hasUppercase, hasNumber } = passwordValidation;
    if (!minLength || !hasUppercase || !hasNumber) {
      setError('Password tidak memenuhi persyaratan');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords tidak sama');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.post('http://localhost:5000/api/register', { 
        username: registerData.username, 
        email: registerData.email, 
        password: registerData.password, 
        role: 'user' 
      });
      
      // Show success message
      alert('Registrasi berhasil! Silakan login.');
      
      // Reset form and toggle to login
      setRegisterData({ username: '', email: '', password: '', confirmPassword: '' });
      setPasswordTouched(false);
      setAllRequirementsMet(false);
      toggle();
    } catch (err) {
      // Set very concise error
      setError(getSimplifiedError(err));
    } finally {
      setLoading(false);
    }
  };  

  // Toggle password visibility functions
  const toggleLoginPassword = () => {
    setShowLoginPassword(!showLoginPassword);
  };

  const toggleRegisterPassword = () => {
    setShowRegisterPassword(!showRegisterPassword);
  };

  const toggleRegisterConfirmPassword = () => {
    setShowRegisterConfirmPassword(!showRegisterConfirmPassword);
  };

  // Handle password field focus
  const handlePasswordFocus = () => {
    setPasswordTouched(true);
  };

  return (
    <div id="auth-container" className="container">
      <div className="row">
        {/* SIGN UP */}
        <div className="col align-items-center flex-col sign-up">
          <div className="form-wrapper align-items-center">
            <div className="form sign-up">
              <h2>Create an Account</h2>
              {error && <div className="error-message">Error: {error}</div>}
              <form onSubmit={handleRegister}>
                <div className="input-group">
                  <i className='bx bxs-user'></i>
                  <input 
                    type="text" 
                    placeholder="Username" 
                    required
                    value={registerData.username}
                    onChange={e => setRegisterData({ ...registerData, username: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <i className='bx bx-mail-send'></i>
                  <input 
                    type="email" 
                    placeholder="Email" 
                    required
                    value={registerData.email}
                    onChange={e => setRegisterData({ ...registerData, email: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <i className='bx bxs-lock-alt'></i>
                  <input 
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="Password" 
                    required
                    value={registerData.password}
                    onChange={e => setRegisterData({ ...registerData, password: e.target.value })}
                    onFocus={handlePasswordFocus}
                  />
                  <i 
                    className={`bx ${showRegisterPassword ? 'bx-show' : 'bx-hide'} password-toggle`}
                    onClick={toggleRegisterPassword}
                  ></i>
                </div>
                
                {/* Password Validation Checklist - only show if password is touched and not all requirements met */}
                {passwordTouched && (
                  <div className={`password-requirements ${allRequirementsMet ? 'fade-out' : 'fade-in'}`}>
                    {!passwordValidation.minLength && (
                      <div className="requirement">
                        <i className='bx bx-x-circle'></i>
                        <span>Minimal 8 karakter</span>
                      </div>
                    )}
                    {!passwordValidation.hasUppercase && (
                      <div className="requirement">
                        <i className='bx bx-x-circle'></i>
                        <span>Minimal 1 huruf besar</span>
                      </div>
                    )}
                    {!passwordValidation.hasNumber && (
                      <div className="requirement">
                        <i className='bx bx-x-circle'></i>
                        <span>Minimal 1 angka</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="input-group">
                  <i className='bx bxs-lock-alt'></i>
                  <input 
                    type={showRegisterConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password" 
                    required
                    value={registerData.confirmPassword}
                    onChange={e => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  />
                  <i 
                    className={`bx ${showRegisterConfirmPassword ? 'bx-show' : 'bx-hide'} password-toggle`}
                    onClick={toggleRegisterConfirmPassword}
                  ></i>
                </div>
                <button 
                  type="submit" 
                  disabled={loading || !allRequirementsMet || registerData.password !== registerData.confirmPassword}
                >
                  {loading ? 'Creating Account...' : 'Sign up'}
                </button>
              </form>
              <p>
                <span>Already have an account?</span>
                <b onClick={toggle} className="pointer">Sign in here</b>
              </p>
            </div>
          </div>
        </div>

        {/* SIGN IN */}
        <div className="col align-items-center flex-col sign-in">
          <div className="form-wrapper align-items-center">
            <div className="form sign-in">
              <h2>Welcome Back</h2>
              {error && <div className="error-message">Error: {error}</div>}
              <form onSubmit={handleLogin}>
                <div className="input-group">
                  <i className='bx bxs-user'></i>
                  <input 
                    type="text" 
                    placeholder="Username" 
                    required
                    value={loginData.username}
                    onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <i className='bx bxs-lock-alt'></i>
                  <input 
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Password" 
                    required
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  />
                  <i 
                    className={`bx ${showLoginPassword ? 'bx-show' : 'bx-hide'} password-toggle`}
                    onClick={toggleLoginPassword}
                  ></i>
                </div>
                <button type="submit" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign in'}
                </button>
                <p>
                  <span>Don't have an account?</span>
                  <b onClick={toggle} className="pointer">Sign up here</b>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="row content-row">
        {/* SIGN IN CONTENT */}
        <div className="col align-items-center flex-col">
          <div className="text sign-in">
            <h2>Welcome</h2>
            <h2>TCG Master</h2>
            <p>Master Card Born Here!</p>
          </div>
          <div className="img sign-in">
          </div>
        </div>
        {/* SIGN UP CONTENT */}
        <div className="col align-items-center flex-col">
          <div className="img sign-up">
          </div>
          <div className="text sign-up">
            <h2>Join Us!</h2>
            <p>Buy, sell, and trade the best TCG cards today!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;