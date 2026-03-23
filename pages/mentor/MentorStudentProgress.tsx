
import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { User, QuizAttempt, Course, Quiz } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import { cn } from '../../lib/utils';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

// Data structure for aggregated student progress
interface StudentProgressData {
  studentId: string;
  studentName: string;
  courses: {
    [courseId: string]: {
      course: Course;
      attempts: QuizAttempt[];
      progress: number; // Material completion
      lastActivity: string;
      performance: {
        status: 'Excellent' | 'Average' | 'Poor' | 'N/A';
        avgScore: number;
        color: string;
      };
      chartData: { name: string, score: number, date: string }[];
    }
  }
}

// Reusable Line Chart Component (adapted from StudentProgress page)
const LineChart: React.FC<{ data: { name: string, score: number, date: string }[] }> = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const SVG_WIDTH = 500;
    const SVG_HEIGHT = 200;
    const PADDING = 30;

    const pointCoordinates = useMemo(() => {
        if (data.length < 2) return [];
        return data.map((d, index) => {
            const x = PADDING + (index / (data.length - 1)) * (SVG_WIDTH - 2 * PADDING);
            const y = (SVG_HEIGHT - PADDING) - (d.score / 100) * (SVG_HEIGHT - 2 * PADDING);
            return { x, y };
        });
    }, [data]);

    const pathData = useMemo(() => {
        if (pointCoordinates.length < 2) return '';
        return pointCoordinates.map((p, i) => (i === 0 ? 'M' : 'L') + `${p.x} ${p.y}`).join(' ');
    }, [pointCoordinates]);

    if (data.length < 2) {
        return <div className="text-center py-10 text-sm" style={{ color: 'var(--text-secondary)' }}>Not enough quiz attempts to display a trend.</div>;
    }

    return (
        <div className="relative w-full h-56" onMouseLeave={() => setHoveredIndex(null)}>
            <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-full" aria-label="Score trend chart">
                {/* Y-Axis Grid Lines & Labels */}
                {[0, 25, 50, 75, 100].map(label => {
                    const y = (SVG_HEIGHT - PADDING) - (label / 100) * (SVG_HEIGHT - 2 * PADDING);
                    return (
                        <g key={label} style={{ color: 'var(--text-muted)' }}>
                            <text x={PADDING - 8} y={y + 3} textAnchor="end" className="text-xs fill-current">{label}%</text>
                            <line x1={PADDING} x2={SVG_WIDTH - PADDING} y1={y} y2={y} className="stroke-current opacity-50" strokeDasharray="2,4" />
                        </g>
                    );
                })}
                {/* X-Axis Labels */}
                {pointCoordinates.map(({ x }, index) => (
                    <text key={`x-label-${index}`} x={x} y={SVG_HEIGHT - PADDING + 15} textAnchor="middle" className="text-xs fill-current" style={{ color: 'var(--text-secondary)' }}>
                        {data[index].date}
                    </text>
                ))}
                {/* Line Path */}
                <path d={pathData} fill="none" strokeWidth="2" style={{ stroke: 'var(--primary)' }} />
                {/* Points & Hover Area */}
                {pointCoordinates.map(({ x, y }, index) => (
                    <g key={index}>
                        <circle cx={x} cy={y} r={hoveredIndex === index ? 6 : 4} className="transition-all" style={{ fill: 'var(--primary)', stroke: 'var(--card-bg)' }} strokeWidth={2} />
                        <rect x={x - 10} y={y - 10} width="20" height="20" fill="transparent" onMouseEnter={() => setHoveredIndex(index)} />
                    </g>
                ))}
            </svg>
            {hoveredIndex !== null && (
                <div
                    className="absolute p-2 text-xs rounded-md shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full transition-opacity z-10"
                    style={{ backgroundColor: 'var(--text-main)', color: 'var(--card-bg)', left: `${(pointCoordinates[hoveredIndex].x / SVG_WIDTH) * 100}%`, top: `${(pointCoordinates[hoveredIndex].y / SVG_HEIGHT) * 100}%`, marginTop: '-8px' }}
                >
                    <p className="font-semibold whitespace-nowrap">{data[hoveredIndex].name}</p>
                    <p>Score: <span className="font-bold">{data[hoveredIndex].score}%</span></p>
                </div>
            )}
        </div>
    );
};

