"use client";

import { useState } from "react";

interface SignupFormProps {
  ctaText: string;
  successMessage: string;
  apiUrl: string;
}

export default function SignupForm({ ctaText, successMessage, apiUrl }: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch(`${apiUrl}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Signup failed");
      }

      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <section className="flex flex-col items-center px-6 py-24 text-center">
        <div
          className="animate-fade-up flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-primary) 15%, transparent)",
            color: "var(--color-primary)",
          }}
        >
          ✓
        </div>
        <p
          className="animate-fade-up delay-1 mt-6 text-xl font-normal"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
        >
          {successMessage}
        </p>
        <p
          className="animate-fade-up delay-2 mt-2 text-sm"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
        >
          Check your inbox for what comes next.
        </p>
      </section>
    );
  }

  return (
    <section className="px-6 py-24 sm:px-10">
      <div className="mx-auto max-w-xl text-center">
        <h2
          className="animate-fade-up delay-2 mb-3 text-3xl font-normal sm:text-4xl"
          style={{ fontFamily: "var(--font-display)", color: "var(--color-text)" }}
        >
          Be the first to know.
        </h2>
        <p
          className="animate-fade-up delay-3 mb-10 text-sm"
          style={{ color: "var(--color-text-muted)", fontFamily: "var(--font-body)" }}
        >
          Join the waitlist and we&apos;ll let you know when we launch.
        </p>

        <form onSubmit={handleSubmit} className="animate-fade-up delay-4 flex w-full gap-3">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "loading"}
            className="flex-1 rounded-xl border px-5 py-4 text-sm outline-none transition-all duration-300 placeholder:opacity-40 focus:ring-1 disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-surface)",
              borderColor: "color-mix(in srgb, var(--color-text-muted) 15%, transparent)",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
            }}
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="glow-border rounded-xl px-7 py-4 text-sm font-semibold tracking-wide transition-all duration-300 hover:brightness-110 disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-text)",
              fontFamily: "var(--font-body)",
            }}
          >
            {status === "loading" ? (
              <span className="inline-block animate-pulse">Joining...</span>
            ) : (
              ctaText
            )}
          </button>
        </form>

        {status === "error" && (
          <p
            className="animate-fade-up mt-4 text-sm"
            style={{ color: "var(--color-primary)" }}
          >
            {errorMessage}
          </p>
        )}

        <p
          className="animate-fade-in delay-6 mt-6 text-xs"
          style={{ color: "var(--color-text-muted)", opacity: 0.6, fontFamily: "var(--font-body)" }}
        >
          No spam. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
