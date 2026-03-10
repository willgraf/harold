"use client";

import { useState, useEffect } from "react";

interface SignupFormProps {
  ctaText: string;
  successMessage: string;
  verificationPendingMessage: string;
  verificationSuccessMessage: string;
  apiUrl: string;
}

export default function SignupForm({
  ctaText,
  successMessage,
  verificationPendingMessage,
  verificationSuccessMessage,
  apiUrl,
}: SignupFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "verified" | "verification-failed"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationRequired, setVerificationRequired] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    if (verified === "true") {
      setStatus("verified");
    } else if (verified === "false") {
      setStatus("verification-failed");
    }
  }, []);

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

      const data = await res.json();
      setVerificationRequired(data.verificationRequired === true);
      setStatus("success");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "verified") {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <div className="animate-fade-up flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-xl text-primary">
          ✓
        </div>
        <p
          className="animate-fade-up mt-4 text-lg font-normal text-foreground font-display"
          style={{ animationDelay: "0.1s" }}
        >
          {verificationSuccessMessage}
        </p>
      </div>
    );
  }

  if (status === "verification-failed") {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <div className="animate-fade-up flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-xl text-primary">
          ✗
        </div>
        <p
          className="animate-fade-up mt-4 text-lg font-normal text-foreground font-display"
          style={{ animationDelay: "0.1s" }}
        >
          Verification link expired or invalid.
        </p>
        <p className="animate-fade-up mt-1 text-sm text-muted font-body" style={{ animationDelay: "0.2s" }}>
          Please sign up again.
        </p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center py-4 text-center">
        <div className="animate-fade-up flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-xl text-primary">
          {verificationRequired ? "✉" : "✓"}
        </div>
        <p
          className="animate-fade-up mt-4 text-lg font-normal text-foreground font-display"
          style={{ animationDelay: "0.1s" }}
        >
          {verificationRequired ? verificationPendingMessage : successMessage}
        </p>
        <p className="animate-fade-up mt-1 text-sm text-muted font-body" style={{ animationDelay: "0.2s" }}>
          {verificationRequired
            ? "We sent a confirmation link to your email."
            : "Check your inbox for what comes next."}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full gap-3"
      >
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "loading"}
          className="flex-1 rounded-xl border border-muted/15 bg-surface px-5 py-4 text-sm text-foreground font-body outline-none transition-all duration-300 placeholder:opacity-40 focus:ring-1 focus:ring-primary disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="animate-glow rounded-xl bg-primary px-7 py-4 text-sm font-semibold tracking-wide text-foreground font-body transition-all duration-300 hover:brightness-110 disabled:opacity-50"
        >
          {status === "loading" ? (
            <span className="inline-block animate-pulse">Joining...</span>
          ) : (
            ctaText
          )}
        </button>
      </form>

      {status === "error" && (
        <p className="animate-fade-up mt-3 text-sm text-primary">{errorMessage}</p>
      )}

      <p className="animate-fade-in mt-4 text-xs text-muted/50 font-body" style={{ animationDelay: "0.6s" }}>
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
