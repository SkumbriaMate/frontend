"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar, Database, Settings, LogOut, Pencil, Trash2, Timer,
  Users, Monitor, Star, Building, CheckCircle, XCircle, Phone,
  Clock, History, ChevronDown, BarChart2, Menu, X, RotateCw, ImagePlus,
  Store, DoorClosed, Megaphone, BarChart3, Eye, MousePointer, Gamepad2,
  UserPlus,
} from "lucide-react";
import StationTimerCard from "@/components/StationTimerCard";
import StationManagementModal from "@/components/StationManagementModal";
import AdvertisementsAdmin from "@/components/AdvertisementsAdmin";
import FileChooserWithPreview from "@/components/FileChooserWithPreview";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import { io as makeIo } from "socket.io-client";

type DashboardData = {
  companies: any[]; website_settings: any; staff_members: any[]; staff_permissions?: { staff_member_id: string; section_key: string }[];
  resource_types: any[]; resources: any[]; pricing_rules: any[]; reservations: any[];
  events: any[]; resource_images: any[]; company_images: any[]; game_banners: any[]; advertisements: any[]; reviews: any[]; sessions: any[];
  userRole?: string; userPermissions?: string[];
};

const TABS = [
  { id: "timers",       label: "ტაიმერი",       icon: Timer },
  { id: "history",      label: "ისტორია",        icon: History },
  { id: "resources",    label: "მოწყობილობები",  icon: Monitor },
  { id: "reservations", label: "ჯავშნები",   icon: Calendar },
  { id: "reviews",      label: "მიმოხილვები",    icon: Star },
  { id: "gallery",      label: "ვებ ფოტოების მართვა", icon: ImagePlus, ownerOnly: true },
  { id: "game-banners", label: "თამაშის ბანერები", icon: Gamepad2, ownerOnly: true },
  { id: "advertisements", label: "რეკლამები", icon: Megaphone, ownerOnly: true },
  { id: "company",      label: "კომპანია",       icon: Building },
  { id: "revenue",      label: "ბრუნვა",         icon: BarChart2, ownerOnly: true },
  { id: "staff",        label: "პერსონალი",      icon: Users, ownerOnly: true },
];

