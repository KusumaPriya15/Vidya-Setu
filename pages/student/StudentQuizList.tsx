
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { Quiz, QuizAttempt, Course } from '../../types';
import { useAuth } from '../../lib/auth';
import { SearchIcon } from '../../components/ui/Icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { buttonVariants } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/utils';

interface QuizWithDetails extends Quiz {
    courseTitle: string;
    isCompleted: boolean;
    dueDate?: string;
    score?: number;
    totalPoints?: number;
}

const StudentQuizList: React.FC = () => {
    const { user } = useAuth();
    const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);
    const [filteredQuizzes, setFilteredQuizzes] = useState<QuizWithDetails[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('All');
    const [sortConfig, setSortConfig] = useState<{ key: 'title' | 'courseTitle' | 'difficulty' | 'status'; direction: 'ascending' | 'descending' }>({ key: 'title', direction: 'ascending' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchQuizData = async () => {
            if (!user) return;
            setIsLoading(true);
            try {
                const [assignedQuizzes, attempts, allCourses] = await Promise.all([
                    api.getAssignedQuizzesForStudent(user.id),
                    api.getStudentProgress(user.id),
                    api.getCourses()
                ]);
                
                const attemptsMap = new Map<string, QuizAttempt>(attempts.map(a => [a.quizId, a]));
                const courseMap = new Map(allCourses.map((c: Course) => [c.id, c.title]));

                const quizzesWithDetails = assignedQuizzes.map(quiz => {
                    const attempt = attemptsMap.get(quiz.id);
                    return {
                        ...quiz,
                        courseTitle: courseMap.get(quiz.courseId) || 'Unknown Course',
                        isCompleted: !!attempt,
                        score: attempt?.score,
                        totalPoints: attempt?.totalPoints,
                    };
                });

                setQuizzes(quizzesWithDetails);
            } catch (error) {
                console.error("Failed to fetch assigned quizzes and progress", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuizData();
    }, [user]);

    useEffect(() => {
        let result = [...quizzes];

        // Filter by Search Term
        if (searchTerm) {
            result = result.filter(q =>
                q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.courseTitle.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        // Filter by Difficulty
        if (difficultyFilter !== 'All') {
            result = result.filter(q => q.difficulty === difficultyFilter);
        }

        // Sort
        result.sort((a, b) => {
            const { key, direction } = sortConfig;
            
            if (key === 'status') {
                // Not completed (false) should come before completed (true) in ascending order
                if (a.isCompleted < b.isCompleted) return direction === 'ascending' ? -1 : 1;
                if (a.isCompleted > b.isCompleted) return direction === 'ascending' ? 1 : -1;
                return 0;
            } else if (key === 'difficulty') {
                const difficultyOrder = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
                const aOrder = difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0;
                const bOrder = difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0;

                if (aOrder < bOrder) return direction === 'ascending' ? -1 : 1;
                if (aOrder > bOrder) return direction === 'ascending' ? 1 : -1;
                return 0;
            } else {
                // Handles 'title' and 'courseTitle'
                const aVal = a[key].toLowerCase();
                const bVal = b[key].toLowerCase();
                if (aVal < bVal) return direction === 'ascending' ? -1 : 1;
                if (aVal > bVal) return direction === 'ascending' ? 1 : -1;
                return 0;
            }
        });

        setFilteredQuizzes(result);
    }, [searchTerm, difficultyFilter, quizzes, sortConfig]);
    
    if (isLoading) {
        return <div className="text-center p-8" style={{ color: 'var(--text-main)' }}>Loading quizzes...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>My Assigned Quizzes</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Quizzes assigned to you by your instructors.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Input 
                        placeholder="Search quizzes..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full sm:w-64"
                        icon={<SearchIcon className="w-4 h-4" />}
                    />
                    <Select value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value)} className="w-full sm:w-40">
                        <option value="All">All Levels</option>
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                    </Select>
                </div>
            </div>

            <Card className="table-themed overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase table-header-themed">
                                <tr>
                                    <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => setSortConfig({key: 'title', direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'})}>Quiz Title</th>
                                    <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => setSortConfig({key: 'courseTitle', direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'})}>Course</th>
                                    <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => setSortConfig({key: 'difficulty', direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'})}>Difficulty</th>
                                    <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => setSortConfig({key: 'status', direction: sortConfig.direction === 'ascending' ? 'descending' : 'ascending'})}>Status</th>
                                    <th scope="col" className="px-6 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredQuizzes.length > 0 ? (
                                    filteredQuizzes.map((quiz) => (
                                        <tr key={quiz.id} className="table-row-themed">
                                            <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-main)' }}>{quiz.title}</td>
                                            <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{quiz.courseTitle}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline">{quiz.difficulty}</Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                {quiz.isCompleted ? (
                                                    <Badge variant="success">Completed ({quiz.score}/{quiz.totalPoints})</Badge>
                                                ) : (
                                                    <Badge variant="secondary">Pending</Badge>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {quiz.isCompleted ? (
                                                    <Link to={`/student/quiz/${quiz.id}`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>Review</Link>
                                                ) : (
                                                    <Link to={`/student/quiz/${quiz.id}`} className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}>Start Quiz</Link>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center p-8" style={{ color: 'var(--text-secondary)' }}>No quizzes found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentQuizList;
