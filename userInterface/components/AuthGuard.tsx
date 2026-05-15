'use client'

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { appState, isLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const publicRoutes = ['/login', '/register'];
    const isPublicRoute = publicRoutes.includes(pathname);

    useEffect(() => {
        const channel = new BroadcastChannel('EnrtopyChat_tab_manager');

        channel.onmessage = (event) => {
            console.log("Received message from another tab:", event.data);

            if (event.data === 'ping') {
                console.error("ERROR: Duplicate tab detected");
                router.push('/duplicateTabError');
                channel.postMessage('pong');
            }

            if (event.data === 'reopen') {
                if (pathname === '/duplicateTabError') {
                    console.log("onlyme?")
                    router.push('/');
                }
            }
        };

        if (pathname !== '/duplicateTabError') {
            channel.postMessage('ping');
        }

        return () => {
            if (pathname !== '/duplicateTabError') {
                channel.postMessage('reopen');
            }
            channel.close();
        };
    }, [pathname, router]);

    useEffect(() => {
        if (isLoading) return;

        if (!appState.currentUser) {
            // If no user and not on a public route, go to login
            if (!isPublicRoute) {
                router.push('/login');
            }
        } else {
            // If logged in and on a public route, go to app
            if (isPublicRoute) {
                router.push('/');
            }
        }
    }, [appState.currentUser, pathname, isLoading, isPublicRoute, router]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#313338]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!appState.currentUser && !isPublicRoute) return null;
    if (appState.currentUser && isPublicRoute) return null;

    return <>{children}</>;
}
