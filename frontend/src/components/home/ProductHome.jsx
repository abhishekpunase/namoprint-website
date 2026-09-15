import { useEffect, useState } from "react";
import { FiArrowRight } from "react-icons/fi";
import { ProductCard } from "../product/ProductCard";
import { api } from "../../services/api";
import { excludeWallWatchProducts } from "../../utils/wallWatchCatalog";

import { useHomeOfferMarquee } from "../../hooks/useHomeOfferMarquee";
import GodHomeSection from "./GodHomeSection";

const HOME_PREVIEW_COUNT = 4;

function OfferMarquee({ lines = [] }) {
  const displayLines = lines.filter(Boolean);
  if (!displayLines.length) return null;

  const items = displayLines.flatMap((text, index) =>
    Array.from({ length: 4 }, (_, repeat) => (
      <span
        key={`${text}-${index}-${repeat}`}
        className="mx-8 inline-flex shrink-0 items-center gap-3 text-sm font-semibold tracking-wide"
      >
        {text}
        <span aria-hidden="true" className="text-black/40">
          •
        </span>
      </span>
    )),
  );

  return (
    <section className="overflow-hidden bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500 text-gray-900">
      <style>{`
        @keyframes offer-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .offer-marquee-track {
          animation: offer-marquee 28s linear infinite;
          will-change: transform;
        }
      `}</style>
      <div className="flex h-9 items-center sm:h-10">
        <div className="offer-marquee-track flex w-max whitespace-nowrap">
          <div className="flex shrink-0">{items}</div>
          <div className="flex shrink-0" aria-hidden="true">
            {items}
          </div>
        </div>
      </div>
    </section>
  );
}

function ViewAllButton({ expanded, onClick, label = "View All", className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full bg-[#F5B400] px-5 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-[#D89B00] hover:shadow-md ${className}`.trim()}
    >
      {expanded ? "Show less" : label}
      {!expanded ? <FiArrowRight /> : null}
    </button>
  );
}

export default function ProductHome() {
  const [products, setProducts] = useState([]);
  const [showAllBestSellers, setShowAllBestSellers] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const marqueeLines = useHomeOfferMarquee();

  useEffect(() => {
    api
      .products('')
      .then((payload) => {
        const items = excludeWallWatchProducts(payload.items || []);
        setProducts(items);
      })
      .catch(() => {
        setProducts([]);
      });
  }, []);

  const bestSellers = products.filter((product) => product.isFeatured);
  const displayBestSellers = bestSellers.length
    ? bestSellers
    : products.slice(0, HOME_PREVIEW_COUNT);

  const visibleBestSellers = showAllBestSellers
    ? displayBestSellers
    : displayBestSellers.slice(0, HOME_PREVIEW_COUNT);

  const visibleCatalog = showAllProducts
    ? products
    : products.slice(0, HOME_PREVIEW_COUNT);

  return (
    <div className="bg-[#f8f8f8]">
      <OfferMarquee lines={marqueeLines} />

      <section className="bg-[#F5F5F5] py-8 sm:py-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-5">
          <div className="mb-6 flex items-end justify-between sm:mb-12">
            <div>
              <p className="uppercase tracking-[3px] text-yellow-500 font-semibold text-xs sm:text-base">
                Curated Collection
              </p>
              <h2 className="text-2xl font-bold mt-2 sm:text-5xl">
                Best{" "}
                <span className="italic text-yellow-500">
                  Seller
                </span>
              </h2>
            </div>

            {displayBestSellers.length > 0 && (
              <div className="hidden sm:block">
                <ViewAllButton
                  expanded={showAllBestSellers}
                  onClick={() => setShowAllBestSellers((open) => !open)}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {visibleBestSellers.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>

          {displayBestSellers.length > 0 && (
            <div className="mt-8 flex justify-center sm:hidden">
              <ViewAllButton
                expanded={showAllBestSellers}
                onClick={() => setShowAllBestSellers((open) => !open)}
              />
            </div>
          )}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-3 py-10 sm:px-5 sm:py-20">
        <div className="flex items-end justify-between mb-6 sm:mb-12">
          <div>
            <p className="uppercase tracking-[3px] text-yellow-500 font-semibold text-xs sm:text-base">
              Full Catalog
            </p>
            <h2 className="text-2xl font-bold mt-2 sm:text-5xl">
              All{" "}
              <span className="italic text-yellow-500">
                Products
              </span>
            </h2>
          </div>

          {products.length > 0 && (
            <div className="hidden sm:block">
              <ViewAllButton
                expanded={showAllProducts}
                onClick={() => setShowAllProducts((open) => !open)}
              />
            </div>
          )}
        </div>

        {products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {visibleCatalog.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
            <div className="mt-8 flex justify-center sm:hidden">
              <ViewAllButton
                expanded={showAllProducts}
                onClick={() => setShowAllProducts((open) => !open)}
              />
            </div>
          </>
        ) : (
          <p className="text-center text-gray-500 py-10">
            No products available right now.
          </p>
        )}
      </section>

      <GodHomeSection />

      <section className="max-w-7xl mx-auto px-5 py-24">
        <div className="text-center mb-14">
          <p className="uppercase tracking-[3px] text-yellow-500 font-semibold">
            How It Works
          </p>
          <h2 className="text-4xl font-bold">
            Order In Just 3 Easy Steps
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {[
            [
              "01",
              "Choose Product",
              "Pick your favourite nameplate, trophy, acrylic frame, album or gift.",
            ],
            [
              "02",
              "Upload Your Design",
              "Upload your image, customize text, adjust size and preview instantly.",
            ],
            [
              "03",
              "Secure Checkout",
              "Complete payment securely and receive your personalized order at home.",
            ],
          ].map(([number, title, copy]) => (
            <div
              key={number}
              className="relative rounded-3xl bg-white border border-gray-200 p-10 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              <div className="absolute -top-7 left-8 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center text-xl font-bold shadow-lg">
                {number}
              </div>
              <div className="mt-8">
                <h3 className="text-2xl font-bold mb-4">{title}</h3>
                <p className="text-gray-600 leading-7">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
