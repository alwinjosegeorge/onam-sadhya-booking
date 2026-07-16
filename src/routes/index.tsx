import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
import { getBookingsFn, createBookingFn, getSettingsFn } from "@/lib/db-actions";
import {
  Home,
  Ticket,
  CalendarDays,
  Image as ImageIcon,
  User,
  ArrowRight,
  Utensils,
  Truck,
  Sparkles,
  MapPin,
  Star,
  Users,
  Clock,
  Check,
  Flame,
  ExternalLink,
  Leaf,
} from "lucide-react";

import heroImg from "@/assets/onam-hero.jpg";
import dineinImg from "@/assets/pkg-dinein.jpg";
import deliveryImg from "@/assets/pkg-delivery.jpg";
import celebrationImg from "@/assets/pkg-celebration.jpg";
import logoImg from "@/assets/logo.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        property: "og:image",
        content: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=1200",
      },
    ],
  }),
  component: OnamBookingApp,
});

/* ---------------- Decorative pieces ---------------- */

function Petals() {
  const petals = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        left: `${(i * 7.3) % 100}%`,
        delay: `${(i * 0.9) % 8}s`,
        duration: `${9 + ((i * 1.7) % 7)}s`,
        drift: `${((i % 5) - 2) * 30}px`,
        hue: i % 3,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {petals.map((p, i) => (
        <span
          key={i}
          className="petal"
          style={{
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
            // @ts-expect-error css var
            "--drift": p.drift,
            background:
              p.hue === 0
                ? "radial-gradient(circle at 30% 30%, oklch(0.88 0.14 60), oklch(0.62 0.18 40))"
                : p.hue === 1
                  ? "radial-gradient(circle at 30% 30%, oklch(0.9 0.1 90), oklch(0.72 0.14 82))"
                  : "radial-gradient(circle at 30% 30%, oklch(0.85 0.08 20), oklch(0.5 0.15 25))",
          }}
        />
      ))}
    </div>
  );
}

function GoldDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      {label ? (
        <span className="font-display text-xs tracking-[0.3em] text-gold uppercase">
          {label}
        </span>
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-gold" />
      )}
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
    </div>
  );
}

/* ---------------- Data ---------------- */

type PackageKey = "dinein" | "delivery" | "celebration";

const PACKAGES: Record<
  PackageKey,
  {
    title: string;
    subtitle: string;
    price: number;
    tag: string;
    seats: string;
    img: string;
    icon: React.ReactNode;
    accent: string;
  }
> = {
  dinein: {
    title: "Onam Sadhya · Dine-In",
    subtitle: "26-course feast on banana leaf",
    price: 499,
    tag: "Traditional Sadhya Feast",
    seats: "200 seats/slot limit",
    img: dineinImg,
    icon: <Utensils className="h-5 w-5" />,
    accent: "from-leaf/25 to-primary/10",
  },
  delivery: {
    title: "Sadhya · Home Delivery",
    subtitle: "Banana-leaf packed, delivered warm",
    price: 599,
    tag: "No minimum quantity",
    seats: "600 orders/day limit",
    img: deliveryImg,
    icon: <Truck className="h-5 w-5" />,
    accent: "from-gold/25 to-ivory",
  },
  celebration: {
    title: "One Day Onam Celebration",
    subtitle: "Pookalam · Thiruvathira · Sadhya",
    price: 1299,
    tag: "Includes full day event",
    seats: "600 tickets/day limit",
    img: celebrationImg,
    icon: <Sparkles className="h-5 w-5" />,
    accent: "from-maroon/20 to-gold/15",
  },
};

const PACKAGE_DETAILS_CONTENT: Record<
  PackageKey,
  {
    title: string;
    subtitle: string;
    description: string;
    price: number;
    banner: string;
    inclusions: { category: string; items: string }[];
  }
> = {
  dinein: {
    title: "Kadambrayar Onam Sadhya",
    subtitle: "Riverside Dining Feast",
    description: "Celebrate the spirit of Onam with an authentic Kerala Sadhya at Kadambrayar Onachamayam. Served on a traditional banana leaf, our carefully prepared Sadhya features a delicious spread of 30+ classic dishes made with fresh, high-quality ingredients in a beautiful riverside setting.",
    price: 499,
    banner: dineinImg,
    inclusions: [
      { category: "Grand Onam Sadhya (30+ items)", items: "Avial, Thoran, Sambar, Rasam, Parippu with Ghee, Erissery, Theeyal, Olan, Kaalan, Vellarikka Pachadi, Beetroot Pachadi, Koottu Curry, Pachadi, Kichadi, Madhura Curry, Inji Curry, Naranga Achar, Manga Achar, Pachamoru, Choru (Kerala Mata Rice), Pappadam, Palada Payasam, Ada Pradhaman, Boli, Ethakka Pulissery, Njalipoovan Pazham, Banana Chips, Sharkara Varatti, Kondattam Mulaku, Salt." },
      { category: "Ambience & Venue", items: "Enjoy the true taste of Kerala in a scenic, breezy riverside setting. Prepared with love, care, and the finest ingredients." }
    ]
  },
  delivery: {
    title: "Kadambrayar Sadhya at Home",
    subtitle: "Traditional Feast Box",
    description: "Bring the authentic taste of Kadambrayar Onam Sadhya directly to your home. Portion-packed hygienically and delivered fresh with banana leaves so you can enjoy the full traditional feast with family and friends.",
    price: 599,
    banner: deliveryImg,
    inclusions: [
      { category: "Sadhya Feast (30+ items)", items: "Avial, Thoran, Sambar, Rasam, Parippu with Ghee, Erissery, Theeyal, Olan, Kaalan, Vellarikka Pachadi, Beetroot Pachadi, Koottu Curry, Pachadi, Kichadi, Madhura Curry, Inji Curry, Naranga Achar, Manga Achar, Pachamoru, Choru (Kerala Mata Rice), Pappadam, Palada Payasam, Ada Pradhaman, Boli, Ethakka Pulissery, Njalipoovan Pazham, Banana Chips, Sharkara Varatti, Kondattam Mulaku, Salt." },
      { category: "Delivery Details", items: "Hygienically packed in premium containers to retain heat and flavor. Includes fresh-cut banana leaves inside the box. Delivered within 25 km radius." }
    ]
  },
  celebration: {
    title: "Kadambrayar Onachamayam",
    subtitle: "10:30 AM to 5:00 PM",
    description: "A vibrant Onam celebration that brings together Kerala's rich traditions, festive spirit, and authentic hospitality in a picturesque riverside setting. Perfect for loved ones, families, schools, colleges, and corporate groups.",
    price: 1299,
    banner: celebrationImg,
    inclusions: [
      { category: "Food & Refreshments", items: "Grand Onam Sadhya (30+ items) served on banana leaf, Welcome Drink, and Evening Tea & Snacks." },
      { category: "Traditional Games & Activities", items: "Vadamvali (Tug of War), Uriyadi (pot breaking), Unjal (Traditional Swing), Treasure Hunt, colorful Pookalam, and cultural performances & music." },
      { category: "Amenities & Recreation", items: "A relaxing country boat (Vallam) ride, scenic riverside venue, amazing prizes, rain contingency arrangements, and memories that last." }
    ]
  }
};

