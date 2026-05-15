'use client'

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

import { API_URL } from "@/lib/config";
import { useRouter } from "next/navigation";
import { SuccessToast } from "@/components/SuccessToast";

export default function Register() {

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');

    const [step, setStep] = useState<'details' | 'otp'>('details');
    const [registerError, setRegisterError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);

    const router = useRouter();

    async function HandleSendOTP() {
        setLoading(true);
        setRegisterError(false);
        setErrorMessage('');

        if (!firstName || !lastName || !email || !password) {
            setLoading(false);
            setRegisterError(true);
            setErrorMessage('Please fill in all fields.');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/validateEmail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                setStep('otp');
                setLoading(false);
                setShowToast(true);
            } else {
                const error = await res.json().catch(() => ({}));
                setLoading(false);
                setRegisterError(true);
                setErrorMessage(error.detail || "Failed to send OTP.");
            }
        } catch {
            setLoading(false);
            setRegisterError(true);
            setErrorMessage('Connection error. Try again.');
        }
    }

    async function HandleVerifyAndRegister() {
        setLoading(true);
        setRegisterError(false);
        setErrorMessage('');

        if (!otp || otp.length !== 6) {
            setLoading(false);
            setRegisterError(true);
            setErrorMessage('Please enter a valid 6-digit OTP.');
            return;
        }

        try {
            // 1. Validate OTP
            const otpRes = await fetch(`${API_URL}/validateOTP`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp })
            });

            if (!otpRes.ok) {
                const error = await otpRes.json().catch(() => ({}));
                setLoading(false);
                setRegisterError(true);
                setErrorMessage(error.detail || "Invalid or expired OTP.");
                return;
            }

            // 2. Final Register
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    email,
                    password
                })
            });

            if (res.ok) {
                router.push('/login');
            } else {
                const error = await res.json().catch(() => ({}));
                setLoading(false);
                setRegisterError(true);
                setErrorMessage(error.detail || "Registration failed.");
            }
        } catch {
            setLoading(false);
            setRegisterError(true);
            setErrorMessage('Connection error. Try again.');
        }
    }

    return (
        <div className="w-full">
            <SuccessToast
                isVisible={showToast}
                message="OTP sent to your email! Please check your inbox."
                onClose={() => setShowToast(false)}
            />

            <h1 className="text-2xl font-bold text-center mb-1.5 text-primary">
                {step === 'details' ? 'Create an account' : 'Verify your email'}
            </h1>
            <p className="text-sm text-muted text-center mb-6">
                {step === 'details'
                    ? 'Join and start chatting today.'
                    : `We've sent a 6-digit code to ${email}`}
            </p>

            {registerError && (
                <div className="bg-danger/15 border border-danger/30 text-[#f8a3a5] text-[0.8125rem] p-2 rounded-sm mb-3.5">
                    {errorMessage}
                </div>
            )}

            {step === 'details' ? (
                <>
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
                            loading && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={HandleSendOTP}
                        disabled={loading}
                    >
                        {loading ? 'Sending OTP...' : 'Register'}
                    </button>
                </>
            ) : (
                <>
                    <div className="mb-3.5">
                        <label className="block text-xs font-bold text-secondary mb-1.5 uppercase tracking-wider text-center">Enter Verification Code</label>
                        <input
                            type="text"
                            placeholder="123456"
                            maxLength={6}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full p-3 bg-dark border border-white/10 rounded-sm font-primary text-2xl text-center tracking-[0.5em] text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/25 transition-all"
                        />
                    </div>

                    <button
                        className={cn(
                            "w-full p-3 bg-brand text-[#f2f3f5] border-none rounded-sm font-primary text-base font-semibold cursor-pointer mt-2 transition-all hover:bg-brand-hover active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                            loading && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={HandleVerifyAndRegister}
                        disabled={loading}
                    >
                        {loading ? 'Verifying...' : 'Confirm Registration'}
                    </button>

                    <button
                        className="w-full p-2 text-sm text-secondary hover:text-primary mt-4 transition-colors"
                        onClick={() => setStep('details')}
                    >
                        ← Back to details
                    </button>
                </>
            )}

            <div className="text-center mt-4 text-sm text-muted">
                Already have an account?{' '}
                <Link href="/login" className="text-brand font-medium no-underline hover:underline">
                    Log In
                </Link>
            </div>
        </div>
    )
}
