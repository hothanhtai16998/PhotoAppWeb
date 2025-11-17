import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { adminService, type DashboardStats, type User, type AdminImage } from '@/services/adminService';
import { categoryService, type Category } from '@/services/categoryService';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    LayoutDashboard, 
    Users, 
    Images, 
    Trash2, 
    Edit2, 
    Search,
    Shield,
    UserCog,
    Tag
} from 'lucide-react';
import { toast } from 'sonner';
import './AdminPage.css';

type TabType = 'dashboard' | 'users' | 'images' | 'categories' | 'roles';

function AdminPage() {
    const { user, fetchMe } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    
    // Users state
    const [users, setUsers] = useState<User[]>([]);
    const [usersPagination, setUsersPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [usersSearch, setUsersSearch] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    // Images state
    const [images, setImages] = useState<AdminImage[]>([]);
    const [imagesPagination, setImagesPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [imagesSearch, setImagesSearch] = useState('');

    // Categories state
    const [categories, setCategories] = useState<Category[]>([]);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [creatingCategory, setCreatingCategory] = useState(false);

    // Roles state
    const [adminRoles, setAdminRoles] = useState<any[]>([]);
    const [editingRole, setEditingRole] = useState<any | null>(null);
    const [creatingRole, setCreatingRole] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                await fetchMe();
                const currentUser = useAuthStore.getState().user;
                if (!currentUser?.isAdmin && !currentUser?.isSuperAdmin) {
                    toast.error('Admin access required');
                    navigate('/');
                    return;
                }
                loadDashboardStats();
            } catch (error) {
                navigate('/signin');
            }
        };
        checkAdmin();
    }, []);

    useEffect(() => {
        if (activeTab === 'dashboard') {
            loadDashboardStats();
        } else if (activeTab === 'users') {
            loadUsers();
        } else if (activeTab === 'images') {
            loadImages();
        } else if (activeTab === 'categories') {
            loadCategories();
        } else if (activeTab === 'roles') {
            loadAdminRoles();
        }
    }, [activeTab]);

    const loadDashboardStats = async () => {
        try {
            setLoading(true);
            const data = await adminService.getDashboardStats();
            setStats(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load dashboard stats');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async (page = 1) => {
        try {
            setLoading(true);
            const data = await adminService.getAllUsers({
                page,
                limit: 20,
                search: usersSearch || undefined,
            });
            setUsers(data.users);
            setUsersPagination(data.pagination);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const loadImages = async (page = 1) => {
        try {
            setLoading(true);
            const data = await adminService.getAllImages({
                page,
                limit: 20,
                search: imagesSearch || undefined,
            });
            setImages(data.images);
            setImagesPagination(data.pagination);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load images');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to delete user "${username}"? This will also delete all their images.`)) {
            return;
        }

        try {
            await adminService.deleteUser(userId);
            toast.success('User deleted successfully');
            loadUsers(usersPagination.page);
            if (activeTab === 'dashboard') loadDashboardStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete user');
        }
    };

    const handleDeleteImage = async (imageId: string, imageTitle: string) => {
        if (!confirm(`Are you sure you want to delete image "${imageTitle}"?`)) {
            return;
        }

        try {
            await adminService.deleteImage(imageId);
            toast.success('Image deleted successfully');
            loadImages(imagesPagination.page);
            if (activeTab === 'dashboard') loadDashboardStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete image');
        }
    };

    const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
        try {
            await adminService.updateUser(userId, updates);
            toast.success('User updated successfully');
            setEditingUser(null);
            loadUsers(usersPagination.page);
            if (activeTab === 'dashboard') loadDashboardStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update user');
        }
    };


    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await categoryService.getAllCategoriesAdmin();
            setCategories(data);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (data: { name: string; description?: string }) => {
        try {
            await categoryService.createCategory(data);
            toast.success('Category created successfully');
            setCreatingCategory(false);
            loadCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create category');
        }
    };

    const handleUpdateCategory = async (categoryId: string, updates: { name?: string; description?: string; isActive?: boolean }) => {
        try {
            await categoryService.updateCategory(categoryId, updates);
            toast.success('Category updated successfully');
            setEditingCategory(null);
            loadCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update category');
        }
    };

    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
        if (!confirm(`Are you sure you want to delete category "${categoryName}"? This will only work if no images are using this category.`)) {
            return;
        }

        try {
            await categoryService.deleteCategory(categoryId);
            toast.success('Category deleted successfully');
            loadCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete category');
        }
    };

    const loadAdminRoles = async () => {
        if (!user?.isSuperAdmin) return;
        try {
            setLoading(true);
            const data = await adminService.getAllAdminRoles();
            setAdminRoles(data.adminRoles);
            // Also load users if not already loaded (for create role modal)
            if (users.length === 0) {
                await loadUsers(1);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load admin roles');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async (data: { userId: string; role: string; permissions: any }) => {
        try {
            await adminService.createAdminRole(data);
            toast.success('Admin role created successfully');
            setCreatingRole(false);
            loadAdminRoles();
            loadUsers(usersPagination.page);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to create admin role');
        }
    };

    const handleUpdateRole = async (userId: string, updates: { role?: string; permissions?: any }) => {
        try {
            await adminService.updateAdminRole(userId, updates);
            toast.success('Admin role updated successfully');
            setEditingRole(null);
            loadAdminRoles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update admin role');
        }
    };

    const handleDeleteRole = async (userId: string, username: string) => {
        if (!confirm(`Are you sure you want to remove admin role from "${username}"?`)) {
            return;
        }

        try {
            await adminService.deleteAdminRole(userId);
            toast.success('Admin role removed successfully');
            loadAdminRoles();
            loadUsers(usersPagination.page);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to remove admin role');
        }
    };

    if (!user?.isAdmin && !user?.isSuperAdmin) {
        return null;
    }

    return (
        <>
            <Header />
            <div className="admin-page">
                <div className="admin-container">
                    {/* Sidebar */}
                    <div className="admin-sidebar">
                        <div className="admin-sidebar-header">
                            <Shield size={24} />
                            <h2>Admin Panel</h2>
                        </div>
                        <nav className="admin-nav">
                            <button
                                className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                                onClick={() => setActiveTab('dashboard')}
                            >
                                <LayoutDashboard size={20} />
                                Dashboard
                            </button>
                            <button
                                className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
                                onClick={() => setActiveTab('users')}
                            >
                                <Users size={20} />
                                Users
                            </button>
                            <button
                                className={`admin-nav-item ${activeTab === 'images' ? 'active' : ''}`}
                                onClick={() => setActiveTab('images')}
                            >
                                <Images size={20} />
                                Images
                            </button>
                            <button
                                className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                                onClick={() => setActiveTab('categories')}
                            >
                                <Tag size={20} />
                                Categories
                            </button>
                            {user?.isSuperAdmin && (
                                <button
                                    className={`admin-nav-item ${activeTab === 'roles' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('roles')}
                                >
                                    <UserCog size={20} />
                                    Admin Roles
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="admin-content">
                        {loading && activeTab === 'dashboard' ? (
                            <div className="admin-loading">Loading...</div>
                        ) : activeTab === 'dashboard' && stats ? (
                            <div className="admin-dashboard">
                                <h1 className="admin-title">Dashboard</h1>
                                
                                {/* Stats Cards */}
                                <div className="admin-stats-grid">
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-value">{stats.stats.totalUsers}</div>
                                        <div className="admin-stat-label">Total Users</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-value">{stats.stats.totalImages}</div>
                                        <div className="admin-stat-label">Total Images</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-value">{stats.stats.categoryStats.length}</div>
                                        <div className="admin-stat-label">Categories</div>
                                    </div>
                                </div>

                                {/* Category Stats */}
                                <div className="admin-section">
                                    <h2 className="admin-section-title">Top Categories</h2>
                                    <div className="admin-category-list">
                                        {stats.stats.categoryStats.map((cat) => (
                                            <div key={cat._id} className="admin-category-item">
                                                <span className="admin-category-name">{cat._id}</span>
                                                <span className="admin-category-count">{cat.count} images</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Users */}
                                <div className="admin-section">
                                    <h2 className="admin-section-title">Recent Users</h2>
                                    <div className="admin-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Username</th>
                                                    <th>Email</th>
                                                    <th>Name</th>
                                                    <th>Admin</th>
                                                    <th>Joined</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.recentUsers.map((u) => (
                                                    <tr key={u._id}>
                                                        <td>{u.username}</td>
                                                        <td>{u.email}</td>
                                                        <td>{u.displayName}</td>
                                                        <td>
                                                            {u.isSuperAdmin ? (
                                                                <span className="admin-status-badge super-admin">Super Admin</span>
                                                            ) : u.isAdmin ? (
                                                                <span className="admin-status-badge admin">Admin</span>
                                                            ) : (
                                                                <span className="admin-status-badge none">No</span>
                                                            )}
                                                        </td>
                                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Recent Images */}
                                <div className="admin-section">
                                    <h2 className="admin-section-title">Recent Images</h2>
                                    <div className="admin-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Title</th>
                                                    <th>Category</th>
                                                    <th>Uploaded By</th>
                                                    <th>Date</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.recentImages.map((img) => (
                                                    <tr key={img._id}>
                                                        <td>{img.imageTitle}</td>
                                                        <td>{img.imageCategory}</td>
                                                        <td>{img.uploadedBy?.displayName || img.uploadedBy?.username}</td>
                                                        <td>{new Date(img.createdAt).toLocaleDateString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'users' ? (
                            <div className="admin-users">
                                <div className="admin-header">
                                    <h1 className="admin-title">User Management</h1>
                                    <div className="admin-search">
                                        <Search size={20} />
                                        <Input
                                            placeholder="Search users..."
                                            value={usersSearch}
                                            onChange={(e) => setUsersSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    loadUsers(1);
                                                }
                                            }}
                                        />
                                        <Button onClick={() => loadUsers(1)}>Search</Button>
                                    </div>
                                </div>

                                <div className="admin-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Username</th>
                                                <th>Email</th>
                                                <th>Display Name</th>
                                                <th>Admin</th>
                                                <th>Images</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((u) => (
                                                <tr key={u._id}>
                                                    <td>{u.username}</td>
                                                    <td>{u.email}</td>
                                                    <td>{u.displayName}</td>
                                                    <td>
                                                        <div className="admin-status-display">
                                                            {u.isSuperAdmin ? (
                                                                <span className="admin-status-badge super-admin" title="Super Admin">
                                                                    Super Admin
                                                                </span>
                                                            ) : u.isAdmin ? (
                                                                <span className="admin-status-badge admin" title="Admin">
                                                                    Admin
                                                                </span>
                                                            ) : (
                                                                <span className="admin-status-badge none" title="Regular User">
                                                                    No
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>{u.imageCount || 0}</td>
                                                    <td>
                                                        <div className="admin-actions">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingUser(u)}
                                                                disabled={u.isSuperAdmin && !user?.isSuperAdmin}
                                                                title={u.isSuperAdmin && !user?.isSuperAdmin ? 'Cannot edit super admin' : ''}
                                                            >
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteUser(u._id, u.username)}
                                                                disabled={u._id === user?._id || (u.isSuperAdmin && !user?.isSuperAdmin)}
                                                                title={u.isSuperAdmin && !user?.isSuperAdmin ? 'Cannot delete super admin' : u._id === user?._id ? 'Cannot delete yourself' : ''}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {usersPagination.pages > 1 && (
                                    <div className="admin-pagination">
                                        <Button
                                            disabled={usersPagination.page === 1}
                                            onClick={() => loadUsers(usersPagination.page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <span>
                                            Page {usersPagination.page} of {usersPagination.pages}
                                        </span>
                                        <Button
                                            disabled={usersPagination.page === usersPagination.pages}
                                            onClick={() => loadUsers(usersPagination.page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}

                                {editingUser && (
                                    <UserEditModal
                                        user={editingUser}
                                        onClose={() => setEditingUser(null)}
                                        onSave={handleUpdateUser}
                                    />
                                )}
                            </div>
                        ) : activeTab === 'images' ? (
                            <div className="admin-images">
                                <div className="admin-header">
                                    <h1 className="admin-title">Image Management</h1>
                                    <div className="admin-search">
                                        <Search size={20} />
                                        <Input
                                            placeholder="Search images..."
                                            value={imagesSearch}
                                            onChange={(e) => setImagesSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    loadImages(1);
                                                }
                                            }}
                                        />
                                        <Button onClick={() => loadImages(1)}>Search</Button>
                                    </div>
                                </div>

                                <div className="admin-images-grid">
                                    {images.map((img) => (
                                        <div key={img._id} className="admin-image-card">
                                            <img src={img.imageUrl} alt={img.imageTitle} />
                                            <div className="admin-image-info">
                                                <h3>{img.imageTitle}</h3>
                                                <p>Category: {img.imageCategory}</p>
                                                <p>By: {img.uploadedBy.displayName || img.uploadedBy.username}</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteImage(img._id, img.imageTitle)}
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {imagesPagination.pages > 1 && (
                                    <div className="admin-pagination">
                                        <Button
                                            disabled={imagesPagination.page === 1}
                                            onClick={() => loadImages(imagesPagination.page - 1)}
                                        >
                                            Previous
                                        </Button>
                                        <span>
                                            Page {imagesPagination.page} of {imagesPagination.pages}
                                        </span>
                                        <Button
                                            disabled={imagesPagination.page === imagesPagination.pages}
                                            onClick={() => loadImages(imagesPagination.page + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'categories' ? (
                            <div className="admin-categories">
                                <div className="admin-header">
                                    <h1 className="admin-title">Category Management</h1>
                                    <Button onClick={() => setCreatingCategory(true)}>
                                        + Create Category
                                    </Button>
                                </div>

                                <div className="admin-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Description</th>
                                                <th>Images</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((cat) => (
                                                <tr key={cat._id}>
                                                    <td><strong>{cat.name}</strong></td>
                                                    <td>{cat.description || '-'}</td>
                                                    <td>{cat.imageCount || 0}</td>
                                                    <td>
                                                        <span className={`admin-status-badge ${cat.isActive ? 'admin' : 'none'}`}>
                                                            {cat.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="admin-actions">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingCategory(cat)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteCategory(cat._id, cat.name)}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {categories.length === 0 && (
                                    <div className="admin-empty-state">
                                        <p>No categories found. Create one to get started.</p>
                                    </div>
                                )}

                                {creatingCategory && (
                                    <CreateCategoryModal
                                        onClose={() => setCreatingCategory(false)}
                                        onSave={handleCreateCategory}
                                    />
                                )}

                                {editingCategory && (
                                    <EditCategoryModal
                                        category={editingCategory}
                                        onClose={() => setEditingCategory(null)}
                                        onSave={handleUpdateCategory}
                                    />
                                )}
                            </div>
                        ) : activeTab === 'roles' && user?.isSuperAdmin ? (
                            <div className="admin-roles">
                                <div className="admin-header">
                                    <h1 className="admin-title">Admin Role Management</h1>
                                    <Button onClick={() => setCreatingRole(true)}>
                                        + Create Admin Role
                                    </Button>
                                </div>

                                <div className="admin-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Role</th>
                                                <th>Permissions</th>
                                                <th>Granted By</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {adminRoles.map((role) => (
                                                <tr key={role._id}>
                                                    <td>
                                                        <div>
                                                            <strong>{role.userId?.displayName || role.userId?.username}</strong>
                                                            <br />
                                                            <small>{role.userId?.email}</small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`admin-role-badge ${role.role}`}>
                                                            {role.role === 'super_admin' ? 'Super Admin' : role.role === 'admin' ? 'Admin' : 'Moderator'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <div className="admin-permissions-list">
                                                            {Object.entries(role.permissions || {}).map(([key, value]) => (
                                                                value && (
                                                                    <span key={key} className="admin-permission-tag">
                                                                        {key}
                                                                    </span>
                                                                )
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {role.grantedBy?.displayName || role.grantedBy?.username || 'System'}
                                                    </td>
                                                    <td>
                                                        <div className="admin-actions">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingRole(role)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteRole(role.userId._id, role.userId.username)}
                                                                disabled={role.userId._id === user?._id}
                                                            >
                                                                <Trash2 size={16} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {adminRoles.length === 0 && (
                                    <div className="admin-empty-state">
                                        <p>No admin roles found. Create one to delegate admin permissions.</p>
                                    </div>
                                )}

                                {creatingRole && (
                                    <CreateRoleModal
                                        users={users}
                                        onClose={() => setCreatingRole(false)}
                                        onSave={handleCreateRole}
                                    />
                                )}

                                {editingRole && (
                                    <EditRoleModal
                                        role={editingRole}
                                        onClose={() => setEditingRole(null)}
                                        onSave={handleUpdateRole}
                                    />
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}

// User Edit Modal Component
function UserEditModal({
    user,
    onClose,
    onSave,
}: {
    user: User;
    onClose: () => void;
    onSave: (userId: string, updates: Partial<User>) => Promise<void>;
}) {
    const [displayName, setDisplayName] = useState(user.displayName);
    const [email, setEmail] = useState(user.email);
    const [bio, setBio] = useState(user.bio || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(user._id, { displayName, email, bio });
    };

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>Edit User</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>Display Name</label>
                        <Input
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="admin-modal-actions">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Create Role Modal Component
function CreateRoleModal({
    users,
    onClose,
    onSave,
}: {
    users: User[];
    onClose: () => void;
    onSave: (data: { userId: string; role: string; permissions: any }) => Promise<void>;
}) {
    const [selectedUserId, setSelectedUserId] = useState('');
    const [role, setRole] = useState('admin');
    const [permissions, setPermissions] = useState({
        manageUsers: false,
        deleteUsers: false,
        manageImages: false,
        deleteImages: false,
        manageCategories: false,
        manageAdmins: false,
        viewDashboard: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId) {
            toast.error('Please select a user');
            return;
        }
        await onSave({ userId: selectedUserId, role, permissions });
    };

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>Create Admin Role</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>Select User</label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            required
                            className="admin-select"
                        >
                            <option value="">Choose a user...</option>
                            {users.filter(u => !u.isAdmin && !u.isSuperAdmin).map((u) => (
                                <option key={u._id} value={u._id}>
                                    {u.displayName} ({u.username})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label>Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="admin-select"
                        >
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label>Permissions</label>
                        <div className="admin-permissions-checkboxes">
                            {Object.entries(permissions).map(([key, value]) => (
                                <label key={key} className="admin-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={value as boolean}
                                        onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                                        disabled={key === 'viewDashboard'}
                                    />
                                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="admin-modal-actions">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Role</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Edit Role Modal Component
function EditRoleModal({
    role,
    onClose,
    onSave,
}: {
    role: any;
    onClose: () => void;
    onSave: (userId: string, updates: { role?: string; permissions?: any }) => Promise<void>;
}) {
    const [selectedRole, setSelectedRole] = useState(role.role);
    const [permissions, setPermissions] = useState(role.permissions || {});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(role.userId._id || role.userId, { role: selectedRole, permissions });
    };

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>Edit Admin Role</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>User</label>
                        <Input
                            value={role.userId?.displayName || role.userId?.username || ''}
                            disabled
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>Role</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="admin-select"
                        >
                            <option value="admin">Admin</option>
                            <option value="moderator">Moderator</option>
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label>Permissions</label>
                        <div className="admin-permissions-checkboxes">
                            {Object.entries(permissions).map(([key, value]) => (
                                <label key={key} className="admin-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={value as boolean}
                                        onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                                        disabled={key === 'viewDashboard'}
                                    />
                                    <span>{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="admin-modal-actions">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Create Category Modal Component
function CreateCategoryModal({
    onClose,
    onSave,
}: {
    onClose: () => void;
    onSave: (data: { name: string; description?: string }) => Promise<void>;
}) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Category name is required');
            return;
        }
        await onSave({ name: name.trim(), description: description.trim() || undefined });
    };

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>Create Category</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>Category Name *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="e.g., Nature, Portrait, Architecture"
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Optional description for this category"
                        />
                    </div>
                    <div className="admin-modal-actions">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Create</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Edit Category Modal Component
function EditCategoryModal({
    category,
    onClose,
    onSave,
}: {
    category: Category;
    onClose: () => void;
    onSave: (categoryId: string, updates: { name?: string; description?: string; isActive?: boolean }) => Promise<void>;
}) {
    const [name, setName] = useState(category.name);
    const [description, setDescription] = useState(category.description || '');
    const [isActive, setIsActive] = useState(category.isActive !== false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error('Category name is required');
            return;
        }
        await onSave(category._id, {
            name: name.trim() !== category.name ? name.trim() : undefined,
            description: description.trim() || '',
            isActive,
        });
    };

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>Edit Category</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>Category Name *</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                            Changing the name will update all images using this category.
                        </small>
                    </div>
                    <div className="admin-form-group">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-checkbox-label">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            Active
                        </label>
                    </div>
                    <div className="admin-modal-actions">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminPage;