const TIME_SLOTS = [
  "11:15 AM",
  "12:00 PM",
  "12:45 PM",
  "1:30 PM",
  "2:15 PM",
  "3:00 PM",
];

/* Onam 2026: Aug 15–30 */
const ONAM_DATES = Array.from({ length: 16 }).map((_, i) => {
  const d = 15 + i;
  const dow = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"][(i + 6) % 7];
  return { day: d, dow, hot: d === 26 }; // Thiruvonam
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
  { k: "whatsapp", i: <WhatsAppIcon className="h-5 w-5" />, l: "WhatsApp" },
];

/* ---------------- Main app ---------------- */

interface Booking {
  id: string;
  name: string;
  phone: string;
  email?: string;
  package: "dinein" | "delivery" | "celebration";
  date: number; // day of August (15 - 30)
  slot?: string;
  qty: number;
  total: number;
  status: "confirmed" | "cancelled";
  address?: string;
  createdAt: string;
  paymentId?: string;
  token: string;
  checkedIn?: boolean;
}

function OnamBookingApp() {
  const router = useRouter();
  const [pkg, setPkg] = useState<PackageKey>("dinein");
  const [date, setDate] = useState(26);
  const [slot, setSlot] = useState("12:00 PM");
  const [qty, setQty] = useState(2);
  const [tab, setTab] = useState("home");

  // Stepped wizard states
  const [step, setStep] = useState(1); // 1 = options wizard, 2 = contact form
  const [subStep, setSubStep] = useState(1); // 1 = Date, 2 = Package, 3 = Slot, 4 = Guests
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailPkg, setDetailPkg] = useState<PackageKey>("dinein");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Customer Details Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Live storage states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [closedDates, setClosedDates] = useState<number[]>([]);
  const [closedSlots, setClosedSlots] = useState<string[]>([]);

  useEffect(() => {
    // 1. Initial load from local storage cache for instant rendering
    const storedBookings = localStorage.getItem("onam_bookings");
    const storedClosedDates = localStorage.getItem("onam_closed_dates");
    const storedClosedSlots = localStorage.getItem("onam_closed_slots");

    if (storedBookings) setBookings(JSON.parse(storedBookings));
    if (storedClosedDates) setClosedDates(JSON.parse(storedClosedDates));
    if (storedClosedSlots) setClosedSlots(JSON.parse(storedClosedSlots));

    // 2. Fetch live data from Neon PostgreSQL database
    getBookingsFn().then((liveBookings) => {
      if (liveBookings) {
        setBookings(liveBookings);
        localStorage.setItem("onam_bookings", JSON.stringify(liveBookings));
      }
    }).catch(err => console.error("Failed to fetch bookings from Neon:", err));

    getSettingsFn().then((settings) => {
      if (settings) {
        setClosedDates(settings.closedDates);
        setClosedSlots(settings.closedSlots);
        localStorage.setItem("onam_closed_dates", JSON.stringify(settings.closedDates));
        localStorage.setItem("onam_closed_slots", JSON.stringify(settings.closedSlots));
      }
    }).catch(err => console.error("Failed to fetch settings from Neon:", err));

    // Load Razorpay script dynamically
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Video Playlist Configuration
  const VIDEOS = useMemo(() => {
    const base = import.meta.env.BASE_URL || "/";
    const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
    return [`${cleanBase}/lv_0_20260715160043.mp4`];
  }, []);

  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    // Play the current video index, pause the others
    videoRefs.current.forEach((video, idx) => {
      if (!video) return;
      video.muted = true; // Force muted programmatically to bypass React 19 hydration autoplay block
      if (idx === currentVideoIndex) {
        video.currentTime = 0; // reset to start
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.log("Autoplay prevented or video interrupted:", error);
          });
        }
      } else {
        // Pause inactive videos to save CPU
        video.pause();
      }
    });
  }, [currentVideoIndex]);

  // Generate August booking days list (Aug 15 to Aug 30) for horizontal scrolling
  const bookingDays = useMemo(() => {
    const list = [];
    for (let d = 15; d <= 30; d++) {
      const isClosed = closedDates.includes(d);
      list.push({ day: d, isClosed, hot: d === 26 });
    }
    return list;
  }, [closedDates]);

  const current = PACKAGES[pkg];
  const total = current.price * qty;

  // Live capacity calculation for selected package and date
  const capacityInfo = useMemo(() => {
    const isDateClosed = closedDates.includes(date);
    if (isDateClosed) {
      return { remaining: 0, status: "closed", totalBooked: 0 };
    }

    if (pkg === "dinein") {
      const isSlotClosed = closedSlots.includes(`${date}-${slot}`);
      if (isSlotClosed) {
        return { remaining: 0, status: "closed", totalBooked: 0 };
      }
      const booked = bookings
        .filter((b) => b.status === "confirmed" && b.package === "dinein" && b.date === date && b.slot === slot)
        .reduce((sum, b) => sum + b.qty, 0);
      const remaining = Math.max(0, 200 - booked);
      return {
        remaining,
        status: remaining <= 0 ? "full" : remaining < 40 ? "almost" : "avail",
        totalBooked: booked,
      };
    } else if (pkg === "delivery") {
      const booked = bookings
        .filter((b) => b.status === "confirmed" && b.package === "delivery" && b.date === date)
        .reduce((sum, b) => sum + b.qty, 0);
      const remaining = Math.max(0, 600 - booked);
      return {
        remaining,
        status: remaining <= 0 ? "full" : remaining < 100 ? "almost" : "avail",
        totalBooked: booked,
      };
    } else {
      const booked = bookings
        .filter((b) => b.status === "confirmed" && b.package === "celebration" && b.date === date)
        .reduce((sum, b) => sum + b.qty, 0);
      const remaining = Math.max(0, 600 - booked);
      return {
        remaining,
        status: remaining <= 0 ? "full" : remaining < 100 ? "almost" : "avail",
        totalBooked: booked,
      };
    }
  }, [bookings, pkg, date, slot, closedDates, closedSlots]);

  // Dynamic capacity info for all time slots
  const dynamicTimeSlots = useMemo(() => {
    return TIME_SLOTS.map((t) => {
      const isClosed = closedSlots.includes(`${date}-${t}`) || closedDates.includes(date);
      if (isClosed) {
        return { t, s: "closed" as const, remaining: 0 };
      }
      const booked = bookings
        .filter((b) => b.status === "confirmed" && b.package === "dinein" && b.date === date && b.slot === t)
        .reduce((sum, b) => sum + b.qty, 0);
      const remaining = Math.max(0, 200 - booked);
      const isFullForGuests = remaining < qty;
      return {
        t,
        s: (remaining <= 0 || isFullForGuests) ? ("full" as const) : remaining < 40 ? ("almost" as const) : ("avail" as const),
        remaining,
      };
    });
  }, [bookings, date, closedDates, closedSlots, qty]);

  const handleTabClick = (k: string) => {
    setTab(k);
    if (k === "whatsapp") {
      window.open("https://wa.me/919072611622?text=Namaskaram!%20I%20would%20like%20to%20enquire%20about%20Onam%20Sadhya%20bookings.", "_blank");
    } else if (k === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (k === "booking") {
      const element = document.getElementById("booking");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    } else if (k === "gallery") {
      router.navigate({ to: "/gallery" });
    }
  };
  const completeBooking = (paymentId: string) => {
    // Create a new booking
    const newBooking: Booking = {
      id: "OB-" + Math.floor(100000 + Math.random() * 900000),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      package: pkg,
      date,
      slot: pkg === "dinein" ? slot : undefined,
      qty,
      total,
      status: "confirmed",
      address: pkg === "delivery" ? address.trim() : undefined,
      createdAt: new Date().toISOString(),
      paymentId: paymentId,
      token: "TK-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000),
      checkedIn: false,
    };

    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);
    localStorage.setItem("onam_bookings", JSON.stringify(updatedBookings));

    // Persist to Neon PostgreSQL Database
    createBookingFn({ data: newBooking }).catch(err => {
      console.error("Failed to save booking to Neon database:", err);
    });

    // Show the success modal with QR ticket
    setCreatedBooking(newBooking);
    setShowSuccessModal(true);
  };

  const handleDismissSuccessModal = () => {
    setShowSuccessModal(false);
    setCreatedBooking(null);
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setStep(1);
    setSubStep(1);
  };

  const handleSendWhatsAppTicket = (b: Booking) => {
    const pkgName = b.package === "dinein" ? "Onam Sadhya - Dine-In" : b.package === "delivery" ? "Sadhya - Home Delivery" : "One Day Onam Celebration";
    const dateStr = `August ${b.date}, 2026`;
    const slotStr = b.package === "dinein" ? `\n- Seating Slot: ${b.slot}` : "";
    const addressStr = b.package === "delivery" ? `\n- Delivery Address: ${b.address}` : "";
    
    // Scannable QR Ticket endpoint containing booking details
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
      JSON.stringify({ bookingId: b.id, name: b.name, phone: b.phone, package: b.package, date: b.date, qty: b.qty, total: b.total, paymentId: b.paymentId })
    )}`;

    const message = `Namaskaram! My Onam Sadhya Booking has been confirmed:
