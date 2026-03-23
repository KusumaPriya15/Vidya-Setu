import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../lib/auth';
import * as api from '../../lib/api';
import { Course, Quiz, QuizAttempt, User } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button, buttonVariants } from '../../components/ui/Button';
import { Link } from 'react-router-dom';
import { ActivityLogEntry, subscribe, unsubscribe, getActivityLog, formatTimeAgo } from '../../lib/activityLog';
import { cn } from '../../lib/utils';
import { Library, FileText, Users, PlusCircle, HelpCircle, CheckCircle, LogIn, Info, Sparkles, AreaChart, ClipboardEdit } from '../../components/ui/Icons';

const MentorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ courses: 0, quizzes: 0, students: 0 });
    const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [firstCourse, setFirstCourse] = useState<Course | null>(null);
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const allCourses = await api.getCourses();
                const mentorCourses = allCourses.filter(c => c.mentorId === user.id);
                if (mentorCourses.length > 0) {
                    setFirstCourse(mentorCourses[0]);
                }

                const mentorQuizzes: Quiz[] = (await Promise.all(mentorCourses.map(c => api.getQuizzesByCourse(c.id)))).flat();
                const mentorQuizIds = new Set(mentorQuizzes.map(q => q.id));

                const allAttempts = await api.getAllAttempts();
                const mentorAttempts = allAttempts.filter(a => mentorQuizIds.has(a.quizId));
                setAttempts(mentorAttempts);
                const studentIds = new Set(mentorAttempts.map(a => a.studentId));

                setStats({
                    courses: mentorCourses.length,
                    quizzes: mentorQuizzes.length,
                    students: studentIds.size,
                });

            } catch (error) {
                console.error("Failed to fetch instructor dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchActivityLog = async () => {
            if (!user) return;
            const allLogs = await getActivityLog();
            const allCourses = await api.getCourses();
            const mentorCourseIds = new Set(allCourses.filter(c => c.mentorId === user.id).map(c => c.id));

            setRecentActivity(allLogs.filter(log =>
                (log.details?.mentorId === user.id) ||
                (log.details?.courseId && mentorCourseIds.has(log.details.courseId)) ||
                (log.type === 'user_login' && log.details?.userId === user.id)
            ));
        };

        const handleNewLog = (newLog: ActivityLogEntry) => {
            if (!user) return;
            const isRelevant = (newLog.details?.mentorId === user.id) ||
                (newLog.details?.courseId && stats.courses > 0) ||
                (newLog.type === 'user_login' && newLog.details?.userId === user.id);

            if (isRelevant) {
                setRecentActivity(prev => [newLog, ...prev].slice(0, 5));
            }
        };

        fetchData();
        fetchActivityLog();
        subscribe(handleNewLog);

        return () => unsubscribe(handleNewLog);
    }, [user, stats.courses]);

    const getActivityIcon = (type: ActivityLogEntry['type']) => {
        switch (type) {
            case 'course_create': return <PlusCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />;
            case 'quiz_create': return <HelpCircle className="w-5 h-5" style={{ color: 'var(--accent-action, var(--primary))' }} />;
            case 'quiz_submit': return <CheckCircle className="w-5 h-5" style={{ color: 'var(--color-success)' }} />;
            case 'user_login': return <LogIn className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />;
            default: return <Info className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />;
        }
    };

    const dailyActivityData = useMemo(() => {
        const days = 7;
        const data = new Array(days).fill(0).map((_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (days - 1 - i));
            return { date: d.toISOString().split('T')[0], count: 0, displayDate: d.toLocaleDateString('en-US', { weekday: 'short' }) };
        });

        attempts.forEach(a => {
            const dateStr = a.submittedAt.split('T')[0];
            const entry = data.find(d => d.date === dateStr);
            if (entry) entry.count++;
        });

        return data;
    }, [attempts]);


    if (isLoading) {
        return <div className="text-center p-8">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden relative" hover={false}>
                <div className="absolute top-0 left-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2 pointer-events-none" style={{ background: 'var(--gradient-hero)', opacity: 0.15 }}></div>
                <div className="absolute top-0 right-0 w-40 h-40 opacity-10 pointer-events-none">
                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 20 L180 60 L180 140 L100 180 L20 140 L20 60 Z" fill="var(--primary)" opacity="0.3"/>
                        <circle cx="100" cy="100" r="30" fill="var(--primary)" opacity="0.5"/>
                        <path d="M85 100 L95 110 L115 90" stroke="var(--card-bg)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <CardHeader className="relative z-10">
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <Sparkles className="w-[26px] h-[26px]" style={{ color: 'var(--primary)' }} />
                        <span>Inspire Your Students! 🎯</span>
                    </CardTitle>
                    <CardDescription>Manage your courses, create quizzes, and track student progress.</CardDescription>
                </CardHeader>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                <StatCard icon={<Library className="w-[26px] h-[26px]" style={{ color: 'var(--primary)' }} />} title="Total Courses" value={stats.courses} />
                <StatCard icon={<FileText className="w-[26px] h-[26px]" style={{ color: 'var(--accent-action, var(--primary))' }} />} title="Total Quizzes" value={stats.quizzes} />
                <StatCard icon={<Users className="w-[26px] h-[26px]" style={{ color: 'var(--accent-trend, var(--accent-secondary))' }} />} title="Engaged Students" value={stats.students} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Weekly Student Engagement</CardTitle>
                            <CardDescription>Quiz submissions over the last 7 days.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityBarChart data={dailyActivityData} />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <QuickActionButton to="/mentor/add-course" icon={<PlusCircle className="w-5 h-5" style={{ color: 'var(--primary)' }} />} label="Create Course" />
                            <QuickActionButton to="/mentor/generate-quiz" icon={<HelpCircle className="w-5 h-5" style={{ color: 'var(--accent-action, var(--primary))' }} />} label="Create Quiz" />
                            <QuickActionButton to="/mentor/progress" icon={<AreaChart className="w-5 h-5" style={{ color: 'var(--accent-trend, var(--accent-secondary))' }} />} label="Analytics" />
                            <QuickActionButton
                                to={firstCourse ? `/mentor/course/${firstCourse.id}?tab=grading` : '#'}
                                icon={<ClipboardEdit className="w-5 h-5" style={{ color: 'var(--color-success)' }} />}
                                label="Grading"
                                disabled={!firstCourse}
                            />
                        </CardContent>
                    </Card>
                </div>

                <Card className="flex flex-col max-h-[500px]">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-y-auto pr-2 custom-scrollbar flex-grow">
                        {recentActivity.length > 0 ? (
                            <ul className="space-y-4">
                                {recentActivity.map((activity) => (
                                    <li key={activity.id} className="flex items-start gap-3">
                                        <div className="flex-shrink-0">
                                            <div className="p-2 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                                                {getActivityIcon(activity.type)}
                                            </div>
                                        </div>
                                        <div className="pb-3 border-b w-full last:border-0 last:pb-0" style={{ borderColor: 'var(--border-default)' }}>
                                            <p className="text-sm font-medium leading-tight" style={{ color: 'var(--text-main)' }}>{activity.title}</p>
                                            <p className="text-xs mt-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>{formatTimeAgo(activity.timestamp)}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8" style={{ color: 'var(--text-secondary)' }}>
                                <svg className="w-20 h-20 mx-auto mb-3 opacity-20" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="100" cy="100" r="60" stroke="var(--primary)" strokeWidth="4" strokeDasharray="8 8" opacity="0.4"/>
                                    <circle cx="100" cy="100" r="8" fill="var(--primary)" opacity="0.6"/>
                                    <circle cx="140" cy="100" r="6" fill="var(--primary)" opacity="0.4"/>
                                    <circle cx="60" cy="100" r="6" fill="var(--primary)" opacity="0.4"/>
                                </svg>
                                <p className="font-medium">No recent activity</p>
                                <p className="text-xs mt-1">Activity will appear here as students engage with your content.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string | number }> = ({ icon, title, value }) => (
    <Card className="flex items-center p-5 gap-4 hover:shadow-md transition-shadow card-themed">
        <div className="p-3 rounded-xl kpi-icon-chip flex items-center justify-center flex-shrink-0">{icon}</div>
        <div className="flex flex-col justify-center">
            <dd className="text-2xl font-bold leading-tight" style={{ color: 'var(--text-main)' }}>{value}</dd>
            <dt className="text-sm font-medium leading-tight mt-1" style={{ color: 'var(--text-secondary)' }}>{title}</dt>
        </div>
    </Card>
);

const QuickActionButton: React.FC<{ to: string; icon: React.ReactNode; label: string; disabled?: boolean }> = ({ to, icon, label, disabled }) => {
    const Content = (
        <div 
            className={cn(
                "flex flex-col items-center justify-center gap-3 p-4 rounded-xl border transition-all cursor-pointer h-full min-h-[100px]",
                disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{
                backgroundColor: disabled ? 'transparent' : 'var(--card-bg)',
                borderColor: 'var(--border-default)'
            }}
            onMouseEnter={(e) => !disabled && (e.currentTarget.style.borderColor = 'var(--primary)')}
            onMouseLeave={(e) => !disabled && (e.currentTarget.style.borderColor = 'var(--border-default)')}
        >
            <div className="p-2.5 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>{icon}</div>
            <span className="text-sm font-medium text-center leading-tight" style={{ color: 'var(--text-main)' }}>{label}</span>
        </div>
    );

    return disabled ? Content : <Link to={to} className="block h-full">{Content}</Link>;
};

const ActivityBarChart: React.FC<{ data: { displayDate: string, count: number }[] }> = ({ data }) => {
    const maxCount = Math.max(...data.map(d => d.count), 5); // Ensure at least some height
    const height = 160;

    return (
        <div className="h-[160px] w-full flex items-end justify-between gap-2 pt-4">
            {data.map((d, i) => {
                const barHeight = (d.count / maxCount) * 100;
                return (
                    <div key={i} className="flex flex-col items-center flex-1 group relative">
                        <div className="w-full max-w-[30px] rounded-t-md relative h-full flex items-end overflow-hidden" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                            <div
                                className="w-full rounded-t-md transition-all duration-500"
                                style={{ height: `${Math.max(barHeight, 0)}%`, backgroundColor: 'var(--chart-bar, var(--primary))' }}
                            ></div>
                        </div>
                        <span className="text-[10px] mt-2" style={{ color: 'var(--text-secondary)' }}>{d.displayDate}</span>

                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap z-10" style={{ backgroundColor: 'var(--text-main)', color: 'var(--card-bg)' }}>
                            {d.count} Submissions
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default MentorDashboard;
