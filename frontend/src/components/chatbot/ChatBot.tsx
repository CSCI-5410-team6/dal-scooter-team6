import React, { useState, useEffect, useRef } from 'react';
import { LexRuntimeV2Client, RecognizeTextCommand } from '@aws-sdk/client-lex-runtime-v2';
import { lexConfig } from '../../config/amplifyConfig';
import { getCredentials } from '../../utils/credentials';
import { AwsCredentialIdentity } from '@aws-sdk/types';
import { Bot, User, Send, MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const lexClient = new LexRuntimeV2Client({
  region: lexConfig.region,
  credentials: async (): Promise<AwsCredentialIdentity> => {
    const { credentials } = await getCredentials();

    if (
      !credentials.AccessKeyId ||
      !credentials.SecretKey ||
      !credentials.SessionToken
    ) {
      throw new Error("Incomplete AWS credentials");
    }

    return {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretKey,
      sessionToken: credentials.SessionToken,
    };
  },
});

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: "Hi! I'm your E-Ride assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendLexRequest = async (text: string) => {
    const { credentials, identityId, userType } = await getCredentials();
    const userId = identityId || `guest-${Math.random().toString(36).substring(2)}`;

    const command = new RecognizeTextCommand({
      botId: lexConfig.botId,
      botAliasId: lexConfig.botAliasId,
      localeId: lexConfig.localeId,
      sessionId: userId,
      text,
      sessionState: {
        sessionAttributes: {
          userId,
          userType,
        }
      }
    });

    const response = await lexClient.send(command);
    const reply = response.messages?.[0]?.content || 'No response.';
    const match = reply.match(/navigating to (\w+)/i);
    const location = match?.[1];

    return { reply, location };
  };

  const handleSend = async (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const { reply, location } = await sendLexRequest(input);
      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);

      if (location) {
        const target = location.toLowerCase();
        if (['home', '/'].includes(target)) {
          navigate('/');
        } else if (['about', 'faq', 'service'].includes(target)) {
          navigate(`/${target}`);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              sender: 'bot',
              text: "Sorry, I can only navigate to Home, About, FAQ, or Service screens right now."
            }
          ]);
        }
      }
    } catch (err) {
      console.error('error', err);
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Error talking to assistant.' }]);
    } finally {
      setInput('');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
          isOpen ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-white mx-auto" />
        ) : (
          <MessageCircle className="w-6 h-6 text-white mx-auto" />
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-80 h-96 bg-gray-800 rounded-lg shadow-2xl border border-gray-700 flex flex-col overflow-hidden">
          <div className="bg-green-500 p-4 flex items-center space-x-3">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h3 className="text-white font-semibold">E-Ride Assistant</h3>
              <p className="text-green-100 text-xs">Online now</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                <div className={`flex items-start space-x-2 max-w-xs ${m.sender === 'bot' ? '' : 'flex-row-reverse space-x-reverse'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    m.sender === 'bot' ? 'bg-green-500' : 'bg-blue-500'
                  }`}>
                    {m.sender === 'bot' ? (
                      <Bot className="w-3 h-3 text-white" />
                    ) : (
                      <User className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <div
                    className={`px-3 py-2 rounded-lg text-sm ${
                      m.sender === 'bot'
                        ? 'bg-gray-700 text-white'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Say something..."
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 border border-gray-600"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;
