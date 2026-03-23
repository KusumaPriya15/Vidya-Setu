
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { User } from '../../types';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button, buttonVariants } from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { logActivity } from '../../lib/activityLog';
import { checkPasswordStrength } from '../../lib/utils';
import PasswordStrengthMeter from '../../components/ui/PasswordStrengthMeter';
import { cn } from '../../lib/utils';

type SortKey = 'name' | 'email' | 'role' | 'createdAt' | 'accountStatus';

const AdminUserManagement: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'createdAt', direction: 'descending' });

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const allUsers = await api.getUsers();
            setUsers(allUsers);
        } catch (error) {
            console.error("Failed to fetch users", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const processedUsers = useMemo(() => {
        let filteredUsers = [...users];

        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user =>
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (sortConfig !== null) {
            filteredUsers.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return filteredUsers;
    }, [users, sortConfig, searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, itemsPerPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [sortConfig]);

    const totalPages = Math.ceil(processedUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = processedUsers.slice(startIndex, startIndex + itemsPerPage);


    const requestSort = (key: SortKey) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortKey) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        return <span className="ml-1 text-xs">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>;
    };

    const handleEditClick = (user: User) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleResetPasswordClick = (user: User) => {
        setSelectedUser(user);
        setIsResetPasswordModalOpen(true);
    };

    const handleStatusClick = (user: User) => {
        setSelectedUser(user);
        setIsStatusModalOpen(true);
    };

    const getRoleBadgeVariant = (role: User['role']): 'destructive' | 'secondary' | 'success' => {
        if (role === 'admin') return 'destructive'; // Red
        if (role === 'mentor') return 'secondary'; // Gray/Secondary
        return 'success'; // Green
    }

    const TableHeader: React.FC<{ sortKey: SortKey; children: React.ReactNode }> = ({ sortKey, children }) => (
        <th scope="col" className="px-6 py-4 cursor-pointer hover:text-[var(--primary)] transition-colors uppercase tracking-wider text-xs font-semibold text-left" style={{ color: 'var(--text-secondary)' }} onClick={() => requestSort(sortKey)}>
            <div className="flex items-center">
                {children}
                {getSortIndicator(sortKey)}
            </div>
        </th>
    );

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let end = Math.min(totalPages, start + maxVisiblePages - 1);

        if (end - start + 1 < maxVisiblePages) {
            start = Math.max(1, end - maxVisiblePages + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>View, create, edit, and delete users.</p>
                </div>
                <Link to="/admin/users/create" className={cn(buttonVariants({ variant: 'default' }), "bg-violet-600 hover:bg-violet-700 text-white")}>Create User</Link>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="w-full md:w-auto">
                    <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full md:w-64"
                        icon={<SearchIcon className="w-4 h-4" />}
                    />
                </div>
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <span>Rows per page:</span>
                    <Select
                        value={itemsPerPage.toString()}
                        onChange={e => setItemsPerPage(parseInt(e.target.value))}
                        className="w-20 h-9"
                    >
                        <option value="10">10</option>
                        <option value="25">25</option>
                        <option value="50">50</option>
                        <option value="100">100</option>
                    </Select>
                </div>
            </div>

            <Card className="card-themed">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--kpi-icon-chip)' }}>
                                <tr>
                                    <TableHeader sortKey="name">Name</TableHeader>
                                    <TableHeader sortKey="email">Email</TableHeader>
                                    <TableHeader sortKey="role">Role</TableHeader>
                                    <TableHeader sortKey="accountStatus">Status</TableHeader>
                                    <TableHeader sortKey="createdAt">Joined On</TableHeader>
                                    <th scope="col" className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8" style={{ color: 'var(--text-secondary)' }}>Loading users...</td>
                                    </tr>
                                ) : paginatedUsers.length > 0 ? (
                                    paginatedUsers.map(user => (
                                        <tr key={user.id} className="transition-colors hover:bg-[var(--kpi-icon-chip)]">
                                            <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-main)' }}>{user.name}</td>
                                            <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                                                    {user.role === 'mentor' ? 'Instructor' : user.role}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant={user.accountStatus === 'ENABLED' ? 'success' : 'destructive'}>
                                                    {user.accountStatus}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4" style={{ color: 'var(--text-secondary)' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex gap-3 justify-end items-center">
                                                    <button
                                                        aria-label={`${user.accountStatus === 'ENABLED' ? 'Disable' : 'Enable'} ${user.name}`}
                                                        title={`${user.accountStatus === 'ENABLED' ? 'Disable' : 'Enable'} account`}
                                                        className={cn("transition-colors", user.accountStatus === 'ENABLED' ? "text-yellow-500 hover:text-yellow-600" : "text-green-500 hover:text-green-600")}
                                                        onClick={() => handleStatusClick(user)}
                                                        disabled={user.id === currentUser?.id}
                                                    >
                                                        {user.accountStatus === 'ENABLED' ? <BanIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}
                                                    </button>

                                                    <button
                                                        aria-label={`Edit ${user.name}`}
                                                        className="transition-colors hover:text-[var(--primary)] text-slate-500"
                                                        onClick={() => handleEditClick(user)}
                                                    >
                                                        <PencilIcon className="w-5 h-5" />
                                                    </button>

                                                    <button
                                                        aria-label={`Reset password for ${user.name}`}
                                                        title="Reset Password"
                                                        className="transition-colors hover:text-[var(--primary)] text-slate-500"
                                                        onClick={() => handleResetPasswordClick(user)}
                                                    >
                                                        <LockIcon className="w-5 h-5" />
                                                    </button>

                                                    <button
                                                        aria-label={`Delete ${user.name}`}
                                                        className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={user.id === currentUser?.id}
                                                        title={user.id === currentUser?.id ? "You cannot delete your own account." : `Delete ${user.name}`}
                                                    >
                                                        <Trash2Icon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center p-8" style={{ color: 'var(--text-secondary)' }}>
                                            <div className="flex flex-col items-center gap-2">
                                                <UserSearchIcon className="w-[38px] h-[38px] text-slate-500" />
                                                <span className="font-semibold">No users found</span>
                                                <span>Try adjusting your search term.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {totalPages > 1 && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + itemsPerPage, processedUsers.length)}</strong> of <strong>{processedUsers.length}</strong> users
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                            className="hidden sm:flex hover:bg-[var(--kpi-icon-chip)]"
                        >
                            First
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="hover:bg-[var(--kpi-icon-chip)]"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </Button>

                        <div className="flex items-center gap-1 mx-2">
                            {getPageNumbers().map(pageNum => (
                                <Button
                                    key={pageNum}
                                    variant={currentPage === pageNum ? "default" : "ghost"}
                                    size="sm"
                                    className={cn("w-8 h-8 p-0 text-[var(--text-secondary)]", currentPage === pageNum ? "bg-violet-600 text-white" : "hover:text-[var(--primary)] hover:bg-[var(--kpi-icon-chip)]")}
                                    onClick={() => setCurrentPage(pageNum)}
                                >
                                    {pageNum}
                                </Button>
                            ))}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="hover:bg-[var(--kpi-icon-chip)]"
                        >
                            <ChevronRightIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="hidden sm:flex hover:bg-[var(--kpi-icon-chip)]"
                        >
                            Last
                        </Button>
                    </div>
                </div>
            )}

            {selectedUser && (
                <>
                    <EditUserDialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onUserUpdated={fetchUsers} user={selectedUser} />
                    <DeleteUserDialog isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onUserDeleted={fetchUsers} user={selectedUser} />
                    <ResetPasswordDialog isOpen={isResetPasswordModalOpen} onClose={() => setIsResetPasswordModalOpen(false)} onPasswordReset={() => setIsResetPasswordModalOpen(false)} user={selectedUser} />
                    <ToggleStatusDialog isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} onStatusChanged={fetchUsers} user={selectedUser} />
                </>
            )}
        </div>
    );
};


