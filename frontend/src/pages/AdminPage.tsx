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
                    toast.error('Cần quyền Admin để truy cập trang này.');
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
            toast.error(error.response?.data?.message || 'Lỗi khi lấy ảnh');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string, username: string) => {
        if (!confirm(`Bạn có muốn xoá người dùng "${username}" không? Sẽ xoá cả ảnh mà người này đã đăng.`)) {
            return;
        }

        try {
            await adminService.deleteUser(userId);
            toast.success('Xoá người dùng thành công');
            loadUsers(usersPagination.page);
            if (activeTab === 'dashboard') loadDashboardStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi xoá người dùng');
        }
    };

    const handleDeleteImage = async (imageId: string, imageTitle: string) => {
        if (!confirm(`Bán có muốn xoá ảnh "${imageTitle}" không?`)) {
            return;
        }

        try {
            await adminService.deleteImage(imageId);
            toast.success('Xoá ảnh thành công');
            loadImages(imagesPagination.page);
            if (activeTab === 'dashboard') loadDashboardStats();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi xoá ảnh');
        }
    };

    const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
        try {
            await adminService.updateUser(userId, updates);
            toast.success('Cập nhật thông tin người dùng thành công');
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
            toast.error(error.response?.data?.message || 'Lỗi khi lấy danh mục');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCategory = async (data: { name: string; description?: string }) => {
        try {
            await categoryService.createCategory(data);
            toast.success('Tạo danh mục thành công');
            setCreatingCategory(false);
            loadCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi tạo danh mục');
        }
    };

    const handleUpdateCategory = async (categoryId: string, updates: { name?: string; description?: string; isActive?: boolean }) => {
        try {
            await categoryService.updateCategory(categoryId, updates);
            toast.success('Danh mục đã được cập nhật thành công');
            setEditingCategory(null);
            loadCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật danh mục');
        }
    };

    const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
        if (!confirm(`Bạn có muốn xoá danh mục "${categoryName}" không? Chỉ xoá được nếu không có ảnh nào thuộc loại danh mục này.`)) {
            return;
        }

        try {
            await categoryService.deleteCategory(categoryId);
            toast.success('Xoá danh mục thành công');
            loadCategories();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi xoá danh mục');
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
            toast.error(error.response?.data?.message || 'Lỗi khi lấy danh sách quyền admin');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRole = async (data: { userId: string; role: string; permissions: any }) => {
        try {
            await adminService.createAdminRole(data);
            toast.success('Quyền admin đã được tạo thành công');
            setCreatingRole(false);
            loadAdminRoles();
            loadUsers(usersPagination.page);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi tạo quyền admin');
        }
    };

    const handleUpdateRole = async (userId: string, updates: { role?: string; permissions?: any }) => {
        try {
            await adminService.updateAdminRole(userId, updates);
            toast.success('Quyền admin đã được cập nhật thành công');
            setEditingRole(null);
            loadAdminRoles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật quyền admin');
        }
    };

    const handleDeleteRole = async (userId: string, username: string) => {
        if (!confirm(`Bạn có muốn xoá quyền ad của tài khoản "${username}" không?`)) {
            return;
        }

        try {
            await adminService.deleteAdminRole(userId);
            toast.success('Quyền admin đã được xoá thành công');
            loadAdminRoles();
            loadUsers(usersPagination.page);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi xoá quyền admin');
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
                            <h2>Trang quản lý</h2>
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
                                Người dùng
                            </button>
                            <button
                                className={`admin-nav-item ${activeTab === 'images' ? 'active' : ''}`}
                                onClick={() => setActiveTab('images')}
                            >
                                <Images size={20} />
                                Ảnh
                            </button>
                            <button
                                className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                                onClick={() => setActiveTab('categories')}
                            >
                                <Tag size={20} />
                                Danh mục ảnh
                            </button>
                            {user?.isSuperAdmin && (
                                <button
                                    className={`admin-nav-item ${activeTab === 'roles' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('roles')}
                                >
                                    <UserCog size={20} />
                                    Quyền quản trị
                                </button>
                            )}
                        </nav>
                    </div>

                    {/* Main Content */}
                    <div className="admin-content">
                        {loading && activeTab === 'dashboard' ? (
                            <div className="admin-loading">Đang tải...</div>
                        ) : activeTab === 'dashboard' && stats ? (
                            <div className="admin-dashboard">
                                <h1 className="admin-title">Dashboard</h1>

                                {/* Stats Cards */}
                                <div className="admin-stats-grid">
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-value">{stats.stats.totalUsers}</div>
                                        <div className="admin-stat-label">Tổng số lượng người dùngn</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-value">{stats.stats.totalImages}</div>
                                        <div className="admin-stat-label">Tổng số lượng ảnh</div>
                                    </div>
                                    <div className="admin-stat-card">
                                        <div className="admin-stat-value">{stats.stats.categoryStats.length}</div>
                                        <div className="admin-stat-label">Danh mục</div>
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
                                    <h2 className="admin-section-title">Người dùng được tạo gần đây</h2>
                                    <div className="admin-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Tên tài khoản</th>
                                                    <th>Email</th>
                                                    <th>Họ và tên</th>
                                                    <th>Quyền Admin</th>
                                                    <th>Ngày tham gia</th>
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
                                    <h2 className="admin-section-title">Ảnh được thêm gần đây</h2>
                                    <div className="admin-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Tiêu đề</th>
                                                    {/* <th>Ảnh thumbnail</th> */}
                                                    <th>Danh mục</th>
                                                    <th>Người đăng</th>
                                                    <th>Ngày đăng</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stats.recentImages.map((img) => (
                                                    <tr key={img._id}>
                                                        <td>{img.imageTitle}</td>
                                                        {/* <td>
                                                            <img
                                                                src={img.imageUrl}
                                                                alt={img.imageTitle}
                                                            /></td> */}
                                                        <td>
                                                            {typeof img.imageCategory === 'string'
                                                                ? img.imageCategory
                                                                : img.imageCategory?.name || 'Unknown'}
                                                        </td>
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
                                    <h1 className="admin-title">Quản lý người dùng</h1>
                                    <div className="admin-search">
                                        <Search size={20} />
                                        <Input
                                            placeholder="Nhập tên tài khoản..."
                                            value={usersSearch}
                                            onChange={(e) => setUsersSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    loadUsers(1);
                                                }
                                            }}
                                        />
                                        <Button onClick={() => loadUsers(1)}>Tìm</Button>
                                    </div>
                                </div>

                                <div className="admin-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Tên tài khoản</th>
                                                <th>Email</th>
                                                <th>Họ và tên</th>
                                                <th>Quyền Admin</th>
                                                <th>Ảnh</th>
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
                                            Quay lại
                                        </Button>
                                        <span>
                                            Trang {usersPagination.page} trên {usersPagination.pages}
                                        </span>
                                        <Button
                                            disabled={usersPagination.page === usersPagination.pages}
                                            onClick={() => loadUsers(usersPagination.page + 1)}
                                        >
                                            Tiếp theo
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
                                    <h1 className="admin-title">Quản lý hình ảnh</h1>
                                    <div className="admin-search">
                                        <Search size={20} />
                                        <Input
                                            placeholder="Nhập tên ảnh..."
                                            value={imagesSearch}
                                            onChange={(e) => setImagesSearch(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    loadImages(1);
                                                }
                                            }}
                                        />
                                        <Button onClick={() => loadImages(1)}>Tìm</Button>
                                    </div>
                                </div>

                                <div className="admin-images-grid">
                                    {images.map((img) => (
                                        <div key={img._id} className="admin-image-card">
                                            <img src={img.imageUrl} alt={img.imageTitle} />
                                            <div className="admin-image-info">
                                                <h3>{img.imageTitle}</h3>
                                                <p>Danh mục: {typeof img.imageCategory === 'string'
                                                    ? img.imageCategory
                                                    : img.imageCategory?.name || 'Unknown'}</p>
                                                <p>Người đăng: {img.uploadedBy.displayName || img.uploadedBy.username}</p>
                                                <p>Ngày đăng: {img.createdAt}</p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteImage(img._id, img.imageTitle)}
                                                >
                                                    <Trash2 size={16} /> Xoá
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
                                            Quay lại
                                        </Button>
                                        <span>
                                            Trang {imagesPagination.page} trên {imagesPagination.pages}
                                        </span>
                                        <Button
                                            disabled={imagesPagination.page === imagesPagination.pages}
                                            onClick={() => loadImages(imagesPagination.page + 1)}
                                        >
                                            Tiếp theo
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === 'categories' ? (
                            <div className="admin-categories">
                                <div className="admin-header">
                                    <h1 className="admin-title">Quản lý danh mục</h1>
                                    <Button onClick={() => setCreatingCategory(true)}>
                                        + Thêm danh mục
                                    </Button>
                                </div>

                                <div className="admin-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Tên</th>
                                                <th>Mô tả</th>
                                                <th>Số lượng ảnh hiện tại</th>
                                                <th>Trạng thái</th>
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
                                                            {cat.isActive ? 'Đang kích hoạt' : 'Inactive'}
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
                                        <p>Không tìm thấy danh mục. Vui lòng tạo mới.</p>
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
                                    <h1 className="admin-title">Quyền quản trị Admin</h1>
                                    <Button onClick={() => setCreatingRole(true)}>
                                        + Thêm quyền Admin
                                    </Button>
                                </div>

                                <div className="admin-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Tên tài khoản</th>
                                                <th>Vai trò</th>
                                                <th>Quyền hạn</th>
                                                <th>Người cấp</th>
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
                                                            {Object.entries(role.permissions || {}).map(([key, value]) =>
                                                                value ? (
                                                                    <span key={key} className="admin-permission-tag">
                                                                        {key}
                                                                    </span>
                                                                ) : null
                                                            )}
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
                                        <p>Chưa có quyền admin. Vui lòng tạo mới</p>
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
                    <h2>Chỉnh sửa thông tin</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>Họ và tên</label>
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
                            Huỷ
                        </Button>
                        <Button type="submit">Lưu</Button>
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
            toast.error('Vui lòng chọn tài khoản để tạo quyền admin.');
            return;
        }
        await onSave({ userId: selectedUserId, role, permissions });
    };

    return (
        <div className="admin-modal-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal-header">
                    <h2>Thêm quyền admin</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>Chọn tài khoản</label>
                        <select
                            value={selectedUserId}
                            onChange={(e) => setSelectedUserId(e.target.value)}
                            required
                            className="admin-select"
                        >
                            <option value="">Vui lòng chọn tải khoản...</option>
                            {users.filter(u => !u.isAdmin && !u.isSuperAdmin).map((u) => (
                                <option key={u._id} value={u._id}>
                                    {u.displayName} ({u.username})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label>Vai trò</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="admin-select"
                        >
                            <option value="admin">Admin</option>
                            <option value="moderator">Mod</option>
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label>Quyền hạn</label>
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
                            Huỷ
                        </Button>
                        <Button type="submit">Thêm</Button>
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
                    <h2>Sửa quyền admin</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>Tài khoản admin</label>
                        <Input
                            value={role.userId?.displayName || role.userId?.username || ''}
                            disabled
                        />
                    </div>

                    <div className="admin-form-group">
                        <label>Vai trò</label>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="admin-select"
                        >
                            <option value="admin">Admin</option>
                            <option value="moderator">Mod</option>
                        </select>
                    </div>

                    <div className="admin-form-group">
                        <label>Quyền hạn</label>
                        <div className="admin-permissions-checkboxes">
                            {Object.entries(permissions).map(([key]) => (
                                <label key={key} className="admin-checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={permissions[key] || false}
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
                            Huỷ
                        </Button>
                        <Button type="submit">Lưu</Button>
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
                    <h2>Thêm danh mục mới</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>Tên danh mục</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            placeholder="Chân dung, phong cảnh, sự kiện,..."
                        />
                    </div>
                    <div className="admin-form-group">
                        <label>Mô tả</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Thêm mô tả cho danh mục hoặc bỏ trống"
                        />
                    </div>
                    <div className="admin-modal-actions">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Huỷ
                        </Button>
                        <Button type="submit">Tạo</Button>
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
            toast.error('Cần có tên danh mục');
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
                    <h2>Chỉnh sửa danh mục</h2>
                    <button onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit} className="admin-modal-form">
                    <div className="admin-form-group">
                        <label>Tên danh mục</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                        <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                            Thay đổi tên danh mục sẽ cập nhật tất cả các ảnh đã đăng tại danh mục này.
                        </small>
                    </div>
                    <div className="admin-form-group">
                        <label>Mô tả</label>
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
                            Đang kích hoạt
                        </label>
                    </div>
                    <div className="admin-modal-actions">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Huỷ
                        </Button>
                        <Button type="submit">Lưu</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default AdminPage;

