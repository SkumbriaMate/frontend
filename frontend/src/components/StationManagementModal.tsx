"use client";

import { useState, useEffect, useRef } from "react";
import { X, Trash2, ImagePlus } from "lucide-react";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmModal";

interface ResourceType {
    id: string;
    name: string;
}

interface Resource {
    id: string;
    code?: string;
    name?: string;
    resource_type_id?: string;
    pricing_mode?: "hourly" | "ps_mode";
    price_per_hour?: number | null;
    price_1v1?: number | null;
    price_2v2?: number | null;
    is_vip?: boolean;
    status?: "available" | "maintenance" | "inactive";
    description?: string;
}

interface StationManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    resourceTypes: ResourceType[];
    existingResources: Resource[];
    onAdd: (res: Resource) => void;
    onDelete: (id: string) => void;
    initialData?: Resource | null;
    currentImageUrl?: string | null;
    onImagesUpdated?: () => void;
}

const modalStyles = {
    overlay: { background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" },
    card: { background: "#16161a", border: "1px solid #252529", borderRadius: 14 },
    input: { background: "#0e0e10", border: "1px solid #252529", borderRadius: 10, padding: "10px 14px", color: "#f0f0f2", fontSize: 13 },
    label: { fontSize: 10, fontWeight: 700, color: "#4a4a55", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
    btnPrimary: { background: "#f0f0f2", color: "#0e0e10", fontWeight: 600, padding: "10px 18px", borderRadius: 10 },
    btnGhost: { background: "rgba(255,255,255,0.04)", border: "1px solid #252529", color: "#9a9aa5", padding: "9px 14px", borderRadius: 10 },
    btnDanger: { background: "rgba(220,60,60,0.08)", border: "1px solid rgba(220,60,60,0.2)", color: "#e07070", padding: "9px 14px", borderRadius: 10 },
};

export default function StationManagementModal({
    isOpen,
    onClose,
    resourceTypes,
    existingResources,
    onAdd,
    onDelete,
    initialData,
    currentImageUrl,
    onImagesUpdated,
}: StationManagementModalProps) {
    const toast = useToast();
    const confirm = useConfirm();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        name: "",
        resource_type_id: "",
        code: "",
        pricing_mode: "hourly" as "hourly" | "ps_mode",
        price_per_hour: "" as string | null,
        price_1v1: "" as string | null,
        price_2v2: "" as string | null,
        is_vip: false,
        status: "available" as "available" | "maintenance" | "inactive",
        description: "",
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && initialData) {
            setFormData({
                name: initialData.name || "",
                resource_type_id: initialData.resource_type_id || "",
                code: initialData.code || "",
                pricing_mode: initialData.pricing_mode || "hourly",
                price_per_hour: initialData.price_per_hour?.toString() || "",
                price_1v1: initialData.price_1v1?.toString() || "",
                price_2v2: initialData.price_2v2?.toString() || "",
                is_vip: initialData.is_vip || false,
                status: initialData.status || "available",
                description: initialData.description || "",
            });
            setImagePreview((prev) => {
                if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
                return currentImageUrl || null;
            });
            setImageFile(null);
        } else if (isOpen) {
            setFormData({
                name: "",
                resource_type_id: "",
                code: "",
                pricing_mode: "hourly",
                price_per_hour: "",
                price_1v1: "",
                price_2v2: "",
                is_vip: false,
                status: "available",
                description: "",
            });
            setImagePreview((prev) => {
                if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
                return null;
            });
            setImageFile(null);
        }
    }, [isOpen, initialData, currentImageUrl]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview((prev) => {
                if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
                return URL.createObjectURL(file);
            });
        }
        e.target.value = "";
    };

    const clearImage = () => {
        setImageFile(null);
        setImagePreview((prev) => {
            if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
            return currentImageUrl || null;
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = localStorage.getItem("admin_token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const pricePerHour = formData.pricing_mode === "ps_mode" ? null : formData.price_per_hour;
            const price1v1 = formData.pricing_mode === "ps_mode" ? formData.price_1v1 : null;
            const price2v2 = formData.pricing_mode === "ps_mode" ? formData.price_2v2 : null;

            let response: Response;
            if (imageFile) {
                const fd = new FormData();
                fd.append("name", formData.name);
                fd.append("resource_type_id", formData.resource_type_id);
                fd.append("code", formData.code);
                fd.append("pricing_mode", formData.pricing_mode);
                fd.append("is_vip", String(formData.is_vip));
                fd.append("status", formData.status);
                fd.append("description", formData.description);
                if (pricePerHour) fd.append("price_per_hour", pricePerHour);
                if (price1v1) fd.append("price_1v1", price1v1);
                if (price2v2) fd.append("price_2v2", price2v2);
                fd.append("images", imageFile);

                response = await fetch(`${apiUrl}/api/admin/resources${initialData ? `/${initialData.id}` : ""}`, {
                    method: initialData ? "PUT" : "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: fd,
                });
            } else {
                const finalData = {
                    ...formData,
                    price_per_hour: pricePerHour,
                    price_1v1: price1v1,
                    price_2v2: price2v2,
                };
                response = await fetch(`${apiUrl}/api/admin/resources${initialData ? `/${initialData.id}` : ""}`, {
                    method: initialData ? "PUT" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(finalData),
                });
            }

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || "შეცდომა დამატებისას");
            }

            const { resource } = await response.json();
            onAdd(resource);
            if (imageFile && onImagesUpdated) await onImagesUpdated();
            toast.success(initialData ? "სადგური წარმატებით განახლდა" : "სადგური წარმატებით დაემატა");
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "შეცდომა");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteResource = async () => {
        if (!initialData || !(await confirm({ message: "ნამდვილად გსურთ სადგურის წაშლა?", danger: true }))) return;
        try {
            const token = localStorage.getItem("admin_token");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${apiUrl}/api/admin/resources/${initialData.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error("წაშლის შეცდომა");
            onDelete(initialData.id);
            toast.success("სადგური წაიშალა");
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "წაშლა ვერ მოხერხდა");
        }
    };

    if (!isOpen) return null;

    const inputStyle = { ...modalStyles.input, width: "100%", boxSizing: "border-box" as const, outline: "none" };

    return (
        <div style={{ position: "fixed", inset: 0, ...modalStyles.overlay, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
            <div style={{ ...modalStyles.card, width: "100%", maxWidth: 560 }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #252529", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h2 style={{ fontSize: 16, fontWeight: 700, color: "#f0f0f2", margin: 0 }}>{initialData ? "სადგურის რედაქტირება" : "ახალი სადგურის დამატება"}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b6b75", cursor: "pointer", padding: 4 }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: 20 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>ფოტო</label>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ width: 72, height: 72, borderRadius: 10, background: "#0e0e10", border: "1px solid #252529", overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {imagePreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imagePreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                        <ImagePlus size={24} color="#3a3a42" />
                                    )}
                                </div>
                                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                                    <button type="button" onClick={() => fileInputRef.current?.click()} style={{ ...modalStyles.btnGhost, fontSize: 12, alignSelf: "flex-start" }}>
                                        {imagePreview ? "შეცვლა" : "ატვირთვა"}
                                    </button>
                                    {imageFile && <button type="button" onClick={clearImage} style={{ ...modalStyles.btnGhost, fontSize: 12, color: "#6b6b75", alignSelf: "flex-start" }}>წაშლა</button>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>დასახელება</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} style={inputStyle} placeholder="სადგურის დასახელება" required />
                        </div>
                        <div>
                            <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>ტიპი</label>
                            <select name="resource_type_id" value={formData.resource_type_id} onChange={handleChange} style={inputStyle} required>
                                <option value="">აირჩიეთ ტიპი</option>
                                {resourceTypes.map((rt) => (
                                    <option key={rt.id} value={rt.id}>{rt.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>ნომერი</label>
                            <input type="text" name="code" value={formData.code} onChange={handleChange} style={inputStyle} placeholder="მაგ: PC001" required />
                        </div>
                        <div>
                            <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>ფასირების რეჟიმი</label>
                            <select name="pricing_mode" value={formData.pricing_mode} onChange={handleChange} style={inputStyle}>
                                <option value="hourly">საათობრივი</option>
                                <option value="ps_mode">PS რეჟიმი</option>
                            </select>
                        </div>

                        {formData.pricing_mode === "hourly" ? (
                            <div>
                                <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>ფასი საათში</label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b6b75", fontSize: 13 }}>₾</span>
                                    <input type="number" name="price_per_hour" value={formData.price_per_hour || ""} onChange={handleChange} style={{ ...inputStyle, paddingLeft: 32 }} placeholder="0.00" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div>
                                    <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>1v1 ფასი</label>
                                    <div style={{ position: "relative" }}>
                                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b6b75", fontSize: 13 }}>₾</span>
                                        <input type="number" name="price_1v1" value={formData.price_1v1 || ""} onChange={handleChange} style={{ ...inputStyle, paddingLeft: 32 }} placeholder="0.00" />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>2v2 ფასი</label>
                                    <div style={{ position: "relative" }}>
                                        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#6b6b75", fontSize: 13 }}>₾</span>
                                        <input type="number" name="price_2v2" value={formData.price_2v2 || ""} onChange={handleChange} style={{ ...inputStyle, paddingLeft: 32 }} placeholder="0.00" />
                                    </div>
                                </div>
                            </>
                        )}

                        <div style={{ display: "flex", alignItems: "center" }}>
                            <label style={{ ...modalStyles.label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                                <input type="checkbox" name="is_vip" checked={formData.is_vip} onChange={handleChange} style={{ width: 16, height: 16, accentColor: "#f0f0f2" }} />
                                VIP სადგური
                            </label>
                        </div>
                        <div>
                            <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>სტატუსი</label>
                            <select name="status" value={formData.status} onChange={handleChange} style={inputStyle}>
                                <option value="available">ხელმისაწვდომი</option>
                                <option value="maintenance">ტექ. დათვალიერება</option>
                                <option value="inactive">არააქტიური</option>
                            </select>
                        </div>

                        <div style={{ gridColumn: "1 / -1" }}>
                            <label style={{ ...modalStyles.label, display: "block", marginBottom: 6 }}>აღწერა (არასავალდებულო)</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows={2} style={{ ...inputStyle, resize: "none" }} placeholder="..." />
                        </div>
                    </div>

                    <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #252529", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                        <button type="button" onClick={onClose} style={{ ...modalStyles.btnGhost, flex: 1, maxWidth: 120 }}>
                            გაუქმება
                        </button>
                        {initialData && (
                            <button type="button" onClick={handleDeleteResource} disabled={saving} style={{ ...modalStyles.btnDanger, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button type="submit" disabled={saving} style={{ ...modalStyles.btnPrimary, flex: 2, maxWidth: 160, cursor: saving ? "wait" : "pointer" }}>
                            {saving ? "ინახება..." : initialData ? "განახლება" : "დამატება"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}