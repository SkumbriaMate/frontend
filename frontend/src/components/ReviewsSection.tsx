"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Star, X } from "lucide-react";
import { useWebsiteSettings } from "@/context/WebsiteSettingsContext";

type Review = {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

const ROTATE_INTERVAL_MS = 5000;
const SLIDE_DURATION_MS = 450;

function ReviewCard({
  review,
  isBlurred,
}: {
  review: Review;
  isBlurred: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl border bg-bg-primary/80 p-5 sm:p-6 flex flex-col min-h-[180px] sm:min-h-[200px] flex-shrink-0
        transition-all duration-300 ease-out
        ${isBlurred ? "border-white/5 opacity-50 scale-95 blur-[2px]" : "border-neon-cyan/20 shadow-lg shadow-neon-cyan/5 scale-100"}
      `}
    >
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={16}
            className={n <= review.rating ? "text-amber-400 fill-amber-400" : "text-white/20"}
          />
        ))}
      </div>
      {review.comment ? (
        <p className="text-text-secondary text-sm leading-relaxed flex-grow line-clamp-4">
          {review.comment}
        </p>
      ) : (
        <p className="text-text-muted text-sm italic flex-grow">—</p>
      )}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <span className="font-semibold text-text-primary text-sm">{review.customer_name}</span>
        <span className="text-xs text-text-muted">
          {new Date(review.created_at).toLocaleDateString("ka-GE", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

export default function ReviewsSection() {
  const settings = useWebsiteSettings();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formComment, setFormComment] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const companyId = settings?.company_id ?? null;

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      setLoading(false);
      return;
    }
    const url = companyId
      ? `${apiUrl}/api/public/reviews?company_id=${companyId}`
      : `${apiUrl}/api/public/reviews`;
    fetch(url)
      .then((r) => (r.ok ? r.json() : { reviews: [] }))
      .then((d) => setReviews(d.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  }, [companyId]);

  const n = reviews.length;
  const prevIndex = n > 0 ? (activeIndex - 1 + n) % n : 0;
  const nextIndex = n > 0 ? (activeIndex + 1) % n : 0;
  const nextNextIndex = n > 0 ? (activeIndex + 2) % n : 0;
  const [isSliding, setIsSliding] = useState(false);
  const [slideOffset, setSlideOffset] = useState(0);

  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advanceIndex = useCallback(() => {
    if (n < 2) return;
    if (advanceTimeoutRef.current) return;
    setIsSliding(true);
    setSlideOffset(-1);
    advanceTimeoutRef.current = setTimeout(() => {
      advanceTimeoutRef.current = null;
      setActiveIndex((i) => (i + 1) % n);
      setSlideOffset(0);
      setIsSliding(false);
    }, SLIDE_DURATION_MS);
  }, [n]);

  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(advanceIndex, ROTATE_INTERVAL_MS);
    return () => {
      clearInterval(t);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, [n, advanceIndex]);

  useEffect(() => {
    if (!modalOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !formSubmitting) setModalOpen(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [modalOpen, formSubmitting]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!companyId || !formName.trim()) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) return;
      setFormSubmitting(true);
      try {
        const r = await fetch(`${apiUrl}/api/public/reviews`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            customer_name: formName.trim(),
            rating: formRating,
            comment: formComment.trim() || null,
          }),
        });
        if (r.ok) {
          setFormSuccess(true);
          setFormName("");
          setFormRating(5);
          setFormComment("");
          setTimeout(() => {
            setFormSuccess(false);
            setModalOpen(false);
          }, 2000);
        }
      } finally {
        setFormSubmitting(false);
      }
    },
    [companyId, formName, formRating, formComment]
  );

  const showSection = !loading && (reviews.length > 0 || companyId);
  if (!showSection) return null;

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;
  const avgDisplay = avgRating > 0 ? avgRating.toFixed(1) : "—";

  return (
    <section className="section-padding bg-bg-secondary/50 overflow-hidden">
      <div className="section-container">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="page-title gradient-text">ჩვენი მომხმარებლების კომენტარები</h2>
          {reviews.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-3 mb-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={20} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="font-semibold text-text-primary font-mono text-lg">{avgDisplay}</span>
              <span className="text-text-muted text-sm">/ 5</span>
            </div>
          )}
          <p className="page-subtitle mx-auto">
            რას ამბობენ ჩვენი ერთგული სტუმრები
          </p>
        </div>

        {reviews.length > 0 ? (
          <div className="relative w-full max-w-4xl mx-auto">
            {/* Carousel: smooth slide on desktop, single card on mobile */}
            {n >= 2 ? (
              <>
                {/* Desktop: sliding strip */}
                <div className="hidden sm:block overflow-hidden px-4">
                  <div
                    className="flex"
                    style={{
                      width: "133.333%",
                      transform: `translateX(${slideOffset * 25}%)`,
                      transition: isSliding ? `transform ${SLIDE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)` : "none",
                    }}
                  >
                    {/* 4 cards for seamless slide: prev, center, next, nextNext */}
                    {[prevIndex, activeIndex, nextIndex, nextNextIndex].map((idx, i) => (
                      <div key={`${idx}-${i}`} className="flex-shrink-0 w-1/4 px-2">
                        <ReviewCard review={reviews[idx]!} isBlurred={i !== 1} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mobile: single card with fade */}
                <div className="sm:hidden max-w-md mx-auto px-2">
                  <div
                    key={activeIndex}
                    className="animate-review-fade-in"
                  >
                    <ReviewCard review={reviews[activeIndex]!} isBlurred={false} />
                  </div>
                </div>
              </>
            ) : (
              <div className="max-w-md mx-auto px-2">
                <ReviewCard review={reviews[0]!} isBlurred={false} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-text-muted text-sm">
            ჯერ მიმოხილვები არ არის. დატოვეთ პირველი!
          </div>
        )}

        {companyId && (
          <div className="text-center mt-10 sm:mt-12">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              დატოვეთ კომენტარი
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto min-h-full"
          style={{ background: "rgba(0,0,0,0.92)", backdropFilter: "blur(4px)" }}
          onClick={() => !formSubmitting && setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-bg-primary shadow-xl overflow-hidden shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10">
              <h3 id="review-modal-title" className="text-lg font-semibold text-text-primary">დატოვეთ თქვენი მიმოხილვა</h3>
              <button
                type="button"
                onClick={() => !formSubmitting && setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              {formSuccess ? (
                <p className="text-center text-neon-cyan/90 text-sm py-6">
                  მადლობა! თქვენი მიმოხილვა გაეგზავნა და გამოჩნდება მას შემდეგ, რაც ადმინი დაუჭერს მას.
                </p>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <p className="text-xs text-text-muted leading-relaxed py-2 px-3 rounded-lg bg-white/5 border border-white/5">
                    შეგიძლიათ დარჩეთ ანონიმურად. დაბალი შეფასების მიმოხილვები შესაბამისი ახსნის გარეშე წაიშლება. ჩვენ მზად ვართ მივიღოთ საჩივრები — გთხოვთ იყოთ სამართლიანი. ჩვენ ყოველთვის ვეცდებით გავაუმჯობესოთ.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">სახელი</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      required
                      placeholder="თქვენი სახელი"
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">შეფასება</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormRating(star)}
                          className="p-1.5 sm:p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <Star
                            size={24}
                            className={star <= formRating ? "text-amber-400 fill-amber-400" : "text-white/20"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">კომენტარი (არასავალდებულო)</label>
                    <textarea
                      value={formComment}
                      onChange={(e) => setFormComment(e.target.value)}
                      rows={3}
                      placeholder="დაწერეთ თქვენი შეგრძნება..."
                      className="w-full px-4 py-2.5 rounded-xl bg-bg-secondary border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-neon-cyan/30 resize-none text-sm sm:text-base"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full btn-primary py-3 disabled:opacity-60 text-sm sm:text-base"
                  >
                    {formSubmitting ? "იგზავნება..." : "გაგზავნა"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
