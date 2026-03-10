"use client";

import { getApiBase } from "@/lib/api";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const apiUrl = getApiBase();
      const response = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "ავტორიზაცია ვერ მოხერხდა");
      localStorage.setItem("admin_token", data.session.access_token);
      router.push("/admin/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        .al-root { font-family: 'DM Sans', sans-serif; min-height: 100vh; background: #0e0e10; display: flex; align-items: center; justify-content: center; padding: 24px; touch-action: manipulation; }
        .al-card { width: 100%; max-width: 400px; }
        .al-header { text-align: center; margin-bottom: 40px; }
        .al-icon-wrap { width: 52px; height: 52px; border-radius: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
        .al-title { font-size: 22px; font-weight: 600; color: #f0f0f2; letter-spacing: -0.02em; margin: 0 0 6px; }
        .al-sub { font-size: 13px; color: #6b6b75; margin: 0; }
        .al-box { background: #16161a; border: 1px solid #252529; border-radius: 16px; padding: 28px; }
        .al-error { background: rgba(220,60,60,0.08); border: 1px solid rgba(220,60,60,0.2); color: #e07070; font-size: 13px; padding: 12px 14px; border-radius: 10px; margin-bottom: 20px; text-align: center; }
        .al-field { margin-bottom: 16px; }
        .al-label { display: block; font-size: 12px; font-weight: 500; color: #7a7a85; letter-spacing: 0.04em; margin-bottom: 8px; text-transform: uppercase; }
        .al-input { width: 100%; background: #0e0e10; border: 1px solid #252529; border-radius: 10px; padding: 13px 16px; color: #f0f0f2; font-size: 16px; font-family: 'DM Sans', sans-serif; outline: none; transition: border-color 0.2s; box-sizing: border-box; touch-action: manipulation; }
        .al-input:focus { border-color: #4a4a55; }
        .al-input::placeholder { color: #3a3a42; }
        .al-btn { width: 100%; margin-top: 8px; padding: 14px; background: #f0f0f2; border: none; border-radius: 10px; color: #0e0e10; font-size: 16px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px; touch-action: manipulation; }
        .al-btn:hover:not(:disabled) { background: #ffffff; }
        .al-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .al-spinner { width: 18px; height: 18px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #0e0e10; border-radius: 50%; animation: al-spin 0.7s linear infinite; }
        @keyframes al-spin { to { transform: rotate(360deg); } }
        .al-foot { text-align: center; font-size: 11px; color: #3a3a42; margin-top: 28px; font-family: 'DM Mono', monospace; }
      `}</style>
      <div className="al-root">
        <div className="al-card">
          <div className="al-header">
            <div className="al-icon-wrap">
              <Shield size={22} color="#7a7a85" />
            </div>
            <h1 className="al-title">ადმინისტრაცია</h1>
            <p className="al-sub">სისტემაში შესვლა მხოლოდ ადმინისტრატორებისთვის</p>
          </div>

          <div className="al-box">
            {error && <div className="al-error">{error}</div>}
            <form onSubmit={handleLogin}>
              <div className="al-field">
                <label className="al-label">ელ. ფოსტა</label>
                <input type="email" className="al-input" placeholder="admin@gameportal.ge" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="al-field">
                <label className="al-label">პაროლი</label>
                <input type="password" className="al-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="al-btn" disabled={loading}>
                {loading ? <div className="al-spinner" /> : <><LogIn size={16} />შესვლა</>}
              </button>
            </form>
          </div>

          <p className="al-foot">&copy; {new Date().getFullYear()} Game Portal</p>
        </div>
      </div>
    </>
  );
}