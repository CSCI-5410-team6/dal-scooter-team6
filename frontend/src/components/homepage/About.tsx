import React from 'react';
import { Users, Award, Globe, Zap, Shield, Leaf, Heart, Target } from 'lucide-react';

const About: React.FC = () => {
  const stats = [
    { icon: Globe, label: 'Cities', value: '150+' },
    { icon: Users, label: 'Happy Riders', value: '50,000+' },
    { icon: Zap, label: 'Rides Completed', value: '2M+' },
    { icon: Award, label: 'Years Experience', value: '5+' }
  ];

  const values = [
    {
      icon: Leaf,
      title: 'Sustainability',
      description: 'Committed to reducing carbon emissions and promoting eco-friendly transportation solutions for a greener future.'
    },
    {
      icon: Shield,
      title: 'Safety First',
      description: 'Every bike is regularly maintained and equipped with safety features to ensure secure rides for all our users.'
    },
    {
      icon: Zap,
      title: 'Innovation',
      description: 'Continuously improving our technology and services to provide the best e-bike experience in the industry.'
    },
    {
      icon: Heart,
      title: 'Community',
      description: 'Building stronger communities by connecting people and places through sustainable urban mobility.'
    }
  ];

  const team = [
    {
      name: 'Sarah Johnson',
      role: 'CEO & Founder',
      image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Former Tesla engineer with 10+ years in sustainable transportation.'
    },
    {
      name: 'Michael Chen',
      role: 'CTO',
      image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Tech visionary specializing in IoT and smart mobility solutions.'
    },
    {
      name: 'Emma Rodriguez',
      role: 'Head of Operations',
      image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
      bio: 'Operations expert ensuring seamless service across all locations.'
    },
    {
        name: 'Emma Rodriguez',
        role: 'Head of Operations',
        image: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=300',
        bio: 'Operations expert ensuring seamless service across all locations.'
      }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="text-green-400">E-Ride</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Founded in 2019, E-Ride is revolutionizing urban transportation with premium electric bikes. 
            We're on a mission to make cities cleaner, healthier, and more connected through sustainable mobility.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-3xl font-bold text-green-400 mb-2">{stat.value}</div>
                <div className="text-gray-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                We believe that transportation should be sustainable, accessible, and enjoyable. 
                Our premium e-bikes are designed to replace short car trips, reduce traffic congestion, 
                and help people rediscover the joy of cycling.
              </p>
              <p className="text-gray-300 text-lg leading-relaxed">
                With cutting-edge technology, reliable service, and a commitment to sustainability, 
                we're building the future of urban mobility one ride at a time.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.pexels.com/photos/100582/pexels-photo-100582.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="E-bike in city"
                className="rounded-lg shadow-2xl"
              />
              <div className="absolute -bottom-6 -right-6 bg-green-500 text-white p-6 rounded-lg">
                <div className="text-2xl font-bold">Carbon Neutral</div>
                <div className="text-sm">Since 2020</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              These core principles guide everything we do and shape our commitment to riders and communities.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-gray-800 p-6 rounded-xl hover:bg-gray-750 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mb-4">
                  <value.icon className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                <p className="text-gray-300 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Passionate professionals dedicated to transforming urban transportation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-750 transition-colors">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <div className="text-green-400 font-medium mb-3">{member.role}</div>
                  <p className="text-gray-300">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Join the Revolution?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Experience the future of urban transportation with E-Ride today.
          </p>
          <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
            Start Your First Ride
          </button>
        </div>
      </section>
    </div>
  );
};

export default About;