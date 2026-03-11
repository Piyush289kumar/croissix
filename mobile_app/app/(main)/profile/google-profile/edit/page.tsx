// mobile_app\app\(main)\profile\google-profile\edit\page.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ChevronRight, Check, Plus, X, Pencil,
  Building2, Phone, Globe, MapPin, Clock, Info,
  Users, Settings, Trash2, Star, Wifi, Car, Calendar,
  ChevronDown, Save, AlertCircle, CheckCircle2, ExternalLink,
  Tag, Code, Headphones, Accessibility,
  RefreshCw,
} from "lucide-react";

/* ══════════════════════════════════════════
   TYPES
══════════════════════════════════════════ */
type Tab = "about" | "contact" | "location" | "hours" | "more";

interface HoursDay {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

/* ══════════════════════════════════════════
   INITIAL STATE
══════════════════════════════════════════ */
const DAYS: HoursDay[] = [
  { day: "Monday",    open: "10:30", close: "19:30", closed: false },
  { day: "Tuesday",   open: "10:30", close: "19:30", closed: false },
  { day: "Wednesday", open: "10:30", close: "19:30", closed: false },
  { day: "Thursday",  open: "10:30", close: "19:30", closed: false },
  { day: "Friday",    open: "10:30", close: "19:30", closed: false },
  { day: "Saturday",  open: "10:30", close: "19:30", closed: false },
  { day: "Sunday",    open: "",      close: "",       closed: true  },
];

const PARKING_OPTIONS = [
  { key: "street_free",   label: "Free street parking",      value: true  },
  { key: "lot_paid",      label: "Paid parking lot",         value: false },
  { key: "onsite",        label: "On-site parking",          value: true  },
  { key: "multistorey_paid", label: "Paid multi-storey",     value: false },
  { key: "lot_free",      label: "Free parking lot",         value: true  },
  { key: "multistorey_free", label: "Free multi-storey",     value: false },
  { key: "street_paid",   label: "Paid street parking",      value: false },
];

const ACCESSIBILITY_OPTIONS = [
  { key: "women_owned",      label: "Women-owned",               value: false },
  { key: "wheelchair_seat",  label: "Wheelchair-accessible seating", value: false },
  { key: "hearing_loop",     label: "Assistive hearing loop",    value: false },
  { key: "wheelchair_toilet",label: "Wheelchair-accessible toilet", value: false },
  { key: "wheelchair_park",  label: "Wheelchair-accessible car park", value: false },
];

const SERVICE_OPTIONS = [
  { key: "onsite",      label: "On-site services",        value: true  },
  { key: "online_appt", label: "Online appointments",     value: true  },
  { key: "appointment", label: "Appointment required",    value: true  },
];

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const fadeIn = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

/* ══════════════════════════════════════════
   REUSABLE FIELD ROW
══════════════════════════════════════════ */
function Field({
  label, required, children, hint, dark,
}: {
  label: string; required?: boolean; children: React.ReactNode;
  hint?: string; dark: boolean;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.07em", color: dark ? "#475569" : "#94a3b8" }}>
          {label}
        </span>
        {required && <span style={{ color: "#3b82f6", fontSize: 11, fontWeight: 900 }}>*</span>}
      </div>
      {children}
      {hint && (
        <p style={{ fontSize: 10.5, color: dark ? "#334155" : "#94a3b8",
          fontWeight: 500, marginTop: 5 }}>{hint}</p>
      )}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline, rows, dark }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; rows?: number; dark: boolean;
}) {
  const base: React.CSSProperties = {
    width: "100%", borderRadius: 14, fontSize: 13, fontWeight: 500,
    border: `1.5px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.7)"}`,
    background: dark ? "rgba(255,255,255,0.04)" : "#fff",
    color: dark ? "#e2e8f0" : "#1e293b", outline: "none",
    fontFamily: "-apple-system,'SF Pro Text',sans-serif",
    transition: "border-color 0.18s",
    boxSizing: "border-box",
  };
  if (multiline) {
    return (
      <textarea value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows ?? 4}
        style={{ ...base, padding: "12px 14px", resize: "none", lineHeight: 1.6 }}
        onFocus={e => e.target.style.borderColor = "#3b82f6"}
        onBlur={e => e.target.style.borderColor = dark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.7)"} />
    );
  }
  return (
    <input value={value} onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ ...base, padding: "11px 14px" }}
      onFocus={e => e.target.style.borderColor = "#3b82f6"}
      onBlur={e => e.target.style.borderColor = dark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.7)"} />
  );
}

