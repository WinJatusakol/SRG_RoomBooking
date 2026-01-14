"use client";

import { useEffect } from "react";
import liff from "@line/liff";

export default function LiffBookingPage() {
  useEffect(() => {
    const run = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID_BOOKING;

      if (!liffId) {
        return;
      }

      await liff.init({ liffId });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();

      const params = new URLSearchParams();
      params.set("line_user_id", profile.userId);
      if (profile.displayName) {
        params.set("line_display_name", profile.displayName);
      }

      window.location.href = `/booking?${params.toString()}`;
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-[#003951] py-10 px-4 font-sans">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          กำลังโหลดข้อมูลจาก LINE
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          กรุณารอสักครู่ ระบบกำลังดึงข้อมูลผู้ใช้จาก LINE เพื่อนำไปใช้ในการจองห้อง
        </p>
      </main>
    </div>
  );
}
