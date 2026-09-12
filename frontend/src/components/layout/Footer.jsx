import {
  FiFacebook,
  FiInstagram,
  FiYoutube,
  FiChevronUp,
} from "react-icons/fi";
import { Link } from "react-router-dom";
import { BrandHomeLink } from "./BrandLogo";
import { useHomeOfferMarquee } from "../../hooks/useHomeOfferMarquee";
import { useFooter } from "../../hooks/useFooter";

const socialIcons = {
  facebook: <FiFacebook />,
  instagram: <FiInstagram />,
  youtube: <FiYoutube />,
};

function FooterOfferMarquee() {
  const lines = useHomeOfferMarquee().filter(Boolean);
  if (!lines.length) return null;

  const copies = Math.max(2, Math.ceil(8 / lines.length));
  const track = Array.from({ length: copies }, () => lines).flat();
  const items = [...track, ...track];

  return (
    <div className="relative z-20 overflow-hidden border-b border-white/10 bg-gradient-to-l from-black via-zinc-900 to-yellow-700 text-white">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((text, index) => (
          <span
            key={`${text}-${index}`}
            className="flex min-w-max items-center gap-3 px-8 py-2 text-xs font-medium md:px-12 md:text-sm"
          >
            {text}
            <span aria-hidden="true" className="text-yellow-400">
              •
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function FooterLinkList({ links }) {
  return (
    <div className="flex flex-col gap-4 text-gray-300">
      {links.map((link) => (
        <Link key={`${link.group}-${link.path}-${link.label}`} to={link.path} className="hover:text-orange-400 transition">
          {link.label}
        </Link>
      ))}
    </div>
  );
}

export function Footer() {
  const footer = useFooter();
  const links = (footer.links || []).filter((link) => link.isActive !== false && link.label && link.path);
  const categories = links.filter((link) => link.group === "categories");
  const quick = links.filter((link) => link.group === "quick");
  const policies = links.filter((link) => link.group === "policies");
  const bottom = links.filter((link) => link.group === "bottom");
  const socials = Object.entries(footer.socials || {})
    .filter(([, url]) => String(url || "").trim())
    .map(([network, url]) => ({ network, url, icon: socialIcons[network] }))
    .filter((item) => item.icon);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <footer className="relative overflow-hidden bg-[#363435] text-white">
      <FooterOfferMarquee />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#d4af37]/35 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 top-10 h-80 w-80 rounded-full bg-[#f5d76e]/25 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-[#c9a227]/20 blur-[100px]"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <BrandHomeLink className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-orange-400 flex items-center justify-center font-bold text-2xl">
                N
              </div>

              <h2 className="text-3xl font-bold">
                Namo <span className="font-semibold">Print</span>
              </h2>
            </BrandHomeLink>

            {footer.aboutText ? (
              <p className="text-gray-300 leading-9 text-base">{footer.aboutText}</p>
            ) : null}

            {socials.length ? (
              <div className="flex items-center gap-4 mt-10">
                {socials.map((item) => (
                  <a
                    key={item.network}
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-xl hover:bg-red-500 hover:border-red-500 transition-all duration-300"
                    aria-label={item.network}
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6">{footer.headings?.categories || "Categories"}</h3>
            <FooterLinkList links={categories} />
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6">{footer.headings?.quick || "Quick Links"}</h3>
            <FooterLinkList links={quick} />
          </div>

          <div>
            <h3 className="text-2xl font-semibold mb-6">{footer.headings?.policies || "Policies"}</h3>
            <FooterLinkList links={policies} />
          </div>
        </div>

        <div className="border-t border-white/10 mt-16 pt-8 relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <p className="text-gray-400 text-center lg:text-left">{footer.copyright}</p>

            <button
              onClick={scrollToTop}
              className="w-16 h-16 rounded-2xl bg-red-500 hover:bg-red-600 transition flex items-center justify-center text-3xl shadow-lg"
            >
              <FiChevronUp />
            </button>

            <div className="flex flex-wrap justify-center gap-6 text-gray-400">
              {bottom.map((link) => (
                <Link
                  key={`${link.path}-${link.label}`}
                  className="hover:text-white transition"
                  to={link.path}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
