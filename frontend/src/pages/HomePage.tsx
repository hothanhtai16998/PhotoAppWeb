import Header from "../components/Header";
import ImageGrid from "@/components/ImageGrid";
import './HomePage.css';

function HomePage() {
    return (
        <>
            <Header />
            <main className="homepage">
                <div className="homepage-hero">
                    <h1 className="hero-title">The internet's source for visuals.</h1>
                    <p className="hero-subtitle">Powered by creators everywhere.</p>
                </div>
                <ImageGrid />
            </main>
        </>
    );
}

export default HomePage;