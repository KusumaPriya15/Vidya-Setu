
import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { QuizAttempt, Quiz, Course } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import {
    PercentIcon,
    CheckCircle2Icon,
    AwardIcon,
    TrendingDownIcon,
    BarChartIcon,
    HistoryIcon
} from '../../components/ui/Icons';

interface TopicPerformance {
    topic: string;
    averageScore: number;
    attempts: number;
}

const StudentProgress: React.FC = () => {
    const { user } = useAuth();
    const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
    const [quizzes, setQuizzes] = useState<{ [id: string]: Quiz }>({});
    const [courses, setCourses] = useState<{ [id: string]: Course }>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            try {
                const [userAttempts, allQuizzes, allCourses] = await Promise.all([
                    api.getStudentProgress(user.id),
                    api.getQuizzes(),
                    api.getCourses()
                ]);

                setAttempts(userAttempts.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()));

                const quizzesMap = allQuizzes.reduce((acc, quiz) => {
                    acc[quiz.id] = quiz;
                    return acc;
                }, {} as { [id: string]: Quiz });
                setQuizzes(quizzesMap);

                const coursesMap = allCourses.reduce((acc, course) => {
                    acc[course.id] = course;
                    return acc;
                }, {} as { [id: string]: Course });
                setCourses(coursesMap);

            } catch (error) {
                console.error("Failed to fetch student progress", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const chartData = useMemo(() => {
        return attempts.map(attempt => ({
            name: quizzes[attempt.quizId]?.title || 'Quiz',
            score: attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0,
            date: new Date(attempt.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        })).slice(-10); // last 10 attempts
    }, [attempts, quizzes]);

    const topicPerformance = useMemo((): TopicPerformance[] => {
        const performance: { [topic: string]: { totalScore: number, count: number } } = {};

        attempts.forEach(attempt => {
            const quiz = quizzes[attempt.quizId];
            if (quiz) {
                const course = courses[quiz.courseId];
                if (course) {
                    const topic = course.title; // Using course title as the main topic
                    if (!performance[topic]) {
                        performance[topic] = { totalScore: 0, count: 0 };
                    }
                    performance[topic].totalScore += attempt.totalPoints > 0 ? (attempt.score / attempt.totalPoints) * 100 : 0;
                    performance[topic].count++;
                }
            }
        });

        return Object.entries(performance).map(([topic, data]) => ({
            topic,
            attempts: data.count,
            averageScore: Math.round(data.totalScore / data.count),
        })).sort((a, b) => b.averageScore - a.averageScore);
    }, [attempts, quizzes, courses]);

    const summaryStats = useMemo(() => {
        if (attempts.length === 0) {
            return {
                overallAverageScore: 0,
                completedQuizzes: 0,
                bestTopic: null,
                topicToImprove: null,
            };
        }
        const totalScore = attempts.reduce((acc, a) => acc + (a.totalPoints > 0 ? (a.score / a.totalPoints) * 100 : 0), 0);
        const overallAverageScore = Math.round(totalScore / attempts.length);
        const completedQuizzes = attempts.length;
        const bestTopic = topicPerformance.length > 0 ? topicPerformance[0] : null;
        const topicToImprove = topicPerformance.length > 1 ? topicPerformance[topicPerformance.length - 1] : null;

        return {
            overallAverageScore,
            completedQuizzes,
            bestTopic,
            topicToImprove,
        };
    }, [attempts, topicPerformance]);

    const detailedAttempts = useMemo(() => {
        return [...attempts]
            .reverse()
            .map(attempt => {
                const quiz = quizzes[attempt.quizId];
                const course = quiz ? courses[quiz.courseId] : null;
                const percentage = attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0;
                return {
                    ...attempt,
                    quizTitle: quiz?.title || 'Unknown Quiz',
                    courseTitle: course?.title || 'Unknown Course',
                    difficulty: quiz?.difficulty,
                    percentage,
                };
            });
    }, [attempts, quizzes, courses]);

    const getPerformanceColor = (score: number): string => {
        if (score >= 75) return 'bg-green-600';
        if (score >= 50) return 'bg-yellow-500';
        return 'bg-red-600';
    };

    const getDifficultyBadgeVariant = (difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | undefined): 'success' | 'secondary' | 'destructive' => {
        switch (difficulty) {
            case 'Beginner': return 'success';
            case 'Intermediate': return 'secondary';
            case 'Advanced': return 'destructive';
            default: return 'secondary';
        }
    }

    if (isLoading) {
        return <div className="text-center p-8">Loading progress...</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>My Progress</h1>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    icon={<PercentIcon className="w-[30px] h-[30px] text-blue-500" />}
                    title="Overall Average Score"
                    value={`${summaryStats.overallAverageScore}%`}
                    description="Across all completed quizzes"
                />
                <StatCard
                    icon={<CheckCircle2Icon className="w-[30px] h-[30px] text-green-500" />}
                    title="Quizzes Completed"
                    value={summaryStats.completedQuizzes}
                    description="Total quizzes you have taken"
                />
                <StatCard
                    icon={<AwardIcon className="w-[30px] h-[30px] text-yellow-500" />}
                    title="Best Topic"
                    value={summaryStats.bestTopic ? summaryStats.bestTopic.topic : 'N/A'}
                    description={summaryStats.bestTopic ? `Avg score: ${summaryStats.bestTopic.averageScore}%` : 'Complete a quiz to find out'}
                />
                <StatCard
                    icon={<TrendingDownIcon className="w-[30px] h-[30px] text-red-500" />}
                    title="Needs Improvement"
                    value={summaryStats.topicToImprove ? summaryStats.topicToImprove.topic : 'N/A'}
                    description={summaryStats.topicToImprove ? `Avg score: ${summaryStats.topicToImprove.averageScore}%` : 'Keep learning!'}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Performance Trend</CardTitle>
                        <CardDescription>
                            Your scores on the last {chartData.length} quizzes.
                            {chartData.length > 2 && <span className="ml-1 text-slate-500 font-normal text-xs">(Dashed line indicates trend)</span>}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ProgressTrendChart data={chartData} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Performance by Topic</CardTitle>
                        <CardDescription>Your average scores by course.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {topicPerformance.length > 0 ? (
                            <ul className="space-y-3">
                                {topicPerformance.map(item => (
                                    <li key={item.topic}>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium truncate max-w-[150px]">{item.topic}</span>
                                            <span className="text-sm font-bold">{item.averageScore}%</span>
                                        </div>
                                        <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                                            <div
                                                className={`h-2 rounded-full ${getPerformanceColor(item.averageScore)}`}
                                                style={{ width: `${item.averageScore}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-slate-500 text-right mt-1">{item.attempts} attempt(s)</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)' }} className="text-center py-8">No topic data available yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>


            <Card>
                <CardHeader>
                    <CardTitle>Recent Attempts</CardTitle>
                    <CardDescription>A detailed log of your last 5 quiz attempts.</CardDescription>
                </CardHeader>
                <CardContent>
                    {detailedAttempts.length > 0 ? (
                        <div className="space-y-4">
                            {detailedAttempts.slice(0, 5).map(attempt => (
                                <div key={attempt.id} className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ backgroundColor: 'var(--kpi-icon-chip)', borderColor: 'var(--border-default)' }}>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{attempt.quizTitle}</h3>
                                            {attempt.difficulty && <Badge variant={getDifficultyBadgeVariant(attempt.difficulty)}>{attempt.difficulty}</Badge>}
                                        </div>
                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                            From course: {attempt.courseTitle}
                                        </p>
                                    </div>
                                    <div className="w-full sm:w-64 space-y-2">
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-sm font-medium">Score: {attempt.score}/{attempt.totalPoints}</span>
                                            <span className="text-lg font-bold">{attempt.percentage}%</span>
                                        </div>
                                        <div className="w-full rounded-full h-2.5" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                                            <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${attempt.percentage}%` }}></div>
                                        </div>
                                        <p className="text-xs text-slate-500 text-right">
                                            Submitted on: {new Date(attempt.submittedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <HistoryIcon className="w-[46px] h-[46px] text-slate-400 mx-auto mb-2" />
                            <p className="font-semibold">No History Yet</p>
                            <p style={{ color: 'var(--text-secondary)' }} className="text-sm">Your quiz attempts will be logged here once you complete them.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

// --- Enhanced Chart Component ---
const ProgressTrendChart: React.FC<{ data: { name: string, score: number, date: string }[] }> = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    // Dimensions & Padding
    const SVG_WIDTH = 600;
    const SVG_HEIGHT = 280;
    const PADDING = 40;
    const Y_AXIS_LABELS = [0, 25, 50, 75, 100];

    // Calculate coordinates for data points
    const pointCoordinates = useMemo(() => {
        if (data.length < 2) return [];
        return data.map((d, index) => {
            const x = PADDING + (index / (data.length - 1)) * (SVG_WIDTH - 2 * PADDING);
            const y = (SVG_HEIGHT - PADDING) - (d.score / 100) * (SVG_HEIGHT - 2 * PADDING);
            return { x, y, ...d };
        });
    }, [data]);

    // Generate Path for the Line
    const linePath = useMemo(() => {
        if (pointCoordinates.length < 2) return '';
        return pointCoordinates
            .map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`)
            .join(' ');
    }, [pointCoordinates]);

    // Generate Area Path (for gradient fill)
    const areaPath = useMemo(() => {
        if (pointCoordinates.length < 2) return '';
        const start = pointCoordinates[0];
        const end = pointCoordinates[pointCoordinates.length - 1];
        return `
            ${linePath}
            L ${end.x} ${SVG_HEIGHT - PADDING}
            L ${start.x} ${SVG_HEIGHT - PADDING}
            Z
        `;
    }, [linePath, pointCoordinates]);

    // Calculate Linear Regression Trend Line
    const trendLine = useMemo(() => {
        if (data.length < 3) return null; // Need at least 3 points for a meaningful trend

        const n = data.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        // X is index (0, 1, 2...), Y is score
        data.forEach((d, i) => {
            sumX += i;
            sumY += d.score;
            sumXY += i * d.score;
            sumXX += i * i;
        });

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        const y1 = intercept;
        const y2 = slope * (n - 1) + intercept;

        // Helper to map data values to SVG coordinates
        const mapY = (val: number) => (SVG_HEIGHT - PADDING) - (Math.max(0, Math.min(100, val)) / 100) * (SVG_HEIGHT - 2 * PADDING);
        const mapX = (idx: number) => PADDING + (idx / (n - 1)) * (SVG_WIDTH - 2 * PADDING);

        return {
            x1: mapX(0),
            y1: mapY(y1),
            x2: mapX(n - 1),
            y2: mapY(y2),
            isUpward: slope > 0
        };
    }, [data]);

    if (data.length < 2) {
        return (
            <div className="text-center py-16 h-72 flex flex-col items-center justify-center border border-dashed rounded-lg" style={{ borderColor: 'var(--border-strong)' }}>
                <BarChartIcon className="w-[46px] h-[46px] mb-2" style={{ color: 'var(--text-muted)' }} />
                <p className="font-semibold" style={{ color: 'var(--text-main)' }}>Not Enough Data</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Complete at least two quizzes to see your performance trend.
                </p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-72" onMouseLeave={() => setHoveredIndex(null)}>
            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full overflow-visible" aria-label="Quiz score line chart">
                <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Grid Lines & Y-Axis Labels */}
                {Y_AXIS_LABELS.map(label => {
                    const y = (SVG_HEIGHT - PADDING) - (label / 100) * (SVG_HEIGHT - 2 * PADDING);
                    return (
                        <g key={label} className="text-slate-300">
                            <text x={PADDING - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400">{label}%</text>
                            <line x1={PADDING} x2={SVG_WIDTH - PADDING} y1={y} y2={y} className="stroke-current" strokeDasharray="4,4" strokeWidth="1" />
                        </g>
                    );
                })}

                {/* X-Axis Line */}
                <line x1={PADDING} x2={SVG_WIDTH - PADDING} y1={SVG_HEIGHT - PADDING} y2={SVG_HEIGHT - PADDING} className="stroke-slate-300" strokeWidth="1" />

                {/* Date Labels (Only show start and end to avoid clutter if many points, or all if few) */}
                {pointCoordinates.map(({ x, date }, index) => {
                    // Show roughly 5 labels max
                    const showLabel = pointCoordinates.length <= 5 || index === 0 || index === pointCoordinates.length - 1 || index % Math.ceil(pointCoordinates.length / 4) === 0;
                    if (!showLabel) return null;

                    return (
                        <text key={index} x={x} y={SVG_HEIGHT - PADDING + 20} textAnchor="middle" className="text-[10px] fill-slate-500">
                            {date}
                        </text>
                    );
                })}

                {/* Area Fill */}
                <path d={areaPath} fill="url(#chartGradient)" />

                {/* Trend Line */}
                {trendLine && (
                    <line
                        x1={trendLine.x1} y1={trendLine.y1}
                        x2={trendLine.x2} y2={trendLine.y2}
                        className={cn("stroke-2 stroke-slate-400/60")}
                        strokeDasharray="5,5"
                    />
                )}

                {/* Main Line */}
                <path d={linePath} fill="none" strokeWidth="3" className="stroke-indigo-500 drop-shadow-sm" />

                {/* Data Points */}
                {pointCoordinates.map(({ x, y }, index) => (
                    <g key={index} className="group cursor-pointer">
                        {/* Larger invisible touch target */}
                        <circle cx={x} cy={y} r="15" fill="transparent" onMouseEnter={() => setHoveredIndex(index)} />
                        {/* Visible point */}
                        <circle
                            cx={x}
                            cy={y}
                            r={hoveredIndex === index ? 6 : 4}
                            className={cn(
                                "fill-white stroke-indigo-500 stroke-[3px] transition-all duration-200 ease-out",
                                hoveredIndex === index && "fill-indigo-100"
                            )}
                        />
                    </g>
                ))}
            </svg>

            {/* Tooltip */}
            {hoveredIndex !== null && pointCoordinates[hoveredIndex] && (
                <div
                    className="absolute z-10 p-3 bg-slate-900 text-white text-xs rounded-lg shadow-xl pointer-events-none border border-slate-700 transform -translate-x-1/2 -translate-y-full transition-all duration-200 ease-out"
                    style={{
                        left: `${(pointCoordinates[hoveredIndex].x / SVG_WIDTH) * 100}%`,
                        top: `${(pointCoordinates[hoveredIndex].y / SVG_HEIGHT) * 100}%`,
                        marginTop: '-15px'
                    }}
                >
                    <div className="font-bold text-sm mb-1">{pointCoordinates[hoveredIndex].score}%</div>
                    <div className="font-medium text-slate-300 mb-0.5 whitespace-nowrap">{pointCoordinates[hoveredIndex].name}</div>
                    <div className="text-slate-400">{pointCoordinates[hoveredIndex].date}</div>

                    {/* Tooltip Arrow */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900 border-r border-b border-slate-700"></div>
                </div>
            )}
        </div>
    );
};

const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    description?: string;
}> = ({ icon, title, value, description }) => (
    <Card className="flex items-center p-6 gap-6 card-themed">
        <div className="p-3 rounded-lg shrink-0 kpi-icon-chip">{icon}</div>
        <div className="overflow-hidden">
            <dt className="text-sm font-medium truncate" style={{ color: 'var(--text-secondary)' }}>{title}</dt>
            <dd className="text-3xl font-bold truncate" style={{ color: 'var(--text-main)' }}>{value}</dd>
            {description && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{description}</p>}
        </div>
    </Card>
);

export default StudentProgress;
