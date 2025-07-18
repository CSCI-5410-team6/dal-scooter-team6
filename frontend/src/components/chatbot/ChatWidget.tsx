import React, { useState, useEffect, useRef } from 'react';
import { LexRuntimeV2Client, RecognizeTextCommand, Slot } from '@aws-sdk/client-lex-runtime-v2';
import { useAuthContext } from '../../contextStore/AuthContext';
import { lexConfig } from '../../config/amplifyConfig';
import { getCredentials } from '../../utils/credentials';

const lexClient = new LexRuntimeV2Client({
  region: lexConfig.region,
  credentials: getCredentials
});

const ChatWidget = () => {
  const { cognitoUser } = useAuthContext();
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Welcome! Ask me to navigate, get your bike code, or request support.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendLexRequest = async (text:string) => {
    const userId = cognitoUser?.username || `guest-${Math.random().toString(36).substring(2)}`;
    const userType = cognitoUser?.attributes?.['custom:userType'] || 'guest';

    console.log("USER", userId, userType)
    // BASIC intent detection
    let intentName = 'FallbackIntent';
    let slots = {};

    if (text.toLowerCase().includes('navigate')) {
      console.log("0")
      intentName = 'NavigationIntent';
      slots = {
        Location: {
          value: { interpretedValue: text.replace(/navigate\s*/i, '').trim() || 'home' }
        }
      };
    } else if (text.toLowerCase().includes('bike code') || text.toLowerCase().includes('booking')) {
      intentName = 'BookingIntent';
      console.log("1");
      
      slots = {
        BookingAction: {
          value: { interpretedValue: 'retrieve' }
        },
        BookingId: {
          value: { interpretedValue: text.match(/[a-z0-9-]{4,}/i)?.[0] || undefined }
        }
      };
    } else if (text.toLowerCase().includes('support')) {
      console.log("3");
      
      intentName = 'SupportIntent';
      slots = {
        BookingReference: {
          value: { interpretedValue: text.match(/[a-z0-9-]{4,}/i)?.[0] || 'unknown' }
        }
      };
    }

    const command = new RecognizeTextCommand({
      botId: lexConfig.botId,
      botAliasId: lexConfig.botAliasId,
      localeId: lexConfig.localeId,
      sessionId: userId,
      text,
      sessionState: {
        sessionAttributes: { userId, userType },
        intent: { name: intentName, slots }
      }
    });

    const response = await lexClient.send(command);

    if (response.sessionState?.intent?.state === 'Fulfilled') {
      return response.messages?.[0]?.content || 'Done!';
    } else if (response.sessionState?.intent?.state === 'InProgress') {
      return response.messages?.[0]?.content || 'I need more details.';
    } else {
      return 'Could not process that.';
    }
  };

  const handleSend = async (e:any) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const botReply = await sendLexRequest(input);
      setMessages((prev) => [...prev, { sender: 'bot', text: botReply }]);
    } catch (err) {
      console.log("error", err);
      
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error talking to assistant.' }]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col z-50">
      <div className="bg-blue-600 text-white p-3 rounded-t-lg">
        <h3 className="text-lg font-semibold">Virtual Assistant</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 p-2 rounded-md max-w-[80%] ${
              m.sender === 'user'
                ? 'bg-blue-600 text-white ml-auto'
                : 'bg-gray-200 text-gray-900 mr-auto'
            }`}
          >
            {m.text}
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={handleSend} className="flex p-2 border-t bg-white">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className={`ml-2 py-2 px-4 rounded-md ${
            loading ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default ChatWidget;
