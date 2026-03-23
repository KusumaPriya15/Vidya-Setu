
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Course, CourseMaterial } from '../../types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/Card';
import { Button, buttonVariants } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/utils';
import { FileIcon, LightbulbIcon } from '../../components/ui/Icons';

const MentorCourseManagement: React.FC = () => {
    const { user } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    
    const fetchCourses = async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const allCourses = await api.getCourses();
            setCourses(allCourses.filter(c => c.mentorId === user.id));
        } catch (error) {
            console.error("Failed to fetch courses", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [user]);

    const handleEditClick = (course: Course) => {
        setSelectedCourse(course);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (course: Course) => {
        setSelectedCourse(course);
        setIsDeleteModalOpen(true);
    };

    if (isLoading) {
        return <div className="text-center p-8">Loading courses...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
                 <Link to="/mentor/add-course" className={buttonVariants()}>Create Course</Link>
            </div>

            {courses.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {courses.map(course => (
                        <Card key={course.id} className="flex flex-col card-themed">
                            <CardHeader>
                                <CardTitle>{course.title}</CardTitle>
                                <CardDescription>{course.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-3">
                                <div className="flex gap-2">
                                    <Badge variant="secondary">{course.difficulty}</Badge>
                                    <Badge variant="outline">{course.materials?.length || 0} Materials</Badge>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {course.topics?.map(topic => <Badge key={topic}>{topic}</Badge>)}
                                </div>
                            </CardContent>
                            <CardFooter className="grid grid-cols-3 gap-2">
                                <Link to={`/mentor/course/${course.id}`} className={cn(buttonVariants({ variant: 'default', size: 'sm' }))}>Manage</Link>
                                <Button variant="outline" size="sm" onClick={() => handleEditClick(course)}>Edit</Button>
                                <Button variant="outline" size="sm" className="text-red-600 border-red-600/50 hover:bg-red-50 hover:text-red-700" onClick={() => handleDeleteClick(course)}>Delete</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <LightbulbIcon className="w-[62px] h-[62px] mx-auto text-yellow-500" />
                    <p className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-main)' }}>Share Your Knowledge!</p>
                    <p style={{ color: 'var(--text-secondary)' }}>Click "Create Course" to build your first learning experience.</p>
                </div>
            )}
            
            {selectedCourse && (
                <>
                    <EditCourseDialog
                        isOpen={isEditModalOpen}
                        onClose={() => setIsEditModalOpen(false)}
                        onCourseUpdated={fetchCourses}
                        course={selectedCourse}
                    />
                    <DeleteCourseDialog
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onCourseDeleted={fetchCourses}
                        course={selectedCourse}
                    />
                </>
            )}
        </div>
    );
};

// --- Dialog Components ---
const CourseForm: React.FC<{
    course?: Course;
    onSave: (courseData: Omit<Course, 'id' | 'createdAt' | 'mentorId'>) => Promise<void>;
    onClose: () => void;
    isSaving: boolean;
}> = ({ course, onSave, onClose, isSaving }) => {
    const [title, setTitle] = useState(course?.title || '');
    const [description, setDescription] = useState(course?.description || '');
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>(course?.difficulty || 'Beginner');
    const [topics, setTopics] = useState(course?.topics?.join(', ') || '');
    const [materials, setMaterials] = useState<CourseMaterial[]>(course?.materials || []);
    const [newMaterialTitle, setNewMaterialTitle] = useState('');
    const [newMaterialType, setNewMaterialType] = useState<CourseMaterial['type']>('link');
    const [newMaterialUrl, setNewMaterialUrl] = useState('');
    const [error, setError] = useState('');

    const handleAddMaterial = () => {
        if (!newMaterialTitle || !newMaterialUrl) {
            alert("Please provide a title and a URL/file for the material.");
            return;
        }
        const newMaterial: CourseMaterial = {
            id: `temp-${Date.now()}`,
            title: newMaterialTitle,
            type: newMaterialType,
            url: newMaterialUrl,
        };
        setMaterials(prev => [...prev, newMaterial]);
        setNewMaterialTitle('');
        setNewMaterialType('link');
        setNewMaterialUrl('');
    };

    const handleRemoveMaterial = (id: string) => {
        setMaterials(prev => prev.filter(m => m.id !== id));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewMaterialUrl(e.target.files[0].name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await onSave({
                title,
                description,
                difficulty,
                topics: topics.split(',').map(t => t.trim()).filter(Boolean),
                materials: materials.map(({id, ...mat}) => ({...mat, id: id.startsWith('temp-') ? `mat-${Date.now()}` : id})),
                instructorName: course?.instructorName || '',
                institutionName: course?.institutionName || '',
                publishDate: course?.publishDate || new Date().toISOString().split('T')[0],
                language: course?.language || 'English',
            });
            onClose();
        } catch(err) {
            setError('Failed to save course. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="title" className="block text-sm font-medium mb-1">Title</label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                <Input id="description" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
                <label htmlFor="difficulty" className="block text-sm font-medium mb-1">Difficulty</label>
                <Select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value as any)} required>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                </Select>
            </div>
            <div>
                <label htmlFor="topics" className="block text-sm font-medium mb-1">Topics (comma-separated)</label>
                <Input id="topics" value={topics} onChange={e => setTopics(e.target.value)} placeholder="e.g. Variables, Functions, Arrays" required />
            </div>

            <div className="space-y-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <h4 className="text-lg font-medium" style={{ color: 'var(--text-main)' }}>Course Materials</h4>
                {materials.length > 0 && (
                    <ul className="space-y-2 max-h-40 overflow-y-auto p-2 rounded-md" style={{ border: '1px solid var(--border-color)' }}>
                        {materials.map(mat => (
                            <li key={mat.id} className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: 'var(--sidebar-bg)' }}>
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FileIcon className="w-[14px] h-[14px] shrink-0" style={{ color: 'var(--text-secondary)' }} />
                                    <span className="font-medium text-sm truncate" title={mat.title}>{mat.title}</span>
                                </div>
                                <Button type="button" variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleRemoveMaterial(mat.id)}>Remove</Button>
                            </li>
                        ))}
                    </ul>
                )}
                
                <div className="p-4 rounded-lg space-y-3 card-nested">
                    <h5 className="text-md font-semibold" style={{ color: 'var(--text-main)' }}>Add New Material</h5>
                    <Input placeholder="Material Title" value={newMaterialTitle} onChange={e => setNewMaterialTitle(e.target.value)} />
                    <Select value={newMaterialType} onChange={e => { setNewMaterialType(e.target.value as any); setNewMaterialUrl(''); }}>
                        <option value="link">Link</option>
                        <option value="pdf">PDF</option>
                        <option value="video">Video</option>
                    </Select>
                    {newMaterialType === 'link' ? (
                         <Input placeholder="https://example.com" value={newMaterialUrl} onChange={e => setNewMaterialUrl(e.target.value)} />
                    ) : (
                        <Input type="file" onChange={handleFileChange} accept={newMaterialType === 'pdf' ? '.pdf' : 'video/*'} />
                    )}
                    <Button type="button" variant="secondary" onClick={handleAddMaterial} className="w-full">
                        Add to List
                    </Button>
                </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
        </form>
    );
};

