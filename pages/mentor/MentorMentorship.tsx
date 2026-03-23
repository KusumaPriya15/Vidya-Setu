
import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { MentorshipRequest, User } from '../../types';
import { useAuth } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { CheckIcon, XIcon, MessageCircle } from '../../components/ui/Icons';
import ChatModal from '../../components/ChatModal';

const MentorMentorship: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<(MentorshipRequest & { studentName: string })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [chatTarget, setChatTarget] = useState<{ id: string; name: string } | null>(null);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [myRequests, allUsers] = await Promise.all([
                api.getMentorshipRequests(user.id, 'mentor'),
                api.getUsers()
            ]);

            const userMap = new Map(allUsers.map(u => [u.id, u.name]));
            const enrichedRequests = myRequests.map(r => ({
                ...r,
                studentName: userMap.get(r.studentId) || 'Unknown Student'
            }));

            setRequests(enrichedRequests);
        } catch (error) {
            console.error("Failed to fetch mentorship requests", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleStatusUpdate = async (request: MentorshipRequest, status: 'accepted' | 'rejected') => {
        try {
            await api.updateMentorshipRequest({ ...request, status });
            fetchData();
        } catch (error) {
            console.error("Failed to update request", error);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const activeRequests = requests.filter(r => r.status === 'accepted');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mentorship Requests</h1>
                <p className="text-slate-500">Manage incoming requests from students seeking guidance.</p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Pending Requests ({pendingRequests.length})</h2>
                {pendingRequests.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-2">
                        {pendingRequests.map(req => (
                            <Card key={req.id}>
                                <CardHeader>
                                    <CardTitle>{req.studentName}</CardTitle>
                                    <CardDescription>Sent on {new Date(req.createdAt).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm italic text-slate-600">"{req.message}"</p>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2">
                                    <Button variant="outline" onClick={() => handleStatusUpdate(req, 'rejected')} className="text-red-600 hover:bg-red-50">
                                        <XIcon className="w-4 h-4 mr-2" /> Decline
                                    </Button>
                                    <Button onClick={() => handleStatusUpdate(req, 'accepted')} className="bg-green-600 hover:bg-green-700">
                                        <CheckIcon className="w-4 h-4 mr-2" /> Accept
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 italic">No pending requests.</p>
                )}
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-semibold">Active Mentees ({activeRequests.length})</h2>
                {activeRequests.length > 0 ? (
                    <div className="grid gap-4 md:grid-cols-3">
                        {activeRequests.map(req => (
                            <Card key={req.id} className="bg-slate-50">
                                <CardHeader>
                                    <div className="flex justify-between items-center">
                                        <CardTitle className="text-lg">{req.studentName}</CardTitle>
                                        <Badge variant="success">Active</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-xs text-slate-500">Connected since {new Date(req.createdAt).toLocaleDateString()}</p>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => setChatTarget({ id: req.studentId, name: req.studentName })}
                                    >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        Message
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 italic">No active mentees yet.</p>
                )}
            </div>

            {/* Chat Modal */}
            {user && chatTarget && (
                <ChatModal
                    isOpen={!!chatTarget}
                    onClose={() => setChatTarget(null)}
                    currentUserId={user.id}
                    currentUserName={user.name}
                    recipientId={chatTarget.id}
                    recipientName={chatTarget.name}
                />
            )}
        </div>
    );
};

export default MentorMentorship;