function Toggle({ value, onChange, dark }: {
  value: boolean; onChange: (v: boolean) => void; dark: boolean;
}) {
  return (
    <motion.div onClick={() => onChange(!value)}
      style={{ width: 36, height: 20, borderRadius: 99, cursor: "pointer", position: "relative", flexShrink: 0,
        background: value ? "#3b82f6" : dark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.18 }}>
      <motion.div animate={{ x: value ? 17 : 2 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        style={{ position: "absolute", top: 2, width: 16, height: 16, borderRadius: "50%",
          background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
    </motion.div>
  );
}

function SectionCard({ title, icon, children, dark }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; dark: boolean;
}) {
  return (
    <motion.div variants={fadeIn}
      style={{ borderRadius: 20, overflow: "hidden", marginBottom: 14,
        border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.5)"}`,
        background: dark ? "#0f1a2e" : "#fff",
        boxShadow: dark ? "none" : "0 1px 6px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "13px 16px 12px",
        borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(203,213,225,0.4)"}`,
        display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#3b82f6" }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: "-0.01em",
          color: dark ? "#e2e8f0" : "#1e293b" }}>{title}</span>
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </motion.div>
  );
}

function InfoRow({ label, value, dark, onEdit }: {
  label: string; value: string; dark: boolean; onEdit?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: 12, padding: "8px 0",
      borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)"}` }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.07em", color: dark ? "#334155" : "#94a3b8", margin: "0 0 2px" }}>
          {label}
        </p>
        <p style={{ fontSize: 12.5, fontWeight: 500,
          color: dark ? "#94a3b8" : "#64748b", margin: 0, lineHeight: 1.5 }}>
          {value}
        </p>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   CATEGORY TAG
══════════════════════════════════════════ */
function CategoryTag({ label, onRemove, dark }: {
  label: string; onRemove: () => void; dark: boolean;
}) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 10px 5px 12px", borderRadius: 99, fontSize: 11.5, fontWeight: 700,
      background: dark ? "rgba(59,130,246,0.12)" : "rgba(219,234,254,0.7)",
      border: `1.5px solid ${dark ? "rgba(59,130,246,0.2)" : "rgba(147,197,253,0.6)"}`,
      color: dark ? "#93c5fd" : "#1d4ed8" }}>
      {label}
      <button onClick={onRemove}
        style={{ display: "flex", alignItems: "center", justifyContent: "center",
          width: 16, height: 16, borderRadius: "50%", border: "none", cursor: "pointer",
          background: dark ? "rgba(59,130,246,0.25)" : "rgba(147,197,253,0.5)",
          color: dark ? "#93c5fd" : "#1d4ed8", padding: 0 }}>
        <X size={9} strokeWidth={3} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   ABOUT TAB
