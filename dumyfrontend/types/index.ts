export type state = {
    currentUser: { user_id: number; first_name: string; last_name: string; email: string } | null;
    chats: chat[];
    filteredChats: chat[] | null;
    activeChat: chat | null;
    messages: [];
    onlineUsers: Set<number>;
    typingChats: Map<number, boolean>;
    hasMoreMessages: boolean;
    isLoadingMore: boolean;
    oldestTimestamp: number | null;
    ws: WebSocket | null;
    isTyping: boolean;
    typingTimer: null;
};

export type chat = {
    chat_id: number;
    another_user_id: number;
    first_name: string;
    last_name: string;
    from_user_id: number | null;
    message_text: string | null;
    last_message_time: string | null;
};