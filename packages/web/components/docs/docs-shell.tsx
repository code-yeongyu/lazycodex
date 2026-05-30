"use client";

import { useState, useEffect, useRef } from "react";

interface Section {
  id: string;
  title: string;
}

interface DocsShellProps {
  sections: ReadonlyArray<Section>;
  children: React.ReactNode;
}

export function DocsShell({ sections, children }: DocsShellProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeId, setActiveId] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const filteredSections = sections.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        setActiveId(hash);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -80% 0px" }
    );

    const sectionElements = document.querySelectorAll(".docs-section h2[id]");
    for (const el of sectionElements) {
      observerRef.current.observe(el);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [sections]);

  return (
    <div className="docs-layout">
      <button
        type="button"
        className="docs-mobile-toggle"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-expanded={isMobileMenuOpen}
        aria-controls="docs-sidebar"
      >
        {isMobileMenuOpen ? "Close Menu" : "Menu"}
      </button>

      <aside
        id="docs-sidebar"
        className={`docs-sidebar ${isMobileMenuOpen ? "open" : ""}`}
      >
        <div className="docs-search">
          <label htmlFor="docs-search-input" className="sr-only">
            Search documentation
          </label>
          <input
            id="docs-search-input"
            type="search"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="docs-search-input"
          />
        </div>
        <nav aria-label="Documentation" className="docs-nav">
          <ul className="docs-nav-list">
            {filteredSections.map((s) => (
              <li key={s.id} className="docs-nav-item">
                <a
                  href={`#${s.id}`}
                  className={`docs-nav-link ${activeId === s.id ? "active" : ""}`}
                  aria-current={activeId === s.id ? "location" : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="docs-main-content">{children}</div>
    </div>
  );
}