══════════════════════════════════════════ */
function AboutTab({ dark }: { dark: boolean }) {
  const [name, setName] = useState("Vipprow | Digital Marketing | SaaS Solutions | Digital Marketing institute | social media");
  const [categories, setCategories] = useState(["Advertising agency", "Software company", "Automation company"]);
  const [newCat, setNewCat] = useState("");
  const [desc, setDesc] = useState("Vipprow is a leading SaaS & Digital Marketing company helping businesses grow online with smart, performance-driven solutions. We specialize in social media marketing, SEO, performance marketing, website & app development, CRM, inventory management software, invoicing solutions, and creative graphic design. With innovative tools like Croissix (AI-powered marketing automation) and Postermaker (free graphics creator), we make marketing simple, effective, and scalable. Our mission is to empower startups, entrepreneurs, and enterprises with technology-driven growth strategies that deliver real results.");

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <SectionCard title="Business Name" icon={<Building2 size={14} />} dark={dark}>
        <Field label="Business Name" required dark={dark}>
          <TextInput value={name} onChange={setName} dark={dark} />
          <p style={{ fontSize: 10.5, marginTop: 5, color: dark ? "#334155" : "#94a3b8", fontWeight: 500 }}>
            {name.length}/750 characters
          </p>
        </Field>
      </SectionCard>

      <SectionCard title="Business Category" icon={<Tag size={14} />} dark={dark}>
        <Field label="Primary Category" required dark={dark}
          hint="Your primary category helps Google decide where to show your business.">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
            {categories.map((c, i) => (
              <motion.div key={c} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.04 }}>
                <CategoryTag label={c} dark={dark}
                  onRemove={() => setCategories(cats => cats.filter(x => x !== c))} />
              </motion.div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input value={newCat} onChange={e => setNewCat(e.target.value)}
              placeholder="Add category…"
              onKeyDown={e => { if (e.key === "Enter" && newCat.trim()) { setCategories(c => [...c, newCat.trim()]); setNewCat(""); }}}
              style={{ flex: 1, padding: "10px 13px", borderRadius: 12, fontSize: 12.5,
                border: `1.5px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.7)"}`,
                background: dark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                color: dark ? "#e2e8f0" : "#1e293b", outline: "none",
                fontFamily: "-apple-system,sans-serif" }} />
            <motion.button whileTap={{ scale: 0.94 }}
              onClick={() => { if (newCat.trim()) { setCategories(c => [...c, newCat.trim()]); setNewCat(""); }}}
              style={{ padding: "10px 14px", borderRadius: 12, border: "none", cursor: "pointer",
                background: "#3b82f6", color: "#fff", fontSize: 12, fontWeight: 800 }}>
              <Plus size={14} />
            </motion.button>
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="Business Description" icon={<Info size={14} />} dark={dark}>
        <Field label="Description" dark={dark}
          hint="Describe what your business does, the services you provide, and what sets you apart.">
          <TextInput value={desc} onChange={setDesc} multiline rows={6} dark={dark}
            placeholder="Describe your business…" />
          <p style={{ fontSize: 10.5, marginTop: 5, color: desc.length > 750 ? "#ef4444" : dark ? "#334155" : "#94a3b8", fontWeight: 500 }}>
            {desc.length}/750 characters
          </p>
        </Field>
      </SectionCard>

      <SectionCard title="Opening Date" icon={<Calendar size={14} />} dark={dark}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, color: dark ? "#64748b" : "#94a3b8", fontWeight: 500, margin: 0 }}>
            Opening date not set
          </p>
          <motion.button whileTap={{ scale: 0.93 }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
              borderRadius: 10, border: `1.5px solid ${dark ? "rgba(59,130,246,0.2)" : "rgba(147,197,253,0.5)"}`,
              background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 700,
              color: "#3b82f6" }}>
            <Plus size={12} /> Add
          </motion.button>
        </div>
      </SectionCard>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   CONTACT TAB
