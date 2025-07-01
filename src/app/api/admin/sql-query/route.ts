import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Only allow safe read-only queries
const ALLOWED_QUERIES = [
  /^SELECT\s+/i,
  /^SHOW\s+/i,
  /^DESCRIBE\s+/i,
  /^EXPLAIN\s+/i
];

const FORBIDDEN_KEYWORDS = [
  /\bINSERT\b/i,
  /\bUPDATE\b/i,
  /\bDELETE\b/i,
  /\bDROP\b/i,
  /\bCREATE\b/i,
  /\bALTER\b/i,
  /\bTRUNCATE\b/i
];

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Query is required and must be a string'
      }, { status: 400 });
    }

    const trimmedQuery = query.trim();

    // Check if query is allowed
    const isAllowed = ALLOWED_QUERIES.some(pattern => pattern.test(trimmedQuery));
    const hasForbiddenKeywords = FORBIDDEN_KEYWORDS.some(pattern => pattern.test(trimmedQuery));

    if (!isAllowed || hasForbiddenKeywords) {
      return NextResponse.json({
        success: false,
        error: 'Only read-only queries (SELECT, SHOW, DESCRIBE, EXPLAIN) are allowed'
      }, { status: 403 });
    }

    // Execute the query using Prisma's raw query
    const result = await db.$queryRawUnsafe(trimmedQuery);

    return NextResponse.json({
      success: true,
      query: trimmedQuery,
      result,
      rowCount: Array.isArray(result) ? result.length : 1,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Query execution failed',
      details: {
        message: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
