import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send, MessageCircle, AlertTriangle } from 'lucide-react';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Phone Support',
      details: '+1 (555) 123-4567',
      description: '24/7 customer support'
    },
    {
      icon: Mail,
      title: 'Email Support',
      details: 'support@e-ride.com',
      description: 'Response within 2 hours'
    },
    {
      icon: MapPin,
      title: 'Headquarters',
      details: '123 Green Street, San Francisco, CA 94102',
      description: 'Visit our main office'
    },
    {
      icon: Clock,
      title: 'Business Hours',
      details: 'Mon-Fri: 6AM-10PM, Sat-Sun: 8AM-8PM',
      description: 'Office hours (PST)'
    }
  ];

  const offices = [
    {
      city: 'San Francisco',
      address: '123 Green Street, CA 94102',
      phone: '+1 (555) 123-4567',
      email: 'sf@e-ride.com'
    },
    {
      city: 'New York',
      address: '456 Broadway, NY 10013',
      phone: '+1 (555) 234-5678',
      email: 'ny@e-ride.com'
    },
    {
      city: 'Los Angeles',
      address: '789 Sunset Blvd, CA 90028',
      phone: '+1 (555) 345-6789',
      email: 'la@e-ride.com'
    },
    {
      city: 'Chicago',
      address: '321 Michigan Ave, IL 60601',
      phone: '+1 (555) 456-7890',
      email: 'chicago@e-ride.com'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Get in <span className="text-green-400">Touch</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Have questions, feedback, or need assistance? We're here to help! 
            Reach out to our friendly support team anytime.
          </p>
        </div>
      </section>

      {/* Contact Information */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {contactInfo.map((info, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <info.icon className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
                <p className="text-green-400 font-medium mb-1">{info.details}</p>
                <p className="text-gray-400 text-sm">{info.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Emergency Support */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold mb-6">Send us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="booking">Booking Support</option>
                    <option value="technical">Technical Issue</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                    placeholder="Tell us how we can help you..."
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </button>
              </form>
            </div>

            {/* Emergency Support */}
            <div className="space-y-8">
              <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
                  <h3 className="text-xl font-semibold text-red-400">Emergency Support</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  If you're experiencing an emergency while riding (accident, breakdown, theft), 
                  contact our emergency hotline immediately.
                </p>
                <div className="space-y-2">
                  <p className="text-white font-semibold">Emergency Hotline: +1 (555) 911-BIKE</p>
                  <p className="text-gray-400 text-sm">Available 24/7 for urgent assistance</p>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <div className="flex items-center mb-4">
                  <MessageCircle className="w-6 h-6 text-green-400 mr-3" />
                  <h3 className="text-xl font-semibold">Live Chat</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  Get instant help from our support team. Average response time is under 2 minutes.
                </p>
                <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors">
                  Start Live Chat
                </button>
              </div>

              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
                <div className="space-y-3">
                  <a href="#" className="block text-green-400 hover:text-green-300 transition-colors">
                    → Download Mobile App
                  </a>
                  <a href="#" className="block text-green-400 hover:text-green-300 transition-colors">
                    → Safety Guidelines
                  </a>
                  <a href="#" className="block text-green-400 hover:text-green-300 transition-colors">
                    → Terms of Service
                  </a>
                  <a href="#" className="block text-green-400 hover:text-green-300 transition-colors">
                    → Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Office Locations */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Offices</h2>
            <p className="text-gray-300 text-lg">Visit us at any of our locations across the country</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {offices.map((office, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-xl hover:bg-gray-750 transition-colors">
                <h3 className="text-xl font-semibold mb-3 text-green-400">{office.city}</h3>
                <div className="space-y-2 text-gray-300">
                  <p className="flex items-start">
                    <MapPin className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                    <span className="text-sm">{office.address}</span>
                  </p>
                  <p className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{office.phone}</span>
                  </p>
                  <p className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="text-sm">{office.email}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Don't wait! Download our app and book your first e-bike ride today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Download App
            </button>
            <button className="border border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Find Locations
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;