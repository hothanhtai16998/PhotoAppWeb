import Header from "../components/Header";
import ImageGrid from "@/components/ImageGrid";
import './HomePage.css';
import { lazy, Suspense } from 'react';

// Lazy load Slider component to improve initial load time
const Slider = lazy(() => import("@/components/Slider"));

function HomePage() {
    return (
        <>
            <Header />
            <main className="homepage">
                <Suspense fallback={<div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải...</div>}>
                    <Slider />
                </Suspense>
                <ImageGrid />
            </main>
        </>
    );
}

export default HomePage;