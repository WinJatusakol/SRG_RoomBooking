"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

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

type FoodInfo = {
  break: boolean;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
} | null;

type ToolsInfo = {
  led: number;
  notebook: number;
} | null;

type Attendee = {
  id: number;
  booking_id: number;
  full_name: string | null;
  position: string | null;
  department: string | null;
};

type BookingWithAttendees = Booking & {
  food: FoodInfo;
  tools: ToolsInfo;
  attendees: Attendee[];
};

function BookingsAdminInner() {
  const searchParams = useSearchParams();
  const lineUserId = searchParams.get("line_user_id");
  const lineDisplayName = searchParams.get("line_display_name") ?? "";

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [bookings, setBookings] = useState<BookingWithAttendees[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] =
    useState<BookingWithAttendees | null>(null);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdminId, setNewAdminId] = useState("");
  const [newAdminName, setNewAdminName] = useState("");

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  });

  const filteredBookings = useMemo(() => {
    if (!selectedDate) {
      return bookings;
    }
    return bookings.filter((b) => {
      const localDate = new Date(b.start_time).toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      });
      return localDate === selectedDate;
    });
  }, [bookings, selectedDate]);

  useEffect(() => {
    if (isAdmin === false) {
      const params = new URLSearchParams();
      if (lineUserId) {
        params.set("line_user_id", lineUserId);
      }
      if (lineDisplayName) {
        params.set("line_display_name", lineDisplayName);
      }
      const target = params.toString()
        ? `/bookings?${params.toString()}`
        : "/bookings";
      if (typeof window !== "undefined") {
        if (error) {
          alert(error);
        } else {
          alert("คุณไม่มีสิทธิ์เข้าหน้าผู้ดูแลระบบ");
        }
        window.location.href = target;
      }
    }
  }, [isAdmin, lineUserId, lineDisplayName, error]);

  useEffect(() => {
    const checkAdminAndLoad = async () => {
      if (!lineUserId) {
        setIsAdmin(false);
        setError("ไม่พบข้อมูล LINE User ID");
        return;
      }

      setLoading(true);
      setError(null);

      const { data: adminRow, error: adminError } = await supabase
        .from("booking_admins")
        .select("*")
        .eq("line_user_id", lineUserId)
        .eq("is_active", true)
        .maybeSingle();

      if (adminError) {
        setIsAdmin(false);
        setError("ตรวจสอบสิทธิ์ผู้ดูแลไม่สำเร็จ");
        setLoading(false);
        return;
      }

      if (!adminRow) {
        setIsAdmin(false);
        setError("คุณไม่มีสิทธิ์เข้าหน้าผู้ดูแลระบบ");
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const { data: bookingRows, error: bookingError } = await supabase
        .from("booking")
        .select("*")
        .order("start_time", { ascending: true });

      if (bookingError) {
        setError("โหลดข้อมูลการจองไม่สำเร็จ");
        setLoading(false);
        return;
      }

      const bookingIds = (bookingRows ?? []).map((b) => b.id);

      let attendeesRows: Attendee[] = [];
      if (bookingIds.length > 0) {
        const { data: attendeesData, error: attendeesError } = await supabase
          .from("meeting_attendees")
          .select("*")
          .in("booking_id", bookingIds);
        if (attendeesError) {
          setError("โหลดรายชื่อผู้เข้าประชุมไม่สำเร็จ");
          setLoading(false);
          return;
        }
        attendeesRows = (attendeesData ?? []) as Attendee[];
      }

      const bookingsWithAttendees: BookingWithAttendees[] = (bookingRows ??
        []).map((b) => {
        const booking = b as Booking;
        return {
          id: booking.id,
          room_name: booking.room_name,
          start_time: booking.start_time,
          end_time: booking.end_time,
          user_name: booking.user_name,
          member: booking.member,
          status: booking.status,
          create_time: booking.create_time,
          food: (booking as { food?: FoodInfo }).food ?? null,
          tools: (booking as { tools?: ToolsInfo }).tools ?? null,
          attendees: attendeesRows.filter((a) => a.booking_id === booking.id),
        };
      });

      setBookings(bookingsWithAttendees);
      setLoading(false);
    };

    checkAdminAndLoad();
  }, [lineUserId]);

  const refreshBookings = async () => {
    if (!isAdmin) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    const { data: bookingRows, error: bookingError } = await supabase
      .from("booking")
      .select("*")
      .order("start_time", { ascending: true });

    if (bookingError) {
      setError("โหลดข้อมูลการจองไม่สำเร็จ");
      setLoading(false);
      return;
    }

    const bookingIds = (bookingRows ?? []).map((b) => b.id);

    let attendeesRows: Attendee[] = [];
    if (bookingIds.length > 0) {
      const { data: attendeesData, error: attendeesError } = await supabase
        .from("meeting_attendees")
        .select("*")
        .in("booking_id", bookingIds);
      if (attendeesError) {
        setError("โหลดรายชื่อผู้เข้าประชุมไม่สำเร็จ");
        setLoading(false);
        return;
      }
      attendeesRows = (attendeesData ?? []) as Attendee[];
    }

    const bookingsWithAttendees: BookingWithAttendees[] = (bookingRows ??
      []).map((b) => {
      const booking = b as Booking;
      return {
        id: booking.id,
        room_name: booking.room_name,
        start_time: booking.start_time,
        end_time: booking.end_time,
        user_name: booking.user_name,
        member: booking.member,
        status: booking.status,
        create_time: booking.create_time,
        food: (booking as { food?: FoodInfo }).food ?? null,
        tools: (booking as { tools?: ToolsInfo }).tools ?? null,
        attendees: attendeesRows.filter((a) => a.booking_id === booking.id),
      };
    });

    setBookings(bookingsWithAttendees);
    setLoading(false);
    setSuccess("รีเฟรชข้อมูลเรียบร้อย");
  };

  const handleExport = async () => {
    if (!isAdmin || bookings.length === 0) {
      return;
    }

    const header = [
      "ID",
      "ห้อง",
      "ผู้จอง",
      "เวลาเริ่ม (เวลาไทย)",
      "เวลาสิ้นสุด (เวลาไทย)",
      "เวลาที่กดจอง (เวลาไทย)",
      "จำนวนผู้เข้าประชุม",
      "สถานะ",
      "อาหาร (breakfast/lunch/dinner/break)",
      "อุปกรณ์ (LED/Notebook)",
      "ผู้เข้าประชุม",
    ];

    const rows = bookings.map((b) => {
      const startLabel = new Date(b.start_time).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      });
      const endLabel = new Date(b.end_time).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      });
      const createLabel = b.create_time
        ? new Date(b.create_time).toLocaleString("th-TH", {
            timeZone: "Asia/Bangkok",
          })
        : "";

      const foodLabel = b.food
        ? [
            b.food.breakfast ? "เช้า" : "",
            b.food.lunch ? "กลางวัน" : "",
            b.food.dinner ? "เย็น" : "",
            b.food.break ? "Break" : "",
          ]
            .filter(Boolean)
            .join(" / ")
        : "";

      const toolsLabel = b.tools
        ? [
            b.tools.led ? `LED ${b.tools.led} ชุด` : "",
            b.tools.notebook ? `Notebook ${b.tools.notebook} เครื่อง` : "",
          ]
            .filter(Boolean)
            .join(" / ")
        : "";

      const attendeesLabel =
        b.attendees.length === 0
          ? ""
          : b.attendees
              .map((a) => {
                const name = a.full_name ?? "";
                const position = a.position ? ` (${a.position})` : "";
                const dept = a.department ? ` - ${a.department}` : "";
                return `${name}${position}${dept}`;
              })
              .join(" | ");

      return [
        b.id ?? "",
        b.room_name ?? "",
        b.user_name ?? "",
        startLabel,
        endLabel,
        createLabel,
        b.member ?? "",
        b.status ?? "",
        foodLabel,
        toolsLabel,
        attendeesLabel,
      ];
    });

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
    link.download = `bookings-admin-${today}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    await supabase.from("export_logs").insert({
      line_user_id: lineUserId,
      line_display_name: lineDisplayName,
      source: "bookings_admin",
      exported_date: today,
    });

    setSuccess("Export ข้อมูลเรียบร้อย");
  };

  if (isAdmin === false) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#003951] py-10 px-4 font-sans">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-xl bg-black p-6 shadow-sm">
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Sustain Republix"
            className="h-20 w-auto"
          />
        </div>
        <header className="flex flex-col gap-1 border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            หน้าผู้ดูแลระบบการจองห้องประชุม
          </h1>
          <p className="text-sm text-zinc-300">
            สำหรับผู้ดูแลเท่านั้น สามารถดูรายละเอียดการจองทั้งหมดและ Export ข้อมูลได้
          </p>
        </header>
        <section className="flex flex-col gap-3 text-zinc-100">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-white">
                รายการจองทั้งหมด
              </h2>
              <span className="text-xs text-zinc-400">
                เลือกวันที่เพื่อกรองรายการ และคลิกปุ่มดูข้อมูลการประชุมเพื่อเปิดรายละเอียด
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
              <button
                onClick={handleExport}
                disabled={filteredBookings.length === 0}
                className="inline-flex items-center rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Export to Excel
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewAdminId("");
                  setNewAdminName("");
                  setShowAddAdmin(true);
                  setSuccess(null);
                  setError(null);
                }}
                className="inline-flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-900/60"
              >
                เพิ่มแอดมิน
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
          ) : filteredBookings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-700 p-4 text-sm text-zinc-300">
              ยังไม่มีการจอง
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredBookings.map((b) => {
                const startLabel = new Date(
                  b.start_time,
                ).toLocaleTimeString("th-TH", {
                  timeZone: "Asia/Bangkok",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                });
                const endLabel = new Date(
                  b.end_time,
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
                        {b.room_name} | {startLabel} - {endLabel}
                      </span>
                      <span className="text-[11px] text-emerald-100">
                        {b.user_name || "ไม่ระบุชื่อ"} ({b.member} คน)
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 sm:mt-0">
                      <span className="rounded-full bg-black/20 px-2 py-0.5 text-[10px]">
                        {b.status ?? "-"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(b)}
                        className="rounded-full bg-[#003951] px-3 py-1 text-[11px] font-medium text-white hover:bg-[#002b3b]"
                      >
                        ดูข้อมูลการประชุม
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 p-5 text-sm text-zinc-100">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">
                ข้อมูลการประชุม
              </h2>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-900"
              >
                ปิด
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">ห้อง</span>
                <span className="text-sm text-zinc-100">
                  {selectedBooking.room_name}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">ผู้จอง</span>
                <span className="text-sm text-zinc-100">
                  {selectedBooking.user_name || "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">
                  เวลาเริ่ม / เวลาสิ้นสุด (เวลาไทย)
                </span>
                <span className="text-sm text-zinc-100">
                  {new Date(selectedBooking.start_time).toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                  })}{" "}
                  -{" "}
                  {new Date(selectedBooking.end_time).toLocaleString("th-TH", {
                    timeZone: "Asia/Bangkok",
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">
                  เวลาที่กดจอง (เวลาไทย)
                </span>
                <span className="text-sm text-zinc-100">
                  {selectedBooking.create_time
                    ? new Date(
                        selectedBooking.create_time,
                      ).toLocaleString("th-TH", {
                        timeZone: "Asia/Bangkok",
                      })
                    : "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">
                  จำนวนผู้เข้าประชุม
                </span>
                <span className="text-sm text-zinc-100">
                  {selectedBooking.member} คน
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">สถานะ</span>
                <span className="text-sm text-zinc-100">
                  {selectedBooking.status ?? "-"}
                </span>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">
                  อาหารที่ต้องการ
                </span>
                <span className="text-sm text-zinc-100">
                  {selectedBooking.food
                    ? [
                        selectedBooking.food.breakfast && "อาหารเช้า",
                        selectedBooking.food.lunch && "อาหารกลางวัน",
                        selectedBooking.food.dinner && "อาหารเย็น",
                        selectedBooking.food.break && "Break",
                      ]
                        .filter(Boolean)
                        .join(" / ") || "-"
                    : "-"}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">
                  อุปกรณ์ที่ต้องการ
                </span>
                <span className="text-sm text-zinc-100">
                  {selectedBooking.tools
                    ? [
                        selectedBooking.tools.led
                          ? `LED ${selectedBooking.tools.led} ชุด`
                          : "",
                        selectedBooking.tools.notebook
                          ? `Notebook ${selectedBooking.tools.notebook} เครื่อง`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" / ") || "-"
                    : "-"}
                </span>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-xs text-zinc-400">
                รายชื่อผู้เข้าประชุม
              </span>
              {selectedBooking.attendees.length === 0 ? (
                <span className="text-sm text-zinc-200">-</span>
              ) : (
                <div className="flex flex-col gap-1">
                  {selectedBooking.attendees.map((a) => (
                    <div
                      key={a.id}
                      className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-2 text-xs md:grid-cols-3"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-zinc-400">
                          ชื่อ-นามสกุล
                        </span>
                        <span className="text-xs text-zinc-100">
                          {a.full_name || "-"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-zinc-400">
                          ตำแหน่ง
                        </span>
                        <span className="text-xs text-zinc-100">
                          {a.position || "-"}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[11px] text-zinc-400">
                          หน่วยงาน
                        </span>
                        <span className="text-xs text-zinc-100">
                          {a.department || "-"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showAddAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-950 p-5 text-sm text-zinc-100">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-white">
                เพิ่มแอดมินใหม่
              </h2>
              <button
                type="button"
                onClick={() => setShowAddAdmin(false)}
                className="rounded-md border border-zinc-700 px-2 py-1 text-xs text-zinc-100 hover:bg-zinc-900"
              >
                ปิด
              </button>
            </div>
            <div className="mb-2 text-xs text-zinc-400">
              กรอก LINE User ID (ค่าที่แสดงในหน้าแบบฟอร์มจองว่า &quot;ID ของคุณ&quot;)
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">
                  LINE User ID
                </span>
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 outline-none ring-0 focus:border-zinc-400"
                  placeholder="เช่น Uxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={newAdminId}
                  onChange={(e) => setNewAdminId(e.target.value.trim())}
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-zinc-400">
                  ชื่อสำหรับแสดง (ไม่บังคับ)
                </span>
                <input
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 outline-none ring-0 focus:border-zinc-400"
                  placeholder="เช่น ชื่อเล่นหรือชื่อจริงของแอดมิน"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  const id = newAdminId.trim();
                  if (!id) {
                    setError("กรุณากรอก LINE User ID");
                    return;
                  }
                  setLoading(true);
                  setError(null);
                  setSuccess(null);
                  const { error: insertError } = await supabase
                    .from("booking_admins")
                    .insert({
                      line_user_id: id,
                      display_name: newAdminName.trim() || null,
                      is_active: true,
                    });
                  setLoading(false);
                  if (insertError) {
                    setError("เพิ่มแอดมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
                    return;
                  }
                  setSuccess("เพิ่มแอดมินเรียบร้อย");
                  setShowAddAdmin(false);
                }}
                className="mt-2 inline-flex items-center justify-center rounded-md border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
              >
                เพิ่มแอดมิน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BookingsAdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#003951] py-10 px-4 font-sans" />}>
      <BookingsAdminInner />
    </Suspense>
  );
}
