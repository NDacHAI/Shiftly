import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faHouse,
    faMagnifyingGlass,
} from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import { routes } from '@/constants/routes';

export function NotFoundPage() {
    const navigate = useNavigate();

    function goBack() {
        navigate(-1);
    }

    return (
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7faff] px-6 py-12">
            <div className="pointer-events-none absolute -top-32 -left-24 size-80 rounded-full bg-blue-200/45 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 -bottom-32 size-96 rounded-full bg-orange-100/70 blur-3xl" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.06)_1px,transparent_1px)] bg-[size:24px_24px]" />

            <section className="relative w-full max-w-3xl text-center">
                <Link
                    aria-label="Shiftly home"
                    className="mx-auto flex w-fit items-center gap-2"
                    to={routes.dashboard}
                >
                    <span
                        className="block h-14 w-[60px] shrink-0 bg-no-repeat"
                        style={{
                            backgroundImage: "url('/logo.png')",
                            backgroundPosition: '-29px -16px',
                            backgroundSize: '104px 104px',
                        }}
                    />
                    <strong className="text-3xl font-extrabold leading-none tracking-[-1.5px] text-[#0752a7]">
                        Shift<span className="text-[#ff9f16]">ly</span>
                    </strong>
                </Link>

                <div className="relative mx-auto mt-10 w-fit">
                    <span className="block bg-gradient-to-b from-[#1265c4] to-[#07458f] bg-clip-text text-[clamp(8rem,28vw,15rem)] font-black leading-[0.8] tracking-[-0.08em] text-transparent">
                        404
                    </span>
                    <span className="absolute top-1/2 left-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 rotate-6 items-center justify-center rounded-3xl bg-white text-2xl text-blue-600 shadow-[0_16px_40px_rgba(37,99,235,0.22)] sm:size-24 sm:text-3xl">
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                    </span>
                </div>

                <h1 className="mt-8 text-3xl font-extrabold tracking-[-0.8px] text-[#0d2045] sm:text-4xl">
                    Page not found
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-500 sm:text-base">
                    The page you are looking for may have been moved, deleted,
                    or the address might be incorrect.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 px-6 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-blue-800 focus:ring-4 focus:ring-blue-200 focus:outline-none"
                        to={routes.dashboard}
                    >
                        <FontAwesomeIcon icon={faHouse} />
                        Back to home
                    </Link>
                    <button
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:text-blue-600 focus:ring-4 focus:ring-blue-100 focus:outline-none"
                        type="button"
                        onClick={goBack}
                    >
                        <FontAwesomeIcon icon={faArrowLeft} />
                        Go back
                    </button>
                </div>
            </section>
        </main>
    );
}
