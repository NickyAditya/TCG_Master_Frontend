import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './CarouselCards.css'; // Import CSS file
import { Link } from 'react-router-dom'; 

// Data kartu dengan gambar Pokemon
const cards = [
  { 
    name: 'Pokemon Journeys', 
    image: '/images/carousel/poster1.avif',
    desc: 'Koleksi kartu Pokemon terbaru dari seri Journeys'
  },
  { 
    name: 'Yu-Gi-Oh! Collection', 
    image: '/images/carousel/poster2.jpeg',
    desc: 'Kartu legendaris Yu-Gi-Oh! dengan kekuatan maksimal' 
  },
  { 
    name: 'Magic: The Gathering', 
    image: '/images/carousel/poster3.avif',
    desc: 'Set terbaru dari Magic: The Gathering dengan artwork menakjubkan' 
  }
];

function CarouselCards() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
    centerMode: false,  // Diubah menjadi false agar gambar penuh
    fade: true,        // Menggunakan efek fade untuk transisi
    className: 'carousel-slides',
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
          dots: true
        }
      }
    ]
  };

  return (
    <div className="carousel-container">
      <Slider {...settings}>
        {cards.map((card, index) => (
          <div key={index} className="card-slide">
            <div className="card-image-wrapper">
              <div 
                className="card-image-container" 
                style={{ 
                  backgroundImage: `url(${card.image})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover'
                }}
              >
                <div className="card-overlay">
                  <div className="card-caption">
                    <h2>{card.name}</h2>
                    <p>{card.desc}</p>
                    <Link to="/shop" className="card-action-btn">Explore Cards</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}

export default CarouselCards;