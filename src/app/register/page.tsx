"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("パスワードが一致しません");
      return;
    }
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() || undefined } },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError("登録中にエラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-base-200">
      <div className="w-full max-w-md bg-base-100 rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center mb-6">新規登録ページ</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="form-control">
            <label className="label" htmlFor="name">
              <span className="label-text">Name</span>
            </label>
            <input
              id="name"
              type="text"
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="email">
              <span className="label-text">Email</span>
            </label>
            <input
              id="email"
              type="email"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="password">
              <span className="label-text">Password</span>
            </label>
            <input
              id="password"
              type="password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="form-control">
            <label className="label" htmlFor="confirmPassword">
              <span className="label-text">Confirm Password</span>
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="input input-bordered w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          {error && (
            <div className="text-error text-sm" role="alert">
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <span className="text-sm text-base-content/80">
              すでに登録済みの方の
              <Link href="/login" className="link link-primary ml-1">
                ログインはこちら
              </Link>
            </span>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "登録中…" : "登録する"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
