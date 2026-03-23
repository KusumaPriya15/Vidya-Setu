import React, { useState, useEffect } from 'react';
import * as api from '../../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ActivityLogEntry, subscribe, unsubscribe, getActivityLog, formatTimeAgo } from '../../lib/activityLog';
import { cn } from '../../lib/utils';
import { Users, GraduationCap, Presentation, Shield, Library, FileQuestion, UserPlus, BookUp, FileCheck, LogIn, UserMinus, Info, PlusCircle, FileBarChart, Settings, ShieldCheck, ShieldX } from '../../components/ui/Icons';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({ users: 0, mentors: 0, students: 0, admins: 0, courses: 0, quizzes: 0 });
    const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [users, courses, quizzes] = await Promise.all([
                    api.getUsers(),
                    api.getCourses(),
                    api.getCourses().then(courses => Promise.all(courses.map(c => api.getQuizzesByCourse(c.id)))).then(quizzes => quizzes.flat()),
                ]);

                setStats({
                    users: users.length,
                    mentors: users.filter(u => u.role === 'mentor').length,
                    students: users.filter(u => u.role === 'student').length,
                    admins: users.filter(u => u.role === 'admin').length,
                    courses: courses.length,
                    quizzes: quizzes.length,
                });

            } catch (error) {
                console.error("Failed to fetch admin dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchActivityLog = async () => {
            setRecentActivity(await getActivityLog());
        };

        const handleNewLog = (newLog: ActivityLogEntry) => {
            setRecentActivity(prev => [newLog, ...prev].slice(0, 10)); // Keep it capped
        };

        fetchDashboardData();
        fetchActivityLog();
        subscribe(handleNewLog);

        return () => unsubscribe(handleNewLog);
    }, []);

    const getActivityIcon = (type: ActivityLogEntry['type']) => {
        switch (type) {
            case 'user_create': return <UserPlus className="w-[18px] h-[18px]" style={{ color: 'var(--primary)' }} />;
            case 'course_create': return <BookUp className="w-[18px] h-[18px]" style={{ color: 'var(--color-success)' }} />;
            case 'quiz_submit': return <FileCheck className="w-[18px] h-[18px]" style={{ color: 'var(--accent-secondary)' }} />;
            case 'user_login': return <LogIn className="w-[18px] h-[18px]" style={{ color: 'var(--text-muted)' }} />;
            case 'user_delete': return <UserMinus className="w-[18px] h-[18px]" style={{ color: 'var(--color-error)' }} />;
            default: return <Info className="w-[18px] h-[18px]" style={{ color: 'var(--text-muted)' }} />;
        }
    };


    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden relative" hover={false}>
                <div className="absolute top-0 right-0 w-48 h-48 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="50" y="50" width="100" height="100" rx="12" fill="var(--primary)" opacity="0.3"/>
                        <path d="M100 70 L100 130 M70 100 L130 100" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" opacity="0.5"/>
                        <circle cx="100" cy="100" r="45" stroke="var(--primary)" strokeWidth="3" opacity="0.4"/>
                    </svg>
                </div>
                <CardHeader className="relative z-10">
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Shield className="w-6 h-6" style={{ color: 'var(--primary)' }} />
                        Welcome to the Admin Panel! 🛡️
                    </CardTitle>
                    <CardDescription>Manage users, courses, and system settings with full control.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
                <StatCard icon={<Users className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Total Users" value={stats.users} />
                <StatCard icon={<GraduationCap className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Students" value={stats.students} />
                <StatCard icon={<Presentation className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Instructors" value={stats.mentors} />
                <StatCard icon={<Shield className="w-[22px] h-[22px]" style={{ color: 'var(--accent-neutral, var(--accent-secondary))' }} />} title="Admins" value={stats.admins} />
                <StatCard icon={<Library className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Total Courses" value={stats.courses} />
                <StatCard icon={<FileQuestion className="w-[22px] h-[22px]" style={{ color: 'var(--primary)' }} />} title="Total Quizzes" value={stats.quizzes} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <Button asChild className="flex items-center justify-center gap-2 h-10"><Link to="/admin/users/create"><UserPlus className="w-4 h-4 flex-shrink-0" /><span className="leading-tight">Add User</span></Link></Button>
                        <Button asChild className="flex items-center justify-center gap-2 h-10"><Link to="/admin/analytics"><PlusCircle className="w-4 h-4 flex-shrink-0" /><span className="leading-tight">Create Course</span></Link></Button>
                        <Button asChild className="flex items-center justify-center gap-2 h-10"><Link to="/admin/reports"><FileBarChart className="w-4 h-4 flex-shrink-0" /><span className="leading-tight">View Reports</span></Link></Button>
                        <Button asChild className="flex items-center justify-center gap-2 h-10"><Link to="/admin/settings"><Settings className="w-4 h-4 flex-shrink-0" /><span className="leading-tight">Settings</span></Link></Button>
                        <Button asChild className="flex items-center justify-center gap-2 h-10"><Link to="/admin/moderation"><ShieldCheck className="w-4 h-4 flex-shrink-0" /><span className="leading-tight">Moderation</span></Link></Button>
                        <Button asChild className="flex items-center justify-center gap-2 h-10"><Link to="/admin/security"><ShieldX className="w-4 h-4 flex-shrink-0" /><span className="leading-tight">Security</span></Link></Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><CardTitle>Recent System Activity</CardTitle></CardHeader>
                    <CardContent>
                        {recentActivity.length > 0 ? (
                            <ul className="space-y-3">
                                {recentActivity.slice(0, 5).map((activity) => (
                                    <li key={activity.id} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                                        <div className="p-2 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--card-bg)' }}>{getActivityIcon(activity.type)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium leading-tight" style={{ color: 'var(--text-main)' }}>{activity.title}</p>
                                            <p className="text-sm leading-tight mt-1" style={{ color: 'var(--text-secondary)' }}>{formatTimeAgo(activity.timestamp)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="w-20 h-20 mx-auto mb-3 opacity-20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="60" y="40" width="80" height="120" rx="8" fill="var(--primary)" opacity="0.3"/>
                                    <rect x="75" y="60" width="50" height="6" rx="3" fill="var(--primary)" opacity="0.5"/>
                                    <rect x="75" y="80" width="50" height="6" rx="3" fill="var(--primary)" opacity="0.5"/>
                                    <rect x="75" y="100" width="30" height="6" rx="3" fill="var(--primary)" opacity="0.5"/>
                                </svg>
                                <p className="font-medium" style={{ color: 'var(--text-main)' }}>No system activity yet</p>
                                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>System events will be logged here.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

        </div>
    );
};


const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
    <Card className="flex flex-col items-center justify-center text-center p-5">
        <div className="p-3 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--kpi-icon-chip)', border: '1px solid var(--kpi-icon-chip-border, var(--border-default))' }}>{icon}</div>
        <dd className="text-3xl font-bold mt-3 leading-tight" style={{ color: 'var(--text-heading, var(--text-main))' }}>{value}</dd>
        <dt className="text-sm font-medium mt-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>{title}</dt>
    </Card>
);

export default AdminDashboard;
