import { NextRequest, NextResponse } from 'next/server';
import { checkFinancialAccess } from '@/lib/access-control';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    try {
        // Get auth token from request headers
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json({
                hasAccess: false,
                reason: 'Not authenticated'
            }, { status: 401 });
        }

        // Verify user with token
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({
                hasAccess: false,
                reason: 'Unauthorized'
            }, { status: 401 });
        }

        // Get organisationId from query params
        const { searchParams } = new URL(request.url);
        const organisationId = searchParams.get('organisationId');

        if (!organisationId) {
            return NextResponse.json({
                hasAccess: false,
                reason: 'Organisation ID required'
            }, { status: 400 });
        }

        // Check financial access
        const accessCheck = await checkFinancialAccess(user.id, organisationId);

        return NextResponse.json(accessCheck);

    } catch (error) {
        console.error('Financial access check error:', error);
        return NextResponse.json({
            hasAccess: false,
            reason: 'Internal server error'
        }, { status: 500 });
    }
}
