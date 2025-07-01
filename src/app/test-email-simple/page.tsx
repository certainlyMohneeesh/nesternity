'use client';

import { useState } from 'react';

export default function TestEmailPage() {
  const [email, setEmail] = useState('test@example.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const testEmail = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-email-resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(`✅ ${data.message}`);
      } else {
        setResult(`❌ ${data.error || 'Test failed'}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Email Test</h1>
      <div className="space-y-4">
        <div className="p-4 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Resend Configuration</h2>
          <div className="text-sm space-y-1">
            <p>✅ API Key: Configured in server environment</p>
            <p>✅ From Email: noreply@cythical.cyth.me</p>
            <p>✅ Service: Resend Professional</p>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-1">Test Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter email to test"
          />
        </div>
        
        <button 
          onClick={testEmail}
          disabled={loading}
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Test Email'}
        </button>
        
        {result && (
          <div className={`p-3 rounded text-sm ${
            result.startsWith('✅') 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {result}
          </div>
        )}
        
        <div className="text-sm text-gray-600">
          <p><strong>What this tests:</strong></p>
          <ul className="list-disc pl-4 space-y-1">
            <li>Resend API connection</li>
            <li>Email template rendering</li>
            <li>Server-side email sending</li>
            <li>Error handling</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
