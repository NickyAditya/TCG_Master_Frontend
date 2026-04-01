import React from 'react';
import { motion } from 'framer-motion';
import './Hero.css'; 
import { Link } from 'react-router-dom';

function Hero() {
  return (
    <motion.div className="hero"
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 1.2 }}
    >
      <div className="hero-content">
        <h1>Selamat datang di <span>TCG Master</span></h1>
        <p>Peel the Layers, Trade the Legends</p>
        <button className="btn" ><Link to="/shop" >Mulai Jelajah</Link></button>
      </div>
    </motion.div>
  );
}

export default Hero;