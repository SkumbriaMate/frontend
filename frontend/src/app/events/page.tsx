"use client";

import { useState, useEffect } from "react";
import { getApiBase } from "@/lib/api";
import EventCard from "@/components/EventCard";
import NormalAdSlot from "@/components/NormalAdSlot";

type Event = {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    image_url: string;
    category: string;
};

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const apiUrl = getApiBase();
                const response = await fetch(`${apiUrl}/api/public/events`);
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();
                setEvents(data.events || []);
            } catch (err) {
                console.error("Error fetching events:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center pt-24"><div className="w-8 h-8 rounded-full border-b-2 border-neon-cyan animate-spin"></div></div>;
    }

    return (
        <div className="pt-24 pb-16">
            <div className="section-container px-5">
                {/* Header */}
                <NormalAdSlot />
                <div className="text-center mb-12">
                    <h1 className="page-title gradient-text">ღონისძიებები</h1>
                    <p className="page-subtitle mx-auto">
                        ტურნირები, ქომიუნითი შეხვედრები და შეთავაზებები.
                        შემოგვიერთდი და შეეჯიბრე საუკეთესოებს.
                    </p>
                </div>

                {/* Events Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {events.length > 0 ? (
                        events.map((event) => (
                            <EventCard
                                key={event.id}
                                title={event.title}
                                description={event.description}
                                date={new Date(event.date).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric', year: 'numeric' })}
                                time={event.time.slice(0, 5)}
                                image={event.image_url || "https://placehold.co/800x400/0c1120/64748b?text=Event"}
                                category={event.category}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-text-muted">
                            ამჟამად ღონისძიებები დაგეგმილი არ არის.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
