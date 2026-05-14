import { cn } from "@/lib/utils";
import { AnimateIcon } from "./animate-ui/icons/icon";
import { MessageSquareMore } from "./animate-ui/icons/message-square-more";
import { SunMedium } from "./animate-ui/icons/sun-medium";
import { Moon } from "./animate-ui/icons/moon";
import { DoorClosed, DoorOpen, Pencil, PencilLine } from "lucide-react";
import { Search } from "./animate-ui/icons/search";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import AddChatDialog from "./AddChatDialog";
import { useChats } from "@/hooks/useChats";
import { chat } from "@/types";

export default function SideBar() {

    const { appState, setAppState, isDark, setIsDark } = useAuth();
    const { fetchChats } = useChats();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [hoverLeave, setHoverLeave] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [foundChats, setFoundChats] = useState<chat[]>([]);
    const [displayChats, setDisplayChats] = useState<chat[]>([]);

    useEffect(() => {
        if (appState.chats.length === 0) {
            fetchChats();
        }
    }, [appState.chats.length, fetchChats]);

    useEffect(() => {
        setDisplayChats(searchInput === '' ? appState.chats : foundChats);
    }, [foundChats, appState.chats, searchInput]);

    const handleThemeToggle = () => {
        setIsDark(!isDark);
        localStorage.setItem('sl-dark', String(isDark));
    }

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

    const selectChat = (chat: any) => {
        setAppState(prev => ({ ...prev, activeChat: chat }));
    };

    const formatTime = (timeStr: string | null) => {
        if (!timeStr) return '';
        const date = new Date(timeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleChatSearch = (searchValue: string) => {
        setSearchInput(searchValue);
        const searchResults = appState.chats.filter((chat) => chat.first_name.toLowerCase().concat(chat.last_name.toLowerCase()).includes(searchValue.trim().toLowerCase()));
        setFoundChats(searchResults);
    };

    const handleLogout = () => {
        setAppState(prev => ({ ...prev, currentUser: null }));
    }

    return (
        <div className={cn(
            "w-sidebar min-w-sidebar bg-mid flex flex-col transition-transform duration-120 ease z-10 relative max-sm:fixed max-sm:inset-y-0 max-sm:left-0 max-sm:w-[80vw] max-sm:max-w-[300px] shadow-lg",
            sidebarOpen ? "max-sm:translate-x-0" : "max-sm:-translate-x-full"
        )} id="sidebar">
            <div className="p-3.5 flex items-center justify-between gap-2 text-(--text-primary)">
                <AnimateIcon animateOnHover completeOnStop>
                    <div className="flex items-center gap-2 font-bold text-[0.9375rem] tracking-tight flex-1 min-w-0 cursor-default">
                        <div className="w-7 h-7 bg-brand text-[#f2f3f5] rounded-[7px] flex items-center justify-center text-sm flex-shrink-0"><MessageSquareMore size={24} /></div>
                        Entropy Chat
                    </div>
                </AnimateIcon>
                <div className="flex items-center gap-1">
                    <button className="w-[30px] h-[30px] rounded-sm bg-transparent cursor-pointer flex items-center justify-center text-sm transition-colors hover:bg-hover hover:text-primary" id="btn-theme" title="Toggle theme" onClick={handleThemeToggle}>{isDark ? <SunMedium animateOnHover size={20} className="hover:text-yellow-500" completeOnStop /> : <Moon animateOnHover size={20} className="hover:text-gray-400" completeOnStop />
                    }</button>
                    <AddChatDialog selectChat={selectChat} loadChats={fetchChats} />
                </div>
            </div>

            <AnimateIcon animateOnHover completeOnStop >
                <div className="p-2 border-y border-border relative">
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2" />
                    <input className="w-full bg-dark rounded-sm p-1.5 px-4 pl-10 font-primary text-[0.8125rem] outline-none" id="search-input" placeholder="Find a conversation…" value={searchInput} onChange={(e) => handleChatSearch(e.target.value)} />
                </div>
            </AnimateIcon>

            <div className="p-4 px-3 pb-1 text-[0.6875rem] font-bold uppercase tracking-widest flex items-center justify-between">
                Direct Messages
            </div>

            <div className="flex-1 overflow-y-auto px-2" id="chats-list">
                {appState.chats.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted">
                        {appState.filteredChats ? 'No results' : 'No conversations yet'}
                    </div>
                ) : (
                    displayChats.map((chat) => {
                        const name = `${chat.first_name} ${chat.last_name}`.trim();
                        const isOnline = appState.onlineUsers.has(chat.another_user_id);
                        const isTyping = appState.typingChats.has(chat.chat_id);
                        const isActive = appState.activeChat?.chat_id === chat.chat_id;
                        const isMine = chat.from_user_id === appState.currentUser?.user_id;
                        const initials = (chat.first_name?.charAt(0) || '') + (chat.last_name?.charAt(0) || '');

                        let previewHtml: React.ReactNode = <span style={{ opacity: 0.4 }}>No messages yet</span>;
                        if (isTyping) {
                            previewHtml = <span className="text-brand font-medium animate-pulse">typing…</span>;
                        } else if (chat.message_text) {
                            previewHtml = (
                                <>
                                    {isMine && <span className="text-primary font-medium">You: </span>}
                                    {chat.message_text.slice(0, 60)}
                                </>
                            );
                        }

                        return (
                            <div
                                key={chat.chat_id}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors mb-0.5",
                                    isActive ? "bg-hover" : "hover:bg-hover/50"
                                )}
                                onClick={() => selectChat(chat)}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-full text-white text-sm font-bold flex items-center justify-center relative flex-shrink-0", getGradientClass(chat.another_user_id)
                                )}>
                                    {initials}
                                    <div className={cn(
                                        "absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-mid",
                                        isOnline ? "bg-emerald-500" : "bg-gray-500"
                                    )}></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <div className="font-semibold text-primary text-[0.9375rem] truncate">{name}</div>
                                        {chat.last_message_time && (
                                            <div className="text-[0.6875rem] text-muted whitespace-nowrap ml-2">
                                                {formatTime(chat.last_message_time)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[0.8125rem] text-secondary truncate">
                                        {previewHtml}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="p-2.5 px-3 bg-dark flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-linear-225 from-[#F59E0B] to-[#EF4444] text-[0.8125rem] font-bold flex items-center justify-center flex-shrink-0 relative tracking-tight cursor-default" id="current-avatar">{(appState.currentUser?.first_name.charAt(0) ? appState.currentUser?.first_name.charAt(0) : '') + (appState.currentUser?.last_name.charAt(0) ? appState.currentUser?.last_name.charAt(0) : '')}</div>
                <div className="flex-1 min-w-0 cursor-default">
                    <div className="text-[0.875rem] font-semibold text-primary whitespace-nowrap overflow-hidden text-ellipsis" id="current-name">{appState.currentUser?.first_name + " " + appState.currentUser?.last_name}</div>
                    <div className="text-xs " id="current-tag">{"#" + appState.currentUser?.user_id.toString().padStart(4, '0')}</div>
                </div>
                <button className="w-[30px] h-[30px] rounded-sm bg-transparent cursor-pointer flex items-center justify-center text-sm transition-colors hover:bg-hover hover:text-primary" id="btn-logout" title="Log out" onMouseLeave={() => setHoverLeave(false)} onMouseEnter={() => setHoverLeave(true)} onClick={handleLogout}>
                    {hoverLeave ? <DoorOpen /> : <DoorClosed />}
                </button>
            </div>
        </div>
    )
}