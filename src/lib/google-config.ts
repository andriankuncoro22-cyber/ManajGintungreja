/**
 * @fileOverview Konfigurasi terpusat untuk integrasi layanan Google.
 * Tersinkronisasi dengan variabel environment (.env).
 */

interface GoogleConfig {
  /**
   * URL hasil deploy Google Apps Script yang berfungsi sebagai backend.
   */
  appsScriptUrl: string;

  /**
   * ID Kalender Google yang akan digunakan untuk manajemen agenda.
   */
  calendarId: string;

  /**
   * ID folder "parent" di Google Drive tempat laporan-laporan baru akan disimpan.
   */
  parentFolderId: string;
}

export const GOOGLE_CONFIG: GoogleConfig = {
  // URL Deployment sesuai parameter backend user / .env
  appsScriptUrl: process.env.NEXT_PUBLIC_APPS_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbwtDubK3BwugET91KfaYvQE1E1LQnoZex4dlC2NCavxlYHSy-31vL3BHb_3a2KxhRAk/exec",
  calendarId: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || process.env.GOOGLE_CALENDAR_ID || "desagintungreja1991@gmail.com",
  parentFolderId: "1-yZW2Z7V5J2j2aVp9p4aJ3R8Q9J4v8tU",
};
