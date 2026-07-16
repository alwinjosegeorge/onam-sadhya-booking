import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { 
  getBookingsFn, 
  createBookingFn, 
  updateBookingStatusFn, 
  markBookingCheckedInFn, 
  getSettingsFn, 
  saveSettingsFn 
} from "@/lib/db-actions";
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
  QrCode,
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
    qty: "" as unknown as number,
    address: "",
  });

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "cancelled">("all");
  const [activeBookingTab, setActiveBookingTab] = useState<"dinein" | "delivery" | "celebration">("dinein");
  
  // Navigation & Tab state (Overview stats, bookings list, QR Scanner)
  const [activeAdminTab, setActiveAdminTab] = useState<"dashboard" | "bookings" | "scanner">("dashboard");

  // Scanner states
  const [scannerResult, setScannerResult] = useState<{
    status: "success" | "error" | "duplicate";
    message: string;
    booking?: Booking;
  } | null>(null);
  const [scannerInst, setScannerInst] = useState<any>(null);
  const [selectedBookingForQr, setSelectedBookingForQr] = useState<Booking | null>(null);

  // Read session auth on mount and load storage items
  useEffect(() => {
    const auth = sessionStorage.getItem("control_hub_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }

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

  // Scanner lifecycle observer
  useEffect(() => {
    if (!isAuthenticated) return;
    if (activeAdminTab === "scanner") {
      setScannerResult(null);
      // Dynamically load html5-qrcode from CDN if not loaded
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
    } else {
      // Clean up camera when leaving scanner tab
      if (scannerInst) {
        try {
          scannerInst.stop().catch(() => {});
        } catch (e) {}
        setScannerInst(null);
      }
      setScannerResult(null);
    }
    // Cleanup on unmount
    return () => {
      if (scannerInst) {
        try {
          scannerInst.stop().catch(() => {});
        } catch (e) {}
      }
    };
  }, [activeAdminTab, isAuthenticated]);

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
    
    // Save settings to Neon DB
    saveSettingsFn({ data: { closedDates: updated, closedSlots } }).catch(err => {
      console.error("Failed to save settings to Neon:", err);
    });
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
    
    // Save settings to Neon DB
    saveSettingsFn({ data: { closedDates, closedSlots: updated } }).catch(err => {
      console.error("Failed to save settings to Neon:", err);
    });
  };

  // Cancel booking action
  const cancelBooking = (id: string) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: "cancelled" as const } : b
    );
    saveBookings(updated);
    
    // Cancel booking on Neon DB
    updateBookingStatusFn({ data: { id, status: "cancelled" } }).catch(err => {
      console.error("Failed to cancel booking on Neon:", err);
    });
  };

  // Confirm/restore booking action
  const confirmBooking = (id: string) => {
    const updated = bookings.map((b) =>
      b.id === id ? { ...b, status: "confirmed" as const } : b
    );
    saveBookings(updated);
    
    // Confirm booking on Neon DB
    updateBookingStatusFn({ data: { id, status: "confirmed" } }).catch(err => {
      console.error("Failed to confirm booking on Neon:", err);
    });
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

    const qtyInt = parseInt(newBooking.qty as any) || 0;
    if (qtyInt <= 0) {
      alert("Please enter a valid quantity greater than 0");
      return;
    }

    const maxQty = newBooking.package === "dinein" ? 200 : 600;
    if (qtyInt > maxQty) {
      alert(`Maximum quantity allowed for ${newBooking.package === "dinein" ? "Dine-In" : newBooking.package === "delivery" ? "Delivery" : "Event"} is ${maxQty}`);
      return;
    }

    const price = newBooking.package === "dinein" ? 499 : newBooking.package === "delivery" ? 599 : 1299;
    const total = price * qtyInt;

    const b: Booking = {
      id: "OB-" + Math.floor(100000 + Math.random() * 900000),
      name: newBooking.name,
      phone: newBooking.phone,
      package: newBooking.package,
      date: newBooking.date,
      slot: newBooking.package === "dinein" ? newBooking.slot : undefined,
      qty: qtyInt,
      total,
      status: "confirmed",
      address: newBooking.package === "delivery" ? newBooking.address : undefined,
      createdAt: new Date().toISOString(),
      token: "TK-" + Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Math.floor(1000 + Math.random() * 9000),
      checkedIn: false,
    };

    saveBookings([b, ...bookings]);
    createBookingFn({ data: b as any }).catch(err => {
      console.error("Failed to save manual booking to Neon:", err);
    });
    setShowAddForm(false);
    setNewBooking({
      name: "",
      phone: "",
      package: "dinein",
      date: 26,
      slot: "12:00 PM",
      qty: "" as unknown as number,
      address: "",
    });
  };

  const handleDownloadTicket = (b: Booking) => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 680;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const qrImg = new Image();
    qrImg.crossOrigin = "anonymous";
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      JSON.stringify({
        bookingId: b.id,
        token: b.token || "",
      })
    )}`;

    qrImg.onload = () => {
      // Background
      ctx.fillStyle = "#FAF9F6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Top decorative gold bar
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, "#C89B3C");
      gradient.addColorStop(0.5, "#EAE6DF");
      gradient.addColorStop(1, "#C89B3C");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, 10);

      // Header Text
      ctx.fillStyle = "#1E4D3A";
      ctx.font = "bold 20px 'Playfair Display', serif";
      ctx.textAlign = "center";
      ctx.fillText("KADAMBRAYAR ONACHAMAYAM", canvas.width / 2, 45);

      ctx.fillStyle = "#C89B3C";
      ctx.font = "bold 10px 'Inter', sans-serif";
      ctx.fillText("ONAM SADHYA ENTRY PASS", canvas.width / 2, 65);

      // QR Code Container background
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect((canvas.width - 220) / 2, 90, 220, 220, 16);
      } else {
        ctx.rect((canvas.width - 220) / 2, 90, 220, 220);
      }
      ctx.fill();
      ctx.strokeStyle = "#EAE6DF";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw QR Code Image inside container
      ctx.drawImage(qrImg, (canvas.width - 180) / 2, 110, 180, 180);

      // Present text
      ctx.fillStyle = "#71717A";
      ctx.font = "500 10px 'Inter', sans-serif";
      ctx.fillText("Please present this QR at check-in or delivery.", canvas.width / 2, 335);

      // Dashed separator line
      ctx.strokeStyle = "#D4D4D8";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(25, 360);
      ctx.lineTo(canvas.width - 25, 360);
      ctx.stroke();
      ctx.setLineDash([]);

      // Ticket Details helper
      const drawDetailRow = (y: number, label: string, value: string, isBoldVal = false) => {
        ctx.textAlign = "left";
        ctx.fillStyle = "#71717A";
        ctx.font = "bold 10px 'Inter', sans-serif";
        ctx.fillText(label.toUpperCase(), 35, y);

        ctx.textAlign = "right";
        ctx.fillStyle = "#1E4D3A";
        ctx.font = isBoldVal ? "bold 12px 'Inter', sans-serif" : "600 11px 'Inter', sans-serif";
        ctx.fillText(value, canvas.width - 35, y);
      };

      let yOffset = 395;
      drawDetailRow(yOffset, "Booking ID", b.id, true);
      yOffset += 30;
      drawDetailRow(yOffset, "Customer", b.name);
      yOffset += 30;
      const formattedDate = `Aug ${b.date}, 2026` + (b.slot ? ` (${b.slot})` : "");
      drawDetailRow(yOffset, "Date & Time", formattedDate);
      yOffset += 30;
      const pkgLabel = b.package === "dinein" ? "Dine-In" : b.package === "delivery" ? "Home Delivery" : "Celebration";
      drawDetailRow(yOffset, "Package", pkgLabel);
      yOffset += 30;
      const qtyLabel = `${b.qty} ` + (b.package === "delivery" ? "Sadhyas" : "Guests");
      drawDetailRow(yOffset, "Quantity", qtyLabel);

      // Another separator
      ctx.strokeStyle = "#D4D4D8";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(25, yOffset + 20);
      ctx.lineTo(canvas.width - 25, yOffset + 20);
      ctx.stroke();
      ctx.setLineDash([]);

      // Total Paid
      yOffset += 45;
      ctx.textAlign = "left";
      ctx.fillStyle = "#1E4D3A";
      ctx.font = "extrabold 12px 'Inter', sans-serif";
      ctx.fillText("TOTAL PAID", 35, yOffset);

      ctx.textAlign = "right";
      ctx.fillStyle = "#1E4D3A";
      ctx.font = "bold 20px 'Playfair Display', serif";
      ctx.fillText(`₹${b.total.toLocaleString("en-IN")}`, canvas.width - 35, yOffset);

      // Happy Onam greeting
      ctx.fillStyle = "#C89B3C";
      ctx.font = "bold italic 13px 'Playfair Display', serif";
      ctx.textAlign = "center";
      ctx.fillText("Happy Onam!", canvas.width / 2, canvas.height - 25);

      try {
        const link = document.createElement("a");
        link.download = `onam-sadhya-ticket-${b.id}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      } catch (err) {
        console.error("Failed to export ticket image:", err);
        alert("Failed to download ticket as image.");
      }
    };

    qrImg.onerror = () => {
      alert("Failed to load ticket QR Code. Please check your connection.");
    };
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
    
    // Persist check-in to Neon DB
    markBookingCheckedInFn({ data: { id: bookingId, checkedIn: true } }).catch(err => {
      console.error("Failed to check in booking to Neon:", err);
    });
    
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
              onClick={() => setActiveAdminTab("scanner")}
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

        {/* Desktop Navigation Tabs */}
        <div className="hidden md:flex items-center gap-2 bg-card/60 backdrop-blur border border-gold/10 p-1.5 rounded-2xl w-fit mt-6">
          <button
            onClick={() => setActiveAdminTab("dashboard")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
              activeAdminTab === "dashboard"
                ? "bg-primary text-ivory shadow-[var(--shadow-gold)]"
                : "text-primary/70 hover:bg-gold/5 cursor-pointer"
            }`}
          >
            <TrendingUp className="h-4 w-4" /> Overview Dashboard
          </button>
          <button
            onClick={() => setActiveAdminTab("bookings")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
              activeAdminTab === "bookings"
                ? "bg-primary text-ivory shadow-[var(--shadow-gold)]"
                : "text-primary/70 hover:bg-gold/5 cursor-pointer"
            }`}
          >
            <Users className="h-4 w-4" /> Bookings Ledger
          </button>
          <button
            onClick={() => setActiveAdminTab("scanner")}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
              activeAdminTab === "scanner"
                ? "bg-primary text-ivory shadow-[var(--shadow-gold)]"
                : "text-primary/70 hover:bg-gold/5 cursor-pointer"
            }`}
          >
            <QrCode className="h-4 w-4" /> Check-In Scanner
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeAdminTab === "dashboard" && (
          <div className="space-y-8 animate-fade-up mt-8">
            {/* Dashboard Stats */}
            <section className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="glass-card rounded-[24px] p-5 flex items-center justify-between col-span-2 md:col-span-1 shadow-md bg-card/40">
                <div>
                  <p className="text-[10px] md:text-xs font-display uppercase tracking-wider text-muted-foreground">Total Revenue</p>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold mt-1 text-primary">₹{stats.revenue.toLocaleString("en-IN")}</h3>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">From all confirmed packages</p>
                </div>
                <div className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-xl md:rounded-2xl bg-gold/10 text-gold">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6" />
                </div>
              </div>

              <div className="glass-card rounded-[24px] p-5 flex items-center justify-between col-span-1 shadow-md bg-card/40">
                <div>
                  <p className="text-[10px] md:text-xs font-display uppercase tracking-wider text-muted-foreground font-semibold">Today's Bookings</p>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold mt-1 text-primary">{stats.todayBookings}</h3>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">Submitted today</p>
                </div>
                <div className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-xl md:rounded-2xl bg-leaf/10 text-leaf">
                  <Clock className="h-5 w-5 md:h-6 md:w-6" />
                </div>
              </div>

              <div className="glass-card rounded-[24px] p-5 flex items-center justify-between col-span-1 shadow-md bg-card/40">
                <div>
                  <p className="text-[10px] md:text-xs font-display uppercase tracking-wider text-muted-foreground font-semibold">Total Reservations</p>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold mt-1 text-primary">{stats.totalBookings}</h3>
                  <p className="text-[9px] md:text-[10px] text-muted-foreground mt-1">Active bookings</p>
                </div>
                <div className="grid h-10 w-10 md:h-12 md:w-12 place-items-center rounded-xl md:rounded-2xl bg-maroon/10 text-maroon">
                  <Users className="h-5 w-5 md:h-6 md:w-6" />
                </div>
              </div>
            </section>

            {/* Capacity & overrides */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-5 space-y-6 w-full">
                <div className="glass-card rounded-[28px] p-6 border border-gold/10 bg-card/20">
                  <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-gold" /> Capacity overrides
                  </h2>
                  
                  {/* Select Date (August) */}
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

                  {/* Status Indicator */}
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

                  {/* Occupancy display */}
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

                  {/* Delivery & events info */}
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
              </div>
              
              <div className="lg:col-span-7 space-y-6 w-full">
                {/* Additional quick stats */}
                <div className="glass-card rounded-[28px] p-6 border border-gold/10 bg-card/20 space-y-6">
                  <h3 className="font-display text-lg font-semibold text-primary">Quick Settings & Insights</h3>
                  <div className="p-5 rounded-2xl bg-primary/5 border border-gold/10 space-y-4">
                    <p className="text-xs text-primary/80 font-medium leading-relaxed">
                      💡 To lock seats or stop reservations for specific days/hours, choose the date in the calendar and click the lock toggle next to that date or seating hour. Lock status syncs instantly to customers booking online.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-5 bg-card/30 rounded-2xl border border-gold/5 shadow-sm space-y-2">
                      <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground font-semibold">Today's Check-ins</p>
                      <p className="text-3xl font-black text-leaf font-display">
                        {bookings.filter(b => b.checkedIn && b.status === "confirmed").length}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-semibold">Completed entries scanned</p>
                    </div>
                    <div className="p-5 bg-card/30 rounded-2xl border border-gold/5 shadow-sm space-y-2">
                      <p className="text-[10px] font-display uppercase tracking-wider text-muted-foreground font-semibold">Remaining Entries</p>
                      <p className="text-3xl font-black text-gold font-display">
                        {bookings.filter(b => !b.checkedIn && b.status === "confirmed").reduce((sum, b) => sum + b.qty, 0)}
                      </p>
                      <p className="text-[9px] text-muted-foreground font-semibold">Pending gate arrivals</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Ledger Tab */}
        {activeAdminTab === "bookings" && (
          <section className="animate-fade-up w-full mt-8">
            <div className="glass-card rounded-[28px] p-6 border border-gold/10 bg-card/20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-display text-lg font-semibold text-primary">Bookings Management</h2>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Filter, search, or manually insert bookings</p>
                </div>
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
                        <td colSpan={activeBookingTab === "dinein" ? 9 : 8} className="py-8 text-center text-muted-foreground font-semibold">
                          No matching reservations found.
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="border-b border-gold/5 hover:bg-card/10 transition-colors">
                          <td className="py-3 px-2 font-bold text-primary font-display">{b.id}</td>
                          <td className="py-3 px-2">
                            <div className="font-semibold text-primary">{b.name}</div>
                            <div className="text-[10px] text-muted-foreground font-medium">{b.phone}</div>
                          </td>
                          <td className="py-3 px-2 font-medium text-primary">Aug {b.date}</td>
                          {activeBookingTab === "dinein" && <td className="py-3 px-2 font-semibold text-primary">{b.slot}</td>}
                          {activeBookingTab === "delivery" && (
                            <td className="py-3 px-2 max-w-[200px] truncate text-primary/80" title={b.address}>
                              {b.address}
                            </td>
                          )}
                          <td className="py-3 px-2 font-extrabold text-primary">{b.qty}</td>
                          <td className="py-3 px-2 font-bold text-primary">₹{b.total}</td>
                          <td className="py-3 px-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider border ${
                                b.status === "confirmed"
                                  ? b.checkedIn
                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                    : "bg-leaf/10 text-leaf border-leaf/20"
                                  : "bg-maroon/10 text-maroon border-maroon/20"
                              }`}
                            >
                              {b.status === "confirmed" ? (b.checkedIn ? "Checked In" : "Confirmed") : "Cancelled"}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right space-x-1.5">
                            <button
                              onClick={() => setSelectedBookingForQr(b)}
                              className="rounded-full bg-[#1E4D3A] text-white p-1.5 hover:bg-[#163a2c] hover:scale-105 active:scale-95 transition cursor-pointer inline-flex items-center justify-center"
                              title="Download/View ticket"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                            </button>
                            {b.status === "confirmed" ? (
                              <button
                                onClick={() => cancelBooking(b.id)}
                                className="rounded-full bg-maroon/10 text-maroon p-1.5 hover:bg-maroon/20 hover:scale-105 active:scale-95 transition cursor-pointer inline-flex items-center justify-center border border-maroon/20"
                                title="Cancel booking"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => confirmBooking(b.id)}
                                className="rounded-full bg-leaf/15 text-leaf p-1.5 hover:bg-leaf/25 hover:scale-105 active:scale-95 transition cursor-pointer inline-flex items-center justify-center border border-leaf/30"
                                title="Restore booking"
                              >
                                <Unlock className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3.5">
                {filteredBookings.length === 0 ? (
                  <p className="text-center py-6 text-muted-foreground font-semibold">No reservations found.</p>
                ) : (
                  filteredBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-4 bg-card rounded-2xl border border-gold/10 shadow-sm flex flex-col gap-2.5 bg-card/60"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-display font-black text-primary">{b.id}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[8.5px] font-extrabold uppercase tracking-wider border ${
                            b.status === "confirmed"
                              ? b.checkedIn
                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                : "bg-leaf/10 text-leaf border-leaf/20"
                              : "bg-maroon/10 text-maroon border-maroon/20"
                          }`}
                        >
                          {b.status === "confirmed" ? (b.checkedIn ? "Checked In" : "Confirmed") : "Cancelled"}
                        </span>
                      </div>
                      
                      <div className="text-xs space-y-1 text-primary">
                        <p><span className="text-muted-foreground font-medium">Customer:</span> <strong className="font-bold">{b.name}</strong></p>
                        <p><span className="text-muted-foreground font-medium">Phone:</span> {b.phone}</p>
                        <p><span className="text-muted-foreground font-medium">Date & Slot:</span> Aug {b.date} {b.slot ? ` - ${b.slot}` : ""}</p>
                        {b.address && <p className="leading-normal"><span className="text-muted-foreground font-medium">Address:</span> {b.address}</p>}
                        <p className="flex justify-between items-baseline pt-1.5 border-t border-gold/5 mt-1.5 font-bold">
                          <span>{b.qty} pax</span>
                          <span className="text-sm font-black text-primary">₹{b.total}</span>
                        </p>
                      </div>

                      <div className="flex justify-end gap-2.5 border-t border-gold/5 pt-2.5 mt-1 text-right">
                        <button
                          onClick={() => setSelectedBookingForQr(b)}
                          className="rounded-full bg-[#1E4D3A] text-white px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                        >
                          <QrCode className="h-3 w-3" /> View Ticket
                        </button>
                        {b.status === "confirmed" ? (
                          <button
                            onClick={() => cancelBooking(b.id)}
                            className="rounded-full bg-maroon/15 text-maroon px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            Cancel
                          </button>
                        ) : (
                          <button
                            onClick={() => confirmBooking(b.id)}
                            className="rounded-full bg-leaf/20 text-leaf px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        )}

        {/* Check-In Scanner Tab */}
        {activeAdminTab === "scanner" && (
          <section className="mt-8 max-w-lg mx-auto w-full animate-fade-up">
            <div className="glass-card rounded-[28px] p-6 border border-gold/10 flex flex-col items-center text-center bg-card/20">
              <h2 className="font-display text-lg font-semibold mb-1 flex items-center gap-2 justify-center text-primary">
                <QrCode className="h-5 w-5 text-gold" /> Check-In Ticket Scanner
              </h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-6">Point camera at entry pass QR code</p>

              {/* Live Camera Viewport */}
              <div className="relative w-full max-w-[280px] aspect-square bg-black rounded-[24px] overflow-hidden shadow-inner border border-gold/15 flex items-center justify-center">
                <div id="admin-scanner-view" className="w-full h-full object-cover" />
                <div className="absolute inset-8 border-2 border-dashed border-gold/40 rounded-2xl pointer-events-none flex items-center justify-center">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-gold absolute top-0 left-0" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-gold absolute top-0 right-0" />
                  <div className="w-4 h-4 border-b-2 border-l-2 border-gold absolute bottom-0 left-0" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-gold absolute bottom-0 right-0" />
                </div>
              </div>

              {/* Scan Results Display */}
              {scannerResult && (
                <div className="mt-6 w-full space-y-4 animate-scale-up">
                  {scannerResult.status === "success" && scannerResult.booking && (
                    <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-3 shadow-sm">
                      <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        Valid Ticket Verified
                      </div>
                      <div className="text-xs space-y-1.5 text-emerald-950 font-medium">
                        <p><span className="text-emerald-700/80">ID:</span> {scannerResult.booking.id}</p>
                        <p><span className="text-emerald-700/80">Name:</span> {scannerResult.booking.name}</p>
                        <p><span className="text-emerald-700/80">Phone:</span> {scannerResult.booking.phone}</p>
                        <p><span className="text-emerald-700/80">Package:</span> <span className="capitalize">{scannerResult.booking.package}</span></p>
                        <p><span className="text-emerald-700/80">Qty:</span> {scannerResult.booking.qty} Pax</p>
                      </div>
                      <button
                        onClick={() => markCheckedIn(scannerResult.booking!.id)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow transition cursor-pointer"
                      >
                        Confirm Check-In Entry
                      </button>
                    </div>
                  )}

                  {scannerResult.status === "duplicate" && scannerResult.booking && (
                    <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-3 shadow-sm">
                      <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Ticket Checked In Already
                      </div>
                      <p className="text-xs text-amber-900 leading-normal font-semibold">
                        This pass (ID: {scannerResult.booking.id}) has already been checked in.
                      </p>
                      <div className="text-xs space-y-1.5 text-amber-950 font-medium bg-white/40 p-3 rounded-lg border border-amber-100">
                        <p><span className="text-emerald-700/80">Customer:</span> {scannerResult.booking.name}</p>
                        <p><span className="text-emerald-700/80">Phone:</span> {scannerResult.booking.phone}</p>
                        <p><span className="text-emerald-700/80">Package:</span> <span className="capitalize">{scannerResult.booking.package}</span></p>
                      </div>
                      <button
                        onClick={() => {
                          setScannerResult(null);
                          startScanner();
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow transition cursor-pointer"
                      >
                        Scan Next Pass
                      </button>
                    </div>
                  )}

                  {scannerResult.status === "error" && (
                    <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-left space-y-3 shadow-sm">
                      <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                        <X className="h-5 w-5 text-red-600" />
                        Invalid QR Pass
                      </div>
                      <p className="text-xs text-red-900 leading-normal font-semibold">{scannerResult.message}</p>
                      <button
                        onClick={() => {
                          setScannerResult(null);
                          startScanner();
                        }}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow transition cursor-pointer"
                      >
                        Try Again
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Manual input lookup fallback if camera is slow */}
              {!scannerResult && (
                <div className="mt-8 pt-6 border-t border-gold/15 w-full">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mb-3">Or enter booking ID manually</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. OB-38810"
                      id="manual-checkin-id"
                      className="flex-1 rounded-xl border border-gold/20 bg-card px-4 py-2.5 text-xs text-primary focus:border-gold focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const val = (document.getElementById("manual-checkin-id") as HTMLInputElement)?.value?.trim()?.toUpperCase();
                        if (val) {
                          handleScanSuccess(JSON.stringify({ bookingId: val }));
                        }
                      }}
                      className="bg-primary text-white px-5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-primary/90 transition cursor-pointer"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Mobile Bottom Navigation (Native App Style) */}
        <nav className="fixed inset-x-0 bottom-0 z-40 bg-card/95 backdrop-blur border-t border-gold/10 pb-safe md:hidden flex justify-around py-3 shadow-lg">
          <button
            onClick={() => setActiveAdminTab("dashboard")}
            className={`flex flex-col items-center gap-1 transition cursor-pointer ${
              activeAdminTab === "dashboard" ? "text-gold font-bold" : "text-primary/60"
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveAdminTab("bookings")}
            className={`flex flex-col items-center gap-1 transition cursor-pointer ${
              activeAdminTab === "bookings" ? "text-gold font-bold" : "text-primary/60"
            }`}
          >
            <Users className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Bookings</span>
          </button>
          <button
            onClick={() => setActiveAdminTab("scanner")}
            className={`flex flex-col items-center gap-1 transition cursor-pointer ${
              activeAdminTab === "scanner" ? "text-gold font-bold" : "text-primary/60"
            }`}
          >
            <QrCode className="h-5 w-5" />
            <span className="text-[9px] uppercase tracking-wider font-semibold">Scanner</span>
          </button>
        </nav>
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
                  max={newBooking.package === "dinein" ? 200 : 600}
                  placeholder={`Enter quantity (Max ${newBooking.package === "dinein" ? 200 : 600})`}
                  value={newBooking.qty}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewBooking({ ...newBooking, qty: val === "" ? "" as any : parseInt(val) || 0 });
                  }}
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



      {/* View QR Code Overlay Modal */}
      {selectedBookingForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[360px] max-h-[90vh] overflow-y-auto scrollbar-thin bg-card rounded-[32px] border border-gold/20 shadow-2xl p-6 flex flex-col items-center text-center">
            {/* Top gold line */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-gold via-[#EAE6DF] to-gold" />
            
            <button
              onClick={() => setSelectedBookingForQr(null)}
              className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full bg-muted text-primary hover:bg-gold/10 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h3 className="mt-4 font-display text-lg font-semibold text-primary">Booking Entry Ticket</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5 mb-6">Customer QR Code</p>
            
            {/* QR Image */}
            <div className="relative w-44 h-44 bg-white border border-[#EAE6DF] rounded-2xl p-2 flex items-center justify-center shadow-sm">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  JSON.stringify({
                    bookingId: selectedBookingForQr.id,
                    token: selectedBookingForQr.token,
                  })
                )}`}
                alt="Entry Ticket QR"
                className="w-full h-full object-contain"
              />
            </div>
            
            <p className="mt-3 text-[9px] text-primary/70 font-semibold max-w-[200px] leading-normal mb-5">
              This QR code can be scanned at entry for verification.
            </p>
            
            {/* Booking Details */}
            <div className="w-full bg-[#FAF9F6] border border-[#EAE6DF] rounded-2xl p-4 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-gold/5 pb-1.5">
                <span className="text-muted-foreground">Booking ID</span>
                <span className="font-bold text-primary font-display">{selectedBookingForQr.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer</span>
                <span className="font-bold text-primary">{selectedBookingForQr.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-semibold text-primary">{selectedBookingForQr.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Package</span>
                <span className="font-bold text-primary capitalize">{selectedBookingForQr.package}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-bold text-primary font-display">Aug {selectedBookingForQr.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-bold text-primary">{selectedBookingForQr.qty} Pax</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                {selectedBookingForQr.checkedIn ? (
                  <span className="font-bold text-emerald-600 uppercase text-[9px] tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Checked In</span>
                ) : (
                  <span className="font-bold text-amber-600 uppercase text-[9px] tracking-wider bg-amber-50 px-2 py-0.5 rounded border border-amber-100">Pending Entry</span>
                )}
              </div>
            </div>
            <button
              onClick={() => handleDownloadTicket(selectedBookingForQr)}
              className="mt-6 w-full bg-[#1E4D3A] hover:bg-[#163a2c] text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md cursor-pointer"
            >
              Download Ticket
              <Download className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedBookingForQr(null)}
              className="mt-2.5 w-full bg-primary text-white py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition shadow-md cursor-pointer"
            >
              Close Ticket
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
