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
import { X, Upload } from 'lucide-react';
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
    const { uploadImage, loading } = useImageStore();
    const { accessToken } = useAuthStore();
    const navigate = useNavigate();
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<UploadFormValues>({
        resolver: zodResolver(uploadSchema),
    });

    const imageFile = watch('image');

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
            setSelectedFile(e.target.files[0]);
        }
    };

    const onSubmit = async (data: UploadFormValues) => {
        const { image, ...rest } = data;
        await uploadImage({ image: image[0], ...rest });
        reset();
        setSelectedFile(null);
        onClose();
    };

    const handleCancel = useCallback(() => {
        reset();
        setSelectedFile(null);
        onClose();
    }, [reset, onClose]);

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

    if (!isOpen || !accessToken) return null;

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
                        className={`upload-dropzone ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {selectedFile ? (
                            <div className="upload-preview">
                                <img
                                    src={URL.createObjectURL(selectedFile)}
                                    alt="Preview"
                                    className="upload-preview-image"
                                />
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
                            </div>
                        ) : (
                            <>
                                <div className="upload-icon-large">
                                    <Upload size={48} />
                                </div>
                                <div className="upload-text">
                                    <span className="upload-main-text">Upload a photo</span>
                                    <span className="upload-tag">JPEG</span>
                                </div>
                                <div className="upload-text">
                                    <span className="upload-main-text">or illustration</span>
                                    <span className="upload-tag">SVG</span>
                                </div>
                                <p className="upload-instruction">Drag and drop up to 10 images</p>
                                <p className="upload-browse">
                                    or <button type="button" className="upload-browse-link">Browse</button> to choose a file
                                </p>
                                <p className="upload-max-size">Max 50 MB</p>
                            </>
                        )}
                        <input
                            ref={(e) => {
                                fileInputRef.current = e;
                                register('image').ref(e);
                            }}
                            type="file"
                            accept="image/*"
                            className="upload-file-input"
                            onChange={(e) => {
                                register('image').onChange(e);
                                handleFileInput(e);
                            }}
                            multiple={false}
                        />
                    </div>

                    {errors.image && <p className="error-text">{errors.image.message}</p>}

                    {/* Form Fields */}
                    <form onSubmit={handleSubmit(onSubmit)} className="upload-form-fields">
                        <div className="form-group">
                            <Label htmlFor="imageTitle">Title</Label>
                            <Input id="imageTitle" {...register('imageTitle')} placeholder="Give your photo a title" />
                            {errors.imageTitle && <p className="error-text">{errors.imageTitle.message}</p>}
                        </div>
                        <div className="form-group">
                            <Label htmlFor="imageCategory">Category</Label>
                            <Input id="imageCategory" {...register('imageCategory')} placeholder="e.g., Nature, Portrait, Architecture" />
                            {errors.imageCategory && <p className="error-text">{errors.imageCategory.message}</p>}
                        </div>
                        <div className="form-group">
                            <Label htmlFor="location">Location (Optional)</Label>
                            <Input id="location" {...register('location')} placeholder="e.g., Paris, France" />
                        </div>
                        <div className="form-group">
                            <Label htmlFor="cameraModel">Camera Model (Optional)</Label>
                            <Input id="cameraModel" {...register('cameraModel')} placeholder="e.g., Sony A7 III" />
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
                                <Button type="submit" disabled={loading || !selectedFile}>
                                    {loading ? 'Uploading...' : 'Submit to PhotoApp'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default UploadModal;

