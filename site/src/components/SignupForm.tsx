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
      <section className="flex flex-col items-center px-4 py-16 text-center">
        <p className="text-xl font-semibold" style={{ color: "var(--color-primary)" }}>
          {successMessage}
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col items-center px-4 py-16">
      <form onSubmit={handleSubmit} className="flex w-full max-w-md gap-2">
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border px-4 py-3 text-base outline-none focus:ring-2"
          style={{ borderColor: "var(--color-primary)" } as React.CSSProperties}
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg px-6 py-3 text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {status === "loading" ? "..." : ctaText}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-sm text-red-600">{errorMessage}</p>
      )}
    </section>
  );
}
