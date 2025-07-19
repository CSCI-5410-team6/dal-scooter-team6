import React, { useState } from 'react';
import { Menu, X, MapPin, Phone, Mail, ChevronRight, Star, Calendar, Clock, Users } from 'lucide-react';
import Chatbot from '../chatbot/ChatBot';
import About from './About';
import Service from './Service';
import FAQ from './FAQ';
import Contact from './Contact';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
    const navigate = useNavigate();

  const featuredBikes = [
    {
      id: 1,
      name: 'Urban Explorer 2024',
      image: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.8,
      price: '$15/hour',
      features: ['40km Range', 'Smart Lock', 'GPS Tracking']
    },
    {
      id: 2,
      name: 'Mountain Beast Pro',
      image: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.9,
      price: '$20/hour',
      features: ['60km Range', 'All-Terrain', 'Quick Charge']
    },
    {
      id: 3,
      name: 'City Cruiser Deluxe',
      image: 'https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=400',
      rating: 4.7,
      price: '$12/hour',
      features: ['35km Range', 'Comfort Seat', 'LED Lights']
    }
  ];

  const renderPage = () => {
    switch (currentPage) {
      case 'about':
        return <About />;
      case 'service':
        return <Service />;
      case 'faq':
        return <FAQ />;
      case 'contact':
        return <Contact />;
      default:
        return renderHomePage();
    }
  };

  const renderHomePage = () => (
    <>
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  New 2024 E-Bike
                  <span className="block text-green-400">Overview</span>
                </h1>
                <p className="text-lg text-gray-300 max-w-lg leading-relaxed">
                  Experience the future of urban mobility with our premium e-bike fleet. 
                  Eco-friendly, efficient, and designed for the modern commuter. 
                  Book your ride today and transform your daily journey.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center group">
                  GET BIKE
                  <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Find Location
                </button>
              </div>

              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-green-400" />
                  <span className="text-sm text-gray-300">50k+ Riders</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm text-gray-300">4.8 Rating</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-gray-300">24/7 Service</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Premium E-Bike"
                  className="w-full h-auto max-w-lg mx-auto"
                />
              </div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/20 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Bikes Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured E-Bikes</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Choose from our premium selection of electric bikes, each designed for different adventures and lifestyles.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredBikes.map((bike) => (
              <div key={bike.id} className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-all duration-300 transform hover:scale-105 border border-gray-700">
                <div className="relative">
                  <img
                    src={bike.image}
                    alt={bike.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {bike.price}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">{bike.name}</h3>
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-300">{bike.rating}</span>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    {bike.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                  <button onClick={()=>{ navigate('/signup');}} className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors">
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">150+</div>
              <div className="text-gray-300">Locations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">50k+</div>
              <div className="text-gray-300">Happy Riders</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">99.9%</div>
              <div className="text-gray-300">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">24/7</div>
              <div className="text-gray-300">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="text-2xl font-bold text-green-400">E-Ride</div>
              <p className="text-gray-300">
                Revolutionizing urban transportation with premium electric bikes.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Mail className="h-4 w-4 text-white" />
                </div>
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Services</h4>
              <div className="space-y-2 text-gray-300">
                <div>Hourly Rentals</div>
                <div>Daily Packages</div>
                <div>Corporate Plans</div>
                <div>Group Bookings</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-gray-300">
                <div>Help Center</div>
                <div>Contact Us</div>
                <div>Safety Guide</div>
                <div>Terms & Conditions</div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <div className="space-y-2 text-gray-300">
                <div>About Us</div>
                <div>Careers</div>
                <div>Press</div>
                <div>Partnerships</div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 E-Ride. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold text-green-400">E-Ride</span>
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  <button 
                    onClick={() => setCurrentPage('home')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === 'home' ? 'text-white' : 'text-gray-300 hover:text-green-400'
                    }`}
                  >
                    Home
                  </button>
                  <button 
                    onClick={() => setCurrentPage('about')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === 'about' ? 'text-white' : 'text-gray-300 hover:text-green-400'
                    }`}
                  >
                    About
                  </button>
                  <button 
                    onClick={() => setCurrentPage('service')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === 'service' ? 'text-white' : 'text-gray-300 hover:text-green-400'
                    }`}
                  >
                    Services
                  </button>
                  <button 
                    onClick={() => setCurrentPage('faq')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === 'faq' ? 'text-white' : 'text-gray-300 hover:text-green-400'
                    }`}
                  >
                    FAQ
                  </button>
                  <button 
                    onClick={() => setCurrentPage('contact')}
                    className={`px-3 py-2 text-sm font-medium transition-colors ${
                      currentPage === 'contact' ? 'text-white' : 'text-gray-300 hover:text-green-400'
                    }`}
                  >
                    Contact
                  </button>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button onClick={()=>{ navigate('/signup');}} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Book Now
              </button>
            </div>
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-400 hover:text-white focus:outline-none focus:text-white"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-800">
              <button 
                onClick={() => { setCurrentPage('home'); setIsMenuOpen(false); }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === 'home' ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => { setCurrentPage('about'); setIsMenuOpen(false); }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === 'about' ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                About
              </button>
              <button 
                onClick={() => { setCurrentPage('service'); setIsMenuOpen(false); }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === 'service' ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Services
              </button>
              <button 
                onClick={() => { setCurrentPage('faq'); setIsMenuOpen(false); }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === 'faq' ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                FAQ
              </button>
              <button 
                onClick={() => { setCurrentPage('contact'); setIsMenuOpen(false); }}
                className={`block px-3 py-2 text-base font-medium w-full text-left ${
                  currentPage === 'contact' ? 'text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                Contact
              </button>
              <button onClick={()=>{ navigate('/signup');}} className="w-full text-left bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg font-medium mt-4">
                Book Now
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Page Content */}
      {renderPage()}
      
      {/* Chatbot */}
      <Chatbot />
    </div>
  );
}

export default HomePage;