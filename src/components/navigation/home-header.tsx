"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createClient } from '@/lib/supabase/client-session';
import { useEffect, useState } from "react";
import { UserNav } from "./user-nav";
import { Github } from "lucide-react";

export function HomeHeader() {
    const [isSignedIn, setIsSignedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();
            setIsSignedIn(!!session);
            setIsLoading(false);
        };
        checkAuth();
    }, []);

    return (
        <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img src="/nesternity_l.png" alt="Nesternity" className="w-8 h-8" />
                    <span className="text-xl font-semibold">Nesternity</span>
                </Link>

                {/* Navigation Links */}
                <div className="hidden md:flex items-center gap-6">
                    <Link
                        href="/docs"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Docs
                    </Link>
                    <Link
                        href="https://github.com/certainlyMohneeesh/nesternity"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                    >
                        <Github className="h-4 w-4" />
                        <span className="hidden lg:inline">Star the Repo</span>
                    </Link>
                </div>

                {/* Right Side - Auth Dependent */}
                <div className="flex items-center gap-3">
                    {!isLoading && (
                        <>
                            {isSignedIn ? (
                                <>
                                    <Link href="/dashboard">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="gap-2 text-sm px-3 py-4"
                                        >
                                            Dashboard
                                        </Button>
                                    </Link>
                                    <UserNav />
                                </>
                            ) : (
                                <>
                                    <Link href="/auth/login">
                                        <Button variant="ghost" size="sm">
                                            Sign In
                                        </Button>
                                    </Link>
                                    <Link href="/dashboard">
                                        <Button
                                            size="sm"
                                            className="gap-2 text-sm px-3 py-4"
                                        >
                                            Start your project
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
