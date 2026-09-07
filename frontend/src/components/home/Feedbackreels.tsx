"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX, Heart, MessageCircle, Share2, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { DEFAULT_PRODUCT_REELS, mapApiProductReel } from "../../data/defaultProductReels";
import { resolveMediaUrl } from "../../utils/mediaUrl";

function ReelCard({
    item,
    index,
    onFullscreen,
}: {
    item: ReturnType<typeof mapApiProductReel>;
    index: number;
    onFullscreen: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [muted, setMuted] = useState(true);
    const videoSrc = resolveMediaUrl(item.video);
    const posterSrc = item.poster ? resolveMediaUrl(item.poster) : undefined;

    const toggleMute = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        const next = !muted;
        setMuted(next);
        if (videoRef.current) videoRef.current.muted = next;
    };

    const stopLink = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
    };

    const card = (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: Math.min(index, 4) * 0.08 }}
            viewport={{ once: true }}
            className="relative mx-auto h-[68vw] max-h-[480px] min-h-[380px] w-[68vw] max-w-[260px] overflow-hidden rounded-[32px] bg-black shadow-xl sm:mx-0 sm:h-[420px] sm:w-auto sm:max-h-none sm:min-h-0 sm:max-w-none"
        >
            <video
                ref={videoRef}
                src={videoSrc}
                poster={posterSrc}
                autoPlay
                muted={muted}
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25" />

            <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-4">
                <button
                    type="button"
                    onClick={toggleMute}
                    aria-label={muted ? "Unmute reel" : "Mute reel"}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                >
                    {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                <div className="flex flex-col items-center gap-1">
                    <button
                        type="button"
                        onClick={stopLink}
                        aria-label="Like"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                    >
                        <Heart size={20} />
                    </button>
                    <span className="text-xs font-semibold text-white drop-shadow">{item.likes}</span>
                </div>

                <button
                    type="button"
                    onClick={stopLink}
                    aria-label="Comments"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                >
                    <MessageCircle size={20} />
                </button>

                <button
                    type="button"
                    onClick={stopLink}
                    aria-label="Share"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                >
                    <Share2 size={20} />
                </button>

                <button
                    type="button"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onFullscreen();
                    }}
                    aria-label="Watch full size"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
                >
                    <Maximize2 size={18} />
                </button>
            </div>

            <div className="absolute bottom-5 left-4 z-10 max-w-[70%] text-white">
                <p className="text-sm font-medium text-white/90">{item.title}</p>
                <h3 className="text-xl font-bold leading-tight">{item.product}</h3>
                <p className="mt-0.5 text-xl font-bold">{item.price}</p>
            </div>
        </motion.div>
    );

    if (item.linkUrl) {
        return (
            <Link to={item.linkUrl} className="block">
                {card}
            </Link>
        );
    }

    return card;
}

export default function FeedbackReels() {
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const [remoteReels, setRemoteReels] = useState<ReturnType<typeof mapApiProductReel>[] | null>(null);
    const [fullscreenReel, setFullscreenReel] = useState<ReturnType<typeof mapApiProductReel> | null>(null);

    useEffect(() => {
        if (!fullscreenReel) return undefined;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setFullscreenReel(null);
        };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [fullscreenReel]);

    useEffect(() => {
        let cancelled = false;
        api
            .productReels()
            .then((payload) => {
                if (cancelled) return;
                const items = (payload.reels || []).map(mapApiProductReel);
                setRemoteReels(items.length ? items : []);
            })
            .catch(() => {
                if (!cancelled) setRemoteReels([]);
            });
        return () => {
            cancelled = true;
        };
    }, []);

    const reels = useMemo(() => {
        if (remoteReels === null) return DEFAULT_PRODUCT_REELS.map(mapApiProductReel);
        if (remoteReels.length) return remoteReels;
        return DEFAULT_PRODUCT_REELS.map(mapApiProductReel);
    }, [remoteReels]);

    const scrollByCard = (direction: -1 | 1) => {
        const scroller = scrollerRef.current;
        if (!scroller) return;
        scroller.scrollBy({ left: direction * scroller.clientWidth, behavior: "smooth" });
    };

    return (
        <section className="bg-[#f8f6f3] py-16 sm:py-24">
            <div className="mx-auto max-w-7xl sm:px-6">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                    className="mb-10 px-6 text-center sm:mb-16"
                >
                    <p className="text-sm font-bold uppercase tracking-[4px] text-yellow-500">Watch & Shop</p>
                    <h2 className="mt-3 text-4xl font-bold text-slate-900 sm:text-5xl">
                        Products <span className="italic text-yellow-500">Reels</span>
                    </h2>
                    <p className="mt-4 text-slate-500">See our products in action</p>
                </motion.div>

                <div className="relative">
                    <button
                        type="button"
                        onClick={() => scrollByCard(-1)}
                        aria-label="Previous reel"
                        className="absolute left-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#F5B400] text-black shadow-lg sm:hidden"
                    >
                        <ChevronLeft size={26} strokeWidth={2.5} />
                    </button>
                    <button
                        type="button"
                        onClick={() => scrollByCard(1)}
                        aria-label="Next reel"
                        className="absolute right-2 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#F5B400] text-black shadow-lg sm:hidden"
                    >
                        <ChevronRight size={26} strokeWidth={2.5} />
                    </button>

                    <div
                        ref={scrollerRef}
                        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-hide sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:gap-6 lg:grid-cols-5"
                    >
                        {reels.map((item, index) => (
                            <div
                                key={item._id || `${item.product}-${index}`}
                                data-reel-card
                                className="flex w-full min-w-full shrink-0 snap-center justify-center px-14 sm:contents sm:w-auto sm:min-w-0 sm:px-0"
                            >
                                <ReelCard
                                    item={item}
                                    index={index}
                                    onFullscreen={() => setFullscreenReel(item)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {fullscreenReel ? (
                <div
                    className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-3"
                    onClick={() => setFullscreenReel(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Full size reel"
                >
                    <button
                        type="button"
                        onClick={() => setFullscreenReel(null)}
                        aria-label="Close full size video"
                        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white"
                    >
                        <X size={22} />
                    </button>
                    <video
                        src={resolveMediaUrl(fullscreenReel.video)}
                        poster={fullscreenReel.poster ? resolveMediaUrl(fullscreenReel.poster) : undefined}
                        autoPlay
                        controls
                        playsInline
                        className="max-h-[90vh] max-w-full rounded-2xl object-contain"
                        onClick={(event) => event.stopPropagation()}
                    />
                </div>
            ) : null}
        </section>
    );
}
