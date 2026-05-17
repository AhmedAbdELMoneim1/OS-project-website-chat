import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Menu } from "@/components/animate-ui/icons/menu";
import { useSocket } from "@/context/SocketContext";
import { API_URL } from "@/lib/config";
import { Ellipsis } from "./animate-ui/icons/ellipsis";
import { ErrorToast } from "./ErrorToast";
import { playSound } from "@/hooks/useSound";

interface ChatMainProps {
    handleSidebarToggle: () => void;
}

export default function ChatMain({ handleSidebarToggle }: ChatMainProps) {
    const { appState } = useAuth();
    const activeChatId = appState.activeChat?.chat_id;
    const { socket } = useSocket();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState<any[]>([]);
    const [localIsTyping, setLocalIsTyping] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isLoadingHistory = useRef(false);
    const prevScrollHeightRef = useRef(0);
    const [showToast, setShowToast] = useState(false);
    const [blocked, setBlocked] = useState(false);

    const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const [prevMsgCount, setPrevMsgCount] = useState(0);

    useEffect(() => {
        if (messages.length > prevMsgCount) {
            if (isLoadingHistory.current) {
                // Restore scroll position
                if (containerRef.current) {
                    containerRef.current.scrollTop = containerRef.current.scrollHeight - prevScrollHeightRef.current;
                }
                isLoadingHistory.current = false;
            } else if (prevMsgCount === 0 || !isLoadingMore) {
                // Initial load or new message at bottom
                scrollToBottom(prevMsgCount === 0 ? "auto" : "smooth");
            }
        }
        setPrevMsgCount(messages.length);
    }, [messages, isLoadingMore]);

    useEffect(() => {
        if (!activeChatId) {
            setMessages([]);
            setHasMore(true);
            return;
        }

        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API_URL}/loadUserChat?chat_id=${activeChatId}&from_datetime=2099-12-31T23:59:59.000Z`, {
                    credentials: 'include'
                });

                if (res.ok) {
                    const data = await res.json();
                    // data is newest first, so we reverse it
                    const chronMessages = data.reverse();
                    setMessages(chronMessages);
                    setHasMore(data.length === 100);
                } else if (res.status === 429) {
                    console.error("Failed to load resource: the server responded with a status of 429 (Too Many Requests)");
                } else {
                    console.error("Failed to load messages:", await res.text());
                }
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        };

        fetchMessages();
    }, [activeChatId]);

    const loadMoreMessages = async () => {
        if (isLoadingMore || !hasMore || !activeChatId || messages.length === 0) return;

        setIsLoadingMore(true);
        const oldestMsg = messages[0];
        const container = containerRef.current;
        const previousScrollHeight = container?.scrollHeight || 0;

        try {
            const res = await fetch(`${API_URL}/loadUserChat?chat_id=${activeChatId}&from_datetime=${oldestMsg.created_at}`, {
                credentials: 'include'
            });

            if (res.ok) {
                const data = await res.json();
                if (data.length > 0) {
                    const chronMessages = data.reverse();
                    prevScrollHeightRef.current = container?.scrollHeight || 0;
                    isLoadingHistory.current = true;
                    setMessages(prev => [...chronMessages, ...prev]);
                    setHasMore(data.length === 100);
                } else {
                    setHasMore(false);
                }
            } else if (res.status === 429) {
                console.error("Failed to load resource: the server responded with a status of 429 (Too Many Requests)");
            }
        } catch (error) {
            console.error("Error loading more messages:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleScroll = () => {
        if (containerRef.current?.scrollTop === 0) {
            loadMoreMessages();
        }
    };

    const getGradientClass = (userId: number) => {
        const colors = [
            "bg-linear-225 from-[#F59E0B] to-[#EF4444]",
            "bg-linear-225 from-[#10B981] to-[#3B82F6]",
            "bg-linear-225 from-[#8B5CF6] to-[#EC4899]",
            "bg-linear-225 from-[#F97316] to-[#E11D48]",
            "bg-linear-225 from-[#3B82F6] to-[#06B6D4]",
            "bg-linear-225 from-[#EC4899] to-[#9333EA]"
        ];
        return colors[Math.abs(userId) % colors.length];
    };

    const activeChatName = appState.activeChat ? `${appState.activeChat.first_name} ${appState.activeChat.last_name}`.trim() : '';

    const activeChatImgAlt = appState.activeChat ? (appState.activeChat.first_name?.charAt(0) || '') + (appState.activeChat.last_name?.charAt(0) || '') : '';

    const isOnline = appState.activeChat ? appState.onlineUsers.has(appState.activeChat.another_user_id) : false;

    const isOtherTyping = appState.activeChat ? appState.typingChats.get(appState.activeChat?.chat_id) === appState.activeChat.another_user_id : false;

    const otherId = appState.activeChat ? appState.activeChat.another_user_id : null;

    // Send typing status to server
    const sendTypingStatus = (isTyping: boolean) => {
        if (!socket || !activeChatId || !appState.activeChat) return;

        const payload = {
            type: 'typing',
            on: isTyping,
            chat_id: activeChatId,
            receiver_id: appState.activeChat.another_user_id
        };

        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(payload));
        }
    };

    const handleTyping = () => {
        if (!localIsTyping) {
            setLocalIsTyping(true);
            sendTypingStatus(true);
        }

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            setLocalIsTyping(false);
            sendTypingStatus(false);
        }, 3000);
    };

    useEffect(() => {
        if (!socket) return;

        const handleMessage = (e: MessageEvent) => {
            const msg = JSON.parse(e.data);

            switch (msg.type) {
                case "message":
                    console.log("ChatMain received message via socket:", msg, "activeChatId:", activeChatId);
                    if (msg.chat_id === activeChatId) {
                        setMessages((prev: any) => [...prev, msg]);
                        if (String(msg.from_user_id) !== String(appState.currentUser?.user_id)) {
                            playSound('receive');
                        }
                    } else {
                        console.log("Ignored because chat_id mismatch");
                    }
                    break;
                case "typing":
                    // Handle typing indicator
                    break;
            }
        };

        socket.addEventListener('message', handleMessage);

        return () => {
            socket.removeEventListener('message', handleMessage);
        };
    }, [socket, activeChatId]);

    const handleSendMessage = async () => {
        if (blocked) return;
        const messageText = message.trim();
        if (!messageText.length || !socket || !appState.currentUser) {
            console.log("Cannot send:", {
                hasMessage: !!messageText.length,
                hasSocket: !!socket,
                hasUser: !!appState.currentUser
            });
            return;
        }

        const payload = {
            chat_id: activeChatId,
            message_text: messageText
        };

        try {
            const response = await fetch(`${API_URL}/sendMessages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                credentials: 'include'
            });

            if (response.ok) {
                setMessage('');
                playSound('send');
                // Stop typing immediately when message is sent
                if (typingTimeoutRef.current) {
                    clearTimeout(typingTimeoutRef.current);
                }
                setLocalIsTyping(false);
                sendTypingStatus(false);
                // the message will be added automatically from the socket 
            } else if (response.status === 429) {
                setShowToast(true);
                setBlocked(true);
                playSound('error');
            } else {
                console.error("Failed to send message:", await response.text());
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    useEffect(() => {
        if (blocked) {
            const timer = setTimeout(() => {
                setBlocked(false);
            }, 60000);
            return () => clearTimeout(timer);
        }
    }, [blocked]);

    return (
        <div className="flex-1 flex flex-col min-w-0 bg-light relative" id="chat-main">
            {/* Mobile top bar */}
            <div className="sm:hidden flex items-center gap-3 p-3 bg-light border-b border-border text-(--text-primary)">
                <button className="p-1 text-2xl" id="btn-hamburger">
                    <Menu animateOnHover onClick={handleSidebarToggle} className="cursor-pointer" />
                </button>
                <span className="text-[0.9375rem] font-bold flex-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis font-holiday" id="mobile-title">
                    {appState.activeChat ? activeChatName : "Entropy Chat"}
                </span>
            </div>

            <ErrorToast
                isVisible={showToast}
                message="Failed to load resource: the server responded with a status of 429 (Too Many Requests)"
                onClose={() => setShowToast(false)}
            />

            {!appState.activeChat ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center" id="chat-placeholder">
                    <div className="w-[72px] h-[72px] bg-mid rounded-full flex items-center justify-center text-4xl mb-2">💬</div>
                    <h3 className="text-lg font-bold">No conversation open</h3>
                    <p className="text-[0.875rem] max-w-[260px] leading-relaxed">Select a chat from the sidebar or start a new conversation.</p>
                </div>
            ) : (
                <div id="chat-view" className="flex-1 flex flex-col overflow-hidden">
                    <div className="max-sm:hidden p-3 px-5 bg-light border-b border-border flex items-center gap-3.5 shadow-[0_1px_0_var(--border)]">
                        <div className={`w-[42px] h-[42px] rounded-full ${getGradientClass(appState.activeChat.another_user_id)} text-[#f2f3f5] text-[0.9375rem] text-lg font-bold flex items-center justify-center flex-shrink-0`} id="hdr-avatar">{activeChatImgAlt}</div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-row gap-2 items-center">
                                <div className="text-[0.9375rem] font-bold" id="hdr-name">{activeChatName}</div>
                                <div className="text-xs text-secondary">{"#" + otherId?.toString().padStart(4, '0')}</div>
                            </div>
                            <div className="text-[0.8125rem] flex items-center gap-1.5 mt-px">
                                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-text-muted'}`} id="status-dot"></span>
                                {isOtherTyping ?
                                    <span className="text-brand font-medium text-xs animate-pulse">typing…</span> :
                                    <span id="status-text" className="text-xs">{isOnline ? 'Online' : 'Offline'}</span>
                                }
                            </div>
                        </div>
                    </div>

                    <div
                        className="flex-1 overflow-y-auto p-4 pb-2 overscroll-contain"
                        id="messages-container"
                        ref={containerRef}
                        onScroll={handleScroll}
                    >
                        <div className="flex flex-col gap-0 pb-2" id="messages-list">
                            {messages.map((msg, index) => {
                                const isMe = String(msg.from_user_id) === String(appState.currentUser?.user_id);
                                return (
                                    <div key={msg.message_id || index} className={`flex w-full mb-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] px-4 py-2 text-[0.9375rem] shadow-sm flex flex-col gap-1 ${isMe
                                            ? 'bg-brand text-white rounded-2xl rounded-tr-sm'
                                            : 'bg-mid text-primary rounded-2xl rounded-tl-sm'
                                            }`}>
                                            <span className="leading-relaxed break-words">{msg.message_text}</span>
                                            <span className={`text-[0.65rem] font-medium self-end ${isMe ? 'text-white/70' : 'text-muted'}`}>
                                                {new Date(new Date(msg.created_at || new Date()).getTime() + 3 * 60 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div id="typing-row" className={`flex py-0.5 animate-in fade-in slide-in-from-bottom-1 ${isOtherTyping ? '' : 'hidden'}`}>
                            <div className="bg-mid text-primary px-3.5 py-2 rounded-lg rounded-bl-sm max-w-[72%] sm:max-w-[480px]">
                                <div className="flex gap-1 items-center h-4">
                                    <div className="bg-text-muted rounded-full text-secondary font-bold text-2xl">
                                        <Ellipsis animate="jump" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div id="messages-end" ref={messagesEndRef}></div>
                    </div>

                    <div className="p-4 pt-0">
                        <div className="bg-input rounded-lg flex items-center gap-1.5 p-1 px-3.5 min-h-[44px] shadow-md transition-all focus-within:shadow-lg">
                            <textarea
                                className="flex-1 bg-transparent border-none outline-none font-primary text-base text-primary py-2.5 resize-none max-h-[160px] scrollbar-none placeholder:text-muted/60"
                                id="msg-input"
                                placeholder="Message…"
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    handleTyping();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            ></textarea>
                            <button 
                                className="p-2 text-brand hover:text-brand-hover disabled:opacity-30 disabled:grayscale transition-colors cursor-pointer" 
                                id="btn-send" 
                                onClick={handleSendMessage}
                                disabled={blocked || !message.trim()}
                            >
                                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                                    <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
