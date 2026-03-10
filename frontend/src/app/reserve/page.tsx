"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Monitor, 
  Circle, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MapPin 
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";
import NormalAdSlot from "@/components/NormalAdSlot";

interface Resource {
    id: string;
    name?: string;
    code?: string;
    type_name?: string;
    type_slug?: string;
    is_vip?: boolean;
    pricing_mode?: string;
    price_per_hour?: number;
    price_1v1?: number;
    price_2v2?: number;
}

interface Reservation {
    resource_name?: string;
    reservation_date?: string;
    start_at?: string;
    end_at?: string;
    total_price?: number;
}

export default function ReservePage() {
    const toast = useToast();
    const settings = useWebsiteSettings();
    const searchParams = useSearchParams();
    const resourceIdFromUrl = searchParams.get("resourceId");
    const [step, setStep] = useState(1);

    // Calendar State
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
    
    // Resource State
    const [selectedResource, setSelectedResource] = useState<string | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<number>(1);
    const [selectedMode, setSelectedMode] = useState<string>("1v1"); // For PlayStation
    const [vipFilter, setVipFilter] = useState<"all" | "vip" | "standard">("all");
    const [resources, setResources] = useState<Resource[]>([]);
    const [, setLoading] = useState(true);
    
    // Validation State
    const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
    const [conflicts, setConflicts] = useState<Array<Record<string, unknown>>>([]);
    const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);

    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();

    // Fetch resources from API
    useEffect(() => {
        const fetchResources = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                const response = await fetch(`${apiUrl}/api/public/resources`);
                if (response.ok) {
                    const data = await response.json();
                    setResources(data.resources || []);
                }
            } catch (err) {
                console.error("Error fetching resources:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchResources();
    }, []);

    // Deep link: when coming from StationRow with ?resourceId=..., pre-select device and skip step 1
    useEffect(() => {
        if (!resourceIdFromUrl || resources.length === 0) return;
        const resource = resources.find((r) => r.id === resourceIdFromUrl);
        if (!resource) return;
        setSelectedResource(resourceIdFromUrl);
        if (resource.type_slug === "ps") {
            // PlayStation: stay on step 1 but show only mode picker (device selection skipped)
            setStep(1);
        } else {
            // Non-PlayStation: skip directly to step 2 (date/time)
            setStep(2);
        }
    }, [resourceIdFromUrl, resources]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const daysInMonth = getDaysInMonth(year, month);
    // Adjust to make Monday the 1st day of the week
    const firstDay = getFirstDayOfMonth(year, month);
    const startingEmptyDays = firstDay === 0 ? 6 : firstDay - 1;

    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const emptyDays = Array.from({ length: startingEmptyDays }, (_, i) => i);

    const monthNames = [
        "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
        "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
    ];

    const weekDays = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];

    const availableTimes = [
        "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
        "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
    ];

    // Filter resources based on VIP filter
    const filteredResources = resources.filter((resource: Resource) => {
        if (vipFilter === "all") return true;
        if (vipFilter === "vip") return resource.is_vip;
        if (vipFilter === "standard") return !resource.is_vip;
        return true;
    });

    // Group resources by type
    const groupedResources = filteredResources.reduce((groups: Record<string, Resource[]>, resource: Resource) => {
        const type = (resource.type_name || "Other") as string;
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(resource);
        return groups;
    }, {} as Record<string, Resource[]>);

    // Check if selected resource is PlayStation
    const isPlayStation = () => {
        const resource = resources.find(r => r.id === selectedResource);
        return resource?.type_slug === "ps";
    };

    // Handle next step with validation
    const handleNextStep = () => {
        if (step === 1 && !selectedResource) return;
        if (step === 2 && (!selectedDate || !selectedTime)) return;
        
        setStep(step + 1);
        scrollToTop();
    };

    // Handle PlayStation mode selection with auto-proceed
    const handleModeSelect = (mode: string) => {
        setSelectedMode(mode);
        // Auto-proceed to time selection after a short delay
        setTimeout(() => {
            setStep(2);
            scrollToTop();
        }, 300);
    };

    // Handle previous step
    const handlePrevStep = () => {
        if (step > 1) {
            setStep(step - 1);
            scrollToTop();
        }
    };

    const handlePrevMonth = () => {
        setCurrentMonthDate(new Date(year, month - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonthDate(new Date(year, month + 1, 1));
    };

    // Check availability for a specific date and resource
    const checkDateAvailability = async (date: Date, resourceId: string) => {
        if (!date || !resourceId) return;
        
        setIsCheckingAvailability(true);
        setConflicts([]);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${apiUrl}/api/public/reservations/check-availability`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resource_id: resourceId,
                    date: formatLocalDate(date)
                })
            });

            if (response.ok) {
                const data = await response.json();
                setUnavailableSlots(data.unavailable_slots || []);
                console.log('Available slots for date:', data);
            } else {
                console.error('Error checking availability');
                setUnavailableSlots([]);
            }
        } catch (err) {
            console.error("Availability check error:", err);
            setUnavailableSlots([]);
        } finally {
            setIsCheckingAvailability(false);
        }
    };

    // Auto-check availability when date and resource are selected
    useEffect(() => {
        if (selectedDate && selectedResource) {
            checkDateAvailability(selectedDate, selectedResource);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checkDateAvailability is stable
    }, [selectedDate, selectedResource]);

    // Check if a time slot is unavailable as a START time (considering selected duration)
    // For duration D, starting at T requires slots T, T+1h, ..., T+(D-1)h to all be free
    const isSlotUnavailable = (time: string) => {
        const idx = availableTimes.indexOf(time);
        if (idx === -1) return true;
        const duration = selectedDuration === 4 ? 4 : selectedDuration; // "მთელი დღე" = 4h
        for (let i = 0; i < duration; i++) {
            const slotIdx = idx + i;
            if (slotIdx >= availableTimes.length) return true; // would extend past closing
            if (unavailableSlots.includes(availableTimes[slotIdx])) return true;
        }
        return false;
    };

    const isDateSelected = (day: number) => {
        return selectedDate?.getDate() === day &&
            selectedDate?.getMonth() === month &&
            selectedDate?.getFullYear() === year;
    };

    // Check if a time slot has passed for today (GMT+4)
    const isTimePassed = (time: string) => {
        if (!selectedDate) return false;
        
        // Create dates in local timezone
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        
        // Only check times for today (in local timezone)
        if (selectedDay.getTime() !== today.getTime()) return false;
        
        // Parse the time (e.g., "10:00")
        const [hours, minutes] = time.split(':').map(Number);
        const timeSlot = new Date();
        timeSlot.setHours(hours, minutes, 0, 0);
        
        // Simple check: if current time is past the slot time minus 30 minutes buffer
        const thirtyMinutesInMs = 30 * 60 * 1000;
        return now.getTime() > (timeSlot.getTime() - thirtyMinutesInMs);
    };

    // Get available times filtering out past times for today
    const getAvailableTimes = () => {
        if (!selectedDate) return availableTimes;
        
        const today = new Date();
        const selectedDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        
        // If not today, show all times
        if (selectedDay.getTime() !== today.getTime()) {
            return availableTimes;
        }
        
        // If today, filter out past times
        return availableTimes.filter(time => !isTimePassed(time));
    };

    const isDatePast = (day: number) => {
        // Create date in local timezone (GMT+4)
        const date = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Compare dates in local timezone
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        
        return dateOnly < todayOnly;
    };

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successReservation, setSuccessReservation] = useState<Reservation | null>(null);

    // Format date as YYYY-MM-DD in local timezone (GMT+4)
    const formatLocalDate = (date: Date) => {
        // Create a new date object in the local timezone
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        
        const year = localDate.getFullYear();
        const month = String(localDate.getMonth() + 1).padStart(2, '0');
        const day = String(localDate.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Submit reservation
    const submitReservation = async () => {
        if (!customerName || !customerPhone) {
            toast.error("გთხოვთ შეავსეთ სახელი და გვარი");
            return;
        }

        setIsSubmitting(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL;
            const response = await fetch(`${apiUrl}/api/public/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    resource_id: selectedResource || "",
                    resource_name: (() => {
                        const r = resources.find(r => r.id === selectedResource);
                        return r ? (r.code ? `${r.name} #${r.code}` : r.name) || "" : "";
                    })(),
                    customer_name: customerName,
                    customer_phone: customerPhone,
                    date: selectedDate ? formatLocalDate(selectedDate) : "",
                    time: selectedTime || "",
                    duration_hours: selectedDuration,
                    mode: isPlayStation() ? selectedMode : null
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Success - show success modal and store reservation data
                toast.success("დაჯავშნა წარმატებით განხორციელდა");
                setSuccessReservation(data.reservation);
                setShowSuccessModal(true);
                // Reset form
                setStep(1);
                setSelectedResource(null);
                setSelectedDate(null);
                setSelectedTime(null);
                setSelectedDuration(1);
                setCustomerName("");
                setCustomerPhone("");
                setConflicts([]);
            } else {
                // Handle conflicts or other errors
                if (data.conflicts) {
                    setConflicts(data.conflicts);
                    toast.error("დროს დაჯავშნება შეუძლებელია. გთხოვთ შეარჩევოთ სხვა დროს.");
                } else {
                    toast.error(data.error || "დაჯავშნა ვერ მოხერხდა");
                }
            }
        } catch (err) {
            console.error("Reservation error:", err);
            toast.error("შეცდომა. გთხოვთ თავიდან სცადეთ.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Smooth scroll to top when step changes
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <div className="pt-16 pb-8 min-h-screen flex flex-col">
            <NormalAdSlot />
            <div className="section-container px-4 max-w-4xl mx-auto w-full flex-grow flex flex-col justify-center">

                <div className="text-center mb-6">
                    <h1 className="page-title gradient-text text-2xl sm:text-3xl">დაჯავშნე ადგილი</h1>
                    <p className="page-subtitle mx-auto text-sm sm:text-base">
                        აირჩიე მოწყობილობა, დრო და ატვირთე გადახდის ქვითარი.
                    </p>
                </div>

                <div className="glass-card p-4 sm:p-6">
                    {/* Steps indicator */}
                    <div className="flex items-center justify-between mb-6 relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 rounded-full" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-neon-cyan rounded-full transition-all duration-500"
                            style={{ 
                                width: step === 1 ? '0%' : step === 2 ? '50%' : '100%'
                            }}
                        />

                        {[1, 2, 3].map((num) => (
                            <div
                                key={num}
                                className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 z-10 ${step >= num
                                    ? "bg-neon-cyan text-[#06080f] shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                                    : "bg-[#111827] text-text-muted border border-white/20"
                                    }`}
                            >
                                {step > num ? <CheckCircle2 size={16} className="sm:size-5" /> : num}
                            </div>
                        ))}

                        {/* Step labels */}
                        <div className="absolute -bottom-5 left-0 right-0 flex justify-between text-xs text-text-muted px-1">
                            <span className="text-center flex-1 text-xs">მოწყობილობა</span>
                            <span className="text-center flex-1 text-xs">დრო</span>
                            <span className="text-center flex-1 text-xs">ინფო</span>
                        </div>
                    </div>

                    <div className="text-center text-xs sm:text-sm font-medium text-neon-cyan mb-6 uppercase tracking-widest">
                        {step === 1 && (resourceIdFromUrl && isPlayStation() ? "ნაბიჯი 1: რეჟიმის არჩევა" : "ნაბიჯი 1: მოწყობილობის არჩევა")}
                        {step === 2 && "ნაბიჯი 2: დროის არჩევა"}
                        {step === 3 && "ნაბიჯი 3: პერსონალური ინფორმაცია"}
                    </div>

                    {/* Step 1: Selection (or PlayStation mode only when from deep link) */}
                    {step === 1 && (
                        <div className="space-y-4 animate-fade-in-up">
                            {/* When from deep link with PlayStation: show only mode picker */}
                            {resourceIdFromUrl && selectedResource && isPlayStation() ? (
                                <div className="space-y-4">
                                    {(() => {
                                        const res = resources.find(r => r.id === selectedResource);
                                        const displayName = res?.code ? `${res.name} #${res.code}` : res?.name;
                                        return <p className="text-white font-medium text-sm">{displayName}</p>;
                                    })()}
                                    <div className="p-4 bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl">
                                        <label className="block text-sm font-medium text-white mb-3">აირჩიეთ თამაშის რეჟიმი</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => handleModeSelect("1v1")}
                                                className={`p-3 border-2 rounded-xl transition-all text-center ${
                                                    selectedMode === "1v1"
                                                        ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                                                        : "border-white/10 bg-white/5 text-white hover:border-white/20"
                                                }`}
                                            >
                                                <div className="text-lg font-bold mb-1">1v1</div>
                                                <div className="text-xs text-text-secondary mb-2">1 მოთამაშე</div>
                                                <div className="text-sm font-medium text-neon-green">
                                                    ₾{resources.find(r => r.id === selectedResource)?.price_1v1 || 0}/სთ
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleModeSelect("2v2")}
                                                className={`p-3 border-2 rounded-xl transition-all text-center ${
                                                    selectedMode === "2v2"
                                                        ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                                                        : "border-white/10 bg-white/5 text-white hover:border-white/20"
                                                }`}
                                            >
                                                <div className="text-lg font-bold mb-1">2v2</div>
                                                <div className="text-xs text-text-secondary mb-2">2 მოთამაშე</div>
                                                <div className="text-sm font-medium text-neon-green">
                                                    ₾{resources.find(r => r.id === selectedResource)?.price_2v2 || 0}/სთ
                                                </div>
                                            </button>
                                        </div>
                                        <p className="text-xs text-text-muted mt-3">რეჟიმის არჩევის შემდეგ ავტომატურად გადახვალდება დროის არჩევაზე</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                            {/* Compact: Filter + Label inline */}
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                <span className="text-xs font-medium text-text-secondary">1. აირჩიეთ მოწყობილობა</span>
                                <span className="text-text-muted">·</span>
                                <div className="flex gap-1.5">
                                    {(["all", "standard", "vip"] as const).map((f) => (
                                        <button
                                            key={f}
                                            onClick={() => setVipFilter(f)}
                                            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                                                vipFilter === f
                                                    ? f === "vip"
                                                        ? "bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/20"
                                                        : "bg-neon-cyan text-[#06080f]"
                                                    : "bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10 hover:text-white"
                                            }`}
                                        >
                                            {f === "all" && "ყველა"}
                                            {f === "standard" && "სტანდარტული"}
                                            {f === "vip" && "⭐ VIP"}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Compact grid: more items per row */}
                            <div className="space-y-3">
                                {Object.entries(groupedResources).map(([typeName, typeResources]) => (
                                    <div key={typeName}>
                                        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            {typeName === "Gaming PC" && <Monitor size={12} className="text-neon-cyan" />}
                                            {typeName === "PlayStation 5" && <span className="text-neon-cyan">🎮</span>}
                                            {typeName === "ბილიარდი" && <Circle size={12} className="text-neon-cyan" />}
                                            {typeName === "მაგიდის ჩოგბურთი" && <span className="text-neon-cyan">🏎️</span>}
                                            {typeName === "საჭე" && <span className="text-neon-cyan">🏎️</span>}
                                            {typeName === "ფლეისთეიშენი" && <span className="text-neon-cyan">🎮</span>}
                                            {typeName}
                                        </h3>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                                            {typeResources.map((resource: Resource) => (
                                                <button
                                                    key={resource.id}
                                                    onClick={() => setSelectedResource(resource.id)}
                                                    className={`px-2.5 py-2 border rounded-lg transition-all text-left flex items-center justify-between gap-2 ${
                                                        selectedResource === resource.id
                                                            ? "border-neon-cyan bg-neon-cyan/10"
                                                            : "border-white/10 bg-white/5 hover:border-white/20"
                                                    }`}
                                                >
                                                    <span className="text-white font-medium text-xs truncate">{resource.code ? `${resource.name} #${resource.code}` : resource.name}</span>
                                                    <span className="flex items-center gap-1 shrink-0">
                                                        {resource.is_vip && <span className="text-[10px] font-bold text-amber-400">VIP</span>}
                                                        <span className="text-neon-green font-semibold text-xs">₾{(resource.pricing_mode === "ps_mode" ? resource.price_1v1 : resource.price_per_hour) ?? 0}/სთ</span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                        
                                        {/* PlayStation mode: compact inline */}
                                        {selectedResource && typeResources.some((r: Resource) => r.id === selectedResource && r.type_slug === "ps") && (
                                            <div className="mt-2 p-2.5 bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-text-secondary">რეჟიმი:</span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleModeSelect("1v1")}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                selectedMode === "1v1"
                                                                    ? "bg-neon-cyan text-[#06080f]"
                                                                    : "bg-white/5 border border-white/10 text-white hover:border-white/20"
                                                            }`}
                                                        >
                                                            1v1 · ₾{resources.find(r => r.id === selectedResource)?.price_1v1 || 0}/სთ
                                                        </button>
                                                        <button
                                                            onClick={() => handleModeSelect("2v2")}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                                selectedMode === "2v2"
                                                                    ? "bg-neon-cyan text-[#06080f]"
                                                                    : "bg-white/5 border border-white/10 text-white hover:border-white/20"
                                                            }`}
                                                        >
                                                            2v2 · ₾{resources.find(r => r.id === selectedResource)?.price_2v2 || 0}/სთ
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleNextStep}
                                disabled={!selectedResource || (isPlayStation() && !selectedMode)}
                                className={`btn-primary w-full py-3 sm:py-4 text-sm sm:text-base ${(!selectedResource || (isPlayStation() && !selectedMode)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                გაგრძელება
                            </button>
                                </>
                            )}
                        </div>
                    )}
                    {/* Step 2: Time Selection */}
                    {step === 2 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                                {/* Calendar */}
                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-text-secondary mb-3">
                                        1. აირჩიეთ თარიღი
                                    </label>
                                    <div className="bg-[#06080f]/50 border border-white/10 rounded-xl p-3 sm:p-5">
                                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                                            <button onClick={handlePrevMonth} className="p-1 hover:text-neon-cyan transition-colors text-text-secondary">
                                                <ChevronLeft size={16} className="sm:size-5" />
                                            </button>
                                            <span className="text-white font-medium text-sm">
                                                {monthNames[month]} {year}
                                            </span>
                                            <button onClick={handleNextMonth} className="p-1 hover:text-neon-cyan transition-colors text-text-secondary">
                                                <ChevronRight size={16} className="sm:size-5" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 mb-2">
                                            {weekDays.map((d) => (
                                                <div key={d} className="text-center text-xs font-medium text-text-muted py-1">
                                                    {d}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {emptyDays.map((_, i) => (
                                                <div key={`empty-${i}`} className="p-1 sm:p-2" />
                                            ))}
                                            {days.map((day) => {
                                                const past = isDatePast(day);
                                                const selected = isDateSelected(day);
                                                return (
                                                    <button
                                                        key={day}
                                                        disabled={past}
                                                        onClick={() => {
                                                            setSelectedDate(new Date(year, month, day));
                                                            setSelectedTime(null);
                                                            setConflicts([]);
                                                        }}
                                                        className={`p-1 sm:p-2 w-6 h-6 sm:w-8 sm:h-8 mx-auto rounded-full flex items-center justify-center text-xs sm:text-sm transition-all focus:outline-none ${past
                                                            ? "text-text-muted/30 cursor-not-allowed"
                                                            : selected
                                                                ? "bg-neon-cyan text-[#06080f] font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                                                                : "text-text-secondary hover:bg-white/10 hover:text-white"
                                                            }`}
                                                    >
                                                        {day}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Time Selection */}
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-text-secondary mb-3">
                                        2. აირჩიეთ {selectedDate ? "თავისუფალი დრო" : "ხანგრძლივობა"}
                                    </label>

                                    {!selectedDate ? (
                                        <div className="flex-grow flex flex-col justify-center items-center p-4 sm:p-8 bg-[#06080f]/50 border border-white/5 text-center rounded-xl h-full border-dashed">
                                            <Clock size={24} className="sm:size-8 text-text-muted mb-3 sm:mb-4 opacity-50" />
                                            <p className="text-xs sm:text-sm text-text-muted">გთხოვთ აირჩიოთ თარიღი <br /> დროის სლოტების სანახავად</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-xs font-medium text-text-secondary mb-2">ხანგრძლივობა</label>
                                                <select 
                                                    value={selectedDuration}
                                                    onChange={(e) => {
                                                        setSelectedDuration(Number(e.target.value));
                                                        setSelectedTime(null);
                                                        setConflicts([]);
                                                    }}
                                                    className="w-full bg-[#06080f]/80 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-neon-cyan appearance-none"
                                                >
                                                    <option value={1}>1 სათი</option>
                                                    <option value={2}>2 სათი</option>
                                                    <option value={3}>3 სათი</option>
                                                    <option value={4}>მთელი დღე</option>
                                                </select>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-[180px] sm:max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                                {(() => {
                                                    const available = getAvailableTimes().filter((time) => !isSlotUnavailable(time));
                                                    if (available.length === 0) {
                                                        return (
                                                            <p className="col-span-full text-center text-text-muted text-sm py-4">
                                                                {isCheckingAvailability ? "შემოწმება..." : "ამ თარიღზე ხელმისაწვდომი სლოტები არ არის"}
                                                            </p>
                                                        );
                                                    }
                                                    return available.map((time) => {
                                                        const passed = isTimePassed(time);
                                                        const disabled = passed || isCheckingAvailability;
                                                        return (
                                                            <button
                                                                key={time}
                                                                onClick={() => {
                                                                    if (!disabled) {
                                                                        setSelectedTime(time);
                                                                        setConflicts([]);
                                                                    }
                                                                }}
                                                                disabled={disabled}
                                                                className={`py-2 px-1 sm:px-2 sm:px-3 rounded-lg text-xs font-semibold tracking-wider transition-all border ${
                                                                    selectedTime === time
                                                                        ? "bg-neon-cyan/15 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                                                                        : disabled
                                                                            ? "bg-white/5 border-white/10 text-text-muted cursor-not-allowed opacity-50"
                                                                            : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                                                                } ${isCheckingAvailability ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                {isCheckingAvailability ? '...' : time}
                                                            </button>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={handlePrevStep}
                                    className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm"
                                >
                                    უკან
                                </button>
                                
                                <button
                                    onClick={handleNextStep}
                                    disabled={!selectedDate || !selectedTime || isCheckingAvailability}
                                    className={`btn-primary px-4 py-2 sm:px-6 sm:py-3 text-sm ${(!selectedDate || !selectedTime || isCheckingAvailability) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {isCheckingAvailability ? 'შემოწმება...' : 'გაგრძელება'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Info */}
                    {step === 3 && (
                        <div className="space-y-5 animate-fade-in-up">
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">სახელი და გვარი</label>
                                <input 
                                    type="text" 
                                    placeholder="მაგ: გიორგი მაისურაძე" 
                                    className="w-full bg-[#06080f]/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-secondary mb-2">მობილურის ნომერი</label>
                                <div className="flex">
                                    <span className="flex items-center px-4 bg-white/5 border border-r-0 border-white/10 rounded-l-lg text-text-secondary">+995</span>
                                    <input 
                                        type="tel" 
                                        placeholder="5XX XX XX XX" 
                                        className="w-full bg-[#06080f]/50 border border-white/10 rounded-r-lg px-4 py-3 text-white focus:outline-none focus:border-neon-cyan"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                    />
                                </div>
                                <p className="text-xs text-text-muted mt-2">რეგისტრაციის კოდს (OTP) მიღებთ ამ ნომერზე SMS-ით.</p>
                            </div>

                            {/* Navigation buttons */}
                            <div className="flex justify-between pt-4">
                                <button
                                    onClick={handlePrevStep}
                                    className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 border border-white/20 rounded-lg text-white hover:bg-white/20 transition-colors text-sm"
                                >
                                    უკან
                                </button>
                                
                                <button
                                    onClick={() => {
                                        if (!customerName || !customerPhone) {
                                            toast.error("გთხოვთ შეავსეთ სახელი და გვარი");
                                            return;
                                        }
                                        submitReservation();
                                    }}
                                    disabled={!customerName || !customerPhone || isSubmitting}
                                    className="btn-primary px-4 py-2 sm:px-6 sm:py-3 text-sm"
                                >
                                    {isSubmitting ? 'დამუშნება...' : 'დაჯავშნის დასრულება'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Payment - TEMPORARILY DISABLED */}
                    {false && step === 3 && (
                        <div className="space-y-6 animate-fade-in-up">
                            <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-xl p-5 text-center">
                                <p className="text-text-secondary text-sm mb-2">ჯამური თანხა გადასახდელად</p>
                                <p className="text-3xl font-display font-bold text-neon-cyan">15.00 ₾</p>
                            </div>

                            <div className="space-y-3">
                                <p className="text-sm font-medium text-white">გადარიცხეთ თანხა ანგარიშზე:</p>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                                    <div>
                                        <p className="text-xs text-text-muted mb-1">საქართველოს ბანკი (BOG)</p>
                                        <p className="font-mono text-white text-sm break-all">GE00BG0000000000000000</p>
                                        <p className="text-xs text-text-muted mt-1">მიმღები: შპს არენაფლოუ</p>
                                    </div>
                                    <Image src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Bank_of_Georgia_Logo.svg/512px-Bank_of_Georgia_Logo.svg.png" alt="BOG" width={32} height={32} className="h-8 w-8 opacity-70 bg-white p-1 rounded object-contain" />
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                                    <div>
                                        <p className="text-xs text-text-muted mb-1">თიბისი ბანკი (TBC)</p>
                                        <p className="font-mono text-white text-sm break-all">GE00TB0000000000000000</p>
                                        <p className="text-xs text-text-muted mt-1">მიმღები: შპს არენაფლოუ</p>
                                    </div>
                                    <div className="h-8 w-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold text-xs shrink-0">TBC</div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/10">
                                <label className="block text-sm font-medium text-white mb-2">ატვირთეთ გადახდის ქვითარი (სქრინი)</label>
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:bg-white/5 hover:border-neon-cyan transition-colors cursor-pointer">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl text-neon-cyan">+</span>
                                    </div>
                                    <p className="text-sm text-text-secondary">დააკლიკეთ ან ჩააგდეთ ფაილი აქ</p>
                                    <p className="text-xs text-text-muted mt-1">PDF, JPG, PNG (მაქს. 5MB)</p>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 mt-6">
                                <button onClick={() => setStep(2)} className="btn-secondary w-full sm:w-1/3 py-3.5">
                                    უკან
                                </button>
                                <button className="btn-primary w-full sm:w-2/3 py-3.5 bg-gradient-to-r from-neon-green to-emerald-500 hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] text-[#06080f]" 
                                onClick={submitReservation}
                                disabled={isSubmitting || conflicts.length > 0}
                            >
                                {isSubmitting ? 'დამუშნება...' : 'დაჯავშნის დასრულება'}
                            </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-[#06080f] border border-white/10 rounded-2xl p-4 sm:p-8 max-w-md w-full mx-auto shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
                        <div className="text-center">
                            {/* Success Icon */}
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-neon-green/20 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                                <CheckCircle2 size={24} className="text-neon-green sm:size-8" />
                            </div>
                            
                            {/* Success Message */}
                            <h3 className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-4">რეზერვაცია წარმატებით დადასტურდა!</h3>
                            
                            <p className="text-text-secondary text-sm sm:text-base mb-4 sm:mb-6 px-2">
                                თქვენი რეზერვაცია წარმატებით განთავსდა. დამატებითი ინფორმაციისთვის დაგვიკავშირდეთ.
                            </p>

                            {/* Reservation Details */}
                            {successReservation && (
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 text-left">
                                    <h4 className="text-neon-cyan font-medium mb-2 sm:mb-3 text-sm sm:text-base">რეზერვაციის დეტალები:</h4>
                                    <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">მოწყობილობა:</span>
                                            <span className="text-white">{successReservation.resource_name ?? ""}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">თარიღი:</span>
                                            <span className="text-white">
                                                {successReservation.reservation_date ? new Date(successReservation.reservation_date).toLocaleDateString("ka-GE") : ""}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">დრო:</span>
                                            <span className="text-white">
                                                {successReservation.start_at && successReservation.end_at
                                                    ? `${new Date(successReservation.start_at).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })} - ${new Date(successReservation.end_at).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" })}`
                                                    : ""}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">ხანგრძლივობა:</span>
                                            <span className="text-white">
                                                {successReservation.start_at && successReservation.end_at
                                                    ? `${Math.round((new Date(successReservation.end_at).getTime() - new Date(successReservation.start_at).getTime()) / (1000 * 60 * 60))} საათი`
                                                    : ""}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-text-secondary">ჯამური თანხა:</span>
                                            <span className="text-neon-green font-medium">{successReservation.total_price ?? 0} ₾</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Contact Information - from dashboard settings */}
                            {(settings?.phone || settings?.email || settings?.address || settings?.city || settings?.maps_url) && (
                                <div className="bg-white/5 border border-white/10 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                                    <h4 className="text-neon-cyan font-medium mb-2 sm:mb-3 text-sm sm:text-base">საკონტაქტო ინფორმაცია:</h4>
                                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                                        {settings?.phone && (
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-neon-cyan sm:size-4" />
                                                    <a href={`tel:+${(settings.phone.replace(/\D/g, "").startsWith("995") ? settings.phone.replace(/\D/g, "") : "995" + settings.phone.replace(/\D/g, ""))}`} className="text-white hover:text-neon-cyan transition-colors">
                                                        {settings.phone}
                                                    </a>
                                                </div>
                                                <div className="flex gap-2">
                                                    <a href={`viber://chat?number=%2B${(settings.phone.replace(/\D/g, "").startsWith("995") ? settings.phone.replace(/\D/g, "") : "995" + settings.phone.replace(/\D/g, ""))}`} className="px-2 py-1 bg-purple-600/20 border border-purple-600/30 rounded text-purple-400 hover:bg-purple-600/30 transition-colors text-xs">Viber</a>
                                                    <a href={`https://wa.me/${(settings.phone.replace(/\D/g, "").startsWith("995") ? settings.phone.replace(/\D/g, "") : "995" + settings.phone.replace(/\D/g, ""))}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-green-600/20 border border-green-600/30 rounded text-green-400 hover:bg-green-600/30 transition-colors text-xs">WhatsApp</a>
                                                </div>
                                            </div>
                                        )}
                                        {settings?.email && (
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} className="text-neon-cyan sm:size-4" />
                                                <a href={`mailto:${settings.email}`} className="text-white hover:text-neon-cyan transition-colors">{settings.email}</a>
                                            </div>
                                        )}
                                        {(settings?.maps_url || settings?.address || settings?.city) && (
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-neon-cyan sm:size-4" />
                                                <a href={settings?.maps_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([settings.city, settings.address].filter(Boolean).join(", "))}`} target="_blank" rel="noopener noreferrer" className="text-white hover:text-neon-cyan transition-colors">
                                                    {[settings.city, settings.address].filter(Boolean).join(", ") || "რუკაზე ნახვა"}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="btn-primary w-full py-2 sm:py-3 bg-gradient-to-r from-neon-green to-emerald-500 hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] text-[#06080f] font-medium text-sm sm:text-base"
                            >
                                გასაგრძელებლად
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
