import { Pencil, PencilLine } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogOverlay, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useState } from "react";
import { API_URL } from "@/lib/config";
import { useAuth } from "@/context/AuthContext";
import type { chat } from "../types";
// import { loadChats } from "@/lib/api/chatService";

interface Props {
    selectChat: (chat: chat) => void;
    loadChats: () => Promise<void>;
}

export default function AddChatDialog({ selectChat, loadChats }: Props) {

    const { appState } = useAuth();

    const [hoverPencil, setHoverPencil] = useState(false);
    const [userId, setUserId] = useState<number>();

    const addChat = async () => {
        if (!userId) return;
        try {
            const res = await fetch(`${API_URL}/addChat?other_user_id=${userId}`, {
                method: "POST",
                credentials: "include"
            });
            if (res.ok) {
                const data = await res.json();
                console.log(data);
                await loadChats();
                const chat = appState.chats.find(c => c.chat_id === data.chat_id);
                if (chat) selectChat(chat);
                else if (appState.chats.length) selectChat(appState.chats[0]);
                // } else if (res.status === 429) {
                //     console.error("Failed to load resource: the server responded with a status of 429 (Too Many Requests)");
            } else { alert('Failed to create chat. User may not exist.'); }
        } catch (e) {
            console.error('addChat', e);
        }
    }

    return (
        <Dialog>
            <form>
                <DialogTrigger asChild>
                    <button className="w-[30px] h-[30px] rounded-sm bg-transparent cursor-pointer flex items-center justify-center text-sm transition-colors hover:bg-hover hover:text-primary" id="btn-new-chat" title="New message" onMouseLeave={() => setHoverPencil(false)} onMouseEnter={() => setHoverPencil(true)}>
                        {hoverPencil ? <PencilLine size={18} className="text-gray-400" /> : <Pencil size={18} />}
                    </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-mid border border-white/10 p-6 rounded-lg shadow-xl" showCloseButton={false}>
                    <DialogHeader className="mb-2">
                        <DialogTitle className="text-2xl font-bold text-primary mb-1.5 flex">New Message</DialogTitle>
                        <DialogDescription className="text-sm text-muted">
                            Start a conversation with someone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mb-4">
                        <label htmlFor="new-chat-user-id" className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider">
                            User ID
                        </label>
                        <input
                            type="number"
                            id="new-chat-user-id"
                            placeholder="Enter user ID…"
                            value={userId}
                            onChange={(e) => setUserId(Number(e.target.value))}
                            className="w-full p-2.5 bg-dark border border-white/10 rounded-sm font-primary text-base text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/25 transition-all"
                        />
                    </div>
                    <div className="w-full mt-2 flex gap-3">
                        <DialogClose asChild>
                            <button type="button" className="flex-1 p-3 bg-transparent text-primary rounded-sm font-primary text-base font-semibold cursor-pointer transition-all hover:bg-white/5 active:scale-95">
                                Cancel
                            </button>
                        </DialogClose>
                        <DialogClose asChild>
                            <button type="button" className="flex-3 p-3 bg-brand text-[#f2f3f5] border-none rounded-sm font-primary text-base font-semibold cursor-pointer transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed" onClick={addChat}>
                                Open Chat
                            </button>
                        </DialogClose>
                    </div>
                </DialogContent>
            </form>
            <DialogOverlay className="bg-black/50" />
        </Dialog>
    )
}