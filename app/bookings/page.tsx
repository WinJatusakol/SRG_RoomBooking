"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Booking = {
  id: number;
  room_name: string;
  start_time: string;
  end_time: string;
  user_name: string;
  member: number;
  status: string | null;
  create_time: string | null;
};

const supabase = createClient();

const ROOM_TYPES: { label: string; value: string }[] = [
  { label: "Meeting Room", value: "meeting" },
  { label: "Online Meeting", value: "online" },
  { label: "Live Room", value: "live" },
];

const ROOM_NAMES_BY_TYPE: Record<string, string[]> = {
  live: ["1", "2", "3"],
  meeting: ["A", "B", "C"],
  online: ["A", "B", "C"],
};

const ALL_ROOM_NAMES: string[] = ROOM_TYPES.flatMap((type) => {
  const codes = ROOM_NAMES_BY_TYPE[type.value] ?? [];
  return codes.map((code) => `${type.label} ${code}`);
});

function BookingsListInner() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      const { data, error: queryError } = await supabase
        .from("booking")
        .select("*")
        .eq("status", "booked")
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
      .eq("status", "booked")
      .order("start_time", { ascending: true });
    if (queryError) {
      setError("โหลดข้อมูลการจองไม่สำเร็จ");
    } else {
      setBookings(data as Booking[]);
    }
    setLoading(false);
  };

  const bookingsForSelectedDate = bookings.filter((b) => {
    if (!selectedDate) {
      return true;
    }
    const localDate = new Date(b.start_time).toLocaleDateString("en-CA", {
      timeZone: "Asia/Bangkok",
    });
    return localDate === selectedDate;
  });

  const roomNames = ALL_ROOM_NAMES;

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
            ดูสถานะการจองห้องประชุม
          </h1>
          <p className="text-sm text-zinc-300">
            แสดงรายการจองทั้งหมด สามารถรีเฟรชและ Export ข้อมูลเพื่อดูภาพรวมการใช้ห้องได้
          </p>
        </header>
        <section className="flex flex-col gap-3 text-zinc-100">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-white">
                ตารางการใช้ห้องประชุมตามวัน
              </h2>
              <span className="text-xs text-zinc-400">
                เลือกวันที่เพื่อดูว่าห้องแต่ละห้องถูกจองช่วงเวลาใดบ้าง
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={async (e) => {
                  setSelectedDate(e.target.value);
                  await refreshBookings();
                }}
                className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              />
              <button
                onClick={refreshBookings}
                className="inline-flex items-center rounded-md border border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-900"
              >
                รีเฟรช
              </button>
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}
          {loading ? (
            <div className="text-sm text-zinc-300">
              กำลังโหลด...
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-700 p-4 text-sm text-zinc-300">
              ยังไม่มีการจอง
            </div>
          ) : (
            <div className="grid gap-3">
              {roomNames.map((room) => {
                const roomBookings = bookingsForSelectedDate.filter(
                  (b) => b.room_name === room
                );
                return (
                  <div
                    key={room}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-white">
                        {room}
                      </h3>
                    </div>
                    {roomBookings.length === 0 ? (
                      <p className="text-xs text-zinc-400">
                        ว่างตลอดทั้งวัน
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {roomBookings.map((b) => {
                          const startLabel = new Date(
                            b.start_time
                          ).toLocaleTimeString("th-TH", {
                            timeZone: "Asia/Bangkok",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          });
                          const endLabel = new Date(
                            b.end_time
                          ).toLocaleTimeString("th-TH", {
                            timeZone: "Asia/Bangkok",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: false,
                          });
                          return (
                            <div
                              key={b.id}
                              className="flex flex-col gap-1 rounded-md bg-emerald-600 px-3 py-2 text-xs text-white sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {startLabel} - {endLabel}
                                </span>
                                <span className="text-[11px] text-emerald-100">
                                  {b.user_name || "ไม่ระบุชื่อ"} (
                                  {b.member} คน)
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
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
