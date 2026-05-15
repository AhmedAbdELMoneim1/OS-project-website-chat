import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";

export const useSocket = () => {
    const { appState, setAppState } = useAuth();

    useEffect(() => {
        const socket = new WebSocket(`ws://localhost:8000/ws/${appState.currentUser?.user_id}`);

        socket.onmessage = (e) => {
            const newMessage = JSON.parse(e.data);
            setAppState(prev => ({
                ...prev, chats: prev.chats.map(chat => {
                    if (chat.chat_id === newMessage.chat_id) {
                        return {
                            ...chat,
                            last_message: newMessage.message,
                            last_message_time: newMessage.time,
                            is_read: newMessage.is_read
                        }
                    }
                    return chat;
                })
            }))
            console.log(newMessage);
        }

        return () => {
            socket.close();
        }
    }, [appState.currentUser?.user_id]);
}