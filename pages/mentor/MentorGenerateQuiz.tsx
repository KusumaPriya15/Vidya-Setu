
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth';
import * as api from '../../lib/api';
import { Course, Question, Quiz, User } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useNavigate, Link } from 'react-router-dom';
import { buttonVariants } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import Dialog from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';
import {
    SparklesIcon,
    Trash2Icon,
    BotIcon,
    LoaderIcon,
    CheckIcon,
    FileUpIcon,
    FileIcon,
    RotateCwIcon,
    AlertTriangleIcon,
    PencilIcon
} from '../../components/ui/Icons';

const ErrorAlert = ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
        <div className="p-3 mb-4 flex items-center gap-3 text-sm text-red-800 rounded-lg bg-red-50 border border-red-300" role="alert">
            <AlertTriangleIcon className="w-5 h-5 shrink-0" />
            <div>
                <span className="font-medium">Request Failed:</span> {message}
            </div>
        </div>
    );
};

interface UploadedFile {
    file: File;
    text?: string;
    status: 'pending' | 'processing' | 'ready' | 'error';
}

const MAX_CHAR_LIMIT = 500000;

const MentorGenerateQuiz: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [creationMode, setCreationMode] = useState<'selection' | 'ai'>('selection');
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [topic, setTopic] = useState('');
    const [learningObjectives, setLearningObjectives] = useState('');
    const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
    const [isSuggestingTopics, setIsSuggestingTopics] = useState(false);
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
    const [questionType, setQuestionType] = useState<'mixed' | 'multiple-choice'>('multiple-choice');
    const [numQuestions, setNumQuestions] = useState(5);
    const [quizTitle, setQuizTitle] = useState('');
    const [duration, setDuration] = useState<number>(5);
    const [generatedQuestions, setGeneratedQuestions] = useState<Question[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generationError, setGenerationError] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [fileTypeError, setFileTypeError] = useState<string | null>(null);

    // File Upload State
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Feedback State
    const [feedback, setFeedback] = useState<Record<string, string>>({});
    const [feedbackLoading, setFeedbackLoading] = useState<Record<string, boolean>>({});
    const [regenerationLoading, setRegenerationLoading] = useState<Record<string, boolean>>({});

    // Assignment state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [quizToAssign, setQuizToAssign] = useState<Quiz | null>(null);

    // Auto-save State
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const autoSaveTimeoutRef = useRef<number | null>(null);

    // Draft Restoration State
    const [draftToRestore, setDraftToRestore] = useState<any | null>(null);
    const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
    const DRAFT_KEY_PREFIX = 'vidyasetu_quiz_draft_';

    useEffect(() => {
        const fetchCourses = async () => {
            if (!user) return;
            try {
                const allCourses = await api.getCourses();
                const mentorCourses = allCourses.filter(c => c.mentorId === user.id);
                setCourses(mentorCourses);
                if (mentorCourses.length > 0) {
                    const firstCourse = mentorCourses[0];
                    setSelectedCourse(firstCourse);
                }
            } catch (err) {
                setGenerationError("Failed to load your courses.");
            }
        };
        fetchCourses();
    }, [user]);

    useEffect(() => {
        if (selectedCourse && creationMode === 'ai') {
            try {
                const draftJson = localStorage.getItem(`${DRAFT_KEY_PREFIX}${selectedCourse.id}`);
                if (draftJson) {
                    const draft = JSON.parse(draftJson);
                    setDraftToRestore(draft);
                    setIsRestoreModalOpen(true);
                }
            } catch (e) {
                console.error("Failed to read quiz draft from localStorage", e);
            }
        }
    }, [selectedCourse, creationMode]);

    useEffect(() => {
        if (generatedQuestions.length === 0 || isLoading || !selectedCourse) {
            return;
        }

        if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
        }

        setAutoSaveStatus('idle');

        autoSaveTimeoutRef.current = window.setTimeout(() => {
            setAutoSaveStatus('saving');
            const draft = {
                title: quizTitle,
                questions: generatedQuestions,
                duration: duration,
                timestamp: new Date().toISOString()
            };
            try {
                localStorage.setItem(`${DRAFT_KEY_PREFIX}${selectedCourse.id}`, JSON.stringify(draft));
                setAutoSaveStatus('saved');
                setTimeout(() => setAutoSaveStatus('idle'), 2000);
            } catch (e) {
                console.error("Failed to save quiz draft to localStorage", e);
                setAutoSaveStatus('idle');
            }
        }, 2500);

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [generatedQuestions, quizTitle, duration, selectedCourse, isLoading]);

    const clearDraft = () => {
        if (selectedCourse) {
            localStorage.removeItem(`${DRAFT_KEY_PREFIX}${selectedCourse.id}`);
        }
    };

    const handleRestoreDraft = () => {
        if (draftToRestore) {
            setQuizTitle(draftToRestore.title || '');
            setGeneratedQuestions(draftToRestore.questions || []);
            setDuration(draftToRestore.duration || 5);
        }
        setIsRestoreModalOpen(false);
        setDraftToRestore(null);
    };

    const handleDiscardDraft = () => {
        clearDraft();
        setIsRestoreModalOpen(false);
        setDraftToRestore(null);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFileTypeError(null);
        if (e.target.files) {
            const fileList = Array.from(e.target.files);
            
            // Block image files — the AI only supports text input
            const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg', 'ico'];
            const imageFiles = fileList.filter(f => {
                const ext = f.name.split('.').pop()?.toLowerCase();
                return ext && imageExtensions.includes(ext);
            });
            if (imageFiles.length > 0) {
                setFileTypeError(
                    `Image files (${imageFiles.map(f => f.name).join(', ')}) are not supported. ` +
                    `Please upload only text-based files: TXT, PDF, Word, CSV, Excel, MD, JSON.`
                );
                e.target.value = '';
                return;
            }

            const files: UploadedFile[] = fileList.map(f => ({
                file: f as File,
                status: 'pending' as const
            }));
            setUploadedFiles(prev => [...prev, ...files]);
            processFiles(files);
        }
        e.target.value = '';
    };

    const processFiles = async (files: UploadedFile[]) => {
        const updated = [...uploadedFiles, ...files];
        for (const f of files) {
            const index = updated.findIndex(u => u.file === f.file);
            if (index === -1) continue;

            updated[index].status = 'processing';
            setUploadedFiles([...updated]);

            try {
                const text = await extractTextFromFile(f.file);
                if (!text || text.trim().length < 10) {
                    updated[index].status = 'error';
                    updated[index].text = '';
                } else {
                    updated[index].text = text;
                    updated[index].status = 'ready';
                }
            } catch {
                updated[index].status = 'error';
                updated[index].text = '';
            }
            setUploadedFiles([...updated]);
        }
    };

    const extractTextFromFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
            const textOnlyExtensions = ['txt', 'md', 'json', 'csv', 'xml', 'html', 'htm', 'log'];
            if (!textOnlyExtensions.includes(ext)) {
                // For non-text extensions, read as binary then strip non-printable chars
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target?.result;
                    if (typeof content !== 'string') {
                        reject(new Error('Failed to read file content.'));
                        return;
                    }
                    // Strip binary characters that appear in images/PDFs
                    const cleaned = content.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ').replace(/\s+/g, ' ').trim();
                    if (cleaned.length < 10) {
                        reject(new Error(`Could not extract readable text from ${file.name}.`));
                        return;
                    }
                    const truncated = cleaned.length > MAX_CHAR_LIMIT ? cleaned.substring(0, MAX_CHAR_LIMIT) : cleaned;
                    resolve(truncated);
                };
                reader.onerror = () => reject(new Error('File reading error.'));
                reader.readAsText(file);
                return;
            }

            // Plain text files — simple read
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result;
                if (typeof content !== 'string') {
                    reject(new Error('Failed to read file as text.'));
                    return;
                }
                const truncated = content.length > MAX_CHAR_LIMIT ? content.substring(0, MAX_CHAR_LIMIT) : content;
                resolve(truncated);
            };
            reader.onerror = () => reject(new Error('File reading error.'));
            reader.readAsText(file);
        });
    };

    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSuggestTopics = async () => {
        if (!selectedCourse) return;
        setIsSuggestingTopics(true);
        setGenerationError(null);
        try {
            const topics = await api.generateQuizTopics(selectedCourse.title, selectedCourse.description, selectedCourse.materials);
            setSuggestedTopics(topics);
        } catch (err: any) {
            let msg = err.message || "Failed to suggest topics.";
            if (msg.includes('503') || msg.includes('Overloaded') || msg.includes('quota')) {
                msg = "AI service is busy. Please try again in a moment.";
            }
            setGenerationError(msg);
        } finally {
            setIsSuggestingTopics(false);
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            setGenerationError("Topic Refinement is required.");
            return;
        }

        const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
        const erroredFiles = uploadedFiles.filter(f => f.status === 'error');
        const pendingFiles = uploadedFiles.filter(f => f.status === 'pending' || f.status === 'processing');

        if (pendingFiles.length > 0) {
            setGenerationError("Please wait for all files to finish processing before generating.");
            return;
        }

        if (uploadedFiles.length > 0 && readyFiles.length === 0) {
            setGenerationError("None of the uploaded files could be processed. Please remove them and try uploading text-based files (TXT, PDF, Word, CSV, MD, JSON).");
            return;
        }

        setIsLoading(true);
        setGeneratedQuestions([]);
        setFeedback({});
        setFeedbackLoading({});
        setGenerationError(null);
        setSaveError(null);

        try {
            const combinedContext = readyFiles.map(f => `FILE: ${f.file.name}\n${f.text}`).join('\n\n---\n\n');
            const questions = await api.generateQuizQuestions(
                topic,
                learningObjectives,
                difficulty,
                numQuestions,
                questionType,
                selectedCourse ? { title: selectedCourse.title, description: selectedCourse.description } : { title: 'General', description: '' },
                combinedContext || undefined
            );
            setGeneratedQuestions(questions);
            setQuizTitle(`${topic.split(',')[0].trim()} Assessment`);
        } catch (err: any) {
            let msg = err.message || "Failed to generate questions.";
            if (msg.includes('503') || msg.includes('Overloaded') || msg.includes('quota')) {
                msg = "The AI service is currently experiencing high demand. Please try again in a minute.";
            }
            setGenerationError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveQuiz = async () => {
        if (!selectedCourse || !user || generatedQuestions.length === 0 || !quizTitle) {
            setSaveError("Missing information to save the quiz.");
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            const newQuiz: Omit<Quiz, 'id' | 'createdAt'> = {
                courseId: selectedCourse.id,
                title: quizTitle,
                questions: generatedQuestions,
                difficulty,
                createdBy: user.id,
                duration: duration,
                aiInvolvement: 'fully-generated',
                generatedByAi: true,
                sourceType: uploadedFiles.length > 0 ? 'uploaded-file' : 'topic-prompt',
                sourceFileNames: uploadedFiles.map(f => f.file.name)
            };
            await api.createQuiz(newQuiz);
            clearDraft();
            navigate(`/mentor/course/${selectedCourse.id}`);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save the quiz.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAndAssign = async () => {
        if (!selectedCourse || !user || generatedQuestions.length === 0 || !quizTitle) {
            setSaveError("Missing information to save the quiz.");
            return;
        }
        setIsSaving(true);
        setSaveError(null);
        try {
            const newQuizData: Omit<Quiz, 'id' | 'createdAt'> = {
                courseId: selectedCourse.id,
                title: quizTitle,
                questions: generatedQuestions,
                difficulty,
                createdBy: user.id,
                duration: duration,
                aiInvolvement: 'fully-generated',
                generatedByAi: true,
                sourceType: uploadedFiles.length > 0 ? 'uploaded-file' : 'topic-prompt',
                sourceFileNames: uploadedFiles.map(f => f.file.name)
            };
            const savedQuiz = await api.createQuiz(newQuizData);
            clearDraft();
            setQuizToAssign(savedQuiz);
            setIsAssignModalOpen(true);
        } catch (err: any) {
            setSaveError(err.message || "Failed to save the quiz.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGetFeedback = async (question: Question) => {
        const questionId = question.id;
        setFeedbackLoading(prev => ({ ...prev, [questionId]: true }));
        try {
            const result = await api.getAIFeedbackForQuestion(question);
            setFeedback(prev => ({ ...prev, [questionId]: result }));
        } catch (err: any) {
            console.error("AI feedback failed", err);
        } finally {
            setFeedbackLoading(prev => ({ ...prev, [questionId]: false }));
        }
    };

    const handleRegenerateIndividualQuestion = async (index: number) => {
        const q = generatedQuestions[index];
        setRegenerationLoading(prev => ({ ...prev, [q.id]: true }));
        try {
            const readyFiles = uploadedFiles.filter(f => f.status === 'ready');
            const combinedContext = readyFiles.map(f => `FILE: ${f.file.name}\n${f.text}`).join('\n\n---\n\n');

            const newQ = await api.regenerateQuestionWithAI(
                topic || q.question.substring(0, 50),
                difficulty,
                q.type,
                combinedContext || undefined
            );

            if (newQ) {
                const newQuestions = [...generatedQuestions];
                newQuestions[index] = newQ;
                setGeneratedQuestions(newQuestions);
                setFeedback(prev => {
                    const next = { ...prev };
                    delete next[q.id];
                    return next;
                });
            }
        } catch (err: any) {
            console.error("Regeneration failed", err);
        } finally {
            setRegenerationLoading(prev => ({ ...prev, [q.id]: false }));
        }
    };

    const handleQuestionChange = (index: number, field: string, value: string | string[] | number) => {
        const newQuestions = [...generatedQuestions];
        const questionToUpdate: Question = JSON.parse(JSON.stringify(newQuestions[index]));

        if (field === 'question' && typeof value === 'string') {
            questionToUpdate.question = value;
        } else if (field === 'correctAnswer' && typeof value === 'string') {
            questionToUpdate.correctAnswer = value;
        } else if (field === 'points' && typeof value === 'string') {
            questionToUpdate.points = parseInt(value, 10) || 0;
        } else if (field.startsWith('option-') && typeof value === 'string') {
            const optionIndex = parseInt(field.split('-')[1], 10);
            if (questionToUpdate.options) {
                questionToUpdate.options[optionIndex] = value;
            }
        }

        newQuestions[index] = questionToUpdate;
        setGeneratedQuestions(newQuestions);
    };

    const handleRemoveQuestion = (index: number) => {
        setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
    };

    if (courses.length === 0) {
        return (
            <div className="text-center p-8 bg-slate-50 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">No Courses Found</h2>
                <p className="text-slate-500 mb-6">You need to create a course before you can generate a quiz for it.</p>
                <Link to="/mentor/add-course" className={cn(buttonVariants({ variant: 'default' }))}>
                    Create Your First Course
                </Link>
            </div>
        );
    }

    if (creationMode === 'selection') {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-extrabold tracking-tight">Create New Quiz</h1>
                    <p className="text-slate-500">Choose your preferred method to build an assessment.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* AI Mode Card */}
                    <Card
                        className="group relative overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all cursor-pointer bg-white shadow-xl"
                        onClick={() => setCreationMode('ai')}
                    >
                        <div className="absolute top-0 right-0 p-3">
                            <Badge className="bg-indigo-600 text-white border-0">Recommended</Badge>
                        </div>
                        <CardHeader className="text-center pt-10">
                            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <SparklesIcon className="w-10 h-10 text-indigo-600" />
                            </div>
                            <CardTitle className="text-2xl">Magic AI Generator</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Derived questions directly from your learning materials (PDF, TXT, etc.) using Gemini AI.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-8 text-sm text-slate-600 text-center">
                            <p>✓ Strictly follows course materials</p>
                            <p>✓ Instant pedagogical analysis</p>
                            <p>✓ Multiple choice or mixed formats</p>
                            <Button className="mt-4 w-full bg-indigo-600 group-hover:bg-indigo-700">Start Generating</Button>
                        </CardContent>
                    </Card>

                    {/* Manual Mode Card */}
                    <Card
                        className="group relative overflow-hidden border-2 border-transparent hover:border-violet-500 transition-all cursor-pointer bg-white shadow-xl"
                        onClick={() => navigate('/mentor/manual-quiz')}
                    >
                        <CardHeader className="text-center pt-10">
                            <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                <PencilIcon className="w-10 h-10 text-violet-600" />
                            </div>
                            <CardTitle className="text-2xl">Pro Manual Builder</CardTitle>
                            <CardDescription className="text-base mt-2">
                                Full creative control. Write your own questions with optional AI pedagogical assistance.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-8 text-sm text-slate-600 text-center">
                            <p>✓ Complete control over every word</p>
                            <p>✓ Assisted Bloom's Taxonomy tagging</p>
                            <p>✓ Unlimited layouts & formats</p>
                            <Button variant="outline" className="mt-4 w-full border-violet-600 text-violet-600 group-hover:bg-violet-50">Start Building</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center">
                <Button variant="ghost" size="sm" onClick={() => setCreationMode('selection')} className="text-slate-500">
                    ← Back to selection
                </Button>
                {autoSaveStatus === 'saved' && (
                    <Badge variant="outline" className="text-green-600 border-green-200">
                        <CheckIcon className="w-3 h-3 mr-1" /> Draft Saved
                    </Badge>
                )}
            </div>

            <Card className="border-indigo-100 overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <SparklesIcon className="w-7 h-7 text-indigo-500" />
                        <span>AI-Driven Quiz Generator</span>
                    </CardTitle>
                    <CardDescription className="text-base">
                        Select a course and provide learning materials. Our AI will derive an accurate assessment strictly from your sources.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleGenerate}>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="course" className="block text-sm font-semibold mb-2 text-slate-700">Target Course</label>
                                <Select id="course" value={selectedCourse?.id || ''} onChange={e => setSelectedCourse(courses.find(c => c.id === e.target.value) || null)}>
                                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-slate-700">Topic Refinement <span className="text-indigo-500">*</span></label>
                                <div className="flex gap-2">
                                    <Input
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        placeholder="e.g., Specific focus area..."
                                        required
                                    />
                                    <Button type="button" variant="outline" size="icon" onClick={handleSuggestTopics} disabled={isSuggestingTopics || !selectedCourse} title="Suggest Topics from Course">
                                        <BotIcon className="w-5 h-5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* File Upload Zone */}
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-slate-700">Knowledge Source Materials</label>
                            <div
                                className="border-2 border-dashed border-slate-300 rounded-xl p-8 bg-slate-50/50 hover:bg-slate-100 transition-all text-center cursor-pointer group"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept=".txt,.pdf,.doc,.docx,.csv,.xlsx,.md,.json"
                                />
                                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <FileUpIcon className="w-7 h-7 text-indigo-600" />
                                </div>
                                <p className="font-bold text-slate-900">Upload learning materials</p>
                                <p className="text-sm text-slate-500 mt-1">Drag & drop your academic files here (PDF, Word, TXT, Excel, etc.)</p>
                            </div>

                            {fileTypeError && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-600 font-medium">{fileTypeError}</p>
                                </div>
                            )}

                            {uploadedFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {uploadedFiles.map((f, i) => {
                                    const isError = f.status === 'error';
                                    return (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                                            <div className="flex items-center gap-3">
                                                <div className={isError ? "p-2 bg-red-100 rounded text-red-500" : "p-2 bg-slate-100 rounded text-indigo-500"}>
                                                    {f.status === 'processing' ? <LoaderIcon className="w-4 h-4 animate-spin" /> : isError ? <AlertTriangleIcon className="w-4 h-4" /> : <FileIcon className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{f.file.name}</p>
                                                    <p className="text-[10px] uppercase font-bold text-slate-400">
                                                        {f.status === 'error' ? 'Failed — unsupported format' : `${f.status} • ${(f.file.size / 1024).toFixed(1)} KB`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={(e) => { e.stopPropagation(); removeFile(i); }}>
                                                <Trash2Icon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                                </div>
                            )}
                        </div>

                        {suggestedTopics.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Quick Suggestions:</p>
                                <div className="flex flex-wrap gap-2">
                                    {suggestedTopics.map((sTopic, i) => (
                                        <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-indigo-100 py-1.5 px-3" onClick={() => setTopic(sTopic)}>
                                            {sTopic}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                            <div>
                                <label htmlFor="difficulty" className="block text-sm font-semibold mb-2">Target Difficulty</label>
                                <Select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as any)}>
                                    <option>Beginner</option>
                                    <option>Intermediate</option>
                                    <option>Advanced</option>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="questionType" className="block text-sm font-semibold mb-2">Structure</label>
                                <Select id="questionType" value={questionType} onChange={e => setQuestionType(e.target.value as any)}>
                                    <option value="multiple-choice">Multiple Choice (MCQ)</option>
                                    <option value="mixed">Mixed Types</option>
                                </Select>
                            </div>
                            <div>
                                <label htmlFor="numQuestions" className="block text-sm font-semibold mb-2">Item Count</label>
                                <Input id="numQuestions" type="number" min="1" max="20" value={numQuestions} onChange={e => setNumQuestions(parseInt(e.target.value))} />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch pb-8">
                        <ErrorAlert message={generationError} />
                        <Button type="submit" disabled={isLoading || !topic.trim()} className="w-full h-12 text-lg shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700">
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <LoaderIcon className="w-5 h-5 animate-spin" />
                                    Analyzing Knowledge Source...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <SparklesIcon className="w-5 h-5" />
                                    Generate Expert Quiz
                                </span>
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>

            {generatedQuestions.length > 0 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-500">
                    <Card className="border-indigo-200 shadow-xl">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle className="text-xl">Preview & Edit Draft</CardTitle>
                                    <CardDescription>Review items before publishing. All content is derived from your source files.</CardDescription>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="outline" className="text-indigo-600 border-indigo-200">Source: File Based</Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                                <div>
                                    <label htmlFor="quizTitle" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Quiz Title</label>
                                    <Input id="quizTitle" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} required className="font-semibold" />
                                </div>
                                <div>
                                    <label htmlFor="quiz-duration" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Time Limit (min)</label>
                                    <Select id="quiz-duration" value={duration} onChange={e => setDuration(parseInt(e.target.value))}>
                                        <option value={5}>5 Minutes</option>
                                        <option value={10}>10 Minutes</option>
                                        <option value={15}>15 Minutes</option>
                                        <option value={20}>20 Minutes</option>
                                        <option value={30}>30 Minutes</option>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            {generatedQuestions.map((q, index) => (
                                <div key={q.id} className="p-5 border border-slate-200 rounded-xl space-y-4 bg-white transition-shadow hover:shadow-sm">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-indigo-600">
                                                {index + 1}
                                            </span>
                                            {q.bloomsTaxonomy && (
                                                <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-normal">
                                                    {q.bloomsTaxonomy}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRegenerateIndividualQuestion(index)}
                                                disabled={regenerationLoading[q.id]}
                                                className="text-xs h-8 text-amber-600"
                                            >
                                                {regenerationLoading[q.id] ? <LoaderIcon className="w-3 h-3 mr-2 animate-spin" /> : <RotateCwIcon className="w-3 h-3 mr-2" />}
                                                Regenerate
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleGetFeedback(q)}
                                                disabled={feedbackLoading[q.id]}
                                                className="text-xs h-8 text-indigo-600"
                                            >
                                                {feedbackLoading[q.id] ? <LoaderIcon className="w-3 h-3 mr-2 animate-spin" /> : <BotIcon className="w-3 h-3 mr-2" />}
                                                Clarify
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:bg-red-50"
                                                onClick={() => handleRemoveQuestion(index)}
                                            >
                                                <Trash2Icon className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-4 pl-1">
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Question Text</label>
                                            <Textarea value={q.question} onChange={e => handleQuestionChange(index, 'question', e.target.value)} rows={2} className="resize-none" />
                                        </div>

                                        {q.type === 'multiple-choice' && q.options && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {q.options.map((opt, i) => (
                                                    <div key={i} className="flex gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-0.5 block">Option {i + 1}</label>
                                                            <Input
                                                                value={opt}
                                                                onChange={e => handleQuestionChange(index, `option-${i}`, e.target.value)}
                                                                className={cn(opt === q.correctAnswer && "border-green-500 bg-green-50/20")}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Correct Key</label>
                                                <Input value={q.correctAnswer} onChange={e => handleQuestionChange(index, 'correctAnswer', e.target.value)} className="bg-slate-50 dark:bg-slate-900 border-dashed" />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Points Allocation</label>
                                                <Input type="number" value={q.points} onChange={e => handleQuestionChange(index, 'points', e.target.value)} />
                                            </div>
                                        </div>

                                        {feedback[q.id] && (
                                            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-sm italic text-indigo-700 dark:text-indigo-300 flex gap-3 animate-in fade-in duration-300">
                                                <BotIcon className="w-5 h-5 shrink-0" />
                                                <p>"{feedback[q.id]}"</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="flex-col items-stretch gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                            <ErrorAlert message={saveError} />
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button onClick={handleSaveQuiz} disabled={isSaving} variant="outline" className="flex-1 h-11">
                                    {isSaving ? 'Processing...' : 'Save Draft'}
                                </Button>
                                <Button onClick={handleSaveAndAssign} disabled={isSaving} className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/10">
                                    {isSaving ? 'Processing...' : 'Finalize & Assign Students'}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </div>
            )}

            {quizToAssign && (
                <AssignQuizDialog
                    isOpen={isAssignModalOpen}
                    onClose={() => {
                        setIsAssignModalOpen(false);
                        if (selectedCourse) {
                            navigate(`/mentor/course/${selectedCourse.id}`);
                        }
                    }}
                    quiz={quizToAssign}
                />
            )}

            {draftToRestore && (
                <Dialog
                    isOpen={isRestoreModalOpen}
                    onClose={handleDiscardDraft}
                    title="Restore Previous Workspace?"
                    description={`We found an unsaved quiz draft for this course from ${new Date(draftToRestore.timestamp).toLocaleString()}. Would you like to resume?`}
                >
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="ghost" onClick={handleDiscardDraft} className="text-red-500">Discard Draft</Button>
                        <Button onClick={handleRestoreDraft}>Restore Workspace</Button>
                    </div>
                </Dialog>
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
        if (isOpen) {
            api.getUsers().then(allUsers => {
                setStudents(allUsers.filter(u => u.role === 'student'));
            });
            api.getQuizAssignments(quiz.id).then(assigned => {
                setAssignedStudentIds(assigned);
            }).catch(() => setAssignedStudentIds([]));
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
        } catch (err) {
            setError("Failed to assign quiz.");
            setIsAssigning(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title={`Assign Quiz: ${quiz.title}`}>
            <div className="space-y-4">
                {successMessage ? (
                    <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-xl">
                        <CheckIcon className="w-12 h-12 text-green-500 mx-auto mb-4" />
                        <p className="font-bold text-green-700 dark:text-green-300 text-lg">{successMessage}</p>
                    </div>
                ) : (
                    <>
                        <div>
                            <label className="block text-sm font-semibold mb-2">Select Target Students</label>
                            <div className="border rounded-xl max-h-60 overflow-y-auto p-2 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex items-center p-3 border-b dark:border-slate-800">
                                    <input
                                        type="checkbox"
                                        id="select-all"
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        checked={selectedStudentIds.length === students.length && students.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                    <label htmlFor="select-all" className="ml-3 font-bold text-sm">Select All Students</label>
                                </div>
                                {students.map(student => {
                                    const isAssigned = assignedStudentIds.includes(student.id);
                                    return (
                                        <div key={student.id} className={cn("flex items-center p-3 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition-colors", isAssigned ? "opacity-75" : "")}>
                                            <input
                                                type="checkbox"
                                                id={`student-${student.id}`}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                checked={isAssigned || selectedStudentIds.includes(student.id)}
                                                disabled={isAssigned}
                                                onChange={() => handleStudentSelect(student.id)}
                                            />
                                            <div className="ml-3 flex items-center gap-3">
                                                <div>
                                                    <label htmlFor={`student-${student.id}`} className="block text-sm font-medium">{student.name}</label>
                                                    <p className="text-[10px] text-slate-500">{student.email}</p>
                                                </div>
                                                {isAssigned && <Badge variant="secondary" className="text-[10px] py-0 px-2 h-4">Assigned</Badge>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="due-date" className="block text-sm font-semibold mb-1.5">Due Date (Optional)</label>
                            <Input id="due-date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button onClick={handleAssign} disabled={isAssigning} className="bg-indigo-600 hover:bg-indigo-700">
                                {isAssigning ? 'Assigning...' : 'Confirm Assignments'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Dialog>
    )
}

export default MentorGenerateQuiz;
