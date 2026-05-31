import { DOC_SECTIONS } from "@/lib/docs-sections";
import { loadDocSource } from "@/lib/docs-source";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { DocsShell } from "@/components/docs/docs-shell";
import type { Metadata } from "next";
import "@/app/styles/docs.css";

export const metadata: Metadata = {
  title: "Documentation",
  description: "LazyCodex AI documentation — install, ultrawork mode, $ulw-loop, $ulw-plan, $start-work.",
  alternates: {
    canonical: "/docs",
  },
};

export default function DocsPage() {
  const sections = DOC_SECTIONS.map((s) => ({ id: s.id, title: s.title }));

  return (
    <>
      <a href="#content" className="skip-link">
        Skip to main content
      </a>
      <SiteHeader />
      <main id="content" className="docs-page">
        <div className="docs-hero">
          <h1 className="docs-hero-title">Documentation</h1>
          <p className="docs-hero-tagline">
            Learn how to install, configure, and use LazyCodex AI for ultrawork.
          </p>
        </div>
        <DocsShell sections={sections}>
          {DOC_SECTIONS.map((s) => (
            <section
              key={s.id}
              id={s.id}
              aria-labelledby={`${s.id}-title`}
              className="docs-section"
            >
              <h2 id={`${s.id}-title`} className="docs-section-title">
                {s.title}
              </h2>
              <article
                className="docs-content"
                dangerouslySetInnerHTML={{ __html: loadDocSource(s.file) }}
              />
            </section>
          ))}
        </DocsShell>
      </main>
      <SiteFooter />
    </>
  );
}
