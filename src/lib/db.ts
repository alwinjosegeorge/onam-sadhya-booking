import postgres from "postgres";

const DATABASE_URL = 
  process.env.DATABASE_URL || 
  "postgresql://neondb_owner:npg_zblnHwWQj26J@ep-empty-tooth-azitpalq-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

// Initialize postgres client
export const sql = postgres(DATABASE_URL, {
  ssl: "require",
});

// Run initial migration to set up the tables
export async function initDb() {
  try {
    // Create bookings table
    await sql`
      CREATE TABLE IF NOT EXISTS onam_bookings (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        package VARCHAR(50) NOT NULL,
        date INTEGER NOT NULL,
        slot VARCHAR(50),
        qty INTEGER NOT NULL,
        total INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        address TEXT,
        payment_id VARCHAR(255),
        token VARCHAR(255) NOT NULL,
        checked_in BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // Create settings table for date/slot locks
    await sql`
      CREATE TABLE IF NOT EXISTS onam_settings (
        key VARCHAR(50) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `;
    
    console.log("Database initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize database:", error);
  }
}
