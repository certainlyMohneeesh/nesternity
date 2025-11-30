'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, Edit, Trash2, FileText } from 'lucide-react';
import { getSessionToken } from '@/lib/supabase/client-session';
import { toast } from 'sonner';

interface Newsletter {
    id: string;
    subject: string;
    content: string;
    status: string;
    sentAt: string | null;
    recipientCount: number | null;
    createdAt: string;
    creator: {
        displayName: string | null;
        email: string;
    };
}

export default function NewslettersPage() {
    const router = useRouter();
    const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'draft' | 'sent'>('all');

    useEffect(() => {
        fetchNewsletters();
    }, [filter]);

    async function fetchNewsletters() {
        try {
            setLoading(true);
            const token = await getSessionToken();

            const url = filter === 'all'
                ? '/api/admin/newsletters'
                : `/api/admin/newsletters?status=${filter}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch newsletters');

            const data = await response.json();
            setNewsletters(data.newsletters);
        } catch (error) {
            console.error('Error fetching newsletters:', error);
            toast.error('Failed to load newsletters');
        } finally {
            setLoading(false);
        }
    }

    async function deleteNewsletter(id: string) {
        if (!confirm('Are you sure you want to delete this newsletter?')) return;

        try {
            const token = await getSessionToken();
            const response = await fetch(`/api/admin/newsletters/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to delete newsletter');

            toast.success('Newsletter deleted successfully');
            fetchNewsletters();
        } catch (error) {
            console.error('Error deleting newsletter:', error);
            toast.error('Failed to delete newsletter');
        }
    }

    async function resendNewsletter(id: string) {
        if (!confirm('Are you sure you want to resend this newsletter?')) return;

        try {
            const token = await getSessionToken();
            const response = await fetch(`/api/admin/newsletters/${id}/send`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to resend newsletter');
            }

            if (data.stats.successful === 0 && data.stats.failed > 0) {
                const errorMsg = data.errors?.[0]?.message || 'Unknown error occurred';
                toast.error(`Failed to send: ${errorMsg}`);
                return;
            }

            toast.success('Newsletter resent successfully');
            fetchNewsletters();
        } catch (error: any) {
            console.error('Error resending newsletter:', error);
            toast.error(error.message || 'Failed to resend newsletter');
        }
    }

    const filteredNewsletters = newsletters;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Newsletters</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage and send newsletters to your subscribers
                    </p>
                </div>
                <Button onClick={() => router.push('/admin/newsletters/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Newsletter
                </Button>
            </div>

            <div className="flex gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                >
                    All
                </Button>
                <Button
                    variant={filter === 'draft' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('draft')}
                >
                    Drafts
                </Button>
                <Button
                    variant={filter === 'sent' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('sent')}
                >
                    Sent
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Newsletters</CardTitle>
                    <CardDescription>
                        {filteredNewsletters.length} newsletter{filteredNewsletters.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : filteredNewsletters.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No newsletters yet</p>
                            <Button
                                className="mt-4"
                                onClick={() => router.push('/admin/newsletters/new')}
                            >
                                Create Your First Newsletter
                            </Button>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Recipients</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Sent</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredNewsletters.map((newsletter) => (
                                    <TableRow key={newsletter.id}>
                                        <TableCell className="font-medium">
                                            {newsletter.subject}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={newsletter.status === 'sent' ? 'default' : 'secondary'}>
                                                {newsletter.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {newsletter.recipientCount ?? '-'}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(newsletter.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {newsletter.sentAt
                                                ? new Date(newsletter.sentAt).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                {newsletter.status === 'draft' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.push(`/admin/newsletters/${newsletter.id}`)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {newsletter.status === 'draft' && (
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => deleteNewsletter(newsletter.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {newsletter.status === 'sent' && (
                                                    <>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => resendNewsletter(newsletter.id)}
                                                        >
                                                            <Send className="w-4 h-4 mr-2" />
                                                            Resend
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => router.push(`/admin/newsletters/${newsletter.id}`)}
                                                        >
                                                            View
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
