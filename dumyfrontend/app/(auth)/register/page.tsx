'use client'

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { API_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Register() {

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [registerError, setRegisterError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [registerring, setRegisterring] = useState(false);

    const router = useRouter();

    async function HandleRegister() {
        setRegisterring(true);
        setRegisterError(false);
        setErrorMessage('');

        if (!firstName || !lastName || !email || !password) {
            setRegisterring(false);
            setRegisterError(true);
            setErrorMessage('Please fill in all fields.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password })
            });
            if (res.ok) {
                setRegisterring(false);
                setRegisterError(false);
                setErrorMessage('');
                router.push('/login');
            } else {
                const error = await res.json().catch(() => ({}));
                setRegisterring(false);
                setRegisterError(true);
                setErrorMessage(error.detail || "Registration failed.");
            }
        } catch {
            setRegisterring(false);
            setRegisterError(true);
            setErrorMessage('Connection error. Try again.');
        }
    }

    return (
        <div className="w-full">
            <h1 className="text-2xl font-bold text-center mb-1.5 text-primary">Create an account</h1>
            <p className="text-sm text-muted text-center mb-6">Join and start chatting today.</p>

            {registerError && (
                <div className="bg-danger/15 border border-danger/30 text-[#f8a3a5] text-[0.8125rem] p-2 rounded-sm mb-3.5">
                    {errorMessage}
                </div>
            )}

            <div className="flex gap-3 mb-3.5">
                <div className="flex-1">
                    <label className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider">First name</label>
                    <input
                        type="text"
                        placeholder="Ali"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full p-2.5 bg-dark border border-white/10 rounded-sm font-primary text-base text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/25 transition-all"
                    />
                </div>
                <div className="flex-1">
                    <label className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider">Last name</label>
                    <input
                        type="text"
                        placeholder="Hassan"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-2.5 bg-dark border border-white/10 rounded-sm font-primary text-base text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/25 transition-all"
                    />
                </div>
            </div>

            <div className="mb-3.5">
                <label className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider">Email</label>
                <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-dark border border-white/10 rounded-sm font-primary text-base text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/25 transition-all"
                />
            </div>

            <div className="mb-3.5">
                <label className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider">Password</label>
                <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2.5 bg-dark border border-white/10 rounded-sm font-primary text-base text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/25 transition-all"
                />
            </div>

            <button
                className={cn(
                    "w-full p-3 bg-brand text-[#f2f3f5] border-none rounded-sm font-primary text-base font-semibold cursor-pointer mt-2 transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                    registerring && "opacity-50 cursor-not-allowed"
                )}
                onClick={HandleRegister}
                disabled={registerring}
            >
                {registerring ? 'Registering...' : 'Register'}
            </button>

            <div className="text-center mt-4 text-sm text-muted">
                Already have an account?{' '}
                <Link href="/login" className="text-brand font-medium no-underline hover:underline">
                    Log In
                </Link>
            </div>
        </div>
    )
}
