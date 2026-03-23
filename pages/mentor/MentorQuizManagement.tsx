
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, Quiz, Question, User } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button, buttonVariants } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/utils';
import { HelpCircleIcon } from '../../components/ui/Icons';

interface MentorQuizManagementProps {
    isTabView?: boolean;
    course?: Course;
}

const MentorQuizManagement: React.FC<MentorQuizManagementProps> = ({ isTabView = false, course: courseProp }) => {
    const { courseId: paramCourseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<Course | null>(courseProp || null);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [isLoading, setIsLoading] = useState(!courseProp);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

    const courseId = courseProp?.id || paramCourseId;

    const fetchQuizzes = async () => {
        if(courseId) {
            setIsLoading(true);
            try {
                const courseQuizzes = await api.getQuizzesByCourse(courseId);
                setQuizzes(courseQuizzes);
            } catch (err) {
                console.error("Failed to fetch quizzes", err);
            } finally {
                setIsLoading(false);
            }
        }
    }

    useEffect(() => {
        const fetchCourseData = async () => {
            if (!courseId || courseProp) {
                if (courseProp) {
                    setCourse(courseProp);
                    await fetchQuizzes();
                }
                return;
            };
            setIsLoading(true);
            try {
                const courseData = await api.getCourseById(courseId);
                setCourse(courseData);
                if (courseData) {
                    const courseQuizzes = await api.getQuizzesByCourse(courseData.id);
                    setQuizzes(courseQuizzes);
                }
            } catch (error) {
                console.error("Failed to fetch course and quizzes", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourseData();
    }, [courseId, courseProp]);


    const handleAssignClick = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsAssignModalOpen(true);
    };

    const handleDeleteClick = (quiz: Quiz) => {
        setSelectedQuiz(quiz);
        setIsDeleteModalOpen(true);
    };

    if (isLoading && !course) {
        return <div className="text-center p-8">Loading quizzes...</div>;
    }
    
    if (!course) {
        return <div className="text-center p-8">Course not found.</div>;
    }

    return (
        <div className="space-y-6">
            {!isTabView ? (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <Link to="/mentor/courses" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>← Back to Courses</Link>
                        <h1 className="text-3xl font-bold tracking-tight">{course.title} Quizzes</h1>
                        <p style={{ color: 'var(--text-secondary)' }}>Manage and assign quizzes for this course.</p>
                    </div>
                     <Link to="/mentor/generate-quiz"><Button>Create New Quiz</Button></Link>
                </div>
            ) : (
                <div className="flex justify-end">
                    <Link to="/mentor/generate-quiz"><Button>Create New Quiz</Button></Link>
                </div>
            )}
            
            {quizzes.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {quizzes.map(quiz => (
                       <Card key={quiz.id} className="flex flex-col card-themed">
                            <CardHeader>
                                <CardTitle>{quiz.title}</CardTitle>
                                <CardDescription>A quiz based on this course's topics.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">{quiz.difficulty}</Badge>
                                    <Badge variant="outline">{quiz.questions.length} Questions</Badge>
                                     {quiz.duration && <Badge variant="outline">{quiz.duration} min</Badge>}
                                </div>
                                {course.topics.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-secondary)' }}>Course Topics</p>
                                        <div className="flex flex-wrap gap-1">
                                            {course.topics.map(topic => (
                                                <Badge key={topic} variant="outline">{topic}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="grid grid-cols-3 gap-2">
                                 <Button variant="default" size="sm" onClick={() => handleAssignClick(quiz)}>
                                    Assign
                                 </Button>
                                 <Link to={`/mentor/quiz/${quiz.id}/edit`} className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}>
                                    Edit
                                 </Link>
                                 <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(quiz)}>
                                    Delete
                                 </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="empty-state">
                    <HelpCircleIcon className="w-[62px] h-[62px] mx-auto" style={{ color: 'var(--primary)' }} />
                    <p className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>No Quizzes Yet</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Click "Create New Quiz" to start building assessments.</p>
                </div>
            )}
            
            {selectedQuiz && (
                <>
                    <AssignQuizDialog 
                        isOpen={isAssignModalOpen}
                        onClose={() => setIsAssignModalOpen(false)}
                        quiz={selectedQuiz}
                    />
                    <DeleteQuizDialog
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        quiz={selectedQuiz}
                        onQuizDeleted={fetchQuizzes}
                    />
                </>
            )}
        </div>
    );
};


// --- DIALOGS ---

interface AssignQuizDialogProps { isOpen: boolean; onClose: () => void; quiz: Quiz; }
const AssignQuizDialog: React.FC<AssignQuizDialogProps> = ({ isOpen, onClose, quiz }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [assignedStudentIds, setAssignedStudentIds] = useState<string[]>([]);
    const [dueDate, setDueDate] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if(isOpen) {
            api.getUsers().then(allUsers => {
                setStudents(allUsers.filter(u => u.role === 'student'));
            });
            api.getQuizAssignments(quiz.id).then(assigned => {
                setAssignedStudentIds(assigned);
            }).catch(() => setAssignedStudentIds([]));
            
            // Reset state on open
            setSelectedStudentIds([]);
            setDueDate('');
            setError('');
            setSuccessMessage('');
        }
    }, [isOpen]);

    const handleStudentSelect = (studentId: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = () => {
        const unassignedStudents = students.filter(s => !assignedStudentIds.includes(s.id));
        if (selectedStudentIds.length === unassignedStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(unassignedStudents.map(s => s.id));
        }
    };

    const handleAssign = async () => {
        if (selectedStudentIds.length === 0) {
            setError("Please select at least one student.");
            return;
        }
        setIsAssigning(true);
        setError('');
        try {
            await api.createQuizAssignments(quiz.id, selectedStudentIds, dueDate || undefined);
            setSuccessMessage(`Quiz successfully assigned to ${selectedStudentIds.length} student(s).`);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch(err) {
            setError("Failed to assign quiz.");
        } finally {
            setIsAssigning(false);
        }
    };
    
    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Assign Quiz: ${quiz.title}`}>
             <div className="space-y-4">
                {successMessage ? (
                    <div className="text-center p-4 bg-green-50 rounded-md">
                        <p className="font-semibold text-green-700">{successMessage}</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-medium mb-2">Select Students</label>
                            <div className="rounded-md max-h-60 overflow-y-auto p-2" style={{ border: '1px solid var(--border-color)' }}>
                                <div className="flex items-center p-2" style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <input 
                                        type="checkbox" 
                                        id="select-all" 
                                        className="w-4 h-4 mr-3"
                                        checked={selectedStudentIds.length === students.length && students.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                    <label htmlFor="select-all" className="font-medium">Select All</label>
                                </div>
                                {students.map(student => {
                                    const isAssigned = assignedStudentIds.includes(student.id);
                                    return (
                                        <div key={student.id} className={cn("flex items-center p-2 rounded transition-colors", isAssigned ? "opacity-75" : "")} style={{ backgroundColor: 'transparent' }}>
                                            <input 
                                                type="checkbox" 
                                                id={`student-${student.id}`} 
                                                className="w-4 h-4 mr-3"
                                                checked={isAssigned || selectedStudentIds.includes(student.id)}
                                                disabled={isAssigned}
                                                onChange={() => handleStudentSelect(student.id)}
                                            />
                                            <label htmlFor={`student-${student.id}`} className="flex items-center">
                                                {student.name} ({student.email})
                                                {isAssigned && <Badge variant="secondary" className="ml-2 text-[10px] py-0 px-2 h-4">Assigned</Badge>}
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="due-date" className="block text-sm font-medium mb-1">Due Date (Optional)</label>
                            <Input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleAssign} disabled={isAssigning}>{isAssigning ? 'Assigning...' : 'Assign Quiz'}</Button>
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    )
}

interface DeleteQuizDialogProps { isOpen: boolean; onClose: () => void; quiz: Quiz; onQuizDeleted: () => void; }
const DeleteQuizDialog: React.FC<DeleteQuizDialogProps> = ({ isOpen, onClose, quiz, onQuizDeleted }) => {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.deleteQuiz(quiz.id);
            onQuizDeleted();
            onClose();
        } catch (err) {
            console.error("Failed to delete quiz", err);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Delete Quiz"
            description={`Are you sure you want to delete "${quiz.title}"? This action will also remove all associated student attempts and cannot be undone.`}
        >
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>{isDeleting ? 'Deleting...' : 'Delete Quiz'}</Button>
            </div>
        </Dialog>
    );
}



export default MentorQuizManagement;
