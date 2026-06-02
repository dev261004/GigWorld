import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <main className="flex min-h-screen items-center justify-center bg-[#f7fafc] px-4 py-10 text-slate-950">
    <section className="w-full max-w-3xl px-6 py-12 text-center sm:px-10 sm:py-16">
      <img
        src="/gigworld-mark-transparent.png"
        alt="GigWorld"
        className="mx-auto h-28 w-40 object-contain sm:h-32 sm:w-48"
      />

      <h1 className="mt-8 text-5xl font-black leading-none text-slate-950 sm:text-7xl">
        404 Not Found
      </h1>

      <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
        The page may have moved, expired, or never existed. GigWorld can still get you back to fresh opportunities,
        saved applications, and the tools you use to apply faster.
      </p>

      <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          to="/work"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/25 transition hover:-translate-y-0.5 hover:bg-blue-500"
        >
          Browse gigs
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-white px-6 py-3 text-sm font-black text-blue-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50"
        >
          Contact support
        </Link>
      </div>
    </section>
  </main>
);

export default NotFoundPage;
