"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

function BookingFormInner() {
  const searchParams = useSearchParams();
  const lineUserId = searchParams.get("line_user_id");
  const lineDisplayName = searchParams.get("line_display_name") ?? "";

  const [roomType, setRoomType] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [subject, setSubject] = useState("");
  const [tel, setTel] = useState<string>("");
  const [member, setMember] = useState<string>("1");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const pad = (value: number) => value.toString().padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const minutes = pad(now.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }, []);

  const availableRoomCodes = useMemo(() => {
    if (!roomType) {
      return [];
    }
    return ROOM_NAMES_BY_TYPE[roomType] ?? [];
  }, [roomType]);

  const selectedRoomLabel = useMemo(() => {
    if (!roomType || !roomCode) {
      return "";
    }
    const typeLabel =
      ROOM_TYPES.find((t) => t.value === roomType)?.label ?? roomType;
    return `${typeLabel} ${roomCode}`;
  }, [roomType, roomCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!lineUserId) {
      setError("กรุณาเปิดหน้านี้ผ่านลิงก์จาก LINE Official Account");
      setSubmitting(false);
      return;
    }

    if (!selectedRoomLabel) {
      setError("กรุณาเลือกประเภทห้องและชื่อห้อง");
      setSubmitting(false);
      return;
    }

    if (!startTime || !endTime) {
      setError("กรุณาเลือกเวลาเริ่มต้นและเวลาสิ้นสุด");
      setSubmitting(false);
      return;
    }

    const now = new Date();
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (startDate < now || endDate <= now) {
      setError("ไม่สามารถเลือกวันและเวลาที่ย้อนหลังได้");
      setSubmitting(false);
      return;
    }

    if (startDate >= endDate) {
      setError("เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด");
      setSubmitting(false);
      return;
    }

    const memberNumber = Number(member);
    if (!member || Number.isNaN(memberNumber) || memberNumber <= 0) {
      setError("กรุณากรอกจำนวนผู้เข้าประชุมให้ถูกต้อง");
      setSubmitting(false);
      return;
    }

    const telNumber = Number(tel);
    if (!tel || Number.isNaN(telNumber) || telNumber <= 0) {
      setError("กรุณากรอกเบอร์โทรให้ถูกต้อง");
      setSubmitting(false);
      return;
    }

    const toUtcIsoString = (value: string) => new Date(value).toISOString();

    const startTimeUtc = toUtcIsoString(startTime);
    const endTimeUtc = toUtcIsoString(endTime);
    const createTimeUtc = new Date().toISOString();

    const { data: conflicts, error: conflictError } = await supabase
      .from("booking")
      .select("id")
      .eq("room_name", selectedRoomLabel)
      .neq("status", "cancelled")
      .lt("start_time", endTimeUtc)
      .gt("end_time", startTimeUtc);

    if (conflictError) {
      setError("ตรวจสอบสถานะห้องไม่สำเร็จ");
      setSubmitting(false);
      return;
    }

    if (conflicts && conflicts.length > 0) {
      setError("ห้องนี้ไม่ว่างในช่วงเวลาที่เลือก");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("booking").insert({
      room_name: selectedRoomLabel,
      user_name: lineDisplayName || null,
      subject: subject,
      tel: telNumber,
      start_time: startTimeUtc,
      end_time: endTimeUtc,
      member: memberNumber,
      status: "booked",
      line_user_id: lineUserId,
      create_time: createTimeUtc,
    });

    if (insertError) {
      setError("บันทึกการจองไม่สำเร็จ");
    } else {
      setSuccess("บันทึกการจองเรียบร้อย");
      setRoomType("");
      setRoomCode("");
      setSubject("");
      setTel("");
      setMember("1");
      setStartTime("");
      setEndTime("");
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#003951] py-10 px-4 font-sans">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 rounded-xl bg-black p-6 shadow-sm">
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Sustain Republix"
            className="h-20 w-auto"
          />
        </div>
        <header className="flex flex-col gap-1 border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            จองห้องประชุม
          </h1>
          <p className="text-sm text-zinc-300">
            กรอกข้อมูลการจองห้อง แล้วระบบจะบันทึกลง Supabase
          </p>
        </header>
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-lg border border-zinc-800 p-4"
        >
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              ประเภทห้อง
            </label>
            <select
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={roomType}
              onChange={(e) => {
                setRoomType(e.target.value);
                setRoomCode("");
              }}
              required
            >
              <option value="">เลือกประเภทห้อง</option>
              {ROOM_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              ชื่อห้อง
            </label>
            <select
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              required
              disabled={!roomType}
            >
              <option value="">
                {roomType ? "เลือกชื่อห้อง" : "กรุณาเลือกประเภทห้องก่อน"}
              </option>
              {availableRoomCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              ชื่อผู้จอง
            </label>
            <div className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50">
              {lineDisplayName || "กรุณาเข้าผ่านลิงก์จาก LINE"}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              หัวข้อเรื่อง
            </label>
            <input
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              เบอร์โทรผู้จอง
            </label>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={tel}
              onChange={(e) => setTel(e.target.value.replace(/\D/g, ""))}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              จำนวนผู้เข้าประชุม
            </label>
            <input
              type="number"
              min={1}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={member}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(/\D/g, "");
                setMember(onlyDigits);
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              เวลาเริ่มต้น
            </label>
            <input
              type="datetime-local"
              min={minDateTime}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              เวลาสิ้นสุด
            </label>
            <input
              type="datetime-local"
              min={minDateTime}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex items-center justify-center rounded-md border border-zinc-700 bg-[#003951] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#002b3b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "กำลังบันทึก..." : "บันทึกการจอง"}
          </button>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
          {success && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {success}
            </p>
          )}
        </form>
      </main>
    </div>
  );
}

export default function BookingFormPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#003951] py-10 px-4 font-sans" />}>
      <BookingFormInner />
    </Suspense>
  );
}
