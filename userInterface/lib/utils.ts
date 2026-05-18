import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


export function detectTextDirection(text: string): 'ltr' | 'rtl' {
    if (!text) return 'ltr';
    const arabicRegex = /[\u0600-\u06FF]/;

    return arabicRegex.test(text) ? 'rtl' : 'ltr';
}