══════════════════════════════════════════ */
function ContactTab({ dark }: { dark: boolean }) {
  const [phone, setPhone] = useState("096699 32121");
  const [sms, setSms] = useState("+919669932121");
  const [whatsapp, setWhatsapp] = useState("9669932121");
  const [website, setWebsite] = useState("https://vipprow.com/");

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <SectionCard title="Phone" icon={<Phone size={14} />} dark={dark}>
        <Field label="Phone Number" required dark={dark}>
          <TextInput value={phone} onChange={setPhone} dark={dark} placeholder="+91 00000 00000" />
        </Field>
        <Field label="SMS / Chat Number" dark={dark}>
          <TextInput value={sms} onChange={setSms} dark={dark} placeholder="sms:+91..." />
        </Field>
        <Field label="WhatsApp Number" dark={dark}>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              fontSize: 12, color: dark ? "#475569" : "#94a3b8", fontWeight: 600 }}>
              wa.me/
            </span>
            <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)}
              style={{ width: "100%", padding: "11px 14px 11px 58px", borderRadius: 14, fontSize: 13,
                border: `1.5px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.7)"}`,
                background: dark ? "rgba(255,255,255,0.04)" : "#fff",
                color: dark ? "#e2e8f0" : "#1e293b", outline: "none", boxSizing: "border-box",
                fontFamily: "-apple-system,sans-serif" }} />
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="Website" icon={<Globe size={14} />} dark={dark}>
        <Field label="Website URL" required dark={dark}>
          <TextInput value={website} onChange={setWebsite} dark={dark} placeholder="https://yourwebsite.com" />
        </Field>
        {website && (
          <a href={website} target="_blank" rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5,
              color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
            <ExternalLink size={11} /> Preview
          </a>
        )}
      </SectionCard>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   LOCATION TAB
