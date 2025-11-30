"use client";

import { Brain, FileText, CheckCircle2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

export function AIFeaturesGrid() {
    return (
        <section className="py-8 px-6 bg-gradient-to-r from-primary/5 to-emerald-500/5">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <Badge variant="secondary" className="mb-4">
                            <Sparkles className="h-3 w-3 mr-1 inline" />
                            AI-Powered
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Work smarter with
                            <span className="bg-gradient-to-r from-primary to-[#A459D1] bg-clip-text text-transparent"> AI assistance</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                            Let artificial intelligence handle the heavy lifting while you focus on what matters most
                        </p>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Card 1: Smart Planning */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <Card className="h-full relative overflow-hidden group border-border/40 bg-card/50 hover:border-border transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="p-8 h-full flex flex-col relative z-10">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                                    <Brain className="h-6 w-6 text-white" />
                                </div>

                                <h3 className="text-2xl font-bold mb-4">Smart Project Planning</h3>
                                <p className="text-muted-foreground mb-6">
                                    AI analyzes your project requirements and generates detailed plans, timelines, and task breakdowns automatically.
                                </p>

                                <div className="space-y-3 mt-auto">
                                    {[
                                        "Automatic task generation",
                                        "Intelligent timeline suggestions",
                                        "Resource allocation"
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-center gap-2"
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + (i * 0.1) }}
                                        >
                                            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                            <span className="text-sm font-medium">{item}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Card 2: Proposal Generator */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="h-full relative overflow-hidden group border-border/40 bg-card/50 hover:border-border transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <div className="p-8 h-full flex flex-col relative z-10">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                                    <FileText className="h-6 w-6 text-white" />
                                </div>

                                <h3 className="text-2xl font-bold mb-4">Proposal Generator</h3>
                                <p className="text-muted-foreground mb-6">
                                    Create professional proposals in minutes. AI writes compelling content tailored to your client's needs.
                                </p>

                                <div className="space-y-3 mt-auto">
                                    {[
                                        "Personalized content generation",
                                        "Smart budget estimation",
                                        "Industry-specific templates"
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-center gap-2"
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.3 + (i * 0.1) }}
                                        >
                                            <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                            <span className="text-sm font-medium">{item}</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
