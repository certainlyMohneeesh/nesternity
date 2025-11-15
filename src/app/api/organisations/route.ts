import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/organisations - List user's organisations
export async function GET(request: NextRequest) {
  const requestId = `orgs_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  console.log(`[Organisations API] ========== REQUEST START [${requestId}] ==========`);
  console.log(`[Organisations API] Timestamp: ${new Date().toISOString()}`);
  console.log(`[Organisations API] Method: GET`);
  console.log(`[Organisations API] URL: ${request.url}`);
  
  try {
    // Step 1: Check authorization header
    console.log(`[Organisations API] Step 1: Checking authorization header...`);
    const authHeader = request.headers.get('authorization');
    console.log(`[Organisations API] Auth header present: ${!!authHeader}`);
    console.log(`[Organisations API] Auth header value: ${authHeader ? authHeader.substring(0, 20) + '...' : 'null'}`);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.log(`[Organisations API] ❌ No valid authorization header`);
      console.log(`[Organisations API] Headers received:`, Object.fromEntries(request.headers.entries()));
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    // Step 2: Extract and verify token
    console.log(`[Organisations API] Step 2: Extracting token...`);
    const token = authHeader.split(' ')[1];
    console.log(`[Organisations API] Token length: ${token?.length || 0}`);
    console.log(`[Organisations API] Token preview: ${token ? token.substring(0, 20) + '...' : 'null'}`);
    
    // Step 3: Verify with Supabase
    console.log(`[Organisations API] Step 3: Verifying token with Supabase...`);
    const startAuth = Date.now();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    const authDuration = Date.now() - startAuth;
    console.log(`[Organisations API] Auth verification completed in: ${authDuration}ms`);

    if (authError) {
      console.log(`[Organisations API] ❌ Supabase auth error:`, {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });
      return NextResponse.json(
        { error: 'Unauthorized', details: authError.message },
        { status: 401 }
      );
    }

    if (!user) {
      console.log(`[Organisations API] ❌ No user returned from Supabase`);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`[Organisations API] ✅ User authenticated:`, {
      userId: user.id,
      email: user.email
    });

    console.log(`[Organisations API] ✅ User authenticated:`, {
      userId: user.id,
      email: user.email
    });

    // Step 4: Parse query parameters
    console.log(`[Organisations API] Step 4: Parsing query parameters...`);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'OWNER' or 'CLIENT' or null for all
    console.log(`[Organisations API] Filter type: ${type || 'all'}`);

    const where: any = {
      ownerId: user.id
    };

    if (type && (type === 'OWNER' || type === 'CLIENT')) {
      where.type = type;
    }

    // Step 5: Query database
    console.log(`[Organisations API] Step 5: Querying database...`);
    console.log(`[Organisations API] Query where:`, where);
    const startDb = Date.now();
    const organisations = await prisma.organisation.findMany({
      where,
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            status: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            projects: true
          }
        }
      },
      orderBy: [
        { type: 'asc' }, // OWNER first, then CLIENT
        { createdAt: 'desc' }
      ]
    });
    const dbDuration = Date.now() - startDb;
    console.log(`[Organisations API] Database query completed in: ${dbDuration}ms`);
    console.log(`[Organisations API] Found ${organisations.length} organisations`);

    console.log(`[Organisations API] ========== REQUEST COMPLETE [${requestId}] ==========`);
    console.log(`[Organisations API] Success: true`);
    console.log(`[Organisations API] Total Duration: ${Date.now() - parseInt(requestId.split('_')[1])}ms`);

    return NextResponse.json({
      organisations,
      count: organisations.length
    });
  } catch (error) {
    console.error(`[Organisations API] ❌ Unexpected error [${requestId}]:`, error);
    console.log(`[Organisations API] ========== REQUEST FAILED [${requestId}] ==========`);
    return NextResponse.json(
      { error: 'Failed to fetch organisations' },
      { status: 500 }
    );
  }
}

// POST /api/organisations - Create new organisation
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No valid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      budget,
      currency,
      status,
      type,
      notes,
      logoUrl,
      website,
      address,
      city,
      state,
      country,
      pincode
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check subscription limits
    const userOrgsCount = await prisma.organisation.count({
      where: { ownerId: user.id }
    });

    // Get user's subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: user.id }
    });

    // Define limits based on subscription
    const limits = {
      free: 2,
      pro: 10,
      enterprise: -1 // unlimited
    };

    const userLimit = subscription?.status === 'active' 
      ? (subscription.stripePriceId.includes('pro') ? limits.pro : limits.enterprise)
      : limits.free;

    if (userLimit !== -1 && userOrgsCount >= userLimit) {
      return NextResponse.json(
        { 
          error: 'Organisation limit reached',
          message: `You have reached the maximum number of organisations (${userLimit}). Please upgrade your plan.`,
          limit: userLimit,
          current: userOrgsCount
        },
        { status: 403 }
      );
    }

    // Create organisation
    const organisation = await prisma.organisation.create({
      data: {
        name,
        email,
        phone,
        budget: budget ? parseFloat(budget) : null,
        currency: currency || 'INR',
        status: status || 'ACTIVE',
        type: type || 'OWNER',
        notes,
        logoUrl,
        website,
        address,
        city,
        state,
        country: country || 'India',
        pincode,
        ownerId: user.id
      },
      include: {
        projects: true,
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    return NextResponse.json({
      organisation,
      message: 'Organisation created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Create organisation error:', error);
    return NextResponse.json(
      { error: 'Failed to create organisation' },
      { status: 500 }
    );
  }
}
