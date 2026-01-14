"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Booking = {
  id: number;
  room_name: string;
  start_time: string;
  end_time: string;
  user_name: string;
  member: number;
  status: string | null;
};

const supabase = createClient();

function BookingsListInner() {
  const searchParams = useSearchParams();
  const lineUserId = searchParams.get("line_user_id");
  const lineDisplayName = searchParams.get("line_display_name");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("booking")
        .select("*")
        .order("start_time", { ascending: true });
      if (queryError) {
        setError("โหลดข้อมูลการจองไม่สำเร็จ");
      } else {
        setBookings(data as Booking[]);
      }
      setLoading(false);
    };
    fetchBookings();
  }, []);

  const refreshBookings = async () => {
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("booking")
      .select("*")
      .order("start_time", { ascending: true });
    if (queryError) {
      setError("โหลดข้อมูลการจองไม่สำเร็จ");
    } else {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  };

  const handleExport = async () => {
    if (bookings.length === 0) {
      return;
    }

    const header = [
      "ห้อง",
      "ผู้จอง",
      "เวลาเริ่ม",
      "เวลาสิ้นสุด",
      "จำนวนผู้เข้าประชุม",
      "สถานะ",
    ];

    const rows = bookings.map((b) => [
      b.room_name ?? "",
      b.user_name ?? "",
      new Date(b.start_time).toLocaleString("th-TH"),
      new Date(b.end_time).toLocaleString("th-TH"),
      b.member ?? "",
      b.status ?? "",
    ]);

    const escapeCell = (value: string) =>
      `"${value.replace(/"/g, '""')}"`;

    const csvContent = [header, ...rows]
      .map((row) => row.map((cell) => escapeCell(String(cell))).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const today = new Date().toISOString().slice(0, 10);
    link.download = `bookings-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    await supabase.from("export_logs").insert({
      line_user_id: lineUserId,
      line_display_name: lineDisplayName,
      source: "bookings_page",
      exported_date: today,
    });
  };

  return (
    <div className="min-h-screen bg-[#003951] py-10 px-4 font-sans">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-950">
        <header className="flex flex-col gap-1 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            ดูสถานะการจองห้องประชุม
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            แสดงรายการจองทั้งหมด สามารถรีเฟรชและ Export ข้อมูลเพื่อดูภาพรวมการใช้ห้องได้
          </p>
        </header>
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              รายการจองห้องทั้งหมด
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={refreshBookings}
                className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                รีเฟรช
              </button>
              <button
                onClick={handleExport}
                disabled={bookings.length === 0}
                className="inline-flex items-center rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Export to Excel
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {loading ? (
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              กำลังโหลด...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              ยังไม่มีการจอง
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-100 text-xs font-medium uppercase text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                  <tr>
                    <th className="px-3 py-2">ห้อง</th>
                    <th className="px-3 py-2">ผู้จอง (ชื่อจาก LINE)</th>
                    <th className="px-3 py-2">เริ่ม</th>
                    <th className="px-3 py-2">สิ้นสุด</th>
                    <th className="px-3 py-2">จำนวนผู้เข้าประชุม</th>
                    <th className="px-3 py-2">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-t border-zinc-200 text-xs text-zinc-800 dark:border-zinc-800 dark:text-zinc-200"
                    >
                      <td className="px-3 py-2">{b.room_name}</td>
                      <td className="px-3 py-2">
                        {b.user_name || "—"}
                      </td>
                      <td className="px-3 py-2">
                        {new Date(b.start_time).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">
                        {new Date(b.end_time).toLocaleString()}
                      </td>
                      <td className="px-3 py-2">{b.member}</td>
                      <td className="px-3 py-2">
                        <span
                          className={
                            b.status === "cancelled"
                              ? "rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-900/40 dark:text-red-200"
                              : "rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                          }
                        >
                          {b.status ?? "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default function BookingsListPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#003951] py-10 px-4 font-sans" />}>
      <BookingsListInner />
    </Suspense>
  );
}
