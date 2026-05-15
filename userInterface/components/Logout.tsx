import { DoorClosed, DoorOpen } from "lucide-react";
import { useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";

export default function Logout() {

    const [hoverLeave, setHoverLeave] = useState(false);

    const { setAppState } = useAuth();

    const handleLogout = async () => {
        try {
            await fetch(`${API_URL}/logout`, { method: 'POST', credentials: 'include' });
        } catch (error) {
            console.error("Logout failed", error);
        }
        setAppState(prev => ({ ...prev, currentUser: null }));
    }

    return (
        <button className="w-[30px] h-[30px] rounded-sm bg-transparent cursor-pointer flex items-center justify-center text-sm transition-colors hover:bg-hover hover:text-primary" id="btn-logout" title="Log out" onMouseLeave={() => setHoverLeave(false)} onMouseEnter={() => setHoverLeave(true)} onClick={handleLogout}>
            {hoverLeave ? <DoorOpen /> : <DoorClosed />}
        </button>
    )
}