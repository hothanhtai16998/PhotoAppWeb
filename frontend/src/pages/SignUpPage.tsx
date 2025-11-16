import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuthStore } from "@/stores/useAuthStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import "./SignUpPage.css";

const signUpSchema = z.object({
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
});

type SignUpFormValue = z.infer<typeof signUpSchema>;

function SignUpPage() {
    const { signUp } = useAuthStore();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<SignUpFormValue>({
        resolver: zodResolver(signUpSchema),
    });

    const onSubmit = async (data: SignUpFormValue) => {
        setIsSubmitting(true);
        try {
            // For now, we'll use email as username and generate a display name
            // In a real implementation, you'd have a multi-step form
            const username = data.email.split('@')[0] + Math.floor(Math.random() * 1000);
            const firstName = data.email.split('@')[0];
            const lastName = '';

            await signUp(username, data.password, data.email, firstName, lastName);
            navigate("/signin");
        } catch (error) {
            // Error is handled by the store
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSocialLogin = (provider: string) => {
        if (provider === 'google') {
            // Google OAuth - redirect to backend
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            window.location.href = `${apiUrl}/api/auth/google`;
        } else {
            // For other providers, show coming soon message
            alert(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is coming soon!`);
        }
    };

    return (
        <div className="signup-page">
            {/* Background Image */}
            <div className="signup-background">
                <div className="background-overlay"></div>
                <div className="background-logo">
                    <span className="logo-text">Be PhotoApp</span>
                </div>
            </div>

            {/* Signup Modal */}
            <div className="signup-modal">
                <div className="signup-modal-content">
                    <div className="signup-header">
                        <span className="signup-step">Step 1 of 2</span>
                        <h1 className="signup-title">Create an account</h1>
                    </div>

                    {/* Social Login Buttons */}
                    <div className="social-login-section">
                        <button
                            type="button"
                            className="social-btn google-btn"
                            onClick={() => handleSocialLogin('google')}
                        >
                            <span className="social-icon">G</span>
                        </button>
                        <button
                            type="button"
                            className="social-btn apple-btn"
                            onClick={() => handleSocialLogin('apple')}
                        >
                            <span className="social-icon">🍎</span>
                        </button>
                        <button
                            type="button"
                            className="social-btn microsoft-btn"
                            onClick={() => handleSocialLogin('microsoft')}
                        >
                            <span className="social-icon">M</span>
                        </button>
                    </div>

                    {/* Separator */}
                    <div className="signup-separator">
                        <div className="separator-line"></div>
                        <span className="separator-text">Or</span>
                        <div className="separator-line"></div>
                    </div>

                    {/* Email Signup Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="signup-form">
                        <div className="signup-form-header">
                            <h2 className="form-subtitle">Sign up with email</h2>
                            <p className="form-switch">
                                Already have an account?{" "}
                                <Link to="/signin" className="form-link">
                                    Sign in
                                </Link>
                            </p>
                        </div>

                        <div className="form-group">
                            <Input
                                type="email"
                                id="email"
                                placeholder="Email address"
                                {...register('email')}
                                className={errors.email ? 'error' : ''}
                            />
                            {errors.email && (
                                <p className="error-message">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="form-group">
                            <div className="password-input-wrapper">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    placeholder="Password"
                                    {...register('password')}
                                    className={errors.password ? 'error' : ''}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="error-message">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="continue-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Creating...' : 'Continue'}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Footer */}
            <footer className="signup-footer">
                <p className="footer-text">
                    Copyright © 2025 PhotoApp. All rights reserved.
                </p>
                <div className="footer-links">
                    <a href="#" className="footer-link">Terms of Use</a>
                    <a href="#" className="footer-link">Cookie preferences</a>
                    <a href="#" className="footer-link">Privacy</a>
                    <a href="#" className="footer-link">Do not sell or share my personal information</a>
                </div>
            </footer>
        </div>
    );
}

export default SignUpPage;
