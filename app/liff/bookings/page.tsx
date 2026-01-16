"use client";

import { useEffect } from "react";
import liff from "@line/liff";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function LiffBookingsPage() {
  useEffect(() => {
    const run = async () => {
      const liffId = process.env.NEXT_PUBLIC_LIFF_ID_BOOKINGS;

      if (!liffId) {
        return;
      }

      await liff.init({ liffId });

      if (!liff.isLoggedIn()) {
        liff.login();
        return;
      }

      const profile = await liff.getProfile();

      const { data: adminRow, error: adminError } = await supabase
        .from("booking_admins")
        .select("id")
        .eq("line_user_id", profile.userId)
        .eq("is_active", true)
        .maybeSingle();

      const params = new URLSearchParams();
      params.set("line_user_id", profile.userId);
      if (profile.displayName) {
        params.set("line_display_name", profile.displayName);
      }

      if (!adminError && adminRow) {
        window.location.href = `/bookings-admin?${params.toString()}`;
      } else {
        window.location.href = `/bookings?${params.toString()}`;
      }
    };

    run();
  }, []);

  return (
    <div className="min-h-screen bg-[#003951] py-10 px-4 font-sans">
      <main className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl bg-black p-6 shadow-sm">
        <div className="flex justify-center">
          <img
            src="/logo.png"
            alt="Sustain Republix"
            className="h-16 w-auto"
          />
        </div>
        <h1 className="text-xl font-semibold text-white">
          กำลังตรวจสอบสิทธิ์ผู้ใช้งาน
        </h1>
        <p className="text-sm text-zinc-300">
          กรุณารอสักครู่ ระบบกำลังตรวจสอบสิทธิ์จาก LINE เพื่อเปิดหน้าที่เหมาะสม
        </p>
      </main>
    </div>
  );
}

