"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";

type Interest = "sales" | "rent" | "land" | "other";

type FormState = {
  name: string;
  email: string;
  phone: string;
  interest: Interest;
  message: string;
};

const INITIAL: FormState = {
  name: "",
  email: "",
  phone: "",
  interest: "sales",
  message: "",
};

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      setStatus("success");
      setForm(INITIAL);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const submitting = status === "submitting";

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-5 rounded-sm border border-stone/30 bg-paper p-6 md:p-8"
      noValidate
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Input
          label="Name"
          required
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          autoComplete="email"
        />
        <Input
          label="Phone (optional)"
          type="tel"
          value={form.phone}
          onChange={(e) => update("phone", e.target.value)}
          autoComplete="tel"
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contact-interest"
            className="text-sm font-medium text-ink"
          >
            Interest
          </label>
          <select
            id="contact-interest"
            value={form.interest}
            onChange={(e) => update("interest", e.target.value as Interest)}
            className="h-11 rounded-sm border border-stone bg-paper px-4 text-base text-ink focus:border-gold focus:outline-none"
          >
            <option value="sales">Sales</option>
            <option value="rent">Rent</option>
            <option value="land">Land</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="contact-message"
          className="text-sm font-medium text-ink"
        >
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={5}
          value={form.message}
          onChange={(e) => update("message", e.target.value)}
          placeholder="Tell us what you're looking for — area, budget, timeline."
          className="rounded-sm border border-stone bg-paper px-4 py-3 text-base text-ink placeholder:text-stone focus:border-gold focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-stone">
          We reply within four working hours.
        </p>
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex h-11 items-center justify-center rounded-sm bg-gold px-6 text-base font-medium text-ink transition-colors hover:bg-gold-deep disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Send enquiry"}
        </button>
      </div>

      {status === "success" ? (
        <p
          role="status"
          className="rounded-sm border border-sage/40 bg-sage/10 px-4 py-3 text-sm text-ink"
        >
          Thanks — we&apos;ve got your message. A senior agent will be in touch
          within four working hours.
        </p>
      ) : null}

      {status === "error" && errorMessage ? (
        <p
          role="alert"
          className="rounded-sm border border-ember/40 bg-ember/10 px-4 py-3 text-sm text-ember"
        >
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
