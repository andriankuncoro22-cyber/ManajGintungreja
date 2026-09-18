/**
 * @fileOverview Daftar kredensial internal untuk Portal Absensi.
 * Tersinkronisasi dengan variabel environment (.env).
 */

export const INTERNAL_USERS = [
  {
    username: "admingintungreja",
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || "admin@gintungreja.id",
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "gintungreja123",
    role: "admin_absensi",
    nama: "ADMINISTRATOR ABSENSI"
  }
];
