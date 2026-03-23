import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, CourseMaterial } from '../../types';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import {
    ArrowRightIcon,
    LinkIcon,
    FileTextIcon,
    VideoIcon,
    CheckCircle,
    BookOpen,
    PlayIcon
} from '../../components/ui/Icons';
import { ArrowLeft } from 'lucide-react';

interface CourseWithProgress extends Course {
    progress: number;
}

const getMaterialIcon = (type: CourseMaterial['type']) => {
    switch (type) {
        case 'link':  return <LinkIcon    className="w-5 h-5 text-blue-500 shrink-0 group-hover:text-blue-600 transition-colors" />;
        case 'pdf':   return <FileTextIcon className="w-5 h-5 text-rose-500 shrink-0 group-hover:text-rose-600 transition-colors" />;
        case 'video': return <PlayIcon className="w-5 h-5 text-indigo-500 shrink-0 group-hover:text-indigo-600 transition-colors" />;
        default:      return <LinkIcon    className="w-5 h-5 text-slate-500 shrink-0 group-hover:text-slate-600 transition-colors" />;
    }
};

const getMaterialBgColor = (type: CourseMaterial['type']) => {
    switch (type) {
        case 'link':  return 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30';
        case 'pdf':   return 'bg-rose-50/50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/30';
        case 'video': return 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30';
        default:      return 'bg-slate-50/50 dark:bg-slate-900/10 border-slate-100 dark:border-slate-800';
    }
};

const StudentCourseMaterials: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [course, setCourse] = useState<CourseWithProgress | null>(null);
    const [viewedMaterials, setViewedMaterials] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);

    const calculateProgress = (c: Course, viewed: Set<string>): number => {
        if (!c.materials || c.materials.length === 0) return 0;
        const viewedCount = c.materials.filter(m => viewed.has(m.id)).length;
        return Math.round((viewedCount / c.materials.length) * 100);
    };

    const fetchData = useCallback(async () => {
        if (!user || !courseId) return;
        setIsLoading(true);
        try {
            const [assignedCourses, viewedMaterialIds] = await Promise.all([
                api.getAssignedCoursesForStudent(user.id),
                api.getViewedMaterialsForStudent(user.id)
            ]);

            const viewedSet = new Set(viewedMaterialIds as string[]);
            setViewedMaterials(viewedSet);

            const foundCourse = assignedCourses.find(c => c.id === courseId);
            if (foundCourse) {
                setCourse({
                    ...foundCourse,
                    progress: calculateProgress(foundCourse, viewedSet)
                });
            }
        } catch (error) {
            console.error("Failed to fetch course details", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, courseId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleMaterialClick = async (materialId: string) => {
        if (!user || !course) return;
        
        try {
            await api.markMaterialAsViewed(user.id, materialId);
            const newSet = new Set(viewedMaterials);
            newSet.add(materialId);
            setViewedMaterials(newSet);
            setCourse(prev => prev ? { ...prev, progress: calculateProgress(prev, newSet) } : null);
        } catch (error) {
            console.error("Error marking material as viewed", error);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-pulse">Loading course materials...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-md mx-auto p-8 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="w-20 h-20 mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Course Not Found</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8">This course might have been removed or you don't have access to it.</p>
                <Button onClick={() => navigate('/student/my-courses')} className="w-full sm:w-auto shadow-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to My Courses
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            {/* Header / Hero Section */}
            <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 shadow-sm border border-slate-200/60 dark:border-slate-800/60">
                {/* Decorative Background Blob */}
                <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
                
                <div className="relative p-8 md:p-12">
                    <button 
                        onClick={() => navigate('/student/my-courses')}
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors mb-6 group bg-slate-100/50 dark:bg-slate-800/50 px-4 py-2 rounded-full backdrop-blur-sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Back to My Courses
                    </button>
                    
                    <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                        <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/10 dark:ring-indigo-500/20">
                                    {course.difficulty}
                                </span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-1 ring-inset ring-slate-500/10 dark:ring-slate-500/20">
                                    {course.materials.length} Materials
                                </span>
                            </div>
                            
                            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                                {course.title}
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                                {course.description}
                            </p>
                            
                            <div className="flex items-center pt-2">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm ring-2 ring-white dark:ring-slate-900">
                                    {course.instructorName.charAt(0)}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">Instructor</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{course.instructorName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress display */}
                        <div className="w-full md:w-auto shrink-0 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Your Progress</p>
                            <div className="flex items-end gap-3 mb-4">
                                <span className="text-5xl font-black tracking-tighter text-indigo-600 dark:text-indigo-400 leading-none">{course.progress}</span>
                                <span className="text-xl font-bold text-slate-400 dark:text-slate-500 pb-1">%</span>
                            </div>
                            
                            <div className="w-full md:w-48 h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
                                <div 
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${course.progress}%` }}
                                ></div>
                            </div>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-right">
                                {viewedMaterials.size} of {course.materials.length} completed
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Materials List */}
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white inline-flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-500" />
                        Course Content
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Review the materials to complete this course.</p>
                </div>
                
                {course.materials.length > 0 ? (
                    <div className="grid gap-4">
                        {course.materials.map((material, index) => {
                            const isViewed = viewedMaterials.has(material.id);
                            return (
                                <a
                                    key={material.id}
                                    href={material.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => handleMaterialClick(material.id)}
                                    className={cn(
                                        "group relative flex items-center p-4 md:p-5 rounded-2xl transition-all duration-300",
                                        "border bg-white dark:bg-slate-900 shadow-sm hover:shadow-md",
                                        "hover:-translate-y-0.5",
                                        getMaterialBgColor(material.type)
                                    )}
                                >
                                    {/* Number / Status Indicator */}
                                    <div className="shrink-0 w-12 h-12 flex items-center justify-center mr-4 md:mr-6 relative">
                                        {isViewed ? (
                                            <div className="absolute inset-0 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 scale-in-center">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 font-bold group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
                                                {index + 1}
                                            </div>
                                        )}
                                    </div>

                                    {/* Material Info */}
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            {getMaterialIcon(material.type)}
                                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                                                {material.type}
                                            </span>
                                        </div>
                                        <h3 className={cn(
                                            "text-lg font-semibold leading-snug transition-colors truncate",
                                            isViewed 
                                                ? "text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" 
                                                : "text-slate-900 dark:text-white"
                                        )}>
                                            {material.title}
                                        </h3>
                                    </div>
                                    
                                    {/* Link Indicator */}
                                    <div className="shrink-0 self-center hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:border-indigo-200 dark:group-hover:border-indigo-800 shadow-sm transition-all group-hover:scale-110">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-external-link"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-16 px-4 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <FileTextIcon className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Materials Yet</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                            The instructor hasn't added any materials to this course yet. Check back later!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentCourseMaterials;
