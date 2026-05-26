import type { JSX } from "react"

/**
 * LazyCodex splash page.
 * Server Component only: no client state, no hydration JavaScript, CSS-only motion.
 */
export default function ComingSoonPage(): JSX.Element {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-12 md:px-8 md:py-16">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-[color:var(--card-base)] focus:px-3 focus:py-2 focus:text-sm focus:text-[color:var(--text-primary)]"
      >
        Skip to main content
      </a>

      {/* Top-left OmO branding */}
      <p className="splash-reveal absolute left-[clamp(16px,3vw,32px)] top-[clamp(16px,3vw,32px)] z-10 text-[13px] tracking-[-0.01em] text-[color:var(--text-tertiary)]">
        <span className="font-semibold text-[#D8D8F2]">OmO</span>{" "}
        <span>in Codex</span>
      </p>

      {/* Bottom-right / Bottom-center status text */}
      <p className="splash-reveal absolute bottom-[clamp(16px,3vw,32px)] right-[clamp(16px,3vw,32px)] z-10 text-center text-[12px] font-medium uppercase tracking-[0.18em] text-[color:var(--text-secondary)] md:text-right md:text-[13px]">
        Coming June 2026 ·{" "}
        <a
          href="https://github.com/code-yeongyu/oh-my-openagent"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-[color:var(--text-tertiary)] decoration-1 underline-offset-[3px] transition-colors duration-200 hover:text-[color:var(--text-primary)] hover:decoration-[color:var(--text-primary)]"
        >
          Currently on OpenCode
        </a>
      </p>

      {/* The Card */}
      <section
        id="content"
        className="splash-reveal relative isolate flex w-full max-w-[1200px] flex-col items-center justify-center overflow-hidden rounded-[16px] bg-[color:var(--card-base)] px-[20px] py-[60px] text-center shadow-[0_40px_120px_rgba(0,0,0,0.6)] md:px-[60px] md:py-[70px] lg:aspect-[1200/630]"
      >
        {/* Card Background Layers */}
        <div className="card-gradient-base absolute inset-0 -z-10" />
        <div className="card-gradient-pools absolute inset-0 -z-10" />
        <div className="card-gradient-sheen absolute -inset-[10%] -z-10" />
        <div className="card-gradient-beam absolute inset-0 -z-10" />
        <div className="card-grain absolute inset-0 -z-10" />

        {/* Card Content */}
        <div className="flex flex-col items-center justify-center gap-[30px]">
          <p className="font-mono text-[15px] font-medium uppercase tracking-[0.32em] text-[color:var(--text-soft)] opacity-90">
            CODEX FOR NO-BRAINERS
          </p>

          <h1 className="m-0 text-balance text-[clamp(64px,12vw,168px)] font-medium leading-[0.98] tracking-[-0.03em] text-[color:var(--text-primary)]">
            LazyCodex
          </h1>

          <div className="m-0 max-w-[960px] text-balance text-[clamp(20px,3vw,34px)] font-normal leading-[1.35] tracking-[-0.005em] text-[color:var(--text-muted)]">
            <p>You don't need to think.</p>
            <p>
              Just prompt with <strong className="font-medium text-[color:var(--text-primary)]">ultrawork</strong>.
            </p>
          </div>
        </div>

        <footer className="absolute bottom-[40px] left-0 right-0 text-center font-mono text-[22px] font-medium tracking-[0.02em] text-[color:var(--text-primary)] opacity-90 md:bottom-[56px]">
          lazycodex.ai
        </footer>
      </section>
    </main>
  )
}
