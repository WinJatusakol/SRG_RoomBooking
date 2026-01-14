"use client";

import { useEffect, useState } from "react";
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

export default function CancelBookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [tel, setTel] = useState("");
  const [confirming, setConfirming] = useState(false);

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

  const startCancel = (id: number) => {
    setSelectedId(id);
    setTel("");
    setError(null);
    setSuccess(null);
  };

  const confirmCancel = async () => {
    if (!selectedId) {
      return;
    }

    const telNumber = Number(tel);

    if (!tel || Number.isNaN(telNumber) || telNumber <= 0) {
      setError("กรุณากรอกเบอร์โทรให้ถูกต้อง");
      return;
    }

    setConfirming(true);
    setError(null);
    setSuccess(null);

    const { data: booking, error: bookingError } = await supabase
      .from("booking")
      .select("id, tel, status")
      .eq("id", selectedId)
      .single();

    if (bookingError || !booking) {
      setError("ไม่พบข้อมูลการจอง");
      setConfirming(false);
      return;
    }

    if (booking.status === "cancelled") {
      setError("การจองนี้ถูกยกเลิกไปแล้ว");
      setConfirming(false);
      return;
    }

    if (booking.tel !== telNumber) {
      setError("เบอร์โทรไม่ตรงกับข้อมูลการจอง");
      setConfirming(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("booking")
      .update({ status: "cancelled" })
      .eq("id", selectedId)
      .eq("tel", telNumber);

    if (updateError) {
      setError("ยกเลิกการจองไม่สำเร็จ");
    } else {
      setSuccess("ยกเลิกการจองเรียบร้อย");
      setSelectedId(null);
      setTel("");

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

      refreshBookings();
    }

    setConfirming(false);
  };

  const selectedBooking = bookings.find((b) => b.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-[#003951] py-10 px-4 font-sans">
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-950">
        <header className="flex flex-col gap-1 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            ยกเลิกการจองห้องประชุม
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            เลือกการจองที่ต้องการยกเลิก จากนั้นกรอกเบอร์โทรที่ใช้จองเพื่อยืนยัน
          </p>
        </header>
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              รายการจองห้องทั้งหมด
            </h2>
            <button
              onClick={() => {
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

                refreshBookings();
              }}
              className="inline-flex items-center rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              รีเฟรช
            </button>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {success}
            </p>
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
                    <th className="px-3 py-2">สถานะ</th>
                    <th className="px-3 py-2"></th>
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
                      <td className="px-3 py-2 text-right">
                        {b.status !== "cancelled" && (
                          <button
                            onClick={() => startCancel(b.id)}
                            className="rounded-md border border-red-500 px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 dark:border-red-400 dark:text-red-300 dark:hover:bg-red-950/40"
                          >
                            ยกเลิก
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        {selectedBooking && (
          <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              ยกเลิกการจองห้อง {selectedBooking.room_name}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              กรุณากรอกเบอร์โทรที่ใช้ในการจอง เพื่อยืนยันการยกเลิก
            </p>
            <label className="text-sm text-zinc-700 dark:text-zinc-300">
              เบอร์โทรที่ใช้จอง
            </label>
            <input
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-0 focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={confirmCancel}
                disabled={confirming || !tel}
                className="mt-2 inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {confirming ? "กำลังยืนยัน..." : "ยืนยันการยกเลิก"}
              </button>
              <button
                onClick={() => {
                  setSelectedId(null);
                  setTel("");
                  setError(null);
                  setSuccess(null);
                }}
                className="mt-2 inline-flex items-center justify-center rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
              >
                ยกเลิกการทำรายการ
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
