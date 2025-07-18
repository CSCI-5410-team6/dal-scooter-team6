import React, { useState } from 'react';
import { useAuthContext } from '../../contextStore/AuthContext';
import { LexRuntimeV2Client, RecognizeTextCommand } from '@aws-sdk/client-lex-runtime-v2';
import { lexConfig } from '../../config/amplifyConfig';
import { getCredentials } from '../../utils/credentials';

const lexClient = new LexRuntimeV2Client({
  region: lexConfig.region,
  credentials: getCredentials
});

const BookingForm = () => {
  const { cognitoUser } = useAuthContext();
  const [bookingId, setBookingId] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRetrieve = async (e:any) => {
    e.preventDefault();
    if (!bookingId) return;

    setLoading(true);
    const userId = cognitoUser?.username || 'guest';
    const userType = cognitoUser?.attributes?.['custom:userType'] || 'guest';

    const command = new RecognizeTextCommand({
      botId: lexConfig.botId,
      botAliasId: lexConfig.botAliasId,
      localeId: lexConfig.localeId,
      sessionId: userId,
      text: `Retrieve booking ${bookingId}`,
      sessionState: {
        sessionAttributes: { userId, userType },
        intent: {
          name: 'BookingIntent',
          slots: {
            BookingAction: {
              value: { interpretedValue: 'retrieve' }
            },
            BookingId: {
              value: { interpretedValue: bookingId }
            }
          }
        }
      }
    });

    const result = await lexClient.send(command);

    if (result.sessionState?.intent?.state === 'Fulfilled') {
      setResponse(result.messages?.[0]?.content || 'Got it.');
    } else {
      setResponse('Could not get booking.');
    }

    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">Retrieve Booking</h2>
      <form onSubmit={handleRetrieve} className="space-y-4">
        <input
          className="w-full p-2 border border-gray-300 rounded"
          placeholder="Booking ID"
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded ${loading ? 'bg-gray-400' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
        >
          {loading ? '...' : 'Retrieve'}
        </button>
      </form>
      {response && (
        <div className="mt-4 p-3 bg-green-50 text-green-800 rounded">{response}</div>
      )}
    </div>
  );
};

export default BookingForm;
