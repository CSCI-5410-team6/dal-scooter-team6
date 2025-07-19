import React from 'react';
import { Clock, Calendar, Building, Smartphone, Battery, Shield, Wrench, Headphones } from 'lucide-react';

const Service: React.FC = () => {
  const plans = [
    {
      name: 'Hourly',
      price: '$12-20',
      period: 'per hour',
      description: 'Perfect for short trips and quick errands',
      features: [
        'Flexible timing',
        'No commitment',
        'Pay as you go',
        'All bike models available'
      ],
      popular: false
    },
    {
      name: 'Daily Pass',
      price: '$45',
      period: 'per day',
      description: 'Unlimited rides for a full day of exploration',
      features: [
        'Unlimited rides',
        '24-hour access',
        'Free bike swapping',
        'Priority support'
      ],
      popular: true
    },
    {
      name: 'Corporate',
      price: 'Custom',
      period: 'pricing',
      description: 'Tailored solutions for businesses and teams',
      features: [
        'Volume discounts',
        'Employee accounts',
        'Usage analytics',
        'Dedicated support'
      ],
      popular: false
    }
  ];

  const features = [
    {
      icon: Smartphone,
      title: 'Smart App',
      description: 'Find, unlock, and pay for bikes with our intuitive mobile app'
    },
    {
      icon: Battery,
      title: 'Long-Range Batteries',
      description: 'Up to 60km range with fast-charging capabilities'
    },
    {
      icon: Shield,
      title: 'Insurance Included',
      description: 'Comprehensive coverage for theft and damage protection'
    },
    {
      icon: Wrench,
      title: 'Regular Maintenance',
      description: 'Professional servicing to ensure optimal performance'
    }
  ];

  const addOns = [
    {
      name: 'Premium Helmet',
      price: '$5',
      description: 'Safety-certified helmet with LED lights'
    },
    {
      name: 'Phone Mount',
      price: '$3',
      description: 'Secure mount for navigation and calls'
    },
    {
      name: 'Extra Battery',
      price: '$8',
      description: 'Double your range with spare battery pack'
    },
    {
      name: 'Cargo Basket',
      price: '$4',
      description: 'Front basket for groceries and belongings'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Our <span className="text-green-400">Services</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Flexible rental plans and premium features designed to meet all your urban mobility needs.
          </p>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Rental Plans</h2>
            <p className="text-gray-300 text-lg">Choose the plan that fits your lifestyle</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <div key={index} className={`relative bg-gray-800 rounded-xl p-8 ${plan.popular ? 'ring-2 ring-green-500' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-green-400 mb-1">{plan.price}</div>
                  <div className="text-gray-400">{plan.period}</div>
                  <p className="text-gray-300 mt-4">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  plan.popular 
                    ? 'bg-green-500 hover:bg-green-600 text-white' 
                    : 'border border-green-500 text-green-400 hover:bg-green-500 hover:text-white'
                }`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Premium Features</h2>
            <p className="text-gray-300 text-lg">Everything you need for the perfect ride</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <feature.icon className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Add-ons & Accessories</h2>
            <p className="text-gray-300 text-lg">Enhance your ride with premium accessories</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-xl hover:bg-gray-750 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold">{addon.name}</h3>
                  <span className="text-green-400 font-bold">{addon.price}</span>
                </div>
                <p className="text-gray-300 text-sm mb-4">{addon.description}</p>
                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors">
                  Add to Booking
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Service Areas</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                We operate in 150+ cities worldwide, with strategically placed stations near:
              </p>
              <ul className="space-y-3">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Metro and subway stations</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">University campuses</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Business districts</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Tourist attractions</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  <span className="text-gray-300">Shopping centers</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800 p-8 rounded-xl">
              <h3 className="text-xl font-semibold mb-4">24/7 Support</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Headphones className="w-6 h-6 text-green-400" />
                  <span className="text-gray-300">Live chat support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-6 h-6 text-green-400" />
                  <span className="text-gray-300">Average response: 2 minutes</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Wrench className="w-6 h-6 text-green-400" />
                  <span className="text-gray-300">Emergency roadside assistance</span>
                </div>
              </div>
              <button className="w-full mt-6 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Riding?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Join thousands of riders who have already discovered the joy of e-biking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Book Your First Ride
            </button>
            <button className="border border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Download App
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Service;