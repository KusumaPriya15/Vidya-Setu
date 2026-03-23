import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/auth';
import { getNotificationPreferences, updateNotificationPreferences } from '../lib/api';
import { useToast } from '../components/Toast';
import { NotificationPreferences } from '../types';

const Settings: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        mentorshipRequests: true,
        mentorshipApprovals: true,
        tutoringSessionScheduled: true,
        tutoringSessionReminders: true,
        forumReplies: true,
        forumMentions: true,
        quizGrades: true,
        quizAssignments: true,
        courseUpdates: true,
        directMessages: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPreferences();
    }, [user]);

    const loadPreferences = async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            const prefs = await getNotificationPreferences(user.id);
            if (prefs) {
                setPreferences(prefs);
            }
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
            showToast('error', 'Failed to load preferences');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (key: keyof NotificationPreferences) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = async () => {
        if (!user) return;

        try {
            setSaving(true);
            await updateNotificationPreferences(user.id, preferences);
            showToast('success', 'Notification preferences saved successfully');
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            showToast('error', 'Failed to save preferences');
        } finally {
            setSaving(false);
        }
    };

    const NotificationToggle: React.FC<{
        label: string;
        description: string;
        checked: boolean;
        onChange: () => void;
    }> = ({ label, description, checked, onChange }) => (
        <div className="flex items-start justify-between py-4 border-b border-gray-200">
            <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900">{label}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <button
                type="button"
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    checked ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={checked}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </button>
        </div>
    );

    if (loading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
                <Card>
                    <CardContent>
                        <p className="text-gray-500">Loading preferences...</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            
            <Card>
                <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                    <CardDescription>
                        Choose which notifications you want to receive. You can customize your notification settings to stay informed about the activities that matter most to you.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-1">
                        {user?.role === 'mentor' && (
                            <NotificationToggle
                                label="Mentorship Requests"
                                description="Receive notifications when students request mentorship"
                                checked={preferences.mentorshipRequests}
                                onChange={() => handleToggle('mentorshipRequests')}
                            />
                        )}

                        {user?.role === 'student' && (
                            <NotificationToggle
                                label="Mentorship Approvals"
                                description="Receive notifications when mentors approve your mentorship requests"
                                checked={preferences.mentorshipApprovals}
                                onChange={() => handleToggle('mentorshipApprovals')}
                            />
                        )}

                        <NotificationToggle
                            label="Tutoring Sessions Scheduled"
                            description="Receive notifications when new tutoring sessions are scheduled"
                            checked={preferences.tutoringSessionScheduled}
                            onChange={() => handleToggle('tutoringSessionScheduled')}
                        />

                        <NotificationToggle
                            label="Tutoring Session Reminders"
                            description="Receive reminders before scheduled tutoring sessions"
                            checked={preferences.tutoringSessionReminders}
                            onChange={() => handleToggle('tutoringSessionReminders')}
                        />

                        <NotificationToggle
                            label="Forum Replies"
                            description="Receive notifications when someone replies to your forum posts"
                            checked={preferences.forumReplies}
                            onChange={() => handleToggle('forumReplies')}
                        />

                        <NotificationToggle
                            label="Forum Mentions"
                            description="Receive notifications when someone mentions you in forums"
                            checked={preferences.forumMentions}
                            onChange={() => handleToggle('forumMentions')}
                        />

                        {user?.role === 'student' && (
                            <>
                                <NotificationToggle
                                    label="Quiz Grades"
                                    description="Receive notifications when your quizzes are graded"
                                    checked={preferences.quizGrades}
                                    onChange={() => handleToggle('quizGrades')}
                                />

                                <NotificationToggle
                                    label="Quiz Assignments"
                                    description="Receive notifications when new quizzes are assigned to you"
                                    checked={preferences.quizAssignments}
                                    onChange={() => handleToggle('quizAssignments')}
                                />

                                <NotificationToggle
                                    label="Course Updates"
                                    description="Receive notifications when courses you're enrolled in are updated"
                                    checked={preferences.courseUpdates}
                                    onChange={() => handleToggle('courseUpdates')}
                                />
                            </>
                        )}

                        <NotificationToggle
                            label="Direct Messages"
                            description="Receive notifications for new direct messages"
                            checked={preferences.directMessages}
                            onChange={() => handleToggle('directMessages')}
                        />
                    </div>

                    <div className="mt-6 flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Preferences'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default Settings;