// Helper to calculate performance
const getPerformanceStatus = (avgScore: number): { status: 'Excellent' | 'Average' | 'Poor' | 'N/A'; color: string } => {
    if (isNaN(avgScore)) return { status: 'N/A', color: 'var(--text-muted)' };
    if (avgScore >= 80) return { status: 'Excellent', color: '#16a34a' }; // green-600
    if (avgScore >= 50) return { status: 'Average', color: '#f59e0b' }; // amber-500
    return { status: 'Poor', color: '#ef4444' }; // red-500
};


const StudentProgressCard: React.FC<{ 
    studentData: StudentProgressData; 
    isExpanded: boolean; 
    onToggle: () => void; 
}> = ({ studentData, isExpanded, onToggle }) => {
    
    return (
        <Card className="card-themed">
            <CardHeader onClick={onToggle} className="cursor-pointer transition-colors" style={{ borderRadius: 'inherit' }}>
                <div className="flex justify-between items-center">
                    <CardTitle style={{ color: 'var(--text-main)' }}>{studentData.studentName}</CardTitle>
                    <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span>{Object.keys(studentData.courses).length} Course(s)</span>
                        <ChevronDownIcon className={cn("w-5 h-5 transition-transform", isExpanded && "rotate-180")} />
                    </div>
                </div>
            </CardHeader>
            {isExpanded && (
                <CardContent className="pt-4 space-y-6" style={{ borderTop: '1px solid var(--border-color)' }}>
                    {Object.values(studentData.courses).map(({ course, progress, attempts, lastActivity, performance, chartData }) => (
                        <div key={course.id} className="p-4 rounded-lg card-nested">
                            <h3 className="text-lg font-semibold">{course.title}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-3 text-sm">
                                <div>
                                    <p style={{ color: 'var(--text-secondary)' }}>Material Completion</p>
                                    <p className="font-semibold" style={{ color: 'var(--text-main)' }}>{progress}%</p>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)' }}>Last Activity</p>
                                    <p className="font-semibold" style={{ color: 'var(--text-main)' }}>{lastActivity}</p>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)' }}>Avg. Score</p>
                                    <p className="font-semibold" style={{ color: 'var(--text-main)' }}>{performance.avgScore}%</p>
                                </div>
                                <div>
                                    <p style={{ color: 'var(--text-secondary)' }}>Performance</p>
                                    <Badge style={{ backgroundColor: performance.color }} className="text-white">{performance.status}</Badge>
                                </div>
                            </div>
                            
                            <h4 className="text-md font-semibold mt-4 mb-2">Quiz Score Trend</h4>
                            <LineChart data={chartData} />
                        </div>
                    ))}
                </CardContent>
            )}
        </Card>
    );
};

