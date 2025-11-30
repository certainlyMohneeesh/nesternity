"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
    {
        name: "Alex Rivera",
        handle: "@arivera_dev",
        text: "Nesternity is the only tool that actually understands how freelancers work. The proposal generator is pure magic.",
        initials: "AR"
    },
    {
        name: "Sarah Chen",
        handle: "@sarahcodes",
        text: "Finally, I can manage my clients without feeling like I'm fighting the software. It's calm, fast, and beautiful.",
        initials: "SC"
    },
    {
        name: "Marcus Johnson",
        handle: "@mj_design",
        text: "The invoicing feature alone saved me 10 hours this month. Worth every penny for the peace of mind.",
        initials: "MJ"
    },
    {
        name: "Emily Davis",
        handle: "@emily_writes",
        text: "I used to juggle Trello, Notion, and Excel. Nesternity replaced them all. My clients love the portal too!",
        initials: "ED"
    },
    {
        name: "David Kim",
        handle: "@dkim_tech",
        text: "The AI budget estimation is scarily accurate. It helped me close 3 deals last week with confidence.",
        initials: "DK"
    },
    {
        name: "Jessica Lee",
        handle: "@jess_creative",
        text: "Simple, elegant, and powerful. It stays out of your way but gives you superpowers when you need them.",
        initials: "JL"
    },
    {
        name: "Tom Harris",
        handle: "@tom_h_dev",
        text: "The best project management tool I've used in 5 years of freelancing. Highly recommended.",
        initials: "TH"
    },
    {
        name: "Rachel Green",
        handle: "@rachel_g",
        text: "Love the dark mode and the overall aesthetic. It makes working on admin tasks actually enjoyable.",
        initials: "RG"
    }
];

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => (
    <Card className="w-[350px] flex-shrink-0 bg-background/50 backdrop-blur-sm border-primary/10 mx-4">
        <CardContent className="p-6">
            <p className="text-muted-foreground mb-4 leading-relaxed">"{testimonial.text}"</p>
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">{testimonial.initials}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.handle}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);

export function TestimonialsMarquee() {
    return (
        <div className="relative w-full overflow-hidden py-12 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
            {/* Gradient Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />

            <div className="flex flex-col gap-8">
                {/* Row 1 - Left to Right */}
                <div className="flex overflow-hidden">
                    <motion.div
                        className="flex"
                        animate={{ x: [0, -1000] }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 50,
                                ease: "linear",
                            },
                        }}
                    >
                        {[...testimonials, ...testimonials].map((t, i) => (
                            <TestimonialCard key={`row1-${i}`} testimonial={t} />
                        ))}
                    </motion.div>
                </div>

                {/* Row 2 - Right to Left */}
                <div className="flex overflow-hidden">
                    <motion.div
                        className="flex"
                        animate={{ x: [-1000, 0] }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: "loop",
                                duration: 60,
                                ease: "linear",
                            },
                        }}
                    >
                        {[...testimonials, ...testimonials].reverse().map((t, i) => (
                            <TestimonialCard key={`row2-${i}`} testimonial={t} />
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
