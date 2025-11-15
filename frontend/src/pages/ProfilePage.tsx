import { useEffect, useState } from "react";
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { userService } from "@/services/userService";
import "./ProfilePage.css";

type ProfileFormData = {
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    location: string;
    personalSite: string;
    bio: string;
    interests: string;
    instagram: string;
    twitter: string;
    paypalEmail: string;
    showMessageButton: boolean;
};

// Change password form schema
const changePasswordSchema = z.object({
    password: z.string().min(1, { message: "Current password is required" }),
    newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
    newPasswordMatch: z.string().min(1, { message: "Password confirmation is required" }),
}).refine((data) => data.newPassword === data.newPasswordMatch, {
    message: "Passwords do not match",
    path: ["newPasswordMatch"],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

function ProfilePage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('edit-profile');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    // Split displayName into firstName and lastName
    const nameParts = user?.displayName?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const { register, handleSubmit, setValue, watch } = useForm<ProfileFormData>({
        defaultValues: {
            firstName,
            lastName,
            email: user?.email || '',
            username: user?.username || '',
            location: '',
            personalSite: 'https://',
            bio: user?.bio || '',
            interests: '',
            instagram: '',
            twitter: '',
            paypalEmail: '',
            showMessageButton: true,
        }
    });

    const bioText = watch('bio') || '';
    const bioCharCount = 250 - bioText.length;

    useEffect(() => {
        if (!user) {
            navigate('/signin');
            return;
        }
        // Set form values when user data is available
        if (user) {
            const nameParts = user.displayName?.split(' ') || [];
            setValue('firstName', nameParts[0] || '');
            setValue('lastName', nameParts.slice(1).join(' ') || '');
            setValue('email', user.email || '');
            setValue('username', user.username || '');
            setValue('bio', user.bio || '');
        }
    }, [user, navigate, setValue]);

    // Change password form
    const {
        register: registerPassword,
        handleSubmit: handlePasswordSubmit,
        formState: { errors: passwordErrors },
        reset: resetPasswordForm
    } = useForm<ChangePasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
    });

    const onSubmit = async (data: ProfileFormData) => {
        setIsSubmitting(true);
        try {
            // TODO: Implement profile update API call
            console.log('Profile update data:', data);
            // await updateProfile(data);
            // await fetchMe(); // Refresh user data
        } catch (error) {
            console.error('Failed to update profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const onPasswordSubmit = async (data: ChangePasswordFormData) => {
        setIsSubmitting(true);
        setPasswordError(null);
        setPasswordSuccess(false);

        try {
            await userService.changePassword(
                data.password,
                data.newPassword,
                data.newPasswordMatch
            );
            setPasswordSuccess(true);
            resetPasswordForm();
            // Clear success message after 3 seconds
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to change password. Please try again.";
            setPasswordError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) {
        return null;
    }

    const menuItems = [
        { id: 'edit-profile', label: 'Edit profile' },
        { id: 'hiring', label: 'Hiring' },
        { id: 'download-history', label: 'Download history' },
        { id: 'email-settings', label: 'Email settings' },
        { id: 'change-password', label: 'Change password' },
        { id: 'applications', label: 'Applications' },
        { id: 'close-account', label: 'Close account' },
    ];

    return (
        <>
            <Header />
            <main className="profile-settings-page">
                <div className="profile-settings-container">
                    {/* Left Sidebar */}
                    <aside className="profile-sidebar">
                        <h2 className="sidebar-title">Account settings</h2>
                        <nav className="sidebar-nav">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={`sidebar-link ${activeSection === item.id ? 'active' : ''}`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Right Main Content */}
                    <div className="profile-main-content">
                        {activeSection === 'edit-profile' && (
                            <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
                                <h1 className="form-title">Edit profile</h1>

                                {/* Profile Image Section */}
                                <div className="profile-image-section">
                                    <div className="profile-image-container">
                                        {user.avatarUrl ? (
                                            <img src={user.avatarUrl} alt={user.displayName} className="profile-image" />
                                        ) : (
                                            <div className="profile-image-placeholder">
                                                {user.displayName?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <button type="button" className="change-image-btn">
                                            Change profile image
                                        </button>
                                    </div>

                                    <div className="profile-basic-info">
                                        <div className="form-row">
                                            <div className="form-field">
                                                <Label htmlFor="firstName">First name</Label>
                                                <Input id="firstName" {...register('firstName')} />
                                            </div>
                                            <div className="form-field">
                                                <Label htmlFor="lastName">Last name</Label>
                                                <Input id="lastName" {...register('lastName')} />
                                                <div className="account-badge">
                                                    <CheckCircle2 size={16} />
                                                    <span>Account Confirmed</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="form-field">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" type="email" {...register('email')} />
                                        </div>
                                        <div className="form-field">
                                            <Label htmlFor="username">Username</Label>
                                            <Input id="username" {...register('username')} readOnly />
                                            <p className="field-hint">(only letters, numbers, and underscores)</p>
                                            <p className="field-url">https://photoapp.com/@{watch('username') || user.username}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Badge Section */}
                                <div className="form-section">
                                    <h3 className="section-title">Badge</h3>
                                    <p className="empty-badge-message">You don't have any badges yet :(</p>
                                </div>

                                {/* About Section */}
                                <div className="form-section">
                                    <h3 className="section-title">About</h3>
                                    <div className="form-field">
                                        <Label htmlFor="location">Location</Label>
                                        <Input id="location" {...register('location')} placeholder="e.g., New York, USA" />
                                    </div>
                                    <div className="form-field">
                                        <Label htmlFor="personalSite">Personal site/portfolio</Label>
                                        <Input id="personalSite" {...register('personalSite')} placeholder="https://" />
                                    </div>
                                    <div className="form-field">
                                        <Label htmlFor="bio">Bio</Label>
                                        <textarea
                                            id="bio"
                                            {...register('bio')}
                                            className="bio-textarea"
                                            maxLength={250}
                                            placeholder="Tell us about yourself..."
                                        />
                                        <div className="char-counter">{bioCharCount}</div>
                                    </div>
                                    <div className="form-field">
                                        <Label htmlFor="interests">Interests (maximum 5)</Label>
                                        <Input id="interests" {...register('interests')} placeholder="add a tag" />
                                        <p className="field-hint">Your interests are generated from the types of photos you like, collect, and contribute.</p>
                                    </div>
                                </div>

                                {/* Social Section */}
                                <div className="form-section">
                                    <h3 className="section-title">Social</h3>
                                    <div className="form-row">
                                        <div className="form-field">
                                            <Label htmlFor="instagram">Instagram username</Label>
                                            <div className="input-with-prefix">
                                                <span className="input-prefix">@</span>
                                                <Input id="instagram" {...register('instagram')} placeholder="username" />
                                            </div>
                                            <p className="field-hint">So that we can feature you on @photoapp</p>
                                        </div>
                                        <div className="form-field">
                                            <Label htmlFor="twitter">X (Twitter) username</Label>
                                            <div className="input-with-prefix">
                                                <span className="input-prefix">@</span>
                                                <Input id="twitter" {...register('twitter')} placeholder="username" />
                                            </div>
                                            <p className="field-hint">So that we can feature you on @photoapp</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Donations Section */}
                                <div className="form-section">
                                    <h3 className="section-title">Donations</h3>
                                    <div className="form-field">
                                        <Label htmlFor="paypalEmail">PayPal email or username for donations</Label>
                                        <Input id="paypalEmail" type="email" {...register('paypalEmail')} placeholder="name@domain.com" />
                                        <p className="field-hint">Note: This email/username will be public</p>
                                    </div>
                                </div>

                                {/* Messaging Section */}
                                <div className="form-section">
                                    <h3 className="section-title">Messaging</h3>
                                    <div className="checkbox-field">
                                        <input
                                            type="checkbox"
                                            id="showMessageButton"
                                            {...register('showMessageButton')}
                                            className="checkbox-input"
                                        />
                                        <Label htmlFor="showMessageButton" className="checkbox-label">
                                            Display a 'Message' button on your profile
                                        </Label>
                                    </div>
                                    <p className="field-hint">Messages will be sent to your email.</p>
                                </div>

                                {/* Submit Button */}
                                <div className="form-actions">
                                    <Button type="submit" disabled={isSubmitting} className="update-btn">
                                        {isSubmitting ? 'Updating...' : 'Update account'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {activeSection === 'change-password' && (
                            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="change-password-form">
                                <h1 className="form-title">Change password</h1>

                                <div className="form-field">
                                    <Label htmlFor="password">Current password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        {...registerPassword('password')}
                                        autoFocus
                                    />
                                    {passwordErrors.password && (
                                        <p className="field-error">{passwordErrors.password.message}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="newPassword">Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        {...registerPassword('newPassword')}
                                    />
                                    {passwordErrors.newPassword && (
                                        <p className="field-error">{passwordErrors.newPassword.message}</p>
                                    )}
                                </div>

                                <div className="form-field">
                                    <Label htmlFor="newPasswordMatch">Password confirmation</Label>
                                    <Input
                                        id="newPasswordMatch"
                                        type="password"
                                        {...registerPassword('newPasswordMatch')}
                                    />
                                    {passwordErrors.newPasswordMatch && (
                                        <p className="field-error">{passwordErrors.newPasswordMatch.message}</p>
                                    )}
                                </div>

                                {passwordError && (
                                    <div className="password-error-message">
                                        {passwordError}
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="password-success-message">
                                        Password changed successfully!
                                    </div>
                                )}

                                <div className="form-actions">
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="update-btn"
                                    >
                                        {isSubmitting ? 'Changing...' : 'Change password'}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {activeSection !== 'edit-profile' && activeSection !== 'change-password' && (
                            <div className="coming-soon">
                                <h2>{menuItems.find(item => item.id === activeSection)?.label}</h2>
                                <p>This section is coming soon.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}

export default ProfilePage;