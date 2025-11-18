import Header from "../components/Header";
import ImageGrid from "@/components/ImageGrid";
import CategoryNavigation from "@/components/CategoryNavigation";
import './HomePage.css';
import Slider from "@/components/Slider";

function HomePage() {
    return (
        <>
            <Header />
            <main className="homepage">
                <Slider />
                <CategoryNavigation />
                <ImageGrid />
            </main>
        </>
    );
}

export default HomePage;