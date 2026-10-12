import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowLeftCircle,
  ArrowLeftRight,
  ArrowRight,
  ArrowRightCircle,
  BarChart3,
  BedDouble,
  Ban,
  Building2,
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Download,
  Images,
  LayoutDashboard,
  MessageCircle,
  Link2,
  Lock,
  Moon,
  Pencil,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Save,
  Sparkles,
  Sun,
  Upload,
  UploadCloud,
  Trash2,
  Users,
  Wrench,
  X,
  XCircle,
} from "lucide-react";

/* ============================== DATA =================================== */

const APARTMENTS = [
  { name: "Darien Max", category: "3-Bedroom" },
  { name: "Streamwood Max", category: "3-Bedroom" },
  { name: "Westmont Max", category: "3-Bedroom" },
  { name: "Countryside Max", category: "3-Bedroom" },
  { name: "Darien", category: "2-Bedroom" },
  { name: "Streamwood", category: "2-Bedroom" },
  { name: "Westmont", category: "2-Bedroom" },
  { name: "Clarendon Hills Studio", category: "1-Bedroom" },
  { name: "Darien Studio", category: "1-Bedroom" },
  { name: "Streamwood Studio", category: "1-Bedroom" },
  { name: "Westmont Studio", category: "1-Bedroom" },
];

const CATEGORY_ORDER = ["3-Bedroom", "2-Bedroom", "1-Bedroom"];
const CATALOG_KEY = "ma-apartment-catalog-v1";
const GALLERY_DB_NAME = "ma-luxury-gallery-v1";
const GALLERY_STORE_NAME = "images";

// Curated editorial interiors used as the initial gallery. Admin can replace
// any of these with the property's real photography from the Dashboard.
const DEFAULT_IMAGE_POOL = [
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600566753051-3f5f5b0c4a1b?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=85&sat=-10",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=85&sat=-8",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1600&q=85&sat=-6",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85&sat=-12",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85&sat=-8",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=85&sat=-8",
  "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=85&sat=-5",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85&sat=-10",
  "https://images.unsplash.com/photo-1615874694520-474822394e73?auto=format&fit=crop&w=1600&q=85&sat=-8",
  "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1600&q=85&sat=-8",
  "https://images.unsplash.com/photo-1617104678098-de229db51175?auto=format&fit=crop&w=1600&q=85&sat=-8",
  "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?auto=format&fit=crop&w=1600&q=85&sat=-12",
];

const DEFAULT_PRICES = {
  "Darien Max": 130000,
  "Streamwood Max": 13000,
  "Westmont Max": 150000,
  "Countryside Max": 180000,
  "Darien ": 100000,
  "Streamwood ": 100000,
  "Westmont ": 120000,
  "Clarendon Hills Studio": 50000,
  "Darien Studio": 50000,
  "Streamwood Studio": 60000,
  "Westmont Studio": 70000,
};

function createDefaultCatalog() {
  return APARTMENTS.map((apartment, apartmentIndex) => {
    const images = Array.from({ length: 8 }, (_, imageIndex) => DEFAULT_IMAGE_POOL[(apartmentIndex * 2 + imageIndex) % DEFAULT_IMAGE_POOL.length]);
    return {
      ...apartment,
      price: DEFAULT_PRICES[apartment.name] || 150000,
      currency: "NGN",
      description: `${apartment.category} residence with a polished, private-stay feel.`,
      images,
    };
  });
}

const DEFAULT_CATALOG = createDefaultCatalog();

function openGalleryDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("IndexedDB is not supported."));
    const request = window.indexedDB.open(GALLERY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(GALLERY_STORE_NAME)) db.createObjectStore(GALLERY_STORE_NAME, { keyPath: "apartment" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Could not open image storage."));
  });
}

async function loadGalleryOverrides() {
  try {
    const db = await openGalleryDB();
    return await new Promise((resolve, reject) => {
      const request = db.transaction(GALLERY_STORE_NAME, "readonly").objectStore(GALLERY_STORE_NAME).getAll();
      request.onsuccess = () => {
        const map = Object.fromEntries((request.result || []).map((item) => [item.apartment, item.images || []]));
        db.close();
        resolve(map);
      };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  } catch {
    return {};
  }
}

async function saveGalleryOverride(apartment, images) {
  try {
    const db = await openGalleryDB();
    return await new Promise((resolve, reject) => {
      const request = db.transaction(GALLERY_STORE_NAME, "readwrite").objectStore(GALLERY_STORE_NAME).put({ apartment, images });
      request.onsuccess = () => { db.close(); resolve(true); };
      request.onerror = () => { db.close(); reject(request.error); };
    });
  } catch {
    return false;
  }
}

async function loadCatalog() {
  try {
    const remote = await loadCatalogFromSupabase();
    if (remote) {
      window.localStorage.setItem(CATALOG_KEY, JSON.stringify(remote.map(({ images, ...item }) => item)));
      return remote;
    }
    const raw = window.localStorage.getItem(CATALOG_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const base = createDefaultCatalog();
    if (Array.isArray(parsed)) {
      base.forEach((item, index) => {
        const saved = parsed.find((entry) => entry.name === item.name) || parsed[index];
        if (saved) Object.assign(item, saved, { images: item.images });
      });
    }
    const overrides = await loadGalleryOverrides();
    return base.map((item) => ({ ...item, images: overrides[item.name]?.length === 8 ? overrides[item.name] : item.images }));
  } catch {
    return createDefaultCatalog();
  }
}

async function saveCatalog(catalog) {
  try {
    const metadata = catalog.map(({ images, ...item }) => item);
    window.localStorage.setItem(CATALOG_KEY, JSON.stringify(metadata));
    await Promise.all(catalog.map((item) => saveGalleryOverride(item.name, item.images || [])));

    if (supabaseConfigured()) {
      const remoteCatalog = await Promise.all(catalog.map(async (item) => {
        const images = await Promise.all((item.images || []).slice(0, 8).map(async (image, index) => {
          if (String(image).startsWith("data:image/")) return (await uploadGalleryImageToSupabase(item.name, index, image)) || image;
          return image;
        }));
        return { ...item, images };
      }));
      await syncCatalogToSupabase(remoteCatalog);
    }
    return true;
  } catch {
    return false;
  }
}

const formatMoney = (value, currency = "NGN") => {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(number);
};
const STATUSES = ["Confirmed", "Pending", "Checked In", "Checked Out", "Cancelled"];
const BLOCKING_STATUSES = ["Confirmed", "Pending", "Checked In", "Checked Out"];
const BOOKINGS_KEY = "ma-bookings-v1";
const BLOCKS_KEY = "ma-blocks-v1";
const SETTINGS_KEY = "ma-settings-v1";
const THEME_KEY = "ma-theme-v1";
const SYNC_INTERVAL_MS = 20000;

const DEFAULT_SETTINGS = {
  adminPin: "1234",
  sheetsWebhookUrl: "",
  paymentLink: "https://pay.example.com/ma-luxury/REPLACE_ME",
  whatsappNumber: "7015924032",
  paymentQrImage: "",
};

const GOOGLE_SHEETS_API_URL = (import.meta.env.VITE_GOOGLE_SHEETS_API_URL || "").trim();

/*
  SUPABASE CONFIGURATION
  Put your Supabase values in the project root .env file:
    VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
    VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
  Never put a Supabase service_role key in this React app.
*/
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
const SUPABASE_BUCKET = (import.meta.env.VITE_SUPABASE_BUCKET || "ma-luxury-gallery").trim();
const SUPABASE_CATALOG_TABLE = (import.meta.env.VITE_SUPABASE_CATALOG_TABLE || "apartment_catalog").trim();
const SUPABASE_BOOKINGS_TABLE = (import.meta.env.VITE_SUPABASE_BOOKINGS_TABLE || "reservations").trim();
const SUPABASE_BLOCKS_TABLE = (import.meta.env.VITE_SUPABASE_BLOCKS_TABLE || "maintenance_blocks").trim();
const SUPABASE_SETTINGS_TABLE = (import.meta.env.VITE_SUPABASE_SETTINGS_TABLE || "app_settings").trim();
const SUPABASE_AUTH_STORAGE_KEY = "ma-supabase-session-v1";
let supabaseSessionCache = null;

function supabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getStoredSupabaseSession() {
  try {
    const raw = window.localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setSupabaseSession(session) {
  supabaseSessionCache = session || null;
  try {
    if (session) window.localStorage.setItem(SUPABASE_AUTH_STORAGE_KEY, JSON.stringify(session));
    else window.localStorage.removeItem(SUPABASE_AUTH_STORAGE_KEY);
  } catch {}
}

function getSupabaseAccessToken() {
  return supabaseSessionCache?.access_token || getStoredSupabaseSession()?.access_token || null;
}

async function supabaseAuthRequest(path, body) {
  if (!supabaseConfigured()) throw new Error("Supabase is not configured.");
  const response = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error_description || data?.msg || data?.message || "Authentication failed.");
  return data;
}

async function signInAdmin(email, password) {
  const data = await supabaseAuthRequest("token?grant_type=password", { email, password });
  setSupabaseSession(data);
  return data;
}

async function signOutAdmin() {
  const token = getSupabaseAccessToken();
  if (supabaseConfigured() && token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: "POST",
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
      });
    } catch {}
  }
  setSupabaseSession(null);
}

function supabaseHeaders(extra = {}, token = null) {
  const accessToken = token || getSupabaseAccessToken() || SUPABASE_ANON_KEY;
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${accessToken}`,
    ...extra,
  };
}

async function uploadGalleryImageToSupabase(apartmentName, index, dataUrl) {
  if (!supabaseConfigured()) return null;
  try {
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const safeApartment = norm(apartmentName).replace(/[^a-z0-9-]/g, "-");
    const path = `${safeApartment}/gallery-${index + 1}.jpg`;
    const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`, {
      method: "PUT",
      headers: supabaseHeaders({ "Content-Type": "image/jpeg", "x-upsert": "true" }),
      body: blob,
    });
    if (!upload.ok) throw new Error(`Storage upload failed: ${upload.status}`);
    return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
  } catch (error) {
    console.warn("Supabase image upload skipped:", error);
    return null;
  }
}

async function syncCatalogToSupabase(catalog) {
  if (!supabaseConfigured()) return false;
  try {
    const rows = catalog.map(({ images, ...item }) => ({
      apartment_name: item.name,
      category: item.category,
      price: Number(item.price) || 0,
      currency: item.currency || "NGN",
      description: item.description || "",
      images: images || [],
      updated_at: new Date().toISOString(),
    }));
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_CATALOG_TABLE}?on_conflict=apartment_name`, {
      method: "POST",
      headers: supabaseHeaders({ "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(rows),
    });
    if (!response.ok) throw new Error(`Catalog sync failed: ${response.status}`);
    return true;
  } catch (error) {
    console.warn("Supabase catalog sync skipped:", error);
    return false;
  }
}

async function supabaseRequest(table, options = {}) {
  if (!supabaseConfigured()) return null;
  const { method = "GET", query = "", body, prefer } = options;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
      method,
      headers: supabaseHeaders({
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(prefer ? { Prefer: prefer } : {}),
      }),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!response.ok) throw new Error(`${table} request failed: ${response.status}`);
    if (response.status === 204) return true;
    const text = await response.text();
    return text ? JSON.parse(text) : true;
  } catch (error) {
    console.warn(`Supabase ${table} request skipped:`, error);
    return null;
  }
}

async function loadBookingsFromSupabase() {
  const rows = await supabaseRequest(SUPABASE_BOOKINGS_TABLE, { query: "?select=*&order=created_at.desc" });
  return Array.isArray(rows) ? rows.map((row) => ({ ...row, id: row.id, guestName: row.guest_name ?? row.guestName ?? "", legalIdType: row.legal_id_type ?? row.legalIdType ?? "", legalIdNumber: row.legal_id_number ?? row.legalIdNumber ?? "", checkin: row.checkin, checkout: row.checkout, createdAt: row.created_at ?? row.createdAt, guests: Number(row.guests) || 1 })) : null;
}

async function loadBlocksFromSupabase() {
  const rows = await supabaseRequest(SUPABASE_BLOCKS_TABLE, { query: "?select=*&order=start.asc" });
  return Array.isArray(rows) ? rows.map((row) => ({ ...row, apartment: row.apartment, start: row.start, end: row.end })) : null;
}

async function loadSettingsFromSupabase() {
  const rows = await supabaseRequest(SUPABASE_SETTINGS_TABLE, { query: "?select=settings&id=eq.1&limit=1" });
  if (!Array.isArray(rows) || !rows[0]) return null;
  return { ...DEFAULT_SETTINGS, ...(rows[0].settings || {}) };
}

function bookingToSupabaseRow(booking) {
  const { guestName, createdAt, legalIdType, legalIdNumber, ...rest } = booking;
  return { ...rest, guest_name: guestName, legal_id_type: legalIdType || null, legal_id_number: legalIdNumber || null, created_at: createdAt || new Date().toISOString() };
}

async function insertBookingToSupabase(booking) {
  if (!supabaseConfigured()) return false;
  const result = await supabaseRequest(SUPABASE_BOOKINGS_TABLE, { method: "POST", body: bookingToSupabaseRow(booking), prefer: "return=minimal" });
  return result !== null;
}

async function syncBookingsToSupabase(bookings) {
  if (!supabaseConfigured()) return false;
  try {
    const remote = await loadBookingsFromSupabase();
    if (Array.isArray(remote)) {
      const wanted = new Set(bookings.map((b) => String(b.id)));
      await Promise.all(remote.filter((b) => !wanted.has(String(b.id))).map((b) => supabaseRequest(SUPABASE_BOOKINGS_TABLE, { method: "DELETE", query: `?id=eq.${encodeURIComponent(b.id)}` })));
    }
    const rows = bookings.map(bookingToSupabaseRow);
    if (!rows.length) return true;
    const result = await supabaseRequest(SUPABASE_BOOKINGS_TABLE, { method: "POST", body: rows, prefer: "resolution=merge-duplicates,return=minimal" });
    return result !== null;
  } catch (error) {
    console.warn("Supabase reservations sync skipped:", error);
    return false;
  }
}

async function syncBlocksToSupabase(blocks) {
  if (!supabaseConfigured()) return false;
  try {
    const remote = await loadBlocksFromSupabase();
    if (Array.isArray(remote)) {
      const wanted = new Set(blocks.map((b) => String(b.id)));
      await Promise.all(remote.filter((b) => b.id && !wanted.has(String(b.id))).map((b) => supabaseRequest(SUPABASE_BLOCKS_TABLE, { method: "DELETE", query: `?id=eq.${encodeURIComponent(b.id)}` })));
    }
    if (!blocks.length) return true;
    const result = await supabaseRequest(SUPABASE_BLOCKS_TABLE, { method: "POST", body: blocks, prefer: "resolution=merge-duplicates,return=minimal" });
    return result !== null;
  } catch (error) {
    console.warn("Supabase maintenance sync skipped:", error);
    return false;
  }
}

async function syncSettingsToSupabase(settings) {
  if (!supabaseConfigured()) return false;
  const result = await supabaseRequest(SUPABASE_SETTINGS_TABLE, { method: "POST", body: { id: 1, settings, updated_at: new Date().toISOString() }, prefer: "resolution=merge-duplicates,return=minimal" });
  return result !== null;
}

async function loadCatalogFromSupabase() {
  if (!supabaseConfigured()) return null;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${SUPABASE_CATALOG_TABLE}?select=apartment_name,category,price,currency,description,images&order=apartment_name.asc`, { headers: supabaseHeaders() });
    if (!response.ok) throw new Error(`Catalog fetch failed: ${response.status}`);
    const rows = await response.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    const base = createDefaultCatalog();
    return base.map((item) => {
      const row = rows.find((entry) => entry.apartment_name === item.name);
      return row ? { ...item, category: row.category || item.category, price: Number(row.price) || item.price, currency: row.currency || item.currency, description: row.description || item.description, images: Array.isArray(row.images) && row.images.length === 8 ? row.images : item.images } : item;
    });
  } catch (error) {
    console.warn("Supabase catalog fetch skipped:", error);
    return null;
  }
}

/* ============================== UTILS ================================== */

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => toISO(new Date());
const parseISO = (s) => {
  const [y, m, d] = String(s || "").split("-").map(Number);
  return new Date(y, m - 1, d);
};
const addDaysISO = (iso, n) => {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};
const nightsBetween = (ci, co) =>
  Math.round((parseISO(co) - parseISO(ci)) / 86400000);
const fmtDate = (iso) =>
  parseISO(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
const fmtDateShort = (iso) =>
  parseISO(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
const genId = () =>
  "MA-" +
  Date.now().toString(36).toUpperCase().slice(-6) +
  Math.random().toString(36).slice(2, 4).toUpperCase();
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
    (bl) =>
      bl.apartment === apartment &&
      overlaps(bl.start, bl.end, checkin, checkout)
  );

  return {
    bookingHits,
    blockHits,
    hasConflict: bookingHits.length > 0 || blockHits.length > 0,
  };
}

/* ============================ STORAGE ================================= */

async function loadList(key) {
  try {
    const value = window.localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveList(key, list) {
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

async function loadSettings() {
  try {
    const value = window.localStorage.getItem(SETTINGS_KEY);
    if (!value) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(value) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

async function saveSettings(settings) {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
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
  } catch (error) {
    console.warn("Google Sheets read failed:", error);
    return null;
  }
}

async function postToGoogleSheets(url, payload) {
  const clean = (url || "").trim();
  if (!clean || clean.includes("REPLACE_ME") || clean.includes("PASTE_YOUR")) {
    return { skipped: true };
  }

  try {
    await fetch(clean, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      mode: "no-cors",
    });
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

/* =============================== LOADER =============================== */

function CustomLoader() {
  /*
    ================================================================
    YOUR LOADER PLACEHOLDER
    ---------------------------------------------------------------
    Paste your custom loader JSX inside the return below.
    Keep the outer .ma-custom-loader wrapper if you want the default
    loader sizing/centering, or replace it with your own markup.
    ================================================================
  */
  return (
    <div className="ma-custom-loader" aria-label="Loading MA Luxury Apartments">
      <div className="ma-loader-ring" />
      <div className="ma-loader-brand">MA LUXURY</div>
      <div className="ma-loader-label">Preparing your experience</div>
    </div>
  );
}

/* =============================== APP ================================== */

export default function App() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [catalog, setCatalog] = useState(DEFAULT_CATALOG);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [authSession, setAuthSession] = useState(() => getStoredSupabaseSession());
  const [authChecking, setAuthChecking] = useState(() => supabaseConfigured());
  useEffect(() => {
    if (!supabaseConfigured()) { setAuthChecking(false); return; }
    const stored = getStoredSupabaseSession();
    if (stored?.access_token) { supabaseSessionCache = stored; setAuthSession(stored); setAdminUnlocked(true); }
    setAuthChecking(false);
  }, []);
  useEffect(() => { const exit = async () => { setAdminUnlocked(false); if (supabaseConfigured() && authSession) { await signOutAdmin(); setAuthSession(null); } }; window.addEventListener("ma-exit-admin", exit); return () => window.removeEventListener("ma-exit-admin", exit); }, [authSession]);
  const [tab, setTab] = useState("book");
  const [theme, setTheme] = useState(() => {
    try { return window.localStorage.getItem(THEME_KEY) || "dark"; } catch { return "dark"; }
  });

  // Animated MA Luxury favicon.
  useEffect(() => {
    let favicon = document.querySelector('link[data-ma-favicon="true"]');
    if (!favicon) {
      favicon = document.createElement("link");
      favicon.rel = "icon";
      favicon.dataset.maFavicon = "true";
      document.head.appendChild(favicon);
    }
    favicon.type = "image/svg+xml";
    favicon.href = "/favicon.svg";
  }, []);
  const [lastSync, setLastSync] = useState(null);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = useCallback((msg, kind = "info") => {
    const id = Date.now() + Math.random();
    setToast({ msg, kind, id });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 3800);
  }, []);

  const refreshData = useCallback(async (silent = false) => {
    const localSettings = await loadSettings();
    setSettings(localSettings);

    const supabaseBookings = supabaseConfigured() ? await loadBookingsFromSupabase() : null;
    const supabaseBlocks = supabaseConfigured() ? await loadBlocksFromSupabase() : null;
    const supabaseSettings = supabaseConfigured() ? await loadSettingsFromSupabase() : null;
    const remoteSheets = await fetchGoogleSheetsData(getSheetsApiUrl(localSettings));

    if (Array.isArray(supabaseBookings) && Array.isArray(supabaseBlocks)) {
      setBookings(supabaseBookings);
      setBlocks(supabaseBlocks);
      await saveList(BOOKINGS_KEY, supabaseBookings);
      await saveList(BLOCKS_KEY, supabaseBlocks);
      if (supabaseSettings) {
        setSettings(supabaseSettings);
        await saveSettings(supabaseSettings);
      }
    } else if (remoteSheets) {
      setBookings(remoteSheets.bookings);
      setBlocks(remoteSheets.blocks);
      if (remoteSheets.settings) {
        setSettings((current) => ({ ...current, ...remoteSheets.settings }));
        await saveSettings({ ...localSettings, ...remoteSheets.settings });
      }
      await saveList(BOOKINGS_KEY, remoteSheets.bookings);
      await saveList(BLOCKS_KEY, remoteSheets.blocks);
    } else {
      const [localBookings, localBlocks] = await Promise.all([loadList(BOOKINGS_KEY), loadList(BLOCKS_KEY)]);
      setBookings(localBookings);
      setBlocks(localBlocks);
    }

    setLastSync(new Date());
    if (!silent) setLoading(false);
  }, []);

  useEffect(() => {
    try { window.localStorage.setItem(THEME_KEY, theme); } catch {}
  }, [theme]);

  useEffect(() => {
    if (loading) return undefined;
    let observer;
    const reveal = () => {
      const targets = document.querySelectorAll(".ma-panel, .ma-gallery-card, .ma-kpi-card, .ma-occupancy-stat, .ma-side-card, .ma-page-hero, .ma-dashboard-heading, .ma-occupancy-hero, .ma-gallery-section");
      if (!observer) {
        observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add("ma-scroll-visible"); observer.unobserve(entry.target); }
        }), { threshold: 0.08, rootMargin: "0px 0px -50px 0px" });
      }
      targets.forEach((target) => { if (!target.classList.contains("ma-scroll-visible")) observer.observe(target); });
    };
    reveal();
    const mutation = new MutationObserver(reveal);
    mutation.observe(document.querySelector(".ma-main") || document.body, { childList: true, subtree: true });
    return () => { mutation.disconnect(); observer?.disconnect(); };
  }, [tab, loading]);

  useEffect(() => {
    loadCatalog().then(setCatalog);
  }, []);

  const persistCatalog = useCallback(async (next) => {
    setCatalog(next);
    await saveCatalog(next);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshData(false);
      } catch (error) {
        console.error("Initial MA Luxury data load failed:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    const interval = window.setInterval(() => {
      refreshData(true).catch((error) => console.warn("Background sync skipped:", error));
    }, SYNC_INTERVAL_MS);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [refreshData]);

  const persistBookings = useCallback(
    async (next) => {
      setBookings(next);
      await saveList(BOOKINGS_KEY, next);
      if (supabaseConfigured()) {
        if (adminUnlocked) await syncBookingsToSupabase(next);
        else {
          const currentIds = new Set(bookings.map((item) => String(item.id)));
          const newGuestBooking = next.find((item) => !currentIds.has(String(item.id)));
          if (newGuestBooking) await insertBookingToSupabase(newGuestBooking);
        }
      }
      const url = getSheetsApiUrl(settings);
      if (url) await postToGoogleSheets(url, { action: "replaceBookings", bookings: next });
    },
    [settings, adminUnlocked, bookings]
  );

  const persistBlocks = useCallback(
    async (next) => {
      setBlocks(next);
      await saveList(BLOCKS_KEY, next);
      if (supabaseConfigured()) await syncBlocksToSupabase(next);
      const url = getSheetsApiUrl(settings);
      if (url) await postToGoogleSheets(url, { action: "replaceBlocks", blocks: next });
    },
    [settings]
  );

  const persistSettings = useCallback(async (next) => {
    setSettings(next);
    await saveSettings(next);
    if (supabaseConfigured()) await syncSettingsToSupabase(next);
    const url = getSheetsApiUrl(next);
    if (url) await postToGoogleSheets(url, { action: "saveSettings", settings: next });
  }, []);

  return (
    <div className={`ma-app ma-theme-${theme}`}>
      <Style />

      {toast && <div className={`ma-toast ma-toast-${toast.kind}`}>{toast.msg}</div>}

      <TopBar
        tab={tab}
        setTab={setTab}
        lastSync={lastSync}
        onSync={() => refreshData(false)}
        theme={theme}
        setTheme={setTheme}
        adminUnlocked={adminUnlocked}
        settings={settings}
        authSession={authSession}
        authChecking={authChecking}
        onAdminLogin={(session) => { setSupabaseSession(session); setAuthSession(session); setAdminUnlocked(true); }}
        onAdminLogout={async () => { await signOutAdmin(); setAuthSession(null); setAdminUnlocked(false); setTab("book"); }}
      />

      {(tab === "book" || tab === "search") && <WhatsAppButton />}

      <MobileBottomNav tab={tab} setTab={setTab} adminUnlocked={adminUnlocked} />

      <main className="ma-main">
        {loading ? (
          <div className="ma-loading"><CustomLoader /></div>
        ) : (
          <>
            {tab === "book" && (
              <BookingTab
                catalog={catalog}
                bookings={bookings}
                blocks={blocks}
                settings={settings}
                persistBookings={persistBookings}
                refreshData={refreshData}
                showToast={showToast}
              />
            )}
            {tab === "search" && (
              <SearchTab catalog={catalog} bookings={bookings} blocks={blocks} refreshData={refreshData} />
            )}
            {tab === "calendar" && <CalendarTab catalog={catalog} bookings={bookings} blocks={blocks} />}
            {tab === "admin" &&
              (adminUnlocked ? (
                <AdminTab
                  bookings={bookings}
                  blocks={blocks}
                  settings={settings}
                  persistBookings={persistBookings}
                  persistBlocks={persistBlocks}
                  persistSettings={persistSettings}
                  persistCatalog={persistCatalog}
                  catalog={catalog}
                  showToast={showToast}
                  fileInputRef={fileInputRef}
                  theme={theme}
                />
              ) : (
                supabaseConfigured() ? (
                  <AdminAuthGate
                    loading={authChecking}
                    onLogin={(session) => { setSupabaseSession(session); setAuthSession(session); setAdminUnlocked(true); }}
                  />
                ) : (
                  <PinGate settings={settings} onUnlock={() => setAdminUnlocked(true)} />
                )
              ))}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function AdminAuthGate({ loading, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) { setError("Enter your admin email and password."); return; }
    setBusy(true);
    try {
      const session = await signInAdmin(email.trim(), password);
      onLogin(session);
    } catch (err) {
      setError(err?.message || "Unable to sign in. Check your credentials.");
    } finally { setBusy(false); }
  };

  if (loading) return <section className="ma-page-shell"><div className="ma-panel ma-pingate"><Lock size={22} /><p className="ma-eyebrow">SECURE ACCESS</p><h2>Checking your session.</h2><p className="ma-muted">Preparing the MA Luxury operations space…</p></div></section>;

  return (
    <section className="ma-page-shell">
      <div className="ma-panel ma-pingate ma-auth-gate">
        <div className="ma-auth-icon"><Lock size={20} /></div>
        <p className="ma-eyebrow">PRIVATE OPERATIONS</p>
        <h2>Welcome back.</h2>
        <p className="ma-muted">Sign in with your MA Luxury admin account to manage reservations, apartments, pricing and occupancy.</p>
        <form onSubmit={submit} className="ma-auth-form">
          <label><span>Email</span><input type="email" autoFocus autoComplete="username" placeholder="admin@maluxury.com" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} /></label>
          <label><span>Password</span><input type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} /></label>
          <button className="ma-btn ma-btn-primary" disabled={busy} type="submit">{busy ? "Signing in…" : "Enter operations"}<ArrowRight size={14} /></button>
        </form>
        {error && <p className="ma-error">{error}</p>}
        <p className="ma-pingate-note">Protected by Supabase Authentication. Your admin credentials never live in this React code.</p>
      </div>
    </section>
  );
}

