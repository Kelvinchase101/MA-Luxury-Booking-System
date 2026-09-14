import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Building2, Calendar, Search, LayoutDashboard, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight, Printer, Plus, X, Pencil, Ban, RefreshCw,
  Upload, Download, Phone, Users, StickyNote, AlertTriangle, Wrench,
  ArrowRightCircle, ArrowLeftCircle, ArrowLeftRight, Lock, Link2, QrCode
} from "lucide-react";

/* ----------------------------- constants ----------------------------- */

const APARTMENTS = [
  { name: "Darien Max", category: "3-Bedroom" },
  { name: "Streamwood Max", category: "3-Bedroom" },
  { name: "Countryside Max", category: "3-Bedroom" },
  { name: "Westmont Max", category: "3-Bedroom" },
  { name: "Darien", category: "2-Bedroom" },
  { name: "Streamwood", category: "2-Bedroom" },
  { name: "Westmont", category: "2-Bedroom" },
  { name: "Darien Studio", category: "Studio" },
  { name: "Streamwood Studiox", category: "Studio" },
  { name: "Countryside Studio", category: "Studio" },
  { name: "Clarendon Hills Studio", category: "Studio" },
];
const CATEGORY_ORDER = ["3-Bedroom", "2-Bedroom", "Studio"];
const STATUSES = ["Confirmed", "Pending", "Checked In", "Checked Out", "Cancelled"];
const BLOCKING_STATUSES = ["Confirmed", "Pending", "Checked In", "Checked Out"];
const BOOKINGS_KEY = "ma-bookings-v1";
const BLOCKS_KEY = "ma-blocks-v1";
const SETTINGS_KEY = "ma-settings-v1";
const SYNC_INTERVAL_MS = 20000;
const DEFAULT_SETTINGS = {
  adminPin: "1234",
  sheetsWebhookUrl: "",
  paymentLink: "https://pay.example.com/ma-luxury/REPLACE_ME",
};

/* ------------------------------- utils -------------------------------- */

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDaysISO = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const nightsBetween = (ci, co) => Math.round((parseISO(co) - parseISO(ci)) / 86400000);
const fmtDate = (iso) =>
  parseISO(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const fmtDateShort = (iso) => parseISO(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const genId = () =>
  "MA-" + Date.now().toString(36).toUpperCase().slice(-6) + Math.random().toString(36).slice(2, 4).toUpperCase();
const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart;
}

function findConflicts(apartment, checkin, checkout, bookings, blocks, excludeId) {
  const bookingHits = bookings.filter(
    (b) =>
      b.apartment === apartment &&
      b.id !== excludeId &&
      BLOCKING_STATUSES.includes(b.status) &&
      overlaps(b.checkin, b.checkout, checkin, checkout)
  );
  const blockHits = blocks.filter(
    (bl) => bl.apartment === apartment && overlaps(bl.start, bl.end, checkin, checkout)
  );
  return { bookingHits, blockHits, hasConflict: bookingHits.length > 0 || blockHits.length > 0 };
}

/* --------------------------- storage helpers --------------------------- */

const GOOGLE_SHEETS_API_URL = (import.meta.env.VITE_GOOGLE_SHEETS_API_URL || "").trim();

async function loadList(key) {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}
async function saveList(key, list) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}
async function loadSettings() {
  try {
    const value = window.localStorage.getItem(SETTINGS_KEY);
    if (!value) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(value) };
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}
async function saveSettings(settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    return false;
  }
}

function getSheetsApiUrl(settings) {
  return GOOGLE_SHEETS_API_URL || (settings?.sheetsWebhookUrl || "").trim();
}

