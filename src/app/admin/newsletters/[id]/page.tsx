'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, Sparkles, Eye, Loader2 } from 'lucide-react';
import { getSessionToken } from '@/lib/supabase/client-session';
import { toast } from 'sonner';

export default function NewsletterEditorPage() {
    const router = useRouter();
    const params = useParams();
    const newsletterId = params.id as string;
    const isNew = newsletterId === 'new';

    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [htmlContent, setHtmlContent] = useState('');
    const [status, setStatus] = useState<'draft' | 'sent'>('draft');
    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);
    const [subscriberCount, setSubscriberCount] = useState(0);

    // AI Generation state
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiTone, setAiTone] = useState<'professional' | 'casual' | 'friendly'>('professional');
    const [aiSections, setAiSections] = useState(3);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (!isNew) {
            fetchNewsletter();
        }
        fetchSubscriberCount();
    }, []);

    async function fetchNewsletter() {
        try {
            const token = await getSessionToken();
            const response = await fetch(`/api/admin/newsletters/${newsletterId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch newsletter');

            const data = await response.json();
            const newsletter = data.newsletter;

            setSubject(newsletter.subject);
            setContent(newsletter.content);
            setHtmlContent(newsletter.htmlContent || '');
            setStatus(newsletter.status);
        } catch (error) {
            console.error('Error fetching newsletter:', error);
            toast.error('Failed to load newsletter');
            router.push('/admin/newsletters');
        } finally {
            setLoading(false);
        }
    }

    async function fetchSubscriberCount() {
        try {
            const token = await getSessionToken();
            const response = await fetch('/api/admin/subscribers?status=active', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSubscriberCount(data.stats?.active || 0);
            }
        } catch (error) {
            console.error('Error fetching subscriber count:', error);
        }
    }

    async function handleSave() {
        if (!subject || !content) {
            toast.error('Subject and content are required');
            return;
        }

        try {
            setSaving(true);
            const token = await getSessionToken();

            const url = isNew
                ? '/api/admin/newsletters'
                : `/api/admin/newsletters/${newsletterId}`;

            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subject,
                    content,
                    htmlContent: htmlContent || content
                })
            });

            if (!response.ok) throw new Error('Failed to save newsletter');

            const data = await response.json();
            toast.success('Newsletter saved successfully');

            if (isNew) {
                router.push(`/admin/newsletters/${data.newsletter.id}`);
            }
        } catch (error) {
            console.error('Error saving newsletter:', error);
            toast.error('Failed to save newsletter');
        } finally {
            setSaving(false);
        }
    }

    async function handleSend() {
        if (!subject || !content) {
            toast.error('Subject and content are required');
            return;
        }

        if (subscriberCount === 0) {
            toast.error('No active subscribers to send to');
            return;
        }

        const action = status === 'sent' ? 'Resend' : 'Send';
        const confirmed = confirm(
            `${action} this newsletter to ${subscriberCount} subscriber${subscriberCount !== 1 ? 's' : ''}?`
        );

        if (!confirmed) return;

        try {
            setSending(true);
            const token = await getSessionToken();

            // Save first if needed
            if (isNew) {
                await handleSave();
                return;
            }

            const response = await fetch(`/api/admin/newsletters/${newsletterId}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to send newsletter');

            const data = await response.json();

            if (data.stats.successful === 0 && data.stats.failed > 0) {
                const errorMsg = data.errors?.[0]?.message || 'Unknown error occurred';
                toast.error(`Failed to send: ${errorMsg}`);
                return;
            }

            toast.success(`Newsletter ${status === 'sent' ? 'resent' : 'sent'} to ${data.stats.successful} subscribers!`);
            router.push('/admin/newsletters');
        } catch (error) {
            console.error('Error sending newsletter:', error);
            toast.error('Failed to send newsletter');
        } finally {
            setSending(false);
        }
    }

    async function handleGenerateWithAI() {
        if (!aiTopic.trim()) {
            toast.error('Please enter a topic');
            return;
        }

        try {
            setGenerating(true);
            const token = await getSessionToken();

            const response = await fetch('/api/admin/newsletters/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    topic: aiTopic,
                    tone: aiTone,
                    sections: aiSections,
                    includeCallToAction: true
                })
            });

            if (!response.ok) throw new Error('Failed to generate newsletter');

            const data = await response.json();
            const newsletter = data.newsletter;

            setSubject(newsletter.subject);
            setContent(newsletter.content);
            setHtmlContent(newsletter.htmlContent || newsletter.content);
            setAiDialogOpen(false);

            toast.success('Newsletter generated! Review and edit as needed.');
        } catch (error) {
            console.error('Error generating newsletter:', error);
            toast.error('Failed to generate newsletter');
        } finally {
            setGenerating(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/admin/newsletters')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {isNew ? 'Create Newsletter' : 'Edit Newsletter'}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {subscriberCount} active subscriber{subscriberCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {status === 'sent' && (
                        <>
                            <Badge variant="default">Sent</Badge>
                            <Button
                                onClick={handleSend}
                                disabled={sending}
                                variant="outline"
                                className="ml-2"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Resending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Resend
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                    {status === 'draft' && (
                        <>
                            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate with AI
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Generate Newsletter with AI</DialogTitle>
                                        <DialogDescription>
                                            Describe what you want the newsletter to be about
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                        <div>
                                            <Label>Topic</Label>
                                            <Textarea
                                                placeholder="e.g., New features in project management, productivity tips for remote teams..."
                                                value={aiTopic}
                                                onChange={(e) => setAiTopic(e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                        <div>
                                            <Label>Tone</Label>
                                            <Select value={aiTone} onValueChange={(v: any) => setAiTone(v)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="professional">Professional</SelectItem>
                                                    <SelectItem value="casual">Casual</SelectItem>
                                                    <SelectItem value="friendly">Friendly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Number of Sections</Label>
                                            <Select value={aiSections.toString()} onValueChange={(v) => setAiSections(Number(v))}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="2">2 sections</SelectItem>
                                                    <SelectItem value="3">3 sections</SelectItem>
                                                    <SelectItem value="4">4 sections</SelectItem>
                                                    <SelectItem value="5">5 sections</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Button
                                            className="w-full"
                                            onClick={handleGenerateWithAI}
                                            disabled={generating}
                                        >
                                            {generating ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Generate Newsletter
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                            <Button
                                variant="outline"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Draft
                                    </>
                                )}
                            </Button>
                            <Button
                                onClick={handleSend}
                                disabled={sending}
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Newsletter
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Newsletter Content</CardTitle>
                        <CardDescription>
                            Write or generate your newsletter content
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="subject">Subject Line</Label>
                            <Input
                                id="subject"
                                placeholder="Enter subject line..."
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                disabled={status === 'sent'}
                                maxLength={100}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {subject.length}/100 characters
                            </p>
                        </div>

                        <div>
                            <Label htmlFor="content">Content</Label>
                            <Textarea
                                id="content"
                                placeholder="Enter newsletter content..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                disabled={status === 'sent'}
                                rows={15}
                                className="font-mono text-sm"
                            />
                        </div>

                        <div>
                            <Label htmlFor="htmlContent">HTML Content (Optional)</Label>
                            <Textarea
                                id="htmlContent"
                                placeholder="Enter HTML version..."
                                value={htmlContent}
                                onChange={(e) => setHtmlContent(e.target.value)}
                                disabled={status === 'sent'}
                                rows={10}
                                className="font-mono text-xs"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Preview</CardTitle>
                        <CardDescription>
                            How your newsletter will look
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-lg p-6 bg-white dark:bg-gray-950 min-h-[600px]">
                            <h2 className="text-2xl font-bold mb-4">{subject || 'Subject Line'}</h2>
                            {htmlContent ? (
                                <div
                                    className="prose prose-sm max-w-none"
                                    dangerouslySetInnerHTML={{ __html: htmlContent }}
                                />
                            ) : (
                                <div className="whitespace-pre-wrap text-sm">
                                    {content || 'Newsletter content will appear here...'}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
