import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, MessageCircle, Star } from 'lucide-react';

const FAQ: React.FC = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: 'Getting Started',
      questions: [
        {
          question: 'How do I rent an e-bike?',
          answer: 'Simply download our app, create an account, find a nearby bike using the map, scan the QR code, and start riding! Payment is processed automatically through the app.'
        },
        {
          question: 'Do I need a license to ride an e-bike?',
          answer: 'No license is required for our e-bikes. However, you must be at least 18 years old and follow local traffic laws. We recommend wearing a helmet for safety.'
        },
        {
          question: 'What do I need to bring?',
          answer: 'Just bring your smartphone and a valid payment method. Our bikes come with built-in locks, lights, and GPS tracking. Helmets are available as add-ons.'
        },
        {
          question: 'How do I unlock a bike?',
          answer: 'Use the E-Ride app to scan the QR code on the bike or enter the bike ID manually. The bike will unlock automatically once payment is confirmed.'
        }
      ]
    },
    {
      title: 'Pricing & Payment',
      questions: [
        {
          question: 'How much does it cost to rent?',
          answer: 'Pricing starts at $12/hour for our City Cruiser, $15/hour for Urban Explorer, and $20/hour for Mountain Beast Pro. We also offer daily passes for $45 with unlimited rides.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, debit cards, PayPal, Apple Pay, and Google Pay. Payment is processed securely through our app.'
        },
        {
          question: 'Are there any additional fees?',
          answer: 'No hidden fees! The displayed price includes insurance and basic maintenance. Additional charges only apply for damages, theft, or if the bike is not returned to a designated area.'
        },
        {
          question: 'Can I get a refund?',
          answer: 'Refunds are available for unused portions of daily passes and in case of technical issues. Contact our support team within 24 hours for refund requests.'
        }
      ]
    },
    {
      title: 'Using the Bikes',
      questions: [
        {
          question: 'How far can I ride on a single charge?',
          answer: 'Range varies by model: City Cruiser (35km), Urban Explorer (40km), and Mountain Beast Pro (60km). Actual range depends on terrain, rider weight, and assist level used.'
        },
        {
          question: 'What if the battery runs out during my ride?',
          answer: 'Our bikes can be pedaled manually even with a dead battery. Use the app to find the nearest charging station or contact support for assistance. We also offer battery swap services.'
        },
        {
          question: 'Where can I park the bike?',
          answer: 'Bikes must be returned to designated E-Ride stations or approved parking areas shown in the app. Parking in unauthorized areas may result in additional fees.'
        },
        {
          question: 'Can I reserve a bike in advance?',
          answer: 'Yes! Premium and corporate plan members can reserve bikes up to 30 minutes in advance. Standard users can reserve bikes for up to 15 minutes.'
        }
      ]
    },
    {
      title: 'Safety & Support',
      questions: [
        {
          question: 'What safety features do the bikes have?',
          answer: 'All bikes include LED lights, reflectors, bell, GPS tracking, and anti-theft locks. We also provide optional helmets and safety gear through our app.'
        },
        {
          question: 'What if I have an accident or breakdown?',
          answer: 'Contact our 24/7 emergency support immediately. We provide roadside assistance and will help coordinate any necessary medical or mechanical support.'
        },
        {
          question: 'Are the bikes insured?',
          answer: 'Yes, all rentals include comprehensive insurance covering theft, damage, and third-party liability. Additional personal accident insurance is available as an add-on.'
        },
        {
          question: 'How do I report a problem with a bike?',
          answer: 'Use the "Report Issue" feature in the app or contact our support team. Common issues can be resolved remotely, and we\'ll dispatch a technician if needed.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Frequently Asked <span className="text-green-400">Questions</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Find answers to common questions about our e-bike rental service. 
            Can't find what you're looking for? Contact our support team.
          </p>
        </div>
      </section>

      {/* Support Stats */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <Clock className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">2 min</div>
              <div className="text-gray-300">Average Response Time</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <MessageCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">24/7</div>
              <div className="text-gray-300">Support Available</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <Star className="w-8 h-8 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-green-400 mb-2">98%</div>
              <div className="text-gray-300">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-green-400">{category.title}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => {
                  const globalIndex = categoryIndex * 100 + faqIndex;
                  const isOpen = openItems.includes(globalIndex);
                  
                  return (
                    <div key={faqIndex} className="bg-gray-800 rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-750 transition-colors"
                      >
                        <span className="font-semibold text-lg">{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-green-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-green-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Support */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Still Have Questions?</h2>
          <p className="text-gray-300 text-lg mb-8">
            Our friendly support team is here to help you 24/7. Get in touch and we'll respond within minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Live Chat Support
            </button>
            <button className="border border-green-500 text-green-400 hover:bg-green-500 hover:text-white px-8 py-3 rounded-lg font-semibold transition-colors">
              Email Support
            </button>
          </div>
        </div>
      </section>

      {/* Quick Tips */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Quick Tips for New Riders</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="text-2xl font-bold text-green-400 mb-2">1</div>
              <h3 className="text-lg font-semibold mb-3">Download the App</h3>
              <p className="text-gray-300">Get the E-Ride app from App Store or Google Play to find bikes, unlock, and pay seamlessly.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="text-2xl font-bold text-green-400 mb-2">2</div>
              <h3 className="text-lg font-semibold mb-3">Check the Bike</h3>
              <p className="text-gray-300">Before riding, check the battery level, brakes, and tires. Report any issues through the app.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-xl">
              <div className="text-2xl font-bold text-green-400 mb-2">3</div>
              <h3 className="text-lg font-semibold mb-3">Ride Safely</h3>
              <p className="text-gray-300">Follow traffic rules, wear a helmet, and use bike lanes when available. Enjoy your ride!</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;