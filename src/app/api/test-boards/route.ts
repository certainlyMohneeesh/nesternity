import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Test endpoint to check if board models exist
export async function GET(request: NextRequest) {
  try {
    // Check if the board model exists
    console.log('Available models:', Object.keys(db).filter(key => !key.startsWith('$') && !key.startsWith('_')));
    
    // Try to access board model dynamically
    const boardModel = (db as any).board;
    
    if (!boardModel) {
      return NextResponse.json({ 
        error: 'Board model not found',
        availableModels: Object.keys(db).filter(key => !key.startsWith('$') && !key.startsWith('_'))
      }, { status: 500 });
    }

    // Test basic query
    const count = await boardModel.count();
    
    return NextResponse.json({ 
      message: 'Board model is working',
      boardCount: count,
      availableModels: Object.keys(db).filter(key => !key.startsWith('$') && !key.startsWith('_'))
    });
  } catch (error) {
    console.error('Test board model error:', error);
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
