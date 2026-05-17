'use client'

import { motion, AnimatePresence } from 'motion/react'
import { AlertCircle, X } from 'lucide-react'
import { useEffect } from 'react'
import { playSound } from '@/hooks/useSound'

interface ErrorToastProps {
    message: string
    isVisible: boolean
    onClose: () => void
}

export function ErrorToast({ message, isVisible, onClose }: ErrorToastProps) {
    useEffect(() => {
        if (isVisible) {
            playSound('error')
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
                    initial={{ opacity: 0, y: 20, x: "-50%", scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, x: "-50%", scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                    className="absolute bottom-24 left-1/2 z-50 flex items-center gap-3 bg-mid border border-white/10 p-4 rounded-lg shadow-lg min-w-[300px]"
                >
                    <div className="flex-shrink-0 bg-danger/20 p-2 rounded-full">
                        <AlertCircle className="w-5 h-5 text-danger" />
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
                        className="absolute bottom-0 left-0 right-0 h-1 bg-danger rounded-b-lg origin-left"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    )
}
