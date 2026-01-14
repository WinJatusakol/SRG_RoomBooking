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
  status: string | null;
};

const supabase = createClient();

function MyBookingsInner() {
  const searchParams = useSearchParams();
  const lineUserId = searchParams.get("line_user_id");
  const displayNameParam = searchParams.get("line_display_name") ?? "";

  const identifier = lineUserId;

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!lineUserId) {
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("booking")
        .select("*")
        .eq("line_user_id", lineUserId)
        .order("status", { ascending: true })
        .order("start_time", { ascending: true });
      if (queryError) {
        setError("โหลดข้อมูลการจองไม่สำเร็จ");
      } else {
        setBookings(data as Booking[]);
      }
      setLoading(false);
    };
    fetchBookings();
  }, [lineUserId]);

  const refreshBookings = async () => {
    if (!lineUserId) {
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await supabase
      .from("booking")
      .select("*")
      .eq("line_user_id", lineUserId)
      .order("status", { ascending: true })
      .order("start_time", { ascending: true });
    if (queryError) {
      setError("โหลดข้อมูลการจองไม่สำเร็จ");
    } else {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  };

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => !prev);
    setSelectedIds([]);
    setError(null);
    setSuccess(null);
  };

  const cancelSelectedBookings = async () => {
    if (selectedIds.length === 0) {
      return;
    }
    if (!lineUserId) {
      setError("ไม่พบ LINE ID ของผู้ใช้");
      return;
    }
    setError(null);
    setSuccess(null);
    setConfirming(true);
    const { data, error: updateError } = await supabase
      .from("booking")
      .update({ status: "cancelled" })
      .in("id", selectedIds)
      .eq("line_user_id", lineUserId)
      .select("id");
    if (updateError) {
      setError("ยกเลิกการจองไม่สำเร็จ");
    } else if (!data || data.length === 0) {
      setError("ไม่พบรายการที่จะยกเลิกหรือไม่มีสิทธิ์ยกเลิก");
    } else {
      setSuccess("ยกเลิกการจองเรียบร้อย");
      setSelectionMode(false);
      setSelectedIds([]);
      await refreshBookings();
    }
    setConfirming(false);
  };

  return (
    <div className="min-h-screen bg-[#003951] py-10 px-4 font-sans">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-xl bg-black p-6 shadow-sm">
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Sustain Republix"
            className="h-20 w-auto"
          />
        </div>
        <header className="flex flex-col gap-1 border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            การจองห้องของฉัน
          </h1>
          <p className="text-sm text-zinc-300">
            แสดงเฉพาะการจองที่ผูกกับ LINE ID ของคุณ
          </p>
        </header>
        {!identifier ? (
          <div className="rounded-lg border border-dashed border-zinc-700 p-4 text-sm text-zinc-300">
            กรุณาเข้าผ่านลิงก์จาก LINE หรือส่งพารามิเตอร์ผู้ใช้มาให้ถูกต้อง
          </div>
        ) : (
          <section className="flex flex-col gap-3 text-zinc-100">
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                <h2 className="text-lg font-semibold text-white">
                  รายการจองของ {displayNameParam || "ผู้ใช้ LINE"}
                </h2>
                <span className="text-xs text-zinc-400">
                  ถ้าเข้าผ่าน LINE LIFF ระบบจะใช้ LINE ID ของคุณในการค้นหาและยกเลิกการจอง
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={refreshBookings}
                  className="inline-flex items-center rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-900"
                >
                  รีเฟรช
                </button>
                <button
                  onClick={toggleSelectionMode}
                  className={
                    selectionMode
                      ? "inline-flex items-center rounded-md border border-red-500 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-300"
                      : "inline-flex items-center rounded-md border border-red-500 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950/40"
                  }
                >
                  {selectionMode ? "ยกเลิกโหมดเลือก" : "ยกเลิกการจอง"}
                </button>
                <button
                  onClick={cancelSelectedBookings}
                  disabled={!selectionMode || selectedIds.length === 0 || confirming}
                  className="inline-flex items-center rounded-md border border-red-500 bg-red-600 px-3 py-1.5 text-xs font-medium text-zinc-50 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {confirming
                    ? "กำลังยกเลิก..."
                    : `ยืนยันยกเลิก (${selectedIds.length})`}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            {success && (
              <p className="text-sm text-emerald-400">
                {success}
              </p>
            )}
            {loading ? (
              <div className="text-sm text-zinc-300">
                กำลังโหลด...
              </div>
            ) : bookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-700 p-4 text-sm text-zinc-300">
                ยังไม่มีการจองสำหรับผู้ใช้นี้
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="min-w-full text-left text-sm text-zinc-100">
                  <thead className="bg-zinc-900 text-xs font-medium uppercase text-zinc-400">
                    <tr>
                      <th className="px-3 py-2 text-center">
                        {selectionMode ? "เลือก" : ""}
                      </th>
                      <th className="px-3 py-2">ห้อง</th>
                      <th className="px-3 py-2">เริ่ม</th>
                      <th className="px-3 py-2">สิ้นสุด</th>
                      <th className="px-3 py-2">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b) => (
                      <tr
                        key={b.id}
                        className="border-t border-zinc-800 text-xs text-zinc-100"
                      >
                        <td className="px-3 py-2 text-center">
                          {selectionMode && b.status !== "cancelled" && (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(b.id)}
                              onChange={() => toggleSelection(b.id)}
                              className="h-4 w-4 cursor-pointer accent-red-500"
                            />
                          )}
                        </td>
                        <td className="px-3 py-2">{b.room_name}</td>
                        <td className="px-3 py-2">
                          {new Date(b.start_time).toLocaleString("th-TH", {
                            timeZone: "Asia/Bangkok",
                          })}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(b.end_time).toLocaleString("th-TH", {
                            timeZone: "Asia/Bangkok",
                          })}
                        </td>
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
        )}
      </main>
    </div>
  );
}

export default function MyBookingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#003951] py-10 px-4 font-sans" />}>
      <MyBookingsInner />
    </Suspense>
  );
}
