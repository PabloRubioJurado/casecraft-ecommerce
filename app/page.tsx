import Link from 'next/link';
import CaseArt from '../components/CaseArt';
import { CATEGORIES } from '../lib/categories';

const HERO_CASES = [
  { kind: 'rugged', seed: 1, pos: 'left-0 top-[14%] z-10 -rotate-6' },
  { kind: 'magsafe', seed: 0, pos: 'left-[23%] top-[4%] z-20 -rotate-2' },
  { kind: 'clear', seed: 2, pos: 'left-[46%] top-[12%] z-30 rotate-3' },
  { kind: 'leather', seed: 0, pos: 'left-[69%] top-[2%] z-20 rotate-6' },
] as const;

export default function Home() {
  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-8 sm:gap-10 sm:pb-14 sm:pt-10 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
        <div>
          <h1 className="font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl sm:leading-[1.05]">
            A case for every way you carry your phone.
          </h1>
          <p className="mt-4 max-w-md text-base text-muted sm:mt-5 sm:text-lg">
            Clear, magnetic, rugged, eco-friendly and leather cases. Pick the material, keep your phone in one piece.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
            <Link
              href="/products"
              className="rounded-full bg-cobalt px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-cobalt-dark sm:px-6 sm:py-3 sm:text-base"
            >
              Shop all cases
            </Link>
            <Link
              href="/login"
              className="rounded-full px-5 py-2.5 text-sm font-semibold transition hover:bg-white sm:py-3 sm:text-base"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="relative h-[240px] w-full overflow-hidden sm:h-[440px] sm:overflow-visible" aria-hidden="true">
          {HERO_CASES.map((c) => (
            <div
              key={c.kind}
              className={`absolute w-[28%] drop-shadow-[0_18px_22px_rgba(20,24,31,0.22)] sm:w-[30%] ${c.pos}`}
            >
              <CaseArt kind={c.kind} seed={c.seed} className="aspect-[1/2] w-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Shop by material</h2>
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 md:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c, i) => (
            <Link
              key={c.key}
              href={`/products?category=${encodeURIComponent(c.name)}`}
              className={`group flex flex-col overflow-hidden rounded-2xl ring-1 ring-line transition hover:ring-ink/30 ${
                i === CATEGORIES.length - 1 ? 'col-span-2 md:col-span-1' : ''
              }`}
              style={{ background: c.tint }}
            >
              <div className="flex h-36 items-center justify-center py-3 sm:h-44 sm:py-4">
                <CaseArt
                  kind={c.key}
                  seed={i}
                  className="aspect-[1/2] h-full transition-transform duration-300 group-hover:-translate-y-1"
                />
              </div>
              <div className="flex-1 bg-white p-3 sm:p-4">
                <h3 className="font-display text-sm font-bold leading-snug sm:text-base">{c.name}</h3>
                <p className="mt-1 text-xs text-muted sm:text-sm">{c.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