══════════════════════════════════════════ */
function LocationTab({ dark }: { dark: boolean }) {
  const [address, setAddress] = useState("H.NO. 753 GUPTESHWAR WARD NEAR GOOD LUCK APARTMENT JABALPUR MP - 482001, jabalpur mp, jabalpur, Madhya Pradesh 482001");
  const [serviceArea, setServiceArea] = useState("Jabalpur, Madhya Pradesh, India");

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <SectionCard title="Business Location" icon={<MapPin size={14} />} dark={dark}>
        <Field label="Street Address" required dark={dark}>
          <TextInput value={address} onChange={setAddress} multiline rows={3} dark={dark}
            placeholder="Enter your business address" />
        </Field>

        {/* map preview placeholder */}
        <div style={{ borderRadius: 14, overflow: "hidden", marginTop: 4,
          background: dark ? "rgba(255,255,255,0.04)" : "rgba(59,130,246,0.04)",
          border: `1.5px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(147,197,253,0.3)"}`,
          height: 120, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <MapPin size={16} style={{ color: "#3b82f6", opacity: 0.5 }} />
          <span style={{ fontSize: 12, color: dark ? "#334155" : "#94a3b8", fontWeight: 600 }}>
            Map preview · Jabalpur, MP
          </span>
        </div>
      </SectionCard>

      <SectionCard title="Service Area" icon={<Globe size={14} />} dark={dark}>
        <Field label="Areas Served" dark={dark}
          hint="List cities, regions, or areas where you serve customers.">
          <TextInput value={serviceArea} onChange={setServiceArea} dark={dark}
            placeholder="e.g. Jabalpur, Madhya Pradesh" />
        </Field>
      </SectionCard>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   HOURS TAB
══════════════════════════════════════════ */
function HoursTab({ dark }: { dark: boolean }) {
  const [hours, setHours] = useState<HoursDay[]>(DAYS);

  function update(idx: number, key: keyof HoursDay, val: any) {
    setHours(h => h.map((d, i) => i === idx ? { ...d, [key]: val } : d));
  }

  const timeInp: React.CSSProperties = {
    padding: "8px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
    border: `1.5px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.6)"}`,
    background: dark ? "rgba(255,255,255,0.05)" : "#f8fafc",
    color: dark ? "#e2e8f0" : "#1e293b", outline: "none", width: 86,
    fontFamily: "-apple-system,sans-serif",
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      <SectionCard title="Regular Hours" icon={<Clock size={14} />} dark={dark}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
          padding: "9px 12px", borderRadius: 12,
          background: dark ? "rgba(59,130,246,0.07)" : "rgba(219,234,254,0.5)",
          border: `1px solid ${dark ? "rgba(59,130,246,0.12)" : "rgba(147,197,253,0.4)"}` }}>
          <CheckCircle2 size={13} style={{ color: "#22c55e" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: dark ? "#93c5fd" : "#1d4ed8" }}>
            Open with main hours
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {hours.map((d, idx) => (
            <motion.div key={d.day} variants={fadeIn}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0",
                borderBottom: idx < hours.length - 1 ? `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}` : "none" }}>

              {/* day label */}
              <span style={{ width: 80, fontSize: 12.5, fontWeight: 700, flexShrink: 0,
                color: dark ? (d.closed ? "#334155" : "#e2e8f0") : (d.closed ? "#cbd5e1" : "#1e293b") }}>
                {d.day.slice(0, 3)}
              </span>

              {/* closed toggle */}
              <Toggle value={!d.closed} onChange={v => update(idx, "closed", !v)} dark={dark} />

              {/* time inputs */}
              <AnimatePresence mode="wait">
                {!d.closed ? (
                  <motion.div key="open" initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.18 }}
                    style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <input type="time" value={d.open}
                      onChange={e => update(idx, "open", e.target.value)}
                      style={timeInp} />
                    <span style={{ fontSize: 11, color: dark ? "#334155" : "#94a3b8", fontWeight: 600 }}>–</span>
                    <input type="time" value={d.close}
                      onChange={e => update(idx, "close", e.target.value)}
                      style={timeInp} />
                  </motion.div>
                ) : (
                  <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                    <span style={{ fontSize: 12, fontWeight: 700,
                      color: dark ? "#334155" : "#cbd5e1" }}>Closed</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Special Hours" icon={<Star size={14} />} dark={dark}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 13, color: dark ? "#64748b" : "#94a3b8", fontWeight: 500, margin: 0 }}>
            No special hours added
          </p>
          <motion.button whileTap={{ scale: 0.93 }}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px",
              borderRadius: 10, border: `1.5px solid ${dark ? "rgba(59,130,246,0.2)" : "rgba(147,197,253,0.5)"}`,
              background: "transparent", cursor: "pointer", fontSize: 12, fontWeight: 700,
              color: "#3b82f6" }}>
            <Plus size={12} /> Add
          </motion.button>
        </div>
      </SectionCard>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MORE TAB
══════════════════════════════════════════ */
function MoreTab({ dark }: { dark: boolean }) {
  const [parking, setParking] = useState(PARKING_OPTIONS);
  const [access, setAccess] = useState(ACCESSIBILITY_OPTIONS);
  const [services, setServices] = useState(SERVICE_OPTIONS);

  function toggleParking(key: string) {
    setParking(p => p.map(x => x.key === key ? { ...x, value: !x.value } : x));
  }
  function toggleAccess(key: string) {
    setAccess(a => a.map(x => x.key === key ? { ...x, value: !x.value } : x));
  }
  function toggleService(key: string) {
    setServices(s => s.map(x => x.key === key ? { ...x, value: !x.value } : x));
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">

      {/* From the business */}
      <SectionCard title="From the Business" icon={<Info size={14} />} dark={dark}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {access.map(a => (
            <div key={a.key} style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500,
                color: dark ? "#94a3b8" : "#475569", flex: 1 }}>{a.label}</span>
              <Toggle value={a.value} onChange={() => toggleAccess(a.key)} dark={dark} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Parking */}
      <SectionCard title="Parking" icon={<Car size={14} />} dark={dark}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {parking.map(p => (
            <div key={p.key} style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500,
                color: dark ? "#94a3b8" : "#475569", flex: 1 }}>{p.label}</span>
              <Toggle value={p.value} onChange={() => toggleParking(p.key)} dark={dark} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Service options */}
      <SectionCard title="Service Options & Planning" icon={<Settings size={14} />} dark={dark}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {services.map(s => (
            <div key={s.key} style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: 10 }}>
              <span style={{ fontSize: 12.5, fontWeight: 500,
                color: dark ? "#94a3b8" : "#475569", flex: 1 }}>{s.label}</span>
              <Toggle value={s.value} onChange={() => toggleService(s.key)} dark={dark} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Google automated */}
      <SectionCard title="Google Automated Calls" icon={<Phone size={14} />} dark={dark}>
        <p style={{ fontSize: 12, color: dark ? "#64748b" : "#94a3b8", fontWeight: 500,
          lineHeight: 1.6, margin: "0 0 12px" }}>
          Allow automated calls and text messages to take bookings from customers and update your profile.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {["Take bookings from customers", "Keep your profile up to date",
            "Post to your profile on your behalf"].map((label, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 14, height: 14, borderRadius: 7, flexShrink: 0,
                background: dark ? "rgba(59,130,246,0.15)" : "rgba(59,130,246,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check size={8} color="#3b82f6" strokeWidth={3} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 500,
                color: dark ? "#94a3b8" : "#64748b" }}>{label}</span>
            </div>
          ))}
        </div>
      </SectionCard>

    </motion.div>
  );
}

