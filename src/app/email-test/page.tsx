import { EMAIL_PROVIDER, EMAIL_CONFIG } from '@/lib/email-config';

export default function EmailTestPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Email System Status</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Current Provider</h2>
          <div className="flex items-center gap-3">
            <span className="text-lg">{EMAIL_CONFIG[EMAIL_PROVIDER].name}</span>
            {EMAIL_CONFIG[EMAIL_PROVIDER].free && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                FREE
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {EMAIL_CONFIG[EMAIL_PROVIDER].description}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Cost: {EMAIL_CONFIG[EMAIL_PROVIDER].cost}
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">How to Switch</h2>
          <div className="text-sm space-y-2">
            <p>Edit <code className="bg-gray-100 px-1 rounded">/src/lib/email-config.ts</code> and change the <code className="bg-gray-100 px-1 rounded">EMAIL_PROVIDER</code> value:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><code className="bg-gray-100 px-1 rounded">'supabase-auth'</code> - FREE Supabase emails</li>
              <li><code className="bg-gray-100 px-1 rounded">'resend'</code> - Professional Resend service</li> 
              <li><code className="bg-gray-100 px-1 rounded">'hybrid'</code> - Try Supabase first, fallback to Resend</li>
            </ul>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <h2 className="font-semibold mb-2">Current Configuration</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ EMAIL_PROVIDER, config: EMAIL_CONFIG[EMAIL_PROVIDER] }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
