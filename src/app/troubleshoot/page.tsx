'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TroubleshootPage() {
  const [results, setResults] = useState<{[key: string]: any}>({});
  const [testing, setTesting] = useState(false);

  const runTests = async () => {
    setTesting(true);
    const testResults: {[key: string]: any} = {};

    // Test 1: Check if user lookup function works
    try {
      const { data, error } = await supabase.rpc('get_user_by_email_secure', {
        p_email: '2203chemicalmyth@gmail.com'
      });
      testResults.userLookup = { success: !error, data, error: error?.message };
    } catch (err) {
      testResults.userLookup = { success: false, error: String(err) };
    }

    // Test 2: Check if invite details function works
    try {
      const { data, error } = await supabase.rpc('get_invite_details_secure', {
        p_token: '7dd041b0ab12693fbfa4f3a7e3ae5e727eb5ae9ebe7cb0da9067d99f87083fa9'
      });
      testResults.inviteDetails = { success: !error, data, error: error?.message };
    } catch (err) {
      testResults.inviteDetails = { success: false, error: String(err) };
    }

    // Test 3: Test email sending
    try {
      const response = await fetch('/api/test-email-resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '987xwarrior@gmail.com' })
      });
      const data = await response.json();
      testResults.emailTest = data;
    } catch (err) {
      testResults.emailTest = { success: false, error: String(err) };
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔧 Invite System Troubleshoot</h1>
      
      <div className="mb-6">
        <button 
          onClick={runTests}
          disabled={testing}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {testing ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {Object.keys(results).length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Test Results:</h2>
          
          {Object.entries(results).map(([test, result]) => (
            <div key={test} className="border rounded p-4">
              <h3 className="font-semibold flex items-center gap-2">
                {result.success ? '✅' : '❌'} {test}
              </h3>
              <pre className="text-sm bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800">If tests fail:</h3>
        <ol className="list-decimal pl-5 text-sm text-yellow-700 space-y-1">
          <li>Make sure you ran the SQL script: <code>sql/fix_complete_invite_system.sql</code></li>
          <li>Check your Resend API key is configured</li>
          <li>Verify your Supabase credentials</li>
          <li>Check the browser console for detailed error messages</li>
        </ol>
      </div>
    </div>
  );
}