const MentorStudentProgress: React.FC = () => {
    const { user } = useAuth();
    const [studentData, setStudentData] = useState<StudentProgressData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

    // Data fetching and processing
    useEffect(() => {
        const fetchData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                // Fetch data scoped to the mentor
                const allCourses = await api.getCourses() as Course[];
                const mentorCourses = allCourses.filter(c => c.mentorId === user.id);
                const mentorCourseMap = new Map(mentorCourses.map(c => [c.id, c]));

                const allQuizzes = await api.getQuizzes() as Quiz[];
                const mentorQuizzes = allQuizzes.filter(q => mentorCourseMap.has(q.courseId));
                const mentorQuizMap = new Map(mentorQuizzes.map(q => [q.id, q]));

                const [allAttempts, allUsers, allViewedMaterials] = await Promise.all([
                    api.getAllAttempts() as Promise<QuizAttempt[]>,
                    api.getUsers() as Promise<User[]>,
                    api.getAllViewedMaterials() as Promise<Record<string, string[]>>
                ]);

                const mentorQuizIds = new Set(mentorQuizzes.map(q => q.id));
                const mentorAttempts = allAttempts.filter(a => mentorQuizIds.has(a.quizId));
                const studentUsers = allUsers.filter(u => u.role === 'student');
                const usersMap = new Map(studentUsers.map(u => [u.id, u.name]));

                // Aggregate data by student
                const analyticsData: { [studentId: string]: StudentProgressData } = {};

                for (const attempt of mentorAttempts) {
                    const studentId = attempt.studentId;
                    if (!usersMap.has(studentId)) continue; // Only process known students

                    const quiz = mentorQuizMap.get(attempt.quizId);
                    if (!quiz) continue;

                    const course = mentorCourseMap.get(quiz.courseId);
                    if (!course) continue;

                    // Initialize student entry if it doesn't exist
                    if (!analyticsData[studentId]) {
                        analyticsData[studentId] = { studentId, studentName: usersMap.get(studentId)!, courses: {} };
                    }
                    
                    // Initialize course entry for the student if it doesn't exist
                    if (!analyticsData[studentId].courses[course.id]) {
                        analyticsData[studentId].courses[course.id] = {
                            course,
                            attempts: [],
                            progress: 0,
                            lastActivity: 'N/A',
                            performance: { status: 'N/A', avgScore: NaN, color: getPerformanceStatus(NaN).color },
                            chartData: []
                        };
                    }
                    analyticsData[studentId].courses[course.id].attempts.push(attempt);
                }

                // Calculate stats for each student's course
                for (const studentId in analyticsData) {
                    const studentViewed = new Set(allViewedMaterials[studentId] || []);
                    for (const courseId in analyticsData[studentId].courses) {
                        const courseData = analyticsData[studentId].courses[courseId];
                        
                        // 1. Material Progress
                        courseData.progress = courseData.course.materials.length > 0
                            ? Math.round((courseData.course.materials.filter(m => studentViewed.has(m.id)).length / courseData.course.materials.length) * 100)
                            : 100;
                        
                        if (courseData.attempts.length > 0) {
                            // Sort attempts by date to find last activity and create chart
                            courseData.attempts.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

                            // 2. Last Activity
                            courseData.lastActivity = new Date(courseData.attempts[courseData.attempts.length - 1].submittedAt).toLocaleDateString();

                            // 3. Performance
                            const totalScore = courseData.attempts.reduce((sum, att) => sum + (att.score / att.totalPoints * 100), 0);
                            const avgScore = Math.round(totalScore / courseData.attempts.length);
                            const perf = getPerformanceStatus(avgScore);
                            courseData.performance = { status: perf.status, avgScore, color: perf.color };

                            // 4. Chart Data
                            courseData.chartData = courseData.attempts.map(att => ({
                                name: mentorQuizMap.get(att.quizId)?.title || 'Quiz',
                                score: Math.round((att.score / att.totalPoints) * 100),
                                date: new Date(att.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            })).slice(-10); // Last 10 attempts
                        }
                    }
                }
                setStudentData(Object.values(analyticsData));
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [user]);

    const filteredStudentData = useMemo(() => {
        if (!searchTerm) return studentData;
        return studentData.filter(student =>
            student.studentName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [studentData, searchTerm]);

    if (isLoading) {
        return <div className="text-center p-8">Loading student progress...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>Student Progress</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Track the performance of students in your courses.</p>
                </div>
                <div className="w-full md:w-auto">
                    <Input
                        placeholder="Search by student name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-64"
                        icon={<SearchIcon className="w-4 h-4" />}
                    />
                </div>
            </div>
            
            {filteredStudentData.length > 0 ? (
                <div className="space-y-4">
                    {filteredStudentData.map(data => (
                        <StudentProgressCard 
                            key={data.studentId}
                            studentData={data}
                            isExpanded={expandedStudentId === data.studentId}
                            onToggle={() => setExpandedStudentId(prev => prev === data.studentId ? null : data.studentId)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 empty-state">
                    <UsersIcon className="w-12 h-12 mx-auto" style={{ color: 'var(--text-muted)' }} />
                    <p className="mt-4 font-semibold" style={{ color: 'var(--text-main)' }}>
                        {studentData.length > 0 ? "No students match your search." : "No student data available."}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {studentData.length > 0 ? "Try a different name." : "Assign quizzes to students to see their progress here."}
                    </p>
                </div>
            )}
        </div>
    );
};

const ChevronDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>;
const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;


export default MentorStudentProgress;
