"use client";

import {
    Database,
    Lock,
    Brain,
    FileText,
    Zap,
    Globe,
    Code2,
    CheckCircle2,
    MousePointer2,
    ShieldCheck
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function BentoGrid() {
    return (
        <>
            <div className="text-center mb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Everything you need to
                        <span className="bg-gradient-to-r from-primary to-[#A459D1] bg-clip-text text-transparent"> scale</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        A complete platform for modern professionals
                    </p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(180px,auto)]">

                {/* 1. Project Database (Large Card) */}
                <motion.div
                    className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="h-full relative overflow-hidden group border-border/40 bg-card/50 hover:border-border transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="p-8 h-full flex flex-col justify-between relative z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-4 text-emerald-500">
                                    <Database className="h-5 w-5" />
                                    <span className="font-mono text-sm uppercase tracking-wider">Project Database</span>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Full-Featured Workspace</h3>
                                <p className="text-muted-foreground max-w-md">
                                    Every project is a complete database. Track tasks, manage teams, and store assets in one secure, organized place.
                                </p>

                                <div className="mt-6 space-y-2">
                                    {['100% Organized', 'Built-in Task Tracking', 'Asset Management'].map((item, i) => (
                                        <motion.div
                                            key={item}
                                            className="flex items-center gap-2 text-sm text-muted-foreground"
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + (i * 0.1) }}
                                        >
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                            <span>{item}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Visual Representation */}
                            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 group-hover:opacity-30 transition-opacity hidden sm:block pointer-events-none">
                                <motion.div
                                    className="w-full h-full border-l border-t border-border/50 rounded-tl-3xl bg-background/50 p-4 grid grid-cols-2 gap-2 transform translate-y-8 translate-x-8"
                                    whileHover={{ translateY: 20, translateX: 20 }}
                                >
                                    {[...Array(6)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            className="h-24 rounded-lg border border-border/50 bg-muted/20"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            whileInView={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.3 + (i * 0.05) }}
                                        />
                                    ))}
                                </motion.div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* 2. Authentication (Medium Card) */}
                <motion.div
                    className="col-span-1 md:col-span-1 row-span-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <Card className="h-full relative overflow-hidden group border-border/40 bg-card/50 hover:border-border transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="p-6 h-full flex flex-col relative z-10">
                            <div className="flex items-center gap-2 mb-4 text-yellow-500">
                                <Lock className="h-5 w-5" />
                                <span className="font-mono text-sm uppercase tracking-wider">Auth</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2">Client Portals</h3>
                            <p className="text-sm text-muted-foreground mb-8">
                                Secure access for clients with magic links and role-based permissions.
                            </p>

                            {/* Visual */}
                            <div className="flex-1 flex items-center justify-center relative">
                                <div className="relative w-32 h-32">
                                    <motion.div
                                        className="absolute inset-0 border-2 border-dashed border-border rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <ShieldCheck className="h-12 w-12 text-yellow-500/50 group-hover:text-yellow-500 transition-colors duration-500" />
                                    </div>
                                    {/* Orbiting dots */}
                                    <motion.div
                                        className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 bg-yellow-500 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                                        animate={{ rotate: 360 }}
                                        style={{ originY: "64px", originX: "0px" }} // Radius of 64px (half of w-32)
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* 3. AI Features (Medium Card) */}
                <motion.div
                    className="col-span-1 md:col-span-1 row-span-2"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <Card className="h-full relative overflow-hidden group border-border/40 bg-card/50 hover:border-border transition-colors">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="p-6 h-full flex flex-col relative z-10">
                            <div className="flex items-center gap-2 mb-4 text-purple-500">
                                <Brain className="h-5 w-5" />
                                <span className="font-mono text-sm uppercase tracking-wider">AI Core</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2">Smart Planning</h3>
                            <p className="text-sm text-muted-foreground mb-8">
                                Generate proposals and project plans instantly with AI assistance.
                            </p>

                            {/* Visual */}
                            <div className="flex-1 flex items-center justify-center">
                                <div className="relative">
                                    <motion.div
                                        className="absolute -inset-4 bg-purple-500/20 blur-xl rounded-full"
                                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                                        transition={{ duration: 4, repeat: Infinity }}
                                    />
                                    <Brain className="h-16 w-16 text-purple-500/50 group-hover:text-purple-500 transition-colors duration-500 relative z-10" />
                                    <motion.div
                                        className="absolute top-0 right-0 w-2 h-2 bg-purple-400 rounded-full"
                                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* 4. Documents (Small Card) */}
                <motion.div
                    className="col-span-1"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <Card className="h-full relative overflow-hidden group border-border/40 bg-card/50 hover:border-border transition-colors min-h-[200px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="p-6 h-full flex flex-col justify-between relative z-10">
                            <div className="flex items-center gap-2 text-blue-500">
                                <FileText className="h-5 w-5" />
                                <span className="font-mono text-sm uppercase tracking-wider">Docs</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Invoicing</h3>
                                <p className="text-xs text-muted-foreground mt-1">Professional PDF generation</p>
                            </div>
                            {/* Hover Effect: Slide up docs */}
                            <div className="absolute right-4 bottom-4 flex gap-1 opacity-50 group-hover:opacity-100 transition-all duration-300">
                                <motion.div
                                    className="w-6 h-8 border border-blue-500/30 bg-blue-500/10 rounded-sm"
                                    whileHover={{ y: -5 }}
                                />
                                <motion.div
                                    className="w-6 h-8 border border-blue-500/30 bg-blue-500/10 rounded-sm translate-y-1"
                                    whileHover={{ y: -5 }}
                                    transition={{ delay: 0.05 }}
                                />
                                <motion.div
                                    className="w-6 h-8 border border-blue-500/30 bg-blue-500/10 rounded-sm translate-y-2"
                                    whileHover={{ y: -5 }}
                                    transition={{ delay: 0.1 }}
                                />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* 5. Realtime (Small Card) */}
                <motion.div
                    className="col-span-1"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <Card className="h-full relative overflow-hidden group border-border/40 bg-card/50 hover:border-border transition-colors min-h-[200px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="p-6 h-full flex flex-col justify-between relative z-10">
                            <div className="flex items-center gap-2 text-orange-500">
                                <Zap className="h-5 w-5" />
                                <span className="font-mono text-sm uppercase tracking-wider">Realtime</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Collaboration</h3>
                                <p className="text-xs text-muted-foreground mt-1">Multiplayer sync & presence</p>
                            </div>
                            {/* Visual: Cursor */}
                            <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <motion.div
                                    initial={{ x: 10, y: 10 }}
                                    whileHover={{ x: 0, y: 0 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <MousePointer2 className="h-6 w-6 text-orange-500 fill-orange-500/20" />
                                </motion.div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* 6. Multi-Currency (Small Card) */}
                <motion.div
                    className="col-span-1"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <Card className="h-full relative overflow-hidden group border-border/40 bg-card/50 hover:border-border transition-colors min-h-[200px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="p-6 h-full flex flex-col justify-between relative z-10">
                            <div className="flex items-center gap-2 text-cyan-500">
                                <Globe className="h-5 w-5" />
                                <span className="font-mono text-sm uppercase tracking-wider">Global</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Multi-Currency</h3>
                                <p className="text-xs text-muted-foreground mt-1">15+ currencies supported</p>
                            </div>
                            <div className="absolute right-4 bottom-4">
                                <motion.div
                                    whileHover={{ rotate: 180, scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Globe className="h-12 w-12 text-cyan-500/10 group-hover:text-cyan-500/20" />
                                </motion.div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

                {/* 7. API (Small Card) */}
                <motion.div
                    className="col-span-1"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                >
                    <Card className="h-full relative overflow-hidden group border-border/40 bg-card/50 hover:border-border transition-colors min-h-[200px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="p-6 h-full flex flex-col justify-between relative z-10">
                            <div className="flex items-center gap-2 text-pink-500">
                                <Code2 className="h-5 w-5" />
                                <span className="font-mono text-sm uppercase tracking-wider">API</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Extensible</h3>
                                <p className="text-xs text-muted-foreground mt-1">Built for developers</p>
                            </div>
                            <div className="absolute right-0 bottom-4 w-full flex justify-end px-4 opacity-50 group-hover:opacity-100 transition-opacity">
                                <motion.div
                                    className="font-mono text-[10px] text-pink-500/60 bg-pink-500/5 p-2 rounded border border-pink-500/10"
                                    whileHover={{ scale: 1.05 }}
                                >
                                    GET /v1/projects
                                </motion.div>
                            </div>
                        </div>
                    </Card>
                </motion.div>

            </div>
        </>
    );
}
