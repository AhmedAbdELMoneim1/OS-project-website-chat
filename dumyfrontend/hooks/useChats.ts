import { loadChats } from "@/lib/api/chatService";
import { useCallback, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export function useChats() {
    const { appState, setAppState } = useAuth();
    const [loading, setLoading] = useState(false);

    const fetchChats = useCallback(async () => {
        setLoading(true);
        try {
            const data = await loadChats();
            setAppState(prev => ({ ...prev, chats: data }));
        } finally {
            setLoading(false);
        }
    }, [setAppState]);

    return { chats: appState.chats, loading, fetchChats };
}