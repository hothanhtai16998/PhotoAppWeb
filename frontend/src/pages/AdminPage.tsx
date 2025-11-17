import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import { adminService, type DashboardStats, type User, type AdminImage } from '@/services/adminService';
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
    X,
    Check
} from 'lucide-react';
import { toast } from 'sonner';
import './AdminPage.css';

type TabType = 'dashboard' | 'users' | 'images';

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

    useEffect(() => {
        const checkAdmin = async () => {
            try {
                await fetchMe();
                if (!user?.isAdmin) {
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

    const toggleAdminStatus = async (user: User) => {
        await handleUpdateUser(user._id, { isAdmin: !user.isAdmin });
    };

    if (!user?.isAdmin) {
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
                                                        <td>{u.isAdmin ? 'Yes' : 'No'}</td>
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
                                                        <button
                                                            className={`admin-toggle ${u.isAdmin ? 'active' : ''}`}
                                                            onClick={() => toggleAdminStatus(u)}
                                                            title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                                                        >
                                                            {u.isAdmin ? <Check size={16} /> : <X size={16} />}
                                                        </button>
                                                    </td>
                                                    <td>{u.imageCount || 0}</td>
                                                    <td>
                                                        <div className="admin-actions">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => setEditingUser(u)}
                                                            >
                                                                <Edit2 size={16} />
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleDeleteUser(u._id, u.username)}
                                                                disabled={u._id === user?._id}
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

export default AdminPage;