const S = {
  root: { fontFamily: "'DM Sans', sans-serif", minHeight: "100vh", background: "#0e0e10", color: "#c8c8d0", touchAction: "manipulation" as const },
  page: { maxWidth: 1200, margin: "0 auto", padding: "0 16px 40px" },
  h1: { fontSize: "clamp(16px,4vw,20px)", fontWeight: 700, color: "#f0f0f2", letterSpacing: "-0.02em", margin: 0 },
  h2: { fontSize: 15, fontWeight: 600, color: "#f0f0f2", margin: 0 },
  mono: { fontFamily: "'DM Mono', monospace" },
  card: { background: "#16161a", border: "1px solid #252529", borderRadius: 14, padding: 20 },
  cardSm: { background: "#16161a", border: "1px solid #252529", borderRadius: 12, padding: 14 },
  label: { fontSize: 10, fontWeight: 700, color: "#4a4a55", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
  muted: { fontSize: 13, color: "#6b6b75" },
  pill: (active: boolean, danger?: boolean) => ({
    display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px",
    borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
    background: danger ? "rgba(220,60,60,0.08)" : active ? "rgba(80,200,80,0.08)" : "rgba(255,255,255,0.04)",
    color: danger ? "#e07070" : active ? "#60c860" : "#6b6b75",
    border: `1px solid ${danger ? "rgba(220,60,60,0.18)" : active ? "rgba(80,200,80,0.18)" : "#252529"}`,
  }),
  input: {
    width: "100%", background: "#0e0e10", border: "1px solid #252529", borderRadius: 10,
    padding: "11px 14px", color: "#f0f0f2", fontSize: 13, fontFamily: "'DM Sans', sans-serif",
    outline: "none", boxSizing: "border-box" as const, transition: "border-color 0.2s",
  },
  btnPrimary: {
    padding: "10px 18px", background: "#f0f0f2", border: "none", borderRadius: 10,
    fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#0e0e10",
    cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
  },
  btnGhost: {
    padding: "9px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid #252529",
    borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    color: "#9a9aa5", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
  },
  btnDanger: {
    padding: "9px 14px", background: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.2)",
    borderRadius: 10, fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
    color: "#e07070", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s",
  },
  divider: { height: 1, background: "#1e1e22", margin: "0" },
  tr: { borderBottom: "1px solid #1e1e22", transition: "background 0.15s" },
  th: { padding: "10px 14px", fontSize: 10, fontWeight: 700, color: "#4a4a55", textTransform: "uppercase" as const, letterSpacing: "0.08em", whiteSpace: "nowrap" as const },
  td: { padding: "12px 14px", fontSize: 13, color: "#c8c8d0", verticalAlign: "middle" as const },
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [data, setData] = useState<DashboardData | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("timers");
  const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<any | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [historySort, setHistorySort] = useState<"newest" | "oldest">("newest");
  const [historyDate, setHistoryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [historyRefreshing, setHistoryRefreshing] = useState(false);
  const historyFilterRef = useRef({ activeTab: "", historyDate: "" });
  useEffect(() => { historyFilterRef.current = { activeTab, historyDate }; }, [activeTab, historyDate]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryTitle, setGalleryTitle] = useState("");
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [gameBannerUploading, setGameBannerUploading] = useState(false);
  const [gameBannerTitle, setGameBannerTitle] = useState("");
  const [gameBannerFile, setGameBannerFile] = useState<File | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [companyNameSaving, setCompanyNameSaving] = useState(false);
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [logoHeightInput, setLogoHeightInput] = useState("48");
  const [logoHeightSaving, setLogoHeightSaving] = useState(false);
  const [reservationActionId, setReservationActionId] = useState<string | null>(null);
  const [isOpenSaving, setIsOpenSaving] = useState(false);
  const [staffForm, setStaffForm] = useState({ email: "", password: "", full_name: "", phone: "", role: "staff", section_keys: [] as string[] });
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffEditId, setStaffEditId] = useState<string | null>(null);
  const [staffEditPerms, setStaffEditPerms] = useState<string[]>([]);
  const [staffEditSaving, setStaffEditSaving] = useState(false);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab");
    if (tab) setActiveTab(tab);
  }, []);

  useEffect(() => {
    const name = data?.website_settings?.site_name ?? data?.companies?.[0]?.name;
    if (name !== undefined) setCompanyNameInput(name || "");
  }, [data?.website_settings?.site_name, data?.companies?.[0]?.name]);

  useEffect(() => {
    const h = data?.website_settings?.logo_height ?? data?.companies?.[0]?.logo_height;
    if (h != null && h > 0) setLogoHeightInput(String(h));
  }, [data?.website_settings?.logo_height, data?.companies?.[0]?.logo_height]);

  // Close mobile menu when resizing to desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = () => { if (mq.matches) setMobileMenuOpen(false); };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.history.pushState(null, "", `?tab=${tabId}`);
  };

  const handleConfirmReservation = async (id: string) => {
    setReservationActionId(`${id}-confirm`);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const r = await fetch(`${apiUrl}/api/admin/reservations/${id}/confirm`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      if (r.ok && data) setData({ ...data, reservations: data.reservations.map(rv => rv.id === id ? { ...rv, status: "confirmed" } : rv) });
    } catch { } finally { setReservationActionId(null); }
  };

  const handleCancelReservation = async (id: string) => {
    if (!(await confirm({ message: "ნამდვილებელ გსურთ გააუქმოთ?", danger: true }))) return;
    setReservationActionId(`${id}-cancel`);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const r = await fetch(`${apiUrl}/api/admin/reservations/${id}/cancel`, {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      if (r.ok && data) setData({ ...data, reservations: data.reservations.map(rv => rv.id === id ? { ...rv, status: "cancelled" } : rv) });
    } catch { } finally { setReservationActionId(null); }
  };

  const handleDeleteReservation = async (id: string) => {
    if (!(await confirm({ message: "ნამდვილად გსურთ რეზერვაციის წაშლა?", danger: true }))) return;
    setReservationActionId(`${id}-delete`);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const r = await fetch(`${apiUrl}/api/admin/reservations/${id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
      });
      if (r.ok && data) setData({ ...data, reservations: data.reservations.filter(rv => rv.id !== id) });
    } catch { } finally { setReservationActionId(null); }
  };

  const getStatusStyle = (status: string): React.CSSProperties => S.pill(status === "confirmed", status === "cancelled") as React.CSSProperties;
  const getStatusText = (s: string) => s === "pending" ? "მოლოდინში" : s === "confirmed" ? "დადასტურდა" : s === "cancelled" ? "გაუქმდა" : s;

  const refetchDashboard = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const r = await fetch(`${apiUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
    if (r.ok) { const d = await r.json(); if (!d.sessions) d.sessions = []; if (!d.website_settings) d.website_settings = null; if (!d.advertisements) d.advertisements = []; if (!d.game_banners) d.game_banners = []; if (!d.staff_permissions) d.staff_permissions = []; setData(d); }
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem("admin_token");
      if (!token) { router.push("/admin"); return; }
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const r = await fetch(`${apiUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
        if (!r.ok) { if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; } throw new Error("ჩატვირთვა ვერ მოხერხდა"); }
        const d = await r.json();
        if (!d.sessions) d.sessions = []; if (!d.staff_permissions) d.staff_permissions = [];
        if (!d.website_settings) d.website_settings = null;
        if (!d.advertisements) d.advertisements = [];
        const { activeTab: tab, historyDate: date } = historyFilterRef.current;
        if (tab === "history" && date) {
          const r2 = await fetch(`${apiUrl}/api/admin/sessions?date=${date}`, { headers: { Authorization: `Bearer ${token}` } });
          if (r2.ok) { const { sessions } = await r2.json(); d.sessions = sessions ?? []; }
        }
        setData(d);
        setCompanyId(d.companies?.[0]?.id ?? d.resources?.[0]?.company_id ?? null);
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };
    fetchDashboard();
  }, [router]);

  useEffect(() => {
    if (activeTab !== "history") return;
    const fetchHistory = async () => {
      const token = localStorage.getItem("admin_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!token) return;
      setHistoryLoading(true);
      try {
        const url = `${apiUrl}/api/admin/sessions?date=${historyDate}`;
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) { const { sessions } = await r.json(); setData(prev => prev ? { ...prev, sessions } : null); }
        else if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); }
      } finally { setHistoryLoading(false); }
    };
    fetchHistory();
  }, [activeTab, historyDate, router]);

  useEffect(() => {
    if (!companyId) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    const socket = makeIo(apiUrl, { transports: ["websocket"] });
    const refreshSessions = () => {
      const token = localStorage.getItem("admin_token");
      if (!token) return;
      const { activeTab: tab, historyDate: date } = historyFilterRef.current;
      const url = tab === "history" && date ? `${apiUrl}/api/admin/sessions?date=${date}` : `${apiUrl}/api/admin/sessions`;
      fetch(url, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return null; } return r.json(); })
        .then(d => { if (d?.sessions != null) setData(prev => prev ? { ...prev, sessions: d.sessions } : prev); })
        .catch(console.error);
    };
    const refreshAll = () => {
      const token = localStorage.getItem("admin_token");
      if (!token) return;
      fetch(`${apiUrl}/api/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return null; } return r.json(); })
        .then(d => {
          if (d) {
            if (!d.sessions) d.sessions = [];
            const { activeTab: tab, historyDate: date } = historyFilterRef.current;
            if (tab === "history" && date) {
              fetch(`${apiUrl}/api/admin/sessions?date=${date}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r2 => r2.ok ? r2.json() : null)
                .then(sd => { if (sd?.sessions != null) d.sessions = sd.sessions; setData(d); })
                .catch(() => setData(d));
            } else {
              setData(d);
            }
          }
        })
        .catch(console.error);
    };
    socket.on("connect", () => socket.emit("join_company", companyId));
    socket.on("resource_status_changed", (payload: any) => {
      if (payload.companyId !== companyId) return;
      setData(prev => prev ? { ...prev, resources: prev.resources.map(r => r.id === payload.resourceId ? { ...r, status: payload.status } : r) } : prev);
      if (payload.sessionId) refreshSessions();
    });
    socket.on("reservation_update", refreshAll);
    socket.io.on("reconnect", refreshAll);
    return () => { socket.io.off("reconnect", refreshAll); socket.disconnect(); };
  }, [companyId, router]);

  const handleLogout = () => { localStorage.removeItem("admin_token"); router.push("/admin"); };

  const handleToggleOpen = async () => {
    if (!isOwner || isOpenSaving) return;
    const next = !(data?.website_settings?.is_open ?? true);
    setIsOpenSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/website-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_open: next }),
      });
      if (r.ok) {
        const { website_settings: ws } = await r.json();
        setData(prev => prev ? { ...prev, website_settings: ws ?? prev.website_settings } : null);
        toast.success(next ? "სალონი გახსნილია" : "სალონი დახურულია");
      } else toast.error("შეცდომა");
    } catch {
      toast.error("შეცდომა");
    } finally {
      setIsOpenSaving(false);
    }
  };

  const handleToggleResourceStatus = async (resourceId: string, currentStatus: string) => {
    const newStatus = currentStatus === "available" ? "inactive" : "available";
    const token = localStorage.getItem("admin_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      const r = await fetch(`${apiUrl}/api/admin/resources/${resourceId}`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: newStatus }) });
      if (!r.ok) throw new Error("სტატუსის შეცვლა ვერ მოხერხდა");
      const { resource: updated } = await r.json();
      setData(prev => prev ? { ...prev, resources: prev.resources.map(r => r.id === resourceId ? updated : r) } : null);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!(await confirm({ message: "ნამდვილად გსურთ წაშლა?", danger: true }))) return;
    const token = localStorage.getItem("admin_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      const r = await fetch(`${apiUrl}/api/admin/resources/${resourceId}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!r.ok) throw new Error("წაშლა ვერ მოხერხდა");
      setData(prev => prev ? { ...prev, resources: prev.resources.filter(r => r.id !== resourceId) } : null);
    } catch (err: any) { toast.error(err.message); }
  };

  const makeOverrideHandler = useCallback((resId: string) => async () => {
    const token = localStorage.getItem("admin_token");
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    try {
      const r = await fetch(`${apiUrl}/api/admin/resources/${resId}/status`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: "available" }) });
      if (r.ok) setData(prev => prev ? { ...prev, resources: prev.resources.map(r => r.id === resId ? { ...r, status: "available" } : r) } : null);
    } catch { }
  }, []);

  const handleSessionStart = useCallback((session: any) => {
    setData(prev => prev ? { ...prev, resources: prev.resources.map(r => r.id === session.resource_id ? { ...r, status: "occupied" } : r), sessions: [session, ...prev.sessions] } : prev);
  }, []);

  const handleSessionFinish = useCallback((newSession: any) => {
    setData(prev => prev ? { ...prev, sessions: [newSession, ...prev.sessions], resources: prev.resources.map(r => r.id === newSession.resource_id ? { ...r, status: "available" } : r) } : null);
  }, []);

  const calculateRevenue = (sessions: any[], filterType: string) => {
    if (!sessions?.length) return 0;
    return sessions.reduce((sum, s) => {
      const d = new Date(s.created_at);
      const amt = s.total_price || 0;
      if (filterType === "today") return d.toDateString() === selectedDate.toDateString() ? sum + amt : sum;
      if (filterType === "month") return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear ? sum + amt : sum;
      return sum + amt;
    }, 0);
  };

  const formatCurrency = (n: number) => `₾${n.toFixed(2)}`;

  const isOwner = data?.userRole === "owner";

  const renderTimerCard = (res: any) => {
    const activeSession = data?.sessions?.find(s => s.resource_id === res.id && s.duration_seconds === 0);
    return (
      <StationTimerCard
        key={res.id} id={res.id} name={res.name} code={res.code}
        pricePerHour={res.price_per_hour || 0} price1v1={res.price_1v1 || 0}
        price2v2={res.price_2v2 || 0} pricingMode={res.pricing_mode}
        status={res.status} initialSession={activeSession}
        isOwner={isOwner} isAdmin={true}
        onOverride={makeOverrideHandler(res.id)}
        onStart={handleSessionStart} onFinish={handleSessionFinish}
      />
    );
  };

  if (loading) return (
    <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div className="ad-spin" style={{ width: 32, height: 32, border: "2px solid #252529", borderTopColor: "#f0f0f2", borderRadius: "50%" }} />
        <span style={{ fontSize: 13, color: "#4a4a55" }}>იტვირთება...</span>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ ...S.root, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ ...S.card, maxWidth: 360, width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#e07070", marginBottom: 16 }}>{error}</div>
        <button onClick={() => window.location.reload()} style={{ ...S.btnPrimary, justifyContent: "center", width: "100%" }}>თავიდან ცდა</button>
      </div>
    </div>
  );

  const userPerms = data?.userPermissions ?? [];
  const activeTabs = TABS.filter(t => {
    if (t.ownerOnly && !isOwner) return false;
    if (isOwner) return true;
    return userPerms.includes(t.id);
  });
  const activeTabMeta = activeTabs.find(t => t.id === activeTab);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes ad-spin { to { transform: rotate(360deg); } }
        @keyframes tc-spin { to { transform: rotate(360deg); } }
        @keyframes tc-pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .ad-tr:hover td { background: rgba(255,255,255,0.015); }
        .ad-tab-btn:hover { color: #c8c8d0 !important; }
        .ad-idle-hover:hover { border-color: #3a3a42 !important; }
        .ad-icon-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .ad-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .ad-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .ad-scrollbar::-webkit-scrollbar-thumb { background: #252529; border-radius: 2px; }
        .ad-input:focus { border-color: #3a3a42 !important; }
        select.ad-input { -webkit-appearance: none; cursor: pointer; }
        @media (max-width: 768px) {
          .ad-input, input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="date"], input[type="url"], select, textarea { font-size: 16px !important; }
        }
        .ad-root-touch { touch-action: manipulation; }
      `}</style>

      <div style={S.root} className="flex min-h-screen ad-root-touch">
        {/* ── Left sidebar (desktop: always visible, mobile: overlay) ── */}
        <aside
          className={`fixed md:sticky top-0 left-0 z-40 h-screen w-[220px] flex-shrink-0 flex flex-col bg-[#0e0e10] border-r border-[#1e1e22] transition-transform md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-4 border-b border-[#1e1e22]">
            <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f2", letterSpacing: "-0.01em" }}>Game Portal</div>
            <div style={{ fontSize: 10, color: "#4a4a55", fontFamily: "'DM Mono', monospace" }}>ADMIN</div>
          </div>
          <nav className="flex-1 overflow-y-auto py-3 ad-scrollbar">
            {activeTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="ad-tab-btn w-full text-left px-4 py-2.5 flex items-center gap-3 border-none rounded-none"
                style={{
                  background: activeTab === tab.id ? "rgba(255,255,255,0.06)" : "transparent",
                  color: activeTab === tab.id ? "#f0f0f2" : "#6b6b75",
                  fontSize: 13,
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                  borderLeft: activeTab === tab.id ? "2px solid #f0f0f2" : "2px solid transparent",
                }}
              >
                <tab.icon size={16} />
                {tab.label}
                {tab.id === "reservations" && data?.reservations?.filter(r => r.status === "pending").length ? (
                  <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 5, background: "rgba(200,160,60,0.15)", color: "#c8a040", border: "1px solid rgba(200,160,60,0.2)", fontFamily: "'DM Mono', monospace" }}>
                    {data.reservations.filter(r => r.status === "pending").length}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile overlay when sidebar open */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} aria-hidden />
        )}

        {/* ── Main content area ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar: menu + open toggle + section name + logout */}
          <header style={{ background: "#0e0e10", borderBottom: "1px solid #1e1e22", position: "sticky", top: 0, zIndex: 20 }}>
            <div style={{ padding: "0 16px", height: 52, display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden flex items-center p-2 -ml-2 border-none bg-transparent text-[#6b6b75] cursor-pointer">
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              {isOwner && (
                <button
                  onClick={handleToggleOpen}
                  disabled={isOpenSaving}
                  title={data?.website_settings?.is_open !== false ? "ობიექტი ღიაა — დახურვა" : "ობიექტი დახურულია — გახსნა"}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 10px",
                    background: (data?.website_settings?.is_open !== false) ? "rgba(80,200,80,0.08)" : "rgba(220,120,60,0.08)",
                    border: (data?.website_settings?.is_open !== false) ? "1px solid rgba(80,200,80,0.25)" : "1px solid rgba(220,120,60,0.25)",
                    borderRadius: 8, color: (data?.website_settings?.is_open !== false) ? "#60c860" : "#d87a40",
                    fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", cursor: isOpenSaving ? "not-allowed" : "pointer", opacity: isOpenSaving ? 0.7 : 1,
                  }}
                >
                  {(data?.website_settings?.is_open !== false) ? <Store size={13} /> : <DoorClosed size={13} />}
                  <span className="hidden sm:inline">{(data?.website_settings?.is_open !== false) ? "ღიაა" : "დახურულია"}</span>
                </button>
              )}
              <span className="hidden md:inline" style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2" }}>{activeTabMeta?.label}</span>
              <div className="flex-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 flex-shrink-0"
                style={{
                  padding: "8px 12px",
                  background: "rgba(220,60,60,0.1)",
                  border: "1px solid rgba(220,60,60,0.25)",
                  borderRadius: 8,
                  color: "#e08080",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                }}
                title="გასვლა"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">გასვლა</span>
              </button>
            </div>
          </header>

          {/* ── Content ── */}
          <div style={{ flex: 1, width: "100%", padding: "0 16px 40px", overflow: "auto" }}>
          <div style={{ paddingTop: 24 }}>
            {/* KPI strip - below header, subtle */}
            <div className="flex flex-wrap gap-4 mb-6 py-3 border-b border-[#1e1e22]" style={{ marginTop: -8 }}>
              {[
                { label: "ჯავშნები", value: data?.reservations?.length || 0, note: data?.reservations?.filter((r: any) => r.status === "pending").length ? `${data?.reservations?.filter((r: any) => r.status === "pending").length} მოლოდინში` : undefined },
                { label: "სადგურები", value: data?.resources?.length || 0 },
                { label: "ღონისძიებები", value: data?.events?.length || 0 },
              ].map((kpi, i) => (
                <div key={i} className="flex items-baseline gap-2">
                  <span style={{ fontSize: 11, color: "#4a4a55", fontWeight: 600, textTransform: "uppercase" }}>{kpi.label}</span>
                  <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#f0f0f2" }}>{kpi.value}</span>
                  {kpi.note && <span style={{ fontSize: 10, color: "#c8a040", fontWeight: 600 }}>{kpi.note}</span>}
                </div>
              ))}
            </div>

            {/* ── TIMERS ── */}
            {activeTab === "timers" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={S.h1}>მოწყობილობების ტაიმერები</h2>
                  <span style={{ ...S.label, background: "rgba(255,255,255,0.03)", border: "1px solid #252529", padding: "4px 10px", borderRadius: 6 } as React.CSSProperties}>
                    {data?.resources?.length || 0} სადგური
                  </span>
                </div>

                {data?.resource_types?.map(type => {
                  const typeDevices = data?.resources?.filter(r => r.resource_type_id === type.id) ?? [];
                  if (!typeDevices.length) return null;
                  const std = typeDevices.filter(d => !d.is_vip).sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
                  const vip = typeDevices.filter(d => d.is_vip).sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
                  return (
                    <div key={type.id} style={{ marginBottom: 32 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#9a9aa5" }}>{type.name}</span>
                        <div style={{ flex: 1, height: 1, background: "#1e1e22" }} />
                      </div>
                      {std.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: vip.length ? 16 : 0 }}>
                          {std.map(renderTimerCard)}
                        </div>
                      )}
                      {vip.length > 0 && (
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "#9a7a45", background: "rgba(160,120,40,0.1)", border: "1px solid rgba(160,120,40,0.2)", padding: "3px 10px", borderRadius: 6 }}>VIP</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                            {vip.map(renderTimerCard)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {!data?.resources?.length && (
                  <div style={{ textAlign: "center", padding: "60px 24px", background: "#16161a", border: "1px dashed #252529", borderRadius: 14 }}>
                    <Timer size={28} color="#3a3a42" style={{ marginBottom: 12 }} />
                    <div style={{ fontSize: 14, color: "#9a9aa5", fontWeight: 600 }}>მოწყობილობები არ მოიძებნა</div>
                    <div style={{ fontSize: 12, color: "#4a4a55", marginTop: 6 }}>რესურსების ჩანართიდან დაამატეთ მოწყობილობები</div>
                  </div>
                )}
              </div>
            )}

            {/* ── RESERVATIONS ── */}
            {activeTab === "reservations" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={S.h1}>ჯავშნები</h2>
                  <span style={{ ...S.label, fontFamily: "'DM Mono', monospace" } as React.CSSProperties}>{data?.reservations?.length || 0}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data?.reservations?.map(res => (
                    <div key={res.id} style={{ ...S.card, padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ flex: "1 1 280px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f2" }}>{res.resource_name}</span>
                            <span style={getStatusStyle(res.status) as React.CSSProperties}>{getStatusText(res.status)}</span>
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                            {[
                              { icon: <Calendar size={12} />, text: new Date(res.reservation_date).toLocaleDateString("ka-GE") },
                              { icon: <Clock size={12} />, text: `${new Date(res.start_at).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })} – ${new Date(res.end_at).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}` },
                              { icon: <Users size={12} />, text: res.customer_name },
                              { icon: <Phone size={12} />, text: res.customer_phone },
                            ].map((item, i) => (
                              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: "#6b6b75", fontSize: 12 }}>
                                {item.icon}
                                <span>{item.text}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ marginTop: 10, fontSize: 13, fontFamily: "'DM Mono', monospace", color: "#9a9aa5", fontWeight: 600 }}>
                            ₾{res.total_price}
                          </div>
                        </div>

                        {(() => {
                          const startAt = res.start_at || (res.date && res.time ? `${res.date}T${res.time}:00` : null);
                          const startPassed = startAt ? new Date(startAt) < new Date() : false;
                          const canConfirm = res.status === "pending" && !startPassed;
                          const canCancel = res.status !== "cancelled" && !startPassed;
                          const loadingConfirm = reservationActionId === `${res.id}-confirm`;
                          const loadingCancel = reservationActionId === `${res.id}-cancel`;
                          const loadingDelete = reservationActionId === `${res.id}-delete`;
                          const btnDisabled = (loading: boolean): React.CSSProperties => loading ? { opacity: 0.7, cursor: "wait" } : { cursor: "pointer" };
                          return (
                            <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                              {canConfirm && (
                                <button onClick={() => handleConfirmReservation(res.id)} disabled={loadingConfirm} style={{ ...S.btnGhost, color: "#60c860", borderColor: "rgba(80,200,80,0.2)", background: "rgba(80,200,80,0.06)", fontSize: 12, ...btnDisabled(loadingConfirm) }}>
                                  {loadingConfirm ? <span className="ad-spin" style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(96,200,96,0.3)", borderTopColor: "#60c860", borderRadius: "50%" }} /> : <CheckCircle size={13} />} დადასტ.
                                </button>
                              )}
                              {canCancel && (
                                <button onClick={() => handleCancelReservation(res.id)} disabled={loadingCancel} style={{ ...S.btnDanger, fontSize: 12, ...btnDisabled(loadingCancel) }}>
                                  {loadingCancel ? <span className="ad-spin" style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(220,60,60,0.3)", borderTopColor: "#e07070", borderRadius: "50%" }} /> : <XCircle size={13} />} გაუქმება
                                </button>
                              )}
                              <button onClick={() => handleDeleteReservation(res.id)} disabled={loadingDelete} style={{ ...S.btnGhost, color: "#e07070", borderColor: "rgba(224,112,112,0.2)", background: "rgba(224,112,112,0.06)", fontSize: 12, ...btnDisabled(loadingDelete) }}>
                                {loadingDelete ? <span className="ad-spin" style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(224,112,112,0.3)", borderTopColor: "#e07070", borderRadius: "50%" }} /> : <Trash2 size={13} />} წაშლა
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  ))}
                  {!data?.reservations?.length && (
                    <div style={{ textAlign: "center", padding: "48px 24px", background: "#16161a", border: "1px dashed #252529", borderRadius: 14 }}>
                      <Calendar size={24} color="#3a3a42" style={{ marginBottom: 10 }} />
                      <div style={{ fontSize: 13, color: "#6b6b75" }}>ჯავშნები არ მოიძებნება</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── REVIEWS ── */}
            {activeTab === "reviews" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={S.h1}>მიმოხილვები</h2>
                  <span style={{ ...S.label, fontFamily: "'DM Mono', monospace" } as React.CSSProperties}>{data?.reviews?.length || 0}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data?.reviews?.map((rev: any) => (
                    <div key={rev.id} style={{ ...S.card, padding: "16px 20px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ flex: "1 1 280px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f2" }}>{rev.customer_name}</span>
                            <span style={S.pill(rev.status === "approved", rev.status === "rejected") as React.CSSProperties}>
                              {rev.status === "approved" ? "დამოწმებული" : rev.status === "rejected" ? "უარყოფილი" : "მოლოდინში"}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} size={14} style={{ color: n <= rev.rating ? "#e8b923" : "#3a3a42", fill: n <= rev.rating ? "#e8b923" : "none" }} />
                            ))}
                          </div>
                          {rev.comment && <p style={{ fontSize: 13, color: "#9a9aa5", margin: 0, lineHeight: 1.5 }}>{rev.comment}</p>}
                          <div style={{ marginTop: 8, fontSize: 11, color: "#4a4a55" }}>
                            {new Date(rev.created_at).toLocaleDateString("ka-GE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
                          {rev.status === "pending" && (
                            <>
                              <button
                                onClick={async () => {
                                  const token = localStorage.getItem("admin_token");
                                  if (!token) { router.push("/admin"); return; }
                                  try {
                                    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews/${rev.id}/status`, {
                                      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ status: "approved" }),
                                    });
                                    if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                                    if (r.ok && data) setData({ ...data, reviews: data.reviews.map(rv => rv.id === rev.id ? { ...rv, status: "approved" } : rv) });
                                    toast.success("მიმოხილვა დამოწმებულია");
                                  } catch { toast.error("შეცდომა"); }
                                }}
                                style={{ ...S.btnGhost, color: "#60c860", borderColor: "rgba(80,200,80,0.2)", background: "rgba(80,200,80,0.06)", fontSize: 12 }}
                              >
                                <CheckCircle size={13} /> დამოწმება
                              </button>
                              <button
                                onClick={async () => {
                                  const token = localStorage.getItem("admin_token");
                                  if (!token) { router.push("/admin"); return; }
                                  try {
                                    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews/${rev.id}/status`, {
                                      method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                      body: JSON.stringify({ status: "rejected" }),
                                    });
                                    if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                                    if (r.ok && data) setData({ ...data, reviews: data.reviews.map(rv => rv.id === rev.id ? { ...rv, status: "rejected" } : rv) });
                                    toast.success("მიმოხილვა უარყოფილია");
                                  } catch { toast.error("შეცდომა"); }
                                }}
                                style={{ ...S.btnDanger, fontSize: 12 }}
                              >
                                <XCircle size={13} /> უარყოფა
                              </button>
                            </>
                          )}
                          <button
                            onClick={async () => {
                              if (!(await confirm({ message: "ნამდვილად გსურთ ამ მიმოხილვის წაშლა?", danger: true }))) return;
                              const token = localStorage.getItem("admin_token");
                              if (!token) { router.push("/admin"); return; }
                              try {
                                const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/reviews/${rev.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                                if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                                if (r.ok && data) setData({ ...data, reviews: data.reviews.filter(rv => rv.id !== rev.id) });
                                toast.success("მიმოხილვა წაშლილია");
                              } catch { toast.error("შეცდომა"); }
                            }}
                            style={{ ...S.btnGhost, color: "#e07070", borderColor: "rgba(224,112,112,0.2)", background: "rgba(224,112,112,0.06)", fontSize: 12 }}
                          >
                            <Trash2 size={13} /> წაშლა
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!data?.reviews?.length && (
                    <div style={{ textAlign: "center", padding: "48px 24px", background: "#16161a", border: "1px dashed #252529", borderRadius: 14 }}>
                      <Star size={24} color="#3a3a42" style={{ marginBottom: 10 }} />
                      <div style={{ fontSize: 13, color: "#6b6b75" }}>მიმოხილვები არ მოიძებნება</div>
                      <div style={{ fontSize: 12, color: "#4a4a55", marginTop: 6 }}>მომხმარებლები საიტზე დატოვებენ მიმოხილვებს</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── RESOURCES ── */}
            {activeTab === "resources" && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <h2 style={S.h1}>მოწყობილობები</h2>
                  {isOwner && (
                    <button onClick={() => { setResourceToEdit(null); setIsResourceModalOpen(true); }} style={S.btnPrimary}>
                      + დამატება
                    </button>
                  )}
                </div>

                <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }} className="ad-scrollbar">
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 540 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1e1e22" }}>
                          {["მოწყობ.", "ტიპი", "ფასი", "სტატუსი", ""].map((h, i) => (
                            <th key={i} style={{ ...S.th, textAlign: i === 4 ? "right" : "left" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data?.resources?.map(res => {
                          const type = data.resource_types.find(t => t.id === res.resource_type_id);
                          const primaryImage = data.resource_images.find(img => img.resource_id === res.id && (img.sort_order === 0 || img.is_primary));
                          return (
                            <tr key={res.id} className="ad-tr" style={{ borderBottom: "1px solid #1e1e22" }}>
                              <td style={S.td}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "#0e0e10", border: "1px solid #252529", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {primaryImage ? (
                                      // eslint-disable-next-line @next/next/no-img-element -- dynamic URLs from API
                                      <img src={primaryImage.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : <Database size={14} color="#3a3a42" />}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2" }}>{res.code ? `${res.name} #${res.code}` : res.name}</div>
                                    {res.is_vip && <span style={{ fontSize: 9, fontWeight: 700, color: "#9a7a45", letterSpacing: "0.06em" }}>VIP</span>}
                                  </div>
                                </div>
                              </td>
                              <td style={{ ...S.td, color: "#6b6b75" }}>{type?.name || "—"}</td>
                              <td style={S.td}>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "#c8c8d0" }}>
                                  {res.pricing_mode === "ps_mode" ? `₾${res.price_1v1} / ₾${res.price_2v2}` : `₾${res.price_per_hour}/სთ`}
                                </span>
                              </td>
                              <td style={S.td}>
                                <span style={S.pill(res.status === "available", res.status === "inactive") as React.CSSProperties}>
                                  {res.status === "available" ? "აქტიური" : res.status === "maintenance" ? "რემონტი" : "გამორთული"}
                                </span>
                              </td>
                              <td style={{ ...S.td, textAlign: "right" }}>
                                {isOwner ? (
                                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
                                    {[
                                      { icon: <Pencil size={13} />, onClick: () => { setResourceToEdit(res); setIsResourceModalOpen(true); }, color: "#9a9aa5" },
                                      { icon: <Settings size={13} />, onClick: () => handleToggleResourceStatus(res.id, res.status), color: "#9a9aa5" },
                                      { icon: <Trash2 size={13} />, onClick: () => handleDeleteResource(res.id), color: "#e07070" },
                                    ].map((btn, i) => (
                                      <button key={i} onClick={btn.onClick} className="ad-icon-btn"
                                        style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid #252529", color: btn.color, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
                                        {btn.icon}
                                      </button>
                                    ))}
                                  </div>
                                ) : <span style={{ color: "#3a3a42", fontSize: 13 }}>—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <StationManagementModal
                  isOpen={isResourceModalOpen}
                  onClose={() => { setIsResourceModalOpen(false); setResourceToEdit(null); }}
                  resourceTypes={data?.resource_types || []}
                  existingResources={data?.resources || []}
                  initialData={resourceToEdit}
                  currentImageUrl={resourceToEdit ? (data?.resource_images?.find((img: any) => img.resource_id === resourceToEdit.id && (img.sort_order === 0 || img.is_primary))?.image_url) : null}
                  onImagesUpdated={refetchDashboard}
                  onAdd={(newResource: any) => {
                    setData(prev => prev ? { ...prev, resources: resourceToEdit ? prev.resources.map(r => r.id === newResource.id ? newResource : r) : [newResource, ...prev.resources] } : null);
                  }}
                  onDelete={(deletedId: string) => { setData(prev => prev ? { ...prev, resources: prev.resources.filter(r => r.id !== deletedId) } : null); }}
                />
              </div>
            )}

            {/* ── HISTORY ── */}
            {activeTab === "history" && (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
                  <h2 style={S.h1}>სესიების ისტორია</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <input
                      type="date"
                      value={historyDate}
                      onChange={e => setHistoryDate(e.target.value)}
                      className="ad-input"
                      style={{ ...S.input, width: "auto", minWidth: 140, fontSize: 12 }}
                    />
                    <div style={{ position: "relative" }}>
                      <select value={historySort} onChange={e => setHistorySort(e.target.value as "newest" | "oldest")} className="ad-input" style={{ ...S.input, width: "auto", paddingRight: 32, fontSize: 12, minWidth: 120 }}>
                        <option value="newest">ახალი → ძველი</option>
                        <option value="oldest">ძველი → ახალი</option>
                      </select>
                      <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#4a4a55" }} />
                    </div>
                    <button
                      onClick={async () => {
                        if (historyRefreshing) return;
                        setHistoryRefreshing(true);
                        setHistoryLoading(true);
                        try {
                          const token = localStorage.getItem("admin_token");
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                          const r = await fetch(`${apiUrl}/api/admin/sessions?date=${historyDate}`, { headers: { Authorization: `Bearer ${token}` } });
                          if (r.ok) { const { sessions } = await r.json(); setData(prev => prev ? { ...prev, sessions } : null); }
                        } finally { setHistoryRefreshing(false); setHistoryLoading(false); }
                      }}
                      disabled={historyRefreshing}
                      style={{ ...S.btnGhost, opacity: historyRefreshing ? 0.7 : 1, cursor: historyRefreshing ? "wait" : "pointer" }}
                    >
                      <RotateCw size={14} className={historyRefreshing ? "ad-spin" : undefined} />
                      განახლება
                    </button>
                  </div>
                </div>
                <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                  <div style={{ overflowX: "auto" }} className="ad-scrollbar">
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1e1e22" }}>
                          {["მოწყობ.", "რეჟიმი", "ხანგრძლ.", "ფასი", "თარიღი", "ვის შეუქმნა", "ვის დაასრულა"].map((h, i) => (
                            <th key={i} style={{ ...S.th, textAlign: i >= 4 ? "right" : "left" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {historyLoading ? (
                          <tr><td colSpan={7} style={{ padding: "48px 16px", textAlign: "center", verticalAlign: "middle" }}>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                              <div className="ad-spin" style={{ width: 28, height: 28, border: "2px solid #252529", borderTopColor: "#f0f0f2", borderRadius: "50%" }} />
                              <span style={{ fontSize: 13, color: "#4a4a55" }}>იტვირთება...</span>
                            </div>
                          </td></tr>
                        ) : (
                          <>
                            {[...(data?.sessions || [])]
                              .sort((a: any, b: any) => {
                                const ta = new Date(a.start_at || a.created_at || 0).getTime();
                                const tb = new Date(b.start_at || b.created_at || 0).getTime();
                                return historySort === "newest" ? tb - ta : ta - tb;
                              })
                              .map((s: any) => (
                              <tr key={s.id} className="ad-tr" style={{ borderBottom: "1px solid #1e1e22" }}>
                                <td style={{ ...S.td, color: "#f0f0f2", fontWeight: 600 }}>{s.resource_name}</td>
                                <td style={S.td}>
                                  <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'DM Mono', monospace", padding: "2px 7px", borderRadius: 5, background: "#0e0e10", color: "#6b6b75", border: "1px solid #252529" }}>{s.mode}</span>
                                </td>
                                <td style={{ ...S.td, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>
                                  {Math.floor(s.duration_seconds / 60)}წთ {s.duration_seconds % 60}წმ
                                </td>
                                <td style={{ ...S.td, fontFamily: "'DM Mono', monospace", fontWeight: 600, color: "#c8c8d0" }}>₾{s.total_price}</td>
                                <td style={{ ...S.td, color: "#4a4a55", fontSize: 11, textAlign: "right", whiteSpace: "nowrap" }}>
                                  {new Date(s.start_at || s.created_at).toLocaleDateString("ka-GE", { day: "numeric", month: "short", year: "numeric" })}
                                  {" · "}
                                  {new Date(s.start_at || s.created_at).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}
                                </td>
                                <td style={{ ...S.td, fontSize: 11, color: "#9a9aa5", textAlign: "right" }}>
                                  {(data?.staff_members || []).find((sm: any) => sm.id === s.started_by_staff_id)?.full_name || "—"}
                                </td>
                                <td style={{ ...S.td, fontSize: 11, color: "#9a9aa5", textAlign: "right" }}>
                                  {(data?.staff_members || []).find((sm: any) => sm.id === s.completed_by_staff_id)?.full_name || "—"}
                                </td>
                              </tr>
                            ))}
                            {!data?.sessions?.length && (
                              <tr><td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: "#3a3a42", fontSize: 13 }}>
                                ამ თარიღზე სესიები არ მოიძებნა ({new Date(historyDate + "T12:00:00").toLocaleDateString("ka-GE", { day: "numeric", month: "long", year: "numeric" })})
                              </td></tr>
                            )}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── GALLERY (company images + website hero/logo) ── */}
            {activeTab === "gallery" && isOwner && (
              <div>
                <h2 style={S.h1}>სივრცის ფოტოები და ვებსაიტი</h2>
                <p style={{ fontSize: 13, color: "#6b6b75", marginTop: 4, marginBottom: 24 }}>მთავარი ფოტო, ლოგო და გალერეა</p>

                {/* Website: name, hero, logo — compact row on desktop */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 32 }}>
                  <div style={{ ...S.card }}>
                    <div style={{ ...S.label as React.CSSProperties, marginBottom: 8 }}>საიტის სახელი</div>
                    <input type="text" value={companyNameInput} onChange={e => setCompanyNameInput(e.target.value)} placeholder="მაგ: Game Portal" style={{ ...S.input, width: "100%", marginBottom: 10 }} />
                    <button type="button" disabled={companyNameSaving} onClick={async () => {
                      const token = localStorage.getItem("admin_token");
                      if (!token) { router.push("/admin"); return; }
                      setCompanyNameSaving(true);
                      try {
                        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/website-settings`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ site_name: companyNameInput }) });
                        if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                        const result = await r.json();
                        if (!r.ok) throw new Error(result.error || "შეცდომა");
                        setData(prev => prev ? { ...prev, website_settings: result.website_settings ?? prev.website_settings } : null);
                        toast.success("საიტის სახელი განახლდა");
                      } catch (err: any) { toast.error(err.message || "შეცდომა"); } finally { setCompanyNameSaving(false); }
                    }} style={{ ...S.btnPrimary, width: "100%", opacity: companyNameSaving ? 0.6 : 1 }}>
                      {companyNameSaving ? "ინახება..." : "შენახვა"}
                    </button>
                  </div>
                  <div style={{ ...S.card }}>
                    <div style={{ ...S.label as React.CSSProperties, marginBottom: 8 }}>მთავარი ფოტო</div>
                    <FileChooserWithPreview
                      file={heroFile}
                      onChange={setHeroFile}
                      label=""
                      existingImageUrl={data?.website_settings?.hero_image_url ?? data?.companies?.[0]?.hero_image_url}
                      previewHeight={120}
                      objectFit="cover"
                    />
                    {heroFile && (
                      <button type="button" onClick={async () => {
                        const token = localStorage.getItem("admin_token");
                        if (!token) { router.push("/admin"); return; }
                        setHeroUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append("image", heroFile);
                          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/company/hero-image`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
                          if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                          if (!r.ok) throw new Error((await r.json()).error || "შეცდომა");
                          const { website_settings: ws } = await r.json();
                          setData(prev => prev ? { ...prev, website_settings: ws ?? prev.website_settings } : null);
                          setHeroFile(null);
                          toast.success("მთავარი ფოტო განახლდა");
                        } catch (err: any) { toast.error(err.message || "ატვირთვა ვერ მოხერხდა"); } finally { setHeroUploading(false); }
                      }} disabled={heroUploading} style={{ ...S.btnPrimary, width: "100%", marginTop: 10, opacity: heroUploading ? 0.6 : 1 }}>
                      {heroUploading ? "იტვირთება..." : "ატვირთვა"}
                    </button>
                    )}
                  </div>
                  <div style={{ ...S.card }}>
                    <div style={{ ...S.label as React.CSSProperties, marginBottom: 8 }}>ლოგო</div>
                    <FileChooserWithPreview
                      file={logoFile}
                      onChange={setLogoFile}
                      label=""
                      existingImageUrl={data?.website_settings?.logo_url ?? data?.companies?.[0]?.logo_url}
                      previewHeight={72}
                      objectFit="contain"
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 10, flexWrap: "wrap" }}>
                      <input type="text" inputMode="numeric" value={logoHeightInput} onChange={e => setLogoHeightInput(e.target.value.replace(/\D/g, "").slice(0, 3) || "")} placeholder="48" style={{ ...S.input, width: 56, padding: "6px 8px", fontSize: 12 }} />
                      <span style={{ fontSize: 11, color: "#6b6b75" }}>px</span>
                      <button type="button" disabled={logoHeightSaving} onClick={async () => {
                        const token = localStorage.getItem("admin_token");
                        if (!token) { router.push("/admin"); return; }
                        setLogoHeightSaving(true);
                        try {
                          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/website-settings`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ logo_height: Math.min(120, Math.max(24, parseInt(logoHeightInput, 10) || 48)) }) });
                          if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                          const result = await r.json();
                          if (!r.ok) throw new Error(result.error || "შეცდომა");
                          setData(prev => prev ? { ...prev, website_settings: result.website_settings ?? prev.website_settings } : null);
                          toast.success("ლოგოს ზომა განახლდა");
                        } catch (err: any) { toast.error(err.message || "შეცდომა"); } finally { setLogoHeightSaving(false); }
                      }} style={{ ...S.btnGhost, padding: "6px 10px", fontSize: 11, opacity: logoHeightSaving ? 0.6 : 1 }}>
                        {logoHeightSaving ? "..." : "შენახვა"}
                      </button>
                    </div>
                    {logoFile && (
                      <button type="button" onClick={async () => {
                        const token = localStorage.getItem("admin_token");
                        if (!token) { router.push("/admin"); return; }
                        setLogoUploading(true);
                        try {
                          const fd = new FormData();
                          fd.append("image", logoFile);
                          const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/company/logo`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
                          if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                          if (!r.ok) throw new Error((await r.json()).error || "შეცდომა");
                          const { website_settings: ws } = await r.json();
                          setData(prev => prev ? { ...prev, website_settings: ws ?? prev.website_settings } : null);
                          setLogoFile(null);
                          toast.success("ლოგო განახლდა");
                        } catch (err: any) { toast.error(err.message || "ატვირთვა ვერ მოხერხდა"); } finally { setLogoUploading(false); }
                      }} disabled={logoUploading} style={{ ...S.btnPrimary, width: "100%", marginTop: 10, opacity: logoUploading ? 0.6 : 1 }}>
                        {logoUploading ? "იტვირთება..." : "ატვირთვა"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Gallery add — compact, not full width on desktop */}
                <div style={{ ...S.label as React.CSSProperties, marginBottom: 8 }}>გალერეა</div>
                <p style={{ fontSize: 12, color: "#6b6b75", marginBottom: 12 }}>ფოტოები მთავარ გვერდის კარუსელში</p>
                <div style={{ ...S.card, marginBottom: 20, padding: 16, maxWidth: 520, width: "100%" }}>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!galleryFile) return;
                    const token = localStorage.getItem("admin_token");
                    if (!token) { router.push("/admin"); return; }
                    setGalleryUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("image", galleryFile);
                      fd.append("title", galleryTitle);
                      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/company-images`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd,
                      });
                      if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                      if (!r.ok) { const err = await r.json(); throw new Error(err.error || "შეცდომა"); }
                      const { image } = await r.json();
                      setData(prev => prev ? { ...prev, company_images: [...(prev.company_images || []), image] } : null);
                      setGalleryTitle("");
                      setGalleryFile(null);
                      toast.success("ფოტო წარმატებით დაემატა");
                    } catch (err: any) {
                      toast.error(err.message || "ფოტოს ატვირთვა ვერ მოხერხდა");
                    } finally {
                      setGalleryUploading(false);
                    }
                  }} style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
                    <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                      <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>სათაური</label>
                      <input type="text" value={galleryTitle} onChange={e => setGalleryTitle(e.target.value)} placeholder="მაგ: მთავარი სივრცე" style={{ ...S.input, width: "100%" }} />
                    </div>
                    <FileChooserWithPreview
                      file={galleryFile}
                      onChange={setGalleryFile}
                      label="ფოტო"
                      compact
                    />
                    <button type="submit" disabled={!galleryFile || galleryUploading} style={{ ...S.btnPrimary, opacity: !galleryFile || galleryUploading ? 0.6 : 1, alignSelf: "flex-end" }}>
                      {galleryUploading ? "იტვირთება..." : "დამატება"}
                    </button>
                  </form>
                </div>

                {/* Gallery grid — larger thumbnails */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                  {(data?.company_images || []).map((img: any) => (
                    <div key={img.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                      <div style={{ aspectRatio: "16/10", background: "#0e0e10", position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.image_url} alt={img.title || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      </div>
                      <div style={{ padding: 12, borderTop: "1px solid #252529", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.title || "—"}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!(await confirm({ message: "წაშალოთ ფოტო?", danger: true }))) return;
                            const token = localStorage.getItem("admin_token");
                            if (!token) { router.push("/admin"); return; }
                            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/company-images/${img.id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                            if (r.ok) {
                              setData(prev => prev ? { ...prev, company_images: (prev.company_images || []).filter((i: any) => i.id !== img.id) } : null);
                              toast.success("ფოტო წაიშალა");
                            } else toast.error("ფოტოს წაშლა ვერ მოხერხდა");
                          }}
                          style={{ ...S.btnDanger, fontSize: 11, padding: "6px 10px", flexShrink: 0 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {(!data?.company_images || data.company_images.length === 0) && (
                  <div style={{ ...S.card, textAlign: "center", color: "#6b6b75", fontSize: 13, padding: 32 }}>
                    ფოტოები ჯერ არ არის. დაამატეთ პირველი ფოტო ზემოთ.
                  </div>
                )}
              </div>
            )}

            {/* ── GAME BANNERS (Play our top games) ── */}
            {activeTab === "game-banners" && isOwner && (
              <div>
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2 sm:gap-3 mb-5">
                  <h2 style={S.h1}>თამაშის ბანერები</h2>
                  <span style={{ fontSize: 12, color: "#6b6b75" }}>„ითამაშე ჩვენი ტოპ თამაშები“ — მთავარ გვერდზე</span>
                </div>
                <p style={{ fontSize: 12, color: "#6b6b75", marginBottom: 16 }}>ატვირთეთ თამაშის ბანერები, რომლებიც გამოჩნდება მთავარ გვერდის კარუსელში. ბანერები გამოჩნდება მთელ გეიმინგ კაფეში.</p>

                <div style={{ ...S.card, marginBottom: 20 }}>
                  <div style={{ ...S.label as React.CSSProperties, marginBottom: 10 }}>ახალი ბანერის დამატება</div>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!gameBannerFile) return;
                    const token = localStorage.getItem("admin_token");
                    if (!token) { router.push("/admin"); return; }
                    setGameBannerUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("image", gameBannerFile);
                      fd.append("title", gameBannerTitle);
                      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/game-banners`, {
                        method: "POST",
                        headers: { Authorization: `Bearer ${token}` },
                        body: fd,
                      });
                      if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                      if (!r.ok) { const err = await r.json(); throw new Error(err.error || "შეცდომა"); }
                      const { banner } = await r.json();
                      setData(prev => prev ? { ...prev, game_banners: [...(prev.game_banners || []), banner] } : null);
                      setGameBannerTitle("");
                      setGameBannerFile(null);
                      toast.success("ბანერი წარმატებით დაემატა");
                    } catch (err: any) {
                      toast.error(err.message || "ბანერის ატვირთვა ვერ მოხერხდა");
                    } finally {
                      setGameBannerUploading(false);
                    }
                  }} className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-3 sm:items-end">
                    <div className="w-full sm:flex-1 sm:min-w-[180px]">
                      <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>სათაური (არასავალდებულო)</label>
                      <input type="text" value={gameBannerTitle} onChange={e => setGameBannerTitle(e.target.value)} placeholder="მაგ: Counter-Strike 2" style={{ ...S.input, width: "100%" }} />
                    </div>
                    <div className="w-full sm:flex-1 sm:min-w-[180px]">
                      <FileChooserWithPreview
                        file={gameBannerFile}
                        onChange={setGameBannerFile}
                        label="ბანერის ფოტო"
                        previewHeight={120}
                        objectFit="contain"
                      />
                    </div>
                    <button type="submit" disabled={!gameBannerFile || gameBannerUploading} className="w-full sm:w-auto"
                      style={{ ...S.btnPrimary, opacity: !gameBannerFile || gameBannerUploading ? 0.6 : 1, minHeight: 44 }}>
                      {gameBannerUploading ? "იტვირთება..." : "დამატება"}
                    </button>
                  </form>
                </div>

                <div className="grid gap-4 sm:gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 160px), 1fr))" }}>
                  {(data?.game_banners || []).map((b: any) => (
                    <div key={b.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                      <div style={{ aspectRatio: "16/9", background: "#0e0e10", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={b.image_url} alt={b.title || ""} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                      </div>
                      <div style={{ padding: 12, borderTop: "1px solid #252529", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2", flex: "1 1 100%", minWidth: 0 }}>{b.title || "—"}</div>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!(await confirm({ message: "წაშალოთ ბანერი?", danger: true }))) return;
                            const token = localStorage.getItem("admin_token");
                            if (!token) { router.push("/admin"); return; }
                            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/game-banners/${b.id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                            if (r.ok) {
                              setData(prev => prev ? { ...prev, game_banners: (prev.game_banners || []).filter((x: any) => x.id !== b.id) } : null);
                              toast.success("ბანერი წაიშალა");
                            } else toast.error("ბანერის წაშლა ვერ მოხერხდა");
                          }}
                          style={{ ...S.btnDanger, fontSize: 11, padding: "8px 12px", minHeight: 36 }}
                          title="წაშლა"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {(!data?.game_banners || data.game_banners.length === 0) && (
                  <div style={{ ...S.card, textAlign: "center", color: "#6b6b75", fontSize: 13 }}>
                    ბანერები ჯერ არ არის. დაამატეთ პირველი ბანერი ზემოთ მოცემული ფორმით.
                  </div>
                )}
              </div>
            )}

            {/* ── ADVERTISEMENTS ── */}
            {activeTab === "advertisements" && isOwner && (
              <AdvertisementsAdmin
                advertisements={data?.advertisements || []}
                onRefresh={refetchDashboard}
              />
            )}

            {/* ── COMPANY ── */}
            {activeTab === "company" && data?.companies?.[0] && (
              <CompanyInfoEditor
                company={data.companies[0]} websiteSettings={data.website_settings} role={data.userRole ?? "staff"}
                onUpdate={({ company, website_settings }) => setData(prev => {
                  if (!prev) return prev;
                  const next = { ...prev };
                  if (company) next.companies = prev.companies?.map((c: any) => c.id === company.id ? company : c) || [company];
                  if (website_settings) next.website_settings = website_settings;
                  return next;
                })}
              />
            )}

            {/* ── REVENUE ── */}
            {activeTab === "revenue" && isOwner && (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
                  <h2 style={S.h1}>ბრუნვა</h2>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <input type="date" className="ad-input" value={selectedDate.toISOString().split("T")[0]} onChange={e => setSelectedDate(new Date(e.target.value))} style={{ ...S.input, width: "auto", fontSize: 12 }} />
                    <div style={{ position: "relative" }}>
                      <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="ad-input" style={{ ...S.input, width: "auto", paddingRight: 32, fontSize: 12 }}>
                        {["იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი","ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"].map((m, i) => <option key={i} value={i}>{m}</option>)}
                      </select>
                      <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#4a4a55" }} />
                    </div>
                    <div style={{ position: "relative" }}>
                      <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="ad-input" style={{ ...S.input, width: "auto", paddingRight: 32, fontSize: 12 }}>
                        {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <ChevronDown size={12} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#4a4a55" }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
                  {[
                    { label: "დღიური", value: calculateRevenue(data?.sessions || [], "today") },
                    { label: "თვიური", value: calculateRevenue(data?.sessions || [], "month") },
                    { label: "სულ", value: calculateRevenue(data?.sessions || [], "all") },
                  ].map((kpi, i) => (
                    <div key={i} style={S.card}>
                      <div style={S.label as React.CSSProperties}>{kpi.label}</div>
                      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'DM Mono', monospace", color: "#f0f0f2", marginTop: 8 }}>{formatCurrency(kpi.value)}</div>
                    </div>
                  ))}
                </div>

                <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1e22" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#9a9aa5" }}>ჩანაწერები</span>
                  </div>
                  <div style={{ overflowX: "auto" }} className="ad-scrollbar">
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 360 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1e1e22" }}>
                          {["თარიღი", "მოწყობ.", "ხანგრძლ.", "თანხი", "ვის დაასრულა"].map((h, i) => (
                            <th key={i} style={{ ...S.th, textAlign: i === 3 ? "right" : "left" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data?.sessions?.filter(s => {
                          const d = new Date(s.created_at);
                          return (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) || d.toDateString() === selectedDate.toDateString();
                        }).slice(0, 20).map(s => (
                          <tr key={s.id} className="ad-tr" style={{ borderBottom: "1px solid #1e1e22" }}>
                            <td style={{ ...S.td, color: "#6b6b75", fontSize: 12 }}>{new Date(s.created_at).toLocaleDateString("ka-GE")}</td>
                            <td style={{ ...S.td, color: "#c8c8d0" }}>{data?.resources?.find(r => r.id === s.resource_id)?.name || "—"}</td>
                            <td style={{ ...S.td, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{Math.floor(s.duration_seconds / 60)} წთ</td>
                            <td style={{ ...S.td, fontFamily: "'DM Mono', monospace", fontWeight: 600, textAlign: "right" }}>{formatCurrency(s.total_price || 0)}</td>
                            <td style={{ ...S.td, fontSize: 11, color: "#9a9aa5" }}>{(data?.staff_members || []).find((sm: any) => sm.id === s.completed_by_staff_id)?.full_name || "—"}</td>
                          </tr>
                        ))}
                        {!data?.sessions?.filter(s => {
                          const d = new Date(s.created_at);
                          return (d.getMonth() === selectedMonth && d.getFullYear() === selectedYear) || d.toDateString() === selectedDate.toDateString();
                        }).length && (
                          <tr><td colSpan={5} style={{ padding: "40px 16px", textAlign: "center", color: "#3a3a42", fontSize: 13 }}>ჩანაწერები არ მოიძებნა</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── STAFF MEMBER CONTROL ── */}
            {activeTab === "staff" && isOwner && (
              <div>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 24 }}>
                  <h2 style={S.h1}>პერსონალის მართვა</h2>
                </div>
                <p style={{ fontSize: 12, color: "#6b6b75", marginBottom: 20 }}>დაამატეთ პერსონალი, მიანიჭეთ წვდომა სექციებზე. ყველა პერსონალი რეგისტრირდება Supabase აუტენტიფიკაციაში.</p>

                <div style={{ ...S.card, marginBottom: 24 }}>
                  <div style={{ ...S.label as React.CSSProperties, marginBottom: 10 }}>ახალი პერსონალის დამატება</div>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const token = localStorage.getItem("admin_token");
                    if (!token) { router.push("/admin"); return; }
                    setStaffSaving(true);
                    try {
                      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                        body: JSON.stringify(staffForm),
                      });
                      if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                      const d = await r.json();
                      if (!r.ok) throw new Error(d.error || "შეცდომა");
                      setData(prev => prev ? { ...prev, staff_members: [d.staff, ...(prev.staff_members || [])], staff_permissions: [...(prev.staff_permissions || []), ...staffForm.section_keys.map((k: string) => ({ staff_member_id: d.staff.id, section_key: k }))] } : null);
                      setStaffForm({ email: "", password: "", full_name: "", phone: "", role: "staff", section_keys: [] });
                      toast.success("პერსონალი დაემატა");
                    } catch (err: any) {
                      toast.error(err.message || "დამატება ვერ მოხერხდა");
                    } finally {
                      setStaffSaving(false);
                    }
                  }} className="flex flex-col gap-4">
                    <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
                      <div>
                        <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>სახელი და გვარი *</label>
                        <input type="text" value={staffForm.full_name} onChange={e => setStaffForm(f => ({ ...f, full_name: e.target.value }))} placeholder="მაგ: გიორგი გიორგაძე" style={{ ...S.input }} required />
                      </div>
                      <div>
                        <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>ელ. ფოსტა *</label>
                        <input type="email" value={staffForm.email} onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))} placeholder="staff@example.com" style={{ ...S.input }} required />
                      </div>
                      <div>
                        <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>პაროლი *</label>
                        <input type="password" value={staffForm.password} onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))} placeholder="მინ. 6 სიმბოლო" style={{ ...S.input }} required minLength={6} />
                      </div>
                      <div>
                        <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>ტელეფონი</label>
                        <input type="tel" value={staffForm.phone} onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))} placeholder="+995..." style={{ ...S.input }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 8 }}>წვდომა სექციებზე</label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "timers", label: "ტაიმერი" },
                          { id: "history", label: "ისტორია" },
                          { id: "resources", label: "მოწყობილობები" },
                          { id: "reservations", label: "ჯავშნები" },
                          { id: "reviews", label: "მიმოხილვები" },
                          { id: "gallery", label: "ფოტოები" },
                          { id: "game-banners", label: "ბანერები" },
                          { id: "advertisements", label: "რეკლამები" },
                          { id: "company", label: "კომპანია" },
                          { id: "revenue", label: "ბრუნვა" },
                        ].map(s => (
                          <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, color: "#9a9aa5" }}>
                            <input type="checkbox" checked={staffForm.section_keys.includes(s.id)} onChange={e => setStaffForm(f => ({ ...f, section_keys: e.target.checked ? [...f.section_keys, s.id] : f.section_keys.filter(k => k !== s.id) }))} />
                            {s.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button type="submit" disabled={staffSaving} style={{ ...S.btnPrimary, alignSelf: "flex-start", opacity: staffSaving ? 0.6 : 1 }}>
                      {staffSaving ? "იტვირთება..." : <><UserPlus size={14} /> დამატება</>}
                    </button>
                  </form>
                </div>

                <div style={{ ...S.card, padding: 0, overflow: "hidden" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #1e1e22" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#9a9aa5" }}>პერსონალი</span>
                  </div>
                  <div style={{ overflowX: "auto" }} className="ad-scrollbar">
                    <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 400 }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid #1e1e22" }}>
                          {["სახელი", "ელ. ფოსტა", "როლი", "წვდომა", ""].map((h, i) => (
                            <th key={i} style={{ ...S.th, textAlign: i === 4 ? "right" : "left" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.staff_members || []).map((sm: any) => {
                          const perms = (data?.staff_permissions || []).filter((p: any) => p.staff_member_id === sm.id).map((p: any) => p.section_key);
                          const permLabels: Record<string, string> = { timers: "ტაიმერი", history: "ისტორია", resources: "მოწყობილობები", reservations: "ჯავშნები", reviews: "მიმოხილვები", gallery: "ფოტოები", "game-banners": "ბანერები", advertisements: "რეკლამები", company: "კომპანია", revenue: "ბრუნვა" };
                          return (
                            <tr key={sm.id} className="ad-tr" style={{ borderBottom: "1px solid #1e1e22" }}>
                              <td style={S.td}>
                                <span style={{ fontWeight: 600, color: "#f0f0f2" }}>{sm.full_name}</span>
                              </td>
                              <td style={{ ...S.td, color: "#9a9aa5", fontSize: 12 }}>{sm.email || "—"}</td>
                              <td style={S.td}>
                                <span style={S.pill(sm.role === "owner", false) as React.CSSProperties}>{sm.role === "owner" ? "მფლობელი" : "პერსონალი"}</span>
                              </td>
                              <td style={{ ...S.td, fontSize: 11, color: "#6b6b75" }}>
                                {sm.role === "owner" ? "ყველა სექცია" : perms.length ? perms.map((k: string) => permLabels[k] || k).join(", ") : "—"}
                              </td>
                              <td style={{ ...S.td, textAlign: "right" }}>
                                {sm.role !== "owner" && (
                                  <>
                                    <button onClick={async () => {
                                      setStaffEditId(sm.id);
                                      const token = localStorage.getItem("admin_token");
                                      if (!token) return;
                                      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff/${sm.id}/permissions`, { headers: { Authorization: `Bearer ${token}` } });
                                      if (r.ok) { const d = await r.json(); setStaffEditPerms(d.permissions || []); }
                                    }} style={{ ...S.btnGhost, fontSize: 11, padding: "6px 10px", marginRight: 6 }}>რედაქტირება</button>
                                    <button onClick={async () => {
                                      if (!(await confirm({ message: `წაშალოთ ${sm.full_name}?`, danger: true }))) return;
                                      const token = localStorage.getItem("admin_token");
                                      if (!token) { router.push("/admin"); return; }
                                      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff/${sm.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
                                      if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                                      if (r.ok) {
                                        setData(prev => prev ? { ...prev, staff_members: (prev.staff_members || []).filter((s: any) => s.id !== sm.id), staff_permissions: (prev.staff_permissions || []).filter((p: any) => p.staff_member_id !== sm.id) } : null);
                                        toast.success("პერსონალი წაიშალა");
                                      } else toast.error((await r.json()).error || "წაშლა ვერ მოხერხდა");
                                    }} style={{ ...S.btnDanger, fontSize: 11, padding: "6px 10px" }}>
                                      <Trash2 size={12} />
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                {(!data?.staff_members || data.staff_members.length === 0) && (
                  <div style={{ ...S.card, textAlign: "center", color: "#6b6b75", fontSize: 13 }}>პერსონალი ჯერ არ არის.</div>
                )}

                {/* Staff edit permissions modal */}
                {staffEditId && (
                  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setStaffEditId(null)}>
                    <div style={{ ...S.card, maxWidth: 420, width: "100%", maxHeight: "90vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#f0f0f2", margin: 0 }}>წვდომის რედაქტირება</h3>
                        <button onClick={() => setStaffEditId(null)} style={{ background: "none", border: "none", color: "#6b6b75", cursor: "pointer", padding: 4 }}><X size={18} /></button>
                      </div>
                      <p style={{ fontSize: 12, color: "#6b6b75", marginBottom: 16 }}>აირჩიეთ სექციები, რომლებზეც პერსონალს ექნება წვდომა</p>
                      <div className="flex flex-wrap gap-3" style={{ marginBottom: 20 }}>
                        {[
                          { id: "timers", label: "ტაიმერი" },
                          { id: "history", label: "ისტორია" },
                          { id: "resources", label: "მოწყობილობები" },
                          { id: "reservations", label: "ჯავშნები" },
                          { id: "reviews", label: "მიმოხილვები" },
                          { id: "gallery", label: "ფოტოები" },
                          { id: "game-banners", label: "ბანერები" },
                          { id: "advertisements", label: "რეკლამები" },
                          { id: "company", label: "კომპანია" },
                          { id: "revenue", label: "ბრუნვა" },
                        ].map(s => (
                          <label key={s.id} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: "#9a9aa5" }}>
                            <input type="checkbox" checked={staffEditPerms.includes(s.id)} onChange={e => setStaffEditPerms(prev => e.target.checked ? [...prev, s.id] : prev.filter(k => k !== s.id))} />
                            {s.label}
                          </label>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button onClick={() => setStaffEditId(null)} style={{ ...S.btnGhost, fontSize: 12 }}>გაუქმება</button>
                        <button onClick={async () => {
                          const token = localStorage.getItem("admin_token");
                          if (!token) return;
                          setStaffEditSaving(true);
                          try {
                            const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/staff/${staffEditId}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                              body: JSON.stringify({ section_keys: staffEditPerms }),
                            });
                            if (r.status === 401) { localStorage.removeItem("admin_token"); router.push("/admin"); return; }
                            const d = await r.json();
                            if (!r.ok) throw new Error(d.error);
                            setData(prev => {
                              if (!prev) return prev;
                              const next = { ...prev, staff_permissions: [...(prev.staff_permissions || []).filter((p: any) => p.staff_member_id !== staffEditId), ...staffEditPerms.map(k => ({ staff_member_id: staffEditId, section_key: k }))] };
                              return next;
                            });
                            setStaffEditId(null);
                            toast.success("წვდომა განახლდა");
                          } catch (err: any) {
                            toast.error(err.message || "შეცდომა");
                          } finally {
                            setStaffEditSaving(false);
                          }
                        }} disabled={staffEditSaving} style={{ ...S.btnPrimary, fontSize: 12, opacity: staffEditSaving ? 0.6 : 1 }}>
                          {staffEditSaving ? "ინახება..." : "შენახვა"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
    </>
  );
}

// ── CompanyInfoEditor ──
function CompanyInfoEditor({ company, websiteSettings, role, onUpdate }: { company: any; websiteSettings?: any; role: string; onUpdate: (updates: { company?: any; website_settings?: any }) => void }) {
  const toast = useToast();
  const isOwner = role === "owner";
  const aboutIntro = websiteSettings?.about_intro ?? company.about_intro ?? "";
  const [formData, setFormData] = useState({
    name: company.name || "", description: company.description || "", about_intro: aboutIntro,
    phone: company.phone || "", email: company.email || "", address: company.address || "", city: company.city || "",
    currency_code: company.currency_code || "GEL", timezone: company.timezone || "Asia/Tbilisi",
    facebook_url: websiteSettings?.facebook_url || "", instagram_url: websiteSettings?.instagram_url || "", maps_url: websiteSettings?.maps_url || "",
    opening_hours: websiteSettings?.opening_hours || ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      about_intro: websiteSettings?.about_intro ?? company.about_intro ?? "",
      facebook_url: websiteSettings?.facebook_url || "",
      instagram_url: websiteSettings?.instagram_url || "",
      maps_url: websiteSettings?.maps_url || "",
      opening_hours: websiteSettings?.opening_hours || ""
    }));
  }, [websiteSettings?.about_intro, websiteSettings?.facebook_url, websiteSettings?.instagram_url, websiteSettings?.maps_url, websiteSettings?.opening_hours, company.about_intro]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("admin_token");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const companyPayload = { name: formData.name, description: formData.description, phone: formData.phone, email: formData.email, address: formData.address, city: formData.city, currency_code: formData.currency_code, timezone: formData.timezone };
      const wsPayload = { about_intro: formData.about_intro, facebook_url: formData.facebook_url || null, instagram_url: formData.instagram_url || null, maps_url: formData.maps_url || null, opening_hours: formData.opening_hours || null };
      const [companyRes, wsRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/company`, { method: "PUT", headers, body: JSON.stringify(companyPayload) }),
        fetch(`${apiUrl}/api/admin/website-settings`, { method: "PUT", headers, body: JSON.stringify(wsPayload) }),
      ]);
      const companyResult = companyRes.ok ? await companyRes.json() : null;
      const wsResult = wsRes.ok ? await wsRes.json() : null;
      if (!companyRes.ok) throw new Error((companyResult?.error) || "განახლება ვერ მოხერხდა");
      toast.success("მონაცემები წარმატებით განახლდა");
      onUpdate({ company: companyResult?.company, website_settings: wsResult?.website_settings });
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", background: isOwner ? "#0e0e10" : "transparent", border: `1px solid ${isOwner ? "#252529" : "transparent"}`, borderRadius: 10, padding: "11px 14px", color: "#f0f0f2", fontSize: 13, fontFamily: "'DM Sans', sans-serif", outline: "none", transition: "border-color 0.2s", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "#f0f0f2", margin: 0 }}>კომპანიის ინფორმაცია</h2>
        <span style={{ fontSize: 10, fontWeight: 700, color: isOwner ? "#9a9aa5" : "#4a4a55", background: isOwner ? "rgba(255,255,255,0.05)" : "transparent", border: `1px solid ${isOwner ? "#252529" : "transparent"}`, padding: "3px 9px", borderRadius: 6, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {isOwner ? "Owner" : "Staff"}
        </span>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
          {[["დასახელება", "name", "text"], ["ტელეფონი", "phone", "text"], ["ელ-ფოსტა", "email", "email"], ["ქალაქი", "city", "text"], ["მისამართი", "address", "text"]].map(([label, name, type]) => (
            <div key={name} style={name === "email" ? { gridColumn: "1 / -1" } : {}}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4a4a55", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</label>
              <input type={type} name={name} value={(formData as any)[name]} onChange={handleChange} readOnly={!isOwner} style={inputStyle} />
            </div>
          ))}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4a4a55", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>აღწერა</label>
            <textarea name="description" value={formData.description} onChange={handleChange} readOnly={!isOwner} rows={3} style={{ ...inputStyle, resize: "none" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4a4a55", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>ჩვენს შესახებ — ტექსტი</label>
            <textarea name="about_intro" value={formData.about_intro} onChange={handleChange} readOnly={!isOwner} rows={4} placeholder="ტექსტი გამოჩნდება „ჩვენს შესახებ“ გვერდის პირველ სექციაში" style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#4a4a55", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>საათები (ფუტერში)</label>
            <textarea name="opening_hours" value={formData.opening_hours} onChange={handleChange} readOnly={!isOwner} rows={4} placeholder={"ორშ — ხუთ: 10:00 — 00:00\nპარ — შაბ: 10:00 — 02:00\nკვირა: 12:00 — 23:00"} style={{ ...inputStyle, resize: "vertical" }} />
          </div>
          <div style={{ gridColumn: "1 / -1", marginTop: 8, paddingTop: 16, borderTop: "1px solid #252529" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#4a4a55", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>სოციალური ბმულები და რუკა</div>
            {[["Facebook URL", "facebook_url"], ["Instagram URL", "instagram_url"], ["Google Maps URL (Plus Code ან მისამართი)", "maps_url"]].map(([label, name]) => (
              <div key={name} style={{ marginBottom: 12 }}>
                <label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#6b6b75", marginBottom: 6 }}>{label}</label>
                <input type="url" name={name} value={(formData as any)[name]} onChange={handleChange} readOnly={!isOwner} placeholder={`მაგ: https://...`} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>
        {isOwner && (
          <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <button type="submit" disabled={saving} style={{ padding: "10px 20px", background: "#f0f0f2", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", color: "#0e0e10", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
              {saving ? "ინახება..." : "შენახვა"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}