import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useImageStore } from '@/stores/useImageStore';
import { useNavigate } from 'react-router-dom';

const uploadSchema = z.object({
    image: z.instanceof(FileList).refine(files => files?.length === 1, 'Image is required.'),
    imageTitle: z.string().min(1, 'Title is required'),
    imageCategory: z.string().min(1, 'Category is required'),
    location: z.string().min(1, 'Location is required'),
    cameraModel: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

function UploadPage() {
    const { uploadImage, loading } = useImageStore();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors } } = useForm<UploadFormValues>({
        resolver: zodResolver(uploadSchema),
    });

    const onSubmit = async (data: UploadFormValues) => {
        const { image, ...rest } = data;
        await uploadImage({ image: image[0], ...rest });
        navigate('/'); // Navigate to home page after successful upload
    };

    return (
        <div className="container mx-auto py-10">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Upload Your Photo</CardTitle>
                    <CardDescription>Share your work with the community.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="image">Photo</Label>
                            <Input id="image" type="file" accept="image/*" {...register('image')} />
                            {errors.image && <p className="text-red-500 text-sm">{errors.image.message}</p>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="imageTitle">Title</Label>
                            <Input id="imageTitle" {...register('imageTitle')} />
                            {errors.imageTitle && <p className="text-red-500 text-sm">{errors.imageTitle.message}</p>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="imageCategory">Category</Label>
                            <Input id="imageCategory" {...register('imageCategory')} placeholder="e.g., Nature, Portrait" />
                            {errors.imageCategory && <p className="text-red-500 text-sm">{errors.imageCategory.message}</p>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" {...register('location')} placeholder="e.g., Paris, France" />
                            {errors.location && <p className="text-red-500 text-sm">{errors.location.message}</p>}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="cameraModel">Camera Model (Optional)</Label>
                            <Input id="cameraModel" {...register('cameraModel')} placeholder="e.g., Sony A7 III" />
                        </div>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Uploading...' : 'Upload'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default UploadPage;