/* ══════════════════════════════════════════
   SETTINGS DRAWER (bottom sheet)
══════════════════════════════════════════ */
function SettingsDrawer({ dark, onClose }: { dark: boolean; onClose: () => void }) {
  const settings = [
    {
      icon: <Users size={15} />, title: "People and access",
      desc: "Add, edit or remove people's access", color: "#3b82f6",
    },
    {
      icon: <Settings size={15} />, title: "Advanced settings",
      desc: "Profile ID, labels, shop codes", color: "#8b5cf6",
    },
    {
      icon: <Trash2 size={15} />, title: "Remove Business Profile",
      desc: "Mark closed or permanently remove", color: "#ef4444", danger: true,
    },
    {
      icon: <ExternalLink size={15} />, title: "Linked accounts",
      desc: "Google Ads, Merchant Center", color: "#22c55e",
    },
  ];

  return (
    <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
        borderRadius: "24px 24px 0 0", overflow: "hidden",
        background: dark ? "#0f1a2e" : "#fff",
        border: `1.5px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(203,213,225,0.6)"}`,
        boxShadow: "0 -12px 48px rgba(0,0,0,0.2)", maxHeight: "80vh", overflowY: "auto" }}>

      {/* handle */}
      <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 0" }}>
        <div style={{ width: 36, height: 4, borderRadius: 99,
          background: dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)" }} />
      </div>

      <div style={{ padding: "12px 20px 8px",
        borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}` }}>
        <h2 style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.03em",
          color: dark ? "#fff" : "#0f172a", margin: 0 }}>Profile Settings</h2>
      </div>

      <div style={{ padding: "8px 0 8px" }}>
        {settings.map((s, i) => (
          <motion.button key={i} whileTap={{ scale: 0.99 }}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 14,
              padding: "14px 20px", border: "none", background: "transparent",
              cursor: "pointer", textAlign: "left" }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: (s as any).danger
                ? "rgba(239,68,68,0.1)"
                : dark ? `rgba(59,130,246,0.1)` : `${s.color}14`,
              color: s.color }}>
              {s.icon}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, margin: "0 0 1px",
                color: (s as any).danger ? "#ef4444" : dark ? "#e2e8f0" : "#1e293b" }}>
                {s.title}
              </p>
              <p style={{ fontSize: 11, fontWeight: 500, margin: 0,
                color: dark ? "#475569" : "#94a3b8" }}>{s.desc}</p>
            </div>
            <ChevronRight size={14} style={{ color: dark ? "#334155" : "#cbd5e1" }} />
          </motion.button>
        ))}
      </div>

      {/* profile ID */}
      <div style={{ margin: "0 20px 20px", padding: "12px 14px", borderRadius: 14,
        background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}` }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase",
          letterSpacing: "0.08em", color: dark ? "#334155" : "#94a3b8", margin: "0 0 4px" }}>
          Business Profile ID
        </p>
        <p style={{ fontSize: 11.5, fontFamily: "monospace", fontWeight: 700,
          color: dark ? "#60a5fa" : "#2563eb", margin: 0, wordBreak: "break-all" }}>
          8458234036949018584
        </p>
      </div>

      {/* people */}
      <div style={{ margin: "0 20px 20px" }}>
        <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase",
          letterSpacing: "0.08em", color: dark ? "#334155" : "#94a3b8", margin: "0 0 10px" }}>
          People with Access
        </p>
        {[
          { name: "VT Blogs",            role: "Primary owner", email: "tbipin021@gmail.com" },
          { name: "vipprow",             role: "Owner",         email: "vipprowdigital@gmail.com", you: true },
          { name: "Sneha Harchandwani",  role: "Manager",       email: "sharchandwani@gmail.com" },
          { name: "Vipprow Contact",     role: "Owner",         email: "vipprowcontact@gmail.com" },
        ].map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
            padding: "9px 0",
            borderBottom: i < 3 ? `1px solid ${dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.05)"}` : "none" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
              background: `hsl(${(i * 70 + 210)},60%,${dark ? 35 : 70}%)`,
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>
                {p.name[0].toUpperCase()}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ fontSize: 12.5, fontWeight: 700, margin: 0,
                  color: dark ? "#e2e8f0" : "#1e293b", whiteSpace: "nowrap",
                  overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>
                  {p.name}
                </p>
                {p.you && (
                  <span style={{ fontSize: 9, fontWeight: 800, padding: "1px 6px", borderRadius: 99,
                    background: dark ? "rgba(59,130,246,0.2)" : "rgba(219,234,254,0.8)",
                    color: "#3b82f6" }}>you</span>
                )}
              </div>
              <p style={{ fontSize: 10.5, fontWeight: 500, margin: "1px 0 0",
                color: dark ? "#334155" : "#94a3b8" }}>{p.role}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "0 20px 32px" }}>
        <motion.button whileTap={{ scale: 0.98 }}
          onClick={onClose}
          style={{ width: "100%", padding: "13px 20px", borderRadius: 16, border: "none",
            background: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            cursor: "pointer", fontSize: 13, fontWeight: 700,
            color: dark ? "#94a3b8" : "#64748b" }}>
          Close
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   ROOT PAGE
══════════════════════════════════════════ */
export default function GoogleProfileEditPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && resolvedTheme === "dark";
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("about");
  const [showSettings, setShowSettings] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "about",    label: "About",    icon: <Info size={13} /> },
    { id: "contact",  label: "Contact",  icon: <Phone size={13} /> },
    { id: "location", label: "Location", icon: <MapPin size={13} /> },
    { id: "hours",    label: "Hours",    icon: <Clock size={13} /> },
    { id: "more",     label: "More",     icon: <Settings size={13} /> },
  ];

  const bg = dark
    ? "linear-gradient(160deg,#050d1a,#080f1e)"
    : "linear-gradient(160deg,#eef4ff,#f0f5ff)";

  return (
    <div style={{ minHeight: "100vh", background: bg,
      fontFamily: "-apple-system,'SF Pro Text',sans-serif", transition: "background 0.3s" }}>

      {/* overlay */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showSettings && <SettingsDrawer dark={dark} onClose={() => setShowSettings(false)} />}
      </AnimatePresence>

      <div style={{ maxWidth: 440, margin: "0 auto", padding: "0 16px", position: "relative", zIndex: 1 }}>

        {/* ── HEADER ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            paddingTop: 16, paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <motion.button onClick={() => router.back()} whileTap={{ scale: 0.88 }}
              style={{ width: 36, height: 36, borderRadius: 12, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                color: dark ? "#94a3b8" : "#64748b" }}>
              <ArrowLeft size={15} />
            </motion.button>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.03em", margin: 0,
                color: dark ? "#fff" : "#0f172a" }}>
                Business Information
              </h1>
              <p style={{ fontSize: 10.5, fontWeight: 500, margin: "1px 0 0",
                color: dark ? "#475569" : "#94a3b8" }}>
                Google Business Profile
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* save feedback */}
            <AnimatePresence>
              {saved && (
                <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.2 }}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px",
                    borderRadius: 99, background: dark ? "rgba(34,197,94,0.15)" : "rgba(220,252,231,0.8)",
                    border: `1px solid ${dark ? "rgba(34,197,94,0.2)" : "rgba(134,239,172,0.5)"}` }}>
                  <CheckCircle2 size={11} style={{ color: "#22c55e" }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#22c55e" }}>Saved</span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button onClick={() => setShowSettings(true)} whileTap={{ scale: 0.9 }}
              style={{ width: 34, height: 34, borderRadius: 11, border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                background: dark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                color: dark ? "#94a3b8" : "#64748b" }}>
              <Settings size={14} />
            </motion.button>

            <motion.button onClick={handleSave} disabled={saving} whileTap={{ scale: 0.94 }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
                borderRadius: 12, border: "none", cursor: saving ? "wait" : "pointer",
                background: "linear-gradient(135deg,#1d4ed8,#3b82f6)", color: "#fff",
                fontSize: 12.5, fontWeight: 800,
                boxShadow: "0 4px 16px rgba(37,99,235,0.28)",
                opacity: saving ? 0.8 : 1 }}>
              {saving ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                  <RefreshCw size={12} />
                </motion.div>
              ) : (
                <Save size={12} />
              )}
              {saving ? "Saving…" : "Save"}
            </motion.button>
          </div>
        </motion.div>

        {/* ── TAB BAR ── */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 12,
            scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {tabs.map(t => {
            const isActive = tab === t.id;
            return (
              <motion.button key={t.id} onClick={() => setTab(t.id)}
                whileTap={{ scale: 0.95 }}
                style={{ display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 13px", borderRadius: 12, border: "1.5px solid",
                  borderColor: isActive ? "#3b82f6" : dark ? "rgba(255,255,255,0.06)" : "rgba(203,213,225,0.6)",
                  background: isActive
                    ? (dark ? "rgba(37,99,235,0.18)" : "rgba(219,234,254,0.6)")
                    : (dark ? "transparent" : "transparent"),
                  color: isActive ? "#3b82f6" : dark ? "#475569" : "#94a3b8",
                  fontSize: 12, fontWeight: 700, cursor: "pointer",
                  transition: "all 0.18s", flexShrink: 0,
                  whiteSpace: "nowrap" as const }}>
                {t.icon}
                {t.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── TAB CONTENT ── */}
        <div style={{ paddingBottom: 48 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.22 }}>
              {tab === "about"    && <AboutTab    dark={dark} />}
              {tab === "contact"  && <ContactTab  dark={dark} />}
              {tab === "location" && <LocationTab dark={dark} />}
              {tab === "hours"    && <HoursTab    dark={dark} />}
              {tab === "more"     && <MoreTab     dark={dark} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── FOOTER INFO ── */}
        <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)"}`,
          paddingTop: 16, paddingBottom: 32 }}>
          <p style={{ fontSize: 10.5, color: dark ? "#1e293b" : "#cbd5e1", fontWeight: 500,
            lineHeight: 1.6, margin: "0 0 12px", textAlign: "center" }}>
            Business information is gathered and used by Google to improve your presence on Search & Maps.
          </p>
          <a href="https://business.google.com" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              fontSize: 11.5, color: "#3b82f6", fontWeight: 600, textDecoration: "none" }}>
            <ExternalLink size={11} />
            Business Profile Settings
          </a>
        </div>

      </div>
    </div>
  );
}