import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import wrigleyvilleLogo from "@/assets/wrigleyville-logo.png";
import { Beer, Building2 } from "lucide-react";

interface BarFormData {
  venueName: string;
  contactName: string;
  email: string;
  phone: string;
  offerDescription: string;
}

interface RooftopFormData {
  venueName: string;
  contactName: string;
  email: string;
  capacity: string;
  uniqueDescription: string;
}

const initialBar: BarFormData = { venueName: "", contactName: "", email: "", phone: "", offerDescription: "" };
const initialRooftop: RooftopFormData = { venueName: "", contactName: "", email: "", capacity: "", uniqueDescription: "" };

export default function Partners() {
  const [barForm, setBarForm] = useState<BarFormData>(initialBar);
  const [barSubmitted, setBarSubmitted] = useState(false);
  const [barSubmitting, setBarSubmitting] = useState(false);
  const [barErrors, setBarErrors] = useState<Partial<Record<keyof BarFormData, string>>>({});

  const [roofForm, setRoofForm] = useState<RooftopFormData>(initialRooftop);
  const [roofSubmitted, setRoofSubmitted] = useState(false);
  const [roofSubmitting, setRoofSubmitting] = useState(false);
  const [roofErrors, setRoofErrors] = useState<Partial<Record<keyof RooftopFormData, string>>>({});

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const submitBar = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof BarFormData, string>> = {};
    if (!barForm.venueName.trim()) next.venueName = "Required";
    if (!barForm.contactName.trim()) next.contactName = "Required";
    if (!isEmail(barForm.email)) next.email = "Valid email required";
    if (!barForm.offerDescription.trim()) next.offerDescription = "Required";
    else if (barForm.offerDescription.length > 300) next.offerDescription = "Max 300 chars";
    setBarErrors(next);
    if (Object.keys(next).length) return;

    setBarSubmitting(true);
    const { error } = await supabase.from("bar_partners_waitlist").insert({
      venue_name: barForm.venueName.trim(),
      contact_name: barForm.contactName.trim(),
      email: barForm.email.trim(),
      phone: barForm.phone.trim() || null,
      offer_description: barForm.offerDescription.trim(),
      partner_type: "bar",
    });
    setBarSubmitting(false);
    if (error) { setBarErrors({ email: "Something went wrong. Try again." }); return; }
    setBarSubmitted(true);
  };

  const submitRoof = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Partial<Record<keyof RooftopFormData, string>> = {};
    if (!roofForm.venueName.trim()) next.venueName = "Required";
    if (!roofForm.contactName.trim()) next.contactName = "Required";
    if (!isEmail(roofForm.email)) next.email = "Valid email required";
    if (!roofForm.capacity.trim() || isNaN(Number(roofForm.capacity))) next.capacity = "Numeric capacity required";
    if (!roofForm.uniqueDescription.trim()) next.uniqueDescription = "Required";
    else if (roofForm.uniqueDescription.length > 300) next.uniqueDescription = "Max 300 chars";
    setRoofErrors(next);
    if (Object.keys(next).length) return;

    setRoofSubmitting(true);
    const { error } = await supabase.from("bar_partners_waitlist").insert({
      venue_name: roofForm.venueName.trim(),
      contact_name: roofForm.contactName.trim(),
      email: roofForm.email.trim(),
      offer_description: roofForm.uniqueDescription.trim(),
      partner_type: "rooftop",
      capacity: Number(roofForm.capacity),
    });
    setRoofSubmitting(false);
    if (error) { setRoofErrors({ email: "Something went wrong. Try again." }); return; }
    setRoofSubmitted(true);
  };

  const inputBase =
    "w-full rounded-xl border bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none ring-white/20 transition focus:ring-2";

  return (
    <div className="min-h-screen bg-brand-blue-dark px-4 py-6 pb-16">
      <Helmet>
        <title>Partner With Cubbies Buddies</title>
        <meta name="description" content="Bar and rooftop partners — reach thousands of Cubs fans on game day." />
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

        {/* BAR FORM */}
        {barSubmitted ? (
          <div className="mb-10 rounded-2xl border border-white/10 bg-brand-blue p-8 text-center shadow-elevated">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-red/20 ring-2 ring-brand-red">
                <Beer className="h-7 w-7 text-brand-red" />
              </div>
            </div>
            <h2 className="mb-2 font-display text-xl font-bold text-white">
              Thanks! We'll be in touch before the next home series.
            </h2>
            <p className="text-base text-white/80">Go Cubs! ⚾</p>
          </div>
        ) : (
          <form onSubmit={submitBar} className="space-y-5 mb-12" noValidate>
            <h2 className="font-display text-xl font-bold text-white">Bar & Venue Partners</h2>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">Bar or Venue Name *</label>
              <input value={barForm.venueName} onChange={(e) => setBarForm({ ...barForm, venueName: e.target.value })}
                className={`${inputBase} ${barErrors.venueName ? "border-brand-red" : "border-white/10"}`} placeholder="Murphy's Bleachers" />
              {barErrors.venueName && <p className="mt-1 text-sm text-brand-red">{barErrors.venueName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">Contact Name *</label>
              <input value={barForm.contactName} onChange={(e) => setBarForm({ ...barForm, contactName: e.target.value })}
                className={`${inputBase} ${barErrors.contactName ? "border-brand-red" : "border-white/10"}`} />
              {barErrors.contactName && <p className="mt-1 text-sm text-brand-red">{barErrors.contactName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">Email *</label>
              <input type="email" value={barForm.email} onChange={(e) => setBarForm({ ...barForm, email: e.target.value })}
                className={`${inputBase} ${barErrors.email ? "border-brand-red" : "border-white/10"}`} />
              {barErrors.email && <p className="mt-1 text-sm text-brand-red">{barErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">Phone <span className="text-white/50">(optional)</span></label>
              <input type="tel" value={barForm.phone} onChange={(e) => setBarForm({ ...barForm, phone: e.target.value })}
                className={`${inputBase} border-white/10`} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">What would you like to offer fans? *</label>
              <textarea value={barForm.offerDescription} onChange={(e) => setBarForm({ ...barForm, offerDescription: e.target.value })}
                maxLength={300} rows={4}
                className={`${inputBase} resize-none ${barErrors.offerDescription ? "border-brand-red" : "border-white/10"}`} />
              <div className="mt-1.5 flex items-center justify-between">
                {barErrors.offerDescription ? <p className="text-sm text-brand-red">{barErrors.offerDescription}</p> : <span />}
                <span className="text-xs text-white/50">{barForm.offerDescription.length}/300</span>
              </div>
            </div>
            <button type="submit" disabled={barSubmitting}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-brand-red py-3.5 font-display text-lg font-bold text-white shadow-pennant transition hover:bg-brand-red/90 active:scale-[0.98] disabled:opacity-60">
              {barSubmitting ? "Submitting…" : "Submit Bar Interest"}
            </button>
          </form>
        )}

        {/* ROOFTOP SECTION */}
        <div className="mb-6 border-l-4 border-amber-400 pl-4">
          <h2 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-amber-400" /> 🏙️ Rooftop Venue Partners
          </h2>
        </div>
        <p className="mb-6 text-base leading-relaxed text-white/80">
          List your rooftop on the Cubbies Buddies map and connect with fans looking for the ultimate game-day experience.
        </p>

        {roofSubmitted ? (
          <div className="rounded-2xl border border-amber-400/40 bg-brand-blue p-8 text-center shadow-elevated">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/20 ring-2 ring-amber-400">
                <Building2 className="h-7 w-7 text-amber-400" />
              </div>
            </div>
            <h2 className="mb-2 font-display text-xl font-bold text-white">
              Thanks! Rooftop partners get featured placement on our live map.
            </h2>
            <p className="text-base text-white/80">We'll be in touch soon. ⚾</p>
          </div>
        ) : (
          <form onSubmit={submitRoof} className="space-y-5" noValidate>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">Rooftop Venue Name *</label>
              <input value={roofForm.venueName} onChange={(e) => setRoofForm({ ...roofForm, venueName: e.target.value })}
                className={`${inputBase} ${roofErrors.venueName ? "border-brand-red" : "border-amber-400/30"}`} placeholder="Skybox on Sheffield" />
              {roofErrors.venueName && <p className="mt-1 text-sm text-brand-red">{roofErrors.venueName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">Contact Name *</label>
              <input value={roofForm.contactName} onChange={(e) => setRoofForm({ ...roofForm, contactName: e.target.value })}
                className={`${inputBase} ${roofErrors.contactName ? "border-brand-red" : "border-amber-400/30"}`} />
              {roofErrors.contactName && <p className="mt-1 text-sm text-brand-red">{roofErrors.contactName}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">Email *</label>
              <input type="email" value={roofForm.email} onChange={(e) => setRoofForm({ ...roofForm, email: e.target.value })}
                className={`${inputBase} ${roofErrors.email ? "border-brand-red" : "border-amber-400/30"}`} />
              {roofErrors.email && <p className="mt-1 text-sm text-brand-red">{roofErrors.email}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">Capacity *</label>
              <input type="number" min={1} value={roofForm.capacity} onChange={(e) => setRoofForm({ ...roofForm, capacity: e.target.value })}
                className={`${inputBase} ${roofErrors.capacity ? "border-brand-red" : "border-amber-400/30"}`} placeholder="150" />
              {roofErrors.capacity && <p className="mt-1 text-sm text-brand-red">{roofErrors.capacity}</p>}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-white/90">What makes your rooftop unique? *</label>
              <textarea value={roofForm.uniqueDescription} onChange={(e) => setRoofForm({ ...roofForm, uniqueDescription: e.target.value })}
                maxLength={300} rows={4}
                className={`${inputBase} resize-none ${roofErrors.uniqueDescription ? "border-brand-red" : "border-amber-400/30"}`}
                placeholder="Panoramic right-field views, all-inclusive food & drink, private bar…" />
              <div className="mt-1.5 flex items-center justify-between">
                {roofErrors.uniqueDescription ? <p className="text-sm text-brand-red">{roofErrors.uniqueDescription}</p> : <span />}
                <span className="text-xs text-white/50">{roofForm.uniqueDescription.length}/300</span>
              </div>
            </div>
            <button type="submit" disabled={roofSubmitting}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-amber-400 py-3.5 font-display text-lg font-bold text-amber-950 shadow-pennant transition hover:bg-amber-300 active:scale-[0.98] disabled:opacity-60">
              {roofSubmitting ? "Submitting…" : "🏙️ Submit Rooftop Interest"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
