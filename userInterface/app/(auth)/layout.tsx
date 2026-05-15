import { AnimateIcon } from "@/components/animate-ui/icons/icon";
import { MessageSquareMore } from "@/components/animate-ui/icons/message-square-more";

export default function Authentication({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <main className="fixed inset-0 flex items-center justify-center bg-(--bg-dark) p-4 z-[200]">
            <div className="w-full max-w-[420px]">
                <div className="bg-(--bg-mid) rounded-lg p-8 shadow-lg">
                    <AnimateIcon animateOnHover completeOnStop>
                        <div className="flex items-center gap-[0.625rem] justify-center mb-6">
                            <div className="w-10 h-10 bg-brand text-[#f2f3f5] rounded-lg flex items-center justify-center text-xl">
                                <MessageSquareMore size={24} />
                            </div>
                            <span className="text-[1.375rem] font-bold tracking-tight text-primary">Entropy Chat</span>
                        </div>
                    </AnimateIcon>
                    {children}
                </div>
            </div>
        </main >
    );
}
