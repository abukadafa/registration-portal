"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import { createParticipant, DuplicateParticipantError } from "@/lib/participants";
import type { NewParticipantInput, ParticipantCategory } from "@/lib/types";

const CATEGORIES: ParticipantCategory[] = [
  "Researcher",
  "Policy Maker",
  "Industry / Private Sector",
  "Farmer",
  "Student",
  "Development Partner",
  "Speaker",
  "Sponsor",
  "Media",
  "Other",
];

const TITLES = ["Mr", "Mrs", "Ms", "Dr", "Prof", "Hon", "Engr"];

const initialState: NewParticipantInput = {
  title: "Dr",
  firstName: "",
  lastName: "",
  gender: "Prefer not to say",
  country: "",
  state: "",
  organization: "",
  department: "",
  position: "",
  email: "",
  phone: "",
  category: "Researcher",
  dietaryPreference: "",
  accommodationNeeded: false,
  abstractSubmitted: false,
  paymentStatus: "Pending",
};

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<NewParticipantInput>(initialState);
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof NewParticipantInput>(key: K, value: NewParticipantInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.firstName || !form.lastName || !form.email || !form.phone || !form.organization) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const participant = await createParticipant(form, photo);
      router.push(`/badge/${participant.id}`);
    } catch (err) {
      if (err instanceof DuplicateParticipantError) {
        setError(
          err.field === "email"
            ? "This email address is already registered. Try the badge lookup instead."
            : "This phone number is already registered. Try the badge lookup instead."
        );
      } else {
        console.error(err);
        setError(
          "We couldn't complete registration. Check your Firebase configuration (.env.local) and try again."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-cream)]">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-12">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.25em] text-[var(--color-gold)]">
          9th AACAA 2026 &middot; Individual Registration
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold text-[var(--color-ink)]">
          Register for the conference
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Fields marked with <span className="text-[var(--color-gold)]">*</span> are required.
          Your badge and QR code are generated automatically once you submit.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          <Section title="Personal details">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Field label="Title">
                <select
                  className="input"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                >
                  {TITLES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="First name *" className="col-span-2 sm:col-span-1">
                <input
                  required
                  className="input"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </Field>
              <Field label="Last name *" className="col-span-2 sm:col-span-1">
                <input
                  required
                  className="input"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </Field>
              <Field label="Gender">
                <select
                  className="input"
                  value={form.gender}
                  onChange={(e) => update("gender", e.target.value as NewParticipantInput["gender"])}
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Prefer not to say</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Location">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country *">
                <input
                  required
                  className="input"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  placeholder="Nigeria"
                />
              </Field>
              <Field label="State / Region">
                <input
                  className="input"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Organization">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Organization *" className="col-span-2">
                <input
                  required
                  className="input"
                  value={form.organization}
                  onChange={(e) => update("organization", e.target.value)}
                />
              </Field>
              <Field label="Department">
                <input
                  className="input"
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                />
              </Field>
              <Field label="Position">
                <input
                  className="input"
                  value={form.position}
                  onChange={(e) => update("position", e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Contact">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email *">
                <input
                  required
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field label="Phone number *">
                <input
                  required
                  className="input"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+234..."
                />
              </Field>
            </div>
          </Section>

          <Section title="Participation">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Participant category">
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value as ParticipantCategory)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Dietary preference">
                <input
                  className="input"
                  value={form.dietaryPreference}
                  onChange={(e) => update("dietaryPreference", e.target.value)}
                  placeholder="e.g. Vegetarian, none"
                />
              </Field>
              <Field label="Passport photograph">
                <input
                  type="file"
                  accept="image/*"
                  className="input file:mr-3 file:rounded-full file:border-0 file:bg-[var(--color-forest)] file:px-3 file:py-1.5 file:text-white"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
              </Field>
              <div className="flex flex-col justify-end gap-2 pb-1">
                <Checkbox
                  label="Accommodation needed"
                  checked={form.accommodationNeeded}
                  onChange={(v) => update("accommodationNeeded", v)}
                />
                <Checkbox
                  label="Abstract submitted"
                  checked={form.abstractSubmitted}
                  onChange={(v) => update("abstractSubmitted", v)}
                />
              </div>
            </div>
          </Section>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-full bg-[var(--color-forest)] py-3.5 text-sm font-semibold text-white transition hover:bg-[var(--color-forest-deep)] disabled:opacity-60"
          >
            {submitting ? "Generating your badge…" : "Submit registration"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-wide text-[var(--color-forest)]">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block text-xs font-medium text-[var(--color-ink-soft)]">{label}</span>
      {children}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-black/20 text-[var(--color-forest)] focus:ring-[var(--color-forest)]"
      />
      {label}
    </label>
  );
}
