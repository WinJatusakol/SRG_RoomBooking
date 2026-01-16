"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type AttendeeForm = {
  fullName: string;
  position: string;
  department: string;
};

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
  const [food, setFood] = useState({
    break: false,
    breakfast: false,
    lunch: false,
    dinner: false,
  });
  const [tools, setTools] = useState({
    led: false,
    ledCount: "",
    notebook: false,
    notebookCount: "",
  });
  const [attendees, setAttendees] = useState<AttendeeForm[]>([
    { fullName: "", position: "", department: "" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const minDateTime = useMemo(() => {
    const now = new Date();
    now.setSeconds(0, 0);
    const minutes = now.getMinutes();
    if (minutes > 0 && minutes <= 30) {
      now.setMinutes(30);
    } else if (minutes > 30) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    }
    const pad = (value: number) => value.toString().padStart(2, "0");
    const year = now.getFullYear();
    const month = pad(now.getMonth() + 1);
    const day = pad(now.getDate());
    const hours = pad(now.getHours());
    const mins = pad(now.getMinutes());
    return `${year}-${month}-${day}T${hours}:${mins}`;
  }, []);

  useEffect(() => {
    setStartTime(minDateTime);
    setEndTime(minDateTime);
  }, [minDateTime]);

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

  const getDateParts = (value: string, fallback: string) => {
    const base = value || fallback;
    const date = base.slice(0, 10);
    const hour = base.slice(11, 13);
    const minute = base.slice(14, 16);
    return { date, hour, minute };
  };

  const updateStartTime = (partial: { date?: string; time?: string }) => {
    const current = getDateParts(startTime, minDateTime);
    const date = partial.date ?? current.date;
    let hour = current.hour;
    let minute = current.minute;
    if (partial.time) {
      hour = partial.time.slice(0, 2);
      minute = partial.time.slice(3, 5);
    }
    if (!date) {
      setStartTime("");
      return;
    }
    setStartTime(`${date}T${hour}:${minute}`);
  };

  const updateEndTime = (partial: { date?: string; time?: string }) => {
    const startParts = getDateParts(startTime, minDateTime);
    const current = getDateParts(endTime, minDateTime);
    const date = partial.date ?? startParts.date ?? current.date;
    let hour = current.hour;
    let minute = current.minute;
    if (partial.time) {
      hour = partial.time.slice(0, 2);
      minute = partial.time.slice(3, 5);
    }
    if (!date) {
      setEndTime("");
      return;
    }
    setEndTime(`${date}T${hour}:${minute}`);
  };

  const HALF_HOUR_TIMES = Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2)
      .toString()
      .padStart(2, "0");
    const minute = index % 2 === 0 ? "00" : "30";
    return `${hour}:${minute}`;
  });

  const minDateOnly = minDateTime.slice(0, 10);

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

    const isHalfHourStep = (value: string) => {
      const date = new Date(value);
      const mins = date.getMinutes();
      return mins === 0 || mins === 30;
    };

    if (!isHalfHourStep(startTime) || !isHalfHourStep(endTime)) {
      setError("กรุณาเลือกเวลาเป็นช่วงครึ่งชั่วโมง เช่น 11:00 หรือ 11:30");
      setSubmitting(false);
      return;
    }

    const now = new Date();
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    const startDateOnly = startDate.toISOString().slice(0, 10);
    const endDateOnly = endDate.toISOString().slice(0, 10);

    if (startDateOnly !== endDateOnly) {
      setError("ระบบรองรับการจองได้วันเดียวเท่านั้น");
      setSubmitting(false);
      return;
    }

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

    const foodPayload = {
      break: food.break,
      breakfast: food.breakfast,
      lunch: food.lunch,
      dinner: food.dinner,
    };

    const ledCountNumber = tools.led
      ? Number(tools.ledCount || "0")
      : 0;
    const notebookCountNumber = tools.notebook
      ? Number(tools.notebookCount || "0")
      : 0;

    if (tools.led && (Number.isNaN(ledCountNumber) || ledCountNumber <= 0)) {
      setError("กรุณากรอกจำนวนจอ LED ให้ถูกต้อง");
      setSubmitting(false);
      return;
    }

    if (
      tools.notebook &&
      (Number.isNaN(notebookCountNumber) || notebookCountNumber <= 0)
    ) {
      setError("กรุณากรอกจำนวน Notebook ให้ถูกต้อง");
      setSubmitting(false);
      return;
    }

    const toolsPayload = {
      led: ledCountNumber,
      notebook: notebookCountNumber,
    };

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

    const { data: inserted, error: insertError } = await supabase
      .from("booking")
      .insert({
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
        food: foodPayload,
        tools: toolsPayload,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setError("บันทึกการจองไม่สำเร็จ");
      setSubmitting(false);
      return;
    }

    const attendeesPayload = attendees
      .map((a) => ({
        booking_id: inserted.id,
        full_name: a.fullName.trim(),
        position: a.position.trim() || null,
        department: a.department.trim() || null,
      }))
      .filter((a) => a.full_name !== "");

    if (attendeesPayload.length > 0) {
      const { error: attendeesError } = await supabase
        .from("meeting_attendees")
        .insert(attendeesPayload);
      if (attendeesError) {
        setError("บันทึกผู้เข้าประชุมไม่สำเร็จ แต่ได้บันทึกการจองแล้ว");
        setSubmitting(false);
        return;
      }
    }

    setSuccess("บันทึกการจองเรียบร้อย");
    setRoomType("");
    setRoomCode("");
    setSubject("");
    setTel("");
    setMember("1");
    setStartTime("");
    setEndTime("");
    setFood({
      break: false,
      breakfast: false,
      lunch: false,
      dinner: false,
    });
    setTools({
      led: false,
      ledCount: "",
      notebook: false,
      notebookCount: "",
    });
    setAttendees([{ fullName: "", position: "", department: "" }]);

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
            กรอกข้อมูลการจองห้อง
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
                const count = Number(onlyDigits || "0");
                if (count <= 0) {
                  setAttendees([{ fullName: "", position: "", department: "" }]);
                  return;
                }
                setAttendees((prev) => {
                  if (count === prev.length) {
                    return prev;
                  }
                  if (count < prev.length) {
                    return prev.slice(0, count);
                  }
                  const extra = Array.from(
                    { length: count - prev.length },
                    () => ({ fullName: "", position: "", department: "" }),
                  );
                  return [...prev, ...extra];
                });
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              รายชื่อผู้เข้าประชุม
            </label>
            <p className="text-xs text-zinc-400">
              ช่องกรอกจะมีจำนวนเท่ากับจำนวนผู้เข้าประชุมด้านบน
            </p>
            <div className="mt-2 flex flex-col gap-3">
              {attendees.map((attendee, index) => (
                <div
                  key={index}
                  className="grid gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 p-3 md:grid-cols-3"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-400">
                      คนที่ {index + 1}
                    </span>
                    <input
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-50 outline-none ring-0 focus:border-zinc-400"
                      placeholder="ชื่อ-นามสกุล"
                      value={attendee.fullName}
                      onChange={(e) =>
                        setAttendees((prev) => {
                          const next = [...prev];
                          next[index] = {
                            ...next[index],
                            fullName: e.target.value,
                          };
                          return next;
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-400">
                      ตำแหน่ง
                    </span>
                    <input
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-50 outline-none ring-0 focus:border-zinc-400"
                      value={attendee.position}
                      onChange={(e) =>
                        setAttendees((prev) => {
                          const next = [...prev];
                          next[index] = {
                            ...next[index],
                            position: e.target.value,
                          };
                          return next;
                        })
                      }
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-zinc-400">
                      หน่วยงาน
                    </span>
                    <input
                      className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-50 outline-none ring-0 focus:border-zinc-400"
                      value={attendee.department}
                      onChange={(e) =>
                        setAttendees((prev) => {
                          const next = [...prev];
                          next[index] = {
                            ...next[index],
                            department: e.target.value,
                          };
                          return next;
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              อาหารที่ต้องการ
            </label>
            <div className="flex flex-wrap gap-3 text-sm text-zinc-100">
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-emerald-500"
                  checked={food.break}
                  onChange={(e) =>
                    setFood((prev) => ({ ...prev, break: e.target.checked }))
                  }
                />
                <span>Break</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-emerald-500"
                  checked={food.breakfast}
                  onChange={(e) =>
                    setFood((prev) => ({
                      ...prev,
                      breakfast: e.target.checked,
                    }))
                  }
                />
                <span>อาหารเช้า</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-emerald-500"
                  checked={food.lunch}
                  onChange={(e) =>
                    setFood((prev) => ({ ...prev, lunch: e.target.checked }))
                  }
                />
                <span>อาหารกลางวัน</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-emerald-500"
                  checked={food.dinner}
                  onChange={(e) =>
                    setFood((prev) => ({ ...prev, dinner: e.target.checked }))
                  }
                />
                <span>อาหารเย็น</span>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              อุปกรณ์ที่ต้องการ
            </label>
            <div className="flex flex-col gap-2 text-sm text-zinc-100">
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-emerald-500"
                    checked={tools.led}
                    onChange={(e) =>
                      setTools((prev) => ({
                        ...prev,
                        led: e.target.checked,
                        ledCount: e.target.checked ? prev.ledCount : "",
                      }))
                    }
                  />
                  <span>จอ LED</span>
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="จำนวน"
                  className="w-24 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-50 outline-none ring-0 focus:border-zinc-400 disabled:opacity-60"
                  value={tools.ledCount}
                  onChange={(e) =>
                    setTools((prev) => ({
                      ...prev,
                      ledCount: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  disabled={!tools.led}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="h-3.5 w-3.5 accent-emerald-500"
                    checked={tools.notebook}
                    onChange={(e) =>
                      setTools((prev) => ({
                        ...prev,
                        notebook: e.target.checked,
                        notebookCount: e.target.checked ? prev.notebookCount : "",
                      }))
                    }
                  />
                  <span>Notebook</span>
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="จำนวน"
                  className="w-24 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-50 outline-none ring-0 focus:border-zinc-400 disabled:opacity-60"
                  value={tools.notebookCount}
                  onChange={(e) =>
                    setTools((prev) => ({
                      ...prev,
                      notebookCount: e.target.value.replace(/\D/g, ""),
                    }))
                  }
                  disabled={!tools.notebook}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              วันที่ประชุม
            </label>
            <input
              type="date"
              min={minDateOnly}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={getDateParts(startTime, minDateTime).date}
              onChange={(e) => {
                const value = e.target.value;
                if (!value) {
                  setStartTime("");
                  setEndTime("");
                } else {
                  updateStartTime({ date: value });
                  updateEndTime({ date: value });
                }
              }}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              เวลาที่เริ่มประชุม
            </label>
            <select
              className="w-32 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={`${getDateParts(startTime, minDateTime).hour}:${getDateParts(
                startTime,
                minDateTime,
              ).minute === "30" ? "30" : "00"}`}
              onChange={(e) => updateStartTime({ time: e.target.value })}
            >
              {HALF_HOUR_TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-zinc-100">
              เวลาสิ้นสุดประชุม
            </label>
            <select
              className="w-32 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-2 text-sm text-zinc-50 outline-none ring-0 focus:border-zinc-400"
              value={`${getDateParts(endTime, minDateTime).hour}:${getDateParts(
                endTime,
                minDateTime,
              ).minute === "30" ? "30" : "00"}`}
              onChange={(e) => updateEndTime({ time: e.target.value })}
            >
              {HALF_HOUR_TIMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
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