- Booking ID: ${b.id}
- Customer Name: ${b.name}
- Phone Number: ${b.phone}
- Email Address: ${b.email || "-"}
- Package: ${pkgName}
- Date: ${dateStr}${slotStr}${addressStr}
- Guests/Qty: ${b.qty} Pax
- Total Amount: ₹${b.total.toLocaleString("en-IN")}
- Payment Status: PAID (Razorpay ID: ${b.paymentId})

Open QR Ticket Link:
${qrUrl}

Please present this QR code at entry. Thank you!`;

    const encodedText = encodeURIComponent(message);
    window.open(`https://wa.me/919072611622?text=${encodedText}`, "_blank");
  };

  const handleReserve = () => {
    if (closedDates.includes(date)) {
      alert("This date is closed for bookings.");
      return;
    }
    if (pkg === "dinein" && closedSlots.includes(`${date}-${slot}`)) {
      alert("This seating slot is closed for bookings.");
      return;
    }
     if (!name.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      alert("Please enter a valid email address");
      return;
    }
    if (pkg === "delivery" && !address.trim()) {
      alert("Please enter your delivery address");
      return;
    }

    if (capacityInfo.remaining < qty) {
      alert(`Only ${capacityInfo.remaining} slots/tickets remaining for this selection.`);
      return;
    }

    // Trigger Razorpay Checkout
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_TE3BRj3yuVK819", // Test Key fallback
        amount: total * 100, // Amount in paise
        currency: "INR",
        name: "Kadambrayar Onachamayam",
        description: `${pkg === "dinein" ? "Dine-In Sadhya" : pkg === "delivery" ? "Sadhya at Home" : "Onachamayam Celebration"} Booking`,
        image: logoImg,
        handler: function (response: any) {
          if (response.razorpay_payment_id) {
            completeBooking(response.razorpay_payment_id);
          } else {
            alert("Payment failed or cancelled. Please try again.");
          }
        },
        prefill: {
          name: name.trim(),
          email: email.trim(),
          contact: phone.trim(),
        },
        notes: {
          package: pkg,
          date: date,
          guests: qty,
        },
        theme: {
          color: "#1E4D3A", // Forest green theme
        },
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } else {
      alert("Payment gateway failed to load. Please check your internet connection and reload the page.");
    }
  };

  const accordionHeader = (
    num: number,
    title: string,
    value: string | number | undefined,
    isActive: boolean,
    isAccessible: boolean
  ) => {
    return (
      <div 
        onClick={() => {
          if (isAccessible) {
            setSubStep(num);
            setStep(1);
          }
        }}
        className={`flex justify-between items-center select-none py-4.5 px-6 border-b border-secondary/20 transition-colors duration-200 ${
          isAccessible ? "cursor-pointer" : "cursor-not-allowed"
        } ${isActive ? "bg-primary/5" : "bg-card"}`}
      >
        <div className="flex items-center gap-3.5">
          <div 
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10.5px] font-extrabold transition-colors duration-200 ${
              isActive ? "bg-primary text-ivory" : "bg-secondary text-primary/60"
            }`}
          >
            {num}
          </div>
          <h3 
            className={`text-xs uppercase tracking-wider transition-colors duration-200 ${
              isActive ? "font-extrabold text-primary" : "font-semibold text-primary/80"
            }`}
          >
            {title}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {!isActive && value && (
            <span className="text-[11px] font-extrabold text-primary uppercase">
              {value}
            </span>
          )}
          {isAccessible && !isActive && (
            <span className="text-[10px] text-gold font-bold uppercase tracking-wider">
              Edit
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderAugustCalendar = () => {
    const emptyCells = 6;
    const daysInAugust = 31;
    const cells = [];
    for (let i = 0; i < emptyCells; i++) {
      cells.push(<div key={`empty-${i}`} className="w-10 h-10" />);
    }
    for (let d = 1; d <= daysInAugust; d++) {
      const inRange = d >= 15 && d <= 30;
      const isClosed = closedDates.includes(d) || !inRange;
      const active = date === d;
      cells.push(
        <button
          key={d}
          type="button"
          disabled={isClosed}
          onClick={() => {
            setDate(d);
            setSubStep(2);
          }}
          className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
            active
              ? "bg-primary text-ivory shadow-md scale-105"
              : isClosed
                ? "text-primary/25 line-through cursor-not-allowed opacity-40"
                : "bg-leaf/15 text-primary hover:bg-leaf/25 hover:scale-105 cursor-pointer"
          }`}
        >
          {d}
        </button>
      );
    }
    return cells;
  };

  const handleSelectPackageCard = (k: PackageKey) => {
    setPkg(k);
    setStep(1);
    setSubStep(2);
    const el = document.getElementById("booking");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const handleOpenDetailsModal = (k: PackageKey) => {
    setDetailPkg(k);
    setShowDetailsModal(true);
  };

  return (
    <div className="relative min-h-screen bg-pookalam">
      {/* Background Video Hero Section */}
      <section className="relative w-full min-h-[95vh] md:min-h-screen flex flex-col justify-between overflow-hidden border-b border-gold/15 bg-primary/95 text-ivory">
        
        {/* Background Video Playlist (Crossfade Double-Buffering for Zero Lag) */}
        {VIDEOS.map((src, idx) => {
          const isCurrent = currentVideoIndex === idx;
          return (
            <video
              key={src}
              ref={(el) => {
                videoRefs.current[idx] = el;
              }}
              src={src}
              muted
              playsInline
              autoPlay
              loop={VIDEOS.length === 1}
              onEnded={() => {
                if (isCurrent) {
                  if (VIDEOS.length > 1) {
                    setCurrentVideoIndex((prev) => (prev + 1) % VIDEOS.length);
                  } else {
                    if (videoRefs.current[idx]) {
                      videoRefs.current[idx]!.currentTime = 0;
                      videoRefs.current[idx]!.play().catch((err) => console.log(err));
                    }
                  }
                }
              }}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
                isCurrent ? "opacity-60 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}
              preload="auto"
            />
          );
        })}
        
        {/* Dark overlay with green tint */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/90 via-primary/50 to-primary/90 mix-blend-multiply" />

        {/* Header (overlaid on top of the background video) */}
        <header className="relative z-20 w-full max-w-7xl mx-auto px-4 md:px-8 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="h-12 w-12 flex items-center justify-center p-0.5">
              <img src={logoImg} alt="Logo" className="h-full w-full object-contain filter brightness-0 invert" />
            </div>
            <div>
              <p className="font-display text-sm md:text-base font-bold leading-none text-ivory uppercase tracking-tight">Kadambrayar</p>
              <p className="text-[8px] md:text-[9px] tracking-[0.25em] text-gold uppercase mt-1.5 font-semibold">
                Onachamayam
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            {TABS.map((n) => {
              const active = tab === n.k;
              const isWhatsApp = n.k === "whatsapp";
              return (
                <button
                  key={n.k}
                  onClick={() => handleTabClick(n.k)}
                  className={`relative flex items-center gap-1.5 font-display text-xs tracking-widest uppercase transition-colors duration-300 py-2 px-1 cursor-pointer ${
                    active 
                      ? isWhatsApp ? "text-leaf font-bold" : "text-gold font-bold" 
                      : "text-ivory/70 hover:text-ivory"
                  }`}
                >
                  {isWhatsApp && <WhatsAppIcon className="h-3.5 w-3.5 text-leaf animate-bounce-subtle" />}
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
              className="glass-card grid h-10 w-10 place-items-center rounded-full text-ivory border border-white/15 bg-white/5 backdrop-blur transition hover:scale-105 hover:border-gold/30 cursor-pointer shadow-sm"
              title="View on Google Maps"
              aria-label="View on Google Maps"
            >
              <MapPin className="h-4 w-4 text-gold" />
            </button>
            {/* Book Now Quick Scroll Button */}
            <button
              onClick={() => {
                const el = document.getElementById("booking");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-primary shadow-[var(--shadow-gold)] hover:scale-105 transition cursor-pointer"
            >
              Book Now
            </button>
          </div>
        </header>

        {/* Hero Text Content (Centered, exactly like screenshot) */}
        <div className="relative z-20 flex-1 flex flex-col justify-center items-center text-center px-4 md:px-8 py-10 md:py-20 max-w-5xl mx-auto">
          
          <p className="text-[10px] md:text-xs tracking-[0.4em] uppercase text-gold font-bold mb-3 animate-fade-up">
            ONAM 2026 · KERALA RIVERSIDE
          </p>
          
          <h1 className="font-display text-4xl md:text-8xl lg:text-[90px] xl:text-[104px] leading-[0.98] md:leading-[1.02] font-extrabold text-ivory tracking-tight animate-fade-up" style={{ animationDelay: "100ms" }}>
            Celebrate Onam at
            <br />
            <span className="text-gradient-gold italic font-semibold animate-glow-text">Kadambrayar</span>
          </h1>
          
          <p className="mt-6 max-w-2xl text-sm md:text-lg text-ivory/80 leading-relaxed font-sans animate-fade-up" style={{ animationDelay: "200ms" }}>
            Experience Kerala's most authentic riverside Onam celebration with a traditional Sadya, cultural performances, and unforgettable moments.
          </p>
          
          {/* Date Range Footer at the bottom of hero */}
          <div className="mt-10 md:mt-16 animate-fade-up" style={{ animationDelay: "300ms" }}>
            <p className="text-xs md:text-sm tracking-[0.35em] text-gold font-semibold flex items-center justify-center gap-4">
              <span>15 AUGUST</span>
              <span className="w-12 h-px bg-gold/50" />
              <span>30 AUGUST</span>
            </p>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById("booking");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-full border border-gold bg-gold/10 px-6 py-3 text-xs font-bold uppercase tracking-wider text-gold shadow-lg hover:bg-gold hover:text-primary transition cursor-pointer md:hidden"
          >
            Book Now
          </button>
        </div>

      </section>

      {/* Floating background ornaments */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 10%, var(--gold) 0, transparent 30%), radial-gradient(circle at 90% 80%, var(--maroon) 0, transparent 35%)",
        }}
      />

      {/* Responsive Canvas Container (for lower sections) */}
      <div className="mx-auto max-w-[440px] md:max-w-7xl px-4 pt-12 pb-40 sm:px-5 md:px-8">
        
        {/* Main layout: Stacked sections below the hero */}
        <div className="space-y-16 md:space-y-28">

          {/* Packages Cards Section */}
          <section id="packages" className="max-w-6xl mx-auto w-full animate-fade-up pt-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              
              {/* Card 1: Onam Sadya */}
              <div 
                onClick={() => handleOpenDetailsModal("dinein")}
                className="bg-white rounded-[32px] border border-secondary/40 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between group cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <img src={dineinImg} alt="Onam Sadya" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103" />
                  <div className="absolute top-4 left-4 bg-white/90 text-primary text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                    Dine-In
                  </div>
                  <div className="absolute top-4 right-4 bg-[#C89B3C] text-white rounded-2xl px-4 py-2 flex flex-col items-center justify-center shadow-md border border-[#F4E2B1]/40 leading-none">
                    <span className="text-[7px] font-extrabold tracking-widest uppercase opacity-75">From</span>
                    <span className="text-sm font-black mt-0.5">₹499</span>
                    <span className="text-[6.5px] font-extrabold tracking-wider uppercase mt-0.5">Per Person</span>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-display text-2xl font-bold text-primary">
                      Onam Sadya
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                        <Leaf className="h-3.5 w-3.5 text-leaf fill-leaf/10 shrink-0" />
                        30+ item traditional feast
                      </li>
                      <li className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                        <Leaf className="h-3.5 w-3.5 text-leaf fill-leaf/10 shrink-0" />
                        Served on fresh banana leaf
                      </li>
                      <li className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                        <Leaf className="h-3.5 w-3.5 text-leaf fill-leaf/10 shrink-0" />
                        Riverside dining pavilion
                      </li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsModal("dinein");
                    }}
                    className="w-full bg-[#1E4D3A] hover:bg-[#163a2c] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-sm"
                  >
                    Reserve Slot
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 2: Delivery */}
              <div 
                onClick={() => handleOpenDetailsModal("delivery")}
                className="bg-white rounded-[32px] border border-secondary/40 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between group cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <img src={deliveryImg} alt="Sadya at Home" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103" />
                  <div className="absolute top-4 left-4 bg-white/90 text-primary text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                    Delivery
                  </div>
                  <div className="absolute top-4 right-4 bg-[#C89B3C] text-white rounded-2xl px-4 py-2 flex flex-col items-center justify-center shadow-md border border-[#F4E2B1]/40 leading-none">
                    <span className="text-[7px] font-extrabold tracking-widest uppercase opacity-75">From</span>
                    <span className="text-sm font-black mt-0.5">₹599</span>
                    <span className="text-[6.5px] font-extrabold tracking-wider uppercase mt-0.5">Per Person</span>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-display text-2xl font-bold text-primary">
                      Sadya at Home
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                        <Leaf className="h-3.5 w-3.5 text-leaf fill-leaf/10 shrink-0" />
                        Delivered hot & fresh
                      </li>
                      <li className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                        <Leaf className="h-3.5 w-3.5 text-leaf fill-leaf/10 shrink-0" />
                        Eco-friendly leaf packaging
                      </li>
                      <li className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                        <Leaf className="h-3.5 w-3.5 text-leaf fill-leaf/10 shrink-0" />
                        Kochi limits only (within 25 km)
                      </li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsModal("delivery");
                    }}
                    className="w-full bg-[#1E4D3A] hover:bg-[#163a2c] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-sm"
                  >
                    Order Now
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Card 3: Celebration */}
              <div 
                onClick={() => handleOpenDetailsModal("celebration")}
                className="bg-white rounded-[32px] border border-secondary/40 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col justify-between group cursor-pointer transition-transform hover:scale-[1.01]"
              >
                <div className="relative h-56 w-full overflow-hidden">
                  <img src={celebrationImg} alt="One Day Experience" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-103" />
                  <div className="absolute top-4 left-4 bg-white/90 text-primary text-[9px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                    Full Day
                  </div>
                  <div className="absolute top-4 right-4 bg-[#C89B3C] text-white rounded-2xl px-4 py-2 flex flex-col items-center justify-center shadow-md border border-[#F4E2B1]/40 leading-none">
                    <span className="text-[7px] font-extrabold tracking-widest uppercase opacity-75">From</span>
                    <span className="text-sm font-black mt-0.5">₹1299</span>
                    <span className="text-[6.5px] font-extrabold tracking-wider uppercase mt-0.5">Per Person</span>
                  </div>
                </div>
                
                <div className="p-6 md:p-8 flex-1 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-display text-2xl font-bold text-primary">
                      One Day Experience
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                        <Leaf className="h-3.5 w-3.5 text-leaf fill-leaf/10 shrink-0" />
                        Sadya, culture & nature
                      </li>
                      <li className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                        <Leaf className="h-3.5 w-3.5 text-leaf fill-leaf/10 shrink-0" />
                        Games, music & river walk
                      </li>
                      <li className="flex items-center gap-2 text-xs font-semibold text-primary/70">
                        <Leaf className="h-3.5 w-3.5 text-leaf fill-leaf/10 shrink-0" />
                        10:30 AM to 5:00 PM
                      </li>
                    </ul>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetailsModal("celebration");
                    }}
                    className="w-full bg-[#1E4D3A] hover:bg-[#163a2c] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-sm"
                  >
                    Book Experience
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>
          </section>

          {/* Booking Section */}
          <section id="booking" className="max-w-3xl lg:max-w-6xl mx-auto w-full animate-fade-up pt-6 md:pt-16 pb-12">
            <div className="bg-white rounded-[32px] border border-secondary/40 shadow-[0_10px_40px_rgba(0,0,0,0.03)] p-6 md:p-10">
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column (Stepped Accordion Wizard) */}
                <div className="lg:col-span-7 bg-[#FAF9F6] rounded-[28px] border border-secondary/20 overflow-hidden flex flex-col">
                  
                  {/* Step 1: Choose your package */}
                  {accordionHeader(
                    1,
                    "Choose your package",
                    pkg === "dinein" ? "Dine-In" : pkg === "delivery" ? "Delivery" : "Full Day",
                    subStep === 1,
                    true
                  )}
                  {subStep === 1 && (
                    <div className="p-6 border-b border-secondary/20 bg-white">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {(Object.keys(PACKAGES) as PackageKey[]).map((k) => {
                          const p = PACKAGES[k];
                          const active = pkg === k;
                          return (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                setPkg(k);
                                setSubStep(2);
                              }}
                              className={`p-4 border rounded-2xl flex flex-col items-start gap-1 cursor-pointer transition-all duration-250 text-left ${
                                active
                                  ? "border-primary bg-[#1E4D3A] text-white shadow-sm scale-102"
                                  : "border-[#EAE6DF] bg-[#FAF9F6] text-primary/80 hover:border-gold/60 hover:bg-secondary/5"
                              }`}
                            >
                              <span className="text-[8px] font-extrabold uppercase tracking-widest opacity-75">
                                {k === "dinein" ? "Dine-In" : k === "delivery" ? "Delivery" : "Full Day"}
                              </span>
                              <span className="text-xs font-bold leading-tight mt-1">
                                {k === "dinein" ? "Onam Sadya" : k === "delivery" ? "Sadya at Home" : "One Day Experience"}
                              </span>
                              <span className={`text-[10px] font-semibold mt-1 ${active ? "text-gold-soft" : "text-muted-foreground"}`}>
                                ₹{p.price} / person
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Pick a date */}
                  {accordionHeader(
                    2,
                    "Pick a date",
                    date ? `${date} Aug` : undefined,
                    subStep === 2,
                    true
                  )}
                  {subStep === 2 && (
                    <div className="p-6 border-b border-secondary/20 bg-white">
                      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                        {bookingDays.map((d) => {
                          const active = date === d.day;
                          const disabled = d.isClosed;
                          return (
                            <button
                              key={d.day}
                              type="button"
                              disabled={disabled}
                              onClick={() => {
                                setDate(d.day);
                                if (pkg === "dinein") {
                                  setSubStep(3);
                                } else {
                                  setSubStep(4);
                                }
                              }}
                              className={`h-14 w-full rounded-2xl border flex flex-col items-center justify-center transition-all duration-250 cursor-pointer ${
                                active
                                  ? "border-primary bg-[#1E4D3A] text-white shadow-sm scale-102"
                                  : disabled
                                    ? "border-secondary/15 bg-secondary/5 text-primary/20 line-through cursor-not-allowed opacity-40"
                                    : "border-[#EAE6DF] bg-[#FAF9F6] text-primary hover:border-gold/60"
                              }`}
                            >
                              <span className="text-xs font-black leading-none">{d.day}</span>
                              <span className="text-[7px] font-extrabold uppercase tracking-widest mt-1 opacity-75">Aug</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Pick a time slot */}
                  {accordionHeader(
                    3,
                    "Pick a time slot",
                    pkg === "dinein" ? slot : "Not Required",
                    subStep === 3,
                    pkg === "dinein"
                  )}
                  {subStep === 3 && (
                    <div className="p-6 border-b border-secondary/20 bg-white">
                      {pkg === "dinein" ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {dynamicTimeSlots.map(({ t, s, remaining }) => {
                            const disabled = s === "full" || s === "closed";
                            const active = slot === t && !disabled;
                            return (
                              <button
                                key={t}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                  setSlot(t);
                                  setSubStep(4);
                                }}
                                className={`p-3.5 border rounded-2xl flex flex-col items-start gap-1 cursor-pointer transition-all duration-250 text-left ${
                                  active
                                    ? "border-primary bg-[#1E4D3A] text-white shadow-sm font-bold scale-102"
                                    : disabled
                                      ? "border-secondary/15 bg-secondary/5 text-primary/30 cursor-not-allowed opacity-50"
                                      : "border-[#EAE6DF] bg-[#FAF9F6] text-primary hover:border-gold/60"
                                }`}
                              >
                                <span className="text-xs font-bold">{t}</span>
                                {(s === "closed" || s === "full") && (
                                  <span className={`text-[8px] font-extrabold uppercase tracking-widest mt-0.5 ${
                                    active ? "text-gold-soft" : "text-maroon/90 font-bold"
                                  }`}>
                                    {s === "closed" ? "Closed" : "Full"}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-[#FAF9F6] p-6 rounded-2xl border border-secondary/20 text-center space-y-3">
                          <p className="text-sm text-primary/70 font-semibold">No seating slot selection required for this package.</p>
                          <button
                            type="button"
                            onClick={() => setSubStep(4)}
                            className="rounded-full bg-primary text-white px-5 py-2 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-primary/95 transition-colors"
                          >
                            Continue
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: How many guests? */}
                  {accordionHeader(
                    4,
                    pkg === "delivery" ? "How many sadhya?" : "How many guests?",
                    pkg === "delivery" ? `${qty} Sadhya` : `${qty} Guests`,
                    subStep === 4,
                    true
                  )}
                  {subStep === 4 && (
                    <div className="p-6 border-b border-secondary/20 bg-white">
                      <div className="flex flex-col items-center gap-4 py-2">
                        <div className="flex items-center justify-between border border-[#EAE6DF] rounded-2xl p-2.5 bg-[#FAF9F6] w-full max-w-[240px]">
                          <button
                            type="button"
                            onClick={() => setQty(Math.max(1, qty - 1))}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white text-primary border border-secondary/20 shadow-sm transition hover:scale-105 cursor-pointer font-bold shrink-0"
                          >
                            –
                          </button>
                          
                          <div className="flex flex-col items-center flex-1">
                            <input
                              type="number"
                              min={1}
                              max={capacityInfo.remaining}
                              value={qty || ""}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val)) {
                                  setQty(Math.max(1, Math.min(capacityInfo.remaining, val)));
                                } else {
                                  setQty(1);
                                }
                              }}
                              className="w-20 text-center text-base font-black bg-transparent border-none focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-primary"
                            />
                            <span className="text-[7.5px] text-muted-foreground uppercase tracking-widest font-extrabold -mt-0.5">
                              {pkg === "delivery" ? "sadhyas" : "guests"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setQty(Math.min(capacityInfo.remaining, qty + 1))}
                            className="grid h-8 w-8 place-items-center rounded-full bg-white text-primary border border-secondary/20 shadow-sm transition hover:scale-105 cursor-pointer font-bold shrink-0"
                          >
                            +
                          </button>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => setSubStep(5)}
                          className="mt-2 w-full max-w-[240px] py-3.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-102 transition shadow-md cursor-pointer"
                        >
                          Continue
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Your details */}
                  {accordionHeader(
                    5,
                    "Your details",
                    name ? name : undefined,
                    subStep === 5,
                    true
                  )}
                  {subStep === 5 && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleReserve();
                      }}
                      className="p-6 sm:p-8 space-y-5 bg-white"
                      id="onam-booking-form-element"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-extrabold uppercase tracking-widest text-muted-foreground">Full Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Enter your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF9F6] px-4 py-3 text-xs text-primary focus:border-gold focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-extrabold uppercase tracking-widest text-muted-foreground">Phone</label>
                          <input
                            type="tel"
                            required
                            placeholder="Enter 10-digit number"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            value={phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, "");
                              if (val.length <= 10) {
                                setPhone(val);
                              }
                            }}
                            className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF9F6] px-4 py-3 text-xs text-primary focus:border-gold focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-extrabold uppercase tracking-widest text-muted-foreground">Email</label>
                          <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF9F6] px-4 py-3 text-xs text-primary focus:border-gold focus:outline-none"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-[8.5px] font-extrabold uppercase tracking-widest text-muted-foreground">Notes (Optional)</label>
                          <input
                            type="text"
                            placeholder="Anything we should know?"
                            className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF9F6] px-4 py-3 text-xs text-primary focus:border-gold focus:outline-none"
                          />
                        </div>
                      </div>

                      {pkg === "delivery" && (
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-baseline">
                            <label className="text-[8.5px] font-extrabold uppercase tracking-widest text-muted-foreground">Delivery Address</label>
                            <span className="text-[7.5px] font-bold text-maroon uppercase tracking-wider">(Delivery only in Kochi)</span>
                          </div>
                          <textarea
                            required
                            placeholder="Flat / House No, Street, Area, Kochi, Kerala"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            rows={2}
                            className="w-full rounded-xl border border-[#EAE6DF] bg-[#FAF9F6] px-4 py-2.5 text-xs text-primary focus:border-gold focus:outline-none resize-none"
                          />
                        </div>
                      )}
                      
                      <button type="submit" className="hidden" id="submit-booking-form" />
                    </form>
                  )}

                </div>

                {/* Right Column (Gorgeous Green Summary Card) */}
                <div className="lg:col-span-5">
                  <div className="bg-[#122b20] text-[#E8E3D8] rounded-[28px] p-6 space-y-6 shadow-lg border border-primary/20 sticky top-4">
                    <div className="space-y-1">
                      <span className="text-[8.5px] font-extrabold uppercase tracking-[0.25em] text-[#8E9F96]">
                        Your Reservation
                      </span>
                      <h3 className="font-display text-2xl font-bold text-white">
                        {pkg === "dinein" ? "Onam Sadya" : pkg === "delivery" ? "Sadya at Home" : "One Day Experience"}
                      </h3>
                      <p className="text-xs text-[#8E9F96] font-semibold">
                        August {date} {pkg === "dinein" ? ` - ${slot}` : ""}
                      </p>
                    </div>

                    <div className="border-t border-[#1a3d2e] pt-4 space-y-3 text-xs font-semibold">
                      <div className="flex justify-between text-[#8E9F96]">
                        <span>Package</span>
                        <span className="text-white">₹{PACKAGES[pkg].price} × {qty}</span>
                      </div>
                      <div className="flex justify-between text-[#8E9F96]">
                        <span>Guests</span>
                        <span className="text-white">{qty} guests</span>
                      </div>
                      <div className="flex justify-between text-[#8E9F96]">
                        <span>GST & fees</span>
                        <span className="text-white">Inclusive</span>
                      </div>
                    </div>

                    <div className="border-t border-[#1a3d2e] pt-4 flex justify-between items-baseline">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-[#8E9F96]">Total</span>
                      <span className="text-3xl font-black text-gold">
                        ₹{total.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (subStep === 5) {
                          const formEl = document.getElementById("submit-booking-form");
                          if (formEl) formEl.click();
                        } else {
                          if (subStep === 1) setSubStep(2);
                          else if (subStep === 2) {
                            if (pkg === "dinein") setSubStep(3);
                            else setSubStep(4);
                          }
                          else if (subStep === 3) setSubStep(4);
                          else if (subStep === 4) setSubStep(5);
                        }
                      }}
                      className="w-full bg-[#C89B3C] hover:bg-[#b08732] text-black py-4 rounded-full font-bold text-xs uppercase tracking-widest transition duration-200 cursor-pointer shadow-md text-center"
                    >
                      {subStep === 5 ? "Confirm & Reserve" : "Continue"}
                    </button>

                    <p className="text-[9px] text-[#8E9F96] text-center leading-relaxed">
                      Secured by WhatsApp - instant confirmation & booking receipt
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </section>

        </div>
      </div>

      {/* Immersive Onam Details Modal */}
      {showDetailsModal && (() => {
        const content = PACKAGE_DETAILS_CONTENT[detailPkg];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
              onClick={() => setShowDetailsModal(false)}
            />
            
            {/* Modal Content Card */}
            <div className="relative bg-[#FAF9F6] rounded-[32px] border border-gold/30 shadow-[0_20px_50px_rgba(0,0,0,0.3)] max-w-xl w-full overflow-hidden z-10 animate-fade-up flex flex-col max-h-[85vh]">
              
              {/* Header Image/Banner */}
              <div className="relative h-44 sm:h-52 w-full overflow-hidden shrink-0">
                <img src={content.banner} alt={content.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-black/40" />
                
                {/* Close Button */}
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition cursor-pointer font-bold"
                >
                  ✕
                </button>

                {/* Subtitle / Category Badge */}
                <div className="absolute bottom-4 left-6 bg-[#1E4D3A] text-white text-[8px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-full border border-gold/20 shadow-sm">
                  {content.subtitle}
                </div>
              </div>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1 scrollbar-thin">
                
                {/* Traditional Kasavu Border Accent */}
                <div className="h-1 w-full bg-gradient-to-r from-gold via-[#FAF9F6] to-gold rounded-full opacity-60" />

                <div className="space-y-2">
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-primary">
                    {content.title}
                  </h3>
                  <p className="text-xs text-primary/80 font-medium leading-relaxed">
                    {content.description}
                  </p>
                </div>

                {/* Inclusions / Highlights */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-[10px] font-extrabold text-gold uppercase tracking-[0.2em] border-b border-gold/15 pb-1">
                    Package Highlights
                  </h4>
                  
                  <div className="space-y-3.5">
                    {content.inclusions.map((inc, i) => (
                      <div key={i} className="flex gap-3">
                        <Leaf className="h-4 w-4 text-leaf fill-leaf/10 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[9.5px] font-extrabold uppercase tracking-wider text-primary">
                            {inc.category}
                          </p>
                          <p className="text-xs text-primary/70 font-semibold mt-0.5 leading-relaxed">
                            {inc.items}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Footer / CTA Actions */}
              <div className="p-6 border-t border-secondary/10 bg-white/50 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest leading-none">Price per pax</span>
                  <div className="text-xl font-black text-primary leading-none mt-1">₹{content.price}</div>
                </div>

                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleSelectPackageCard(detailPkg);
                  }}
                  className="w-full sm:w-auto bg-[#1E4D3A] hover:bg-[#163a2c] text-white px-8 py-4 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md"
                >
                  {detailPkg === "celebration" ? "Proceed to Book Celebration" : "Proceed to Book Sadya"}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Onam-Style Desktop Footer (Hidden on mobile, prominent on laptop/desktop, expanded width) */}
      <div className="mx-auto max-w-[440px] md:max-w-[1400px] px-4 md:px-8 pb-10">
        <footer className="hidden md:block border border-white/10 pt-12 pb-6 relative overflow-hidden bg-primary rounded-[32px] px-8 md:px-12 shadow-[var(--shadow-luxe)]">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center relative z-10">
            {/* Column 1: Brand & Logo */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="Onam Elegance" className="h-10 w-10 object-contain filter brightness-125" />
                <div>
                  <h5 className="font-display font-bold text-sm tracking-wider text-ivory">ONAM ELEGANCE</h5>
                  <p className="text-[10px] text-gold-soft font-bold tracking-widest uppercase">Premium Dining</p>
                </div>
              </div>
              <p className="text-xs text-ivory/85 max-w-xs leading-relaxed">
                Experience the authentic taste of tradition. Celebrate this Onam season with our premium banana-leaf Sadhyas.
              </p>
            </div>

            {/* Column 2: Greeting */}
            <div className="text-center space-y-3">
              <div>
                <p className="font-display text-base text-ivory font-bold tracking-wide">
                  ഏവർക്കും ഞങ്ങളുടെ ഹൃദയം നിറഞ്ഞ
                </p>
                <h4 className="font-display text-xl text-gold-soft font-extrabold mt-1 tracking-wider uppercase animate-pulse">
                  ഓണാശംസകൾ!
                </h4>
                <p className="text-[10px] text-ivory/60 tracking-widest mt-1.5 uppercase">
                  Wishing You a Happy & Blessed Onam
                </p>
              </div>
            </div>

            {/* Column 3: Reserve CTA (Matching Screenshot) */}
            <div className="flex flex-col items-start md:items-end space-y-4">
              <div className="text-left md:text-right space-y-2">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold-soft font-bold">ONAM 2026</p>
                <p className="text-xs text-ivory/90 leading-relaxed font-semibold">
                  15 to 30 August · Slots open now.<br />
                  <a
                    href="https://maps.app.goo.gl/3MxvLXHCCM6vdtNp6"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-gold transition-colors duration-300"
                  >
                    Kunnathunad, Ernakulam · Kerala.
                  </a>
                  <br />
                  <a
                    href="https://wa.me/919072611622"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-gold transition-colors duration-300"
                  >
                    +91 90726 11622
                  </a>
                </p>
              </div>
              <button
                onClick={() => {
                  const element = document.getElementById("booking");
                  if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "start" });
                  }
                }}
                className="bg-gold text-primary font-display font-extrabold px-6 py-3 rounded-full hover:bg-gold-soft hover:scale-[1.03] transition-all duration-350 cursor-pointer shadow-md text-xs tracking-wider uppercase"
              >
                Reserve your seat
              </button>
            </div>
          </div>

          {/* Copyright row */}
          <div className="mt-12 pt-6 border-t border-gold/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-ivory/50 tracking-wider">
            <p>© 2026 Onam Elegance. All Rights Reserved.</p>
            <div className="flex items-center gap-4">
              <span>Traditional Taste</span>
              <span>•</span>
              <span>Luxury Experience</span>
            </div>
          </div>
        </footer>

        {/* Minimal Mobile Copyright (Hidden on laptop, simple text on mobile) */}
        <div className="md:hidden mt-16 pb-36 text-center text-[10px] text-muted-foreground/50 tracking-widest">
          <p>© 2026 ONAM ELEGANCE · ONASHAMSAKAL</p>
        </div>
      </div>



      {/* Bottom navigation (Mobile only) */}
      <nav className="fixed inset-x-0 bottom-4 z-40 mx-auto max-w-[440px] px-4 md:hidden">
        <div className="glass-card flex items-center justify-around rounded-full px-3 py-2">
          {TABS.map((n) => {
            const active = tab === n.k;
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
                    isWhatsApp ? "bg-leaf animate-glow" : "bg-primary"
                  }`} />
                )}
                {n.i}
                <span className="text-[9px] tracking-wider uppercase">{n.l}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Success QR Ticket Modal */}
      {showSuccessModal && createdBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          {/* Main Card */}
          <div className="relative w-full max-w-[360px] bg-card rounded-[32px] border border-gold/20 shadow-2xl p-6 flex flex-col items-center text-center overflow-hidden animate-scale-up">
            {/* Background design */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-gold via-[#EAE6DF] to-gold" />
            
            {/* Success Icon */}
            <div className="mt-4 w-14 h-14 rounded-full bg-leaf/10 border border-leaf/30 flex items-center justify-center text-leaf animate-bounce">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
            
            <h3 className="mt-4 font-display text-xl font-bold text-primary">Booking Confirmed!</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Your Onam Sadhya entry pass</p>
            
            {/* Ticket QR Section */}
            <div className="mt-6 w-full bg-[#FAF9F6] border border-[#EAE6DF] rounded-[24px] p-5 flex flex-col items-center">
              <span className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest mb-3">Gate Entry QR Code</span>
              <div className="relative w-44 h-44 bg-white border border-[#EAE6DF] rounded-2xl p-2 flex items-center justify-center shadow-sm">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                    JSON.stringify({
                      bookingId: createdBooking.id,
                      token: createdBooking.token,
                    })
                  )}`}
                  alt="Entry Ticket QR"
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="mt-3 text-[9px] text-primary/70 font-semibold max-w-[200px] leading-normal">
                Please present this QR ticket at check-in or delivery.
              </p>
            </div>

            {/* Ticket Details */}
            <div className="mt-5 w-full text-left text-xs space-y-2.5 px-1 border-t border-dashed border-secondary/20 pt-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase tracking-wider text-[8px] font-bold">Booking ID</span>
                <span className="font-extrabold text-primary font-display">{createdBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase tracking-wider text-[8px] font-bold">Customer</span>
                <span className="font-bold text-primary">{createdBooking.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase tracking-wider text-[8px] font-bold">Date & Time</span>
                <span className="font-bold text-primary">
                  Aug {createdBooking.date}, 2026 {createdBooking.slot ? `(${createdBooking.slot})` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase tracking-wider text-[8px] font-bold">Package</span>
                <span className="font-bold text-primary capitalize">
                  {createdBooking.package === "dinein" ? "Dine-In" : createdBooking.package === "delivery" ? "Home Delivery" : "Celebration"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase tracking-wider text-[8px] font-bold">Quantity</span>
                <span className="font-bold text-primary">
                  {createdBooking.qty} {createdBooking.package === "delivery" ? "Sadhyas" : "Guests"}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-gold/10 pt-2.5 mt-2">
                <span className="text-primary font-extrabold uppercase tracking-wider text-[9px]">Total Paid</span>
                <span className="font-display text-base font-black text-primary">₹{createdBooking.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 w-full space-y-2.5">
              <button
                onClick={() => handleSendWhatsAppTicket(createdBooking)}
                className="w-full bg-[#1E4D3A] hover:bg-[#163a2c] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition duration-200 cursor-pointer shadow-md"
              >
                Send Ticket to WhatsApp
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={handleDismissSuccessModal}
                className="w-full text-muted-foreground hover:text-primary py-2 text-xs font-bold uppercase tracking-wider transition cursor-pointer"
              >
                Close & Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      {label}
    </span>
  );
}
