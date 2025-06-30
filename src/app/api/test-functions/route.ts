import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const functions = [
    'get_team_invites_secure',
    'create_team_invite_secure', 
    'cancel_team_invite_secure',
    'add_team_member',
    'get_user_teams_ultimate'
  ];
  
  const results: {[key: string]: { exists: boolean, error?: string }} = {};
  
  for (const funcName of functions) {
    try {
      // Try to call with invalid params to see if function exists
      const { error } = await supabase.rpc(funcName, {});
      
      // If we get a 42883 error, function doesn't exist
      if (error?.code === '42883') {
        results[funcName] = { exists: false, error: 'Function does not exist' };
      } else {
        results[funcName] = { exists: true };
      }
    } catch (e) {
      results[funcName] = { exists: false, error: String(e) };
    }
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    functionTests: results,
    summary: {
      total: functions.length,
      existing: Object.values(results).filter(r => r.exists).length,
      missing: Object.values(results).filter(r => !r.exists).length
    }
  });
}
