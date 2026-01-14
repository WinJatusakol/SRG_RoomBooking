export default function Home() {
  return (
    <div className="min-h-screen bg-[#003951] py-10 px-4 font-sans">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-950">
        <header className="flex flex-col gap-1 border-b border-zinc-200 pb-4 dark:border-zinc-800">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            ระบบจองห้องประชุม
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            เลือกเมนูด้านล่างเพื่อจองห้อง ดูสถานะ หรือยกเลิกการจอง
          </p>
        </header>
        <section className="grid gap-4 md:grid-cols-2">
          <a
            href="/booking"
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              จองห้องประชุม
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              ฟอร์มสำหรับสร้างการจองใหม่ ระบุห้อง เวลา และผู้จอง
            </p>
          </a>
          <a
            href="/bookings"
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-500 dark:hover:bg-zinc-900"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
              ดูสถานะการจอง / ยกเลิก
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              ดูรายการจองทั้งหมดของทุกห้อง พร้อมปุ่มยกเลิกการจอง
            </p>
          </a>
        </section>
      </main>
    </div>
  );
}
