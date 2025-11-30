'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Download, Users } from 'lucide-react';
import { getSessionToken } from '@/lib/supabase/client-session';
import { toast } from 'sonner';

interface Subscriber {
    id: string;
    email: string;
    status: string;
    subscribedAt: string;
    unsubscribedAt: string | null;
}

interface Stats {
    total: number;
    active: number;
    unsubscribed: number;
}

export default function SubscribersPage() {
    const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, active: 0, unsubscribed: 0 });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'unsubscribed'>('all');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        fetchSubscribers();
    }, [filter]);

    async function fetchSubscribers() {
        try {
            setLoading(true);
            const token = await getSessionToken();

            const url = filter === 'all'
                ? '/api/admin/subscribers'
                : `/api/admin/subscribers?status=${filter}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch subscribers`);
            }

            const data = await response.json();
            setSubscribers(data.subscribers);
            setStats(data.stats);
        } catch (error: any) {
            console.error('Error fetching subscribers:', error);
            toast.error(error.message || 'Failed to load subscribers');
        } finally {
            setLoading(false);
        }
    }

    async function handleAddSubscriber() {
        if (!newEmail.trim()) {
            toast.error('Please enter an email address');
            return;
        }

        try {
            setAdding(true);
            const token = await getSessionToken();

            const response = await fetch('/api/admin/subscribers', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: newEmail })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to add subscriber');
            }

            toast.success('Subscriber added successfully');
            setNewEmail('');
            setAddDialogOpen(false);
            fetchSubscribers();
        } catch (error: any) {
            console.error('Error adding subscriber:', error);
            toast.error(error.message || 'Failed to add subscriber');
        } finally {
            setAdding(false);
        }
    }

    async function handleRemoveSubscriber(email: string) {
        if (!confirm(`Remove ${email} from subscribers?`)) return;

        try {
            const token = await getSessionToken();
            const response = await fetch(`/api/admin/subscribers?email=${encodeURIComponent(email)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to remove subscriber');

            toast.success('Subscriber removed successfully');
            fetchSubscribers();
        } catch (error) {
            console.error('Error removing subscriber:', error);
            toast.error('Failed to remove subscriber');
        }
    }

    function exportToCSV() {
        const csv = [
            ['Email', 'Status', 'Subscribed At', 'Unsubscribed At'],
            ...subscribers.map(s => [
                s.email,
                s.status,
                new Date(s.subscribedAt).toISOString(),
                s.unsubscribedAt ? new Date(s.unsubscribedAt).toISOString() : ''
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Subscribers exported to CSV');
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Newsletter Subscribers</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your newsletter subscriber list
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Subscriber
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Subscriber</DialogTitle>
                                <DialogDescription>
                                    Manually add a new subscriber to the newsletter
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="subscriber@example.com"
                                        value={newEmail}
                                        onChange={(e) => setNewEmail(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubscriber()}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleAddSubscriber}
                                    disabled={adding}
                                >
                                    {adding ? 'Adding...' : 'Add Subscriber'}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Total Subscribers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-400">{stats.unsubscribed}</div>
                    </CardContent>
                </Card>
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
                    variant={filter === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('active')}
                >
                    Active
                </Button>
                <Button
                    variant={filter === 'unsubscribed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('unsubscribed')}
                >
                    Unsubscribed
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Subscribers</CardTitle>
                    <CardDescription>
                        {subscribers.length} subscriber{subscribers.length !== 1 ? 's' : ''}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : subscribers.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">No subscribers yet</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Subscribed</TableHead>
                                    <TableHead>Unsubscribed</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscribers.map((subscriber) => (
                                    <TableRow key={subscriber.id}>
                                        <TableCell className="font-medium">
                                            {subscriber.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                                                {subscriber.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(subscriber.subscribedAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {subscriber.unsubscribedAt
                                                ? new Date(subscriber.unsubscribedAt).toLocaleDateString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleRemoveSubscriber(subscriber.email)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
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
