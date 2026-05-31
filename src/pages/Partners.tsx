import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import wrigleyvilleLogo from "@/assets/wrigleyville-logo.png";
import { Beer } from "lucide-react";

interface FormData {
  venueName: string;
  contactName: string;
  email: string;
  phone: string;
  offerDescription: string;
}

const initialForm: FormData = {
  venueName: "",
  contactName: "",
  email: "",
  phone: "",
  offerDescription: "",
};

export default function Partners() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormData, string>> = {};
    if (!form.venueName.trim()) nextErrors.venueName = "Venue name is required";
    if (!form.contactName.trim()) nextErrors.contactName = "Contact name is required";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Please enter a valid email";
    }
    if (!form.offerDescription.trim()) {
      nextErrors.offerDescription = "Please tell us what you'd like to offer";
    } else if (form.offerDescription.length > 300) {
      nextErrors.offerDescription = "Must be 300 characters or less";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const { error } = await supabase.from("bar_partners_waitlist").insert({
      venue_name: form.venueName.trim(),
      contact_name: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      offer_description: form.offerDescription.trim(),
    });
    setSubmitting(false);

    if (error) {
      setErrors({ email: "Something went wrong. Please try again." });
      return;
    }

    setSubmitted(true);
  };

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-blue-dark px-4 py-8">
        <Helmet>
          <title>Partner With Cubbies Buddies</title>
          <meta name="description" content="Reach thousands of Cubs fans on game day. Partner with Cubbies Buddies." />
        </Helmet>
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-brand-blue p-8 text-center shadow-elevated">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-red/20 ring-2 ring-brand-red">
              <Beer className="h-8 w-8 text-brand-red" />
            </div>
          </div>
          <h2 className="mb-3 font-display text-2xl font-bold text-white">
            Thanks! We'll be in touch before the next home series.
          </h2>
          <p className="text-lg text-white/80">Go Cubs! ⚾</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-blue-dark px-4 py-6 pb-16">
      <Helmet>
        <title>Partner With Cubbies Buddies</title>
        <meta name="description" content="Reach thousands of Cubs fans on game day. Partner with Cubbies Buddies." />
      </Helmet>

      <div className="mx-auto w-full max-w-md">
        {/* Header */}
        <div className="mb-6 border-l-4 border-brand-red pl-4">
          <img
            src={wrigleyvilleLogo}
            alt="Cubbies Buddies"
            className="mb-3 h-10 w-auto object-contain"
            style={{ filter: "brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.3))" }}
          />
          <h1 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
            Partner With Cubbies Buddies 🍺
          </h1>
        </div>

        <p className="mb-8 text-base leading-relaxed text-white/80">
          Reach thousands of Cubs fans on game day — list your specials, sponsor missions, and own your neighborhood presence.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label htmlFor="venueName" className="mb-1.5 block text-sm font-semibold text-white/90">
              Bar or Venue Name <span className="text-brand-red">*</span>
            </label>
            <input
              id="venueName"
              type="text"
              value={form.venueName}
              onChange={(e) => updateField("venueName", e.target.value)}
              className={`w-full rounded-xl border bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none ring-white/20 transition focus:ring-2 ${
                errors.venueName ? "border-brand-red" : "border-white/10"
              }`}
              placeholder="Murphy's Bleachers"
            />
            {errors.venueName && (
              <p className="mt-1.5 text-sm text-brand-red">{errors.venueName}</p>
            )}
          </div>

          <div>
            <label htmlFor="contactName" className="mb-1.5 block text-sm font-semibold text-white/90">
              Contact Name <span className="text-brand-red">*</span>
            </label>
            <input
              id="contactName"
              type="text"
              value={form.contactName}
              onChange={(e) => updateField("contactName", e.target.value)}
              className={`w-full rounded-xl border bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none ring-white/20 transition focus:ring-2 ${
                errors.contactName ? "border-brand-red" : "border-white/10"
              }`}
              placeholder="Sean Murphy"
            />
            {errors.contactName && (
              <p className="mt-1.5 text-sm text-brand-red">{errors.contactName}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-white/90">
              Email Address <span className="text-brand-red">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={`w-full rounded-xl border bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none ring-white/20 transition focus:ring-2 ${
                errors.email ? "border-brand-red" : "border-white/10"
              }`}
              placeholder="sean@murphysbleachers.com"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm text-brand-red">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-white/90">
              Phone Number <span className="text-white/50">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none ring-white/20 transition focus:ring-2"
              placeholder="(773) 555-0199"
            />
          </div>

          <div>
            <label htmlFor="offerDescription" className="mb-1.5 block text-sm font-semibold text-white/90">
              What would you like to offer fans? <span className="text-brand-red">*</span>
            </label>
            <textarea
              id="offerDescription"
              value={form.offerDescription}
              onChange={(e) => updateField("offerDescription", e.target.value)}
              maxLength={300}
              rows={4}
              className={`w-full resize-none rounded-xl border bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none ring-white/20 transition focus:ring-2 ${
                errors.offerDescription ? "border-brand-red" : "border-white/10"
              }`}
              placeholder="Game-day drink specials, rooftop viewing packages, pre-game food deals…"
            />
            <div className="mt-1.5 flex items-center justify-between">
              {errors.offerDescription ? (
                <p className="text-sm text-brand-red">{errors.offerDescription}</p>
              ) : (
                <span />
              )}
              <span className="text-xs text-white/50">
                {form.offerDescription.length}/300
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-brand-red py-3.5 font-display text-lg font-bold text-white shadow-pennant transition hover:bg-brand-red/90 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Submitting…" : "Submit Interest"}
          </button>
        </form>
      </div>
    </div>
  );
}
