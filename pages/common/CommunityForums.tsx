
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { ForumCategory, ForumThread } from '../../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../lib/auth';
import Dialog from '../../components/ui/Dialog';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { validateForumThreadForm } from '../../lib/formValidation';
import { FormError } from '../../components/ui/FormError';

// Icons
const MessageSquareIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;

const CommunityForums: React.FC = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState<ForumCategory[]>([]);
    const [threads, setThreads] = useState<ForumThread[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [cats, allThreads] = await Promise.all([
                api.getForumCategories(),
                api.getForumThreads()
            ]);
            setCategories(cats);
            setThreads(allThreads);
        } catch (error) {
            console.error("Failed to load forum data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredThreads = threads.filter(t => {
        const matchesCategory = selectedCategory === 'all' || t.categoryId === selectedCategory;
        const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    const handleCreateThread = async (data: any) => {
        if (!user) return;
        try {
            await api.createForumThread({
                categoryId: data.categoryId,
                authorId: user.id,
                authorName: user.name,
                title: data.title,
                content: data.content,
                tags: data.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
            });
            setIsCreateModalOpen(false);
            fetchData();
        } catch (error) {
            console.error("Failed to create thread", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Community Forums</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Join the discussion, ask questions, and share knowledge.</p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" /> Start Discussion
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full md:w-64 space-y-4">
                    <Input
                        placeholder="Search topics..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        icon={<SearchIcon className="w-4 h-4" />}
                    />
                    <nav className="space-y-1">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedCategory === 'all' ? 'bg-[var(--kpi-icon-chip)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--kpi-icon-chip)]'}`}
                        >
                            All Categories
                        </button>
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${selectedCategory === cat.id ? 'bg-[var(--kpi-icon-chip)] text-[var(--primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--kpi-icon-chip)]'}`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-4">
                    {isLoading ? <p>Loading discussions...</p> : filteredThreads.length > 0 ? (
                        filteredThreads.map(thread => (
                            <Card key={thread.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{categories.find(c => c.id === thread.categoryId)?.name}</Badge>
                                                <span className="text-xs text-slate-500">Posted by {thread.authorName}</span>
                                            </div>
                                            <Link to={`/forums/thread/${thread.id}`} className="block text-xl font-semibold hover:text-[var(--primary)] transition-colors">
                                                {thread.title}
                                            </Link>
                                            <p style={{ color: 'var(--text-secondary)' }} className="line-clamp-2 text-sm">{thread.content}</p>
                                        </div>
                                        <div className="flex flex-col items-center min-w-[60px] text-slate-500">
                                            <MessageSquareIcon className="w-5 h-5 mb-1" />
                                            <span className="text-sm font-medium">{thread.replyCount}</span>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        {thread.tags.map(tag => (
                                            <span key={tag} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--kpi-icon-chip)', color: 'var(--text-secondary)' }}>#{tag}</span>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg" style={{ borderColor: 'var(--border-strong)' }}>
                            <MessageSquareIcon className="w-12 h-12 mx-auto text-slate-400 mb-3" />
                            <p className="font-semibold text-lg">No Discussions Found</p>
                            <p className="text-slate-500">Be the first to start a conversation in this category!</p>
                        </div>
                    )}
                </div>
            </div>

            <CreateThreadDialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                categories={categories}
                onCreate={handleCreateThread}
            />
        </div>
    );
};

const CreateThreadDialog: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    categories: ForumCategory[];
    onCreate: (data: any) => void;
}> = ({ isOpen, onClose, categories, onCreate }) => {
    const [title, setTitle] = useState('');
    const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [fieldErrors, setFieldErrors] = useState<{ title?: string; content?: string }>({});

    useEffect(() => {
        if (categories.length > 0 && !categoryId) {
            setCategoryId(categories[0].id);
        }
    }, [categories, categoryId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});
        
        // Validate form
        const validation = validateForumThreadForm({ title, content });
        if (!validation.isValid) {
            setFieldErrors(validation.errors);
            return;
        }
        
        onCreate({ title, categoryId, content, tags });
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Start a New Discussion">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <Input 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        required 
                        placeholder="What's on your mind?"
                        error={fieldErrors.title}
                    />
                    {fieldErrors.title && <FormError error={fieldErrors.title} />}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Select value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Content</label>
                    <Textarea 
                        value={content} 
                        onChange={e => setContent(e.target.value)} 
                        required 
                        rows={5} 
                        placeholder="Describe your topic in detail..."
                        error={fieldErrors.content}
                    />
                    {fieldErrors.content && <FormError error={fieldErrors.content} />}
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
                    <Input value={tags} onChange={e => setTags(e.target.value)} placeholder="javascript, react, help" />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Post Discussion</Button>
                </div>
            </form>
        </Dialog>
    );
};

export default CommunityForums;
