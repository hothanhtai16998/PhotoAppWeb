import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "../ui/button"
import { useNavigate } from "react-router";

function Logout() {

    const { signOut } = useAuthStore();
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            await signOut();
            navigate("/signin");
        } catch {
            // Silently handle logout errors
            // User is already logged out locally
        }
    }


    return (
        <Button onClick={handleLogout}>Thoát</Button>
    )
}

export default Logout