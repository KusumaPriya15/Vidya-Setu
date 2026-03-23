import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course } from '../../types';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import {
    SearchIcon,
    SearchXIcon,
    BookOpen,
    ArrowRightIcon,
} from '../../components/ui/Icons';

interface CourseWithProgress extends Course {
    progress: number;
}

// Softer gradients for a premium feel
const COURSE_GRADIENTS = [
    'from-indigo-500/90 to-purple-600/90',
    'from-blue-500/90 to-cyan-600/90',
    'from-emerald-500/90 to-teal-600/90',
    'from-rose-500/90 to-orange-600/90',
    'from-fuchsia-500/90 to-pink-600/90',
    'from-violet-500/90 to-indigo-600/90',
];

const getCourseGradient = (title: string) =>
    COURSE_GRADIENTS[title.charCodeAt(0) % COURSE_GRADIENTS.length];

// Circular progress ring
const ProgressRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 48 }) => {
    const strokeWidth = 4;
    const r = (size - strokeWidth * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <div className="relative flex items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-md rounded-full shadow-sm" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90 absolute">
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={strokeWidth} />
                <circle
                    cx={size / 2} cy={size / 2} r={r} fill="none"
                    stroke="white" strokeWidth={strokeWidth}
                    strokeDasharray={circ} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
            </svg>
            <span className="text-white font-bold text-xs" style={{ fontSize: size * 0.25 }}>
                {pct}%
            </span>
        </div>
    );
};

const StudentMyCourses: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<CourseWithProgress[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<CourseWithProgress[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const calculateProgress = (course: Course, viewed: Set<string>): number => {
        if (!course.materials || course.materials.length === 0) return 0;
        const viewedCount = course.materials.filter(m => viewed.has(m.id)).length;
        return Math.round((viewedCount / course.materials.length) * 100);
    };

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const [assignedCourses, viewedMaterialIds] = await Promise.all([
                api.getAssignedCoursesForStudent(user.id),
                api.getViewedMaterialsForStudent(user.id)
            ]);

            const viewedSet = new Set(viewedMaterialIds as string[]);

            const coursesWithProgress = assignedCourses.map(course => ({
                ...course,
                progress: calculateProgress(course, viewedSet)
            }));
            setCourses(coursesWithProgress);
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        const filtered = courses.filter(course =>
            course.title.toLowerCase().includes(lowercasedFilter) ||
            course.instructorName.toLowerCase().includes(lowercasedFilter)
        );
        setFilteredCourses(filtered);
    }, [searchTerm, courses]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide animate-pulse">Loading your courses...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="max-w-xl">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-2">My Courses</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Continue your learning journey and track your progress.</p>
                </div>
                <div className="w-full md:w-72">
                    <Input
                        type="text"
                        placeholder="Search courses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        icon={<SearchIcon className="w-5 h-5 text-slate-400" />}
                    />
                </div>
            </div>

            {/* Courses Grid */}
            {courses.length > 0 ? (
                filteredCourses.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                        {filteredCourses.map(course => (
                            <div 
                                key={course.id} 
                                onClick={() => navigate(`/student/my-courses/${course.id}`)}
                                className="group flex flex-col relative rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer hover:-translate-y-1.5"
                            >
                                {/* Banner */}
                                <div className={cn('h-36 w-full relative overflow-hidden bg-gradient-to-br', getCourseGradient(course.title))}>
                                    {/* Abstract Pattern Overlay */}
                                    <div className="absolute inset-0 opacity-[0.15] mix-blend-overlay">
                                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <defs>
                                                <pattern id={`pattern-${course.id}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                                    <circle cx="2" cy="2" r="2" fill="currentColor" />
                                                </pattern>
                                            </defs>
                                            <rect width="100" height="100" fill={`url(#pattern-${course.id})`} />
                                        </svg>
                                    </div>

                                    {/* Progress Ring */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <ProgressRing pct={course.progress} size={52} />
                                    </div>
                                    
                                    {/* Materials Count Pill */}
                                    <div className="absolute bottom-4 left-4 z-10 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-xs font-semibold shadow-sm border border-white/10">
                                        {course.materials.length} Materials
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-1">
                                    <div className="mb-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                            {course.difficulty}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-xl font-bold leading-tight text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                        {course.title}
                                    </h3>
                                    
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-6 leading-relaxed flex-1">
                                        {course.description}
                                    </p>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-800/80">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700">
                                                {course.instructorName.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 max-w-[100px] truncate">
                                                {course.instructorName}
                                            </span>
                                        </div>

                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white dark:group-hover:bg-indigo-500 transition-all duration-300 shadow-sm">
                                            <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 px-4 rounded-[2rem] bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                            <SearchXIcon className="w-10 h-10 text-slate-400" />
                        </div>
                        <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Matches Found</p>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                            We couldn't find any courses matching "{searchTerm}". Try adjusting your search.
                        </p>
                    </div>
                )
            ) : (
                <div className="text-center py-20 px-4 rounded-[2rem] bg-indigo-50/50 dark:bg-indigo-900/10 border border-dashed border-indigo-200 dark:border-indigo-800/50">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-indigo-500" />
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mb-2">Your Dashboard is Empty</p>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                        You haven't been assigned any courses yet. Check back later when your instructor uploads new content.
                    </p>
                </div>
            )}
        </div>
    );
};

export default StudentMyCourses;