// --- Dialog Components ---

interface ToggleStatusDialogProps { isOpen: boolean; onClose: () => void; onStatusChanged: () => void; user: User; }
const ToggleStatusDialog: React.FC<ToggleStatusDialogProps> = ({ isOpen, onClose, onStatusChanged, user }) => {
    const { user: adminUser } = useAuth();
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const targetStatus = user.accountStatus === 'ENABLED' ? 'DISABLED' : 'ENABLED';

    useEffect(() => {
        if (isOpen) {
            setReason('');
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!adminUser) return;
        setIsSubmitting(true);
        setError('');
        try {
            // Fix: Added logActivity call to properly track the status change event and match api.toggleUserStatus argument count.
            logActivity('user_status_change', `${user.name}'s account status was changed to ${targetStatus}.`, {
                userId: user.id,
                userName: user.name,
                adminId: adminUser.id,
                adminName: adminUser.name,
                newStatus: targetStatus,
                reason
            });
            // Fix: Changed call from 4 arguments to 3 to match the toggleUserStatus definition in lib/api.ts.
            await api.toggleUserStatus(user.id, adminUser.id, targetStatus);
            onStatusChanged();
            onClose();
        } catch (err: unknown) {
            console.error('[UI] toggle status failed', err);
            const message = err instanceof Error ? err.message : 'Failed to update user status.';
            setError(`Failed to update user status: ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={targetStatus === 'DISABLED' ? 'Disable User Account' : 'Enable User Account'}
            description={targetStatus === 'DISABLED'
                ? `Disabling ${user.name}'s account will block their access immediately but preserve all their data.`
                : `Enabling ${user.name}'s account will restore their access immediately.`}
        >
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                    <label htmlFor="status-reason" className="block text-sm font-medium mb-1">Reason (Optional)</label>
                    <Input id="status-reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g., Security policy violation, User request" />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                    <Button
                        variant={targetStatus === 'DISABLED' ? 'destructive' : 'default'}
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Updating...' : `Confirm ${targetStatus === 'DISABLED' ? 'Disable' : 'Enable'}`}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
};

interface EditUserDialogProps { isOpen: boolean; onClose: () => void; onUserUpdated: () => void; user: User; }
const EditUserDialog: React.FC<EditUserDialogProps> = ({ isOpen, onClose, onUserUpdated, user }) => {
    const { user: adminUser } = useAuth();
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [role, setRole] = useState(user.role);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
            setError('');
        }
    }, [user, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            if (role !== user.role) {
                logActivity('user_role_change', `${user.name}'s role was changed from ${user.role} to ${role}.`, {
                    userId: user.id,
                    userName: user.name,
                    adminId: adminUser?.id,
                    adminName: adminUser?.name,
                    oldRole: user.role,
                    newRole: role
                });
            }
            await api.updateUser({ ...user, name, email, role });
            onUserUpdated();
            onClose();
        } catch (err) {
            setError('Failed to update user.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Edit User">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="edit-name" className="block text-sm font-medium mb-1">Full Name</label>
                    <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                    <label htmlFor="edit-email" className="block text-sm font-medium mb-1">Email Address</label>
                    <Input id="edit-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required disabled />
                    <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Email cannot be changed.</p>
                </div>
                <div>
                    <label htmlFor="edit-role" className="block text-sm font-medium mb-1">Role</label>
                    <Select id="edit-role" value={role} onChange={e => setRole(e.target.value as any)} required>
                        <option value="student">Student</option>
                        <option value="mentor">Instructor</option>
                        <option value="admin">Admin</option>
                    </Select>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </form>
        </Dialog>
    );
}

interface DeleteUserDialogProps { isOpen: boolean; onClose: () => void; onUserDeleted: () => void; user: User; }
const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ isOpen, onClose, onUserDeleted, user }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleDelete = async () => {
        setIsSubmitting(true);
        try {
            await api.deleteUser(user.id);
            onUserDeleted();
            onClose();
        } catch (err) {
            console.error("Failed to delete user", err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Delete User"
            description={`Are you sure you want to delete ${user.name}? This action is permanent.`}
        >
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Delete User'}</Button>
            </div>
        </Dialog>
    );
}

interface ResetPasswordDialogProps { isOpen: boolean; onClose: () => void; onPasswordReset: () => void; user: User; }
const ResetPasswordDialog: React.FC<ResetPasswordDialogProps> = ({ isOpen, onClose, onPasswordReset, user }) => {
    const { user: adminUser } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [passwordStrength, setPasswordStrength] = useState<{
        score: number;
        level: 'none' | 'very weak' | 'weak' | 'medium' | 'strong' | 'very strong';
        text: string;
    }>({ score: 0, level: 'none', text: '' });
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setShowNewPassword(false);
            setShowConfirmPassword(false);
            setIsConfirming(false);
        }
    }, [isOpen]);

    useEffect(() => {
        setPasswordStrength(checkPasswordStrength(newPassword));
    }, [newPassword]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (passwordStrength.score < 3) {
            setError('Password is too weak. Please choose a stronger password.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setIsConfirming(true);
    };

    const handleConfirmReset = async () => {
        setIsSubmitting(true);
        setError('');
        try {
            await api.resetPassword(user.id, newPassword);
            logActivity('user_password_reset', `Password for ${user.name} was reset by an administrator.`, {
                userId: user.id,
                userName: user.name,
                adminId: adminUser?.id,
                adminName: adminUser?.name,
            });
            onPasswordReset();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to reset password.');
            setIsConfirming(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isPasswordWeak = newPassword.length > 0 && passwordStrength.score < 3;

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Reset Password"
            description={isConfirming ? 'Please confirm this critical action.' : `Set a new password for ${user.name}.`}
        >
            {!isConfirming ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="new-password" className="block text-sm font-medium mb-1">New Password</label>
                        <div className="relative">
                            <Input id="new-password" type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                            <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                {showNewPassword ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                            </button>
                        </div>
                        <PasswordStrengthMeter level={passwordStrength.level} text={passwordStrength.text} />
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">Confirm New Password</label>
                        <div className="relative">
                            <Input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700">
                                {showConfirmPassword ? <EyeOffIcon className="w-[18px] h-[18px]" /> : <EyeIcon className="w-[18px] h-[18px]" />}
                            </button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {isPasswordWeak && (
                        <p className="text-xs text-orange-500">Password must be at least 'Medium' strength.</p>
                    )}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting || isPasswordWeak}>Reset Password</Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="p-4 border-l-4 rounded-md" style={{ backgroundColor: 'color-mix(in srgb, #f59e0b 10%, transparent)', borderColor: '#f59e0b' }}>
                        <h4 className="font-semibold" style={{ color: '#b45309' }}>Warning</h4>
                        <p className="text-sm" style={{ color: '#92400e' }}>
                            Are you sure you want to reset the password for <strong className="font-semibold">{user.name}</strong>?
                            This action cannot be undone.
                        </p>
                    </div>
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsConfirming(false)} disabled={isSubmitting}>Go Back</Button>
                        <Button variant="destructive" onClick={handleConfirmReset} disabled={isSubmitting}>
                            {isSubmitting ? 'Resetting...' : 'Confirm Reset'}
                        </Button>
                    </div>
                </div>
            )}
        </Dialog>
    );
};


// --- Icon Components ---
const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
);
const Trash2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);
const LockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
);
const BanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="m4.9 4.9 14.2 14.2" /></svg>
);
const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
);
const UserSearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="4" />
        <path d="M10 16c-3.9 0-7 2-7 4" />
        <circle cx="17" cy="17" r="3" />
        <path d="m21 21-1.9-1.9" />
    </svg>
);
const EyeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>
);
const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const ChevronLeftIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>;
const ChevronRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>;

export default AdminUserManagement;
