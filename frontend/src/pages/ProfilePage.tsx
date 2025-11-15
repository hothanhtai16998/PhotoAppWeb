import { useAuthStore } from "@/stores/useAuthStore";

function ProfilePage() {

    const user = useAuthStore((s) => s.user);

    if (!user) {
        //
    }

    return (
        <div>ProfilePage
            {user?.displayName}
        </div>
    )
}

export default ProfilePage