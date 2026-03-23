
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { TutoringSession, User, AvailabilitySlot } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import Dialog from '../../components/ui/Dialog';
import { cn } from '../../lib/utils';
import { SessionCalendar } from '../../components/SessionCalendar';
import {
    VideoIcon,
    CalendarIcon,
    UsersIcon,
    PlusIcon,
    HistoryIcon,
    ListIcon,
    StickyNoteIcon,
    AlertTriangleIcon,
    ClockIcon,
    TrashIcon
} from '../../components/ui/Icons';

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MentorTutoring: React.FC = () => {
    const { user, updateUserProfile } = useAuth();
    const navigate = useNavigate();
    const [sessions, setSessions] = useState<TutoringSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAvailabilityModalOpen, setIsAvailabilityModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [studentMap, setStudentMap] = useState<Record<string, string>>({});
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [preselectedDate, setPreselectedDate] = useState<string>('');
    const [startingSessionId, setStartingSessionId] = useState<string | null>(null);

    // Notes State
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [selectedSessionForNotes, setSelectedSessionForNotes] = useState<TutoringSession | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    // Cancel Session State
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [sessionToCancel, setSessionToCancel] = useState<TutoringSession | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    const fetchSessions = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [mySessions, allUsers] = await Promise.all([
                api.getSessionsForUser(user.id, 'mentor'),
                api.getUsers()
            ]);
            setSessions(mySessions);
            const map: Record<string, string> = {};
            allUsers.forEach(u => map[u.id] = u.name);
            setStudentMap(map);
        } catch (error) {
            console.error("Failed to fetch sessions", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, [user]);

    const handleCreateSession = async (data: any) => {
        if (!user) return;
        try {
            const newSession: Omit<TutoringSession, 'id'> = {
                mentorId: user.id,
                studentIds: [],
                topic: data.topic,
                description: data.description,
                startTime: new Date(data.date + 'T' + data.time).toISOString(),
                duration: parseInt(data.duration),
                status: 'scheduled',
                type: data.type,
                category: 'tutoring',
                maxStudents: parseInt(data.maxStudents),
            };
            await api.createTutoringSession(newSession);
            setIsCreateModalOpen(false);
            fetchSessions();
        } catch (error) {
            console.error("Failed to create session", error);
        }
    };

    const handleStartSession = async (sessionId: string) => {
        if (startingSessionId) return; // Prevent double clicks

        const session = sessions.find(s => s.id === sessionId);
        if (!session) return;

        // If already active or completed, just navigate
        if (session.status === 'active' || session.status === 'completed') {
            navigate(`/room/${sessionId}`);
            return;
        }

        setStartingSessionId(sessionId);

        // If scheduled, start it then navigate
        try {
            // await api.startTutoringSession(sessionId); // MOVED TO ROOM JOIN
            // Optimistic update locally - REMOVED to align with room logic
            // setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: 'active' } : s));
            navigate(`/room/${sessionId}`);
        } catch (error) {
            console.error("Failed to navigate to session", error);
            setStartingSessionId(null); // Re-enable on error
        }
    };

    const handleCancelSession = (sessionId: string) => {
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setSessionToCancel(session);
            setIsCancelModalOpen(true);
        }
    };

    const confirmCancelSession = async () => {
        if (!sessionToCancel) return;
        setIsCancelling(true);
        try {
            // Append cancel reason to private notes if provided
            let notes = sessionToCancel.privateNotes || '';
            if (cancelReason) {
                notes += `\n[Cancelled]: ${cancelReason}`;
            }
            const updatedSession = {
                ...sessionToCancel,
                status: 'cancelled' as const,
                privateNotes: notes
            };
            await api.updateTutoringSession(updatedSession);
            setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
            setIsCancelModalOpen(false);
            setSessionToCancel(null);
        } catch (error) {
            console.error("Failed to cancel session", error);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleOpenNotes = (session: TutoringSession) => {
        setSelectedSessionForNotes(session);
        setNoteContent(session.privateNotes || '');
        setIsNotesModalOpen(true);
    };

    const handleSaveNotes = async () => {
        if (!selectedSessionForNotes) return;
        setIsSavingNotes(true);
        try {
            const updatedSession = { ...selectedSessionForNotes, privateNotes: noteContent };
            await api.updateTutoringSession(updatedSession);
            setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
            setIsNotesModalOpen(false);
            setSelectedSessionForNotes(null);
        } catch (error) {
            console.error("Failed to save notes", error);
        } finally {
            setIsSavingNotes(false);
        }
    };

    const handleUpdateAvailability = async (availability: AvailabilitySlot[]) => {
        try {
            await updateUserProfile({ availability });
            setIsAvailabilityModalOpen(false);
        } catch (err) {
            console.error("Failed to update availability", err);
        }
    };

    const handleCalendarDateClick = (date: Date) => {
        const formattedDate = date.toISOString().split('T')[0];
        setPreselectedDate(formattedDate);
        setIsCreateModalOpen(true);
    };

    const now = new Date();
    const isPast = (s: TutoringSession) => {
        const endTime = new Date(new Date(s.startTime).getTime() + s.duration * 60000);
        return s.status === 'completed' || s.status === 'cancelled' || endTime < now;
    };

    const upcomingSessions = sessions.filter(s => !isPast(s)).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    const pastSessions = sessions.filter(s => isPast(s)).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    const displaySessions = activeTab === 'upcoming' ? upcomingSessions : pastSessions;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-heading, var(--text-main))' }}>Tutoring Management</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Schedule classes, manage bookings, and set your availability.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <div className="flex rounded-lg p-1" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 px-3", viewMode === 'list' && "shadow-sm")}
                            style={viewMode === 'list' ? { backgroundColor: 'var(--card-bg)' } : undefined}
                            onClick={() => setViewMode('list')}
                        >
                            <ListIcon className="w-4 h-4 mr-2" /> List
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-8 px-3", viewMode === 'calendar' && "shadow-sm")}
                            style={viewMode === 'calendar' ? { backgroundColor: 'var(--card-bg)' } : undefined}
                            onClick={() => setViewMode('calendar')}
                        >
                            <CalendarIcon className="w-4 h-4 mr-2" /> Calendar
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => setIsAvailabilityModalOpen(true)}>
                        <ClockIcon className="w-4 h-4 mr-2" /> Set Availability
                    </Button>
                    <Button onClick={() => { setPreselectedDate(''); setIsCreateModalOpen(true); }}>
                        <PlusIcon className="w-4 h-4 mr-2" /> Schedule Session
                    </Button>
                </div>
            </div>

            {viewMode === 'calendar' ? (
                <SessionCalendar
                    sessions={sessions}
                    onSessionClick={(s) => handleStartSession(s.id)}
                    onDateClick={handleCalendarDateClick}
                />
            ) : (
                <>
                    {/* Tabs */}
                    <div className="border-b" style={{ borderColor: 'var(--border-default)' }}>
                        <nav className="-mb-px flex space-x-6">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={cn(
                                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === 'upcoming'
                                        ? 'tab-active'
                                        : 'tab-themed'
                                )}
                            >
                                Upcoming & Active ({upcomingSessions.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('past')}
                                className={cn(
                                    'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                                    activeTab === 'past'
                                        ? 'tab-active'
                                        : 'tab-themed'
                                )}
                            >
                                Session History
                            </button>
                        </nav>
                    </div>

                    {isLoading ? <p>Loading sessions...</p> : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {displaySessions.length > 0 ? displaySessions.map(session => (
                                <Card key={session.id} className={cn("flex flex-col", activeTab === 'past' && "opacity-75 hover:opacity-100 transition-opacity")}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <Badge variant={session.type === 'one-on-one' ? 'default' : 'secondary'}>
                                                {session.type === 'one-on-one' ? '1-on-1' : 'Group Class'}
                                            </Badge>
                                            <Badge variant="outline" className="capitalize">{session.status}</Badge>
                                        </div>
                                        <CardTitle className="mt-2 text-lg">{session.topic}</CardTitle>
                                        <CardDescription>
                                            {session.studentIds.length} / {session.maxStudents} Students
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-grow space-y-3 text-sm">
                                        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                                            <CalendarIcon className="w-4 h-4" />
                                            <span>{new Date(session.startTime).toLocaleString()}</span>
                                        </div>
                                        {session.studentIds.length > 0 && (
                                            <div className="flex items-start gap-2" style={{ color: 'var(--text-secondary)' }}>
                                                <UsersIcon className="w-4 h-4 mt-0.5" />
                                                <div className="text-xs">
                                                    <span className="font-semibold">Participants:</span><br />
                                                    {session.studentIds.map(id => studentMap[id] || 'Unknown').join(', ')}
                                                </div>
                                            </div>
                                        )}
                                        {session.description && <p className="text-slate-500 mt-2">{session.description}</p>}
                                    </CardContent>
                                    <CardFooter className="flex justify-between gap-2 pt-2 border-t" style={{ borderColor: 'var(--border-default)' }}>
                                        {activeTab === 'upcoming' ? (
                                            <>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenNotes(session)} title="Private Notes">
                                                        <StickyNoteIcon className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => handleCancelSession(session.id)}>Cancel</Button>
                                                </div>
                                                <Button size="sm" onClick={() => handleStartSession(session.id)} disabled={startingSessionId === session.id}>
                                                    {startingSessionId === session.id ? 'Starting...' : (session.status === 'active' ? 'Resume' : 'Start')}
                                                </Button>
                                            </>
                                        ) : (
                                            <Button variant="outline" size="sm" className="w-full" onClick={() => handleOpenNotes(session)}>
                                                <StickyNoteIcon className="w-4 h-4 mr-2" /> View Notes
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            )) : (
                                <div className="col-span-full text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-strong)' }}>
                                    {activeTab === 'upcoming' ? (
                                        <>
                                            <UsersIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                            <p className="font-semibold text-lg">No Upcoming Sessions</p>
                                            <p className="text-slate-500">Create a group class or wait for student bookings.</p>
                                        </>
                                    ) : (
                                        <>
                                            <HistoryIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                                            <p className="font-semibold text-lg">No Past Sessions</p>
                                            <p className="text-slate-500">Completed sessions will appear here.</p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )
            }

            <CreateSessionDialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={handleCreateSession}
                initialDate={preselectedDate}
            />

            <ManageAvailabilityDialog
                isOpen={isAvailabilityModalOpen}
                onClose={() => setIsAvailabilityModalOpen(false)}
                onSave={handleUpdateAvailability}
                currentAvailability={user?.availability || []}
            />

            <Dialog
                isOpen={isNotesModalOpen}
                onClose={() => setIsNotesModalOpen(false)}
                title={selectedSessionForNotes ? `Notes: ${selectedSessionForNotes.topic}` : 'Session Notes'}
            >
                <div className="space-y-4">
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        These notes are private and only visible to you. Use them to track student progress, prepare for future sessions, or jot down reminders.
                    </p>
                    <Textarea
                        value={noteContent}
                        onChange={e => setNoteContent(e.target.value)}
                        placeholder="Write your private notes here..."
                        className="min-h-[200px]"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsNotesModalOpen(false)} disabled={isSavingNotes}>Cancel</Button>
                        <Button onClick={handleSaveNotes} disabled={isSavingNotes}>
                            {isSavingNotes ? 'Saving...' : 'Save Notes'}
                        </Button>
                    </div>
                </div>
            </Dialog>

            <Dialog
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                title="Cancel Session"
            >
                <div className="space-y-4">
                    {sessionToCancel && (
                        <>
                            <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm space-y-1">
                                <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                                    <AlertTriangleIcon className="w-5 h-5" />
                                    Warning
                                </div>
                                <p>You are about to cancel <span className="font-semibold">{sessionToCancel.topic}</span>.</p>
                                <p>Scheduled for: <span className="font-semibold">{new Date(sessionToCancel.startTime).toLocaleString()}</span></p>
                                <p className="mt-2">This action cannot be undone and students will be notified.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1.5">Reason for Cancellation (Optional)</label>
                                <Textarea
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)}
                                    placeholder="e.g., Personal emergency, technical issues..."
                                    rows={2}
                                />
                            </div>
                        </>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setIsCancelModalOpen(false)} disabled={isCancelling}>Keep Session</Button>
                        <Button variant="destructive" onClick={confirmCancelSession} disabled={isCancelling}>
                            {isCancelling ? 'Cancelling...' : 'Yes, Cancel Session'}
                        </Button>
                    </div>
                </div>
            </Dialog>
        </div >
    );
};

// --- MENTOR AVAILABILITY DIALOG ---
const ManageAvailabilityDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (slots: AvailabilitySlot[]) => void;
    currentAvailability: AvailabilitySlot[];
}> = ({ isOpen, onClose, onSave, currentAvailability }) => {
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [newDay, setNewDay] = useState('1'); // Monday
    const [newStart, setNewStart] = useState('09:00');
    const [newEnd, setNewEnd] = useState('17:00');

    useEffect(() => {
        if (isOpen) {
            setSlots([...currentAvailability]);
        }
    }, [isOpen, currentAvailability]);

    const handleAddSlot = () => {
        const slot: AvailabilitySlot = {
            id: `slot-${Date.now()}`,
            dayOfWeek: parseInt(newDay),
            startTime: newStart,
            endTime: newEnd
        };
        setSlots([...slots, slot].sort((a, b) => {
            if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
            return a.startTime.localeCompare(b.startTime);
        }));
    };

    const handleRemoveSlot = (id: string) => {
        setSlots(slots.filter(s => s.id !== id));
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Manage Weekly Availability">
            <div className="space-y-4">
                <div className="p-4 rounded-lg space-y-3" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                    <h3 className="font-medium text-sm">Add New Slot</h3>
                    <div className="grid grid-cols-3 gap-2">
                        <Select value={newDay} onChange={e => setNewDay(e.target.value)} className="col-span-1">
                            {DAYS.map((day, i) => (
                                <option key={i} value={i}>{day}</option>
                            ))}
                        </Select>
                        <Input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} />
                        <Input type="time" value={newEnd} onChange={e => setNewEnd(e.target.value)} />
                    </div>
                    <Button onClick={handleAddSlot} size="sm" className="w-full">
                        <PlusIcon className="w-4 h-4 mr-2" /> Add Time Slot
                    </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                    <h3 className="font-medium text-sm">Current Slots</h3>
                    {slots.length === 0 && <p className="text-sm text-slate-500 italic">No availability set.</p>}
                    {slots.map(slot => (
                        <div key={slot.id} className="flex justify-between items-center p-2 border rounded text-sm">
                            <span>{DAYS[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}</span>
                            <button onClick={() => handleRemoveSlot(slot.id)} className="text-red-500 hover:text-red-700">
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-2">
                    <Button onClick={() => onSave(slots)}>Save Changes</Button>
                </div>
            </div>
        </Dialog>
    );
};

// --- CREATE SESSION DIALOG ---
const CreateSessionDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onCreate: (data: any) => void;
    initialDate: string;
}> = ({ isOpen, onClose, onCreate, initialDate }) => {
    const today = new Date().toISOString().split('T')[0];
    const [formData, setFormData] = useState({
        topic: '',
        description: '',
        date: initialDate || today,
        time: '10:00',
        duration: '60',
        type: 'one-on-one',
        maxStudents: '1'
    });

    useEffect(() => {
        if (initialDate) {
            setFormData(prev => ({ ...prev, date: initialDate }));
        }
    }, [initialDate]);

    const handleSubmit = () => {
        onCreate(formData);
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Schedule New Session">
            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Session Topic</label>
                    <Input
                        value={formData.topic}
                        onChange={e => setFormData({ ...formData, topic: e.target.value })}
                        placeholder="e.g., Intro to Python"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What will be covered?"
                        rows={2}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                            type="date"
                            value={formData.date}
                            min={today}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Time</label>
                        <Input
                            type="time"
                            value={formData.time}
                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Duration (min)</label>
                        <Select
                            value={formData.duration}
                            onChange={e => setFormData({ ...formData, duration: e.target.value })}
                        >
                            <option value="30">30 Minutes</option>
                            <option value="45">45 Minutes</option>
                            <option value="60">1 Hour</option>
                            <option value="90">1.5 Hours</option>
                            <option value="120">2 Hours</option>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Session Type</label>
                        <Select
                            value={formData.type}
                            onChange={e => {
                                const type = e.target.value;
                                setFormData({
                                    ...formData,
                                    type,
                                    maxStudents: type === 'one-on-one' ? '1' : '10'
                                });
                            }}
                        >
                            <option value="one-on-one">1-on-1 Tutoring</option>
                            <option value="group">Group Class</option>
                        </Select>
                    </div>
                </div>
                {formData.type === 'group' && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Max Students</label>
                        <Input
                            type="number"
                            min="2"
                            max="50"
                            value={formData.maxStudents}
                            onChange={e => setFormData({ ...formData, maxStudents: e.target.value })}
                        />
                    </div>
                )}
                <div className="flex justify-end pt-2">
                    <Button onClick={handleSubmit}>Schedule Session</Button>
                </div>
            </div>
        </Dialog>
    );
};

export default MentorTutoring;
