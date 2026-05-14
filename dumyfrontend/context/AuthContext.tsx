'use client'

import { createContext, useContext, useEffect, useState, Dispatch, SetStateAction } from "react";
import { state, chat } from "@/types";
import { API_URL } from "@/lib/config";

const initialState: state = {
    currentUser: null,
    chats: [],
    filteredChats: null,
    activeChat: null,
    messages: [],
    onlineUsers: new Set(),
    typingChats: new Map(),
    hasMoreMessages: false,
    isLoadingMore: false,
    oldestTimestamp: null,
    ws: null,
    isTyping: false,
    typingTimer: null,
};

type AuthContextType = {
    appState: state;
    setAppState: Dispatch<SetStateAction<state>>;
    isLoading: boolean;
    isDark: boolean;
    setIsDark: Dispatch<SetStateAction<boolean>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [appState, setAppState] = useState<state>(initialState);
    const [isLoading, setIsLoading] = useState(true);
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const res = await fetch(`${API_URL}/me`, { credentials: "include" });
                if (res.ok) {
                    const userData = await res.json();
                    setAppState(prev => ({ ...prev, currentUser: userData }))
                }
            } catch (error) {
                console.error("Auth check failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkUser();
    }, []);

    return (
        <AuthContext.Provider value={{ appState, setAppState, isLoading, isDark, setIsDark }
        }>
            {children}
        </AuthContext.Provider>
    );
}