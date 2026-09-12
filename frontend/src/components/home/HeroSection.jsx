import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { api } from "../../services/api";
import { DEFAULT_HOME_SLIDES, mapApiSlideToHero } from "../../data/defaultHomeSlides";
import { resolveMediaUrl } from "../../utils/mediaUrl";

export default function HeroSection() {
  const [remoteSlides, setRemoteSlides] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .homeSlides()
      .then((payload) => {
        if (cancelled) return;
        const items = (payload.slides || []).map(mapApiSlideToHero);
        setRemoteSlides(items.length ? items : []);
      })
      .catch(() => {
        if (!cancelled) setRemoteSlides([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const slides = useMemo(() => {
    if (remoteSlides === null) return DEFAULT_HOME_SLIDES.map(mapApiSlideToHero);
    if (remoteSlides.length) return remoteSlides;
    return DEFAULT_HOME_SLIDES.map(mapApiSlideToHero);
  }, [remoteSlides]);

  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [swiper, setSwiper] = useState(null);
  const showArrows = slides.length > 1;

  useEffect(() => {
    if (!swiper || !prevRef.current || !nextRef.current) return undefined;
    swiper.params.navigation.prevEl = prevRef.current;
    swiper.params.navigation.nextEl = nextRef.current;
    swiper.navigation.destroy();
    swiper.navigation.init();
    swiper.navigation.update();
    return undefined;
  }, [swiper, showArrows]);

  return (
    <div className="relative">
    <Swiper
      modules={[Autoplay, Pagination, Navigation]}
      autoplay={{ delay: 5000, disableOnInteraction: false }}
      pagination={{ clickable: true, el: ".hero-pagination" }}
      navigation={{ prevEl: null, nextEl: null }}
      onSwiper={setSwiper}
      speed={800}
      loop={showArrows}
      className="hero-swiper"
    >
      <style>{`
        .hero-swiper .swiper-pagination-bullet {
          width: 8px;
          height: 8px;
          background: #9ca3af;
          opacity: 0.5;
          transition: all 0.3s ease;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          width: 24px;
          border-radius: 9999px;
          background: #ea580c;
          opacity: 1;
        }
        .hero-swiper .swiper-button-prev,
        .hero-swiper .swiper-button-next {
          display: none;
        }
      `}</style>
      {slides.map((item, index) => (
        <SwiperSlide key={item._id || index}>
          <section
            className={`relative flex min-h-0 items-center overflow-hidden md:min-h-[560px] ${item.bg}`}
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-4 px-5 py-6 md:flex-row md:gap-4 md:px-10 md:py-0">
              <div className="w-full text-center md:w-1/2 md:text-left">
                <h1 className="whitespace-pre-line font-heading text-[1.65rem] font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  {item.title}
                </h1>

                <p className="mt-2 text-sm text-gray-600 sm:mt-4 sm:text-xl">
                  {item.subtitle}
                  {item.price ? (
                    <>
                      {" "}
                      <span className="mx-1">|</span>
                      <span className="font-semibold text-gray-800">{item.price}</span>
                    </>
                  ) : null}
                </p>

                <Link
                  to={item.linkUrl || "/products"}
                  className="mt-3 inline-block rounded-full bg-[#F5B400] px-6 py-2 text-sm font-semibold text-white transition duration-300 hover:bg-[#D89B00] sm:mt-8 sm:px-8 sm:py-3 sm:text-base"
                >
                  {item.buttonLabel || "Shop Now"}
                </Link>
              </div>

              <div className="w-full md:w-1/2">
                <img
                  src={resolveMediaUrl(item.image)}
                  alt={item.title.replace("\n", " ")}
                  className="h-[168px] w-full rounded-2xl object-cover shadow-xl sm:h-[340px] md:h-[420px] lg:h-[480px]"
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
            </div>
          </section>
        </SwiperSlide>
      ))}

      <div className="hero-pagination absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2" />
    </Swiper>

    {showArrows ? (
      <>
        <button
          ref={prevRef}
          type="button"
          className="absolute left-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-md transition hover:border-orange-400 hover:bg-orange-50 sm:left-4 sm:h-12 sm:w-12"
          aria-label="Previous slide"
        >
          <FiChevronLeft className="h-6 w-6" />
        </button>
        <button
          ref={nextRef}
          type="button"
          className="absolute right-2 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-orange-200 bg-white text-orange-600 shadow-md transition hover:border-orange-400 hover:bg-orange-50 sm:right-4 sm:h-12 sm:w-12"
          aria-label="Next slide"
        >
          <FiChevronRight className="h-6 w-6" />
        </button>
      </>
    ) : null}
    </div>
  );
}
