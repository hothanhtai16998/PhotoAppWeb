
import { useAuthStore } from "@/stores/useAuthStore";
import { useEffect } from "react";

interface AppInitializerProps {
    children: React.ReactNode;
}

function AppInitializer({ children }: AppInitializerProps) {
    const { initializeApp, isInitializing } = useAuthStore((s) => ({
        initializeApp: s.initializeApp,
        isInitializing: s.isInitializing,
    }));

    useEffect(() => {
        initializeApp();
    }, [initializeApp]);

    if (isInitializing) {
        // You can replace this with a more sophisticated loading spinner
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    return <>{children}</>;
}

export default AppInitializer;
