"use client";

import Link from "next/link";
import { useTranslation } from "@/hooks/use-translation";
import { Language } from "@/lib/i18n/dictionaries";
import { Globe, HeartPulse } from "lucide-react";
import { useState, useEffect } from "react";

export function Navbar() {
  const { t, language, setLanguage } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-primary">
          <HeartPulse className="h-8 w-8" />
          <span className="font-bold text-xl tracking-tight hidden sm:block">
            Hematología Clinic
          </span>
        </Link>

        {mounted ? (
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
              <a href="#services" className="hover:text-primary transition-colors">
                {t("navbar.services")}
              </a>
              <a href="#team" className="hover:text-primary transition-colors">
                {t("navbar.team")}
              </a>
              <a href="#contact" className="hover:text-primary transition-colors">
                {t("navbar.contact")}
              </a>
            </div>

            <div className="flex items-center gap-4">
              {/* Language Switcher */}
              <div className="relative group">
                <button className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary transition-colors p-2 rounded-md">
                  <Globe className="h-4 w-4" />
                  <span className="uppercase font-semibold">{language}</span>
                </button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white border shadow-lg rounded-md min-w-[120px] overflow-hidden py-1">
                  {(["es", "en", "pt"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-slate-50 ${
                        language === lang ? "text-primary font-bold bg-slate-50" : "text-slate-600"
                      }`}
                    >
                      {lang === "es" && "Español"}
                      {lang === "en" && "English"}
                      {lang === "pt" && "Português"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Login CTA */}
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white shadow hover:bg-primary/90 transition-colors"
              >
                {t("navbar.login")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="h-10 w-32 bg-slate-100 animate-pulse rounded"></div>
        )}
      </div>
    </nav>
  );
}
