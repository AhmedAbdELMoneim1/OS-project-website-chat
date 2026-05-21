'use client'

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { WS_URL } from "@/lib/config";

const SocketContext = createContext<any>({ socket: null });

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {

    const [socket, setSocket] = useState<WebSocket | null>(null);
    const { appState, setAppState } = useAuth();

    useEffect(() => {
        if (!appState.currentUser) return;

        const ws = new WebSocket(WS_URL);

        const handleOpen = () => {
            console.log('WebSocket connected');
            setSocket(ws);
        };

        const handleMessage = (event: MessageEvent) => {
            const data = JSON.parse(event.data);
            console.log('WebSocket event received:', data);

            setAppState(prev => {
                const newState = { ...prev };

                if (data.type === 'message' || data.message_id) {
                    const newMessage = data;
                    newState.chats = prev.chats.map(chat => {
                        if (chat.chat_id === newMessage.chat_id) {
                            return {
                                ...chat,
                                message_text: newMessage.message || newMessage.message_text,
                                last_message_time: newMessage.time || newMessage.created_at,
                                is_read: newMessage.is_read
                            }
                        }
                        return chat;
                    });

                    // If this message is for the active chat, update messages too
                    if (prev.activeChat?.chat_id === newMessage.chat_id) {
                        const normalizedMessage = {
                            ...newMessage,
                            message_id: newMessage.message_id,
                            chat_id: newMessage.chat_id,
                            from_user_id: newMessage.from_user_id || newMessage.sender_id,
                            message_text: newMessage.message || newMessage.message_text,
                            created_at: newMessage.time || newMessage.created_at || new Date().toISOString(),
                            is_read: newMessage.is_read || false
                        };

                        // Check if message already exists to avoid duplicates
                        const messages = prev.messages || [];
                        if (!messages.some(m => m.message_id === normalizedMessage.message_id)) {
                            newState.messages = [...messages, normalizedMessage];
                        }
                    }
                } else if (data.type === 'typing') {
                    const newTypingChats = new Map(prev.typingChats);
                    if (data.on) {
                        newTypingChats.set(data.chat_id, data.sender_id);
                    } else {
                        newTypingChats.delete(data.chat_id);
                    }
                    newState.typingChats = newTypingChats;
                } else if (data.type === 'user_state') {
                    const newOnlineUsers = new Set(prev.onlineUsers);
                    if (data.user_state === 'online') {
                        newOnlineUsers.add(data.user_id);
                    } else {
                        newOnlineUsers.delete(data.user_id);
                    }
                    newState.onlineUsers = newOnlineUsers;
                } else if (data.type === 'add_chat') {

                } else if (data.online_users) {
                    newState.onlineUsers = new Set(data.online_users);
                }

                return newState;
            });
        };

        const handleClose = () => {
            console.log('WebSocket disconnected');
            setSocket(null);
        };

        const handleError = (error: Event) => {
            console.error('WebSocket error:', error);
        };

        ws.addEventListener('open', handleOpen);
        ws.addEventListener('message', handleMessage);
        ws.addEventListener('close', handleClose);
        ws.addEventListener('error', handleError);

        return () => {
            ws.removeEventListener('open', handleOpen);
            ws.removeEventListener('message', handleMessage);
            ws.removeEventListener('close', handleClose);
            ws.removeEventListener('error', handleError);
            ws.close();
        };

    }, [appState.currentUser]);

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
        </SocketContext.Provider>
    );
}

export const useSocket = () => useContext(SocketContext);