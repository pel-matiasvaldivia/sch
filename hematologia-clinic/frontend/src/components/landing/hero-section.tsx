"use client";

import { useTranslation } from "@/hooks/use-translation";
import { ArrowRight, Activity, ShieldCheck, Microscope } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function HeroSection() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = [
    "/carousel/slide-1.png",
    "/carousel/slide-2.png",
    "/carousel/slide-3.png",
    "/carousel/slide-4.png",
  ];

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!mounted) {
    return <section className="w-full py-24 md:py-32 lg:py-40 animate-pulse bg-slate-50 min-h-[600px]"></section>;
  }

  return (
    <section className="relative overflow-hidden bg-slate-50">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-white">
        <div className="absolute top-[10%] left-[60%] w-[500px] h-[500px] rounded-full bg-blue-100/40 blur-3xl mix-blend-multiply opacity-70 animate-blob"></div>
        <div className="absolute top-[30%] right-[70%] w-[400px] h-[400px] rounded-full bg-indigo-100/40 blur-3xl mix-blend-multiply opacity-70 animate-blob animation-delay-2000"></div>
      </div>

      <div className="container px-4 mx-auto py-24 md:py-32 lg:py-40">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="flex flex-col justify-center space-y-8">
            <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 w-fit">
              <ShieldCheck className="mr-2 h-4 w-4" />
              {t("hero.trustText")}
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl xl:text-6xl text-slate-900 leading-[1.1]">
              {t("hero.title")}
            </h1>

            <p className="max-w-[600px] text-lg text-slate-600 md:text-xl leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-base font-semibold text-white shadow-lg shadow-blue-500/30 hover:bg-primary/90 transition-all hover:scale-105"
              >
                {t("hero.ctaPrimary")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a
                href="#services"
                className="inline-flex h-12 items-center justify-center rounded-full border-2 border-slate-200 bg-white px-8 text-base font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                {t("hero.ctaSecondary")}
              </a>
            </div>
            
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium text-slate-600">Urgencias 24/7</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <Microscope className="h-5 w-5" />
                </div>
                <div className="text-sm font-medium text-slate-600">Última Tecnología</div>
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl shadow-2xl bg-slate-900">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Hematology Clinic ${idx + 1}`}
                  className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                    idx === currentImageIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              {/* Carousel Indicators */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === currentImageIndex ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/75"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Card flotante de métricas */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-xl border border-slate-100 animate-bounce" style={{animationDuration: '3s'}}>
              <div className="flex items-center gap-4">
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">99.9%</div>
                  <div className="text-sm text-slate-500">Precisión diagnóstica</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