async function fetchGoogleSheetsData(url) {
  const clean = (url || "").trim();
  if (!clean || clean.includes("REPLACE_ME") || clean.includes("PASTE_YOUR")) return null;
  try {
    const response = await fetch(clean, { method: "GET", cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!data || !Array.isArray(data.bookings) || !Array.isArray(data.blocks)) return null;
    return data;
  } catch (e) {
    console.warn("Google Sheets read failed:", e);
    return null;
  }
}

async function postToGoogleSheets(url, payload) {
  const clean = (url || "").trim();
  if (!clean || clean.includes("REPLACE_ME") || clean.includes("PASTE_YOUR")) return { skipped: true };
  try {
    await fetch(clean, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

async function pushToGoogleSheets(url, record) {
  return postToGoogleSheets(url, { action: "upsertBooking", booking: record });
}

/* ================================ APP =================================== */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [tab, setTab] = useState("book");
  const [lastSync, setLastSync] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = useCallback((msg, kind = "info") => {
    setToast({ msg, kind, id: Math.random() });
    setTimeout(() => setToast((t) => (t && t.msg === msg ? null : t)), 3800);
  }, []);

  const refreshData = useCallback(async (silent) => {
    const localSettings = await loadSettings();
    setSettings(localSettings);

    const remote = await fetchGoogleSheetsData(getSheetsApiUrl(localSettings));
    if (remote) {
      setBookings(remote.bookings);
      setBlocks(remote.blocks);
      if (remote.settings) setSettings((current) => ({ ...current, ...remote.settings }));
      await saveList(BOOKINGS_KEY, remote.bookings);
      await saveList(BLOCKS_KEY, remote.blocks);
      if (remote.settings) await saveSettings({ ...localSettings, ...remote.settings });
    } else {
      const [b, bl] = await Promise.all([loadList(BOOKINGS_KEY), loadList(BLOCKS_KEY)]);
      setBookings(b);
      setBlocks(bl);
    }
    setLastSync(new Date());
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    refreshData(false);
    const iv = setInterval(() => refreshData(true), SYNC_INTERVAL_MS);
    return () => clearInterval(iv);
  }, [refreshData]);

  const persistBookings = useCallback(async (next) => {
    setBookings(next);
    await saveList(BOOKINGS_KEY, next);
    const url = getSheetsApiUrl(settings);
    if (url) await postToGoogleSheets(url, { action: "replaceBookings", bookings: next });
  }, [settings]);
  const persistBlocks = useCallback(async (next) => {
    setBlocks(next);
    await saveList(BLOCKS_KEY, next);
    const url = getSheetsApiUrl(settings);
    if (url) await postToGoogleSheets(url, { action: "replaceBlocks", blocks: next });
  }, [settings]);
  const persistSettings = useCallback(async (next) => {
    setSettings(next);
    await saveSettings(next);
    const url = getSheetsApiUrl(next);
    if (url) await postToGoogleSheets(url, { action: "saveSettings", settings: next });
  }, []);

  return (
    <div className="ma-app">
      <Style />
      {toast && <div className={`ma-toast ma-toast-${toast.kind}`}>{toast.msg}</div>}
      <TopBar tab={tab} setTab={setTab} lastSync={lastSync} onSync={() => refreshData(false)} />
      <main className="ma-main">
        {loading ? (
          <div className="ma-loading">Loading live booking data…</div>
        ) : (
          <>
            {tab === "book" && (
              <BookingTab
                bookings={bookings}
                blocks={blocks}
                settings={settings}
                persistBookings={persistBookings}
                refreshData={refreshData}
                showToast={showToast}
              />
            )}
            {tab === "search" && <SearchTab bookings={bookings} blocks={blocks} refreshData={refreshData} />}
            {tab === "calendar" && <CalendarTab bookings={bookings} blocks={blocks} />}
            {tab === "admin" && (
              adminUnlocked ? (
                <AdminTab
                  bookings={bookings}
                  blocks={blocks}
                  settings={settings}
                  persistBookings={persistBookings}
                  persistBlocks={persistBlocks}
                  persistSettings={persistSettings}
                  refreshData={refreshData}
                  showToast={showToast}
                  fileInputRef={fileInputRef}
                />
              ) : (
                <PinGate settings={settings} onUnlock={() => setAdminUnlocked(true)} />
              )
            )}
          </>
        )}
      </main>
    </div>
  );
}

/* ------------------------------- Top bar -------------------------------- */

function TopBar({ tab, setTab, lastSync, onSync }) {
  const items = [
    { id: "book", label: "Book a Stay", icon: Building2 },
    { id: "search", label: "Availability Search", icon: Search },
    { id: "calendar", label: "Occupancy Calendar", icon: Calendar },
    { id: "admin", label: "Admin Dashboard", icon: LayoutDashboard },
  ];
  return (
    <header className="ma-topbar no-print">
      <div className="ma-brand">
        <div className="ma-brand-mark">MA</div>
        <div>
          <div className="ma-brand-name">MA Luxury Apartments</div>
          <div className="ma-brand-sub">Booking operations</div>
        </div>
      </div>
      <nav className="ma-nav">
        {items.map((it) => (
          <button
            key={it.id}
            className={`ma-nav-item ${tab === it.id ? "active" : ""}`}
            onClick={() => setTab(it.id)}
          >
            <it.icon size={15} strokeWidth={1.8} />
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <button className="ma-sync-btn" onClick={onSync} title="Refresh live data">
        <RefreshCw size={13} strokeWidth={2} />
        {lastSync ? `Synced ${lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Sync"}
      </button>
    </header>
  );
}

/* ------------------------------- Pin gate -------------------------------- */

function PinGate({ settings, onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = () => {
    if (pin === settings.adminPin) onUnlock();
    else setError("Incorrect PIN.");
  };

  return (
    <div className="ma-panel ma-pingate">
      <Lock size={26} strokeWidth={1.5} />
      <h2>Staff access</h2>
      <p className="ma-muted">Enter the admin PIN to open the dashboard.</p>
      <div className="ma-pin-row">
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => { setPin(e.target.value); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="PIN"
        />
        <button className="ma-btn ma-btn-primary" onClick={submit}>Unlock</button>
      </div>
      {error && <div className="ma-inline-error"><AlertTriangle size={14} /> {error}</div>}
      <p className="ma-pingate-note">
        Default PIN is 1234 until changed under Admin Dashboard → Settings. This is a basic screen-lock
        for day-to-day use, not secure authentication — anyone with the PIN, or with browser dev tools,
        can still reach this tab.
      </p>
    </div>
  );
}

/* ----------------------------- Booking tab ------------------------------ */

function emptyForm() {
  return {
    guestName: "",
    phone: "",
    apartment: "",
    checkin: "",
    checkout: "",
    guests: 1,
    status: "Confirmed",
    notes: "",
  };
}

function BookingTab({ bookings, blocks, settings, persistBookings, refreshData, showToast }) {
  const [form, setForm] = useState(emptyForm());
  const [availability, setAvailability] = useState(null); // {ok, conflict:{bookingHits,blockHits}}
  const [confirmed, setConfirmed] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const nights = form.checkin && form.checkout ? nightsBetween(form.checkin, form.checkout) : null;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setAvailability(null);
    setError("");
  };

  const validate = () => {
    if (!form.guestName.trim()) return "Enter the guest's full name.";
    if (!form.phone.trim()) return "Enter a phone number.";
    if (!form.apartment) return "Select an apartment.";
    if (!form.checkin || !form.checkout) return "Select both check-in and check-out dates.";
    if (form.checkout <= form.checkin) return "Check-out must be after check-in.";
    if (!form.guests || Number(form.guests) < 1) return "Number of guests must be at least 1.";
    return "";
  };

  const checkAvailability = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setChecking(true);
    await refreshData(true); // pull latest before checking
    setChecking(false);
    const fresh = await loadList(BOOKINGS_KEY);
    const freshBlocks = await loadList(BLOCKS_KEY);
    const conflict = findConflicts(form.apartment, form.checkin, form.checkout, fresh, freshBlocks);
    setAvailability({ ok: !conflict.hasConflict, conflict });
  };

  const confirmBooking = async () => {
    setChecking(true);
    // final re-check immediately before writing, to guard against a race with another user
    const fresh = await loadList(BOOKINGS_KEY);
    const freshBlocks = await loadList(BLOCKS_KEY);
    const conflict = findConflicts(form.apartment, form.checkin, form.checkout, fresh, freshBlocks);
    if (conflict.hasConflict) {
      setChecking(false);
      setAvailability({ ok: false, conflict });
      showToast("Another booking just took this apartment for those dates — please review.", "warn");
      return;
    }
    const record = {
      id: genId(),
      guestName: form.guestName.trim(),
      phone: form.phone.trim(),
      apartment: form.apartment,
      checkin: form.checkin,
      checkout: form.checkout,
      nights: nightsBetween(form.checkin, form.checkout),
      guests: Number(form.guests),
      status: form.status,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };
    const next = [...fresh, record];
    await persistBookings(next);
    setChecking(false);
    setConfirmed(record);
    if (getSheetsApiUrl(settings)) showToast("Booking saved to Google Sheets.");
  };

  if (confirmed) {
    return (
      <div className="ma-panel ma-confirm print-area">
        <div className="ma-confirm-icon">
          <CheckCircle2 size={40} strokeWidth={1.5} />
        </div>
        <h2>Booking Confirmed</h2>
        <p className="ma-muted">Guest booking has been successfully recorded.</p>
        <dl className="ma-confirm-grid">
          <dt>Guest name</dt>
          <dd>{confirmed.guestName}</dd>
          <dt>Apartment</dt>
          <dd>{confirmed.apartment}</dd>
          <dt>Check-in</dt>
          <dd>{fmtDate(confirmed.checkin)}</dd>
          <dt>Check-out</dt>
          <dd>{fmtDate(confirmed.checkout)}</dd>
          <dt>Nights</dt>
          <dd>{confirmed.nights}</dd>
          <dt>Booking ID</dt>
          <dd className="ma-mono">{confirmed.id}</dd>
        </dl>

        {settings.paymentLink && (
          <div className="ma-pay-block">
            <h3 className="ma-pay-heading">Scan to pay</h3>
            <img
              className="ma-qr"
              alt="Payment QR code"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(settings.paymentLink)}`}
            />
            <p className="ma-muted ma-pay-link">{settings.paymentLink}</p>
            {settings.paymentLink.includes("REPLACE_ME") && (
              <p className="ma-pay-warning no-print">
                <AlertTriangle size={13} /> Placeholder link — set your real payment link in Admin Dashboard → Settings.
              </p>
            )}
          </div>
        )}

        <div className="ma-confirm-actions no-print">
          <button className="ma-btn ma-btn-ghost" onClick={() => window.print()}>
            <Printer size={15} /> Print booking
          </button>
          <button
            className="ma-btn ma-btn-primary"
            onClick={() => {
              setConfirmed(null);
              setForm(emptyForm());
              setAvailability(null);
            }}
          >
            <Plus size={15} /> Create new booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ma-panel">
      <h2 className="ma-panel-title">Book a stay</h2>
      <p className="ma-muted ma-panel-sub">Guest details, then apartment and dates. Availability is checked live before anything is confirmed.</p>

      <div className="ma-form-grid">
        <label className="ma-field">
          <span>Guest full name</span>
          <input value={form.guestName} onChange={(e) => set("guestName", e.target.value)} placeholder="e.g. Adaeze Okonkwo" />
        </label>
        <label className="ma-field">
          <span>Guest phone number</span>
          <input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. +234 801 234 5678" />
        </label>
        <label className="ma-field">
          <span>Apartment</span>
          <select value={form.apartment} onChange={(e) => set("apartment", e.target.value)}>
            <option value="">Select an apartment…</option>
            {CATEGORY_ORDER.map((cat) => (
              <optgroup key={cat} label={cat}>
                {APARTMENTS.filter((a) => a.category === cat).map((a) => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="ma-field">
          <span>Number of guests</span>
          <input type="number" min={1} value={form.guests} onChange={(e) => set("guests", e.target.value)} />
        </label>
        <label className="ma-field">
          <span>Check-in date</span>
          <input type="date" value={form.checkin} onChange={(e) => set("checkin", e.target.value)} />
        </label>
        <label className="ma-field">
          <span>Check-out date</span>
          <input type="date" value={form.checkout} onChange={(e) => set("checkout", e.target.value)} />
        </label>
        <label className="ma-field">
          <span>Booking status</span>
          <select value={form.status} onChange={(e) => set("status", e.target.value)}>
            {STATUSES.filter((s) => s !== "Cancelled").map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className="ma-field">
          <span>Nights</span>
          <input value={nights !== null && nights >= 0 ? nights : ""} readOnly placeholder="—" />
        </label>
        <label className="ma-field ma-field-wide">
          <span>Notes (optional)</span>
          <textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything the team should know…" />
        </label>
      </div>

      {error && <div className="ma-inline-error"><AlertTriangle size={14} /> {error}</div>}

      <div className="ma-actions">
        <button className="ma-btn ma-btn-primary" onClick={checkAvailability} disabled={checking}>
          {checking ? "Checking…" : "Check availability"}
        </button>
      </div>

      {availability && (
        availability.ok ? (
          <div className="ma-avail ma-avail-ok">
            <CheckCircle2 size={18} /> <strong>Apartment Available ✓</strong>
            <span className="ma-muted"> — {form.apartment}, {fmtDate(form.checkin)} to {fmtDate(form.checkout)}</span>
            <div className="ma-actions">
              <button className="ma-btn ma-btn-primary" onClick={confirmBooking} disabled={checking}>
                {checking ? "Confirming…" : "Confirm booking"}
              </button>
            </div>
          </div>
        ) : (
          <div className="ma-avail ma-avail-bad">
            <XCircle size={18} /> <strong>Day Not Available</strong>
            <p>Sorry, this apartment is already booked for one or more of the selected dates. Please select another apartment or different dates.</p>
            <ul className="ma-conflict-list">
              {availability.conflict.bookingHits.map((b) => (
                <li key={b.id}>Booked {fmtDate(b.checkin)} – {fmtDate(b.checkout)} for {b.guestName}</li>
              ))}
              {availability.conflict.blockHits.map((bl) => (
                <li key={bl.id}>Blocked for maintenance {fmtDate(bl.start)} – {fmtDate(bl.end)}{bl.reason ? ` (${bl.reason})` : ""}</li>
              ))}
            </ul>
          </div>
        )
      )}
    </div>
  );
}

/* ------------------------------ Search tab ------------------------------ */

function SearchTab({ bookings, blocks, refreshData }) {
  const [checkin, setCheckin] = useState(todayISO());
  const [checkout, setCheckout] = useState(addDaysISO(todayISO(), 1));
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!checkin || !checkout || checkout <= checkin) return;
    setBusy(true);
    await refreshData(true);
    const fresh = await loadList(BOOKINGS_KEY);
    const freshBlocks = await loadList(BLOCKS_KEY);
    const available = [];
    const unavailable = [];
    APARTMENTS.forEach((a) => {
      const c = findConflicts(a.name, checkin, checkout, fresh, freshBlocks);
      if (c.hasConflict) unavailable.push({ ...a, conflict: c });
      else available.push(a);
    });
    setResults({ available, unavailable });
    setBusy(false);
  };

  useEffect(() => { run(); /* eslint-disable-next-line */ }, []);

  return (
    <div className="ma-panel">
      <h2 className="ma-panel-title">Availability search</h2>
      <p className="ma-muted ma-panel-sub">Enter a date range to see every apartment's status at a glance.</p>
      <div className="ma-search-row">
        <label className="ma-field">
          <span>Check-in date</span>
          <input type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
        </label>
        <label className="ma-field">
          <span>Check-out date</span>
          <input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} />
        </label>
        <button className="ma-btn ma-btn-primary ma-search-btn" onClick={run} disabled={busy}>
          <Search size={15} /> {busy ? "Searching…" : "Search"}
        </button>
      </div>
      {checkout <= checkin && <div className="ma-inline-error"><AlertTriangle size={14} /> Check-out must be after check-in.</div>}

      {results && (
        <div className="ma-search-results">
          <div className="ma-result-col">
            <h3 className="ma-result-heading ma-good">Available apartments</h3>
            {results.available.length === 0 && <p className="ma-muted">None available for these dates.</p>}
            <ul className="ma-result-list">
              {results.available.map((a) => (
                <li key={a.name}><CheckCircle2 size={15} className="ma-good" /> {a.name} <span className="ma-tag">{a.category}</span></li>
              ))}
            </ul>
          </div>
          <div className="ma-result-col">
            <h3 className="ma-result-heading ma-bad">Unavailable</h3>
            {results.unavailable.length === 0 && <p className="ma-muted">Everything else is open.</p>}
            <ul className="ma-result-list">
              {results.unavailable.map((a) => (
                <li key={a.name}>
                  <XCircle size={15} className="ma-bad" /> {a.name} <span className="ma-tag">{a.category}</span>
                  <div className="ma-result-detail">
                    {a.conflict.bookingHits.map((b) => (
                      <span key={b.id}>booked {fmtDateShort(b.checkin)}–{fmtDateShort(b.checkout)}</span>
                    ))}
                    {a.conflict.blockHits.map((bl) => (
                      <span key={bl.id}>maintenance {fmtDateShort(bl.start)}–{fmtDateShort(bl.end)}</span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Calendar tab ------------------------------ */

function cellStatus(apartmentName, iso, bookings, blocks) {
  const isBlocked = blocks.some((bl) => bl.apartment === apartmentName && iso >= bl.start && iso < bl.end);
  const isCheckin = bookings.some(
    (b) => b.apartment === apartmentName && BLOCKING_STATUSES.includes(b.status) && b.checkin === iso
  );
  const isCheckout = bookings.some(
    (b) => b.apartment === apartmentName && BLOCKING_STATUSES.includes(b.status) && b.checkout === iso
  );
  const isOccupied = bookings.some(
    (b) =>
      b.apartment === apartmentName &&
      BLOCKING_STATUSES.includes(b.status) &&
      iso > b.checkin &&
      iso < b.checkout
  );
  if (isBlocked) return "maintenance";
  if (isCheckin && isCheckout) return "turnover";
  if (isCheckin) return "checkin";
  if (isCheckout) return "checkout";
  if (isOccupied) return "occupied";
  return "available";
}

const STATUS_ICON = {
  available: null,
  occupied: null,
  checkin: <ArrowRightCircle size={12} strokeWidth={2} />,
  checkout: <ArrowLeftCircle size={12} strokeWidth={2} />,
  turnover: <ArrowLeftRight size={12} strokeWidth={2} />,
  maintenance: <Wrench size={11} strokeWidth={2} />,
};

function CalendarTab({ bookings, blocks }) {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });

  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const dates = useMemo(
    () => Array.from({ length: daysInMonth }, (_, i) => {
      const d = new Date(view.year, view.month, i + 1);
      return { iso: toISO(d), day: i + 1, dow: d.toLocaleDateString("en-US", { weekday: "narrow" }) };
    }),
    [view, daysInMonth]
  );

  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const shiftMonth = (delta) => {
    let m = view.month + delta, y = view.year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setView({ year: y, month: m });
  };

  return (
    <div className="ma-panel ma-cal-panel">
      <div className="ma-cal-header">
        <h2 className="ma-panel-title">Occupancy calendar</h2>
        <div className="ma-cal-nav">
          <button className="ma-icon-btn" onClick={() => shiftMonth(-1)}><ChevronLeft size={16} /></button>
          <span className="ma-cal-month">{monthLabel}</span>
          <button className="ma-icon-btn" onClick={() => shiftMonth(1)}><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="ma-cal-scroll">
        <table className="ma-cal-table">
          <thead>
            <tr>
              <th className="ma-cal-apt-head">Apartment</th>
              {dates.map((d) => (
                <th key={d.iso} className={d.iso === todayISO() ? "ma-cal-today" : ""}>
                  <div className="ma-cal-dow">{d.dow}</div>
                  <div>{d.day}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CATEGORY_ORDER.map((cat) => (
              <React.Fragment key={cat}>
                <tr className="ma-cal-cat-row"><td colSpan={dates.length + 1}>{cat}</td></tr>
                {APARTMENTS.filter((a) => a.category === cat).map((a) => (
                  <tr key={a.name}>
                    <td className="ma-cal-apt-name">{a.name}</td>
                    {dates.map((d) => {
                      const status = cellStatus(a.name, d.iso, bookings, blocks);
                      return (
                        <td key={d.iso} className={`ma-cell ma-cell-${status}`} title={status}>
                          {STATUS_ICON[status]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ma-legend">
        <span><i className="ma-swatch ma-cell-available" /> Available</span>
        <span><i className="ma-swatch ma-cell-occupied" /> Booked</span>
        <span><i className="ma-swatch ma-cell-checkin" /> Check-in</span>
        <span><i className="ma-swatch ma-cell-checkout" /> Check-out</span>
        <span><i className="ma-swatch ma-cell-turnover" /> Turnover</span>
        <span><i className="ma-swatch ma-cell-maintenance" /> Maintenance</span>
      </div>
    </div>
  );
}

/* ------------------------------- Admin tab ------------------------------- */

function AdminTab({ bookings, blocks, settings, persistBookings, persistBlocks, persistSettings, refreshData, showToast, fileInputRef }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [blockForm, setBlockForm] = useState({ apartment: "", start: "", end: "", reason: "" });
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [importing, setImporting] = useState(false);

  const today = todayISO();

  const stats = useMemo(() => {
    const active = bookings.filter((b) => BLOCKING_STATUSES.includes(b.status));
    const todayIn = active.filter((b) => b.checkin === today);
    const todayOut = active.filter((b) => b.checkout === today);
    const occupiedNames = new Set(
      APARTMENTS.map((a) => a.name).filter((name) =>
        active.some((b) => b.apartment === name && today >= b.checkin && today < b.checkout)
      )
    );
    const blockedNames = new Set(
      APARTMENTS.map((a) => a.name).filter((name) => blocks.some((bl) => bl.apartment === name && today >= bl.start && today < bl.end))
    );
    const availableNames = APARTMENTS.map((a) => a.name).filter((n) => !occupiedNames.has(n) && !blockedNames.has(n));
    const upcoming = active.filter((b) => b.checkin > today).sort((a, b) => a.checkin.localeCompare(b.checkin));
    const occupancyRate = Math.round((occupiedNames.size / APARTMENTS.length) * 100);
    return { todayIn, todayOut, occupied: occupiedNames, blocked: blockedNames, available: availableNames, upcoming, occupancyRate };
  }, [bookings, blocks, today]);

  const filtered = useMemo(() => {
    if (!query.trim()) return bookings.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const q = norm(query);
    return bookings
      .filter((b) => [b.guestName, b.phone, b.apartment, b.status, b.id].some((f) => norm(f).includes(q)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [bookings, query]);

  const updateBooking = async (updated) => {
    const conflict = findConflicts(updated.apartment, updated.checkin, updated.checkout, bookings, blocks, updated.id);
    if (BLOCKING_STATUSES.includes(updated.status) && conflict.hasConflict) {
      showToast("Can't save — this would overlap another booking or a maintenance block.", "warn");
      return false;
    }
    const next = bookings.map((b) => (b.id === updated.id ? { ...updated, nights: nightsBetween(updated.checkin, updated.checkout) } : b));
    await persistBookings(next);
    showToast("Booking updated.");
    return true;
  };

  const cancelBooking = async (id) => {
    const next = bookings.map((b) => (b.id === id ? { ...b, status: "Cancelled" } : b));
    await persistBookings(next);
    showToast("Booking cancelled.");
  };

  const addBlock = async () => {
    if (!blockForm.apartment || !blockForm.start || !blockForm.end || blockForm.end <= blockForm.start) {
      showToast("Fill in apartment and a valid date range.", "warn");
      return;
    }
    const conflict = findConflicts(blockForm.apartment, blockForm.start, blockForm.end, bookings, []);
    if (conflict.hasConflict) {
      showToast("Note: there is an existing booking in this range — block added anyway, please review.", "warn");
    }
    const record = { id: genId(), apartment: blockForm.apartment, start: blockForm.start, end: blockForm.end, reason: blockForm.reason.trim() };
    await persistBlocks([...blocks, record]);
    setBlockForm({ apartment: "", start: "", end: "", reason: "" });
    setShowBlockForm(false);
    showToast("Apartment blocked for maintenance.");
  };

  const removeBlock = async (id) => {
    await persistBlocks(blocks.filter((b) => b.id !== id));
  };

  const exportExcel = () => {
    const rows = bookings.map((b) => ({
      "Booking ID": b.id,
      "Guest Name": b.guestName,
      "Phone": b.phone,
      "Apartment": b.apartment,
      "Check-in": b.checkin,
      "Check-out": b.checkout,
      "Nights": b.nights,
      "Guests": b.guests,
      "Status": b.status,
      "Notes": b.notes,
      "Created At": b.createdAt,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Bookings");
    XLSX.writeFile(wb, `MA-Luxury-Bookings-${today}.xlsx`);
  };

  const importExcel = async (file) => {
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const keyMap = {
        bookingid: "id", id: "id",
        guestname: "guestName", guest: "guestName", name: "guestName",
        phone: "phone", phonenumber: "phone",
        apartment: "apartment", unit: "apartment",
        checkin: "checkin", checkindate: "checkin",
        checkout: "checkout", checkoutdate: "checkout",
        nights: "nights", numberofnights: "nights",
        guests: "guests", numberofguests: "guests",
        status: "status", bookingstatus: "status",
        notes: "notes",
        createdat: "createdAt", datebookingwascreated: "createdAt",
      };
      const asISO = (v) => {
        if (!v) return "";
        if (v instanceof Date) return toISO(v);
        const s = String(v).trim();
        const d = new Date(s);
        return isNaN(d) ? s : toISO(d);
      };

      const existingIds = new Set(bookings.map((b) => b.id));
      const imported = [];
      rows.forEach((row) => {
        const rec = {};
        Object.entries(row).forEach(([k, v]) => {
          const mapped = keyMap[norm(k)];
          if (mapped) rec[mapped] = v;
        });
        if (!rec.guestName && !rec.apartment) return; // skip empty rows
        const checkin = asISO(rec.checkin);
        const checkout = asISO(rec.checkout);
        const id = rec.id && !existingIds.has(String(rec.id)) ? String(rec.id) : genId();
        existingIds.add(id);
        imported.push({
          id,
          guestName: String(rec.guestName || "").trim(),
          phone: String(rec.phone || "").trim(),
          apartment: String(rec.apartment || "").trim(),
          checkin,
          checkout,
          nights: rec.nights ? Number(rec.nights) : (checkin && checkout ? nightsBetween(checkin, checkout) : 0),
          guests: rec.guests ? Number(rec.guests) : 1,
          status: STATUSES.includes(rec.status) ? rec.status : "Confirmed",
          notes: String(rec.notes || "").trim(),
          createdAt: rec.createdAt ? asISO(rec.createdAt) : new Date().toISOString(),
        });
      });

      const next = [...bookings, ...imported];
      await persistBookings(next);
      showToast(`Imported ${imported.length} booking${imported.length === 1 ? "" : "s"} from Excel.`);
    } catch (e) {
      showToast("Couldn't read that file — check it's a valid .xlsx export.", "warn");
    }
    setImporting(false);
  };

  return (
    <div className="ma-admin">
      <div className="ma-stat-grid">
        <StatTile label="Today's check-ins" value={stats.todayIn.length} detail={stats.todayIn.map((b) => b.guestName).join(", ")} />
        <StatTile label="Today's check-outs" value={stats.todayOut.length} detail={stats.todayOut.map((b) => b.guestName).join(", ")} />
        <StatTile label="Occupied now" value={stats.occupied.size} detail={`of ${APARTMENTS.length} apartments`} />
        <StatTile label="Available now" value={stats.available.length} detail={stats.available.slice(0, 3).join(", ")} />
        <StatTile label="Upcoming bookings" value={stats.upcoming.length} detail="check-in after today" />
        <StatTile label="Total bookings" value={bookings.length} detail="all time" />
        <StatTile label="Occupancy rate" value={`${stats.occupancyRate}%`} detail="as of today" />
        <StatTile label="Blocked / maintenance" value={stats.blocked.size} detail="apartments today" />
      </div>

      <div className="ma-panel">
        <h3 className="ma-panel-title">Apartment-by-apartment status</h3>
        <div className="ma-apt-grid">
          {APARTMENTS.map((a) => {
            const isOcc = stats.occupied.has(a.name);
            const isBlk = stats.blocked.has(a.name);
            const label = isBlk ? "Maintenance" : isOcc ? "Occupied" : "Available";
            const cls = isBlk ? "ma-bad" : isOcc ? "ma-warn2" : "ma-good";
            return (
              <div key={a.name} className="ma-apt-row">
                <span>{a.name}</span>
                <span className={`ma-status-pill ${cls}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="ma-panel">
        <div className="ma-panel-header-row">
          <h3 className="ma-panel-title">Bookings</h3>
          <div className="ma-panel-actions">
            <button className="ma-btn ma-btn-ghost" onClick={() => setShowBlockForm((s) => !s)}>
              <Ban size={14} /> Block for maintenance
            </button>
            <button className="ma-btn ma-btn-ghost" onClick={exportExcel}>
              <Download size={14} /> Export to Excel
            </button>
            <button className="ma-btn ma-btn-ghost" onClick={() => fileInputRef.current?.click()} disabled={importing}>
              <Upload size={14} /> {importing ? "Importing…" : "Import from Excel"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              onChange={(e) => { if (e.target.files?.[0]) importExcel(e.target.files[0]); e.target.value = ""; }}
            />
          </div>
        </div>

        {showBlockForm && (
          <div className="ma-block-form">
            <select value={blockForm.apartment} onChange={(e) => setBlockForm((f) => ({ ...f, apartment: e.target.value }))}>
              <option value="">Apartment…</option>
              {APARTMENTS.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
            </select>
            <input type="date" value={blockForm.start} onChange={(e) => setBlockForm((f) => ({ ...f, start: e.target.value }))} />
            <input type="date" value={blockForm.end} onChange={(e) => setBlockForm((f) => ({ ...f, end: e.target.value }))} />
            <input placeholder="Reason (optional)" value={blockForm.reason} onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))} />
            <button className="ma-btn ma-btn-primary" onClick={addBlock}>Add block</button>
          </div>
        )}

        {blocks.length > 0 && (
          <div className="ma-blocks-list">
            {blocks.map((bl) => (
              <div key={bl.id} className="ma-block-chip">
                <Wrench size={12} /> {bl.apartment}: {fmtDateShort(bl.start)}–{fmtDateShort(bl.end)}{bl.reason ? ` · ${bl.reason}` : ""}
                <button onClick={() => removeBlock(bl.id)}><X size={12} /></button>
              </div>
            ))}
          </div>
        )}

        <input className="ma-search-input" placeholder="Search by guest, phone, apartment, status, or booking ID…" value={query} onChange={(e) => setQuery(e.target.value)} />

        <div className="ma-table-scroll">
          <table className="ma-table">
            <thead>
              <tr>
                <th>Booking ID</th><th>Guest</th><th>Phone</th><th>Apartment</th>
                <th>Check-in</th><th>Check-out</th><th>Nights</th><th>Guests</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className={b.status === "Cancelled" ? "ma-row-cancelled" : ""}>
                  <td className="ma-mono">{b.id}</td>
                  <td>{b.guestName}</td>
                  <td>{b.phone}</td>
                  <td>{b.apartment}</td>
                  <td>{fmtDateShort(b.checkin)}</td>
                  <td>{fmtDateShort(b.checkout)}</td>
                  <td>{b.nights}</td>
                  <td>{b.guests}</td>
                  <td><span className={`ma-status-pill ${b.status === "Cancelled" ? "ma-bad" : "ma-good"}`}>{b.status}</span></td>
                  <td className="ma-row-actions">
                    <button className="ma-icon-btn" onClick={() => setEditing(b)} title="Edit"><Pencil size={13} /></button>
                    {b.status !== "Cancelled" && (
                      <button className="ma-icon-btn" onClick={() => cancelBooking(b.id)} title="Cancel"><Ban size={13} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="ma-muted" style={{ textAlign: "center", padding: "24px 0" }}>No bookings match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SettingsPanel settings={settings} persistSettings={persistSettings} showToast={showToast} />

      {editing && (
        <EditModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSave={async (upd) => { const ok = await updateBooking(upd); if (ok) setEditing(null); }}
        />
      )}
    </div>
  );
}

function SettingsPanel({ settings, persistSettings, showToast }) {
  const [open, setOpen] = useState(false);
  const [pinCurrent, setPinCurrent] = useState("");
  const [pinNext, setPinNext] = useState("");
  const [sheetsUrl, setSheetsUrl] = useState(settings.sheetsWebhookUrl);
  const [paymentLink, setPaymentLink] = useState(settings.paymentLink);
  const [testing, setTesting] = useState(false);

  const changePin = async () => {
    if (pinCurrent !== settings.adminPin) { showToast("Current PIN is incorrect.", "warn"); return; }
    if (!pinNext.trim()) { showToast("Enter a new PIN.", "warn"); return; }
    await persistSettings({ ...settings, adminPin: pinNext.trim() });
    setPinCurrent(""); setPinNext("");
    showToast("Admin PIN updated.");
  };

  const saveIntegrations = async () => {
    await persistSettings({
      ...settings,
      sheetsWebhookUrl: sheetsUrl.trim(),
      paymentLink: paymentLink.trim() || DEFAULT_SETTINGS.paymentLink,
    });
    showToast("Settings saved.");
  };

  const testSheets = async () => {
    setTesting(true);
    const res = await postToGoogleSheets(sheetsUrl, {
      action: "test",
      booking: {
      id: "TEST-" + Date.now().toString(36).toUpperCase(),
      guestName: "Test Guest",
      phone: "000-000-0000",
      apartment: "Darien Max",
      checkin: todayISO(),
      checkout: addDaysISO(todayISO(), 1),
      nights: 1,
      guests: 1,
      status: "Confirmed",
      notes: "Connection test from the MA Luxury booking system.",
      createdAt: new Date().toISOString(),
      }
    });
    setTesting(false);
    if (res.skipped) showToast("Paste a real Web App URL first — that one still looks like a placeholder.", "warn");
    else if (res.ok) showToast("Test sent. Check your Google Sheet for a new row.");
    else showToast("Couldn't reach that URL — confirm it's deployed and public.", "warn");
  };

  return (
    <div className="ma-panel">
      <button className="ma-settings-toggle" onClick={() => setOpen((o) => !o)}>
        <span className="ma-panel-title">Settings</span>
        <span className="ma-muted">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="ma-settings-body">
          <div className="ma-settings-section">
            <h4>Admin PIN</h4>
            <p className="ma-muted">Screen-lock for the Admin Dashboard tab only — not full authentication.</p>
            <div className="ma-settings-row">
              <input type="password" placeholder="Current PIN" value={pinCurrent} onChange={(e) => setPinCurrent(e.target.value)} />
              <input type="password" placeholder="New PIN" value={pinNext} onChange={(e) => setPinNext(e.target.value)} />
              <button className="ma-btn ma-btn-ghost" onClick={changePin}>Update PIN</button>
            </div>
          </div>

          <div className="ma-settings-section">
            <h4><Link2 size={14} /> Google Sheets sync</h4>
            <p className="ma-muted">
              Paste a Google Apps Script Web App URL here and every new booking is pushed to your own
              Google Sheet as a row. Left blank or as the placeholder, nothing is sent.
            </p>
            <div className="ma-settings-row">
              <input
                placeholder="https://script.google.com/macros/s/PASTE_YOUR_DEPLOYMENT_ID/exec"
                value={sheetsUrl}
                onChange={(e) => setSheetsUrl(e.target.value)}
              />
              <button className="ma-btn ma-btn-ghost" onClick={testSheets} disabled={testing}>
                {testing ? "Testing…" : "Test connection"}
              </button>
            </div>
            <details className="ma-settings-details">
              <summary>How to get this URL</summary>
              <ol>
                <li>In your Google Sheet: Extensions → Apps Script.</li>
                <li>Copy the complete code from the included <strong>google-apps-script.gs</strong> file into Apps Script and save.</li>
                <li>Deploy → New deployment → Web app.</li>
                <li>Set "Execute as" to Me, and "Who has access" to Anyone.</li>
                <li>Copy the resulting web app URL into the field above and save.</li>
              </ol>
            </details>
          </div>

          <div className="ma-settings-section">
            <h4><QrCode size={14} /> Payment QR code</h4>
            <p className="ma-muted">
              Shown to guests on their booking confirmation screen. Replace the placeholder with your
              real payment link — a Paystack or Flutterwave page, a bank transfer page, whatever you use.
            </p>
            <div className="ma-settings-row">
              <input
                placeholder="https://your-payment-link.com/..."
                value={paymentLink}
                onChange={(e) => setPaymentLink(e.target.value)}
              />
            </div>
            <div className="ma-qr-preview">
              <img
                alt="Payment QR preview"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(paymentLink || DEFAULT_SETTINGS.paymentLink)}`}
              />
              {(!paymentLink || paymentLink.includes("REPLACE_ME")) && (
                <span className="ma-pay-warning"><AlertTriangle size={12} /> Still a placeholder</span>
              )}
            </div>
          </div>

          <div className="ma-actions">
            <button className="ma-btn ma-btn-primary" onClick={saveIntegrations}>Save settings</button>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, detail }) {
  return (
    <div className="ma-stat-tile">
      <div className="ma-stat-value">{value}</div>
      <div className="ma-stat-label">{label}</div>
      {detail && <div className="ma-stat-detail">{detail}</div>}
    </div>
  );
}

function EditModal({ booking, onClose, onSave }) {
  const [form, setForm] = useState({ ...booking });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <div className="ma-modal-backdrop" onClick={onClose}>
      <div className="ma-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ma-modal-header">
          <h3>Edit booking · <span className="ma-mono">{booking.id}</span></h3>
          <button className="ma-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="ma-form-grid">
          <label className="ma-field"><span>Guest name</span><input value={form.guestName} onChange={(e) => set("guestName", e.target.value)} /></label>
          <label className="ma-field"><span>Phone</span><input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></label>
          <label className="ma-field">
            <span>Apartment</span>
            <select value={form.apartment} onChange={(e) => set("apartment", e.target.value)}>
              {APARTMENTS.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
            </select>
          </label>
          <label className="ma-field">
            <span>Status</span>
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="ma-field"><span>Check-in</span><input type="date" value={form.checkin} onChange={(e) => set("checkin", e.target.value)} /></label>
          <label className="ma-field"><span>Check-out</span><input type="date" value={form.checkout} onChange={(e) => set("checkout", e.target.value)} /></label>
          <label className="ma-field"><span>Guests</span><input type="number" min={1} value={form.guests} onChange={(e) => set("guests", e.target.value)} /></label>
          <label className="ma-field ma-field-wide"><span>Notes</span><textarea rows={2} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></label>
        </div>
        <div className="ma-actions">
          <button className="ma-btn ma-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ma-btn ma-btn-primary" onClick={() => onSave(form)}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- styles -------------------------------- */

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=IBM+Plex+Sans:wght@400;500;600&display=swap');

      .ma-app {
        --ink: #14171C; --ink-soft: #1F242B; --paper: #FAF8F5; --paper-dim: #F0ECE4;
        --brass: #A87C4F; --brass-deep: #8A6239; --forest: #24402F; --forest-soft: #33543F;
        --rust: #9C3B2C; --slate: #5B6570; --line: #E2DDD1;
        font-family: 'IBM Plex Sans', sans-serif; background: var(--paper); color: var(--ink);
        min-height: 100vh; font-size: 14px; line-height: 1.5;
      }
      .ma-app * { box-sizing: border-box; }
      .ma-app h2, .ma-app h3 { font-family: 'Fraunces', serif; font-weight: 500; margin: 0; }
      .ma-muted { color: var(--slate); }
      .ma-mono { font-variant-numeric: tabular-nums; letter-spacing: 0.2px; }

      .ma-topbar {
        display: flex; align-items: center; gap: 28px; background: var(--ink); color: var(--paper);
        padding: 14px 24px; flex-wrap: wrap;
      }
      .ma-brand { display: flex; align-items: center; gap: 10px; }
      .ma-brand-mark {
        width: 34px; height: 34px; border: 1px solid var(--brass); color: var(--brass);
        display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif;
        font-size: 14px; letter-spacing: 0.5px;
      }
      .ma-brand-name { font-family: 'Fraunces', serif; font-size: 17px; letter-spacing: 0.2px; }
      .ma-brand-sub { font-size: 11.5px; color: #9aa2ab; margin-top: 1px; }
      .ma-nav { display: flex; gap: 4px; flex: 1; flex-wrap: wrap; }
      .ma-nav-item {
        display: flex; align-items: center; gap: 6px; background: none; border: none; color: #b7bcc2;
        padding: 8px 12px; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent;
        font-family: inherit; transition: color .15s ease, border-color .15s ease;
      }
      .ma-nav-item:hover { color: var(--paper); }
      .ma-nav-item.active { color: var(--paper); border-bottom-color: var(--brass); }
      .ma-sync-btn {
        display: flex; align-items: center; gap: 6px; background: none; border: 1px solid #3a4048;
        color: #9aa2ab; font-size: 11.5px; padding: 6px 10px; cursor: pointer; font-family: inherit;
      }
      .ma-sync-btn:hover { color: var(--paper); border-color: var(--brass); }

      .ma-main { max-width: 1180px; margin: 0 auto; padding: 28px 24px 64px; }
      .ma-loading { padding: 80px 0; text-align: center; color: var(--slate); }

      .ma-panel { background: #fff; border: 1px solid var(--line); padding: 26px 28px; margin-bottom: 22px; }
      .ma-panel-title { font-size: 20px; }
      .ma-panel-sub { margin: 6px 0 20px; font-size: 13px; }
      .ma-panel-header-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px; }
      .ma-panel-actions { display: flex; gap: 8px; flex-wrap: wrap; }

      .ma-form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px 20px; }
      .ma-field { display: flex; flex-direction: column; gap: 6px; font-size: 12.5px; color: var(--slate); }
      .ma-field-wide { grid-column: 1 / -1; }
      .ma-field input, .ma-field select, .ma-field textarea {
        font-family: inherit; font-size: 14px; color: var(--ink); border: 1px solid var(--line);
        background: var(--paper); padding: 9px 10px; outline: none;
      }
      .ma-field input:focus, .ma-field select:focus, .ma-field textarea:focus { border-color: var(--brass); }
      .ma-field input[readonly] { color: var(--slate); background: var(--paper-dim); }

      .ma-actions { margin-top: 18px; display: flex; gap: 10px; }
      .ma-btn {
        display: inline-flex; align-items: center; gap: 7px; border: none; font-family: inherit;
        font-size: 13.5px; padding: 10px 18px; cursor: pointer; transition: opacity .15s ease;
      }
      .ma-btn:disabled { opacity: .55; cursor: default; }
      .ma-btn-primary { background: var(--ink); color: var(--paper); }
      .ma-btn-primary:hover:not(:disabled) { background: var(--brass-deep); }
      .ma-btn-ghost { background: none; border: 1px solid var(--line); color: var(--ink); }
      .ma-btn-ghost:hover { border-color: var(--brass); }

      .ma-inline-error { display: flex; align-items: center; gap: 6px; color: var(--rust); font-size: 13px; margin-top: 12px; }

      .ma-avail { margin-top: 20px; padding: 16px 18px; border-left: 3px solid; font-size: 14px; }
      .ma-avail-ok { border-color: var(--forest); background: #F2F6F3; color: var(--forest); }
      .ma-avail-bad { border-color: var(--rust); background: #FAF1EF; color: var(--rust); }
      .ma-avail p { margin: 6px 0 0; color: var(--ink); }
      .ma-conflict-list { margin: 10px 0 0; padding-left: 18px; color: var(--ink); font-size: 13px; }

      .ma-confirm { text-align: center; padding: 40px 28px; }
      .ma-confirm-icon { color: var(--forest); margin-bottom: 8px; }
      .ma-confirm h2 { font-size: 24px; margin-bottom: 4px; }
      .ma-confirm-grid {
        display: grid; grid-template-columns: max-content max-content; gap: 8px 20px; justify-content: center;
        margin: 26px auto; text-align: left; max-width: 420px;
      }
      .ma-confirm-grid dt { color: var(--slate); font-size: 12.5px; }
      .ma-confirm-grid dd { margin: 0; font-weight: 500; }
      .ma-confirm-actions { display: flex; gap: 10px; justify-content: center; }

      .ma-search-row { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
      .ma-search-btn { height: 38px; margin-top: 20px; }
      .ma-search-results { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 26px; }
      .ma-result-heading { font-size: 15px; margin-bottom: 10px; }
      .ma-good { color: var(--forest); }
      .ma-bad { color: var(--rust); }
      .ma-warn2 { color: var(--brass-deep); }
      .ma-result-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      .ma-result-list li { display: flex; align-items: center; gap: 8px; font-size: 13.5px; }
      .ma-result-detail { display: flex; gap: 8px; margin-left: 22px; font-size: 11.5px; color: var(--slate); }
      .ma-tag { font-size: 10.5px; color: var(--slate); border: 1px solid var(--line); padding: 1px 6px; margin-left: 4px; }

      .ma-cal-panel { overflow: hidden; }
      .ma-cal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
      .ma-cal-nav { display: flex; align-items: center; gap: 10px; }
      .ma-cal-month { font-size: 14px; min-width: 150px; text-align: center; font-family: 'Fraunces', serif; }
      .ma-icon-btn { background: none; border: 1px solid var(--line); color: var(--ink); padding: 5px 7px; cursor: pointer; display: inline-flex; }
      .ma-icon-btn:hover { border-color: var(--brass); }
      .ma-cal-scroll { overflow-x: auto; border: 1px solid var(--line); }
      .ma-cal-table { border-collapse: collapse; width: 100%; font-size: 12px; }
      .ma-cal-table th, .ma-cal-table td { border: 1px solid var(--line); padding: 0; text-align: center; }
      .ma-cal-table th { background: var(--paper-dim); font-weight: 500; padding: 6px 2px; min-width: 30px; }
      .ma-cal-dow { font-size: 9px; color: var(--slate); }
      .ma-cal-today { outline: 2px solid var(--brass); outline-offset: -2px; }
      .ma-cal-apt-head { text-align: left !important; padding: 6px 12px !important; min-width: 160px; }
      .ma-cal-apt-name { text-align: left !important; padding: 7px 12px !important; font-size: 12.5px; white-space: nowrap; }
      .ma-cal-cat-row td { text-align: left !important; background: var(--ink); color: var(--paper); font-size: 11px; padding: 5px 12px !important; letter-spacing: 0.3px; }
      .ma-cell { height: 30px; width: 30px; }
      .ma-cell-available { background: #fff; }
      .ma-cell-occupied { background: var(--forest); }
      .ma-cell-checkin { background: var(--brass); color: #fff; }
      .ma-cell-checkout { background: var(--slate); color: #fff; }
      .ma-cell-turnover { background: linear-gradient(135deg, var(--brass) 50%, var(--slate) 50%); color: #fff; }
      .ma-cell-maintenance { background: repeating-linear-gradient(45deg, var(--rust), var(--rust) 4px, #7a2e22 4px, #7a2e22 8px); color: #fff; }
      .ma-cell svg { margin: 0 auto; }
      .ma-legend { display: flex; gap: 18px; flex-wrap: wrap; margin-top: 16px; font-size: 12px; color: var(--slate); }
      .ma-legend span { display: flex; align-items: center; gap: 6px; }
      .ma-swatch { width: 12px; height: 12px; display: inline-block; }

      .ma-admin { display: flex; flex-direction: column; }
      .ma-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line); margin-bottom: 22px; }
      .ma-stat-tile { background: #fff; padding: 18px 18px 16px; min-height: 92px; }
      .ma-stat-value { font-family: 'Fraunces', serif; font-size: 26px; }
      .ma-stat-label { font-size: 12px; color: var(--slate); margin-top: 2px; }
      .ma-stat-detail { font-size: 11px; color: var(--slate); margin-top: 6px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .ma-apt-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px 24px; }
      .ma-apt-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--line); font-size: 13.5px; }
      .ma-status-pill { font-size: 11px; border: 1px solid currentColor; padding: 2px 9px; }

      .ma-block-form { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; padding: 14px; background: var(--paper-dim); }
      .ma-block-form input, .ma-block-form select { font-family: inherit; font-size: 13px; padding: 8px 10px; border: 1px solid var(--line); background: #fff; }
      .ma-blocks-list { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }
      .ma-block-chip { display: flex; align-items: center; gap: 6px; font-size: 12px; background: #FAF1EF; color: var(--rust); border: 1px solid var(--rust); padding: 4px 8px; }
      .ma-block-chip button { background: none; border: none; color: var(--rust); cursor: pointer; display: flex; }

      .ma-search-input { width: 100%; font-family: inherit; font-size: 13.5px; padding: 10px 12px; border: 1px solid var(--line); margin-bottom: 14px; background: var(--paper); }
      .ma-table-scroll { overflow-x: auto; }
      .ma-table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .ma-table th, .ma-table td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--line); white-space: nowrap; }
      .ma-table th { color: var(--slate); font-weight: 500; font-size: 11.5px; }
      .ma-row-cancelled { opacity: 0.5; }
      .ma-row-actions { display: flex; gap: 6px; }

      .ma-modal-backdrop { position: fixed; inset: 0; background: rgba(20,23,28,0.55); display: flex; align-items: center; justify-content: center; z-index: 50; padding: 20px; }
      .ma-modal { background: #fff; max-width: 620px; width: 100%; max-height: 88vh; overflow-y: auto; padding: 22px 26px 26px; }
      .ma-modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
      .ma-modal-header h3 { font-size: 17px; }

      .ma-pingate { max-width: 380px; margin: 40px auto; text-align: center; color: var(--ink); }
      .ma-pingate svg { color: var(--brass); margin-bottom: 6px; }
      .ma-pingate h2 { font-size: 20px; margin-bottom: 4px; }
      .ma-pin-row { display: flex; gap: 8px; margin: 18px 0 6px; }
      .ma-pin-row input { flex: 1; font-family: inherit; font-size: 14px; padding: 9px 10px; border: 1px solid var(--line); background: var(--paper); text-align: center; letter-spacing: 3px; }
      .ma-pingate-note { font-size: 11.5px; color: var(--slate); margin-top: 18px; line-height: 1.5; }

      .ma-pay-block { margin: 26px auto 0; padding-top: 22px; border-top: 1px solid var(--line); max-width: 260px; }
      .ma-pay-heading { font-size: 14px; margin-bottom: 12px; }
      .ma-qr { width: 150px; height: 150px; border: 1px solid var(--line); padding: 6px; background: #fff; }
      .ma-pay-link { font-size: 11.5px; word-break: break-all; margin-top: 10px; }
      .ma-pay-warning { display: flex; align-items: center; gap: 5px; justify-content: center; font-size: 11px; color: var(--rust); margin-top: 6px; }

      .ma-settings-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; background: none; border: none; cursor: pointer; padding: 0; font-family: inherit; }
      .ma-settings-body { margin-top: 18px; display: flex; flex-direction: column; gap: 22px; }
      .ma-settings-section h4 { display: flex; align-items: center; gap: 6px; font-family: 'IBM Plex Sans', sans-serif; font-weight: 600; font-size: 13.5px; margin: 0 0 4px; }
      .ma-settings-section p { margin: 4px 0 10px; font-size: 12.5px; }
      .ma-settings-row { display: flex; gap: 8px; flex-wrap: wrap; }
      .ma-settings-row input { flex: 1; min-width: 200px; font-family: inherit; font-size: 13px; padding: 9px 10px; border: 1px solid var(--line); background: var(--paper); }
      .ma-settings-details { font-size: 12.5px; margin-top: 10px; color: var(--ink); }
      .ma-settings-details summary { cursor: pointer; color: var(--brass-deep); }
      .ma-settings-details ol { margin: 8px 0; padding-left: 20px; }
      .ma-code { background: var(--ink); color: #d6e3d9; font-size: 11.5px; padding: 12px 14px; overflow-x: auto; margin: 8px 0; line-height: 1.6; }
      .ma-qr-preview { display: flex; align-items: center; gap: 10px; margin-top: 10px; }
      .ma-qr-preview img { width: 70px; height: 70px; border: 1px solid var(--line); padding: 3px; background: #fff; }

      .ma-toast {
        position: fixed; top: 16px; right: 16px; z-index: 100; padding: 12px 18px; font-size: 13px;
        background: var(--ink); color: #fff; border-left: 3px solid var(--brass); max-width: 320px;
      }
      .ma-toast-warn { border-left-color: var(--rust); }

      @media (max-width: 760px) {
        .ma-form-grid, .ma-search-results, .ma-apt-grid, .ma-stat-grid { grid-template-columns: 1fr; }
        .ma-topbar { gap: 12px; }
        .ma-nav-item span { display: none; }
      }
      @media print {
        .no-print { display: none !important; }
        .ma-app { background: #fff; }
        .ma-main { max-width: none; padding: 0; }
      }
    `}</style>
  );
}
