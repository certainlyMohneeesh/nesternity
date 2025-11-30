import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/server-auth';
import { createNewsletterPrompt, NewsletterPromptInput } from '@/lib/ai/prompts';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
    try {
        const user = await getServerUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { topic, tone, sections, includeCallToAction } = await request.json();

        if (!topic) {
            return NextResponse.json(
                { error: 'Topic is required' },
                { status: 400 }
            );
        }

        // Create prompt for newsletter generation
        const promptInput: NewsletterPromptInput = {
            topic,
            tone: tone || 'professional',
            sections: sections || 3,
            includeCallToAction: includeCallToAction !== false
        };

        const messages = createNewsletterPrompt(promptInput);

        // Call OpenRouter API with Llama model
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://nesternity.cyth.app',
                'X-Title': 'Nesternity Newsletter Generator'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct:free',
                messages: messages.map(msg => ({
                    role: msg.role,
                    content: msg.content
                })),
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('OpenRouter API error:', error);
            return NextResponse.json(
                { error: 'Failed to generate newsletter content' },
                { status: 500 }
            );
        }

        const data = await response.json();
        const generatedContent = data.choices?.[0]?.message?.content;

        if (!generatedContent) {
            return NextResponse.json(
                { error: 'No content generated' },
                { status: 500 }
            );
        }

        // Parse JSON response from AI
        let newsletter;
        try {
            // Try to extract JSON from response (handle markdown code blocks if present)
            const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                newsletter = JSON.parse(jsonMatch[0]);
            } else {
                newsletter = JSON.parse(generatedContent);
            }
        } catch (parseError) {
            console.error('Failed to parse AI response:', parseError);
            console.log('Raw response:', generatedContent);
            return NextResponse.json(
                { error: 'Failed to parse generated content', raw: generatedContent },
                { status: 500 }
            );
        }

        return NextResponse.json({
            newsletter: {
                subject: newsletter.subject || 'Untitled Newsletter',
                preheader: newsletter.preheader || '',
                content: newsletter.content || '',
                htmlContent: newsletter.htmlContent || newsletter.content || ''
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Newsletter generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate newsletter' },
            { status: 500 }
        );
    }
}