function PinGate({ settings, onUnlock }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event?.preventDefault();
    if (pin.trim() === String(settings?.adminPin || "1234").trim()) {
      setError("");
      onUnlock();
      return;
    }
    setError("That PIN is not correct.");
    setPin("");
  };

  return (
    <section className="ma-page-shell">
      <div className="ma-panel ma-pingate">
        <Lock size={22} />
        <p className="ma-eyebrow">PRIVATE AREA</p>
        <h2>Unlock your operations space.</h2>
        <p className="ma-muted">Enter the admin PIN to access the dashboard and occupancy controls.</p>
        <form onSubmit={submit}>
          <div className="ma-pin-row">
            <input
              autoFocus
              inputMode="numeric"
              type="password"
              value={pin}
              maxLength={12}
              placeholder="••••"
              aria-label="Admin PIN"
              onChange={(event) => { setPin(event.target.value); setError(""); }}
            />
            <button className="ma-btn ma-btn-primary" type="submit"><ArrowRight size={14} /> Enter</button>
          </div>
        </form>
        {error && <p className="ma-error">{error}</p>}
        <p className="ma-pingate-note">Admin access is kept separate from the guest booking experience.</p>
      </div>
    </section>
  );
}

/* ============================= TOP BAR ================================= */

function TopBar({ tab, setTab, lastSync, onSync, theme, setTheme, adminUnlocked, authSession, authChecking, onAdminLogin, onAdminLogout }) {
  const guestItems = [
    { id: "book", label: "Book a Stay", icon: Building2 },
    { id: "search", label: "Availability", icon: Search },
    { id: "admin", label: "Admin", icon: LayoutDashboard },
  ];
  const adminItems = [
    { id: "admin", label: "Dashboard", icon: LayoutDashboard },
    { id: "calendar", label: "Occupancy", icon: CalendarDays },
  ];
  const items = adminUnlocked ? adminItems : guestItems;

  return (
    <header className="ma-topbar no-print">
      <div className="ma-brand">
        <div className="ma-brand-mark"><img src="images/favicon-32x32.png" alt="MA Luxury Apartments" /></div>
        <div><div className="ma-brand-name">MA Luxury Apartments</div><div className="ma-brand-sub">Private residence · booking operations</div></div>
      </div>
      <nav className="ma-nav" aria-label="Primary navigation">
        {items.map((item) => { const Icon = item.icon; return <button key={item.id} className={`ma-nav-item ${tab === item.id ? "active" : ""}`} onClick={() => setTab(item.id)}><Icon size={15} strokeWidth={1.7} /><span>{item.label}</span></button>; })}
      </nav>
      <div className="ma-topbar-actions">
        {adminUnlocked && <button className="ma-back-guest" onClick={() => { setTab("book"); window.dispatchEvent(new Event("ma-exit-admin")); }} title="Back to guest space"><ArrowLeft size={14} /><span>Guest space</span></button>}
        <button className="ma-theme-toggle" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}<span>{theme === "dark" ? "Light" : "Dark"}</span></button>
        {adminUnlocked && <button className="ma-sync-btn" onClick={onSync} title="Refresh live data"><RefreshCw size={13} /><span>{lastSync ? lastSync.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Sync"}</span></button>}
        {adminUnlocked && authSession && <button className="ma-admin-signout" onClick={onAdminLogout} title="Sign out of admin"><Lock size={13} /><span>Sign out</span></button>}
      </div>
    </header>
  );
}

function WhatsAppButton() {
  const href = `https://wa.me/7015924032?text=${encodeURIComponent("Hello MA Luxury Apartments, I would like to make an enquiry about a stay.")}`;
  return <a className="ma-whatsapp-fab" href={href} target="_blank" rel="noreferrer" aria-label="Contact MA Luxury Apartments on WhatsApp"><MessageCircle size={22} /><span>Chat with us</span></a>;
}

function MobileBottomNav({ tab, setTab, adminUnlocked }) {
  const items = adminUnlocked
    ? [
        { id: "admin", label: "Home", icon: LayoutDashboard },
        { id: "calendar", label: "Calendar", icon: CalendarDays },
        { id: "book", label: "Guest", icon: Building2 },
      ]
    : [
        { id: "book", label: "Home", icon: Building2 },
        { id: "search", label: "Explore", icon: Search },
        { id: "admin", label: "Admin", icon: LayoutDashboard },
      ];

  return (
    <nav className="ma-mobile-nav no-print" aria-label="Mobile navigation">
      <div className="ma-mobile-nav-inner">
        {items.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button key={item.id} className={`ma-mobile-nav-item ${active ? "active" : ""}`} onClick={() => setTab(item.id)} aria-current={active ? "page" : undefined}>
              <span className="ma-mobile-nav-icon"><Icon size={18} strokeWidth={active ? 2.1 : 1.7} /></span>
              <span>{item.label}</span>
            </button>
          );
        })}
        <button className="ma-mobile-nav-item ma-mobile-nav-more" onClick={() => {
          if (adminUnlocked) {
            setTab("book");
            window.dispatchEvent(new Event("ma-exit-admin"));
          } else {
            setTab("admin");
          }
        }} aria-label={adminUnlocked ? "Return to guest space" : "Open admin"}>
          <span className="ma-mobile-nav-icon ma-mobile-nav-brand">MA</span>
          <span>{adminUnlocked ? "Guest" : "Menu"}</span>
        </button>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="ma-footer">
      <div className="ma-footer-inner">
        <span>© {new Date().getFullYear()} MA Luxury Apartments</span>
        <a href="https://wa.me/7015924032" target="_blank" rel="noreferrer"><MessageCircle size={13} /> WhatsApp us</a>
        <span className="ma-designed">Designed by ROMEO GRAPHICS</span>
      </div>
    </footer>
  );
}

const BOOKING_STEPS = [
  { key: "guestName", label: "What’s your full name?", hint: "We’ll put this name on your reservation.", type: "text", placeholder: "Type your full name…" },
  { key: "phone", label: "What’s the best number to reach you?", hint: "We’ll use it for arrival updates and booking contact.", type: "tel", placeholder: "+234 801 234 5678" },
  { key: "email", label: "What’s the best email for your reservation?", hint: "We’ll use it for your reservation and stay details.", type: "email", placeholder: "you@example.com" },
  { key: "legalIdType", label: "What legal ID will you provide?", hint: "Select a government-issued identification document.", type: "legal-id-type" },
  { key: "legalIdNumber", label: "Enter your legal ID number.", hint: "Your ID is collected for reservation and identity checks.", type: "text", placeholder: "Enter your ID number…" },
  { key: "apartment", label: "Which apartment would you like?", hint: "Choose the space that feels right for your stay.", type: "select" },
  { key: "checkin", label: "When would you like to check in?", hint: "Choose the first night of your stay.", type: "date" },
  { key: "checkout", label: "And when would you like to check out?", hint: "Your check-out date must be after check-in.", type: "date" },
  { key: "guests", label: "How many people will be staying with you?", hint: "Tell us how many people we should prepare for.", type: "number", placeholder: "1" },
  { key: "notes", label: "Is there anything you’d like us to know?", hint: "Optional. Add an arrival note or anything special for your stay.", type: "textarea", placeholder: "Tell us anything we should know…" },
];

function emptyForm() {
  return {
    guestName: "",
    phone: "",
    email: "",
    legalIdType: "",
    legalIdNumber: "",
    apartment: "",
    checkin: "",
    checkout: "",
    guests: 1,
    status: "Confirmed",
    notes: "",
  };
}


