export default function Home() {
  return (
    <div className="min-h-screen bg-[#003951] py-10 px-4 font-sans">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 rounded-xl bg-black p-6 shadow-sm">
        <header className="flex flex-col gap-1 border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            ระบบจองห้องประชุม
          </h1>
          <p className="text-sm text-zinc-300">
            เลือกเมนูด้านล่างเพื่อจองห้อง ดูสถานะ หรือยกเลิกการจอง
          </p>
        </header>
        <section className="grid gap-4 md:grid-cols-2 text-zinc-100">
          <a
            href="/booking"
            className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            <h2 className="text-base font-semibold text-white">
              จองห้องประชุม
            </h2>
            <p className="text-sm text-zinc-300">
              ฟอร์มสำหรับสร้างการจองใหม่ ระบุห้อง เวลา และผู้จอง
            </p>
          </a>
          <a
            href="/bookings"
            className="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            <h2 className="text-base font-semibold text-white">
              ดูสถานะการจอง / ยกเลิก
            </h2>
            <p className="text-sm text-zinc-300">
              ดูรายการจองทั้งหมดของทุกห้อง พร้อมปุ่มยกเลิกการจอง
            </p>
          </a>
        </section>
      </main>
    </div>
  );
}
