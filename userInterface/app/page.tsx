'use client'

import { useState } from "react";
import SideBar from "@/components/SideBar";
import ChatMain from "@/components/ChatMain";

export default function Home() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleSidebarToggle = () => {
        const newSidebarOpen = !sidebarOpen;
        setSidebarOpen(newSidebarOpen);
        console.log(sidebarOpen);
    }

    return (
        <div id="app-screen" className="flex h-screen overflow-hidden bg-dark text-primary">

            {/* <!-- Mobile Sidebar Backdrop --> */}
            {sidebarOpen && (
                <div
                    className="sm:hidden fixed inset-0 bg-black/60 z-9 animate-fade-in"
                    onClick={handleSidebarToggle}
                />
            )}

            <SideBar sidebarOpen={sidebarOpen} />

            <ChatMain handleSidebarToggle={handleSidebarToggle} />
        </div>
    );
}

