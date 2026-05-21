'use client'

import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, X } from 'lucide-react'
import { useEffect } from 'react'
import { playSound } from '@/hooks/useSound'

interface SuccessToastProps {
    message: string
    isVisible: boolean
    onClose: () => void
}

export function SuccessToast({ message, isVisible, onClose }: SuccessToastProps) {
    useEffect(() => {
        if (isVisible) {
            playSound('success')
            const timer = setTimeout(() => {
                onClose()
            }, 5000)
            return () => clearTimeout(timer)
        }
    }, [isVisible, onClose])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="fixed top-12 -translate-y-1/2 z-50 flex items-center gap-3 bg-mid border border-white/10 p-4 -mx-8 rounded-lg shadow-lg min-w-[300px]"
                >
                    <div className="flex-shrink-0 bg-online/20 p-2 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-online" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-primary">{message}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 text-secondary hover:text-primary transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Progress bar */}
                    <motion.div
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="absolute bottom-0 left-0 right-0 h-1 bg-brand rounded-b-lg origin-left"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
