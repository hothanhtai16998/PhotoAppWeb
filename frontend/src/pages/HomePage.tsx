import SearchBar from "@/components/SearchBar"
import Header from "../components/Header"
import ImageGrid from "@/components/ImageGrid"

function HomePage() {
    return (
        <>
            <Header />
            <main className="homepage">
                <div className="content-wrapper">
                    <SearchBar />
                    <ImageGrid />
                </div>
            </main>
        </>
    )
}

export default HomePage