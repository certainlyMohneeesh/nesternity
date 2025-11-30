"use client";

import { useEffect, useState } from "react";
import { getSessionToken } from "@/lib/supabase/client-session";

interface AccessCheck {
    hasAccess: boolean;
    reason?: string | null;
}

/**
 * Client-side hook to check if user has financial access
 * (Only organisation owners can access proposals, invoices, contracts)
 */
export function useFinancialAccess(organisationId: string) {
    const [accessCheck, setAccessCheck] = useState<AccessCheck>({ hasAccess: true });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkAccess() {
            try {
                const token = await getSessionToken();
                if (!token) {
                    setAccessCheck({ hasAccess: false, reason: "Not authenticated" });
                    setLoading(false);
                    return;
                }

                const response = await fetch(`/api/access/financial?organisationId=${organisationId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                const data = await response.json();
                setAccessCheck(data);
            } catch (error) {
                console.error('Error checking financial access:', error);
                setAccessCheck({ hasAccess: false, reason: "Error checking access" });
            } finally {
                setLoading(false);
            }
        }

        checkAccess();
    }, [organisationId]);

    return { ...accessCheck, loading };
}
