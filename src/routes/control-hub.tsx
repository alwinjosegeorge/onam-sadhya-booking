import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Users,
  Clock,
  Search,
  Download,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Calendar,
  X,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

import dineinImg from "@/assets/pkg-dinein.jpg";
import deliveryImg from "@/assets/pkg-delivery.jpg";
import celebrationImg from "@/assets/pkg-celebration.jpg";
import logoImg from "@/assets/logo.webp";

export const Route = createFileRoute("/control-hub")({
  component: AdminPage,
});

interface Booking {
  id: string;
  name: string;
  phone: string;
  package: "dinein" | "delivery" | "celebration";
  date: number; // day of August (15 - 30)
  slot?: string;
  qty: number;
  total: number;
  status: "confirmed" | "cancelled";
  address?: string;
  createdAt: string;
  paymentId?: string;
}

const TIME_SLOTS = [
  "11:15 AM",
  "12:00 PM",
  "12:45 PM",
  "1:30 PM",
  "2:15 PM",
  "3:00 PM",
];

function AdminPage() {
  const router = useRouter();

  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Local storage states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [closedDates, setClosedDates] = useState<number[]>([]);
  const [closedSlots, setClosedSlots] = useState<string[]>([]); // format: "date-slot" e.g. "26-12:00 PM"
  const [selectedDate, setSelectedDate] = useState<number>(26);

  // Manual booking form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBooking, setNewBooking] = useState({
    name: "",
    phone: "",
    package: "dinein" as "dinein" | "delivery" | "celebration",
    date: 26,
    slot: "12:00 PM",
    qty: 2,
    address: "",
  });

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "cancelled">("all");
  const [activeBookingTab, setActiveBookingTab] = useState<"dinein" | "delivery" | "celebration">("dinein");
  
  // Scanner states
  const [showScanner, setShowScanner] = useState(false);
  const [scannerResult, setScannerResult] = useState<{
    status: "success" | "error" | "duplicate";
    message: string;
    booking?: Booking;
  } | null>(null);
  const [scannerInst, setScannerInst] = useState<any>(null);

  // Read session auth on mount and load storage items
  useEffect(() => {
    const auth = sessionStorage.getItem("control_hub_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }

    const storedBookings = localStorage.getItem("onam_bookings");
    const storedClosedDates = localStorage.getItem("onam_closed_dates");
    const storedClosedSlots = localStorage.getItem("onam_closed_slots");

    if (storedBookings) setBookings(JSON.parse(storedBookings));
    if (storedClosedDates) setClosedDates(JSON.parse(storedClosedDates));
    if (storedClosedSlots) setClosedSlots(JSON.parse(storedClosedSlots));
  }, []);

  // Handle keypad inputs
  const handlePinInput = (num: string) => {
    if (pin.length >= 4) return;
    const newPin = pin + num;
    setPin(newPin);
    setPinError(false);

    if (newPin.length === 4) {
      if (newPin === "5555") {
        setTimeout(() => {
          setIsAuthenticated(true);
          sessionStorage.setItem("control_hub_authenticated", "true");
        }, 200);
      } else {
        setTimeout(() => {
          setPinError(true);
          setPin("");
        }, 250);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setPinError(false);
  };

  // Physical keyboard listeners
  useEffect(() => {
    if (isAuthenticated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") {
        handlePinInput(e.key);
      } else if (e.key === "Backspace") {
        handleBackspace();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, isAuthenticated]);

  // Helper to save bookings
  const saveBookings = (newBookings: Booking[]) => {
    setBookings(newBookings);
    localStorage.setItem("onam_bookings", JSON.stringify(newBookings));
  };

  // Helper to toggle closed date
  const toggleDate = (d: number) => {
    let updated: number[];
    if (closedDates.includes(d)) {
      updated = closedDates.filter((x) => x !== d);
    } else {
      updated = [...closedDates, d];
    }
    setClosedDates(updated);
    localStorage.setItem("onam_closed_dates", JSON.stringify(updated));
  };

  // Helper to toggle closed slot
  const toggleSlot = (d: number, sl: string) => {
    const key = `${d}-${sl}`;
    let updated: string[];
    if (closedSlots.includes(key)) {
      updated = closedSlots.filter((x) => x !== key);
    } else {
      updated = [...closedSlots, key];
    }
    setClosedSlots(updated);
    localStorage.setItem("onam_closed_slots", JSON.stringify(updated));
  };

  // Cancel booking action
  const cancelBooking = (id: string) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: "cancelled" as const } : b
    );
    saveBookings(updated);
  };

  // Confirm/restore booking action
  const confirmBooking = (id: string) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: "confirmed" as const } : b
    );
    saveBookings(updated);
  };

  // Add manual booking
  const handleAddBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBooking.name || !newBooking.phone) {
      alert("Please fill in Name and Phone number");
      return;
    }
    if (newBooking.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    const price = newBooking.package === "dinein" ? 499 : newBooking.package === "delivery" ? 599 : 1299;
    const total = price * newBooking.qty;

    const b: Booking = {
      id: "OB-" + Math.floor(100000 + Math.random() * 900000),
      name: newBooking.name,
      phone: newBooking.phone,
      package: newBooking.package,
      date: newBooking.date,
      slot: newBooking.package === "dinein" ? newBooking.slot : undefined,
      qty: newBooking.qty,
      total,
      status: "confirmed",
      address: newBooking.package === "delivery" ? newBooking.address : undefined,
      createdAt: new Date().toISOString(),
      token: "TK-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000),
      checkedIn: false,
    };

    saveBookings([b, ...bookings]);
    setShowAddForm(false);
    setNewBooking({
      name: "",
      phone: "",
      package: "dinein",
      date: 26,
      slot: "12:00 PM",
      qty: 2,
      address: "",
    });
  };
 
  // Scanner helper functions
  const handleOpenScanner = () => {
    setShowScanner(true);
    setScannerResult(null);

    // Dynamically load html5-qrcode library from CDN if not loaded
    if (typeof (window as any).Html5Qrcode === "undefined") {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      script.onload = () => {
        startScanner();
      };
      document.body.appendChild(script);
    } else {
      setTimeout(() => {
        startScanner();
      }, 300);
    }
  };

  const startScanner = () => {
    if (typeof (window as any).Html5Qrcode === "undefined") return;
    try {
      const html5Qrcode = new (window as any).Html5Qrcode("admin-scanner-view");
      setScannerInst(html5Qrcode);
      html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width: number, height: number) => {
            return {
              width: Math.min(width * 0.7, 240),
              height: Math.min(height * 0.7, 240),
            };
          },
        },
        (qrText: string) => {
          html5Qrcode.stop().then(() => {
            handleScanSuccess(qrText);
          }).catch((err) => {
            console.error("Error stopping scanner:", err);
            handleScanSuccess(qrText);
          });
        },
        (error: any) => {
          // Silent frame read error callback
        }
      ).catch((err) => {
        console.error("Error starting scanner:", err);
      });
    } catch (e) {
      console.error("Scanner exception:", e);
    }
  };

  const handleCloseScanner = () => {
    if (scannerInst) {
      try {
        scannerInst.stop().catch(() => {});
      } catch (e) {}
      setScannerInst(null);
    }
    setShowScanner(false);
    setScannerResult(null);
  };

  const handleScanSuccess = (qrText: string) => {
    try {
      const data = JSON.parse(qrText);
      const bId = data.bookingId;
      const bToken = data.token;

      // Find matched booking from state
      const matched = bookings.find((b) => b.id === bId);

      if (!matched) {
        setScannerResult({
          status: "error",
          message: `Ticket not found in system database. (ID: ${bId || "Unknown"})`,
        });
        return;
      }

      // Check validation token to prevent fraud
      if (matched.token !== bToken) {
        setScannerResult({
          status: "error",
          message: "Verification failed! Security token is invalid or faked.",
          booking: matched,
        });
        return;
      }

      // Check if ticket has already been checked-in
      if (matched.checkedIn) {
        setScannerResult({
          status: "duplicate",
          message: "Duplicate scan! This ticket was already checked in.",
          booking: matched,
        });
        return;
      }

      // Success
      setScannerResult({
        status: "success",
        message: "Ticket verified successfully!",
        booking: matched,
      });
    } catch (e) {
      setScannerResult({
        status: "error",
        message: "Invalid QR Code format. Please scan a valid Onam booking QR ticket.",
      });
    }
  };

  const markCheckedIn = (bookingId: string) => {
    const updated = bookings.map((b) =>
      b.id === bookingId ? { ...b, checkedIn: true } : b
    );
    saveBookings(updated);
    setScannerResult(null);
    setShowScanner(false);
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = ["Booking ID", "Name", "Phone", "Package", "Date", "Slot", "Quantity", "Total (INR)", "Status", "Razorpay Payment ID", "Created At"];
    const rows = bookings.map((b) => [
      b.id,
      b.name,
      b.phone,
      b.package,
      `Aug ${b.date}`,
      b.slot || "-",
      b.qty,
      b.total,
      b.status,
      b.paymentId || "-",
      new Date(b.createdAt).toLocaleString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `onam_bookings_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Live occupancy calculations for a selected date
  const occupancyData = useMemo(() => {
    const data = TIME_SLOTS.map((sl) => {
      const booked = bookings
        .filter((b) => b.status === "confirmed" && b.package === "dinein" && b.date === selectedDate && b.slot === sl)
        .reduce((sum, b) => sum + b.qty, 0);

      const isClosed = closedSlots.includes(`${selectedDate}-${sl}`);
      return {
        slot: sl,
        booked,
        remaining: isClosed ? 0 : Math.max(0, 200 - booked),
        isClosed,
      };
    });
    return data;
  }, [bookings, selectedDate, closedSlots]);

  // Delivery & Event ticket calculations for selected date
  const deliveryCount = useMemo(() => {
    return bookings
      .filter((b) => b.status === "confirmed" && b.package === "delivery" && b.date === selectedDate)
      .reduce((sum, b) => sum + b.qty, 0);
  }, [bookings, selectedDate]);

  const eventCount = useMemo(() => {
    return bookings
      .filter((b) => b.status === "confirmed" && b.package === "celebration" && b.date === selectedDate)
      .reduce((sum, b) => sum + b.qty, 0);
  }, [bookings, selectedDate]);

  // General statistics dashboard metrics
  const stats = useMemo(() => {
    const confirmed = bookings.filter((b) => b.status === "confirmed");
    const totalRev = confirmed.reduce((sum, b) => sum + b.total, 0);

    const todayDateStr = new Date().toISOString().slice(0, 10);
    const todayBookings = bookings.filter(
      (b) => b.createdAt.slice(0, 10) === todayDateStr
    ).length;

    return {
      revenue: totalRev,
      todayBookings,
      totalBookings: confirmed.length,
    };
  }, [bookings]);

  // Filtered bookings list for search table
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.phone.includes(searchQuery) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.paymentId && b.paymentId.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || b.status === statusFilter;
      const matchesPackage = b.package === activeBookingTab;
      return matchesSearch && matchesStatus && matchesPackage;
    });
  }, [bookings, searchQuery, statusFilter, activeBookingTab]);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-pookalam p-4 text-primary">
        {/* Floating background ornaments */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 10%, var(--gold) 0, transparent 30%), radial-gradient(circle at 90% 80%, var(--maroon) 0, transparent 35%)",
          }}
        />

        {/* Back Button */}
        <button
          onClick={() => router.navigate({ to: "/" })}
          className="absolute left-6 top-6 glass-card flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary hover:scale-102 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Exit
        </button>

        <div className="w-full max-w-sm text-center relative z-10">
          {/* Logo container */}
          <div className="mx-auto h-20 w-20 overflow-hidden rounded-3xl mb-6 flex items-center justify-center">
            <img src={logoImg} alt="Logo" className="h-full w-full object-contain" />
          </div>

          <h2 className="font-display text-2xl text-primary font-semibold leading-tight">Control Hub</h2>
          <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">
            Enter 4-Digit Passcode
          </p>

          {/* PIN dots display */}
          <div className={`mt-8 flex justify-center gap-4 py-2 ${pinError ? "animate-shake" : ""}`}>
            {[0, 1, 2, 3].map((i) => {
              const active = pin.length > i;
              return (
                <div
                  key={i}
                  className={`h-4.5 w-4.5 rounded-full border-2 transition-all duration-300 ${
                    pinError
                      ? "border-maroon bg-maroon/20"
                      : active
                        ? "border-gold bg-gold shadow-[var(--shadow-gold)] scale-110"
                        : "border-gold/30 bg-transparent"
                  }`}
                />
              );
            })}
          </div>

          {pinError && (
            <p className="mt-3 text-xs font-semibold text-maroon uppercase tracking-wider animate-pulse">
              Incorrect Passcode
            </p>
          )}

          {/* Keypad */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handlePinInput(num)}
                className="glass-card grid h-14 w-14 place-items-center rounded-full text-lg font-semibold text-primary transition active:scale-90 hover:border-gold/50 cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setPin("")}
              className="grid h-14 w-14 place-items-center rounded-full text-xs font-semibold text-muted-foreground uppercase tracking-wider transition active:scale-90 hover:text-primary cursor-pointer"
            >
              Clear
            </button>
            <button
              onClick={() => handlePinInput("0")}
              className="glass-card grid h-14 w-14 place-items-center rounded-full text-lg font-semibold text-primary transition active:scale-90 hover:border-gold/50 cursor-pointer"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="grid h-14 w-14 place-items-center rounded-full text-muted-foreground hover:text-primary transition active:scale-90 cursor-pointer"
              aria-label="Backspace"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-pookalam pb-24 text-primary">
      {/* Floating background ornaments */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 10%, var(--gold) 0, transparent 30%), radial-gradient(circle at 90% 80%, var(--maroon) 0, transparent 35%)",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-gold/10 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.navigate({ to: "/" })}
              className="glass-card grid h-11 w-11 place-items-center rounded-2xl text-primary transition hover:scale-105 hover:border-gold/30 cursor-pointer shadow-sm bg-card/60"
              title="Back to site"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 overflow-hidden rounded-xl bg-primary border border-gold/20 flex items-center justify-center p-0.5">
                <img src={logoImg} alt="Logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                  Hooked & Cooked <span className="text-gold font-normal text-lg">Control Hub</span>
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-leaf animate-pulse" />
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Live System Connected</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 self-end md:self-auto">
            <button
              onClick={exportToCSV}
              className="glass-card flex items-center gap-2.5 rounded-full px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-primary hover:border-gold/40 hover:scale-102 transition cursor-pointer shadow-sm"
            >
              <Download className="h-4 w-4 text-gold" /> Export CSV
            </button>
            <button
              onClick={handleOpenScanner}
              className="flex items-center gap-2.5 rounded-full bg-leaf px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md hover:scale-105 active:scale-98 transition duration-300 cursor-pointer"
            >
              <Search className="h-4 w-4 text-white" /> Scan Ticket
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2.5 rounded-full bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory shadow-[var(--shadow-gold)] hover:scale-105 active:scale-98 transition duration-300 cursor-pointer"
            >
              <Plus className="h-4 w-4 text-gold-soft" /> New Booking
            </button>
          </div>
        </header>

        {/* Dashboard Stats */}
        <section className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="glass-card rounded-[24px] p-5 flex items-center justify-between col-span-2 md:col-span-1 shadow-md">
            <div>
              <p className="text-[10px] md:text-xs font-display uppercase tracking-wider text-muted-foreground">Total Revenue</p>
              <h3 className="font-display text-2xl md:text-3xl font-semibold mt-1 text-primary">₹{stats.revenue.toLocaleString("en-IN")}</h3>
              <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">From all confirmed packages</p>
            </div>
            <div className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-xl md:rounded-2xl bg-gold/10 text-gold">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>

          <div className="glass-card rounded-[24px] p-5 flex items-center justify-between col-span-1 shadow-md">
            <div>
              <p className="text-[10px] md:text-xs font-display uppercase tracking-wider text-muted-foreground">Today's Bookings</p>
              <h3 className="font-display text-2xl md:text-3xl font-semibold mt-1 text-primary">{stats.todayBookings}</h3>
              <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">Submitted today</p>
            </div>
            <div className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-xl md:rounded-2xl bg-leaf/10 text-leaf">
              <Clock className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>

          <div className="glass-card rounded-[24px] p-5 flex items-center justify-between col-span-1 shadow-md">
            <div>
              <p className="text-[10px] md:text-xs font-display uppercase tracking-wider text-muted-foreground">Total Reservations</p>
              <h3 className="font-display text-2xl md:text-3xl font-semibold mt-1 text-primary">{stats.totalBookings}</h3>
              <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">Active bookings</p>
            </div>
            <div className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-xl md:rounded-2xl bg-maroon/10 text-maroon">
              <Users className="h-5 w-5 md:h-6 md:w-6" />
            </div>
          </div>
        </section>

        {/* Main Work Area */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          
          {/* Capacity Manager (Left Column - 5 spans) */}
          <section className="lg:col-span-5 space-y-6">
            <div className="glass-card rounded-[28px] p-6 border border-gold/10">
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gold" /> Capacity & Overrides
              </h2>

              {/* Date selection for live capacity overrides */}
              <div className="mb-6">
                <label className="block text-[10px] font-display uppercase tracking-widest text-muted-foreground mb-2">Select Date (August)</label>
                <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {Array.from({ length: 16 }).map((_, i) => {
                    const day = 15 + i;
                    const isClosed = closedDates.includes(day);
                    const active = selectedDate === day;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDate(day)}
                        className={`shrink-0 rounded-xl w-11 h-11 flex flex-col items-center justify-center text-xs font-semibold transition-all duration-300 cursor-pointer border ${
                          active
                            ? "bg-primary text-ivory border-transparent shadow-[var(--shadow-gold)] scale-105"
                            : isClosed
                              ? "bg-maroon/5 text-maroon border-maroon/20 line-through opacity-75"
                              : "bg-card hover:border-gold/40 text-primary border-gold/10"
                        }`}
                      >
                        <span className="text-[8px] uppercase tracking-tighter opacity-60 font-normal">Aug</span>
                        <span className="font-display font-semibold -mt-0.5">{day}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status indicator for selected date */}
              <div className="mb-6 flex items-center justify-between p-4 rounded-2xl bg-card/45 border border-gold/10 shadow-sm">
                <div>
                  <h4 className="text-sm font-semibold font-display">August {selectedDate} Status</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${closedDates.includes(selectedDate) ? "bg-maroon" : "bg-leaf animate-pulse"}`} />
                    {closedDates.includes(selectedDate) ? "Closed for bookings" : "Accepting bookings"}
                  </p>
                </div>
                <button
                  onClick={() => toggleDate(selectedDate)}
                  className={`flex items-center gap-1.5 rounded-full px-4.5 py-2 text-xs font-semibold tracking-wider uppercase cursor-pointer transition-all duration-300 ${
                    closedDates.includes(selectedDate)
                      ? "bg-leaf/15 text-leaf border border-leaf/30 hover:bg-leaf/25"
                      : "bg-maroon/10 text-maroon border border-maroon/30 hover:bg-maroon/20"
                  }`}
                >
                  {closedDates.includes(selectedDate) ? (
                    <>
                      <Unlock className="h-3.5 w-3.5 text-leaf" /> Open Date
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5 text-maroon" /> Close Date
                    </>
                  )}
                </button>
              </div>

              {/* Dine-In Slot Occupancy Status */}
              <div className="space-y-4">
                <h3 className="font-display text-sm font-semibold border-b border-gold/5 pb-2 text-primary">Dine-in Slot Occupancy</h3>
                {occupancyData.map((d) => {
                  const percent = Math.min(100, (d.booked / 200) * 100);
                  const isFull = d.booked >= 200;
                  return (
                    <div key={d.slot} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-primary">{d.slot}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted-foreground font-medium">
                            {d.isClosed ? (
                              <span className="text-maroon font-semibold uppercase tracking-wider text-[10px] bg-maroon/10 px-2 py-0.5 rounded-full">CLOSED</span>
                            ) : isFull ? (
                              <span className="text-maroon font-semibold uppercase tracking-wider text-[10px] bg-maroon/10 px-2 py-0.5 rounded-full">FULL</span>
                            ) : (
                              `${d.booked} / 200 seats booked`
                            )}
                          </span>
                          <button
                            onClick={() => toggleSlot(selectedDate, d.slot)}
                            className="text-muted-foreground hover:text-primary transition duration-300"
                            title={d.isClosed ? "Open slot" : "Close slot"}
                          >
                            {d.isClosed ? <Unlock className="h-3.5 w-3.5 text-leaf" /> : <Lock className="h-3.5 w-3.5 text-maroon" />}
                          </button>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden border border-gold/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            d.isClosed
                              ? "bg-maroon/40"
                              : isFull
                                ? "bg-gradient-to-r from-maroon to-red-500"
                                : percent > 85
                                  ? "bg-gradient-to-r from-gold to-yellow-500"
                                  : "bg-gradient-to-r from-leaf to-emerald-500"
                          }`}
                          style={{ width: `${d.isClosed ? 100 : percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Delivery and Event occupancy numbers */}
              <div className="mt-6 pt-5 border-t border-gold/10 grid grid-cols-2 gap-4">
                <div className="p-4 bg-card/30 rounded-2xl border border-gold/5 shadow-sm">
                  <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground font-semibold">Delivery Orders</p>
                  <p className="font-display text-xl font-bold mt-1 text-primary">{deliveryCount} <span className="text-xs font-normal text-muted-foreground">/ 600</span></p>
                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden border border-gold/5">
                    <div
                      className="h-full bg-gradient-to-r from-leaf to-emerald-500 rounded-full"
                      style={{ width: `${(deliveryCount / 600) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="p-4 bg-card/30 rounded-2xl border border-gold/5 shadow-sm">
                  <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground font-semibold">Event Tickets</p>
                  <p className="font-display text-xl font-bold mt-1 text-primary">{eventCount} <span className="text-xs font-normal text-muted-foreground">/ 600</span></p>
                  <div className="mt-2 h-1.5 w-full bg-muted rounded-full overflow-hidden border border-gold/5">
                    <div
                      className="h-full bg-gradient-to-r from-gold to-yellow-500 rounded-full"
                      style={{ width: `${(eventCount / 600) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Bookings Table (Right Column - 7 spans) */}
          <section className="lg:col-span-7">
            <div className="glass-card rounded-[28px] p-6 border border-gold/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="font-display text-lg font-semibold">Bookings Management</h2>
                {/* Category tab buttons */}
                <div className="flex bg-card p-1 rounded-full border border-gold/10 self-start md:self-auto">
                  {(["dinein", "delivery", "celebration"] as const).map((tabKey) => (
                    <button
                      key={tabKey}
                      onClick={() => setActiveBookingTab(tabKey)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                        activeBookingTab === tabKey
                          ? "bg-primary text-ivory shadow-[var(--shadow-gold)]"
                          : "text-muted-foreground hover:text-primary"
                      }`}
                    >
                      {tabKey === "dinein" ? "Dine-In" : tabKey === "delivery" ? "Delivery" : "Event"}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Search & Filters toolbar */}
              <div className="flex flex-col md:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by ID, Name, or Phone..."
                    className="w-full rounded-full border border-gold/20 bg-card/50 pl-10 pr-4 py-2 text-sm text-primary placeholder:text-muted-foreground/50 focus:border-gold focus:outline-none"
                  />
                </div>
                <div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="rounded-full border border-gold/20 bg-card px-4 py-2 text-xs text-primary focus:outline-none w-full md:w-auto"
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gold/10 text-muted-foreground uppercase tracking-widest text-[9px]">
                      <th className="py-3 px-2 font-display">Booking ID</th>
                      <th className="py-3 px-2 font-display">Customer</th>
                      <th className="py-3 px-2 font-display">Date</th>
                      {activeBookingTab === "dinein" && <th className="py-3 px-2 font-display">Slot</th>}
                      {activeBookingTab === "delivery" && <th className="py-3 px-2 font-display">Delivery Address</th>}
                      <th className="py-3 px-2 font-display">
                        {activeBookingTab === "dinein" ? "Guests" : activeBookingTab === "delivery" ? "Qty" : "Tickets"}
                      </th>
                      <th className="py-3 px-2 font-display">Amount</th>
                      <th className="py-3 px-2 font-display">Status</th>
                      <th className="py-3 px-2 font-display text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={activeBookingTab === "dinein" || activeBookingTab === "delivery" ? 8 : 7} className="py-12 text-center text-muted-foreground">
                          <AlertTriangle className="h-8 w-8 mx-auto text-gold/45 mb-2" />
                          No bookings found in this category
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="border-b border-gold/5 hover:bg-card/30 transition">
                          <td className="py-3.5 px-2">
                            <p className="font-semibold font-display text-primary">{b.id}</p>
                            {b.paymentId && (
                              <p className="text-[9px] font-mono text-gold-dark mt-0.5" title="Razorpay Payment ID">
                                💳 {b.paymentId}
                              </p>
                            )}
                          </td>
                          <td className="py-3.5 px-2">
                            <p className="font-semibold text-primary">{b.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{b.phone}</p>
                          </td>
                          <td className="py-3.5 px-2 font-medium">Aug {b.date}</td>
                          {activeBookingTab === "dinein" && (
                            <td className="py-3.5 px-2 font-medium">{b.slot || "-"}</td>
                          )}
                          {activeBookingTab === "delivery" && (
                            <td className="py-3.5 px-2 font-medium max-w-[150px] truncate" title={b.address}>
                              {b.address || "-"}
                            </td>
                          )}
                          <td className="py-3.5 px-2 font-medium">{b.qty} pax</td>
                          <td className="py-3.5 px-2 font-semibold">₹{b.total.toLocaleString("en-IN")}</td>
                          <td className="py-3.5 px-2 flex flex-col gap-1 items-start">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                                b.status === "confirmed"
                                  ? "bg-leaf/10 text-leaf"
                                  : "bg-maroon/10 text-maroon"
                              }`}
                            >
                              {b.status}
                            </span>
                            {b.checkedIn && (
                              <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                                Checked In
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-2 text-right">
                            {b.status === "confirmed" ? (
                              <button
                                onClick={() => cancelBooking(b.id)}
                                className="rounded-full bg-maroon/10 text-maroon hover:bg-maroon/20 px-2.5 py-1 font-semibold uppercase tracking-wider text-[9px] transition cursor-pointer"
                              >
                                Cancel
                              </button>
                            ) : (
                              <button
                                onClick={() => confirmBooking(b.id)}
                                className="rounded-full bg-leaf/10 text-leaf hover:bg-leaf/20 px-2.5 py-1 font-semibold uppercase tracking-wider text-[9px] transition cursor-pointer"
                              >
                                Restore
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="block md:hidden space-y-4">
                {filteredBookings.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground bg-card/20 rounded-2xl border border-gold/5">
                    <AlertTriangle className="h-8 w-8 mx-auto text-gold/45 mb-2" />
                    No bookings found in this category
                  </div>
                ) : (
                  filteredBookings.map((b) => (
                    <article key={b.id} className="bg-card/45 rounded-2xl p-4 border border-gold/10 space-y-3 shadow-sm hover:shadow-md transition">
                      <div className="flex items-center justify-between border-b border-gold/5 pb-2.5">
                        <div className="flex flex-col">
                          <span className="font-semibold text-primary font-display text-sm">{b.id}</span>
                          {b.paymentId && (
                            <span className="text-[9px] font-mono text-gold-dark mt-0.5" title="Razorpay Payment ID">
                              💳 {b.paymentId}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {b.checkedIn && (
                            <span className="inline-block rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                              Checked In
                            </span>
                          )}
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                              b.status === "confirmed"
                                ? "bg-leaf/10 text-leaf"
                                : "bg-maroon/10 text-maroon"
                            }`}
                          >
                            {b.status}
                          </span>
                          {b.status === "confirmed" ? (
                            <button
                              onClick={() => cancelBooking(b.id)}
                              className="rounded-full bg-maroon/15 text-maroon hover:bg-maroon/25 px-2.5 py-1 font-semibold uppercase tracking-wider text-[8px] transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          ) : (
                            <button
                              onClick={() => confirmBooking(b.id)}
                              className="rounded-full bg-leaf/15 text-leaf hover:bg-leaf/25 px-2.5 py-1 font-semibold uppercase tracking-wider text-[8px] transition cursor-pointer"
                            >
                              Restore
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customer:</span>
                          <span className="font-semibold text-primary">{b.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone:</span>
                          <a href={`tel:${b.phone}`} className="font-semibold text-gold hover:underline">{b.phone}</a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date:</span>
                          <span className="font-semibold text-primary">August {b.date}</span>
                        </div>
                        {activeBookingTab === "dinein" && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Seating Slot:</span>
                            <span className="font-semibold text-primary">{b.slot || "-"}</span>
                          </div>
                        )}
                        {activeBookingTab === "delivery" && (
                          <div className="flex flex-col gap-1 border-t border-gold/5 pt-1.5 mt-1">
                            <span className="text-muted-foreground">Delivery Address:</span>
                            <p className="font-medium text-primary bg-card/30 p-2.5 rounded-xl border border-gold/5 mt-0.5 whitespace-pre-wrap leading-relaxed">{b.address || "-"}</p>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-gold/5 pt-1.5 mt-1">
                          <span className="text-muted-foreground font-semibold">
                            {activeBookingTab === "dinein" ? "Guests:" : activeBookingTab === "delivery" ? "Qty:" : "Tickets:"}
                          </span>
                          <span className="font-semibold text-primary">{b.qty} Pax</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-gold/5">
                          <span className="text-muted-foreground font-semibold">Total Amount:</span>
                          <span className="font-display text-sm font-semibold text-primary">₹{b.total.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>

            </div>
          </section>

        </div>
      </div>

      {/* Manual Booking Modal Form */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in">
          <div className="glass-card rounded-[28px] border border-gold/15 max-w-md w-full p-6 relative bg-card shadow-2xl">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-muted text-primary hover:bg-gold/10 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="font-display text-lg font-semibold mb-4">Add Manual Booking</h3>

            <form onSubmit={handleAddBooking} className="space-y-4 text-xs">
              <div>
                <label className="block font-display uppercase tracking-widest text-muted-foreground mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={newBooking.name}
                  onChange={(e) => setNewBooking({ ...newBooking, name: e.target.value })}
                  placeholder="Enter name"
                  className="w-full rounded-xl border border-gold/20 bg-card px-3 py-2 text-sm text-primary placeholder:text-muted-foreground/50 focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-display uppercase tracking-widest text-muted-foreground mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={newBooking.phone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setNewBooking({ ...newBooking, phone: val });
                  }}
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="Enter 10-digit number"
                  className="w-full rounded-xl border border-gold/20 bg-card px-3 py-2 text-sm text-primary placeholder:text-muted-foreground/50 focus:border-gold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-display uppercase tracking-widest text-muted-foreground mb-1">Package</label>
                  <select
                    value={newBooking.package}
                    onChange={(e) => setNewBooking({ ...newBooking, package: e.target.value as any })}
                    className="w-full rounded-xl border border-gold/20 bg-card px-3 py-2 text-sm text-primary focus:outline-none"
                  >
                    <option value="dinein">Dine-In (₹499)</option>
                    <option value="delivery">Delivery (₹599)</option>
                    <option value="celebration">Event (₹1299)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-display uppercase tracking-widest text-muted-foreground mb-1">Aug Date (15–30)</label>
                  <select
                    value={newBooking.date}
                    onChange={(e) => setNewBooking({ ...newBooking, date: parseInt(e.target.value) })}
                    className="w-full rounded-xl border border-gold/20 bg-card px-3 py-2 text-sm text-primary focus:outline-none"
                  >
                    {Array.from({ length: 16 }).map((_, i) => (
                      <option key={15 + i} value={15 + i}>August {15 + i}</option>
                    ))}
                  </select>
                </div>
              </div>

              {newBooking.package === "dinein" && (
                <div>
                  <label className="block font-display uppercase tracking-widest text-muted-foreground mb-1">Seating Slot</label>
                  <select
                    value={newBooking.slot}
                    onChange={(e) => setNewBooking({ ...newBooking, slot: e.target.value })}
                    className="w-full rounded-xl border border-gold/20 bg-card px-3 py-2 text-sm text-primary focus:outline-none"
                  >
                    {TIME_SLOTS.map((sl) => (
                      <option key={sl} value={sl}>{sl}</option>
                    ))}
                  </select>
                </div>
              )}

              {newBooking.package === "delivery" && (
                <div>
                  <label className="block font-display uppercase tracking-widest text-muted-foreground mb-1">Delivery Address</label>
                  <textarea
                    value={newBooking.address}
                    onChange={(e) => setNewBooking({ ...newBooking, address: e.target.value })}
                    placeholder="Enter address"
                    rows={2}
                    className="w-full rounded-xl border border-gold/20 bg-card px-3 py-2 text-sm text-primary focus:border-gold focus:outline-none resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-display uppercase tracking-widest text-muted-foreground mb-1">Quantity (Guests)</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={newBooking.qty}
                  onChange={(e) => setNewBooking({ ...newBooking, qty: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-xl border border-gold/20 bg-card px-3 py-2 text-sm text-primary focus:border-gold focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold uppercase tracking-wider text-ivory hover:scale-102 transition shadow-[var(--shadow-gold)] cursor-pointer"
              >
                Add Reservation
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Scanner Overlay Modal */}
      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[360px] bg-card rounded-[32px] border border-gold/20 shadow-2xl p-6 flex flex-col items-center text-center overflow-hidden">
            {/* Top gold line */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-gold via-[#EAE6DF] to-gold" />
            
            <button
              onClick={handleCloseScanner}
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-muted text-primary hover:bg-gold/10 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="mt-4 font-display text-lg font-semibold text-primary">Ticket Validator</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5 mb-6">Scan Booking Entry QR Code</p>
            
            {/* Viewfinder element */}
            {!scannerResult ? (
              <div className="w-full max-w-[280px] aspect-square mx-auto overflow-hidden rounded-2xl border border-gold/20 bg-black flex items-center justify-center relative">
                <div id="admin-scanner-view" className="w-full h-full" />
                <div className="absolute inset-0 border-2 border-dashed border-gold/40 rounded-2xl pointer-events-none animate-pulse" />
              </div>
            ) : (
              /* Verification Results Display */
              <div className="w-full space-y-4">
                {scannerResult.status === "success" && (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-leaf/10 border border-leaf/30 flex items-center justify-center text-leaf animate-bounce">
                      <CheckCircle className="w-7 h-7 stroke-[3]" />
                    </div>
                    <h4 className="mt-3 font-bold text-leaf uppercase tracking-wider text-xs">Valid Entry Ticket</h4>
                    <p className="text-[10.5px] text-muted-foreground mt-1">{scannerResult.message}</p>
                    
                    {scannerResult.booking && (
                      <div className="mt-5 w-full bg-[#FAF9F6] border border-[#EAE6DF] rounded-2xl p-4 text-left text-xs space-y-2">
                        <div className="flex justify-between border-b border-gold/5 pb-1.5">
                          <span className="text-muted-foreground">Booking ID</span>
                          <span className="font-bold text-primary font-display">{scannerResult.booking.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customer</span>
                          <span className="font-bold text-primary">{scannerResult.booking.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Phone</span>
                          <span className="font-semibold text-primary">{scannerResult.booking.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Package</span>
                          <span className="font-bold text-primary capitalize">{scannerResult.booking.package}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantity</span>
                          <span className="font-bold text-primary">{scannerResult.booking.qty} Pax</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={() => scannerResult.booking && markCheckedIn(scannerResult.booking.id)}
                      className="mt-6 w-full bg-leaf hover:bg-[#163a2c] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                    >
                      Approve & Check In
                    </button>
                  </div>
                )}

                {scannerResult.status === "duplicate" && (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold animate-shake">
                      <AlertTriangle className="w-7 h-7 stroke-[3]" />
                    </div>
                    <h4 className="mt-3 font-bold text-gold-dark uppercase tracking-wider text-xs">Duplicate Ticket Warning</h4>
                    <p className="text-[10.5px] text-muted-foreground mt-1">{scannerResult.message}</p>
                    
                    {scannerResult.booking && (
                      <div className="mt-5 w-full bg-[#FAF9F6] border border-[#EAE6DF] rounded-2xl p-4 text-left text-xs space-y-2">
                        <div className="flex justify-between border-b border-gold/5 pb-1.5">
                          <span className="text-muted-foreground">Booking ID</span>
                          <span className="font-bold text-primary font-display">{scannerResult.booking.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Customer</span>
                          <span className="font-bold text-primary">{scannerResult.booking.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status</span>
                          <span className="font-bold text-emerald-600 uppercase text-[9px] tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Checked In</span>
                        </div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleCloseScanner}
                      className="mt-6 w-full bg-primary text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                    >
                      Close Scanner
                    </button>
                  </div>
                )}

                {scannerResult.status === "error" && (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-maroon/10 border border-maroon/30 flex items-center justify-center text-maroon animate-shake">
                      <X className="w-7 h-7 stroke-[3]" />
                    </div>
                    <h4 className="mt-3 font-bold text-maroon uppercase tracking-wider text-xs">Invalid Entry Ticket</h4>
                    <p className="text-[10.5px] text-muted-foreground mt-1 max-w-[240px] leading-normal">{scannerResult.message}</p>
                    
                    <button
                      onClick={() => setScannerResult(null)}
                      className="mt-6 w-full bg-primary text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
                    >
                      Try Scanning Again
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {!scannerResult && (
              <p className="mt-6 text-[10px] text-muted-foreground font-semibold">
                Point camera at customer's booking QR Code ticket.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
