import { useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useImageStore } from "@/stores/useImageStore";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import "./ProfilePage.css";

function ProfilePage() {
    const { user } = useAuthStore();
    const { images, fetchImages, loading } = useImageStore();
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            navigate('/signin');
            return;
        }
        // Fetch user's images
        if (user._id) {
            // Note: This requires backend endpoint /api/images/user/:userId
            // For now, fetch all and filter client-side (not ideal but works)
            fetchImages();
        }
    }, [user, navigate, fetchImages]);

    if (!user) {
        return null;
    }

    // Filter images to show only user's images
    const userImages = images.filter(img => img.uploadedBy?._id === user._id);

    return (
        <>
            <Header />
            <main className="profile-page">
                <div className="profile-container">
                    <div className="profile-header">
                        <div className="profile-avatar">
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt={user.displayName} />
                            ) : (
                                <div className="avatar-placeholder">
                                    {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="profile-info">
                            <h1>{user.displayName || user.username}</h1>
                            <p className="profile-username">@{user.username}</p>
                            {user.email && <p className="profile-email">{user.email}</p>}
                        </div>
                    </div>
                    <div className="profile-stats">
                        <div className="stat-item">
                            <span className="stat-value">{userImages.length}</span>
                            <span className="stat-label">Photos</span>
                        </div>
                    </div>
                    <div className="profile-content">
                        <h2>My Photos</h2>
                        {loading && userImages.length === 0 ? (
                            <div className="loading-state">
                                <p>Loading your photos...</p>
                            </div>
                        ) : userImages.length === 0 ? (
                            <div className="empty-state">
                                <p>You haven't uploaded any photos yet.</p>
                                <button onClick={() => navigate('/upload')} className="upload-btn">
                                    Upload Your First Photo
                                </button>
                            </div>
                        ) : (
                            <div className="profile-images">
                                {userImages.map((image) => (
                                    <div key={image._id} className="profile-image-item">
                                        <img src={image.imageUrl} alt={image.imageTitle} />
                                        <div className="image-title">{image.imageTitle}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}

export default ProfilePage;