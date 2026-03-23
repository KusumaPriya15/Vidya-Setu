
import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { User, MentorshipRequest } from '../../types';
import { useAuth } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import Dialog from '../../components/ui/Dialog';
import { Textarea } from '../../components/ui/Textarea';
import { SearchIcon, MapPinIcon, MessageCircle } from '../../components/ui/Icons';
import ChatModal from '../../components/ChatModal';

const StudentMentorship: React.FC = () => {
    const { user } = useAuth();
    const [mentors, setMentors] = useState<User[]>([]);
    const [requests, setRequests] = useState<MentorshipRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMentor, setSelectedMentor] = useState<User | null>(null);
    const [requestMessage, setRequestMessage] = useState('');
    const [chatTarget, setChatTarget] = useState<{ id: string; name: string } | null>(null);

    const fetchData = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [availableMentors, myRequests] = await Promise.all([
                api.getMentors(),
                api.getMentorshipRequests(user.id, 'student')
            ]);
            setMentors(availableMentors);
            setRequests(myRequests);
        } catch (error) {
            console.error("Failed to fetch mentorship data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleSendRequest = async () => {
        if (!user || !selectedMentor) return;
        try {
            await api.createMentorshipRequest({
                studentId: user.id,
                mentorId: selectedMentor.id,
                message: requestMessage
            });
            setSelectedMentor(null);
            setRequestMessage('');
            fetchData();
        } catch (error) {
            console.error("Failed to send request", error);
        }
    };

    const getRequestStatus = (mentorId: string) => {
        const req = requests.find(r => r.mentorId === mentorId);
        return req ? req.status : null;
    };

    const filteredMentors = mentors.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.expertise?.some(e => e.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleMessageMentor = (mentor: User) => {
        setChatTarget({ id: mentor.id, name: mentor.name });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>Find a Mentor</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Connect with experts for career advice and academic guidance.</p>
                </div>
                <div className="w-full md:w-64">
                    <Input
                        placeholder="Search by name or skill..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        icon={<SearchIcon className="w-4 h-4" />}
                    />
                </div>
            </div>

            {isLoading ? <p style={{ color: 'var(--text-main)' }}>Loading mentors...</p> : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredMentors.map(mentor => {
                        const status = getRequestStatus(mentor.id);
                        return (
                            <Card key={mentor.id} className="flex flex-col card-themed">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg kpi-icon-chip">
                                            {mentor.name.charAt(0)}
                                        </div>
                                        {status && (
                                            <Badge variant={status === 'accepted' ? 'success' : status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                                                {status === 'pending' ? 'Request Sent' : status}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="mt-4">{mentor.name}</CardTitle>
                                    <CardDescription className="line-clamp-2">{mentor.bio || "No bio available."}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="flex flex-wrap gap-2">
                                        {mentor.expertise?.map(skill => (
                                            <Badge key={skill} variant="outline">{skill}</Badge>
                                        ))}
                                    </div>
                                    {mentor.state && (
                                        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            <MapPinIcon className="w-4 h-4" />
                                            <span>{mentor.state}</span>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    {status === 'accepted' ? (
                                        <Button
                                            className="w-full"
                                            onClick={() => handleMessageMentor(mentor)}
                                        >
                                            <MessageCircle className="w-4 h-4 mr-2" />
                                            Message Mentor
                                        </Button>
                                    ) : (
                                        <Button
                                            className="w-full"
                                            onClick={() => setSelectedMentor(mentor)}
                                            disabled={!!status}
                                        >
                                            {status ? 'Request Pending' : 'Request Mentorship'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}

            <Dialog
                isOpen={!!selectedMentor}
                onClose={() => setSelectedMentor(null)}
                title={`Request Mentorship from ${selectedMentor?.name}`}
            >
                <div className="space-y-4">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Introduce yourself and explain why you'd like them as your mentor.</p>
                    <Textarea
                        value={requestMessage}
                        onChange={e => setRequestMessage(e.target.value)}
                        placeholder="Hi, I'm interested in..."
                        rows={4}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setSelectedMentor(null)}>Cancel</Button>
                        <Button onClick={handleSendRequest}>Send Request</Button>
                    </div>
                </div>
            </Dialog>

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

export default StudentMentorship;
