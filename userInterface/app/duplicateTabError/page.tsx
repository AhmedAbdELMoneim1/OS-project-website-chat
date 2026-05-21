'use client'

import { useRouter } from "next/navigation";

export default function DuplicateTabError() {
    const router = useRouter();

    const handleUseThisTab = () => {
        const channel = new BroadcastChannel('EnrtopyChat_tab_manager');
        channel.postMessage('forcePing');
        router.push('/');
        channel.close();
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#313338]">
            <div className="text-white text-center">
                <h1 className="text-2xl font-bold">Duplicate Tab Error</h1>
                <p className="text-gray-400">EntropyChat is already open in another tab. This tab will be disabled.</p>
            </div>
        </div>
    );
}