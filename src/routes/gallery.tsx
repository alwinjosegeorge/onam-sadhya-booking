import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  Home,
  Ticket,
  Image as ImageIcon,
  ArrowLeft,
  X,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import heroImg from "@/assets/onam-hero.jpg";
import dineinImg from "@/assets/pkg-dinein.jpg";
import deliveryImg from "@/assets/pkg-delivery.jpg";
import celebrationImg from "@/assets/pkg-celebration.jpg";
import logoImg from "@/assets/logo.webp";

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
});

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.704 1.456h.006c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const TABS = [
  { k: "home", i: <Home className="h-5 w-5" />, l: "Home" },
  { k: "booking", i: <Ticket className="h-5 w-5" />, l: "Booking" },
  { k: "gallery", i: <ImageIcon className="h-5 w-5" />, l: "Gallery" },
  { k: "whatsapp", i: <WhatsAppIcon className="h-5 w-5" />, l: "WhatsApp" },
];

type GalleryItem = {
  src: string;
  category: "feasts" | "culture" | "ambience";
  title: string;
  desc: string;
};

const GALLERY_ITEMS: GalleryItem[] = [
  {
    src: dineinImg,
    category: "feasts",
    title: "The 26-Course Sadhya Feast",
    desc: "A rich culinary heritage of Kerala, served traditionally on a fresh banana leaf.",
  },
  {
    src: "https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800&auto=format&fit=crop&q=80",
    category: "culture",
    title: "Kathakali Performance",
    desc: "Classical dance-drama from Kerala, renowned for its colorful makeup and heavy costumes.",
  },
  {
    src: celebrationImg,
    category: "culture",
    title: "Traditional Thiruvathira",
    desc: "A graceful group dance performed by women around the nilavilakku (lamp) celebrating Onam.",
  },
  {
    src: "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=800&auto=format&fit=crop&q=80",
    category: "ambience",
    title: "Vibrant Kerala Backwaters",
    desc: "Traditional houseboats cruise through serene lakes, capturing the beautiful soul of Kerala.",
  },
  {
    src: deliveryImg,
    category: "feasts",
    title: "Banana-leaf Sadhya Pack",
    desc: "Carefully wrapped and delivered warm, bringing festive Onam flavours directly to your home.",
  },
  {
    src: heroImg,
    category: "ambience",
    title: "Onam Floral Carpet (Pookalam)",
    desc: "Beautiful flower arrangements handcrafted in intricate geometric circular patterns.",
  },
  {
    src: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&auto=format&fit=crop&q=80",
    category: "feasts",
    title: "Sadhya Side Dishes",
    desc: "A delicious assortment of payasam, upperi, avial, sambhar, and other classic side dishes.",
  },
  {
    src: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80",
    category: "ambience",
    title: "Fort Kochi Banquet Hall",
    desc: "Our premium venue, decorated with fresh jasmine garlands and oil brass lamps.",
  },
];

function GalleryPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "feasts" | "culture" | "ambience">("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredItems = GALLERY_ITEMS.filter(
    (item) => filter === "all" || item.category === filter
  );

  const handleTabClick = (k: string) => {
    if (k === "whatsapp") {
      window.open("https://wa.me/919072611622?text=Namaskaram!%20I%20would%20like%20to%20enquire%20about%20Onam%20Sadhya%20bookings.", "_blank");
    } else if (k === "home") {
      router.navigate({ to: "/" });
      setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 100);
    } else if (k === "booking") {
      router.navigate({ to: "/" });
      setTimeout(() => {
        const element = document.getElementById("booking");
        if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } else if (k === "gallery") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const nextImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredItems.length);
    }
  };

  const prevImage = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <div className="relative min-h-screen bg-pookalam pb-40">
      {/* Floating background ornaments */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 10%, var(--gold) 0, transparent 30%), radial-gradient(circle at 90% 80%, var(--maroon) 0, transparent 35%)",
        }}
      />

      <div className="mx-auto max-w-[440px] md:max-w-6xl px-4 pt-6 sm:px-5 md:px-8 md:pt-10">
        {/* Header */}
        <header className="flex items-center justify-between w-full border-b border-gold/10 pb-4 md:pb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.navigate({ to: "/" })}
              className="glass-card grid h-9 w-9 place-items-center rounded-xl text-primary transition hover:scale-105 cursor-pointer md:hidden mr-1"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-12 w-12 flex items-center justify-center">
              <img src={logoImg} alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="font-display text-sm md:text-base font-semibold leading-none text-primary uppercase tracking-tight">Hooked & Cooked</p>
              <p className="text-[8px] md:text-[9px] tracking-[0.25em] text-muted-foreground uppercase mt-1">
                Restaurant
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {TABS.map((n) => {
              const active = n.k === "gallery";
              const isWhatsApp = n.k === "whatsapp";
              return (
                <button
                  key={n.k}
                  onClick={() => handleTabClick(n.k)}
                  className={`relative flex items-center gap-1.5 font-display text-sm tracking-widest uppercase transition-colors duration-300 py-2 px-1 cursor-pointer ${
                    active 
                      ? isWhatsApp ? "text-leaf font-semibold" : "text-primary font-semibold" 
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {isWhatsApp && <WhatsAppIcon className="h-4 w-4 text-leaf" />}
                  {n.l}
                  {active && !isWhatsApp && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => window.open("https://maps.app.goo.gl/3MxvLXHCCM6vdtNp6", "_blank")}
              className="glass-card grid h-10 w-10 place-items-center rounded-full text-primary transition hover:scale-105 cursor-pointer"
              title="View on Google Maps"
              aria-label="View on Google Maps"
            >
              <MapPin className="h-4 w-4" />
            </button>
            <div className="glass-card grid h-10 w-10 place-items-center rounded-full">
              <span className="font-display text-sm text-primary">A</span>
            </div>
          </div>
        </header>

        {/* Title */}
        <div className="mt-8 md:mt-12 text-center max-w-2xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-gold animate-glow" />
            <span className="font-display text-[10px] tracking-[0.3em] uppercase text-gold">
              Visual Journey
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-5xl text-primary leading-tight">
            Kerala's Harvest <span className="text-gradient-gold">Splendor</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-muted-foreground">
            Explore the beauty of Thiruvonam — the vibrant flower carpets, classical art forms, 
            and the grand 26-course feasts.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-wrap justify-center gap-2 md:gap-3 animate-fade-up" style={{ animationDelay: "100ms" }}>
          {(["all", "feasts", "culture", "ambience"] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`rounded-full px-4.5 py-2 text-xs md:text-sm tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                filter === cat
                  ? "bg-primary text-ivory shadow-[var(--shadow-gold)] font-semibold scale-102"
                  : "glass-card text-primary hover:border-gold/60"
              }`}
            >
              {cat === "all" ? "All Moments" : cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <section className="mt-10 md:mt-16 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-up" style={{ animationDelay: "200ms" }}>
          {filteredItems.map((item, index) => (
            <article
              key={index}
              onClick={() => setLightboxIndex(index)}
              className="group glass-card relative overflow-hidden rounded-[24px] cursor-pointer shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-luxe)] transition-all duration-500 hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={item.src}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-108"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5 text-ivory">
                <span className="text-[8px] tracking-[0.2em] uppercase font-semibold text-gold-soft border border-gold/40 bg-primary/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                  {item.category}
                </span>
                <h3 className="font-display text-base md:text-lg leading-tight mt-2 text-ivory group-hover:text-gold-soft transition-colors duration-300">
                  {item.title}
                </h3>
                <p className="text-[11px] text-ivory/70 line-clamp-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-h-0 group-hover:max-h-12 overflow-hidden">
                  {item.desc}
                </p>
              </div>
            </article>
          ))}
        </section>
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 p-4 backdrop-blur-sm animate-fade-in">
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute right-6 top-6 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Close lightbox"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation buttons */}
          <button
            onClick={prevImage}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20 transition cursor-pointer"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Image Container */}
          <div className="max-w-4xl w-full flex flex-col items-center">
            <img
              src={filteredItems[lightboxIndex].src}
              alt={filteredItems[lightboxIndex].title}
              className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-2xl"
            />
            {/* Caption */}
            <div className="mt-6 text-center text-white max-w-lg px-4">
              <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-gold-soft">
                {filteredItems[lightboxIndex].category}
              </span>
              <h2 className="font-display text-xl md:text-3xl mt-2 text-gold-soft">
                {filteredItems[lightboxIndex].title}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {filteredItems[lightboxIndex].desc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation (Mobile only) */}
      <nav className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-[440px] px-4 md:hidden">
        <div className="glass-card flex items-center justify-around rounded-full px-3 py-2">
          {TABS.map((n) => {
            const active = n.k === "gallery";
            const isWhatsApp = n.k === "whatsapp";
            return (
              <button
                key={n.k}
                onClick={() => handleTabClick(n.k)}
                className={`relative flex flex-col items-center gap-0.5 rounded-full px-3.5 py-1.5 transition-all duration-400 [transition-timing-function:var(--ease-luxe)] cursor-pointer ${
                  active ? "text-ivory" : "text-primary/60 hover:text-primary"
                }`}
              >
                {active && (
                  <span className={`absolute inset-0 -z-10 rounded-full shadow-[var(--shadow-gold)] ${
                    isWhatsApp ? "bg-leaf" : "bg-primary"
                  }`} />
                )}
                {n.i}
                <span className="text-[9px] tracking-wider uppercase">{n.l}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
