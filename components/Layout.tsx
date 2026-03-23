import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/DropdownMenu';
import ChatBot from './ChatBot';
import {
    Menu,
    X,
    ChevronDown,
    LayoutDashboard,
    BookOpen,
    Users,
    ClipboardCheck,
    ClipboardList,
    TrendingUp,
    Video,
    MessageCircle,
    HeartHandshake,
    Plus,
    Sparkles,
    FileBarChart,
    BarChart3,
    Settings,
    ShieldCheck,
    ShieldX,
    Info,
    Zap,
} from './ui/Icons';

const iconClass = "w-[18px] h-[18px] mr-3 shrink-0";

const navConfig = {
    student: {
        title: 'Student Dashboard',
        links: [
            { to: '/student', label: 'Dashboard', icon: <LayoutDashboard className={iconClass} /> },
            { to: '/student/my-courses', label: 'My Courses', icon: <BookOpen className={iconClass} /> },
            { to: '/student/quizzes', label: 'Take Quiz', icon: <ClipboardList className={iconClass} /> },
            { to: '/student/progress', label: 'Progress', icon: <TrendingUp className={iconClass} /> },
            { to: '/student/tutoring', label: 'Virtual Tutoring', icon: <Video className={iconClass} /> },
            { to: '/student/mentorship', label: 'Find a Mentor', icon: <HeartHandshake className={iconClass} /> },
            { to: '/forums', label: 'Community Forums', icon: <MessageCircle className={iconClass} /> },
        ]
    },
    mentor: {
        title: 'Instructor Dashboard',
        links: [
            { to: '/mentor', label: 'Dashboard', icon: <LayoutDashboard className={iconClass} /> },
            { to: '/mentor/courses', label: 'My Courses', icon: <BookOpen className={iconClass} /> },
            { to: '/mentor/add-course', label: 'Add Course', icon: <Plus className={iconClass} /> },
            { to: '/mentor/generate-quiz', label: 'Generate Quiz', icon: <Sparkles className={iconClass} /> },
            { to: '/mentor/progress', label: 'Student Progress', icon: <Users className={iconClass} /> },
            { to: '/mentor/tutoring', label: 'Tutoring', icon: <Video className={iconClass} /> },
            { to: '/mentor/mentorship', label: 'Mentorship', icon: <HeartHandshake className={iconClass} /> },
            { to: '/forums', label: 'Community Forums', icon: <MessageCircle className={iconClass} /> },
        ]
    },
    admin: {
        title: 'Admin Dashboard',
        links: [
            { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className={iconClass} /> },
            { to: '/admin/users', label: 'Manage Users', icon: <Users className={iconClass} /> },
            { to: '/admin/analytics', label: 'Course Analytics', icon: <BarChart3 className={iconClass} /> },
            { to: '/admin/progress', label: 'Student Progress', icon: <TrendingUp className={iconClass} /> },
            { to: '/admin/reports', label: 'Reports', icon: <FileBarChart className={iconClass} /> },
            { to: '/admin/settings', label: 'Settings', icon: <Settings className={iconClass} /> },
            { to: '/admin/moderation', label: 'Moderation', icon: <ShieldCheck className={iconClass} /> },
            { to: '/admin/security', label: 'Security', icon: <ShieldX className={iconClass} /> },
            { to: '/forums', label: 'Community Forums', icon: <MessageCircle className={iconClass} /> },
        ]
    }
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const role = user?.role || 'student';
    const config = navConfig[role as keyof typeof navConfig] || navConfig.student;

    // Set data-role attribute on document for CSS theme variables
    useEffect(() => {
        document.documentElement.setAttribute('data-role', role);
        return () => {
            document.documentElement.removeAttribute('data-role');
        };
    }, [role]);

    const SidebarContent = () => (
        <>
            <div className="p-6">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
                    VidyaSetu
                </h1>
                <p className="text-xs mt-1 uppercase tracking-wider font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {config.title}
                </p>
            </div>

            <nav className="flex-1 px-3 md:px-4 space-y-1 overflow-y-auto pb-4 custom-scrollbar">
                {config.links.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={({ isActive }) =>
                            cn(
                                "flex items-center px-3 py-3 md:px-4 text-sm font-medium rounded-lg transition-all duration-200",
                                isActive
                                    ? "bg-[var(--sidebar-active)] text-[var(--primary)] font-semibold"
                                    : "text-[var(--text-secondary)] hover:bg-[var(--sidebar-active)] hover:text-[var(--text-main)]"
                            )
                        }
                    >
                        {link.icon}
                        {link.label}
                    </NavLink>
                ))}
            </nav>
        </>
    );

    return (
        <div className="flex h-screen transition-colors duration-300 bg-gradient-page">
            {/* Desktop Sidebar with Gradient */}
            <aside
                className="hidden md:flex w-64 flex-col sidebar-themed"
            >
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-50 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                >
                    <div
                        className="w-72 h-full animate-in slide-in-from-left duration-300 flex flex-col sidebar-themed"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-end p-4">
                            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                                <X className="w-5 h-5" style={{ color: 'var(--text-main)' }} />
                            </Button>
                        </div>
                        <SidebarContent />
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header
                    className="h-14 md:h-16 border-b flex items-center justify-between px-4 md:px-6 lg:px-8"
                    style={{
                        backgroundColor: 'var(--card-bg)',
                        borderColor: 'var(--border-default)'
                    }}
                >
                    <div className="flex-1 flex items-center gap-2 md:gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setIsMobileMenuOpen(true)}
                            aria-label="Open navigation menu"
                        >
                            <Menu className="w-6 h-6" style={{ color: 'var(--text-main)' }} />
                        </Button>

                        <div
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-full"
                            style={{
                                backgroundColor: 'var(--kpi-icon-chip)',
                                color: 'var(--primary)',
                                border: '1px solid var(--kpi-icon-chip-border, var(--border-default))'
                            }}
                        >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Cloud Storage Active</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div
                            className="flex items-center gap-2 md:gap-3 pl-2 md:pl-4 border-l"
                            style={{ borderColor: 'var(--border-default)' }}
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold leading-none" style={{ color: 'var(--text-heading, var(--text-main))' }}>{user?.name}</p>
                                <p className="text-xs mt-1 leading-none" style={{ color: 'var(--text-secondary)' }}>{user?.email}</p>
                            </div>
                            <div
                                className="w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md"
                                style={{
                                    background: 'var(--gradient-btn-primary, var(--primary))',
                                    color: 'var(--primary-foreground)',
                                }}
                            >
                                {user?.name?.charAt(0) || '?'}
                            </div>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 ml-1">
                                        <ChevronDown className="w-4 h-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 dropdown-themed">
                                    <DropdownMenuLabel style={{ color: 'var(--text-heading, var(--text-main))' }}>My Account</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate('/profile')} className="dropdown-item-themed">Profile</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/settings')} className="dropdown-item-themed">Settings</DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                                        Log out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Content Scroll Area */}
                <main className="flex-1 overflow-y-auto">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
                        {children}
                    </div>
                </main>
            </div>

            <ChatBot />
        </div>
    );
};

export default Layout;
