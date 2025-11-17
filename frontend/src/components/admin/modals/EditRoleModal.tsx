import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface EditRoleModalProps {
    role: any;
    onClose: () => void;
    onSave: (userId: string, updates: { role?: string; permissions?: any }) => Promise<void>;
}

export function EditRoleModal({ role, onClose, onSave }: EditRoleModalProps) {
    // Define all available permissions
    const allPermissions = {
        manageUsers: false,
        deleteUsers: false,
        manageImages: false,
        deleteImages: false,
        manageCategories: false,
        manageAdmins: false,
        viewDashboard: true,
    };

    const [selectedRole, setSelectedRole] = useState(role.role);
    // Merge existing permissions with all available permissions to show all checkboxes
    const [permissions, setPermissions] = useState({
        ...allPermissions,
        ...(role.permissions || {}),
    });

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
                            {Object.entries(allPermissions).map(([key]) => (
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

