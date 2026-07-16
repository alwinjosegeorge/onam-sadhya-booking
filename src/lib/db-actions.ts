import { createServerFn } from "@tanstack/react-start";

// Interface matching the client-side Booking type
export interface DbBooking {
  id: string;
  name: string;
  phone: string;
  email?: string;
  package: "dinein" | "delivery" | "celebration";
  date: number; // day of August
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

// Database initialization check
let isDbInitialized = false;
async function ensureDb() {
  if (!isDbInitialized) {
    const { initDb } = await import("./db");
    await initDb();
    isDbInitialized = true;
  }
}

// Helper to map DB row object to clean DbBooking structure
function mapRowToBooking(row: any): DbBooking {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email || undefined,
    package: row.package as any,
    date: row.date,
    slot: row.slot || undefined,
    qty: row.qty,
    total: row.total,
    status: row.status as any,
    address: row.address || undefined,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    paymentId: row.payment_id || undefined,
    token: row.token,
    checkedIn: !!row.checked_in,
  };
}

// Fetch all bookings
export const getBookingsFn = createServerFn("GET", async () => {
  await ensureDb();
  const { sql } = await import("./db");
  try {
    const rows = await sql`SELECT * FROM onam_bookings ORDER BY created_at DESC`;
    return rows.map(mapRowToBooking);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return [];
  }
});

// Insert new booking
export const createBookingFn = createServerFn("POST", async (b: DbBooking) => {
  await ensureDb();
  const { sql } = await import("./db");
  try {
    await sql`
      INSERT INTO onam_bookings (
        id, name, phone, email, package, date, slot, qty, total, status, address, payment_id, token, checked_in
      ) VALUES (
        ${b.id}, ${b.name}, ${b.phone}, ${b.email || null}, ${b.package}, ${b.date}, ${b.slot || null}, ${b.qty}, ${b.total}, ${b.status}, ${b.address || null}, ${b.paymentId || null}, ${b.token}, ${b.checkedIn || false}
      )
    `;
    return { success: true };
  } catch (error) {
    console.error("Error inserting booking:", error);
    throw new Error("Failed to insert booking");
  }
});

// Update booking status
export const updateBookingStatusFn = createServerFn(
  "POST",
  async ({ id, status }: { id: string; status: "confirmed" | "cancelled" }) => {
    await ensureDb();
    const { sql } = await import("./db");
    try {
      await sql`UPDATE onam_bookings SET status = ${status} WHERE id = ${id}`;
      return { success: true };
    } catch (error) {
      console.error("Error updating booking status:", error);
      throw new Error("Failed to update status");
    }
  }
);

// Toggle / Mark check-in status
export const markBookingCheckedInFn = createServerFn(
  "POST",
  async ({ id, checkedIn }: { id: string; checkedIn: boolean }) => {
    await ensureDb();
    const { sql } = await import("./db");
    try {
      await sql`UPDATE onam_bookings SET checked_in = ${checkedIn} WHERE id = ${id}`;
      return { success: true };
    } catch (error) {
      console.error("Error toggling check-in status:", error);
      throw new Error("Failed to update check-in");
    }
  }
);

// Fetch settings (closed dates & closed slots)
export const getSettingsFn = createServerFn("GET", async () => {
  await ensureDb();
  const { sql } = await import("./db");
  try {
    const rows = await sql`SELECT * FROM onam_settings`;
    const settings: Record<string, string> = {};
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });

    const closedDates: number[] = JSON.parse(settings["closed_dates"] || "[]");
    const closedSlots: string[] = JSON.parse(settings["closed_slots"] || "[]");
    return { closedDates, closedSlots };
  } catch (error) {
    console.error("Error loading settings:", error);
    return { closedDates: [], closedSlots: [] };
  }
});

// Save settings (closed dates & closed slots)
export const saveSettingsFn = createServerFn(
  "POST",
  async ({ closedDates, closedSlots }: { closedDates: number[]; closedSlots: string[] }) => {
    await ensureDb();
    const { sql } = await import("./db");
    try {
      // Save closed dates
      await sql`
        INSERT INTO onam_settings (key, value) 
        VALUES ('closed_dates', ${JSON.stringify(closedDates)})
        ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(closedDates)}
      `;

      // Save closed slots
      await sql`
        INSERT INTO onam_settings (key, value) 
        VALUES ('closed_slots', ${JSON.stringify(closedSlots)})
        ON CONFLICT (key) DO UPDATE SET value = ${JSON.stringify(closedSlots)}
      `;

      return { success: true };
    } catch (error) {
      console.error("Error saving settings:", error);
      throw new Error("Failed to save settings");
    }
  }
);
