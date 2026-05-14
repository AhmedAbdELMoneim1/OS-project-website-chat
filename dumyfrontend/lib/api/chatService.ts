import { API_URL } from "../config";

export async function loadChats() {
    try {
        const res = await fetch(`${API_URL}/loadChats`, {
            method: 'GET',
            credentials: 'include'
        });
        if (res.ok) {
            const data = await res.json();
            return data;
        }
    } catch (error) {
        console.error("Failed to load chats:", error);
        return [];
    }
}

