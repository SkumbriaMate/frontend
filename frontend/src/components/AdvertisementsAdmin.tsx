"use client";

/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Plus, Eye, MousePointer, X } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";
import FileChooserWithPreview from "@/components/FileChooserWithPreview";

const PLACEMENTS = [
  { value: "home", label: "მთავარი" },
  { value: "stations", label: "სადგურები" },
  { value: "reserve", label: "ჯავშანი" },
  { value: "events", label: "ღონისძიებები" },
  { value: "about", label: "ჩვენს შესახებ" },
  { value: "contact", label: "კონტაქტი" },
];

const S = {
  card: { background: "#16161a", border: "1px solid #252529", borderRadius: 14, padding: 20 },
  label: { fontSize: 10, fontWeight: 700, color: "#4a4a55", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
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
  pill: (active: boolean) => ({
    display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 9px",
    borderRadius: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.03em",
    background: active ? "rgba(80,200,80,0.08)" : "rgba(255,255,255,0.04)",
    color: active ? "#60c860" : "#6b6b75",
    border: `1px solid ${active ? "rgba(80,200,80,0.18)" : "#252529"}`,
  }),
};

type Ad = {
  id: string;
  title: string;
  image_url: string;
  target_url: string;
  ad_type: "vip" | "normal";
  placement: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  priority: number;
  vip_interval_seconds?: number | null;
};

export default function AdvertisementsAdmin({
  advertisements,
  onRefresh,
}: {
  advertisements: Ad[];
  onRefresh: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();

  const handleAuthFailure = () => {
    localStorage.removeItem("admin_token");
    toast.error("სესია ვადაგასულია — გთხოვთ თავიდან შეხვიდეთ");
    router.push("/admin");
  };
  const [analyticsSummary, setAnalyticsSummary] = useState<{ id: string; title: string; ad_type: string; clicks: number; impressions: number; ctr: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchAnalytics = async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    try {
      const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/advertisements/analytics/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.status === 401) {
        handleAuthFailure();
        return;
      }
      if (r.ok) {
        const { advertisements: sum } = await r.json();
        setAnalyticsSummary(sum || []);
      }
    } catch {
      setAnalyticsSummary([]);
    }
  };

  const doRefresh = () => {
    onRefresh();
    fetchAnalytics();
  };
  const [editing, setEditing] = useState<Ad | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    target_url: "",
    ad_type: "normal" as "vip" | "normal",
    placements: [] as string[],
    is_active: true,
    start_date: "",
    end_date: "",
    priority: "0",
    vip_interval_seconds: "60",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", target_url: "", ad_type: "normal", placements: [], is_active: true, start_date: "", end_date: "", priority: "0", vip_interval_seconds: "60" });
    setImageFile(null);
    setModalOpen(true);
  };

  const openEdit = (ad: Ad) => {
    setEditing(ad);
    const placements = ad.placement ? (ad.placement === "all" ? ["all"] : ad.placement.split(",").map((p) => p.trim()).filter(Boolean)) : [];
    setForm({
      title: ad.title,
      target_url: ad.target_url,
      ad_type: ad.ad_type,
      placements: placements.length > 0 ? placements : [],
      is_active: ad.is_active,
      start_date: ad.start_date || "",
      end_date: ad.end_date || "",
      priority: String(ad.priority || 0),
      vip_interval_seconds: String(ad.vip_interval_seconds ?? 60),
    } as { title: string; target_url: string; ad_type: "vip" | "normal"; placements: string[]; is_active: boolean; start_date: string; end_date: string; priority: string; vip_interval_seconds: string });
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.target_url.trim()) {
      toast.error("სახელი და ლინკი სავალდებულოა");
      return;
    }
    if (!editing && !imageFile) {
      toast.error("ფოტო/ბანერი სავალდებულოა");
      return;
    }
    if (form.placements.length === 0) {
      toast.error("აირჩიეთ მინიმუმ ერთი გვერდი");
      return;
    }

    const placementValue = form.placements.includes("all") ? "all" : form.placements.join(",");

    const token = localStorage.getItem("admin_token");
    if (!token) return;

    setSaving(true);
    try {
      if (editing) {
        const fd = new FormData();
        fd.append("title", form.title.trim());
        fd.append("target_url", form.target_url.trim());
        fd.append("ad_type", form.ad_type);
        fd.append("placement", placementValue);
        fd.append("is_active", String(form.is_active));
        fd.append("start_date", form.start_date || "");
        fd.append("end_date", form.end_date || "");
        fd.append("priority", form.priority);
        if (form.ad_type === "vip") fd.append("vip_interval_seconds", form.vip_interval_seconds || "60");
        if (imageFile) fd.append("image", imageFile);

        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/advertisements/${editing.id}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (r.status === 401) {
          handleAuthFailure();
          return;
        }
        if (!r.ok) throw new Error((await r.json()).error || "შეცდომა");
        toast.success("რეკლამა განახლდა");
      } else {
        const fd = new FormData();
        fd.append("title", form.title.trim());
        fd.append("target_url", form.target_url.trim());
        fd.append("ad_type", form.ad_type);
        fd.append("placement", placementValue);
        fd.append("is_active", String(form.is_active));
        fd.append("start_date", form.start_date || "");
        fd.append("end_date", form.end_date || "");
        fd.append("priority", form.priority);
        if (form.ad_type === "vip") fd.append("vip_interval_seconds", form.vip_interval_seconds || "60");
        fd.append("image", imageFile!);

        const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/advertisements`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (r.status === 401) {
          handleAuthFailure();
          return;
        }
        if (!r.ok) throw new Error((await r.json()).error || "შეცდომა");
        toast.success("რეკლამა დაემატა");
      }
      setModalOpen(false);
      doRefresh();
    } catch (err: unknown) {
      toast.error((err as Error).message || "შეცდომა");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ad: Ad) => {
    if (!(await confirm({ message: `წაშალოთ რეკლამა "${ad.title}"?`, danger: true }))) return;
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/advertisements/${ad.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (r.status === 401) {
      handleAuthFailure();
      return;
    }
    if (r.ok) {
      toast.success("რეკლამა წაიშალა");
      doRefresh();
    } else {
      const err = await r.json().catch(() => ({}));
      toast.error((err as { error?: string }).error || "წაშლა ვერ მოხერხდა");
    }
  };

  const getStats = (id: string) => analyticsSummary.find((s) => s.id === id) || { clicks: 0, impressions: 0, ctr: "0%" };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <h2 style={{ fontSize: "clamp(16px,4vw,20px)", fontWeight: 700, color: "#f0f0f2", letterSpacing: "-0.02em", margin: 0 }}>
          რეკლამების მართვა
        </h2>
        <button onClick={openCreate} style={S.btnPrimary}>
          <Plus size={16} />
          ახალი რეკლამა
        </button>
      </div>

      {/* Analytics summary */}
      {analyticsSummary.length > 0 && (
        <div style={{ ...S.card, marginBottom: 24 }}>
          <div style={{ ...S.label as React.CSSProperties, marginBottom: 12 }}>ანალიტიკა</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {analyticsSummary.map((s) => (
              <div key={s.id} style={{ padding: 12, background: "#0e0e10", borderRadius: 10, border: "1px solid #252529" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2", marginBottom: 8 }}>{s.title}</div>
                <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6b6b75" }}>
                  <span><Eye size={12} style={{ verticalAlign: -2, marginRight: 4 }} />{s.impressions}</span>
                  <span><MousePointer size={12} style={{ verticalAlign: -2, marginRight: 4 }} />{s.clicks}</span>
                  <span>CTR: {s.ctr}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ad list */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {advertisements.map((ad) => {
          const stats = getStats(ad.id);
          return (
            <div key={ad.id} style={{ ...S.card, padding: 0, overflow: "hidden" }}>
              <div style={{ aspectRatio: "16/9", background: "#0e0e10", position: "relative" }}>
                <img src={ad.image_url} alt={ad.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span style={{ position: "absolute", top: 8, left: 8, ...S.pill(ad.ad_type === "vip") }}>
                  {ad.ad_type === "vip" ? "VIP" : "ნორმალური"}
                </span>
                <span style={{ position: "absolute", top: 8, right: 8, ...S.pill(ad.is_active) }}>
                  {ad.is_active ? "აქტიური" : "არაქტიური"}
                </span>
              </div>
              <div style={{ padding: 14, borderTop: "1px solid #252529" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f2", marginBottom: 6 }}>{ad.title}</div>
                <div style={{ fontSize: 11, color: "#6b6b75", marginBottom: 4 }}>
                  {ad.placement === "all" ? "ყველა გვერდი" : (ad.placement || "").split(",").map((p) => PLACEMENTS.find((x) => x.value === p.trim())?.label || p.trim()).filter(Boolean).join(", ")}
                </div>
                <div style={{ fontSize: 11, color: "#4a4a55", marginBottom: 8, wordBreak: "break-all" }}>{ad.target_url}</div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, fontSize: 11, color: "#4a4a55" }}>
                  <span>ნახვა: {stats.impressions}</span>
                  <span>დაწკაპუნება: {stats.clicks}</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => openEdit(ad)} style={{ ...S.btnGhost, padding: "6px 10px", fontSize: 11 }}>
                    <Pencil size={12} />
                  </button>
                  <button onClick={() => handleDelete(ad)} style={{ ...S.btnDanger, padding: "6px 10px", fontSize: 11 }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {advertisements.length === 0 && (
        <div style={{ ...S.card, textAlign: "center", color: "#6b6b75", fontSize: 13 }}>
          რეკლამები ჯერ არ არის. დაამატეთ პირველი რეკლამა ღილაკით „ახალი რეკლამა“.
        </div>
      )}

      {/* Create/Edit modal */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => !saving && setModalOpen(false)}>
          <div style={{ ...S.card, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f2", margin: 0 }}>{editing ? "რეკლამის რედაქტირება" : "ახალი რეკლამა"}</h3>
              <button onClick={() => !saving && setModalOpen(false)} style={{ background: "none", border: "none", color: "#6b6b75", cursor: "pointer", padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>სახელი *</label>
                <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="მაგ: სპეციალური შეთავაზება" style={S.input} required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>ლინკი (redirect) *</label>
                <input type="url" value={form.target_url} onChange={(e) => setForm((f) => ({ ...f, target_url: e.target.value }))} placeholder="https://..." style={S.input} required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>ტიპი</label>
                <select value={form.ad_type} onChange={(e) => setForm((f) => ({ ...f, ad_type: e.target.value as "vip" | "normal" }))} style={S.input}>
                  <option value="normal">ნორმალური (ბანერი კონტენტში)</option>
                  <option value="vip">VIP (სრულეკრანიანი პოპაპი)</option>
                </select>
              </div>
              {form.ad_type === "vip" && (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>გამოჩენის ინტერვალი (წამები)</label>
                  <p style={{ fontSize: 11, color: "#6b6b75", marginBottom: 8 }}>რამდენი წამის შემდეგ გამოჩნდეს ისევ დახურვის შემდეგ. მინ. 10, მაქს. 3600 (1 საათი)</p>
                  <input
                    type="number"
                    value={form.vip_interval_seconds}
                    onChange={(e) => setForm((f) => ({ ...f, vip_interval_seconds: e.target.value }))}
                    min={10}
                    max={3600}
                    style={S.input}
                  />
                </div>
              )}
              <div style={{ marginBottom: 14 }}>
                <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 8 }}>გვერდები (აირჩიეთ სად გამოჩნდება)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#c8c8d0", fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={form.placements.includes("all")}
                      onChange={(e) => setForm((f) => ({ ...f, placements: e.target.checked ? ["all"] : [] }))}
                    />
                    ყველა გვერდი
                  </label>
                  {PLACEMENTS.map((p) => (
                    <label key={p.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#c8c8d0" }}>
                      <input
                        type="checkbox"
                        checked={form.placements.includes(p.value)}
                        disabled={form.placements.includes("all")}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm((f) => ({ ...f, placements: [...f.placements.filter((x) => x !== "all"), p.value] }));
                          } else {
                            setForm((f) => ({ ...f, placements: f.placements.filter((x) => x !== p.value) }));
                          }
                        }}
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <FileChooserWithPreview
                  file={imageFile}
                  onChange={setImageFile}
                  label={`ფოტო/ბანერი ${!editing ? "*" : ""}`}
                  existingImageUrl={editing?.image_url}
                  previewHeight={120}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>დაწყების თარიღი</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} style={S.input} />
                </div>
                <div>
                  <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 6 }}>დასრულების თარიღი</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} style={S.input} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#c8c8d0" }}>
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                  აქტიური
                </label>
                <div style={{ flex: 1 }}>
                  <label style={{ ...S.label as React.CSSProperties, display: "block", marginBottom: 4 }}>პრიორიტეტი</label>
                  <input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} style={{ ...S.input, width: 80 }} min={0} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setModalOpen(false)} style={S.btnGhost} disabled={saving}>გაუქმება</button>
                <button type="submit" style={{ ...S.btnPrimary, opacity: saving ? 0.6 : 1 }} disabled={saving}>
                  {saving ? "ინახება..." : editing ? "შენახვა" : "დამატება"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
