'use client'

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { API_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";


export default function Login() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loggingIn, setLoggingIn] = useState(false);

    const { setAppState } = useAuth();

    const router = useRouter();

    async function HandleLogin() {
        setLoggingIn(true);
        setLoginError(false);
        setErrorMessage('');

        if (!email || !password) {
            setLoggingIn(false);
            setLoginError(true);
            setErrorMessage('Please fill in all fields.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            if (res.ok) {
                setLoggingIn(false);
                setLoginError(false);
                setErrorMessage('');
                const meRes = await fetch(`${API_URL}/me`, { credentials: 'include' });
                if (meRes.ok) {
                    const data = await meRes.json();
                    setAppState(prev => ({ ...prev, currentUser: data }))
                    router.push('/');
                }
            } else {
                setLoggingIn(false);
                setLoginError(true);
                setErrorMessage('Invalid email or password.');
            }
        } catch {
            setLoggingIn(false);
            setLoginError(true);
            setErrorMessage('Connection error. Try again.');
        }
    }

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-center mb-1.5 text-primary">Welcome back!</h1>
            <p className="text-sm text-muted text-center mb-6">We're so excited to see you again!</p>

            {loginError && (
                <div className="bg-danger/15 border border-danger/30 text-[#f8a3a5] text-[0.8125rem] p-2 rounded-sm mb-3.5">
                    {errorMessage}
                </div>
            )}

            <div className="mb-3.5">
                <label htmlFor="login-email" className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider">
                    Email
                </label>
                <input
                    type="email"
                    id="login-email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-dark border border-white/10 rounded-sm font-primary text-base text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/25 transition-all"
                />
            </div>

            <div className="mb-3.5">
                <label htmlFor="login-password" className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider">
                    Password
                </label>
                <input
                    type="password"
                    id="login-password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-dark border border-white/10 rounded-sm font-primary text-base text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/25 transition-all"
                />
            </div>

            <button
                className={cn(
                    "w-full p-3 bg-brand text-[#f2f3f5] border-none rounded-sm font-primary text-base font-semibold cursor-pointer mt-2 transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                    loggingIn && "opacity-50 cursor-not-allowed"
                )}
                onClick={HandleLogin}
                disabled={loggingIn}
            >
                {loggingIn ? 'Logging in...' : 'Log In'}
            </button>

            <div className="text-center mt-4 text-sm text-muted">
                Need an account?{' '}
                <Link href="/register" className="text-brand font-medium no-underline hover:underline">
                    Register
                </Link>
            </div>
        </div>
    )
}
