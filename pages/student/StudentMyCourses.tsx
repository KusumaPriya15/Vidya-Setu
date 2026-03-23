
import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, CourseMaterial } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { cn } from '../../lib/utils';
import { Input } from '../../components/ui/Input';
import {
    SearchIcon,
    SearchXIcon,
    BookIcon,
    LinkIcon,
    FileTextIcon,
    VideoIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    PlayIcon,
    ChevronDownIcon
} from '../../components/ui/Icons';

// --- HELPER COMPONENTS ---
const getMaterialIcon = (type: CourseMaterial['type']) => {
    switch(type) {
        case 'link': return <LinkIcon className="w-5 h-5 text-blue-400 shrink-0" />;
        case 'pdf': return <FileTextIcon className="w-5 h-5 text-red-400 shrink-0" />;
        case 'video': return <VideoIcon className="w-5 h-5 text-purple-400 shrink-0" />;
        default: return null;
    }
}

interface CourseWithProgress extends Course {
    progress: number;
}

const StudentMyCourses: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<CourseWithProgress[]>([]);
    const [filteredCourses, setFilteredCourses] = useState<CourseWithProgress[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewedMaterials, setViewedMaterials] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const calculateProgress = (course: Course, viewed: Set<string>): number => {
        if (!course.materials || course.materials.length === 0) {
            return 0; // Show 0 if no materials, so 'Start Course' is shown
        }
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

    const toggleSection = (courseId: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [courseId]: !prev[courseId]
        }));
    };
    
    if (isLoading) {
        return <div className="text-center p-8" style={{ color: 'var(--text-main)' }}>Loading your courses...</div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-main)' }}>My Courses</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Your assigned courses and learning materials.</p>
                </div>
                <div className="w-full md:w-auto">
                    <Input
                        type="text"
                        placeholder="Search courses or instructors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-64"
                        icon={<SearchIcon className="w-5 h-5" style={{ color: 'var(--text-muted)' }}/>}
                        aria-label="Search my courses"
                    />
                </div>
            </div>

            {courses.length > 0 ? (
                filteredCourses.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2">
                        {filteredCourses.map(course => (
                            <Card key={course.id} className="card-themed flex flex-col overflow-hidden">
                                <CardContent className="p-6 flex-grow">
                                    <div className="flex justify-between items-center gap-4">
                                        <div className="flex-1">
                                            <h2 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>{course.title}</h2>
                                            <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{course.description}</p>
                                        </div>
                                        <Button
                                            className="shrink-0 flex items-center gap-2"
                                            onClick={() => toggleSection(course.id)}
                                        >
                                            {course.progress > 0 ? (
                                                <>Continue <ArrowRightIcon className="w-4 h-4" /></>
                                            ) : (
                                                <>Start Course <PlayIcon className="w-4 h-4" /></>
                                            )}
                                        </Button>
                                    </div>
                                    <div className="mt-6">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Progress</span>
                                            <span className="text-sm font-bold" style={{ color: 'var(--text-main)' }}>{course.progress}%</span>
                                        </div>
                                        <div className="w-full rounded-full h-2.5 progress-track">
                                            <div className="h-2.5 rounded-full transition-all duration-500 progress-fill" style={{ width: `${course.progress}%` }}></div>
                                        </div>
                                    </div>
                                </CardContent>
                                
                                <div className="flex" style={{ borderTop: '1px solid var(--border-default)' }}>
                                    <button onClick={() => toggleSection(course.id)} className="flex-1 flex items-center justify-center gap-2 p-4 text-sm font-medium transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                        Materials ({course.materials.length})
                                        <ChevronDownIcon className={cn('w-5 h-5 transition-transform', expandedSections[course.id] && 'rotate-180')} />
                                    </button>
                                </div>

                                {expandedSections[course.id] && (
                                    <div className="p-6" style={{ borderTop: '1px solid var(--border-default)', backgroundColor: 'var(--sidebar-bg)' }}>
                                        {course.materials.length > 0 ? (
                                            <ul className="space-y-3">
                                                {course.materials.map(material => (
                                                    <li key={material.id}>
                                                        <a href={material.url} target="_blank" rel="noopener noreferrer" onClick={() => handleMaterialClick(material.id)} className="flex items-center gap-3 p-3 rounded-md material-item">
                                                            {getMaterialIcon(material.type)}
                                                            <div className="flex-1 overflow-hidden">
                                                                <p className="font-semibold truncate" style={{ color: 'var(--text-main)' }}>{material.title}</p>
                                                            </div>
                                                            {viewedMaterials.has(material.id) && <CheckCircleIcon className="w-5 h-5 text-green-500 shrink-0" />}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>No materials available for this course.</p>
                                        )}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 rounded-lg empty-state">
                        <SearchXIcon className="w-16 h-16 mx-auto" style={{ color: 'var(--text-muted)' }} />
                        <p className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>No Courses Found</p>
                        <p style={{ color: 'var(--text-secondary)' }}>Your search for "{searchTerm}" did not match any courses.</p>
                    </div>
                )
            ) : (
                <div className="text-center py-16 rounded-lg empty-state">
                    <BookIcon className="w-16 h-16 mx-auto" style={{ color: 'var(--primary)' }} />
                    <p className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>No Courses Assigned</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Your instructor hasn't assigned any courses to you yet.</p>
                </div>
            )}
        </div>
    );
};

export default StudentMyCourses;
