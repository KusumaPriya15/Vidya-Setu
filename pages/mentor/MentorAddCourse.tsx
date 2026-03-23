
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { validateCourseForm } from '../../lib/formValidation';
import { FormError } from '../../components/ui/FormError';
import { Course, CourseMaterial } from '../../types';

type MaterialType = 'Youtube' | 'PDF' | 'Link';
interface TempMaterial {
    tempId: number;
    title: string;
    type: MaterialType;
    resource: string;
}

const MentorAddCourse: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [courseName, setCourseName] = useState('');
    const [publishDate, setPublishDate] = useState(new Date().toISOString().split('T')[0]);
    const [instructorName, setInstructorName] = useState('');
    const [institutionName, setInstitutionName] = useState('');
    const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Advanced');
    const [description, setDescription] = useState('');
    const [language, setLanguage] = useState('English');
    const [topics, setTopics] = useState('');

    // Materials State
    const [materials, setMaterials] = useState<TempMaterial[]>([]);
    const [newMaterialTitle, setNewMaterialTitle] = useState('');
    const [newMaterialType, setNewMaterialType] = useState<MaterialType>('Youtube');
    const [newMaterialResource, setNewMaterialResource] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ 
        title?: string; 
        description?: string; 
        topics?: string;
    }>({});

    useEffect(() => {
        if (user) {
            setInstructorName(user.name);
            setInstitutionName(`${user.name}-VidyaSetu`);
        }
    }, [user]);

    const handleAddMaterial = () => {
        if (!newMaterialTitle || !newMaterialResource) {
            alert('Please provide a title and a resource for the material.');
            return;
        }
        setMaterials(prev => [...prev, {
            tempId: Date.now(),
            title: newMaterialTitle,
            type: newMaterialType,
            resource: newMaterialResource,
        }]);
        setNewMaterialTitle('');
        setNewMaterialType('Youtube');
        setNewMaterialResource('');
    };

    const handleRemoveMaterial = (tempId: number) => {
        setMaterials(prev => prev.filter(m => m.tempId !== tempId));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewMaterialResource(e.target.files[0].name);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            setError("You must be logged in to create a course.");
            return;
        }
        
        setError('');
        setFieldErrors({});
        
        // Validate form
        const validation = validateCourseForm({
            title: courseName,
            description,
            topics
        });
        
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            return;
        }
        
        setIsSubmitting(true);
        try {
            const processedMaterials: CourseMaterial[] = materials.map((mat, index) => {
                let url = '';
                let type: CourseMaterial['type'] = 'link';
                switch (mat.type) {
                    case 'Youtube':
                        type = 'video';
                        url = `https://www.youtube.com/watch?v=${mat.resource}`;
                        break;
                    case 'PDF':
                        type = 'pdf';
                        url = mat.resource;
                        break;
                    case 'Link':
                        type = 'link';
                        url = mat.resource;
                        break;
                }
                return { id: `mat-${Date.now()}-${index}`, title: mat.title, type, url };
            });

            const courseData = {
                title: courseName,
                description,
                difficulty,
                mentorId: user.id,
                instructorName,
                institutionName,
                publishDate,
                language,
                topics: topics.split(',').map(t => t.trim()).filter(Boolean),
                materials: processedMaterials,
            };
            await api.createCourse(courseData);
            navigate('/mentor/courses');
        } catch (err: any) {
            setError(err.message || 'Failed to create course.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderResourceInput = () => {
        switch (newMaterialType) {
            case 'Youtube':
                return (
                    <FormField label="YouTube Video ID">
                        <Input value={newMaterialResource} onChange={e => setNewMaterialResource(e.target.value)} placeholder="e.g., dQw4w9WgXcQ" />
                    </FormField>
                );
            case 'PDF':
                return (
                    <FormField label="PDF Document">
                        <Input type="file" onChange={handleFileChange} accept=".pdf" />
                    </FormField>
                );
            case 'Link':
                return (
                    <FormField label="External Link URL">
                        <Input type="url" value={newMaterialResource} onChange={e => setNewMaterialResource(e.target.value)} placeholder="https://example.com/resource" />
                    </FormField>
                );
            default:
                return null;
        }
    }

    return (
        <div className="max-w-4xl mx-auto p-8 bg-white border border-slate-200 rounded-xl shadow-xl">
            <div className="flex items-center gap-3 mb-8">
                <FileTextIcon className="w-8 h-8 text-indigo-600" />
                <h1 className="text-3xl font-bold text-slate-900">New Course</h1>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <FormField label="Course Name" required>
                        <Input 
                            value={courseName} 
                            onChange={e => setCourseName(e.target.value)} 
                            required 
                            error={fieldErrors.title}
                        />
                        {fieldErrors.title && <FormError error={fieldErrors.title} />}
                    </FormField>
                    <FormField label="Publish Date" required>
                        <Input type="date" value={publishDate} onChange={e => setPublishDate(e.target.value)} required />
                    </FormField>
                    <FormField label="Instructor Name" required>
                        <Input value={instructorName} readOnly disabled />
                    </FormField>
                    <FormField label="Institution Name" required>
                        <Input value={institutionName} readOnly disabled />
                    </FormField>
                    <FormField label="Skill Level" required>
                        <Select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} required>
                            <option>Beginner</option>
                            <option>Intermediate</option>
                            <option>Advanced</option>
                        </Select>
                    </FormField>
                    <FormField label="Course Language" required>
                        <Select value={language} onChange={e => setLanguage(e.target.value)} required>
                            <option>English</option>
                            <option>Spanish</option>
                            <option>French</option>
                            <option>German</option>
                        </Select>
                    </FormField>
                    <div className="md:col-span-2">
                        <FormField label="Topics (comma separated)" required>
                            <Input 
                                value={topics} 
                                onChange={e => setTopics(e.target.value)} 
                                placeholder="e.g. React, Hooks, Props, State" 
                                required 
                                error={fieldErrors.topics}
                            />
                            {fieldErrors.topics && <FormError error={fieldErrors.topics} />}
                        </FormField>
                    </div>
                    <div className="md:col-span-2">
                        <FormField label="Course Description" required>
                            <Textarea 
                                value={description} 
                                onChange={e => setDescription(e.target.value)} 
                                required 
                                rows={4} 
                                error={fieldErrors.description}
                            />
                            {fieldErrors.description && <FormError error={fieldErrors.description} />}
                        </FormField>
                    </div>

                    <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-200">
                        <h2 className="text-xl font-bold text-slate-900">Course Materials ({materials.length})</h2>
                        {materials.length > 0 && (
                            <div className="space-y-2 rounded-md border border-slate-200 p-2 max-h-60 overflow-y-auto">
                                {materials.map(mat => (
                                    <div key={mat.tempId} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {getMaterialIcon(mat.type)}
                                            <div className="overflow-hidden">
                                                <p className="font-semibold text-slate-900 truncate">{mat.title}</p>
                                                <p className="text-xs text-slate-500 truncate">{mat.resource}</p>
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => handleRemoveMaterial(mat.tempId)}>Remove</Button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="p-4 border border-dashed border-slate-300 rounded-lg space-y-4">
                            <h3 className="font-semibold text-slate-900">Add a New Material</h3>
                            <FormField label="Material Title">
                                <Input value={newMaterialTitle} onChange={e => setNewMaterialTitle(e.target.value)} />
                            </FormField>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField label="Material Type">
                                    <Select value={newMaterialType} onChange={e => { setNewMaterialType(e.target.value as MaterialType); setNewMaterialResource(''); }}>
                                        <option>Youtube</option>
                                        <option>PDF</option>
                                        <option>Link</option>
                                    </Select>
                                </FormField>
                                {renderResourceInput()}
                            </div>
                            <Button type="button" variant="secondary" onClick={handleAddMaterial}>Add Material</Button>
                        </div>
                    </div>
                </div>

                {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                <div className="flex justify-center pt-6">
                    <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-10 py-3 text-lg h-auto flex items-center gap-2">
                        <PlusCircleIcon className="w-6 h-6" />
                        {isSubmitting ? 'Adding Course...' : 'Add Course'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

const FormField: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <div className="space-y-1">
        <label className="text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
        case 'Link': return <LinkIcon className="w-5 h-5 text-blue-400 shrink-0" />;
        case 'PDF': return <FileTextIcon className="w-5 h-5 text-red-400 shrink-0" />;
        case 'Youtube': return <VideoIcon className="w-5 h-5 text-purple-400 shrink-0" />;
        default: return null;
    }
}

const FileTextIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>;
const PlusCircleIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>;
const LinkIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72" /></svg>;
const VideoIcon = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" ry="2" /></svg>;

export default MentorAddCourse;
