import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/lib/config";

export function useChats() {
    const { appState, setAppState } = useAuth();
    const [loading, setLoading] = useState(false);

    const fetchChats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/loadChats`, {
                method: 'GET',
                credentials: 'include'
            });
            if (res.ok) {
                const data = await res.json();
                setAppState(prev => ({ ...prev, chats: data }))
            }
        } catch (error) {
            console.error("Failed to fetch chats:", error);
        } finally {
            setLoading(false);
        }
    }, [setAppState]);

    return { chats: appState.chats, loading, fetchChats };
}