interface EditCourseDialogProps { isOpen: boolean; onClose: () => void; onCourseUpdated: () => void; course: Course; }
const EditCourseDialog: React.FC<EditCourseDialogProps> = ({ isOpen, onClose, onCourseUpdated, course }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        if (!isOpen) setIsSubmitting(false);
    }, [isOpen]);

    const handleSave = async (courseData: Omit<Course, 'id' | 'createdAt' | 'mentorId'>) => {
        setIsSubmitting(true);
        await api.updateCourse({ ...course, ...courseData });
        onCourseUpdated();
        setIsSubmitting(false);
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Edit Course">
            <CourseForm
                course={course}
                onSave={handleSave}
                onClose={onClose}
                isSaving={isSubmitting}
            />
        </Dialog>
    );
}

interface DeleteCourseDialogProps { isOpen: boolean; onClose: () => void; onCourseDeleted: () => void; course: Course; }
const DeleteCourseDialog: React.FC<DeleteCourseDialogProps> = ({ isOpen, onClose, onCourseDeleted, course }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');

    useEffect(() => {
        if (isOpen) {
            setConfirmationText('');
        }
    }, [isOpen]);

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await api.deleteCourse(course.id);
            onCourseDeleted();
            onClose();
        } catch (err) {
            console.error("Failed to delete course", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isConfirmationMatch = confirmationText === course.title;

    return (
        <Dialog 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Are you absolutely sure?"
            description="This action is permanent and cannot be undone."
        >
            <div className="space-y-6 pt-2">
                <p className="text-sm">
                    You are about to permanently delete the course <strong className="font-semibold" style={{ color: 'var(--text-main)' }}>"{course.title}"</strong>. This will also remove all associated quizzes and student submission data.
                </p>
                <div>
                    <label htmlFor="delete-confirm" className="block text-sm font-medium mb-1">
                        To confirm this action, type <strong className="font-semibold text-red-600">{course.title}</strong> below:
                    </label>
                    <Input 
                        id="delete-confirm"
                        value={confirmationText}
                        onChange={e => setConfirmationText(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleDelete} 
                        disabled={!isConfirmationMatch || isSubmitting}
                    >
                        {isSubmitting ? 'Deleting...' : 'Delete this course'}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

export default MentorCourseManagement;
