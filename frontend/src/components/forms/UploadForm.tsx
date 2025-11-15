
import { useState } from 'react';
import { useImageStore } from '@/stores/useImageStore';
import type { UploadImageData } from '@/types/store';

export const UploadForm = () => {
    const uploadImage = useImageStore((state) => state.uploadImage);
    const loading = useImageStore((state) => state.loading);

    const [image, setImage] = useState<File | null>(null);
    const [imageTitle, setImageTitle] = useState('');
    const [imageCategory, setImageCategory] = useState('');
    const [location, setLocation] = useState('');
    const [cameraModel, setCameraModel] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!image || !imageTitle || !imageCategory) {
            alert('Please fill in all required fields.');
            return;
        }

        const data: Omit<UploadImageData, 'image'> & { image: File } = {
            image,
            imageTitle,
            imageCategory,
            location,
            cameraModel,
        };

        await uploadImage(data);

        // Optionally, reset the form after submission
        setImage(null);
        setImageTitle('');
        setImageCategory('');
        setLocation('');
        setCameraModel('');
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Upload Image</h2>
            <div>
                <label htmlFor="image">Image File:</label>
                <input
                    type="file"
                    id="image"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                />
            </div>
            <div>
                <label htmlFor="imageTitle">Title:</label>
                <input
                    type="text"
                    id="imageTitle"
                    value={imageTitle}
                    onChange={(e) => setImageTitle(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="imageCategory">Category:</label>
                <input
                    type="text"
                    id="imageCategory"
                    value={imageCategory}
                    onChange={(e) => setImageCategory(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="location">Location (Optional):</label>
                <input
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>
            <div>
                <label htmlFor="cameraModel">Camera Model (Optional):</label>
                <input
                    type="text"
                    id="cameraModel"
                    value={cameraModel}
                    onChange={(e) => setCameraModel(e.target.value)}
                />
            </div>
            <button type="submit" disabled={loading}>
                {loading ? 'Uploading...' : 'Upload'}
            </button>
        </form>
    );
};
