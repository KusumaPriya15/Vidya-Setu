import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, CourseMaterial } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { cn } from '../../lib/utils';
import {
    SearchIcon,
    SearchXIcon,
    BookOpen,
    LinkIcon,
    FileTextIcon,
    VideoIcon,
    CheckCircle,
    PlayIcon,
    ArrowRightIcon,
    GraduationCap,
    X,
} from '../../components/ui/Icons';

interface CourseWithProgress extends Course {
    progress: number;
}

// Deterministic gradient per course based on title char code
const COURSE_GRADIENTS = [
    'from-violet-500 to-indigo-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-rose-600',
    'from-pink-500 to-purple-600',
    'from-amber-500 to-orange-600',
];

const getCourseGradient = (title: string) =>
    COURSE_GRADIENTS[title.charCodeAt(0) % COURSE_GRADIENTS.length];

const getMaterialIcon = (type: CourseMaterial['type']) => {
    switch (type) {
        case 'link':  return <LinkIcon    className="w-4 h-4 text-blue-400 shrink-0" />;
        case 'pdf':   return <FileTextIcon className="w-4 h-4 text-red-400 shrink-0" />;
        case 'video': return <VideoIcon   className="w-4 h-4 text-purple-400 shrink-0" />;
        default:      return <LinkIcon    className="w-4 h-4 text-slate-400 shrink-0" />;
    }
};

// Circular progress ring
const ProgressRing: React.FC<{ pct: number; size?: number }> = ({ pct, size = 52 }) => {
    const r = (size - 8) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke="white" strokeWidth="4"
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text
                x="50%" y="50%"
                dominantBaseline="middle" textAnchor="middle"
                style={{ fill: 'white', fontSize: size * 0.22, fontWeight: 700 }}
            >
                {pct}%
            </text>
        </svg>
    );
};