function ApartmentPicker({ catalog, value, onChange }) {
  const [category, setCategory] = useState(() => {
    const selected = catalog.find((item) => item.name === value);
    return selected?.category || "3-Bedroom";
  });

  const categories = ["3-Bedroom", "2-Bedroom", "1-Bedroom"];
  const options = catalog.filter((item) => item.category === category);

  useEffect(() => {
    const selected = catalog.find((item) => item.name === value);
    if (selected && selected.category !== category) setCategory(selected.category);
  }, [value, catalog]);

  return (
    <div className="ma-apartment-picker">
      <div className="ma-picker-tabs" role="tablist" aria-label="Apartment types">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={category === item ? "is-active" : ""}
            onClick={() => setCategory(item)}
          >
            <span>{item.replace("-Bedroom", "")}</span>
            <small>Bedroom{item === "1-Bedroom" ? "" : "s"}</small>
          </button>
        ))}
      </div>
      <div className="ma-apartment-picker-grid">
        {options.map((apartment) => {
          const selected = apartment.name === value;
          const image = apartment.images?.[0] || DEFAULT_IMAGE_POOL[0];
          return (
            <button
              key={apartment.name}
              type="button"
              className={`ma-apartment-option ${selected ? "is-selected" : ""}`}
              onClick={() => onChange(apartment.name)}
              aria-pressed={selected}
            >
              <span className="ma-apartment-option-image">
                <img src={image} alt="" />
                <span className="ma-apartment-option-badge">{selected ? "SELECTED" : apartment.category}</span>
              </span>
              <span className="ma-apartment-option-copy">
                <strong>{apartment.name.replace(" Studio", "")}</strong>
                <span>{apartment.name.includes("Studio") ? "Private studio residence" : apartment.description}</span>
                <b>{formatMoney(apartment.price)} <small>/ night</small></b>
              </span>
              <span className="ma-apartment-option-check"><Check size={15} /></span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CalendarPicker({ value, onChange, minDate, blockedBefore, label }) {
  const initial = value ? new Date(`${value}T12:00:00`) : new Date();
  const [cursor, setCursor] = useState(new Date(initial.getFullYear(), initial.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDay + 1;
    if (day < 1 || day > daysInMonth) return null;
    const date = new Date(year, month, day);
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return { day, iso, date };
  });
  const goMonth = (delta) => setCursor(new Date(year, month + delta, 1));
  const today = todayISO();

  return (
    <div className="ma-calendar-picker">
      <div className="ma-calendar-head">
        <div>
          <span>{label}</span>
          <strong>{value ? fmtDate(value) : "Choose a date"}</strong>
        </div>
        <div className="ma-calendar-nav">
          <button type="button" onClick={() => goMonth(-1)} aria-label="Previous month"><ChevronLeft size={16} /></button>
          <button type="button" onClick={() => goMonth(1)} aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="ma-calendar-month">{cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</div>
      <div className="ma-calendar-weekdays">{["S", "M", "T", "W", "T", "F", "S"].map((day, i) => <span key={`${day}-${i}`}>{day}</span>)}</div>
      <div className="ma-calendar-grid">
        {cells.map((cell, index) => {
          if (!cell) return <span key={`empty-${index}`} className="ma-calendar-empty" />;
          const disabled = cell.iso < (minDate || today) || (blockedBefore && cell.iso <= blockedBefore);
          const selected = value === cell.iso;
          const isToday = cell.iso === today;
          return (
            <button
              key={cell.iso}
              type="button"
              disabled={disabled}
              className={`${selected ? "is-selected" : ""} ${isToday ? "is-today" : ""}`}
              onClick={() => onChange(cell.iso)}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
      <div className="ma-calendar-foot"><span><i /> Available</span><span><b /> Selected</span></div>
    </div>
  );
}

function BookingTab({ catalog, bookings, blocks, settings, persistBookings, refreshData, showToast }) {
  const [form, setForm] = useState(emptyForm());
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [availability, setAvailability] = useState(null);
  const [confirmed, setConfirmed] = useState(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const current = BOOKING_STEPS[step];
  const nights = form.checkin && form.checkout ? nightsBetween(form.checkin, form.checkout) : null;
  const progress = ((step + 1) / BOOKING_STEPS.length) * 100;

  const update = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
    setAvailability(null);
    setError("");
  };



  const validateStep = () => {
    if (current.key === "guestName" && !form.guestName.trim()) return "Tell us your full name.";
    if (current.key === "phone" && !form.phone.trim()) return "Enter a phone number.";
    if (current.key === "email") {
      if (!form.email.trim()) return "Enter your email address.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
    }
    if (current.key === "legalIdType" && !form.legalIdType) return "Choose the type of legal ID you will provide.";
    if (current.key === "legalIdNumber" && !form.legalIdNumber.trim()) return "Enter your legal ID number.";
    if (current.key === "apartment" && !form.apartment) return "Choose an apartment.";
    if (current.key === "checkin") {
      if (!form.checkin) return "Choose a check-in date.";
      if (form.checkin < todayISO()) return "Check-in date cannot be in the past.";
    }
    if (current.key === "checkout") {
      if (!form.checkout) return "Choose a check-out date.";
      if (!form.checkin || form.checkout <= form.checkin) return "Check-out must be after check-in.";
    }
    if (current.key === "guests" && (!form.guests || Number(form.guests) < 1)) {
      return "The number of guests must be at least 1.";
    }
    return "";
  };

  const goNext = () => {
    const validation = validateStep();
    if (validation) {
      setError(validation);
      return;
    }
    if (step < BOOKING_STEPS.length - 1) {
      setDirection(1);
      setStep((value) => value + 1);
    }
  };

  const goBack = () => {
    setError("");
    setAvailability(null);
    if (step > 0) {
      setDirection(-1);
      setStep((value) => value - 1);
    }
  };

  useEffect(() => {
    const handleKey = (event) => {
      if (confirmed) return;
      if (event.key === "Escape") goBack();
      if (event.key === "Enter" && current.type !== "textarea") {
        event.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const checkAvailability = async () => {
    const requiredKeys = ["guestName", "phone", "email", "legalIdType", "legalIdNumber", "apartment", "checkin", "checkout", "guests"];
    const missing = requiredKeys.find((key) => {
      if (key === "guests") return !form[key] || Number(form[key]) < 1;
      return !String(form[key] || "").trim();
    });

    if (missing) {
      const missingStep = BOOKING_STEPS.findIndex((item) => item.key === missing);
      if (missingStep >= 0) setStep(missingStep);
      setError("Let’s complete that detail first.");
      return;
    }

    if (form.checkin < todayISO()) {
      setStep(4);
      setError("Check-in date cannot be in the past. Please choose today or a future date.");
      return;
    }

    if (form.checkout <= form.checkin) {
      setStep(5);
      setError("Check-out must be after check-in.");
      return;
    }

    setChecking(true);
    await refreshData(true);
    const fresh = await loadList(BOOKINGS_KEY);
    const freshBlocks = await loadList(BLOCKS_KEY);
    const conflict = findConflicts(
      form.apartment,
      form.checkin,
      form.checkout,
      fresh,
      freshBlocks
    );
    setAvailability({ ok: !conflict.hasConflict, conflict });
    setChecking(false);
  };

  const confirmBooking = async () => {
    if (form.checkin < todayISO()) { setError("Check-in date cannot be in the past. Please choose today or a future date."); setStep(4); return; }
    setChecking(true);
    const fresh = await loadList(BOOKINGS_KEY);
    const freshBlocks = await loadList(BLOCKS_KEY);
    const conflict = findConflicts(
      form.apartment,
      form.checkin,
      form.checkout,
      fresh,
      freshBlocks
    );

    if (conflict.hasConflict) {
      setChecking(false);
      setAvailability({ ok: false, conflict });
      showToast("Those dates are no longer available. Please review the stay.", "warn");
      return;
    }

    const record = {
      id: genId(),
      guestName: form.guestName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      legalIdType: form.legalIdType,
      legalIdNumber: form.legalIdNumber.trim(),
      apartment: form.apartment,
      checkin: form.checkin,
      checkout: form.checkout,
      nights: nightsBetween(form.checkin, form.checkout),
      guests: Number(form.guests),
      status: form.status,
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
    };

    await persistBookings([...fresh, record]);
    setChecking(false);
    setConfirmed(record);
    setAvailability(null);

    if (getSheetsApiUrl(settings)) {
      showToast("Booking saved and synced with Google Sheets.");
    }
  };

  if (confirmed) {
    return (
      <section className="ma-conversation ma-confirmation-screen">
        <div className="ma-confirmation-card">
          <div className="ma-confirmation-icon">
            <CheckCircle2 size={32} strokeWidth={1.5} />
          </div>
          <p className="ma-eyebrow">RESERVATION COMPLETE</p>
          <h1>Your stay is confirmed.</h1>
          <p className="ma-confirmation-copy">
            Everything is confirmed. Here’s your reservation.
          </p>

          <div className="ma-confirmation-details">
            <Detail label="Guest" value={confirmed.guestName} />
            <Detail label="Email" value={confirmed.email} />
            <Detail label="Legal ID" value={`${confirmed.legalIdType} · ••••${String(confirmed.legalIdNumber || "").slice(-4)}`} />
            <Detail label="Apartment" value={confirmed.apartment} />
            <Detail label="Check-in" value={fmtDate(confirmed.checkin)} />
            <Detail label="Check-out" value={fmtDate(confirmed.checkout)} />
            <Detail label="Nights" value={confirmed.nights} />
            <Detail label="Guests" value={confirmed.guests} />
            <Detail label="Booking ID" value={confirmed.id} mono />
          </div>

          {settings.paymentLink && (
            <div className="ma-pay-block">
              <div>
                <p className="ma-eyebrow">PAYMENT</p>
                <h3>Scan to pay</h3>
                <p className="ma-muted">Use the configured payment link for this reservation.</p>
              </div>
              {settings.paymentQrImage ? <img className="ma-qr" alt="Payment QR code" src={settings.paymentQrImage} /> : <div className="ma-qr-missing"><QrCode size={30} /><span>Payment QR not configured yet.</span></div>}
            </div>
          )}

          <div className="ma-confirm-actions no-print">
            <button className="ma-btn ma-btn-ghost" onClick={() => window.print()}>
              <Printer size={15} /> Print
            </button>
            <button
              className="ma-btn ma-btn-primary"
              onClick={() => {
                setConfirmed(null);
                setForm(emptyForm());
                setStep(0);
                setAvailability(null);
              }}
            >
              <Plus size={15} /> New reservation
            </button>
          </div>
        </div>
      </section>
    );
  }

  const renderInput = () => {
    const common = {
      autoFocus: true,
      value: form[current.key],
      onChange: (event) => update(current.key, event.target.value),
      className: "ma-conversation-input",
    };



    if (current.type === "legal-id-type") {
      return (
        <select {...common} className="ma-conversation-input ma-conversation-select">
          <option value="">Choose an ID type…</option>
          <option value="National ID">National ID</option>
          <option value="International Passport">International Passport</option>
          <option value="Driver's License">Driver's License</option>
          <option value="Voter's Card">Voter's Card</option>
          <option value="Other Government-Issued ID">Other Government-Issued ID</option>
        </select>
      );
    }

    if (current.type === "select") {
      return <ApartmentPicker catalog={catalog} value={form.apartment} onChange={(value) => update("apartment", value)} />;
    }

    if (current.type === "date") {
      return (
        <CalendarPicker
          label={current.key === "checkin" ? "CHECK-IN" : "CHECK-OUT"}
          value={form[current.key]}
          minDate={current.key === "checkin" ? todayISO() : addDaysISO(form.checkin || todayISO(), 1)}
          blockedBefore={current.key === "checkout" ? form.checkin : undefined}
          onChange={(value) => update(current.key, value)}
        />
      );
    }

    if (current.type === "textarea") {
      return (
        <textarea
          {...common}
          rows={4}
          placeholder={current.placeholder}
          className="ma-conversation-input ma-conversation-textarea"
        />
      );
    }

    return (
      <input
        {...common}
        type={current.type}
        min={current.type === "number" ? 1 : undefined}
        placeholder={current.placeholder}
        onKeyDown={(event) => {
          if (event.key === "Enter" && current.type !== "textarea") {
            event.preventDefault();
            goNext();
          }
        }}
      />
    );
  };

  return (
    <section className="ma-conversation">
      <div className="ma-conversation-topline">
        <div className="ma-conversation-brand"></div>
        <div className="ma-step-count">
          {String(step + 1).padStart(2, "0")} / {String(BOOKING_STEPS.length).padStart(2, "0")}
        </div>
      </div>

      {step === 0 && (
        <div className="ma-home-hero">
          <div className="ma-home-hero-copy">
            <span className="ma-home-pill"><Sparkles size={13} /> PREMIUM SHORT-LET LIVING</span>
            <h1>Stay somewhere<br /><em>worth remembering.</em></h1>
            <p>Thoughtfully designed private apartments in Ikeja, made for quiet mornings, beautiful nights and effortless stays.</p>
            <div className="ma-home-actions">
              <button className="ma-home-cta" type="button" onClick={() => document.querySelector(".ma-question-card")?.scrollIntoView({ behavior: "smooth", block: "center" })}>Start your booking <ArrowRight size={16} /></button>
              <span className="ma-home-location"><span className="ma-live-dot" /> Ikeja · Lagos</span>
            </div>
          </div>
          <div className="ma-home-hero-visual">
            <img src={(catalog.find((item) => item.name === "Darien Max")?.images || DEFAULT_IMAGE_POOL)[0]} alt="MA Luxury apartment" />
            <div className="ma-home-visual-card"><span>MA LUXURY</span><strong>Private. Refined. Yours.</strong><small>11 Asenuga Street · Opebi</small></div>
          </div>
        </div>
      )}

      {step === 0 && (
        <div className="ma-feature-strip">
          {catalog.filter((item) => ["Darien Max", "Westmont", "Darien Studio"].includes(item.name)).map((item) => (
            <button key={item.name} type="button" onClick={() => { update("apartment", item.name); setStep(6); }} className="ma-feature-card">
              <img src={item.images?.[0] || DEFAULT_IMAGE_POOL[0]} alt="" />
              <span><small>{item.category}</small><strong>{item.name.replace(" Studio", "")}</strong><b>{formatMoney(item.price)} <i>/ night</i></b></span>
              <ArrowRight size={15} />
            </button>
          ))}
        </div>
      )}

      <div className="ma-conversation-main">
        <div className="ma-conversation-intro">
          <p className="ma-eyebrow ma-hero-kicker">GUEST RESERVATION</p>
          <h1 aria-label="Let’s make your stay feel effortless.">
            <span className="ma-hero-line">Let’s make your stay</span>
            <span className="ma-hero-line ma-hero-accent"><em>feel effortless.</em></span>
          </h1>
        </div>

        <div
          key={current.key}
          className={`ma-question-card ${direction > 0 ? "ma-enter-forward" : "ma-enter-back"}`}
        >
          <div className="ma-question-meta">
            <span>{String(step + 1).padStart(2, "0")}</span>
            <span>{current.hint}</span>
          </div>
          <h2>{current.label}</h2>
          {current.key === "apartment" && form.apartment && <div className="ma-selected-apartment-note"><Check size={13} /> {form.apartment} selected</div>}
          <div className="ma-answer-wrap">
            {renderInput()}
            <button className="ma-next-circle" onClick={goNext} aria-label="Continue">
              <ArrowRight size={20} />
            </button>
          </div>
          {error && (
            <div className="ma-conversation-error">
              <AlertTriangle size={14} /> {error}
            </div>
          )}
        </div>

        <div className="ma-conversation-footer">
          <button className="ma-back-link" onClick={goBack} disabled={step === 0}>
            <ArrowLeft size={14} /> Back
          </button>
          <span className="ma-key-hint">Press Enter to continue · Esc to go back</span>
          <span className="ma-nights-preview">
            {nights ? `${nights} night${nights === 1 ? "" : "s"}` : "Stay dates"}
          </span>
        </div>
      </div>

      <div className="ma-progress-track">
        <div className="ma-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {step === BOOKING_STEPS.length - 1 && (
        <div className="ma-review-dock">
          <div>
            <span className="ma-eyebrow">READY TO CHECK</span>
            <strong>{form.apartment || "Choose an apartment"}</strong>
            {form.apartment && <span className="ma-review-price">{formatMoney(catalog.find((a) => a.name === form.apartment)?.price)}/night</span>}
          </div>
          <button className="ma-btn ma-btn-primary" onClick={checkAvailability} disabled={checking}>
            <Search size={15} /> {checking ? "Checking…" : "Check availability"}
          </button>
        </div>
      )}

      {availability && (
        <div className={`ma-availability-overlay ${availability.ok ? "is-ok" : "is-bad"}`}>
          <div className="ma-availability-card">
            {availability.ok ? (
              <>
                <CheckCircle2 size={28} />
                <p className="ma-eyebrow">GOOD NEWS</p>
                <h3>Those dates are available.</h3>
                <p>
                  {form.apartment} is open from {fmtDate(form.checkin)} to {fmtDate(form.checkout)} for {form.guests} {Number(form.guests) === 1 ? "person" : "people"}.
                </p>
                <div className="ma-review-summary">
                  <span>{form.guestName}</span>
                  <span>{form.apartment}</span>
                  <span>{fmtDateShort(form.checkin)} → {fmtDateShort(form.checkout)}</span>
                  <span>{nights} night{nights === 1 ? "" : "s"}</span>
                  <strong>{formatMoney((catalog.find((a) => a.name === form.apartment)?.price || 0) * (nights || 0))} total</strong>
                </div>
                <div className="ma-actions">
                  <button className="ma-btn ma-btn-ghost" onClick={() => setAvailability(null)}>
                    Review
                  </button>
                  <button className="ma-btn ma-btn-primary" onClick={confirmBooking} disabled={checking}>
                    <Check size={15} /> {checking ? "Confirming…" : "Confirm reservation"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <XCircle size={28} />
                <p className="ma-eyebrow">LET’S FIND ANOTHER OPTION</p>
                <h3>Those dates are unavailable.</h3>
                <p>Please choose another apartment or another date range.</p>
                <ul className="ma-conflict-list">
                  {availability.conflict.bookingHits.map((booking) => (
                    <li key={booking.id}>
                      Booked from {fmtDate(booking.checkin)} → {fmtDate(booking.checkout)}
                    </li>
                  ))}
                  {availability.conflict.blockHits.map((block) => (
                    <li key={block.id}>
                      Maintenance {fmtDate(block.start)} → {fmtDate(block.end)}{block.reason ? ` · ${block.reason}` : ""}
                    </li>
                  ))}
                </ul>
                <button className="ma-btn ma-btn-primary" onClick={() => setAvailability(null)}>
                  Change details
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Detail({ label, value, mono = false }) {
  return (
    <div className="ma-detail">
      <span>{label}</span>
      <strong className={mono ? "ma-mono" : ""}>{value}</strong>
    </div>
  );
}

/* ============================= SEARCH ================================== */

function SearchTab({ catalog, refreshData }) {
  const [checkin, setCheckin] = useState(todayISO());
  const [checkout, setCheckout] = useState(addDaysISO(todayISO(), 1));
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (checkin < todayISO()) return;
    if (!checkin || !checkout || checkout <= checkin) return;
    setBusy(true);
    await refreshData(true);
    const fresh = await loadList(BOOKINGS_KEY);
    const freshBlocks = await loadList(BLOCKS_KEY);
    const available = [];
    const unavailable = [];
    APARTMENTS.forEach((apartment) => {
      const conflict = findConflicts(apartment.name, checkin, checkout, fresh, freshBlocks);
      if (conflict.hasConflict) unavailable.push({ ...apartment, conflict });
      else available.push(apartment);
    });
    setResults({ available, unavailable });
    setBusy(false);
  };

  useEffect(() => { run(); }, []);

  return (
    <section className="ma-page-shell ma-availability-page">
      <div className="ma-page-hero">
        <div>
          <p className="ma-eyebrow">AVAILABILITY</p>
          <h1>Find the right apartment for your dates.</h1>
          <p className="ma-muted">Check your selected dates against every apartment, booking and maintenance block before you confirm your stay.</p>
        </div>
        <div className="ma-hero-mark"><Search size={22} /><span>LIVE INVENTORY</span></div>
      </div>

      <section className="ma-panel ma-filter-panel">
        <div className="ma-filter-heading">
          <div><span className="ma-filter-label">YOUR STAY</span><strong>When would you like to stay?</strong></div>
          <span className="ma-date-duration">{checkin && checkout && checkout > checkin ? `${nightsBetween(checkin, checkout)} night${nightsBetween(checkin, checkout) === 1 ? "" : "s"}` : "Choose your dates"}</span>
        </div>
        <div className="ma-search-row ma-availability-filters">
          <Field label="Check-in"><input type="date" min={todayISO()} value={checkin} onChange={(e) => setCheckin(e.target.value)} /></Field>
          <Field label="Check-out"><input type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} /></Field>
          <button className="ma-btn ma-btn-primary ma-search-submit" onClick={run} disabled={busy}>
            <Search size={15} /> {busy ? "Checking…" : "Check availability"}
          </button>
        </div>
        {checkin < todayISO() && <div className="ma-inline-error"><AlertTriangle size={14} /> Check-in date cannot be in the past. Choose today or a future date.</div>}
        {checkout <= checkin && <div className="ma-inline-error"><AlertTriangle size={14} /> Your check-out date must be after check-in.</div>}
      </section>

      {results && (
        <div className="ma-availability-layout">
          <div className="ma-availability-main">
            <div className="ma-result-toolbar">
              <div><span className="ma-eyebrow">MATCHES</span><h2>Available for your stay</h2></div>
              <span className="ma-count-badge">{results.available.length} of {APARTMENTS.length} open</span>
            </div>
            <div className="ma-apartment-cards">
              {results.available.map((apartment) => {
                const item = catalog.find((entry) => entry.name === apartment.name) || apartment;
                return <ApartmentGallery key={item.name} apartment={item} compact availabilityText="Your selected dates are clear." />;
              })}
              {!results.available.length && <div className="ma-empty-state"><CalendarDays size={24} /><strong>Nothing is open for those dates.</strong><span>Try another date range or check the Occupancy calendar.</span></div>}
            </div>
          </div>

          <aside className="ma-availability-side">
            <div className="ma-side-card ma-hover-card">
              <div className="ma-side-card-head"><span>AT A GLANCE</span><Activity size={16} /></div>
              <div className="ma-side-stat"><strong>{results.available.length}</strong><span>Available</span></div>
              <div className="ma-side-stat"><strong>{results.unavailable.length}</strong><span>Unavailable</span></div>
              <div className="ma-side-stat"><strong>{APARTMENTS.length}</strong><span>Total apartments</span></div>
            </div>
            <div className="ma-side-card ma-unavailable-card ma-hover-card">
              <div className="ma-side-card-head"><span>WHY SOME ARE CLOSED</span><Wrench size={15} /></div>
              {results.unavailable.length ? (
                <div className="ma-unavailable-list">
                  {results.unavailable.map((apartment) => (
                    <div key={apartment.name}>
                      <strong>{apartment.name}</strong>
                      <span>{apartment.conflict.blockHits.length ? "Maintenance block" : "Existing reservation"}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="ma-muted">Every apartment is available for your selected dates.</p>}
            </div>
          </aside>
        </div>
      )}

      <section className="ma-gallery-section">
        <div className="ma-gallery-heading">
          <div><p className="ma-eyebrow">THE RESIDENCES</p><h2>See the stay before you book it.</h2><p className="ma-muted">Eight curated views per apartment. Tap any image to enter the full-screen gallery.</p></div>
          <span className="ma-gallery-count"><Images size={15} /> {catalog.length} residences · {catalog.length * 8} views</span>
        </div>
        <div className="ma-gallery-grid">
          {catalog.map((apartment) => <ApartmentGallery key={apartment.name} apartment={apartment} />)}
        </div>
      </section>
    </section>
  );
}

function ResultColumn({ title, tone, items }) {
  return null;
}

/* ============================ CALENDAR ================================= */

function cellStatus(apartmentName, iso, bookings, blocks) {
  const isBlocked = blocks.some(
    (block) =>
      block.apartment === apartmentName &&
      iso >= block.start &&
      iso < block.end
  );
  const isCheckin = bookings.some(
    (booking) =>
      booking.apartment === apartmentName &&
      BLOCKING_STATUSES.includes(booking.status) &&
      booking.checkin === iso
  );
  const isCheckout = bookings.some(
    (booking) =>
      booking.apartment === apartmentName &&
      BLOCKING_STATUSES.includes(booking.status) &&
      booking.checkout === iso
  );
  const isOccupied = bookings.some(
    (booking) =>
      booking.apartment === apartmentName &&
      BLOCKING_STATUSES.includes(booking.status) &&
      iso > booking.checkin &&
      iso < booking.checkout
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
  checkin: <ArrowRightCircle size={12} />,
  checkout: <ArrowLeftCircle size={12} />,
  turnover: <ArrowLeftRight size={12} />,
  maintenance: <Wrench size={11} />,
};

function CalendarTab({ catalog, bookings, blocks }) {
  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedApartment, setSelectedApartment] = useState("All apartments");
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const dates = useMemo(() => Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(view.year, view.month, index + 1);
    return { iso: toISO(date), day: index + 1, dow: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2) };
  }), [view, daysInMonth]);
  const monthLabel = new Date(view.year, view.month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const monthStats = useMemo(() => {
    const occupiedCells = dates.reduce((sum, date) => sum + APARTMENTS.filter((a) => cellStatus(a.name, date.iso, bookings, blocks) === "occupied").length, 0);
    const maintenanceDays = dates.reduce((sum, date) => sum + APARTMENTS.filter((a) => cellStatus(a.name, date.iso, bookings, blocks) === "maintenance").length, 0);
    const possible = dates.length * APARTMENTS.length;
    const arrivals = bookings.filter((b) => BLOCKING_STATUSES.includes(b.status) && b.checkin >= dates[0]?.iso && b.checkin <= dates[dates.length - 1]?.iso).length;
    const departures = bookings.filter((b) => BLOCKING_STATUSES.includes(b.status) && b.checkout >= dates[0]?.iso && b.checkout <= dates[dates.length - 1]?.iso).length;
    return { rate: possible ? Math.round((occupiedCells / possible) * 100) : 0, occupiedCells, maintenanceDays, availableCells: Math.max(0, possible - occupiedCells - maintenanceDays), arrivals, departures };
  }, [dates, bookings, blocks]);

  const apartmentRows = useMemo(() => {
    const source = selectedApartment === "All apartments" ? catalog : catalog.filter((a) => a.name === selectedApartment);
    return source.map((apartment) => {
      const cells = dates.map((date) => cellStatus(apartment.name, date.iso, bookings, blocks));
      const occupied = cells.filter((status) => ["occupied", "checkin", "checkout", "turnover"].includes(status)).length;
      const maintenance = cells.filter((status) => status === "maintenance").length;
      return { apartment, cells, occupied, maintenance };
    });
  }, [selectedApartment, dates, bookings, blocks]);

  const shiftMonth = (delta) => {
    const d = new Date(view.year, view.month + delta, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <section className="ma-page-shell ma-occupancy-page">
      <div className="ma-occupancy-hero">
        <div className="ma-occupancy-hero-copy">
          <p className="ma-eyebrow">OCCUPANCY CONTROL</p>
          <h1>Know what’s happening across every stay.</h1>
          <p className="ma-muted">A visual command center for booked nights, open inventory, arrivals, departures and maintenance.</p>
          <div className="ma-occupancy-hero-meta"><span><i className="ma-live-dot" /> Live portfolio</span><span>{APARTMENTS.length} apartments</span><span>{monthLabel}</span></div>
        </div>
        <div className="ma-occupancy-ring-card ma-hover-card">
          <div className="ma-occupancy-ring" style={{ "--rate": `${monthStats.rate}%` }}><div><strong>{monthStats.rate}%</strong><span>occupied</span></div></div>
          <span className="ma-ring-label">MONTHLY UTILIZATION</span>
        </div>
      </div>

      <div className="ma-occupancy-commandbar">
        <button className="ma-icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month"><ChevronLeft size={17} /></button>
        <div className="ma-occupancy-month"><span>VIEWING</span><strong>{monthLabel}</strong></div>
        <button className="ma-icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month"><ChevronRight size={17} /></button>
        <button className="ma-btn ma-btn-ghost ma-today-button" onClick={() => { const today = new Date(); setView({ year: today.getFullYear(), month: today.getMonth() }); }}>Today</button>
        <div className="ma-occupancy-filter"><label htmlFor="occupancy-apartment">Apartment</label><select id="occupancy-apartment" value={selectedApartment} onChange={(e) => setSelectedApartment(e.target.value)}><option>All apartments</option>{APARTMENTS.map((a) => <option key={a.name}>{a.name}</option>)}</select></div>
      </div>

      <div className="ma-occupancy-stat-grid">
        <div className="ma-occupancy-stat ma-hover-card"><span><i className="ma-stat-dot ma-stat-occupied" /> Occupied nights</span><strong>{monthStats.occupiedCells}</strong><small>Across the month</small></div>
        <div className="ma-occupancy-stat ma-hover-card"><span><i className="ma-stat-dot ma-stat-open" /> Open inventory</span><strong>{monthStats.availableCells}</strong><small>Apartment days available</small></div>
        <div className="ma-occupancy-stat ma-hover-card"><span><i className="ma-stat-dot ma-stat-arrival" /> Arrivals</span><strong>{monthStats.arrivals}</strong><small>Reservations starting</small></div>
        <div className="ma-occupancy-stat ma-hover-card"><span><i className="ma-stat-dot ma-stat-maintenance" /> Maintenance</span><strong>{monthStats.maintenanceDays}</strong><small>Blocked apartment days</small></div>
      </div>

      <section className="ma-panel ma-occupancy-board">
        <div className="ma-panel-header-row"><div><p className="ma-eyebrow">PORTFOLIO MAP</p><h2>Occupancy pulse</h2><p className="ma-muted">Each cell is one apartment day. Hover a cell for its current state.</p></div><div className="ma-occupancy-legend"><Legend color="available" label="Open" /><Legend color="occupied" label="Booked" /><Legend color="checkin" label="Arrival" /><Legend color="checkout" label="Departure" /><Legend color="maintenance" label="Maintenance" /></div></div>
        <div className="ma-occupancy-board-scroll">
          <div className="ma-occupancy-grid" style={{ "--days": daysInMonth }}>
            <div className="ma-occupancy-grid-corner">APARTMENT</div>
            {dates.map((date) => <div key={date.iso} className={`ma-occupancy-day-head ${date.iso === todayISO() ? "is-today" : ""}`}><span>{date.dow}</span><strong>{date.day}</strong></div>)}
            {apartmentRows.map(({ apartment, cells, occupied }) => (
              <React.Fragment key={apartment.name}>
                <div className="ma-occupancy-apartment-label"><div className="ma-occupancy-apartment-icon"><BedDouble size={14} /></div><div><strong>{apartment.name}</strong><span>{apartment.category}</span></div><small>{Math.round((occupied / Math.max(1, dates.length)) * 100)}%</small></div>
                {cells.map((status, index) => {
                  const date = dates[index];
                  const booking = bookings.find((b) => b.apartment === apartment.name && BLOCKING_STATUSES.includes(b.status) && date.iso >= b.checkin && date.iso < b.checkout);
                  const label = status === "occupied" ? "Booked" : status === "maintenance" ? "Maintenance" : status === "checkin" ? "Check-in" : status === "checkout" ? "Check-out" : status === "turnover" ? "Turnover" : "Available";
                  return <div key={`${apartment.name}-${date.iso}`} className={`ma-occupancy-cell ma-cell-${status} ${date.iso === todayISO() ? "is-today" : ""}`}>
                    <span>{STATUS_ICON[status]}</span>
                    <span className="ma-cell-tooltip"><strong>{booking?.guestName || (status === "maintenance" ? "Maintenance" : label)}</strong><small>{fmtDate(date.iso)} · {label}</small></span>
                  </div>;
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
        <div className="ma-occupancy-board-footer"><span><span className="ma-today-line" /> Today: {fmtDate(todayISO())}</span><span>{monthStats.departures} departures this month</span><span>{selectedApartment === "All apartments" ? "Showing all apartments" : `Showing ${selectedApartment}`}</span></div>
      </section>
    </section>
  );
}

function Legend({ color, label }) {
  return <span><i className={`ma-swatch ma-cell-${color}`} /> {label}</span>;
}

/* =============================== ADMIN ================================= */

function AdminTab({ catalog, bookings, blocks, settings, persistBookings, persistBlocks, persistSettings, persistCatalog, showToast, fileInputRef }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState(null);
  const [blockForm, setBlockForm] = useState({ apartment: "", start: "", end: "", reason: "" });
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [importing, setImporting] = useState(false);
  const today = todayISO();

  const stats = useMemo(() => {
    const active = bookings.filter((booking) => BLOCKING_STATUSES.includes(booking.status));
    const todayIn = active.filter((booking) => booking.checkin === today);
    const todayOut = active.filter((booking) => booking.checkout === today);
    const occupied = new Set(APARTMENTS.map((a) => a.name).filter((name) => active.some((booking) => booking.apartment === name && today >= booking.checkin && today < booking.checkout)));
    const blocked = new Set(APARTMENTS.map((a) => a.name).filter((name) => blocks.some((block) => block.apartment === name && today >= block.start && today < block.end)));
    const available = APARTMENTS.map((a) => a.name).filter((name) => !occupied.has(name) && !blocked.has(name));
    const upcoming = active.filter((booking) => booking.checkin >= today).sort((a, b) => a.checkin.localeCompare(b.checkin));
    const pending = bookings.filter((b) => b.status === "Pending");
    const occupancyRate = Math.round((occupied.size / APARTMENTS.length) * 100);
    return { todayIn, todayOut, occupied, blocked, available, upcoming, pending, occupancyRate };
  }, [bookings, blocks, today]);

  const checkoutAlerts = useMemo(() => bookings.filter((booking) => BLOCKING_STATUSES.includes(booking.status) && booking.checkout <= today).sort((a, b) => a.checkout.localeCompare(b.checkout)), [bookings, today]);

  useEffect(() => {
    if (!checkoutAlerts.length) return;
    const overdue = checkoutAlerts.filter((booking) => booking.checkout < today);
    const dueToday = checkoutAlerts.filter((booking) => booking.checkout === today);
    if (overdue.length) showToast(`${overdue.length} stay${overdue.length === 1 ? "" : "s"} has passed its check-out date.`, "warn");
    else if (dueToday.length) showToast(`${dueToday.length} check-out${dueToday.length === 1 ? "" : "s"} due today.`, "warn");
  }, [checkoutAlerts, today, showToast]);

  const filtered = useMemo(() => {
    const sorted = bookings.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    if (!query.trim()) return sorted;
    const q = norm(query);
    return sorted.filter((booking) => [booking.guestName, booking.email, booking.phone, booking.apartment, booking.status, booking.id].some((value) => norm(value).includes(q)));
  }, [bookings, query]);

  const activity = useMemo(() => bookings.slice().sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0, 6), [bookings]);

  const weekBars = useMemo(() => {
    const values = Array.from({ length: 7 }, (_, index) => {
      const d = new Date(); d.setDate(d.getDate() - (6 - index));
      const iso = toISO(d);
      return { label: d.toLocaleDateString("en-US", { weekday: "short" }), count: bookings.filter((b) => String(b.createdAt || "").slice(0, 10) === iso).length };
    });
    const max = Math.max(1, ...values.map((v) => v.count));
    return values.map((v) => ({ ...v, height: Math.max(8, Math.round((v.count / max) * 100)) }));
  }, [bookings]);

  const updateBooking = async (updated) => {
    if (!updated.guestName?.trim() || !updated.phone?.trim()) { showToast("Your booking needs a name and phone number.", "warn"); return false; }
    if (!updated.checkin || !updated.checkout || updated.checkout <= updated.checkin) { showToast("Please check your reservation dates.", "warn"); return false; }
    const conflict = findConflicts(updated.apartment, updated.checkin, updated.checkout, bookings, blocks, updated.id);
    if (BLOCKING_STATUSES.includes(updated.status) && conflict.hasConflict) { showToast("Those dates overlap another reservation or maintenance block.", "warn"); return false; }
    const next = bookings.map((booking) => booking.id === updated.id ? { ...updated, nights: nightsBetween(updated.checkin, updated.checkout) } : booking);
    await persistBookings(next); showToast("Reservation updated."); return true;
  };

  const cancelBooking = async (id) => {
    await persistBookings(bookings.map((booking) => booking.id === id ? { ...booking, status: "Cancelled" } : booking));
    showToast("Reservation cancelled.");
  };

  const deleteBooking = async (id) => {
    const booking = bookings.find((item) => item.id === id);
    if (!booking) return;
    if (!window.confirm(`Delete reservation ${booking.id} for ${booking.guestName || "this guest"}? This cannot be undone.`)) return;
    await persistBookings(bookings.filter((item) => item.id !== id));
    showToast("Reservation deleted.");
  };

  const clearCancelled = async () => {
    const count = bookings.filter((booking) => booking.status === "Cancelled").length;
    if (!count) { showToast("There are no cancelled reservations to clear.", "warn"); return; }
    if (!window.confirm(`Clear ${count} cancelled reservation${count === 1 ? "" : "s"}? This cannot be undone.`)) return;
    await persistBookings(bookings.filter((booking) => booking.status !== "Cancelled"));
    showToast("Cancelled reservations cleared.");
  };

  const addBlock = async () => {
    if (!blockForm.apartment || !blockForm.start || !blockForm.end || blockForm.end <= blockForm.start) { showToast("Choose an apartment and a valid maintenance date range.", "warn"); return; }
    const record = { id: genId(), apartment: blockForm.apartment, start: blockForm.start, end: blockForm.end, reason: blockForm.reason.trim() };
    await persistBlocks([...blocks, record]); setBlockForm({ apartment: "", start: "", end: "", reason: "" }); setShowBlockForm(false); showToast("Maintenance block added.");
  };

  const removeBlock = async (id) => { await persistBlocks(blocks.filter((block) => block.id !== id)); showToast("Maintenance block removed."); };

  const exportExcel = () => {
    const rows = bookings.map((booking) => ({ "Booking ID": booking.id, "Guest Name": booking.guestName, Email: booking.email, "Legal ID Type": booking.legalIdType, "Legal ID": booking.legalIdNumber ? `••••${String(booking.legalIdNumber).slice(-4)}` : "", Phone: booking.phone, Apartment: booking.apartment, "Check-in": booking.checkin, "Check-out": booking.checkout, Nights: booking.nights, Guests: booking.guests, Status: booking.status, Notes: booking.notes, "Created At": booking.createdAt }));
    const worksheet = XLSX.utils.json_to_sheet(rows); const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings"); XLSX.writeFile(workbook, `MA-Luxury-Bookings-${today}.xlsx`);
  };

  const importExcel = async (file) => {
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer(); const workbook = XLSX.read(buffer, { cellDates: true }); const worksheet = workbook.Sheets[workbook.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
      const keyMap = { bookingid: "id", id: "id", guestname: "guestName", guest: "guestName", name: "guestName", email: "email", emailaddress: "email", legalidtype: "legalIdType", legalid: "legalIdNumber", legalidnumber: "legalIdNumber", phone: "phone", phonenumber: "phone", apartment: "apartment", unit: "apartment", checkin: "checkin", checkindate: "checkin", checkout: "checkout", checkoutdate: "checkout", nights: "nights", numberofnights: "nights", guests: "guests", numberofguests: "guests", status: "status", bookingstatus: "status", notes: "notes", createdat: "createdAt", datebookingwascreated: "createdAt" };
      const asISO = (value) => { if (!value) return ""; if (value instanceof Date) return toISO(value); const stringValue = String(value).trim(); const date = new Date(stringValue); return Number.isNaN(date.getTime()) ? stringValue : toISO(date); };
      const existingIds = new Set(bookings.map((booking) => booking.id)); const imported = [];
      rows.forEach((row) => {
        const record = {}; Object.entries(row).forEach(([key, value]) => { const mapped = keyMap[norm(key)]; if (mapped) record[mapped] = value; }); if (!record.guestName && !record.apartment) return;
        const checkin = asISO(record.checkin); const checkout = asISO(record.checkout); const id = record.id && !existingIds.has(String(record.id)) ? String(record.id) : genId(); existingIds.add(id);
        imported.push({ id, guestName: String(record.guestName || "").trim(), email: String(record.email || "").trim(), phone: String(record.phone || "").trim(), apartment: String(record.apartment || "").trim(), checkin, checkout, nights: record.nights ? Number(record.nights) : checkin && checkout ? nightsBetween(checkin, checkout) : 0, guests: record.guests ? Number(record.guests) : 1, status: STATUSES.includes(record.status) ? record.status : "Confirmed", notes: String(record.notes || "").trim(), createdAt: record.createdAt ? asISO(record.createdAt) : new Date().toISOString() });
      });
      await persistBookings([...bookings, ...imported]); showToast(`Imported ${imported.length} reservation${imported.length === 1 ? "" : "s"}.`);
    } catch { showToast("Couldn’t read that file. Check that it is a valid Excel file.", "warn"); } finally { setImporting(false); }
  };

  return (
    <section className="ma-page-shell ma-admin-page">
      <div className="ma-dashboard-heading">
        <div><p className="ma-eyebrow">DASHBOARD</p><h1>Welcome back.</h1><p className="ma-muted">Here’s your live operations picture for {fmtDate(today)}.</p></div>
        <div className="ma-dashboard-actions"><span className="ma-live-indicator"><i /> Live data</span><button className="ma-btn ma-btn-ghost" onClick={() => setShowBlockForm((v) => !v)}><Wrench size={14} /> Maintenance</button></div>
      </div>

      {checkoutAlerts.length > 0 && (
        <section className={`ma-checkout-alert ${checkoutAlerts.some((booking) => booking.checkout < today) ? "is-overdue" : "is-due"}`}>
          <div className="ma-checkout-alert-icon"><AlertTriangle size={19} /></div>
          <div><p className="ma-eyebrow">CHECK-OUT REMINDER</p><h3>{checkoutAlerts.some((booking) => booking.checkout < today) ? "A stay needs your attention." : "Check-outs are due today."}</h3><p>{checkoutAlerts.map((booking) => `${booking.guestName || "Guest"} · ${booking.apartment} · ${booking.checkout < today ? `overdue since ${fmtDateShort(booking.checkout)}` : "due today"}`).join("  •  ")}</p></div>
        </section>
      )}

      <div className="ma-dashboard-grid">
        <div className="ma-kpi-card ma-kpi-featured ma-hover-card"><div className="ma-kpi-icon"><BarChart3 size={18} /></div><span>OCCUPANCY TODAY</span><strong>{stats.occupancyRate}%</strong><small>{stats.occupied.size} of {APARTMENTS.length} apartments occupied</small><div className="ma-kpi-progress"><i style={{ width: `${stats.occupancyRate}%` }} /></div></div>
        <StatTile label="Check-ins today" value={stats.todayIn.length} detail={stats.todayIn.length ? stats.todayIn.map((b) => b.guestName).join(", ") : "No arrivals yet"} icon={ArrowRightCircle} />
        <StatTile label="Check-outs today" value={stats.todayOut.length} detail={stats.todayOut.length ? stats.todayOut.map((b) => b.guestName).join(", ") : "No departures yet"} icon={ArrowLeftCircle} />
        <StatTile label="Available now" value={stats.available.length} detail="Ready for a new reservation" icon={BedDouble} />
        <StatTile label="Pending" value={stats.pending.length} detail="Reservations awaiting attention" icon={Clock3} />
      </div>

      <div className="ma-admin-content-grid">
        <section className="ma-panel ma-chart-panel">
          <div className="ma-panel-header-row"><SectionHeading eyebrow="BOOKING ACTIVITY" title="Recent reservation flow" description="New reservations recorded over the last 7 days." /><Activity size={18} className="ma-panel-symbol" /></div>
          <div className="ma-bars">{weekBars.map((bar) => <div className="ma-bar-col" key={bar.label}><div className="ma-bar-value">{bar.count}</div><div className="ma-bar-track"><i style={{ height: `${bar.height}%` }} /></div><span>{bar.label}</span></div>)}</div>
        </section>

        <section className="ma-panel ma-today-panel">
          <div className="ma-panel-header-row"><SectionHeading eyebrow="TODAY" title="Your day at a glance" /></div>
          <div className="ma-timeline">
            <div><span className="ma-time-dot ma-dot-brass" /><strong>{stats.todayIn.length} arrivals</strong><small>{stats.todayIn.map((b) => b.guestName).join(", ") || "Your calendar is clear"}</small></div>
            <div><span className="ma-time-dot ma-dot-slate" /><strong>{stats.todayOut.length} departures</strong><small>{stats.todayOut.map((b) => b.guestName).join(", ") || "No departures scheduled"}</small></div>
            <div><span className="ma-time-dot ma-dot-rust" /><strong>{stats.blocked.size} maintenance</strong><small>{Array.from(stats.blocked).join(", ") || "No apartments blocked"}</small></div>
          </div>
        </section>
      </div>

      <div className="ma-admin-content-grid ma-admin-content-grid-wide">
        <section className="ma-panel">
          <div className="ma-panel-header-row"><SectionHeading eyebrow="PORTFOLIO" title="Apartment status" description="A live view of every apartment." /><span className="ma-portfolio-count">{APARTMENTS.length} units</span></div>
          <div className="ma-portfolio-grid">
            {APARTMENTS.map((apartment) => { const occupied = stats.occupied.has(apartment.name); const blocked = stats.blocked.has(apartment.name); const label = blocked ? "Maintenance" : occupied ? "Occupied" : "Available"; const tone = blocked ? "bad" : occupied ? "warn2" : "good"; return <div key={apartment.name} className="ma-portfolio-row"><div className="ma-portfolio-icon"><BedDouble size={15} /></div><div className="ma-portfolio-name"><strong>{apartment.name}</strong><span>{apartment.category}</span></div><span className={`ma-status-pill ma-${tone}`}>{label}</span></div>; })}
          </div>
        </section>

        <section className="ma-panel ma-activity-panel">
          <div className="ma-panel-header-row"><SectionHeading eyebrow="RECENT" title="Latest reservations" /></div>
          <div className="ma-recent-list">{activity.length ? activity.map((booking) => <div className="ma-recent-item" key={booking.id}><div className="ma-recent-avatar">{String(booking.guestName || "G").slice(0, 1).toUpperCase()}</div><div><strong>{booking.guestName || "Unnamed guest"}</strong><span>{booking.apartment} · {fmtDateShort(booking.checkin)}</span></div><span className={`ma-status-pill ${booking.status === "Cancelled" ? "ma-bad" : booking.status === "Pending" ? "ma-warn2" : "ma-good"}`}>{booking.status}</span></div>) : <div className="ma-empty-state small"><Activity size={20} /><span>No reservations yet.</span></div>}</div>
        </section>
      </div>

      <PropertyStudio catalog={catalog} persistCatalog={persistCatalog} showToast={showToast} />

      <section className="ma-panel ma-reservations-panel">
        <div className="ma-panel-header-row"><SectionHeading eyebrow="RESERVATIONS" title="Manage bookings" description="Search, edit, cancel, import or export reservations." /><div className="ma-panel-actions"><button className="ma-btn ma-btn-ghost" onClick={exportExcel}><Download size={14} /> Export</button><button className="ma-btn ma-btn-ghost" onClick={() => fileInputRef.current?.click()} disabled={importing}><Upload size={14} /> {importing ? "Importing…" : "Import"}</button><button className="ma-btn ma-btn-ghost" onClick={clearCancelled}><Trash2 size={14} /> Clear cancelled</button><input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(event) => { if (event.target.files?.[0]) importExcel(event.target.files[0]); event.target.value = ""; }} /></div></div>
        {showBlockForm && <div className="ma-block-form"><select value={blockForm.apartment} onChange={(e) => setBlockForm((f) => ({ ...f, apartment: e.target.value }))}><option value="">Apartment…</option>{APARTMENTS.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}</select><input type="date" value={blockForm.start} onChange={(e) => setBlockForm((f) => ({ ...f, start: e.target.value }))} /><input type="date" value={blockForm.end} onChange={(e) => setBlockForm((f) => ({ ...f, end: e.target.value }))} /><input placeholder="Reason (optional)" value={blockForm.reason} onChange={(e) => setBlockForm((f) => ({ ...f, reason: e.target.value }))} /><button className="ma-btn ma-btn-primary" onClick={addBlock}>Add block</button></div>}
        {blocks.length > 0 && <div className="ma-blocks-list">{blocks.map((block) => <div key={block.id} className="ma-block-chip"><Wrench size={12} />{block.apartment}: {fmtDateShort(block.start)}–{fmtDateShort(block.end)}{block.reason ? ` · ${block.reason}` : ""}<button onClick={() => removeBlock(block.id)} aria-label="Remove block"><X size={12} /></button></div>)}</div>}
        <div className="ma-search-box"><Search size={15} /><input placeholder="Search your reservations by name, phone, apartment, status or booking ID…" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <div className="ma-table-scroll"><table className="ma-table"><thead><tr><th>BOOKING</th><th>YOUR GUEST</th><th>EMAIL</th><th>LEGAL ID</th><th>PHONE</th><th>APARTMENT</th><th>CHECK-IN</th><th>CHECK-OUT</th><th>NIGHTS</th><th>PEOPLE</th><th>STATUS</th><th /></tr></thead><tbody>{filtered.map((booking) => <tr key={booking.id} className={booking.status === "Cancelled" ? "ma-row-cancelled" : ""}><td className="ma-mono">{booking.id}</td><td><strong>{booking.guestName}</strong></td><td>{booking.email || "—"}</td><td>{booking.legalIdType ? `${booking.legalIdType} · ••••${String(booking.legalIdNumber || "").slice(-4)}` : "—"}</td><td>{booking.phone}</td><td>{booking.apartment}</td><td>{fmtDateShort(booking.checkin)}</td><td>{fmtDateShort(booking.checkout)}</td><td>{booking.nights}</td><td>{booking.guests}</td><td><span className={`ma-status-pill ${booking.status === "Cancelled" ? "ma-bad" : booking.status === "Pending" ? "ma-warn2" : "ma-good"}`}>{booking.status}</span></td><td className="ma-row-actions"><button className="ma-icon-btn" onClick={() => setEditing(booking)} title="Edit"><Pencil size={13} /></button>{booking.status !== "Cancelled" && <button className="ma-icon-btn" onClick={() => cancelBooking(booking.id)} title="Cancel"><Ban size={13} /></button>}<button className="ma-icon-btn ma-danger" onClick={() => deleteBooking(booking.id)} title="Delete"><Trash2 size={13} /></button></td></tr>)}{!filtered.length && <tr><td colSpan={12} className="ma-empty-cell">No reservations match your search.</td></tr>}</tbody></table></div>
      </section>

      <SettingsPanel settings={settings} persistSettings={persistSettings} showToast={showToast} />
      {editing && <EditModal booking={editing} onClose={() => setEditing(null)} onSave={async (updated) => { const ok = await updateBooking(updated); if (ok) setEditing(null); }} />}
    </section>
  );
}

function ApartmentGallery({ apartment, compact = false, availabilityText = "Available for your selected dates." }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const images = (apartment.images || []).slice(0, 8);
  const safeImages = images.length ? images : DEFAULT_IMAGE_POOL.slice(0, 8);
  const current = safeImages[active] || safeImages[0];
  const move = (delta) => setActive((value) => (value + delta + safeImages.length) % safeImages.length);

  return (
    <article className={`ma-gallery-card ma-hover-card ${compact ? "is-compact" : ""}`}>
      <div className="ma-gallery-bento">
        <button className="ma-gallery-feature" onClick={() => setLightbox(true)} aria-label={`Open ${apartment.name} gallery`}>
          <img src={current} alt={`${apartment.name} interior view ${active + 1}`} />
          <span className="ma-gallery-number">{String(active + 1).padStart(2, "0")} / 08</span>
          <span className="ma-gallery-open"><MaximizeIcon /> Explore</span>
        </button>
        <div className="ma-gallery-side-images">
          {safeImages.slice(1, 4).map((src, index) => (
            <button key={`${src}-${index}`} className={`ma-gallery-mini ${active === index + 1 ? "is-active" : ""}`} onClick={() => setActive(index + 1)}>
              <img src={src} alt={`${apartment.name} view ${index + 2}`} />
              {index === 2 && <span>+{Math.max(0, safeImages.length - 4)} more</span>}
            </button>
          ))}
        </div>
      </div>
      <div className="ma-gallery-info">
        <div>
          <span className="ma-gallery-category">{apartment.category}</span>
          <h3>{apartment.name}</h3>
          <p>{availabilityText}</p>
        </div>
        <div className="ma-gallery-price"><strong>{formatMoney(apartment.price)}</strong><span>/ night</span></div>
      </div>
      <div className="ma-gallery-filmstrip">
        {safeImages.map((src, index) => <button key={`${src}-${index}`} className={active === index ? "is-active" : ""} onClick={() => setActive(index)}><img src={src} alt="" /></button>)}
        <button className="ma-gallery-next" onClick={() => move(1)} aria-label="Next image"><ChevronRight size={14} /></button>
      </div>

      {lightbox && (
        <div className="ma-gallery-lightbox" onClick={() => setLightbox(false)}>
          <div className="ma-lightbox-shell" onClick={(event) => event.stopPropagation()}>
            <div className="ma-lightbox-top"><div><span className="ma-eyebrow">{apartment.category}</span><strong>{apartment.name}</strong></div><button className="ma-icon-btn" onClick={() => setLightbox(false)}><X size={16} /></button></div>
            <div className="ma-lightbox-stage">
              <button className="ma-lightbox-arrow left" onClick={() => move(-1)} aria-label="Previous image"><ChevronLeft size={20} /></button>
              <img src={current} alt={`${apartment.name} gallery view ${active + 1}`} />
              <button className="ma-lightbox-arrow right" onClick={() => move(1)} aria-label="Next image"><ChevronRight size={20} /></button>
              <div className="ma-lightbox-counter">{String(active + 1).padStart(2, "0")} / 08</div>
            </div>
            <div className="ma-lightbox-thumbs">{safeImages.map((src, index) => <button key={`${src}-light-${index}`} className={active === index ? "is-active" : ""} onClick={() => setActive(index)}><img src={src} alt="" /></button>)}</div>
          </div>
        </div>
      )}
    </article>
  );
}

function MaximizeIcon() {
  return <span className="ma-maximize-icon"><span /><span /><span /><span /></span>;
}

async function compressUploadedImage(file) {
  if (!file.type.startsWith("image/")) throw new Error("Only image files are supported.");
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  return await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const max = 1800;
      const scale = Math.min(1, max / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    image.onerror = reject;
    image.src = source;
  });
}

function PropertyStudio({ catalog, persistCatalog, showToast }) {
  const [draft, setDraft] = useState(catalog);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeApartment, setActiveApartment] = useState(catalog[0]?.name || "");
  const [uploading, setUploading] = useState("");

  useEffect(() => setDraft(catalog), [catalog]);

  const active = draft.find((item) => item.name === activeApartment) || draft[0];
  const updateActive = (patch) => setDraft((items) => items.map((item) => item.name === active.name ? { ...item, ...patch } : item));

  const uploadImages = async (files) => {
    if (!active) return;
    setUploading(active.name);
    try {
      const incoming = await Promise.all(Array.from(files).slice(0, 8).map(compressUploadedImage));
      const next = [...(active.images || [])];
      incoming.forEach((image, index) => { if (next.length < 8) next.push(image); else next[index % 8] = image; });
      while (next.length < 8) next.push(DEFAULT_IMAGE_POOL[next.length % DEFAULT_IMAGE_POOL.length]);
      updateActive({ images: next.slice(0, 8) });
      showToast(`${incoming.length} image${incoming.length === 1 ? "" : "s"} staged for ${active.name}.`);
    } catch {
      showToast("Couldn’t process that image. Please choose a valid photo.", "warn");
    } finally { setUploading(""); }
  };

  const replaceImage = async (index, file) => {
    if (!file || !active) return;
    setUploading(`${active.name}-${index}`);
    try {
      const image = await compressUploadedImage(file);
      const next = [...active.images]; next[index] = image; updateActive({ images: next });
    } catch { showToast("That image could not be processed.", "warn"); } finally { setUploading(""); }
  };

  const removeImage = (index) => {
    const next = [...active.images];
    next[index] = DEFAULT_IMAGE_POOL[(index + draft.findIndex((item) => item.name === active.name) * 2) % DEFAULT_IMAGE_POOL.length];
    updateActive({ images: next });
    showToast("Gallery slot restored to its default image.");
  };

  const save = async () => {
    setSaving(true);
    await persistCatalog(draft);
    setSaving(false);
    showToast("Apartment prices and galleries saved.");
  };

  if (!open) return <section className="ma-panel ma-property-studio-collapsed"><div><p className="ma-eyebrow">PROPERTY STUDIO</p><h2>Prices & image galleries</h2><p className="ma-muted">Manage the public-facing rate and all 8 gallery slots for every residence.</p></div><button className="ma-btn ma-btn-primary" onClick={() => setOpen(true)}><Images size={14} /> Open Property Studio</button></section>;

  return (
    <section className="ma-panel ma-property-studio">
      <div className="ma-panel-header-row">
        <div><p className="ma-eyebrow">PROPERTY STUDIO</p><h2>Shape how every residence is presented.</h2><p className="ma-muted">Set the nightly rate, replace photography, and control the eight-image editorial gallery.</p></div>
        <div className="ma-panel-actions"><span className="ma-studio-count">{draft.length} residences · 8 images each</span><button className="ma-btn ma-btn-primary" onClick={save} disabled={saving}><Save size={14} /> {saving ? "Saving…" : "Save property changes"}</button></div>
      </div>

      <div className="ma-studio-layout">
        <aside className="ma-studio-list">
          {draft.map((item) => <button key={item.name} className={`ma-studio-unit ${item.name === active?.name ? "active" : ""}`} onClick={() => setActiveApartment(item.name)}><img src={item.images?.[0]} alt="" /><span><strong>{item.name}</strong><small>{item.category}</small></span><b>{formatMoney(item.price)}</b></button>)}
        </aside>

        {active && <div className="ma-studio-editor">
          <div className="ma-studio-editor-head"><div><span className="ma-eyebrow">EDITING</span><h3>{active.name}</h3><p>{active.category}</p></div><label className="ma-upload-all"><UploadCloud size={15} /> {uploading === active.name ? "Processing…" : "Upload photos"}<input type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files?.length) uploadImages(e.target.files); e.target.value = ""; }} /></label></div>
          <div className="ma-price-editor"><div><span>Nightly rate</span><small>Shown across booking and availability.</small></div><div className="ma-price-input"><span>₦</span><input type="number" min="0" step="5000" value={active.price} onChange={(e) => updateActive({ price: Number(e.target.value) })} /></div></div>
          <div className="ma-studio-gallery-grid">
            {active.images.map((src, index) => <div className="ma-studio-image-slot" key={`${src}-${index}`}><img src={src} alt={`${active.name} slot ${index + 1}`} /><span className="ma-slot-number">0{index + 1}</span><div className="ma-slot-actions"><label title="Replace image"><Pencil size={13} /><input type="file" accept="image/*" hidden onChange={(e) => replaceImage(index, e.target.files?.[0])} /></label><button title="Restore default image" onClick={() => removeImage(index)}><Trash2 size={13} /></button></div>{uploading === `${active.name}-${index}` && <span className="ma-slot-loading">Processing…</span>}</div>)}
          </div>
          <div className="ma-studio-note"><Sparkles size={15} /><span>Tip: use real property photography at the same landscape ratio. The gallery automatically turns the first image into the hero frame and the remaining seven into the filmstrip.</span></div>
        </div>}
      </div>
    </section>
  );
}

function StatTile({ label, value, detail, icon: Icon = Activity }) {
  return <div className="ma-kpi-card ma-hover-card"><div className="ma-kpi-top"><span>{label}</span><Icon size={16} /></div><strong>{value}</strong><small>{detail}</small></div>;
}

function DatabaseIcon() { return <span className="ma-database-icon"><span /><span /><span /></span>; }

function SettingsPanel({ settings, persistSettings, showToast }) {
  const [open, setOpen] = useState(false);
  const [pinCurrent, setPinCurrent] = useState("");
  const [pinNext, setPinNext] = useState("");
  const [sheetsUrl, setSheetsUrl] = useState(settings.sheetsWebhookUrl);
  const [paymentLink, setPaymentLink] = useState(settings.paymentLink);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsappNumber || "7015924032");
  const [paymentQrImage, setPaymentQrImage] = useState(settings.paymentQrImage || "");
  const [testing, setTesting] = useState(false);

  const changePin = async () => {
    if (pinCurrent !== settings.adminPin) {
      showToast("Current PIN is incorrect.", "warn");
      return;
    }
    if (!pinNext.trim()) {
      showToast("Enter a new PIN.", "warn");
      return;
    }
    await persistSettings({ ...settings, adminPin: pinNext.trim() });
    setPinCurrent("");
    setPinNext("");
    showToast("Admin PIN updated.");
  };

  const saveIntegrations = async () => {
    await persistSettings({
      ...settings,
      sheetsWebhookUrl: sheetsUrl.trim(),
      paymentLink: paymentLink.trim() || DEFAULT_SETTINGS.paymentLink,
      whatsappNumber: whatsappNumber.replace(/\D/g, ""),
      paymentQrImage,
    });
    showToast("Settings saved.");
  };

  const testSheets = async () => {
    setTesting(true);
    const result = await postToGoogleSheets(sheetsUrl, {
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
      },
    });
    setTesting(false);

    if (result.skipped) {
      showToast("Paste a real Google Apps Script Web App URL first.", "warn");
    } else if (result.ok) {
      showToast("Test sent. Check your Google Sheet for a new row.");
    } else {
      showToast("Couldn’t reach that URL. Confirm it is deployed and public.", "warn");
    }
  };

  return (
    <section className="ma-panel ma-section-panel">
      <button className="ma-settings-toggle" onClick={() => setOpen((value) => !value)}>
        <span>
          <span className="ma-eyebrow">SYSTEM</span>
          <strong>Settings</strong>
        </span>
        <span className="ma-settings-state">{open ? "Hide" : "Show"}</span>
      </button>

      {open && (
        <div className="ma-settings-body">
          <div className="ma-settings-section">
            <h4><Lock size={14} /> Admin PIN</h4>
            <p className="ma-muted">Screen-lock for the Admin Dashboard tab.</p>
            <div className="ma-settings-row">
              <input type="password" placeholder="Current PIN" value={pinCurrent} onChange={(e) => setPinCurrent(e.target.value)} />
              <input type="password" placeholder="New PIN" value={pinNext} onChange={(e) => setPinNext(e.target.value)} />
              <button className="ma-btn ma-btn-ghost" onClick={changePin}>Update PIN</button>
            </div>
          </div>

          <div className="ma-settings-section ma-supabase-status-section">
            <h4><DatabaseIcon /> Supabase data layer</h4>
            <p className="ma-muted">Apartment catalogue, reservations, maintenance and settings can sync here automatically when your Vite environment variables are configured.</p>
            <div className={`ma-integration-status ${supabaseConfigured() ? "is-live" : "is-off"}`}><span className="ma-status-light" /> {supabaseConfigured() ? "Connected configuration detected" : "Not configured yet"}</div>
          </div>

          <div className="ma-settings-section">
            <h4><Link2 size={14} /> Google Sheets sync</h4>
            <p className="ma-muted">Paste your deployed Google Apps Script Web App URL.</p>
            <div className="ma-settings-row">
              <input placeholder="https://script.google.com/macros/s/.../exec" value={sheetsUrl} onChange={(e) => setSheetsUrl(e.target.value)} />
              <button className="ma-btn ma-btn-ghost" onClick={testSheets} disabled={testing}>
                {testing ? "Testing…" : "Test connection"}
              </button>
            </div>
            <details className="ma-settings-details">
              <summary>How to get this URL</summary>
              <ol>
                <li>Open your Google Sheet and choose Extensions → Apps Script.</li>
                <li>Paste the provided Apps Script and save.</li>
                <li>Deploy → New deployment → Web app.</li>
                <li>Execute as Me, access Anyone.</li>
                <li>Copy the Web App URL into this setting.</li>
              </ol>
            </details>
          </div>

          <div className="ma-settings-section">
            <h4><MessageCircle size={14} /> WhatsApp contact</h4>
            <p className="ma-muted">This number powers the floating WhatsApp button guests see on Book a Stay and Availability. Enter country code, without + or spaces.</p>
            <div className="ma-settings-row">
              <input placeholder="2348012345678" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
            </div>
          </div>

          <div className="ma-settings-section">
            <h4><QrCode size={14} /> Payment QR code</h4>
            <p className="ma-muted">Upload the actual payment QR image used by MA Luxury. No external QR generator is required.</p>
            <div className="ma-settings-row">
              <input placeholder="Optional payment link" value={paymentLink} onChange={(e) => setPaymentLink(e.target.value)} />
              <label className="ma-btn ma-btn-ghost ma-file-button"><Upload size={14} /> {paymentQrImage ? "Replace QR image" : "Upload QR image"}<input type="file" accept="image/*" hidden onChange={async (e) => { const file = e.target.files?.[0]; if (!file) return; try { setPaymentQrImage(await compressUploadedImage(file)); showToast("Payment QR image staged. Save settings to apply it."); } catch { showToast("Couldn’t process that QR image.", "warn"); } e.target.value = ""; }} /></label>
            </div>
            <div className="ma-qr-preview">
              {paymentQrImage ? <img alt="Uploaded payment QR preview" src={paymentQrImage} /> : <div className="ma-qr-missing"><QrCode size={22} /><span>No QR image uploaded</span></div>}
            </div>
          </div>

          <div className="ma-actions">
            <button className="ma-btn ma-btn-primary" onClick={saveIntegrations}>Save settings</button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================ EDIT MODAL =============================== */

function EditModal({ booking, onClose, onSave }) {
  const [form, setForm] = useState({ ...booking });
  const set = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));

  return (
    <div className="ma-modal-backdrop" onClick={onClose}>
      <div className="ma-modal" onClick={(event) => event.stopPropagation()}>
        <div className="ma-modal-header">
          <div>
            <p className="ma-eyebrow">EDIT RESERVATION</p>
            <h3><span className="ma-mono">{booking.id}</span></h3>
          </div>
          <button className="ma-icon-btn" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="ma-form-grid">
          <Field label="Guest name"><input value={form.guestName} onChange={(e) => set("guestName", e.target.value)} /></Field>
          <Field label="Email"><input type="email" value={form.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Phone"><input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Apartment">
            <select value={form.apartment} onChange={(e) => set("apartment", e.target.value)}>
              {APARTMENTS.map((a) => <option key={a.name} value={a.name}>{a.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value)}>
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
          <Field label="Check-in"><input type="date" value={form.checkin} onChange={(e) => set("checkin", e.target.value)} /></Field>
          <Field label="Check-out"><input type="date" value={form.checkout} onChange={(e) => set("checkout", e.target.value)} /></Field>
          <Field label="Guests"><input type="number" min="1" value={form.guests} onChange={(e) => set("guests", e.target.value)} /></Field>
          <Field label="Notes" wide><textarea rows="3" value={form.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
        </div>

        <div className="ma-actions">
          <button className="ma-btn ma-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="ma-btn ma-btn-primary" onClick={() => onSave(form)}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

/* ============================== HELPERS ================================ */

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="ma-section-heading">
      <p className="ma-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {description && <p className="ma-muted">{description}</p>}
    </div>
  );
}

function Field({ label, children, wide = false }) {
  return (
    <label className={`ma-field ${wide ? "ma-field-wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

/* =============================== STYLES ================================ */

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap');

      .ma-app {
        --ink: #111214; --ink-2: #181a1e; --paper: #f5f1e9; --paper-2: #fcfbf8;
        --surface: #ffffff; --surface-soft: #f1ede5; --brass: #c6a36b; --brass-deep: #9c7544;
        --muted: #74736d; --line: #ddd7cc; --forest: #315744; --rust: #9b4034; --slate: #6d747d;
        --shadow: 0 18px 55px rgba(20,19,17,.08); --deep: #101216; --deep-2: #181a1f;
        min-height: 100vh; background: var(--paper); color: var(--ink); font-family: 'DM Sans', sans-serif;
        font-size: 14px; line-height: 1.5; transition: background .25s ease, color .25s ease;
      }
      .ma-theme-dark { --paper: #0d0f12; --paper-2: #15171b; --surface: #181a1f; --surface-soft: #202329; --ink: #f3f0e9; --ink-2: #22252b; --muted: #8e8d88; --line: #30333a; --shadow: 0 24px 80px rgba(0,0,0,.28); }
      .ma-app *, .ma-app *::before, .ma-app *::after { box-sizing: border-box; }
      .ma-app button, .ma-app input, .ma-app select, .ma-app textarea { font: inherit; }
      .ma-app button { cursor: pointer; }
      .ma-app button:disabled { cursor: default; opacity: .52; }
      .ma-app h1, .ma-app h2, .ma-app h3 { font-family: 'Playfair Display', serif; font-weight: 500; margin: 0; }
      /* Admin headings use a clean operational sans-serif stack. */
      .ma-admin-page h1, .ma-admin-page h2, .ma-admin-page h3,
      .ma-admin-page h4, .ma-admin-page h5, .ma-admin-page h6 {
        font-family: Inter, "Helvetica Neue", Helvetica, Arial, sans-serif;
      }
      .ma-muted { color: var(--muted); }
      .ma-mono { font-variant-numeric: tabular-nums; letter-spacing: .02em; }
      .ma-eyebrow { margin: 0; color: var(--brass); font-size: 10px; letter-spacing: .18em; font-weight: 600; text-transform: uppercase; }

      /* Header */
      .ma-topbar { min-height: 74px; display: flex; align-items: center; gap: 28px; padding: 14px 30px; background: var(--ink-2); color: var(--paper); border-bottom: 1px solid #2b2d31; position: sticky; top: 0; z-index: 40; }
      .ma-theme-light .ma-topbar { background: #171717; color: #f7f3eb; }
      .ma-brand { display: flex; align-items: center; gap: 12px; min-width: 260px; }
      .ma-brand-mark { width: 38px; height: 38px; border: 1px solid var(--brass); color: var(--brass); display: grid; place-items: center; font-family: 'Playfair Display', serif; letter-spacing: .06em; }
      .ma-brand-name { font-family: 'Playfair Display', serif; font-size: 16px; }
      .ma-brand-sub { color: #8d9096; font-size: 9.5px; letter-spacing: .09em; text-transform: uppercase; margin-top: 1px; }
      .ma-nav { flex: 1; display: flex; gap: 3px; align-items: center; }
      .ma-nav-item { display: inline-flex; align-items: center; gap: 7px; padding: 11px 13px; border: 0; border-bottom: 1px solid transparent; color: #92959b; background: transparent; transition: .2s ease; white-space: nowrap; }
      .ma-nav-item:hover, .ma-nav-item.active { color: #fff; }
      .ma-nav-item.active { border-bottom-color: var(--brass); }
      .ma-topbar-actions { display: flex; align-items: center; gap: 7px; }
      .ma-theme-toggle, .ma-sync-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 10px; color: #b0b1b4; background: transparent; border: 1px solid #383b41; font-size: 11px; transition: .2s ease; }
      .ma-theme-toggle:hover, .ma-sync-btn:hover { border-color: var(--brass); color: #fff; }
      .ma-main { max-width: 1280px; margin: 0 auto; padding: 30px 26px 72px; }

      /* Loader placeholder */
      .ma-loading { min-height: 70vh; display: grid; place-items: center; }
      .ma-custom-loader { width: 260px; text-align: center; color: var(--muted); }
      .ma-loader-ring { width: 42px; height: 42px; border: 1px solid var(--line); border-top-color: var(--brass); border-radius: 50%; margin: 0 auto 18px; animation: ma-spin 1s linear infinite; }
      .ma-loader-brand { color: var(--ink); font-family: 'Playfair Display', serif; letter-spacing: .18em; font-size: 13px; }
      .ma-loader-label { font-size: 10px; text-transform: uppercase; letter-spacing: .12em; margin-top: 6px; }
      @keyframes ma-spin { to { transform: rotate(360deg); } }

      /* Premium interaction layer */
      .ma-hover-card { position: relative; overflow: hidden; transition: transform .28s cubic-bezier(.22,1,.36,1), border-color .28s ease, box-shadow .28s ease, background .28s ease; }
      .ma-hover-card::after { content: ''; position: absolute; inset: 0; pointer-events: none; opacity: 0; background: linear-gradient(115deg, transparent 20%, rgba(198,163,107,.10) 48%, transparent 72%); transform: translateX(-60%); transition: opacity .25s ease, transform .55s cubic-bezier(.22,1,.36,1); }
      .ma-hover-card:hover { transform: translateY(-5px); border-color: rgba(198,163,107,.55); box-shadow: 0 22px 60px rgba(18,17,15,.14); }
      .ma-hover-card:hover::after { opacity: 1; transform: translateX(60%); }
      .ma-theme-dark .ma-hover-card:hover { box-shadow: 0 24px 70px rgba(0,0,0,.38); }

      /* Scroll reveal */
      .ma-panel, .ma-gallery-card, .ma-kpi-card, .ma-occupancy-stat, .ma-side-card, .ma-page-hero, .ma-dashboard-heading, .ma-occupancy-hero, .ma-gallery-section { opacity: 0; transform: translateY(26px) scale(.992); transition: opacity .72s cubic-bezier(.22,1,.36,1), transform .72s cubic-bezier(.22,1,.36,1), border-color .28s ease, box-shadow .28s ease, background .28s ease; }
      .ma-scroll-visible { opacity: 1 !important; transform: none !important; }
      .ma-gallery-card:nth-child(2n) { transition-delay: .06s; } .ma-gallery-card:nth-child(3n) { transition-delay: .11s; }

      /* Guest contact */
      .ma-whatsapp-fab { position: fixed; right: 24px; bottom: 24px; z-index: 35; display: inline-flex; align-items: center; gap: 9px; padding: 12px 15px 12px 13px; color: #fff; background: #17241d; border: 1px solid rgba(255,255,255,.12); border-radius: 999px; text-decoration: none; box-shadow: 0 18px 45px rgba(0,0,0,.24); transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease; }
      .ma-whatsapp-fab svg { color: #76d69b; } .ma-whatsapp-fab span { font-size: 11px; letter-spacing: .02em; }
      .ma-whatsapp-fab:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 24px 60px rgba(0,0,0,.30); border-color: rgba(118,214,155,.55); }

      /* Admin checkout alert */
      .ma-checkout-alert { display: flex; align-items: flex-start; gap: 14px; margin: -5px 0 20px; padding: 16px 18px; border: 1px solid rgba(198,163,107,.45); border-radius: 15px; background: linear-gradient(115deg, rgba(198,163,107,.10), var(--surface)); box-shadow: var(--shadow); }
      .ma-checkout-alert.is-overdue { border-color: rgba(155,64,52,.5); background: linear-gradient(115deg, rgba(155,64,52,.10), var(--surface)); }
      .ma-checkout-alert-icon { flex: 0 0 38px; width: 38px; height: 38px; display: grid; place-items: center; border-radius: 50%; color: var(--brass-deep); background: rgba(198,163,107,.13); }
      .ma-checkout-alert.is-overdue .ma-checkout-alert-icon { color: var(--rust); background: rgba(155,64,52,.12); }
      .ma-checkout-alert h3 { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 600; margin: 3px 0; }
      .ma-checkout-alert p:last-child { margin: 3px 0 0; color: var(--muted); font-size: 11px; line-height: 1.55; }

      /* Admin navigation mode */
      .ma-topbar:has(.ma-nav-item:nth-child(2).active) .ma-nav { }

      /* Shared page framing */
      .ma-page-shell { animation: ma-page-in .35s ease both; }
      @keyframes ma-page-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      .ma-page-hero, .ma-dashboard-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; margin-bottom: 28px; }
      .ma-page-hero h1, .ma-dashboard-heading h1 { font-size: clamp(36px, 4vw, 52px); line-height: 1; margin-top: 8px; letter-spacing: -.025em; }
      .ma-page-hero p:last-child, .ma-dashboard-heading p:last-child { max-width: 660px; margin: 10px 0 0; font-size: 13px; }
      .ma-hero-mark { min-width: 170px; height: 110px; border: 1px solid var(--line); display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 9px; color: var(--brass); background: var(--surface); }
      .ma-hero-mark span { font-size: 9px; letter-spacing: .18em; }
      .ma-panel { background: var(--surface); border: 1px solid var(--line); border-radius: 16px; padding: 28px; margin-bottom: 20px; box-shadow: var(--shadow); }
      .ma-section-panel { padding: 30px; }
      .ma-section-heading h2 { font-size: 27px; line-height: 1.1; margin-top: 5px; }
      .ma-section-heading > p:last-child { margin: 7px 0 0; font-size: 12.5px; }
      .ma-panel-header-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 18px; flex-wrap: wrap; margin-bottom: 20px; }
      .ma-panel-symbol { color: var(--brass); }
      .ma-panel-actions { display: flex; gap: 7px; flex-wrap: wrap; }
      .ma-btn { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 39px; padding: 9px 15px; border: 1px solid transparent; border-radius: 9px; font-size: 12px; transition: .2s ease; }
      .ma-btn-primary { background: var(--ink); color: var(--paper); }
      .ma-btn-primary:hover:not(:disabled) { background: var(--brass-deep); }
      .ma-btn-ghost { background: transparent; color: var(--ink); border-color: var(--line); }
      .ma-btn-ghost:hover:not(:disabled) { border-color: var(--brass); }
      .ma-actions { display: flex; gap: 9px; align-items: center; }
      .ma-icon-btn { display: inline-grid; place-items: center; width: 32px; height: 32px; padding: 0; background: transparent; border: 1px solid var(--line); color: var(--ink); border-radius: 8px; }
      .ma-icon-btn:hover { border-color: var(--brass); }

      /* Conversation */
      .ma-conversation { min-height: calc(100vh - 102px); margin: -30px -26px -72px; padding: 36px 56px 46px; background: var(--deep); color: #f7f4ef; position: relative; overflow: hidden; display: flex; flex-direction: column; }
      .ma-conversation::before { content: ''; position: absolute; width: 700px; height: 700px; border-radius: 50%; background: radial-gradient(circle, rgba(199,163,107,.09), transparent 65%); top: -300px; right: -160px; pointer-events: none; }
      .ma-theme-light .ma-conversation { --deep: #f5f1e9; color: #151619; }
      .ma-theme-light .ma-conversation::before { background: radial-gradient(circle, rgba(156,117,68,.10), transparent 65%); }
      .ma-conversation-topline { display: flex; justify-content: space-between; align-items: center; position: relative; z-index: 1; }
      .ma-conversation-brand { font-size: 11px; letter-spacing: .17em; color: var(--brass); font-weight: 600; }
      .ma-step-count { color: #8e8d88; font-size: 11px; letter-spacing: .14em; }
      .ma-conversation-main { width: min(920px, 100%); margin: auto; position: relative; z-index: 1; }
      .ma-conversation-intro { text-align: center; margin-bottom: 48px; }
      .ma-conversation-intro h1 { margin-top: 13px; font-size: clamp(42px, 5vw, 68px); line-height: .99; letter-spacing: -.035em; background: linear-gradient(100deg, #6a696b, #fff); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .ma-theme-light .ma-conversation-intro h1 { background: linear-gradient(100deg, #73716e, #17181a); -webkit-background-clip: text; background-clip: text; }
      .ma-conversation-intro h1 em { color: var(--brass); background: none; -webkit-text-fill-color: var(--brass); font-style: italic; }
      .ma-hero-kicker { animation: ma-hero-kicker .7s ease both; }
      .ma-hero-line { display:block; opacity:0; transform:translateY(30px); animation:ma-hero-line .9s cubic-bezier(.22,1,.36,1) both; }
      .ma-hero-line:nth-child(1) { animation-delay:.12s; } .ma-hero-line:nth-child(2) { animation-delay:.25s; }
      @keyframes ma-hero-kicker { from { opacity:0; transform:translateY(8px); letter-spacing:.34em; } to { opacity:1; transform:none; letter-spacing:.18em; } }
      @keyframes ma-hero-line { 0% { opacity:0; transform:translateY(30px); filter:blur(8px); } 70% { opacity:1; filter:blur(0); } 100% { opacity:1; transform:none; filter:blur(0); } }
      .ma-legal-id-note { max-width:520px; margin:10px auto 0; text-align:center; font-size:11px; line-height:1.6; color:#7f8186; }
      @keyframes ma-favicon-pulse { 0%,100%{filter:drop-shadow(0 0 0 rgba(199,163,107,0));} 50%{filter:drop-shadow(0 0 5px rgba(199,163,107,.75));} }
      .ma-question-card { animation-duration: .36s; animation-timing-function: cubic-bezier(.22,1,.36,1); }
      .ma-enter-forward { animation-name: ma-slide-forward; } .ma-enter-back { animation-name: ma-slide-back; }
      @keyframes ma-slide-forward { from { opacity: 0; transform: translateY(18px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes ma-slide-back { from { opacity: 0; transform: translateY(-18px) scale(.985); } to { opacity: 1; transform: translateY(0) scale(1); } }
      .ma-question-meta { display: flex; justify-content: space-between; align-items: center; color: #777a80; font-size: 11px; margin-bottom: 12px; }
      .ma-question-meta span:first-child { color: var(--brass); letter-spacing: .12em; }
      .ma-question-card h2 { font-family: 'DM Sans', sans-serif; font-weight: 400; text-align: center; color: #c7c3bb; font-size: clamp(20px, 2vw, 24px); margin-bottom: 18px; }
      .ma-theme-light .ma-question-card h2 { color: #4e4d49; }
      .ma-answer-wrap { position: relative; }
      .ma-conversation-input { width: 100%; height: 76px; padding: 0 78px 0 28px; color: #f6f3ee; background: #171a20; border: 1px solid #2c3038; border-radius: 18px; outline: none; font-size: 19px; text-align: center; transition: .2s ease; }
      .ma-theme-light .ma-conversation-input { color: #17181b; background: #fff; border-color: #d5cec1; }
      .ma-conversation-input::placeholder { color: #6d7076; } .ma-theme-light .ma-conversation-input::placeholder { color: #98948c; }
      .ma-conversation-input:focus { border-color: rgba(199,163,107,.72); box-shadow: 0 0 0 4px rgba(199,163,107,.08); }
      .ma-conversation-select { appearance: none; text-align: center; } .ma-conversation-textarea { height: 130px; padding: 20px 70px 20px 24px; resize: vertical; text-align: left; }
      .ma-next-circle { position: absolute; right: 15px; top: 15px; width: 46px; height: 46px; border: 1px solid #383c44; border-radius: 50%; display: grid; place-items: center; color: var(--brass); background: #20232a; transition: .2s ease; }
      .ma-theme-light .ma-next-circle { background: #f0eadf; border-color: #d6cdbc; } .ma-next-circle:hover { transform: translateX(2px); border-color: var(--brass); }
      .ma-conversation-error { margin-top: 10px; color: #d98d80; display: flex; justify-content: center; gap: 6px; font-size: 12px; }
      .ma-conversation-footer { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin-top: 20px; color: #777a80; font-size: 11px; }
      .ma-back-link { display: inline-flex; align-items: center; gap: 5px; justify-self: start; border: 0; background: transparent; color: #9b9da2; padding: 4px 0; }
      .ma-theme-light .ma-back-link { color: #6e6c67; } .ma-back-link:not(:disabled):hover { color: #fff; }
      .ma-theme-light .ma-back-link:not(:disabled):hover { color: #111; }
      .ma-key-hint { text-align: center; } .ma-nights-preview { justify-self: end; color: var(--brass); }
      .ma-progress-track { width: min(520px, 60%); height: 3px; background: #2a2c31; margin: 46px auto 0; position: relative; z-index: 1; }
      .ma-theme-light .ma-progress-track { background: #d8d1c4; }
      .ma-progress-fill { height: 100%; background: var(--brass); transition: width .35s cubic-bezier(.22,1,.36,1); }
      .ma-review-dock { position: relative; z-index: 2; margin: 30px auto 0; width: min(760px, 100%); display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 14px 16px 14px 20px; background: rgba(23,26,32,.92); border: 1px solid #2c3038; border-radius: 16px; box-shadow: var(--shadow); }
      .ma-theme-light .ma-review-dock { background: rgba(255,255,255,.92); border-color: #d8d0c2; } .ma-review-dock strong { display: block; margin-top: 3px; font-family: 'Playfair Display', serif; font-size: 17px; }
      .ma-availability-overlay { position: fixed; inset: 0; z-index: 70; display: grid; place-items: center; padding: 24px; background: rgba(7,8,10,.76); backdrop-filter: blur(10px); }
      .ma-availability-card { width: min(560px, 100%); padding: 36px; background: #171a20; border: 1px solid #343840; border-radius: 20px; color: #f6f3ee; box-shadow: 0 30px 100px rgba(0,0,0,.45); }
      .ma-theme-light .ma-availability-card { background: #fff; color: #17181b; border-color: #ddd6ca; } .ma-availability-card > svg { margin-bottom: 14px; }
      .ma-availability-card h3 { font-size: 32px; margin: 7px 0; } .ma-availability-card p:not(.ma-eyebrow) { color: #aaa9a4; } .ma-theme-light .ma-availability-card p:not(.ma-eyebrow) { color: #706e68; }
      .ma-review-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; margin: 22px 0; border: 1px solid #30333a; background: #30333a; }
      .ma-review-summary span { padding: 11px 12px; background: #1c1f25; color: #d9d6cf; font-size: 12px; } .ma-theme-light .ma-review-summary { border-color: var(--line); background: var(--line); } .ma-theme-light .ma-review-summary span { background: #f4f0e8; color: #252527; }
      .ma-confirmation-screen { min-height: calc(100vh - 102px); display: grid; place-items: center; }
      .ma-confirmation-card { width: min(700px, 100%); padding: 46px; background: var(--surface); border: 1px solid var(--line); border-radius: 24px; text-align: center; box-shadow: var(--shadow); }
      .ma-confirmation-icon { width: 58px; height: 58px; border-radius: 50%; border: 1px solid #4d6757; display: grid; place-items: center; color: #8fb69c; margin: 0 auto 18px; }
      .ma-confirmation-card h1 { font-size: 42px; margin: 8px 0 10px; } .ma-confirmation-copy { color: var(--muted); max-width: 500px; margin: 0 auto; }
      .ma-confirmation-details { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); text-align: left; }
      .ma-detail { padding: 13px 15px; background: var(--surface-soft); } .ma-detail span { display: block; color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: .12em; } .ma-detail strong { display: block; color: var(--ink); font-size: 13px; margin-top: 2px; }
      .ma-pay-block { margin: 24px 0; padding: 20px; display: flex; align-items: center; justify-content: space-between; gap: 20px; text-align: left; border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
      .ma-pay-block h3 { font-size: 21px; margin: 4px 0; } .ma-qr { width: 150px; height: 150px; background: #fff; padding: 6px; border-radius: 10px; } .ma-confirm-actions { display: flex; justify-content: center; gap: 10px; margin-top: 24px; }

      /* Availability */
      .ma-filter-panel { padding: 24px; } .ma-filter-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 18px; } .ma-filter-heading strong { display: block; margin-top: 4px; font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 500; }
      .ma-filter-label { color: var(--muted); font-size: 9px; letter-spacing: .16em; } .ma-date-duration { color: var(--brass-deep); font-size: 12px; font-weight: 600; }
      .ma-search-row { display: flex; align-items: flex-end; gap: 12px; flex-wrap: wrap; } .ma-field { display: flex; flex-direction: column; gap: 6px; min-width: 190px; color: var(--muted); font-size: 11px; }
      .ma-field input, .ma-field select, .ma-field textarea, .ma-block-form input, .ma-block-form select { width: 100%; background: var(--paper); border: 1px solid var(--line); outline: none; color: var(--ink); border-radius: 8px; padding: 10px 11px; } .ma-field input:focus, .ma-field select:focus, .ma-field textarea:focus { border-color: var(--brass); }
      .ma-search-submit { min-width: 170px; } .ma-inline-error { display: flex; align-items: center; gap: 6px; color: var(--rust); margin-top: 12px; font-size: 12px; }
      .ma-availability-layout { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; } .ma-result-toolbar { display: flex; justify-content: space-between; align-items: flex-end; gap: 20px; margin: 10px 0 14px; } .ma-result-toolbar h2 { font-size: 27px; margin-top: 5px; }
      .ma-count-badge { padding: 7px 10px; border: 1px solid var(--line); border-radius: 20px; font-size: 10px; color: var(--muted); } .ma-apartment-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .ma-apartment-card { min-height: 126px; display: grid; grid-template-columns: 40px 1fr 26px; align-items: center; gap: 13px; padding: 17px; background: var(--surface); border: 1px solid var(--line); border-radius: 13px; transition: .2s ease; }
      .ma-apartment-card:hover { border-color: var(--brass); transform: translateY(-1px); box-shadow: var(--shadow); } .ma-apartment-card-icon { width: 40px; height: 40px; display: grid; place-items: center; background: var(--surface-soft); color: var(--brass-deep); border-radius: 10px; }
      .ma-apartment-card-copy span { color: var(--muted); font-size: 9px; text-transform: uppercase; letter-spacing: .12em; } .ma-apartment-card-copy h3 { font-size: 18px; margin: 3px 0; } .ma-apartment-card-copy p { color: var(--muted); font-size: 11px; margin: 0; }
      .ma-available-dot { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 50%; color: var(--forest); border: 1px solid currentColor; } .ma-availability-side { display: flex; flex-direction: column; gap: 12px; }
      .ma-side-card { padding: 20px; background: var(--surface); border: 1px solid var(--line); border-radius: 14px; } .ma-side-card-head { display: flex; align-items: center; justify-content: space-between; color: var(--muted); font-size: 9px; letter-spacing: .16em; margin-bottom: 14px; } .ma-side-card-head svg { color: var(--brass); }
      .ma-side-stat { display: flex; justify-content: space-between; align-items: baseline; padding: 11px 0; border-top: 1px solid var(--line); } .ma-side-stat strong { font-family: 'Playfair Display', serif; font-size: 27px; } .ma-side-stat span { color: var(--muted); font-size: 11px; }
      .ma-unavailable-list { display: flex; flex-direction: column; gap: 9px; } .ma-unavailable-list div { display: flex; justify-content: space-between; gap: 12px; padding-top: 9px; border-top: 1px solid var(--line); } .ma-unavailable-list strong { font-size: 11px; } .ma-unavailable-list span { color: var(--rust); font-size: 10px; text-align: right; }
      .ma-empty-state { min-height: 180px; grid-column: 1 / -1; border: 1px dashed var(--line); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; color: var(--muted); text-align: center; padding: 24px; } .ma-empty-state svg { color: var(--brass); } .ma-empty-state strong { color: var(--ink); font-family: 'Playfair Display', serif; font-size: 18px; } .ma-empty-state span { font-size: 11px; } .ma-empty-state.small { min-height: 120px; }

      /* Occupancy */
      .ma-occupancy-hero { display:grid; grid-template-columns:minmax(0,1fr) 250px; gap:18px; align-items:stretch; margin-bottom:18px; }
      .ma-occupancy-hero-copy { padding:32px 34px; min-height:260px; border:1px solid var(--line); border-radius:18px; background:radial-gradient(circle at 90% 10%,rgba(198,163,107,.12),transparent 34%),var(--surface); box-shadow:var(--shadow); display:flex; flex-direction:column; justify-content:center; }
      .ma-occupancy-hero h1 { max-width:780px; font-size:clamp(40px,5vw,64px); line-height:.98; margin-top:10px; letter-spacing:-.035em; }
      .ma-occupancy-hero-copy > p:not(.ma-eyebrow) { max-width:650px; margin:14px 0 0; font-size:13px; }
      .ma-occupancy-hero-meta { display:flex; gap:18px; flex-wrap:wrap; margin-top:24px; color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.1em; }
      .ma-occupancy-hero-meta span { display:inline-flex; align-items:center; gap:7px; } .ma-live-dot { width:7px; height:7px; border-radius:50%; background:var(--forest); box-shadow:0 0 0 4px rgba(49,87,68,.1); }
      .ma-occupancy-ring-card { border:1px solid var(--line); border-radius:18px; background:var(--ink-2); color:var(--paper); min-height:260px; display:flex; flex-direction:column; align-items:center; justify-content:center; }
      .ma-occupancy-ring { width:156px; height:156px; border-radius:50%; display:grid; place-items:center; background:conic-gradient(var(--brass) var(--rate),rgba(255,255,255,.10) 0); position:relative; }
      .ma-occupancy-ring::before { content:''; position:absolute; inset:9px; border-radius:50%; background:var(--ink-2); border:1px solid rgba(255,255,255,.08); }
      .ma-occupancy-ring > div { position:relative; text-align:center; z-index:1; } .ma-occupancy-ring strong,.ma-occupancy-ring span { display:block; } .ma-occupancy-ring strong { font-family:'Playfair Display',serif; font-size:40px; line-height:1; } .ma-occupancy-ring span { color:#999ca2; font-size:9px; letter-spacing:.12em; text-transform:uppercase; margin-top:5px; } .ma-ring-label { color:#9a9ca1; font-size:9px; letter-spacing:.16em; margin-top:15px; }
      .ma-occupancy-commandbar { display:flex; align-items:center; gap:9px; padding:10px; border:1px solid var(--line); border-radius:14px; background:var(--surface); box-shadow:var(--shadow); margin-bottom:14px; }
      .ma-occupancy-month { min-width:170px; padding:0 8px; display:flex; flex-direction:column; } .ma-occupancy-month span { color:var(--muted); font-size:8px; letter-spacing:.15em; } .ma-occupancy-month strong { font-family:'Playfair Display',serif; font-size:18px; font-weight:500; } .ma-today-button { margin-left:4px; }
      .ma-occupancy-filter { margin-left:auto; display:flex; align-items:center; gap:9px; } .ma-occupancy-filter label { color:var(--muted); font-size:9px; text-transform:uppercase; letter-spacing:.1em; } .ma-occupancy-filter select { min-width:190px; padding:9px 12px; border:1px solid var(--line); border-radius:8px; background:var(--paper); color:var(--ink); outline:none; }
      .ma-occupancy-stat-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:18px; } .ma-occupancy-stat { min-height:120px; padding:17px; border:1px solid var(--line); border-radius:14px; background:var(--surface); box-shadow:var(--shadow); } .ma-occupancy-stat span { display:flex; align-items:center; gap:7px; color:var(--muted); font-size:9px; letter-spacing:.11em; text-transform:uppercase; } .ma-occupancy-stat strong { display:block; font-family:'Playfair Display',serif; font-size:32px; line-height:1; margin:13px 0 5px; } .ma-occupancy-stat small { color:var(--muted); font-size:10px; }
      .ma-stat-dot { width:7px; height:7px; border-radius:50%; display:inline-block; } .ma-stat-occupied { background:var(--forest); } .ma-stat-open { background:var(--surface-soft); border:1px solid var(--line); } .ma-stat-arrival { background:var(--brass); } .ma-stat-maintenance { background:var(--rust); }
      .ma-occupancy-board { padding:24px; } .ma-occupancy-board h2 { font-size:27px; margin-top:4px; } .ma-occupancy-board .ma-panel-header-row p:last-child { margin:5px 0 0; font-size:11px; } .ma-occupancy-legend { display:flex; flex-wrap:wrap; gap:10px 14px; color:var(--muted); font-size:9px; } .ma-occupancy-legend .ma-legend { margin:0; gap:10px; }
      .ma-occupancy-board-scroll { overflow:auto; border:1px solid var(--line); border-radius:12px; background:var(--paper); } .ma-occupancy-grid { display:grid; grid-template-columns:220px repeat(var(--days),minmax(28px,1fr)); min-width:1100px; } .ma-occupancy-grid > div { border-right:1px solid var(--line); border-bottom:1px solid var(--line); }
      .ma-occupancy-grid-corner { position:sticky; left:0; z-index:3; background:var(--surface-soft); padding:12px 14px; color:var(--muted); font-size:8px; letter-spacing:.14em; font-weight:600; } .ma-occupancy-day-head { min-height:50px; padding:7px 2px; text-align:center; background:var(--surface-soft); display:flex; flex-direction:column; justify-content:center; gap:1px; } .ma-occupancy-day-head span { color:var(--muted); font-size:8px; text-transform:uppercase; } .ma-occupancy-day-head strong { font-size:11px; font-weight:600; } .ma-occupancy-day-head.is-today { background:rgba(198,163,107,.13); box-shadow:inset 0 -2px 0 var(--brass); }
      .ma-occupancy-apartment-label { position:sticky; left:0; z-index:2; min-height:45px; display:grid; grid-template-columns:28px 1fr auto; align-items:center; gap:8px; padding:6px 10px; background:var(--surface); } .ma-occupancy-apartment-icon { width:28px; height:28px; display:grid; place-items:center; border-radius:7px; background:var(--surface-soft); color:var(--brass-deep); } .ma-occupancy-apartment-label strong,.ma-occupancy-apartment-label span { display:block; } .ma-occupancy-apartment-label strong { font-size:10.5px; } .ma-occupancy-apartment-label span { color:var(--muted); font-size:8px; margin-top:1px; } .ma-occupancy-apartment-label small { color:var(--muted); font-size:9px; }
      .ma-occupancy-cell { min-height:45px; display:grid; place-items:center; position:relative; transition:transform .16s ease,filter .16s ease; } .ma-occupancy-cell:hover { z-index:4; transform:scale(1.18); filter:brightness(1.08); box-shadow:0 0 0 2px var(--brass); border-radius:5px; } .ma-occupancy-cell.ma-cell-available { background:var(--surface); } .ma-occupancy-cell.ma-cell-occupied { background:var(--forest); color:#fff; } .ma-occupancy-cell.ma-cell-checkin { background:var(--brass); color:#fff; } .ma-occupancy-cell.ma-cell-checkout { background:var(--slate); color:#fff; } .ma-occupancy-cell.ma-cell-turnover { background:linear-gradient(135deg,var(--brass) 50%,var(--slate) 50%); color:#fff; } .ma-occupancy-cell.ma-cell-maintenance { background:repeating-linear-gradient(45deg,var(--rust),var(--rust) 4px,#7a2e22 4px,#7a2e22 8px); color:#fff; } .ma-occupancy-cell.is-today { box-shadow:inset 0 0 0 2px rgba(255,255,255,.75); }
      .ma-occupancy-board-footer { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-top:13px; color:var(--muted); font-size:9px; } .ma-occupancy-board-footer span { display:inline-flex; align-items:center; gap:7px; } .ma-today-line { width:18px; height:2px; background:var(--brass); display:inline-block; }
      .ma-swatch.ma-cell-available { background:var(--surface); border:1px solid var(--line); } .ma-swatch.ma-cell-occupied { background:var(--forest); } .ma-swatch.ma-cell-checkin { background:var(--brass); } .ma-swatch.ma-cell-checkout { background:var(--slate); } .ma-swatch.ma-cell-turnover { background:linear-gradient(135deg,var(--brass) 50%,var(--slate) 50%); } .ma-swatch.ma-cell-maintenance { background:var(--rust); }
      .ma-legend { display:flex; gap:18px; flex-wrap:wrap; margin-top:15px; font-size:10px; color:var(--muted); } .ma-legend span { display:flex; align-items:center; gap:6px; } .ma-swatch { width:12px; height:12px; display:inline-block; border-radius:2px; }

      /* Dashboard */
      .ma-dashboard-actions { display: flex; align-items: center; gap: 9px; } .ma-live-indicator { display: inline-flex; align-items: center; gap: 6px; color: var(--muted); font-size: 10px; } .ma-live-indicator i { width: 7px; height: 7px; border-radius: 50%; background: var(--forest); box-shadow: 0 0 0 4px rgba(49,87,68,.10); }
      .ma-dashboard-grid { display: grid; grid-template-columns: 1.35fr repeat(4, 1fr); gap: 10px; margin-bottom: 20px; } .ma-kpi-card { min-height: 155px; padding: 18px; background: var(--surface); border: 1px solid var(--line); border-radius: 13px; box-shadow: var(--shadow); } .ma-kpi-featured { background: var(--ink-2); color: var(--paper); border-color: var(--ink-2); }
      .ma-kpi-top { display: flex; align-items: center; justify-content: space-between; color: var(--muted); font-size: 9px; letter-spacing: .12em; text-transform: uppercase; } .ma-kpi-featured .ma-kpi-top { color: #999ca2; } .ma-kpi-top svg { color: var(--brass); } .ma-kpi-card > strong { display: block; font-family: 'Playfair Display', serif; font-size: 34px; line-height: 1; margin: 18px 0 6px; } .ma-kpi-card > small { display: block; color: var(--muted); font-size: 10px; line-height: 1.45; } .ma-kpi-featured > small { color: #9d9ea2; }
      .ma-kpi-progress { height: 3px; margin-top: 15px; background: #35383e; overflow: hidden; } .ma-kpi-progress i { display: block; height: 100%; background: var(--brass); }
      .ma-admin-content-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, .65fr); gap: 20px; } .ma-admin-content-grid-wide { grid-template-columns: minmax(0, 1fr) minmax(330px, .55fr); }
      .ma-bars { height: 220px; display: flex; align-items: flex-end; justify-content: space-around; gap: 15px; padding: 20px 8px 0; border-top: 1px solid var(--line); } .ma-bar-col { height: 100%; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 7px; } .ma-bar-value { color: var(--muted); font-size: 10px; height: 15px; } .ma-bar-track { width: min(42px, 70%); height: 150px; display: flex; align-items: flex-end; background: var(--surface-soft); border-radius: 5px 5px 0 0; overflow: hidden; } .ma-bar-track i { display: block; width: 100%; min-height: 8px; background: var(--brass); border-radius: 5px 5px 0 0; } .ma-bar-col > span { color: var(--muted); font-size: 9px; }
      .ma-timeline { display: flex; flex-direction: column; gap: 0; } .ma-timeline > div { position: relative; padding: 0 0 20px 27px; border-left: 1px solid var(--line); margin-left: 5px; } .ma-timeline > div:last-child { border-left-color: transparent; } .ma-time-dot { position: absolute; left: -5px; top: 2px; width: 9px; height: 9px; border-radius: 50%; border: 2px solid var(--surface); } .ma-dot-brass { background: var(--brass); } .ma-dot-slate { background: var(--slate); } .ma-dot-rust { background: var(--rust); } .ma-timeline strong, .ma-timeline small { display: block; } .ma-timeline strong { font-size: 12px; } .ma-timeline small { color: var(--muted); font-size: 10px; margin-top: 3px; }
      .ma-portfolio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1px 20px; } .ma-portfolio-row { display: grid; grid-template-columns: 30px 1fr auto; gap: 9px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); } .ma-portfolio-icon { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 8px; background: var(--surface-soft); color: var(--brass-deep); } .ma-portfolio-name strong, .ma-portfolio-name span { display: block; } .ma-portfolio-name strong { font-size: 11.5px; } .ma-portfolio-name span { color: var(--muted); font-size: 9px; margin-top: 1px; }
      .ma-status-pill { display: inline-flex; align-items: center; border: 1px solid currentColor; border-radius: 20px; padding: 3px 8px; font-size: 9px; white-space: nowrap; } .ma-good { color: var(--forest); } .ma-bad { color: var(--rust); } .ma-warn2 { color: var(--brass-deep); }
      .ma-text-link { background: transparent; border: 0; color: var(--brass-deep); font-size: 10px; } .ma-recent-list { display: flex; flex-direction: column; gap: 0; } .ma-recent-item { display: grid; grid-template-columns: 34px 1fr auto; gap: 10px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--line); } .ma-recent-avatar { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: var(--surface-soft); color: var(--brass-deep); font-family: 'Playfair Display', serif; } .ma-recent-item strong, .ma-recent-item span { display: block; } .ma-recent-item strong { font-size: 11px; } .ma-recent-item div:nth-child(2) span { color: var(--muted); font-size: 9px; margin-top: 2px; }
      .ma-reservations-panel { margin-top: 20px; } .ma-search-box { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 9px; color: var(--muted); margin-bottom: 14px; background: var(--paper); } .ma-search-box input { width: 100%; border: 0; outline: 0; background: transparent; color: var(--ink); font-size: 12px; }
      .ma-table-scroll { overflow-x: auto; } .ma-table { width: 100%; border-collapse: collapse; font-size: 11px; } .ma-table th, .ma-table td { text-align: left; padding: 11px 9px; border-bottom: 1px solid var(--line); white-space: nowrap; } .ma-table th { color: var(--muted); font-size: 9px; letter-spacing: .08em; font-weight: 600; } .ma-row-cancelled { opacity: .48; } .ma-row-actions { display: flex; gap: 5px; } .ma-empty-cell { text-align: center !important; color: var(--muted); padding: 30px !important; }
      .ma-block-form { display: grid; grid-template-columns: 1.2fr .8fr .8fr 1.4fr auto; gap: 8px; padding: 13px; background: var(--surface-soft); border: 1px solid var(--line); border-radius: 10px; margin-bottom: 12px; } .ma-blocks-list { display: flex; gap: 7px; flex-wrap: wrap; margin-bottom: 14px; } .ma-block-chip { display: flex; align-items: center; gap: 6px; font-size: 10px; background: rgba(155,64,52,.08); color: var(--rust); border: 1px solid rgba(155,64,52,.45); padding: 5px 8px; border-radius: 20px; } .ma-block-chip button { background: none; border: none; color: var(--rust); cursor: pointer; display: flex; }

      /* Residence gallery */
      .ma-gallery-section { margin-top: 34px; }
      .ma-gallery-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:24px; margin-bottom:18px; }
      .ma-gallery-heading h2 { font-size:32px; margin-top:5px; }
      .ma-gallery-heading p:last-child { margin:8px 0 0; font-size:12px; max-width:620px; }
      .ma-gallery-count, .ma-studio-count { display:inline-flex; align-items:center; gap:7px; padding:8px 11px; border:1px solid var(--line); border-radius:999px; color:var(--muted); font-size:10px; white-space:nowrap; }
      .ma-gallery-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
      .ma-gallery-card { border:1px solid var(--line); border-radius:18px; background:var(--surface); box-shadow:var(--shadow); overflow:hidden; }
      .ma-gallery-card:hover { transform:translateY(-7px); }
      .ma-gallery-bento { display:grid; grid-template-columns:1.7fr .85fr; min-height:330px; gap:3px; background:var(--surface-soft); }
      .ma-gallery-card.is-compact .ma-gallery-bento { min-height:220px; } .ma-gallery-card.is-compact .ma-gallery-info { padding:13px 15px 11px; } .ma-gallery-card.is-compact .ma-gallery-info h3 { font-size:18px; } .ma-gallery-card.is-compact .ma-gallery-filmstrip { padding-bottom:12px; }
      .ma-gallery-feature, .ma-gallery-mini { position:relative; border:0; padding:0; overflow:hidden; background:#15171b; cursor:pointer; }
      .ma-gallery-feature img, .ma-gallery-mini img { width:100%; height:100%; display:block; object-fit:cover; transition:transform .7s cubic-bezier(.22,1,.36,1), filter .45s ease; }
      .ma-gallery-feature:hover img, .ma-gallery-mini:hover img { transform:scale(1.055); filter:saturate(1.08); }
      .ma-gallery-feature::after { content:''; position:absolute; inset:0; background:linear-gradient(180deg,rgba(0,0,0,.03) 35%,rgba(0,0,0,.58)); pointer-events:none; }
      .ma-gallery-side-images { display:grid; grid-template-rows:repeat(3,1fr); gap:3px; }
      .ma-gallery-mini span { position:absolute; inset:auto 9px 9px auto; z-index:2; padding:5px 7px; background:rgba(12,13,15,.72); color:#fff; border:1px solid rgba(255,255,255,.18); border-radius:999px; font-size:9px; letter-spacing:.04em; backdrop-filter:blur(8px); }
      .ma-gallery-number { position:absolute; left:15px; bottom:14px; z-index:2; color:#fff; font-size:10px; letter-spacing:.14em; }
      .ma-gallery-open { position:absolute; right:14px; top:14px; z-index:2; display:flex; align-items:center; gap:7px; padding:7px 9px; border:1px solid rgba(255,255,255,.25); border-radius:999px; color:#fff; background:rgba(10,11,13,.42); font-size:9px; backdrop-filter:blur(9px); opacity:.82; transition:.25s ease; }
      .ma-gallery-feature:hover .ma-gallery-open { opacity:1; transform:translateY(-2px); }
      .ma-maximize-icon { width:11px; height:11px; display:grid; grid-template-columns:1fr 1fr; gap:3px; }
      .ma-maximize-icon span { border:1px solid currentColor; width:4px; height:4px; }
      .ma-gallery-info { display:flex; justify-content:space-between; gap:16px; padding:17px 18px 14px; }
      .ma-gallery-category { color:var(--brass-deep); font-size:9px; letter-spacing:.16em; text-transform:uppercase; }
      .ma-gallery-info h3 { font-size:22px; margin-top:3px; }
      .ma-gallery-info p { margin:5px 0 0; color:var(--muted); font-size:10.5px; }
      .ma-gallery-price { text-align:right; white-space:nowrap; padding-top:4px; }
      .ma-gallery-price strong { display:block; font-family:'Playfair Display',serif; font-size:17px; font-weight:500; }
      .ma-gallery-price span { color:var(--muted); font-size:9px; }
      .ma-gallery-filmstrip { display:flex; gap:5px; padding:0 18px 16px; align-items:center; overflow:hidden; }
      .ma-gallery-filmstrip button { flex:0 0 42px; height:31px; padding:0; border:1px solid var(--line); background:var(--surface-soft); border-radius:6px; overflow:hidden; opacity:.52; transition:.2s ease; }
      .ma-gallery-filmstrip button img { width:100%; height:100%; object-fit:cover; display:block; }
      .ma-gallery-filmstrip button:hover, .ma-gallery-filmstrip button.is-active { opacity:1; border-color:var(--brass); transform:translateY(-2px); }
      .ma-gallery-filmstrip .ma-gallery-next { display:grid; place-items:center; color:var(--ink); flex:0 0 31px; }
      .ma-gallery-lightbox { position:fixed; inset:0; z-index:95; background:rgba(5,6,8,.88); backdrop-filter:blur(18px); display:grid; place-items:center; padding:20px; animation:ma-lightbox-in .25s ease both; }
      @keyframes ma-lightbox-in { from {opacity:0} to {opacity:1} }
      .ma-lightbox-shell { width:min(1180px,100%); max-height:94vh; display:flex; flex-direction:column; background:#111318; border:1px solid #343840; border-radius:20px; overflow:hidden; box-shadow:0 40px 120px rgba(0,0,0,.5); }
      .ma-lightbox-top { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; color:#f6f3ee; }
      .ma-lightbox-top strong { display:block; margin-top:2px; font-family:'Playfair Display',serif; font-size:19px; }
      .ma-lightbox-top .ma-icon-btn { color:#fff; border-color:#3a3d45; }
      .ma-lightbox-stage { position:relative; min-height:clamp(360px,66vh,720px); display:grid; place-items:center; background:#090a0d; }
      .ma-lightbox-stage img { width:100%; height:100%; max-height:72vh; object-fit:contain; display:block; }
      .ma-lightbox-counter { position:absolute; left:50%; bottom:14px; transform:translateX(-50%); padding:6px 10px; border-radius:999px; color:#fff; background:rgba(0,0,0,.55); border:1px solid rgba(255,255,255,.15); font-size:9px; letter-spacing:.12em; }
      .ma-lightbox-arrow { position:absolute; top:50%; transform:translateY(-50%); z-index:2; width:44px; height:44px; display:grid; place-items:center; border:1px solid rgba(255,255,255,.18); border-radius:50%; background:rgba(12,13,15,.58); color:#fff; backdrop-filter:blur(8px); }
      .ma-lightbox-arrow:hover { border-color:var(--brass); color:var(--brass); }
      .ma-lightbox-arrow.left { left:18px; } .ma-lightbox-arrow.right { right:18px; }
      .ma-lightbox-thumbs { display:flex; gap:6px; padding:9px 12px 12px; overflow-x:auto; background:#111318; }
      .ma-lightbox-thumbs button { flex:0 0 70px; height:47px; padding:0; border:1px solid #30333a; border-radius:6px; overflow:hidden; opacity:.5; background:#17191e; }
      .ma-lightbox-thumbs button img { width:100%; height:100%; object-fit:cover; display:block; }
      .ma-lightbox-thumbs button.is-active { opacity:1; border-color:var(--brass); }
      .ma-review-price { display:block; color:var(--brass); font-size:10px; margin-top:3px; }

      /* Property Studio */
      .ma-property-studio-collapsed { display:flex; align-items:center; justify-content:space-between; gap:20px; }
      .ma-property-studio-collapsed h2 { font-size:25px; margin-top:4px; }
      .ma-property-studio-collapsed p:last-child { margin:6px 0 0; font-size:11px; }
      .ma-studio-layout { display:grid; grid-template-columns:290px 1fr; gap:18px; }
      .ma-studio-list { border:1px solid var(--line); border-radius:14px; padding:6px; background:var(--surface-soft); max-height:650px; overflow:auto; }
      .ma-studio-unit { width:100%; display:grid; grid-template-columns:44px 1fr auto; gap:9px; align-items:center; text-align:left; padding:8px; border:1px solid transparent; border-radius:10px; background:transparent; color:var(--ink); transition:.2s ease; }
      .ma-studio-unit:hover, .ma-studio-unit.active { background:var(--surface); border-color:var(--line); }
      .ma-studio-unit.active { box-shadow:inset 3px 0 0 var(--brass); }
      .ma-studio-unit img { width:44px; height:44px; border-radius:8px; object-fit:cover; }
      .ma-studio-unit strong, .ma-studio-unit small { display:block; }
      .ma-studio-unit strong { font-size:10.5px; }
      .ma-studio-unit small { color:var(--muted); font-size:8.5px; margin-top:2px; }
      .ma-studio-unit b { font-family:'Playfair Display',serif; font-size:10px; font-weight:500; }
      .ma-studio-editor { min-width:0; }
      .ma-studio-editor-head { display:flex; justify-content:space-between; align-items:flex-start; gap:15px; margin-bottom:14px; }
      .ma-studio-editor-head h3 { font-size:28px; margin-top:4px; }
      .ma-studio-editor-head p { margin:3px 0 0; color:var(--muted); font-size:10px; }
      .ma-upload-all { display:inline-flex; align-items:center; gap:7px; min-height:38px; padding:9px 13px; border:1px solid var(--line); border-radius:9px; cursor:pointer; font-size:11px; color:var(--ink); background:var(--surface); }
      .ma-upload-all:hover { border-color:var(--brass); }
      .ma-price-editor { display:flex; align-items:center; justify-content:space-between; gap:15px; padding:13px 15px; border:1px solid var(--line); border-radius:12px; background:var(--surface-soft); margin-bottom:14px; }
      .ma-price-editor span, .ma-price-editor small { display:block; }
      .ma-price-editor > div:first-child span { font-size:11px; font-weight:600; }
      .ma-price-editor small { color:var(--muted); font-size:9px; margin-top:2px; }
      .ma-price-input { display:flex; align-items:center; gap:5px; background:var(--surface); border:1px solid var(--line); border-radius:8px; padding:0 9px; }
      .ma-price-input > span { color:var(--brass-deep); font-size:11px; }
      .ma-price-input input { width:130px; border:0; outline:0; padding:9px 0; background:transparent; color:var(--ink); font-weight:600; }
      .ma-studio-gallery-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
      .ma-studio-image-slot { position:relative; aspect-ratio:4/3; overflow:hidden; border-radius:9px; border:1px solid var(--line); background:var(--surface-soft); }
      .ma-studio-image-slot img { width:100%; height:100%; object-fit:cover; display:block; }
      .ma-slot-number { position:absolute; left:7px; top:7px; width:22px; height:22px; display:grid; place-items:center; border-radius:50%; color:#fff; background:rgba(10,11,13,.68); font-size:8px; border:1px solid rgba(255,255,255,.15); }
      .ma-slot-actions { position:absolute; right:6px; top:6px; display:flex; gap:4px; opacity:0; transform:translateY(-3px); transition:.2s ease; }
      .ma-studio-image-slot:hover .ma-slot-actions { opacity:1; transform:none; }
      .ma-slot-actions label, .ma-slot-actions button { width:27px; height:27px; display:grid; place-items:center; border:1px solid rgba(255,255,255,.18); border-radius:7px; color:#fff; background:rgba(10,11,13,.72); cursor:pointer; }
      .ma-slot-actions label:hover, .ma-slot-actions button:hover { border-color:var(--brass); color:var(--brass); }
      .ma-slot-loading { position:absolute; inset:auto 5px 5px 5px; padding:4px; border-radius:5px; text-align:center; color:#fff; background:rgba(0,0,0,.7); font-size:8px; }
      .ma-studio-note { display:flex; align-items:flex-start; gap:8px; margin-top:13px; padding:10px 12px; color:var(--muted); border:1px dashed var(--line); border-radius:9px; font-size:9.5px; }
      .ma-studio-note svg { flex:0 0 auto; color:var(--brass); }

      /* Settings */
      .ma-settings-toggle { width: 100%; display: flex; align-items: center; justify-content: space-between; background: none; border: none; color: var(--ink); padding: 0; text-align: left; } .ma-panel-title { font-family: 'Playfair Display', serif; font-size: 24px; } .ma-settings-body { margin-top: 20px; display: flex; flex-direction: column; gap: 24px; } .ma-settings-section { padding-top: 20px; border-top: 1px solid var(--line); } .ma-settings-section h4 { display: flex; align-items: center; gap: 6px; font-size: 12px; margin: 0 0 5px; } .ma-settings-section p { font-size: 11px; margin: 5px 0 10px; } .ma-settings-row { display: flex; gap: 8px; flex-wrap: wrap; } .ma-settings-row input { flex: 1; min-width: 220px; background: var(--paper); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; padding: 9px 10px; outline: none; } .ma-settings-row input:focus { border-color: var(--brass); } .ma-settings-details { font-size: 11px; margin-top: 10px; } .ma-settings-details summary { cursor: pointer; color: var(--brass-deep); } .ma-settings-details ol { margin: 8px 0; padding-left: 20px; } .ma-qr-preview { display: flex; align-items: center; gap: 10px; margin-top: 10px; } .ma-qr-preview img { width: 70px; height: 70px; border: 1px solid var(--line); padding: 3px; background: #fff; } .ma-pay-warning { display: flex; align-items: center; gap: 5px; font-size: 10px; color: var(--rust); }

      /* PIN / modal */
      .ma-pingate { max-width: 420px; margin: 70px auto; text-align: center; } .ma-pingate > svg { color: var(--brass); margin-bottom: 8px; } .ma-pingate h2 { font-size: 26px; } .ma-pin-row { display: flex; gap: 8px; margin: 18px 0 7px; } .ma-pin-row input { flex: 1; padding: 10px; text-align: center; letter-spacing: 4px; background: var(--paper); color: var(--ink); border: 1px solid var(--line); border-radius: 8px; outline: none; } .ma-pingate-note { font-size: 10px; color: var(--muted); margin-top: 18px; }
      .ma-modal-backdrop { position: fixed; inset: 0; z-index: 80; display: grid; place-items: center; padding: 20px; background: rgba(17,18,20,.65); backdrop-filter: blur(6px); } .ma-modal { width: min(680px, 100%); max-height: 88vh; overflow: auto; padding: 28px; background: var(--surface); border: 1px solid var(--line); border-radius: 18px; box-shadow: 0 30px 90px rgba(0,0,0,.25); } .ma-modal-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px; } .ma-modal-header h3 { font-size: 18px; margin-top: 4px; } .ma-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; } .ma-field-wide { grid-column: 1 / -1; }
      .ma-toast { position: fixed; z-index: 100; top: 18px; right: 18px; max-width: 360px; padding: 12px 16px; color: #fff; background: #17191d; border-left: 3px solid var(--brass); border-radius: 7px; box-shadow: 0 14px 45px rgba(0,0,0,.2); font-size: 12px; } .ma-toast-warn { border-left-color: var(--rust); }

      .ma-integration-status { display:inline-flex; align-items:center; gap:8px; width:max-content; max-width:100%; padding:8px 10px; border:1px solid var(--line); border-radius:999px; background:var(--surface-soft); font-size:10px; color:var(--muted); }
      .ma-integration-status.is-live { color:var(--forest); border-color:rgba(49,87,68,.24); }
      .ma-status-light { width:7px; height:7px; border-radius:50%; background:var(--muted); box-shadow:0 0 0 4px rgba(116,115,109,.10); }
      .ma-integration-status.is-live .ma-status-light { background:#4c9b6d; box-shadow:0 0 0 4px rgba(76,155,109,.12); animation:ma-pulse 2s ease-in-out infinite; }
      @keyframes ma-pulse { 50% { box-shadow:0 0 0 7px rgba(76,155,109,.03); } }
      .ma-database-icon { width:14px; height:14px; display:inline-flex; flex-direction:column; justify-content:space-between; }
      .ma-database-icon span { height:3px; border:1px solid currentColor; border-radius:50%; display:block; }

      @media (max-width: 1050px) { .ma-gallery-grid { grid-template-columns:1fr; } .ma-studio-layout { grid-template-columns:1fr; } .ma-studio-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); max-height:300px; } .ma-occupancy-hero { grid-template-columns:1fr 210px; } .ma-occupancy-stat-grid { grid-template-columns:1fr 1fr; } .ma-dashboard-grid { grid-template-columns: 1fr 1fr 1fr; } .ma-kpi-featured { grid-column: 1 / -1; } .ma-availability-layout { grid-template-columns: 1fr; } .ma-availability-side { display: grid; grid-template-columns: 1fr 1fr; } }
      .ma-auth-gate { max-width: 560px; margin: 0 auto; }
      .ma-auth-icon { width: 48px; height: 48px; display:grid; place-items:center; border:1px solid var(--ma-border-strong); border-radius:16px; background:var(--ma-surface-2); margin-bottom:18px; }
      .ma-auth-form { display:grid; gap:14px; margin-top:24px; }
      .ma-auth-form label { display:grid; gap:7px; text-align:left; }
      .ma-auth-form label span { font-size:11px; text-transform:uppercase; letter-spacing:.12em; font-weight:700; color:var(--ma-muted); }
      .ma-auth-form input { width:100%; }
      .ma-auth-form .ma-btn { justify-content:center; min-height:48px; margin-top:5px; }
      .ma-admin-signout { border:1px solid var(--ma-border); background:transparent; color:var(--ma-muted); border-radius:999px; padding:9px 12px; display:inline-flex; align-items:center; gap:7px; cursor:pointer; }
      .ma-admin-signout:hover { color:var(--ma-text); border-color:var(--ma-border-strong); transform:translateY(-1px); }

      @media (max-width: 850px) { .ma-gallery-heading, .ma-property-studio-collapsed { align-items:flex-start; flex-direction:column; } .ma-gallery-bento { min-height:280px; } .ma-studio-gallery-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .ma-occupancy-hero { grid-template-columns:1fr; } .ma-occupancy-ring-card { min-height:210px; } .ma-occupancy-commandbar { flex-wrap:wrap; } .ma-occupancy-filter { width:100%; margin-left:0; } .ma-occupancy-filter select { flex:1; min-width:0; } .ma-topbar { flex-wrap: wrap; gap: 10px; } .ma-brand { min-width: 0; } .ma-nav { order: 3; width: 100%; overflow-x: auto; } .ma-admin-content-grid, .ma-admin-content-grid-wide { grid-template-columns: 1fr; } .ma-portfolio-grid, .ma-apartment-cards { grid-template-columns: 1fr; } .ma-occupancy-kpis { grid-template-columns: 1fr 1fr; } .ma-block-form { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 650px) { .ma-gallery-info { flex-direction:column; } .ma-gallery-price { text-align:left; } .ma-gallery-bento { grid-template-columns:1.5fr .8fr; min-height:230px; } .ma-lightbox-stage { min-height:320px; } .ma-studio-list { grid-template-columns:1fr; } .ma-price-editor { align-items:flex-start; flex-direction:column; } .ma-price-input { width:100%; } .ma-price-input input { width:100%; } .ma-occupancy-hero-copy { padding:24px 20px; min-height:230px; } .ma-occupancy-hero h1 { font-size:42px; } .ma-occupancy-board { padding:17px; } .ma-main { padding: 16px 14px 40px; } .ma-conversation { min-height: calc(100vh - 100px); margin: -16px -14px -40px; padding: 24px 18px 28px; } .ma-conversation-intro { margin-bottom: 32px; } .ma-conversation-intro h1 { font-size: 42px; } .ma-question-card h2 { font-size: 19px; } .ma-conversation-input { height: 68px; font-size: 17px; padding-left: 18px; } .ma-conversation-footer { grid-template-columns: 1fr auto; } .ma-key-hint { display: none; } .ma-review-dock { align-items: flex-start; flex-direction: column; } .ma-review-dock .ma-btn { width: 100%; } .ma-page-hero, .ma-dashboard-heading { align-items: flex-start; flex-direction: column; } .ma-hero-mark { width: 100%; min-width: 0; height: 80px; flex-direction: row; } .ma-dashboard-grid { grid-template-columns: 1fr 1fr; } .ma-kpi-featured { grid-column: 1 / -1; } .ma-filter-heading, .ma-calendar-toolbar { align-items: flex-start; flex-direction: column; } .ma-availability-side { grid-template-columns: 1fr; } .ma-availability-filters .ma-field { min-width: 100%; } .ma-search-submit { width: 100%; } .ma-form-grid { grid-template-columns: 1fr; } .ma-field-wide { grid-column: auto; } .ma-confirmation-card { padding: 28px 20px; } .ma-confirmation-card h1 { font-size: 34px; } .ma-confirmation-details { grid-template-columns: 1fr; } .ma-pay-block { flex-direction: column; align-items: flex-start; } .ma-confirm-actions { flex-direction: column; } .ma-confirm-actions .ma-btn { width: 100%; } .ma-block-form { grid-template-columns: 1fr; } }
      @media (max-width: 470px) { .ma-whatsapp-fab { right: 14px; bottom: 14px; padding: 12px; } .ma-whatsapp-fab span { display:none; } .ma-checkout-alert { padding: 13px; } .ma-occupancy-stat-grid { grid-template-columns:1fr; } .ma-dashboard-grid, .ma-occupancy-kpis { grid-template-columns: 1fr; } .ma-kpi-featured { grid-column: auto; } .ma-topbar { padding: 12px 16px; } .ma-nav-item { padding-inline: 9px; } .ma-nav-item span, .ma-theme-toggle span { display: none; } .ma-brand-name { font-size: 14px; } }

      .ma-footer { border-top: 1px solid var(--line); margin-top: 42px; padding: 18px 24px 26px; color: var(--muted); }
      .ma-footer-inner { max-width: 1380px; margin: 0 auto; display:flex; align-items:center; justify-content:space-between; gap:14px; font-size:10px; letter-spacing:.04em; }
      .ma-footer a { color:var(--ink); text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
      .ma-designed { font-family:'Playfair Display',serif; font-style:italic; color:var(--brass-deep); }
      .ma-back-guest { border:1px solid var(--line); background:var(--surface); color:var(--ink); border-radius:999px; padding:8px 11px; display:inline-flex; align-items:center; gap:6px; cursor:pointer; font-size:10px; }
      .ma-back-guest:hover { border-color:var(--brass); transform:translateY(-1px); }
      .ma-cell-tooltip { position:absolute; left:50%; bottom:calc(100% + 8px); transform:translate(-50%, 5px); opacity:0; pointer-events:none; min-width:130px; padding:8px 10px; border:1px solid rgba(198,163,107,.45); border-radius:8px; background:var(--ink-2); color:#fff; box-shadow:0 14px 35px rgba(0,0,0,.28); z-index:20; text-align:left; transition:opacity .18s ease, transform .18s ease; }
      .ma-cell-tooltip strong,.ma-cell-tooltip small { display:block; white-space:nowrap; } .ma-cell-tooltip strong { font-size:10px; } .ma-cell-tooltip small { margin-top:3px; font-size:8px; opacity:.72; }
      .ma-occupancy-cell:hover .ma-cell-tooltip { opacity:1; transform:translate(-50%,0); }
      .ma-qr-missing { width:150px; height:150px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:7px; border:1px dashed var(--line); border-radius:10px; color:var(--muted); background:var(--surface-soft); text-align:center; font-size:10px; }
      .ma-settings-section .ma-file-button { cursor:pointer; }
      .ma-danger { color:var(--rust) !important; }
      .ma-print-sheet { display:none; }

      /* ==================== EDITORIAL LIGHT MODE ==================== */
      .ma-theme-light {
        --paper: #eee8dd;
        --paper-2: #f8f4ec;
        --surface: rgba(255,253,248,.94);
        --surface-soft: #e8e0d3;
        --ink: #1a1a18;
        --ink-2: #28251f;
        --muted: #6f6a61;
        --line: rgba(92,76,53,.18);
        --brass: #a8793e;
        --brass-deep: #79562c;
        --shadow: 0 24px 70px rgba(69,52,30,.10);
        background:
          radial-gradient(circle at 8% 0%, rgba(198,163,107,.20), transparent 27%),
          radial-gradient(circle at 94% 12%, rgba(255,255,255,.72), transparent 28%),
          linear-gradient(135deg, #eee8dd 0%, #f7f3eb 46%, #e9e1d5 100%);
        color: var(--ink);
      }
      .ma-theme-light::selection { background: rgba(168,121,62,.22); }
      .ma-theme-light .ma-topbar {
        background: rgba(250,247,240,.92) !important;
        color: var(--ink) !important;
        border-bottom: 1px solid rgba(92,76,53,.16);
        box-shadow: 0 10px 35px rgba(74,55,31,.07);
        backdrop-filter: blur(18px);
      }
      .ma-theme-light .ma-brand-mark { background: #211f1b; border-color: var(--brass); color: #e5c58f; box-shadow: 0 8px 24px rgba(33,31,27,.16); }
      .ma-theme-light .ma-brand-name { color: #211f1b; }
      .ma-theme-light .ma-brand-sub { color: #81786c; }
      .ma-theme-light .ma-nav-item { color: #817a70; }
      .ma-theme-light .ma-nav-item:hover, .ma-theme-light .ma-nav-item.active { color: #211f1b; }
      .ma-theme-light .ma-theme-toggle, .ma-theme-light .ma-sync-btn { color: #5f594f; border-color: rgba(92,76,53,.18); background: rgba(255,255,255,.46); }
      .ma-theme-light .ma-theme-toggle:hover, .ma-theme-light .ma-sync-btn:hover { color: #211f1b; background:#fffdf8; border-color: rgba(168,121,62,.55); }
      .ma-theme-light .ma-back-guest { background: #fffdf8; color:#302d28; border-color:rgba(92,76,53,.18); }
      .ma-theme-light .ma-main { position: relative; }
      .ma-theme-light .ma-main::before { content:""; position: fixed; inset:74px 0 0; pointer-events:none; z-index:0; opacity:.28; background-image: radial-gradient(rgba(70,56,38,.16) .45px, transparent .45px); background-size: 7px 7px; mask-image: linear-gradient(to bottom, rgba(0,0,0,.55), transparent 75%); }
      .ma-theme-light .ma-main > * { position: relative; z-index:1; }
      .ma-theme-light .ma-panel,
      .ma-theme-light .ma-kpi-card,
      .ma-theme-light .ma-side-card,
      .ma-theme-light .ma-occupancy-stat,
      .ma-theme-light .ma-hero-mark,
      .ma-theme-light .ma-availability-card,
      .ma-theme-light .ma-gallery-card,
      .ma-theme-light .ma-property-studio-collapsed,
      .ma-theme-light .ma-confirmation-card,
      .ma-theme-light .ma-review-dock,
      .ma-theme-light .ma-question-card,
      .ma-theme-light .ma-occupancy-ring-card,
      .ma-theme-light .ma-modal,
      .ma-theme-light .ma-pingate {
        background: linear-gradient(145deg, rgba(255,253,248,.96), rgba(247,242,233,.92));
        border-color: rgba(92,76,53,.16);
        box-shadow: 0 20px 65px rgba(69,52,30,.075), inset 0 1px 0 rgba(255,255,255,.88);
      }
      .ma-theme-light .ma-panel::before,
      .ma-theme-light .ma-gallery-card::before,
      .ma-theme-light .ma-kpi-card::before { background: linear-gradient(90deg, transparent, rgba(168,121,62,.42), transparent); }
      .ma-theme-light .ma-page-hero h1,
      .ma-theme-light .ma-dashboard-heading h1,
      .ma-theme-light .ma-occupancy-hero h1,
      .ma-theme-light .ma-conversation-intro h1 { color:#1c1a17; text-shadow: 0 1px 0 rgba(255,255,255,.8); }
      .ma-theme-light .ma-eyebrow { color:#9a6c34; }
      .ma-theme-light .ma-muted { color:#70695f; }
      .ma-theme-light .ma-field input,
      .ma-theme-light .ma-field select,
      .ma-theme-light .ma-field textarea,
      .ma-theme-light .ma-settings-row input,
      .ma-theme-light .ma-conversation-input,
      .ma-theme-light .ma-pin-row input,
      .ma-theme-light .ma-occupancy-filter select { background: rgba(255,253,248,.9); color:#25231f; border-color:rgba(92,76,53,.18); box-shadow: inset 0 1px 2px rgba(64,49,30,.035); }
      .ma-theme-light .ma-field input:focus,
      .ma-theme-light .ma-field select:focus,
      .ma-theme-light .ma-field textarea:focus,
      .ma-theme-light .ma-settings-row input:focus,
      .ma-theme-light .ma-conversation-input:focus { border-color:#b98a4d; box-shadow:0 0 0 4px rgba(185,138,77,.10); }
      .ma-theme-light .ma-btn-ghost { background:rgba(255,253,248,.72); color:#2c2924; border-color:rgba(92,76,53,.18); }
      .ma-theme-light .ma-btn-ghost:hover { background:#fffdf8; border-color:#b98a4d; }
      .ma-theme-light .ma-btn-primary { background:#27231e; color:#f8f2e8; border-color:#27231e; box-shadow:0 12px 26px rgba(39,35,30,.15); }
      .ma-theme-light .ma-btn-primary:hover { background:#3a332a; transform:translateY(-2px); box-shadow:0 16px 32px rgba(39,35,30,.18); }
      .ma-theme-light .ma-hover-card:hover { box-shadow:0 28px 75px rgba(69,52,30,.14); }
      .ma-theme-light .ma-whatsapp-fab { background:#233126; border-color:rgba(255,255,255,.35); box-shadow:0 18px 45px rgba(44,52,40,.18); }
      .ma-theme-light .ma-footer { border-color:rgba(92,76,53,.15); background:rgba(255,253,248,.18); }
      .ma-theme-light .ma-footer a { color:#2d2923; }
      .ma-theme-light .ma-designed { color:#805d32; }
      .ma-theme-light .ma-occupancy-grid { background:#e8e0d3; }
      .ma-theme-light .ma-occupancy-day-head,
      .ma-theme-light .ma-occupancy-grid-corner,
      .ma-theme-light .ma-occupancy-apartment-label { background:#f8f4ec; color:#37332d; }
      .ma-theme-light .ma-occupancy-cell.ma-cell-available { background:#f8f5ee; }
      .ma-theme-light .ma-occupancy-cell.ma-cell-occupied { background:#cbb38e; }
      .ma-theme-light .ma-occupancy-cell.ma-cell-checkin { background:#b99661; }
      .ma-theme-light .ma-occupancy-cell.ma-cell-checkout { background:#b9a38a; }
      .ma-theme-light .ma-occupancy-cell.ma-cell-maintenance { background:#d8c2bb; }
      .ma-theme-light .ma-cell-tooltip { background:#29251f; color:#fffaf2; }
      .ma-theme-light .ma-status-pill.ma-good { background:#e2eee5; color:#315744; }
      .ma-theme-light .ma-status-pill.ma-warn2 { background:#f4ead5; color:#79562c; }
      .ma-theme-light .ma-status-pill.ma-bad { background:#f4dfda; color:#8b3e34; }
      .ma-theme-light .ma-table-wrap table th { background:#ece4d8; color:#756d61; }
      .ma-theme-light .ma-table-wrap table td { border-color:rgba(92,76,53,.10); }
      .ma-theme-light .ma-table-wrap tbody tr:hover { background:rgba(198,163,107,.08); }
      .ma-theme-light .ma-studio-unit { background:rgba(255,253,248,.55); border-color:rgba(92,76,53,.12); color:#2a2722; }
      .ma-theme-light .ma-studio-unit:hover, .ma-theme-light .ma-studio-unit.active { background:#fffdf8; border-color:rgba(168,121,62,.55); box-shadow:0 12px 30px rgba(69,52,30,.08); }
      .ma-theme-light .ma-checkout-alert { background:linear-gradient(115deg,rgba(198,163,107,.13),rgba(255,253,248,.92)); }
      .ma-theme-light .ma-checkout-alert.is-overdue { background:linear-gradient(115deg,rgba(155,64,52,.10),rgba(255,253,248,.92)); }
      .ma-theme-light .ma-integration-status { background:#f3eee5; border-color:rgba(92,76,53,.15); color:#61594f; }
      .ma-theme-light .ma-integration-status.is-live { color:#315744; background:#e8f0e8; }
      .ma-theme-light .ma-pingate > svg { color:#a8793e; }
      .ma-theme-light .ma-toast { background:#29251f; }
      .ma-theme-light .ma-gallery-open { background:rgba(32,29,24,.76); color:#fff8ed; }
      .ma-theme-light .ma-gallery-price strong { color:#25211c; }

      @media print {
        @page { size:A4; margin:12mm; }
        body { background:#fff !important; }
        .no-print, .ma-topbar, .ma-footer, .ma-whatsapp-fab { display:none !important; }
        .ma-app { background:#fff !important; color:#111 !important; }
        .ma-main { max-width:none; padding:0; }
        .ma-confirmation-screen { min-height:auto !important; padding:0 !important; }
        .ma-confirmation-card { width:100%; max-width:none; margin:0; padding:28px; border:1px solid #d8c7aa; border-radius:0; box-shadow:none; background:#fff !important; color:#111 !important; position:relative; overflow:hidden; }
        .ma-confirmation-card:before { content:"MA LUXURY"; display:block; letter-spacing:.28em; font-size:12px; color:#9c7544; margin-bottom:26px; }
        .ma-confirmation-icon { width:52px; height:52px; border:1px solid #c6a36b; color:#9c7544; }
        .ma-confirmation-card h1 { font-family:'Playfair Display',serif; font-size:34px; margin:8px 0 10px; color:#111; }
        .ma-confirmation-copy,.ma-muted { color:#555 !important; }
        .ma-confirmation-details { border-top:1px solid #ddd; border-bottom:1px solid #ddd; margin:24px 0; display:grid; grid-template-columns:1fr 1fr; }
        .ma-detail { padding:13px 0; border-bottom:1px solid #eee; }
        .ma-detail span { color:#777; } .ma-detail strong { color:#111; }
        .ma-pay-block { break-inside:avoid; border:1px solid #ddd; background:#faf8f3 !important; }
        .ma-qr { width:130px; height:130px; }
      }
\n      /* ==================== MOBILE APP EXPERIENCE ==================== */\n      .ma-mobile-nav { display:none; }\n\n      @media (max-width: 650px) {\n        .ma-app { min-height:100dvh; padding-bottom:78px; background:var(--paper); }\n        .ma-topbar { position:sticky; top:0; min-height:64px; height:64px; padding:10px 16px; border-bottom:1px solid rgba(198,163,107,.22); box-shadow:0 8px 30px rgba(0,0,0,.10); backdrop-filter:blur(18px); z-index:60; }\n        .ma-brand { min-width:0; gap:9px; flex:1; }\n        .ma-brand-mark { width:34px; height:34px; border-radius:11px; background:rgba(198,163,107,.10); font-size:13px; }\n        .ma-brand-name { font-size:14px; white-space:nowrap; }\n        .ma-brand-sub { font-size:7px; letter-spacing:.12em; }\n        .ma-nav, .ma-topbar-actions { display:none !important; }\n        .ma-main { width:100%; max-width:none; margin:0; padding:14px 14px 28px; }\n        .ma-conversation { min-height:calc(100dvh - 64px); margin:-14px -14px -28px; padding:22px 16px 34px; border-radius:0; background:linear-gradient(180deg, var(--ink-2) 0%, var(--ink) 100%); }\n        .ma-theme-light .ma-conversation { background:linear-gradient(180deg, #f8f4ec 0%, #eee8dd 100%); }\n        .ma-conversation-intro h1 { font-size:38px; line-height:1.02; letter-spacing:-.035em; }\n        .ma-conversation-intro { margin-bottom:24px; }\n        .ma-question-card { border-radius:22px; padding:20px 18px; border-color:rgba(198,163,107,.24); box-shadow:0 20px 50px rgba(0,0,0,.18); }\n        .ma-question-card h2 { font-size:20px; line-height:1.22; }\n        .ma-conversation-input { min-height:60px; height:auto; border-radius:17px; font-size:16px; padding:14px 16px; }\n        .ma-conversation-footer { gap:8px; }\n        .ma-conversation-footer .ma-btn { min-height:50px; border-radius:15px; }\n        .ma-page-shell { width:100%; }\n        .ma-page-hero, .ma-dashboard-heading { padding:4px 2px 16px; gap:12px; }\n        .ma-page-hero h1, .ma-dashboard-heading h1 { font-size:34px; line-height:1.02; letter-spacing:-.035em; }\n        .ma-panel, .ma-section-panel { border-radius:22px; padding:20px 17px; box-shadow:0 12px 35px rgba(0,0,0,.08); }\n        .ma-dashboard-grid, .ma-occupancy-kpis { gap:10px; }\n        .ma-kpi, .ma-stat-tile, .ma-occupancy-stat { border-radius:18px; padding:16px; }\n        .ma-apartment-card, .ma-gallery-card, .ma-hover-card { border-radius:20px; }\n        .ma-search-row { display:grid; grid-template-columns:1fr; gap:10px; }\n        .ma-search-submit { width:100%; min-height:50px; border-radius:15px; }\n        .ma-availability-side { gap:10px; }\n        .ma-availability-card { border-radius:24px; padding:22px 18px; }\n        .ma-confirmation-screen { min-height:calc(100dvh - 150px); }\n        .ma-confirmation-card { border-radius:24px; padding:30px 18px; }\n        .ma-confirmation-card h1 { font-size:34px; }\n        .ma-modal-backdrop { padding:12px; }\n        .ma-modal { border-radius:22px; padding:20px 16px; max-height:90dvh; }\n        .ma-actions { width:100%; }\n        .ma-actions .ma-btn { flex:1; min-height:48px; border-radius:14px; }\n        .ma-whatsapp-fab { right:16px; bottom:92px; width:48px; height:48px; padding:0; border-radius:50%; display:grid; place-items:center; box-shadow:0 12px 28px rgba(0,0,0,.22); z-index:45; }\n        .ma-whatsapp-fab span { display:none; }\n        .ma-footer { display:none; }\n        .ma-mobile-nav { display:block; position:fixed; left:10px; right:10px; bottom:10px; z-index:100; padding:7px; border:1px solid rgba(198,163,107,.25); border-radius:23px; background:rgba(17,18,20,.94); box-shadow:0 18px 50px rgba(0,0,0,.30); backdrop-filter:blur(22px); }\n        .ma-theme-light .ma-mobile-nav { background:rgba(255,253,248,.96); border-color:#d8d0c2; box-shadow:0 18px 50px rgba(35,29,20,.16); }\n        .ma-mobile-nav-inner { display:grid; grid-template-columns:repeat(4,1fr); align-items:end; gap:3px; }\n        .ma-mobile-nav-item { min-width:0; min-height:54px; padding:5px 3px; border:0; background:transparent; color:#8e9096; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; border-radius:17px; font-size:8px; letter-spacing:.03em; transition:.2s ease; }\n        .ma-mobile-nav-item.active { color:#fff8ed; background:rgba(198,163,107,.13); }\n        .ma-theme-light .ma-mobile-nav-item { color:#77736b; }\n        .ma-theme-light .ma-mobile-nav-item.active { color:#1a1a18; background:#eee6d8; }\n        .ma-mobile-nav-icon { width:28px; height:28px; display:grid; place-items:center; border-radius:10px; }\n        .ma-mobile-nav-item.active .ma-mobile-nav-icon { color:var(--brass); }\n        .ma-mobile-nav-brand { border:1px solid var(--brass); color:var(--brass) !important; font-family:'Playfair Display',serif; font-size:8px; letter-spacing:.08em; }\n        .ma-mobile-nav-more { margin-top:-9px; }\n        .ma-mobile-nav-more .ma-mobile-nav-icon { width:43px; height:43px; border-radius:50%; background:var(--brass); color:#171717 !important; border:4px solid var(--ink-2); box-shadow:0 8px 22px rgba(198,163,107,.25); }\n        .ma-theme-light .ma-mobile-nav-more .ma-mobile-nav-icon { border-color:#fffdf8; }\n      }\n


      /* ==================== PREMIUM BLACK / NEON GUEST UI ==================== */
      .ma-app { --ma-neon:#F9FF21; --ma-black:#070705; --ma-charcoal:#1B1B19; --ma-white:#F7F7F2; --ma-muted:#9A9A92; }
      .ma-app .ma-conversation { background:var(--ma-black); color:var(--ma-white); font-family:'DM Sans',Inter,Arial,sans-serif; }
      .ma-app .ma-conversation::before { width:900px; height:900px; top:-420px; right:-300px; background:radial-gradient(circle, rgba(249,255,33,.09), transparent 64%); }
      .ma-app .ma-conversation-intro h1 { font-family:'Inter',Arial,sans-serif; font-weight:500; letter-spacing:-.055em; background:linear-gradient(100deg,#f5f5ef 0%,#9c9c93 100%); -webkit-background-clip:text; background-clip:text; }
      .ma-app .ma-conversation-intro h1 em { color:var(--ma-neon); -webkit-text-fill-color:var(--ma-neon); font-style:normal; }
      .ma-app .ma-conversation-brand,.ma-app .ma-eyebrow { color:var(--ma-neon); }
      .ma-app .ma-step-count,.ma-app .ma-question-meta { color:#77776f; }
      .ma-app .ma-question-card { background:rgba(27,27,25,.82); border:1px solid rgba(255,255,255,.08); border-radius:24px; box-shadow:0 30px 90px rgba(0,0,0,.38), inset 0 1px 0 rgba(255,255,255,.04); padding:30px; backdrop-filter:blur(18px); }
      .ma-app .ma-question-card h2 { color:#f1f1eb; font-weight:500; }
      .ma-app .ma-conversation-input { background:#10100e; color:#f5f5ef; border-color:#2d2d29; border-radius:16px; }
      .ma-app .ma-conversation-input:focus { border-color:rgba(249,255,33,.7); box-shadow:0 0 0 4px rgba(249,255,33,.08); }
      .ma-app .ma-next-circle { background:var(--ma-neon); border-color:var(--ma-neon); color:#070705; box-shadow:0 8px 28px rgba(249,255,33,.15); }
      .ma-app .ma-next-circle:hover { transform:translateX(3px) scale(1.04); }
      .ma-app .ma-progress-track { background:#242420; height:4px; border-radius:999px; }
      .ma-app .ma-progress-fill { background:var(--ma-neon); border-radius:999px; box-shadow:0 0 18px rgba(249,255,33,.28); }
      .ma-app .ma-review-dock { background:rgba(27,27,25,.92); border-color:#30302b; border-radius:20px; }
      .ma-app .ma-btn-primary { background:var(--ma-neon); color:#070705; border-color:var(--ma-neon); font-weight:700; border-radius:12px; box-shadow:0 12px 30px rgba(249,255,33,.12); }
      .ma-app .ma-btn-primary:hover:not(:disabled) { background:#ffff5a; color:#070705; transform:translateY(-2px); }
      .ma-app .ma-btn-ghost { color:#f5f5ef; border-color:#373731; background:#11110f; border-radius:12px; }
      .ma-app .ma-btn-ghost:hover:not(:disabled) { border-color:var(--ma-neon); }

      .ma-home-hero { width:min(1180px,100%); margin:14px auto 38px; display:grid; grid-template-columns:1.08fr .92fr; gap:34px; align-items:end; position:relative; z-index:2; }
      .ma-home-hero-copy { padding:20px 0 0 4px; }
      .ma-home-pill { display:inline-flex; align-items:center; gap:7px; padding:8px 11px; border:1px solid rgba(249,255,33,.22); border-radius:999px; color:#dcdcce; background:rgba(249,255,33,.05); font-size:9px; letter-spacing:.14em; }
      .ma-home-hero h1 { margin:18px 0 16px; font-family:'Inter',Arial,sans-serif; font-size:clamp(48px,6.5vw,88px); line-height:.9; letter-spacing:-.07em; color:#f8f8f3; font-weight:500; }
      .ma-home-hero h1 em { color:var(--ma-neon); font-style:normal; }
      .ma-home-hero p { max-width:560px; margin:0; color:#9b9b93; font-size:14px; line-height:1.7; }
      .ma-home-actions { display:flex; align-items:center; gap:18px; margin-top:24px; }
      .ma-home-cta { display:inline-flex; align-items:center; gap:10px; border:0; border-radius:999px; padding:14px 18px; background:var(--ma-neon); color:#070705; font-weight:700; cursor:pointer; box-shadow:0 16px 34px rgba(249,255,33,.12); }
      .ma-home-cta:hover { transform:translateY(-2px); box-shadow:0 20px 40px rgba(249,255,33,.18); }
      .ma-home-location { color:#85857d; font-size:11px; display:inline-flex; align-items:center; gap:7px; }
      .ma-live-dot { width:7px; height:7px; border-radius:50%; background:var(--ma-neon); box-shadow:0 0 10px rgba(249,255,33,.65); }
      .ma-home-hero-visual { position:relative; min-height:360px; border-radius:28px; overflow:hidden; border:1px solid rgba(255,255,255,.09); background:#151513; box-shadow:0 30px 100px rgba(0,0,0,.42); }
      .ma-home-hero-visual::after { content:""; position:absolute; inset:0; background:linear-gradient(180deg,transparent 35%,rgba(7,7,5,.9) 100%); pointer-events:none; }
      .ma-home-hero-visual img { width:100%; height:100%; min-height:360px; object-fit:cover; display:block; filter:saturate(.78) contrast(1.03); }
      .ma-home-visual-card { position:absolute; z-index:1; left:20px; right:20px; bottom:18px; display:grid; gap:4px; }
      .ma-home-visual-card span { color:var(--ma-black); font-size:8px; letter-spacing:.2em; }
      .ma-home-visual-card strong { color:#fff; font-size:21px; font-weight:500; }
      .ma-home-visual-card small { color:#aaa99f; font-size:10px; }
      .ma-feature-strip { width:min(1180px,100%); margin:0 auto 42px; display:grid; grid-template-columns:repeat(3,1fr); gap:10px; position:relative; z-index:2; }
      .ma-feature-card { min-height:82px; padding:7px; border:1px solid #282824; border-radius:18px; background:#11110f; color:#fff; display:grid; grid-template-columns:72px 1fr auto; gap:12px; align-items:center; text-align:left; cursor:pointer; transition:.25s ease; }
      .ma-feature-card:hover { border-color:rgba(249,255,33,.55); transform:translateY(-3px); }
      .ma-feature-card img { width:72px; height:68px; object-fit:cover; border-radius:13px; }
      .ma-feature-card span { min-width:0; display:grid; gap:2px; }
      .ma-feature-card small { color:#77776f; text-transform:uppercase; font-size:8px; letter-spacing:.13em; }
      .ma-feature-card strong { color:#f3f3ee; font-size:13px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .ma-feature-card b { color:var(--ma-neon); font-size:10px; font-weight:600; }
      .ma-feature-card i { color:#77776f; font-style:normal; font-weight:400; }
      .ma-feature-card > svg { color:#77776f; }

      .ma-apartment-picker { width:100%; }
      .ma-picker-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin:0 0 16px; }
      .ma-picker-tabs button { border:1px solid #30302b; border-radius:13px; background:#11110f; color:#898981; padding:11px 8px; display:flex; flex-direction:column; align-items:center; gap:2px; cursor:pointer; transition:.2s ease; }
      .ma-picker-tabs button span { font-size:13px; font-weight:700; color:inherit; }
      .ma-picker-tabs button small { font-size:8px; text-transform:uppercase; letter-spacing:.12em; }
      .ma-picker-tabs button:hover { border-color:#5b5b4f; color:#fff; }
      .ma-picker-tabs button.is-active { background:var(--ma-neon); color:#070705; border-color:var(--ma-neon); box-shadow:0 10px 26px rgba(249,255,33,.11); }
      .ma-picker-tabs button.is-active span,.ma-picker-tabs button.is-active small { color:#070705; }
      .ma-apartment-picker-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .ma-apartment-option { position:relative; overflow:hidden; display:grid; grid-template-columns:112px 1fr 26px; gap:13px; align-items:center; min-height:112px; padding:8px; text-align:left; border:1px solid #2d2d29; border-radius:17px; background:#10100e; color:#f5f5ef; cursor:pointer; transition:.24s ease; }
      .ma-apartment-option:hover { border-color:#6b6b5a; transform:translateY(-2px); }
      .ma-apartment-option.is-selected { border-color:var(--ma-neon); background:linear-gradient(145deg,#171714,#10100e); box-shadow:0 12px 34px rgba(249,255,33,.08); }
      .ma-apartment-option-image { position:relative; height:94px; overflow:hidden; border-radius:12px; }
      .ma-apartment-option-image img { width:100%; height:100%; object-fit:cover; display:block; }
      .ma-apartment-option-badge { position:absolute; left:6px; bottom:6px; padding:4px 6px; border-radius:999px; background:rgba(7,7,5,.72); color:#fff; font-size:6px; letter-spacing:.12em; }
      .ma-apartment-option.is-selected .ma-apartment-option-badge { background:var(--ma-neon); color:#070705; }
      .ma-apartment-option-copy { display:grid; gap:4px; min-width:0; }
      .ma-apartment-option-copy strong { font-size:16px; font-weight:600; }
      .ma-apartment-option-copy span { color:#85857d; font-size:9px; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
      .ma-apartment-option-copy b { color:var(--ma-neon); font-size:11px; }
      .ma-apartment-option-copy b small { color:#73736b; font-weight:400; }
      .ma-apartment-option-check { width:26px; height:26px; display:grid; place-items:center; border:1px solid #3b3b34; border-radius:50%; color:#65655d; }
      .ma-apartment-option.is-selected .ma-apartment-option-check { background:var(--ma-neon); border-color:var(--ma-neon); color:#070705; }
      .ma-selected-apartment-note { display:flex; align-items:center; justify-content:center; gap:6px; margin:-6px 0 14px; color:var(--ma-neon); font-size:10px; }

      .ma-calendar-picker { border:1px solid #2d2d29; border-radius:20px; background:#10100e; padding:16px; box-shadow:inset 0 1px 0 rgba(255,255,255,.03); }
      .ma-calendar-head { display:flex; justify-content:space-between; align-items:center; gap:15px; padding:2px 2px 12px; }
      .ma-calendar-head div:first-child { display:grid; gap:3px; text-align:left; }
      .ma-calendar-head span { color:#6f6f68; font-size:8px; letter-spacing:.15em; }
      .ma-calendar-head strong { color:#f5f5ef; font-size:15px; font-weight:600; }
      .ma-calendar-nav { display:flex; gap:6px; }
      .ma-calendar-nav button { width:32px; height:32px; display:grid; place-items:center; border:1px solid #34342f; border-radius:10px; background:#181815; color:#a3a39a; cursor:pointer; }
      .ma-calendar-nav button:hover { border-color:var(--ma-neon); color:var(--ma-neon); }
      .ma-calendar-month { padding:11px 2px 10px; color:#f3f3ed; font-size:13px; font-weight:600; }
      .ma-calendar-weekdays,.ma-calendar-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:5px; }
      .ma-calendar-weekdays span { text-align:center; color:#5f5f58; font-size:8px; padding:5px 0; }
      .ma-calendar-grid button,.ma-calendar-empty { aspect-ratio:1; min-width:0; border-radius:10px; }
      .ma-calendar-grid button { border:1px solid transparent; background:transparent; color:#d9d9d2; cursor:pointer; font-size:11px; }
      .ma-calendar-grid button:hover:not(:disabled) { background:#20201c; border-color:#414139; color:#fff; }
      .ma-calendar-grid button.is-today { color:var(--ma-neon); font-weight:700; }
      .ma-calendar-grid button.is-selected { background:var(--ma-neon); color:#070705; border-color:var(--ma-neon); font-weight:800; box-shadow:0 6px 18px rgba(249,255,33,.18); }
      .ma-calendar-grid button:disabled { color:#393934; cursor:not-allowed; }
      .ma-calendar-foot { display:flex; gap:15px; padding:12px 2px 0; color:#6d6d65; font-size:8px; }
      .ma-calendar-foot span { display:inline-flex; align-items:center; gap:5px; }
      .ma-calendar-foot i,.ma-calendar-foot b { width:7px; height:7px; border-radius:50%; display:inline-block; background:#42423b; }
      .ma-calendar-foot b { background:var(--ma-neon); }

      .ma-app .ma-availability-overlay { background:rgba(7,7,5,.86); }
      .ma-app .ma-availability-card { background:#151513; border-color:#35352e; color:#f5f5ef; }
      .ma-app .ma-review-summary { border-color:#30302b; background:#30302b; }
      .ma-app .ma-review-summary span { background:#1b1b19; color:#d7d7d0; }

      @media (max-width: 850px) {
        .ma-home-hero { grid-template-columns:1fr; gap:18px; }
        .ma-home-hero-copy { padding-top:0; }
        .ma-home-hero-visual { min-height:300px; }
        .ma-home-hero-visual img { min-height:300px; }
        .ma-feature-strip { grid-template-columns:1fr; }
        .ma-apartment-picker-grid { grid-template-columns:1fr; }
      }
      @media (max-width: 650px) {
        .ma-home-hero { margin:0 auto 24px; gap:16px; }
        .ma-home-hero h1 { font-size:48px; }
        .ma-home-hero p { font-size:12px; }
        .ma-home-hero-visual { min-height:260px; border-radius:22px; }
        .ma-home-hero-visual img { min-height:260px; }
        .ma-feature-strip { margin-bottom:28px; }
        .ma-feature-card { grid-template-columns:60px 1fr auto; min-height:72px; }
        .ma-feature-card img { width:60px; height:58px; }
        .ma-question-card { padding:18px 14px; }
        .ma-apartment-option { grid-template-columns:82px 1fr 25px; min-height:98px; }
        .ma-apartment-option-image { height:82px; }
        .ma-apartment-option-copy strong { font-size:14px; }
        .ma-apartment-option-copy span { font-size:8px; }
        .ma-picker-tabs button span { font-size:11px; }
        .ma-picker-tabs button small { font-size:7px; }
        .ma-calendar-picker { padding:12px; }
      }
    `}</style>
  );
}
