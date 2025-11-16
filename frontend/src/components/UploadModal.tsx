import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useImageStore } from '@/stores/useImageStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { X, Upload, ArrowRight } from 'lucide-react';
import './UploadModal.css';

const uploadSchema = z.object({
    image: z.instanceof(FileList).refine(files => files?.length === 1, 'Image is required.'),
    imageTitle: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
    imageCategory: z.string().min(1, 'Category is required'),
    location: z.string().optional(),
    cameraModel: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
}

function UploadModal({ isOpen, onClose }: UploadModalProps) {
    const { uploadImage, loading, uploadProgress } = useImageStore();
    const { accessToken } = useAuthStore();
    const navigate = useNavigate();
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showProgress, setShowProgress] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const submitButtonRef = useRef<HTMLButtonElement>(null);
    const { register, handleSubmit, formState: { errors }, setValue, watch, reset, getValues } = useForm<UploadFormValues>({
        resolver: zodResolver(uploadSchema),
        mode: 'onSubmit',
        defaultValues: {
            imageTitle: '',
            imageCategory: '',
            location: '',
            cameraModel: '',
        },
    });

    const imageFile = watch('image');
    const imageTitle = watch('imageTitle');
    const imageCategory = watch('imageCategory');
    const imageRegister = register('image');

    // Check if all required fields are filled
    const isFormValid = selectedFile !== null &&
        imageTitle && imageTitle.trim().length > 0 &&
        imageCategory && imageCategory.trim().length > 0;

    // Handle file selection
    useEffect(() => {
        if (imageFile && imageFile.length > 0) {
            setSelectedFile(imageFile[0]);
        }
    }, [imageFile]);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            setValue('image', dataTransfer.files);
            setSelectedFile(file);
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            // Update form value
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            setValue('image', dataTransfer.files, { shouldValidate: true });
        }
    };

    const onSubmit = async (data: UploadFormValues) => {
        console.log('Form submitted with data:', data); // Debug log
        // Trim string values before submitting
        const trimmedData = {
            ...data,
            imageTitle: data.imageTitle.trim(),
            imageCategory: data.imageCategory.trim(),
            location: data.location?.trim() || '',
            cameraModel: data.cameraModel?.trim() || '',
        };

        const { image, ...rest } = trimmedData;

        // Show progress screen - progress will start at 0 from the store
        setShowProgress(true);

        try {
            // Upload will update progress from 0 to 100% in real-time via the progress callback
            // The progress tracks the actual file upload to Cloudinary
            await uploadImage({ image: image[0], ...rest });

            // Wait a moment to show 100% and "Published 1 of 1" before transitioning to success
            // This ensures the user sees the completion state
            await new Promise(resolve => setTimeout(resolve, 800));

            setShowProgress(false);
            setShowSuccess(true);
        } catch {
            setShowProgress(false);
            setShowSuccess(false);
        }
    };

    const onError = (errors: Record<string, { message?: string }>) => {
        console.log('Form validation errors:', errors); // Debug log
        console.log('Current form values:', getValues()); // Debug log
    };

    const handleViewProfile = () => {
        reset();
        setSelectedFile(null);
        setShowSuccess(false);
        setShowProgress(false);
        onClose();
        navigate('/profile');
    };

    const handleCancel = useCallback(() => {
        if (showProgress || showSuccess) return; // Prevent closing during upload/success
        reset();
        setSelectedFile(null);
        setShowProgress(false);
        setShowSuccess(false);
        onClose();
    }, [reset, onClose, showProgress, showSuccess]);

    // Handle ESC key
    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCancel();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, handleCancel]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Redirect to sign-in if not authenticated
    useEffect(() => {
        if (isOpen && !accessToken) {
            onClose();
            navigate('/signin');
        }
    }, [isOpen, accessToken, onClose, navigate]);

    // Confetti effect
    useEffect(() => {
        if (showSuccess) {
            const container = document.getElementById('confetti-container');
            if (!container) return;

            const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181'];
            const confettiCount = 50;

            for (let i = 0; i < confettiCount; i++) {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.animationDelay = `${Math.random() * 2}s`;
                confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
                container.appendChild(confetti);
            }

            return () => {
                container.innerHTML = '';
            };
        }
    }, [showSuccess]);

    if (!isOpen || !accessToken) return null;

    // Progress Screen
    if (showProgress) {
        // Ensure progress is at least 0 and at most 100
        // Progress tracks the actual upload to Cloudinary (0% to 100%)
        const displayProgress = Math.max(0, Math.min(100, uploadProgress));
        // Published count only updates when upload is 100% complete
        const publishedCount = uploadProgress === 100 ? 1 : 0;

        return (
            <div className="upload-modal-overlay">
                <div className="upload-progress-screen">
                    <div className="progress-circle-container">
                        <svg className="progress-circle" viewBox="0 0 100 100">
                            <circle
                                className="progress-circle-bg"
                                cx="50"
                                cy="50"
                                r="45"
                            />
                            <circle
                                className="progress-circle-fill"
                                cx="50"
                                cy="50"
                                r="45"
                                strokeDasharray={`${2 * Math.PI * 45}`}
                                strokeDashoffset={`${2 * Math.PI * 45 * (1 - displayProgress / 100)}`}
                            />
                        </svg>
                        <div className="progress-percentage">{displayProgress}%</div>
                    </div>
                    <p className="progress-text">Published <strong>{publishedCount}</strong> of <strong>1</strong> images...</p>
                </div>
            </div>
        );
    }

    // Success Screen
    if (showSuccess) {
        return (
            <div className="upload-modal-overlay">
                <div className="upload-success-screen">
                    <div className="confetti-container" id="confetti-container"></div>
                    <div className="success-content">
                        <div className="success-header">
                            <h1 className="success-title">Thanks for uploading 🎉</h1>
                            <p className="success-subtitle">Our Editorial team is now reviewing your image.</p>
                        </div>
                        <Button
                            className="success-button"
                            onClick={handleViewProfile}
                            size="lg"
                        >
                            View your profile
                            <ArrowRight size={20} />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Upload Screen (when no image selected)
    if (!selectedFile) {
        return (
            <div className="upload-modal-overlay" onClick={handleCancel}>
                <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="upload-modal-header">
                        <h2 className="upload-modal-title">Submit to PhotoApp</h2>
                        <button className="upload-modal-help" onClick={() => window.open('#', '_blank')}>
                            Need help?
                        </button>
                        <button className="upload-modal-close" onClick={handleCancel}>
                            <X size={20} />
                        </button>
                    </div>

                    {/* Upload Area */}
                    <div className="upload-modal-content">
                        <div
                            className={`upload-dropzone ${dragActive ? 'drag-active' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <div className="upload-icon-large">
                                <Upload size={64} />
                            </div>
                            <div className="upload-text">
                                <span className="upload-main-text">Upload a photo</span>
                                <span className="upload-tag">JPEG</span>
                            </div>
                            <div className="upload-text">
                                <span className="upload-main-text">or illustration</span>
                                <span className="upload-tag">SVG</span>
                            </div>
                            <p className="upload-instruction">Drag and drop up to 8 images or</p>
                            <p className="upload-browse">
                                <button type="button" className="upload-browse-link" onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}>Browse</button> to choose a file
                            </p>
                            <p className="upload-max-size">Max 50 MB</p>
                            <input
                                type="file"
                                accept="image/*"
                                className="upload-file-input"
                                multiple={false}
                                {...imageRegister}
                                onChange={(e) => {
                                    imageRegister.onChange(e);
                                    handleFileInput(e);
                                }}
                                ref={(e) => {
                                    fileInputRef.current = e;
                                    imageRegister.ref(e);
                                }}
                            />
                        </div>

                        {errors.image && <p className="error-text">{errors.image.message}</p>}

                        {/* Guidelines */}
                        <div className="upload-guidelines">
                            <div className="guideline-column">
                                <ul>
                                    <li>High quality images (for photos, at least 5MP)</li>
                                    <li>No AI content allowed</li>
                                </ul>
                            </div>
                            <div className="guideline-column">
                                <ul>
                                    <li>Only upload images you <strong>own the rights</strong> to</li>
                                    <li>Zero tolerance for nudity, violence or hate</li>
                                </ul>
                            </div>
                            <div className="guideline-column">
                                <ul>
                                    <li>Respect the intellectual property of others</li>
                                    <li>Read the <a href="#" className="guideline-link">PhotoApp Terms</a></li>
                                </ul>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="upload-modal-footer">
                            <a href="#" className="footer-link">Read the PhotoApp License</a>
                            <div className="footer-buttons">
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <Button type="button" disabled>
                                    Submit to PhotoApp
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Form View (when image is selected)
    return (
        <div className="upload-modal-overlay" onClick={handleCancel}>
            <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="upload-modal-header">
                    <h2 className="upload-modal-title">Submit to PhotoApp</h2>
                    <button className="upload-modal-help" onClick={() => window.open('#', '_blank')}>
                        Need help?
                    </button>
                    <button className="upload-modal-close" onClick={handleCancel}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="upload-modal-content">
                    {/* Photo Preview */}
                    <div className="upload-preview-container">
                        <div className="upload-preview">
                            <img
                                src={URL.createObjectURL(selectedFile)}
                                alt="Preview"
                                className="upload-preview-image"
                            />
                            {loading && (
                                <div className="image-upload-overlay">
                                    <div className="upload-spinner"></div>
                                    <p className="upload-text">Uploading...</p>
                                </div>
                            )}
                            {!loading && (
                                <button
                                    className="upload-remove-file"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFile(null);
                                        if (fileInputRef.current) {
                                            fileInputRef.current.value = '';
                                        }
                                        setValue('image', new DataTransfer().files);
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit(onSubmit, onError)} className="upload-form-fields">
                        <div className="form-group">
                            <Label htmlFor="imageTitle">Title</Label>
                            <Input
                                id="imageTitle"
                                type="text"
                                {...register('imageTitle')}
                                placeholder="Give your photo a title"
                            />
                            {errors.imageTitle && <p className="error-text">{errors.imageTitle.message}</p>}
                        </div>
                        <div className="form-group">
                            <Label htmlFor="imageCategory">Category</Label>
                            <Input
                                id="imageCategory"
                                type="text"
                                {...register('imageCategory')}
                                placeholder="e.g., Nature, Portrait, Architecture"
                            />
                            {errors.imageCategory && <p className="error-text">{errors.imageCategory.message}</p>}
                        </div>
                        <div className="form-group">
                            <Label htmlFor="location">Location (Optional)</Label>
                            <Input
                                id="location"
                                type="text"
                                {...register('location')}
                                placeholder="e.g., Paris, France"
                            />
                        </div>
                        <div className="form-group">
                            <Label htmlFor="cameraModel">Camera Model (Optional)</Label>
                            <Input
                                id="cameraModel"
                                type="text"
                                {...register('cameraModel')}
                                placeholder="e.g., Sony A7 III"
                            />
                        </div>

                        {/* Guidelines */}
                        <div className="upload-guidelines">
                            <div className="guideline-column">
                                <ul>
                                    <li>High quality images (for photos, at least 5MP)</li>
                                    <li>No AI content allowed</li>
                                </ul>
                            </div>
                            <div className="guideline-column">
                                <ul>
                                    <li>Only upload images you <strong>own the rights</strong> to</li>
                                    <li>Zero tolerance for nudity, violence or hate</li>
                                </ul>
                            </div>
                            <div className="guideline-column">
                                <ul>
                                    <li>Respect the intellectual property of others</li>
                                    <li>Read the <a href="#" className="guideline-link">PhotoApp Terms</a></li>
                                </ul>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="upload-modal-footer">
                            <a href="#" className="footer-link">Read the PhotoApp License</a>
                            <div className="footer-buttons">
                                <Button type="button" variant="outline" onClick={handleCancel}>
                                    Cancel
                                </Button>
                                <div className="submit-button-wrapper">
                                    <Button
                                        ref={submitButtonRef}
                                        type="submit"
                                        disabled={loading || !isFormValid}
                                        onMouseEnter={() => {
                                            if (!isFormValid && !loading) {
                                                setShowTooltip(true);
                                            }
                                        }}
                                        onMouseLeave={() => {
                                            setShowTooltip(false);
                                        }}
                                    >
                                        {loading ? 'Uploading...' : 'Submit to PhotoApp'}
                                    </Button>
                                    {showTooltip && !isFormValid && (
                                        <div className="submit-tooltip">
                                            You not fill all field
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UploadModal;