const StudentMyCourses: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseWithProgress[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<CourseWithProgress[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewedMaterials, setViewedMaterials] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);

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
            setViewedMaterials(viewedSet);

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

    const handleMaterialClick = async (materialId: string) => {
        if (!user) return;
        await api.markMaterialAsViewed(user.id, materialId);
        setViewedMaterials(prev => {
            const newSet = new Set<string>(prev);
            newSet.add(materialId);
            setCourses(currentCourses => currentCourses.map(course => ({
                ...course,
                progress: calculateProgress(course, newSet)
            })));
            return newSet;
        });
    };

    if (isLoading) {
        return <div className="text-center p-8" style={{ color: 'var(--text-main)' }}>Loading your courses...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight leading-tight" style={{ color: 'var(--text-main)' }}>My Courses</h1>
                    <p className="mt-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>Explore your assigned courses and track your progress.</p>
                </div>
                <div className="w-full md:w-auto">
                    <Input
                        type="text"
                        placeholder="Search courses or instructors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64"
                        icon={<SearchIcon className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
                        aria-label="Search my courses"
                    />
                </div>
            </div>

            {/* Courses Grid */}
            {courses.length > 0 ? (
                filteredCourses.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredCourses.map(course => (
                            <div key={course.id} className="group relative rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300">
                                {/* Gradient Banner */}
                                <div className={cn('bg-gradient-to-br', getCourseGradient(course.title), 'h-32 relative overflow-hidden')}>
                                    <div className="absolute inset-0 opacity-20">
                                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                            <defs>
                                                <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                                    <circle cx="10" cy="10" r="2" fill="white" opacity="0.3" />
                                                </pattern>
                                            </defs>
                                            <rect width="100" height="100" fill="url(#pattern)" />
                                        </svg>
                                    </div>

                                    {/* Progress Ring */}
                                    <div className="absolute top-4 right-4">
                                        <ProgressRing pct={course.progress} size={56} />
                                    </div>

                                    {/* Course Icon */}
                                    <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-white/20 backdrop-blur-sm">
                                        <GraduationCap className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5 bg-white dark:bg-slate-900" style={{ backgroundColor: 'var(--card-bg)' }}>
                                    <div className="space-y-3">
                                        {/* Title & Instructor */}
                                        <div>
                                            <h3 className="text-lg font-bold leading-tight line-clamp-2" style={{ color: 'var(--text-main)' }}>
                                                {course.title}
                                            </h3>
                                            <p className="text-sm mt-1 leading-tight" style={{ color: 'var(--text-secondary)' }}>
                                                by {course.instructorName}
                                            </p>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm line-clamp-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                            {course.description}
                                        </p>

                                        {/* Meta Info */}
                                        <div className="flex items-center gap-2 flex-wrap pt-2">
                                            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--kpi-icon-chip)', color: 'var(--text-secondary)' }}>
                                                {course.difficulty}
                                            </span>
                                            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: 'var(--kpi-icon-chip)', color: 'var(--text-secondary)' }}>
                                                {course.materials.length} Materials
                                            </span>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 pt-3">
                                            <Button
                                                onClick={() => setExpandedCourseId(expandedCourseId === course.id ? null : course.id)}
                                                className="flex-1 flex items-center justify-center gap-2 h-9"
                                                variant={expandedCourseId === course.id ? 'default' : 'outline'}
                                            >
                                                {expandedCourseId === course.id ? (
                                                    <>Materials <X className="w-4 h-4" /></>
                                                ) : (
                                                    <>Materials <ArrowRightIcon className="w-4 h-4" /></>
                                                )}
                                            </Button>
                                            {course.progress > 0 && (
                                                <Button className="flex-1 flex items-center justify-center gap-2 h-9">
                                                    Continue <ArrowRightIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {course.progress === 0 && (
                                                <Button className="flex-1 flex items-center justify-center gap-2 h-9">
                                                    Start <PlayIcon className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Materials Drawer */}
                                {expandedCourseId === course.id && (
                                    <div className="border-t" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--sidebar-bg)' }}>
                                        <div className="p-5 space-y-3 max-h-64 overflow-y-auto">
                                            {course.materials.length > 0 ? (
                                                course.materials.map(material => (
                                                    <a
                                                        key={material.id}
                                                        href={material.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={() => handleMaterialClick(material.id)}
                                                        className="flex items-center gap-3 p-3 rounded-lg transition-all hover:scale-105"
                                                        style={{
                                                            backgroundColor: 'var(--card-bg)',
                                                            border: '1px solid var(--border-default)'
                                                        }}
                                                    >
                                                        {getMaterialIcon(material.type)}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate leading-tight" style={{ color: 'var(--text-main)' }}>
                                                                {material.title}
                                                            </p>
                                                            <p className="text-xs leading-tight" style={{ color: 'var(--text-secondary)' }}>
                                                                {material.type.toUpperCase()}
                                                            </p>
                                                        </div>
                                                        {viewedMaterials.has(material.id) && (
                                                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                        )}
                                                    </a>
                                                ))
                                            ) : (
                                                <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>
                                                    No materials available.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 rounded-lg" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                        <SearchXIcon className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--text-muted)' }} />
                        <p className="text-lg font-semibold leading-tight" style={{ color: 'var(--text-main)' }}>No Courses Found</p>
                        <p className="text-sm mt-2 leading-tight" style={{ color: 'var(--text-secondary)' }}>
                            Your search for "{searchTerm}" did not match any courses.
                        </p>
                    </div>
                )
            ) : (
                <div className="text-center py-16 rounded-lg" style={{ backgroundColor: 'var(--kpi-icon-chip)' }}>
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" style={{ color: 'var(--primary)' }} />
                    <p className="text-lg font-semibold leading-tight" style={{ color: 'var(--text-main)' }}>No Courses Assigned</p>
                    <p className="text-sm mt-2 leading-tight" style={{ color: 'var(--text-secondary)' }}>
                        Your instructor hasn't assigned any courses to you yet.
                    </p>
                </div>
            )}
        </div>
    );
};

export default StudentMyCourses;
