"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedGradientBorderProps {
    children: ReactNode;
    isAnimating: boolean;
    className?: string;
    borderRadius?: string;
}

export function AnimatedGradientBorder({
    children,
    isAnimating,
    className = "",
    borderRadius = "0.5rem",
}: AnimatedGradientBorderProps) {
    return (
        <div className={`relative ${className}`} style={{ borderRadius }}>
            {/* Animated gradient border (Underlay) */}
            {isAnimating && (
                <>
                    {/* Glow effect layer - sits behind and blurs out */}
                    <motion.div
                        className="absolute -inset-1 pointer-events-none opacity-75 blur-md"
                        style={{
                            borderRadius: `calc(${borderRadius} + 2px)`,
                            background: "linear-gradient(90deg, #5ea1ff, #5cdb7e, #ffdd57, #ff6b5b, #5ea1ff)",
                            backgroundSize: "400% 100%",
                            zIndex: -1,
                        }}
                        animate={{
                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                    {/* Main border layer - sits behind and provides sharp edge */}
                    <motion.div
                        className="absolute -inset-[2px] pointer-events-none"
                        style={{
                            borderRadius: `calc(${borderRadius} + 1px)`,
                            background: "linear-gradient(90deg, #5ea1ff, #5cdb7e, #ffdd57, #ff6b5b, #5ea1ff)",
                            backgroundSize: "400% 100%",
                            zIndex: -1,
                        }}
                        animate={{
                            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                    />
                </>
            )}

            {/* Content - sits on top with background to cover the center of the border */}
            <div className="relative z-10 bg-background rounded-[inherit]" style={{ borderRadius }}>
                {children}
            </div>
        </div>
    );
}
