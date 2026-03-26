"use client";

import { useTranslation } from "@/hooks/use-translation";
import { HeartPulse } from "lucide-react";
import { useEffect, useState } from "react";

export function Footer() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <footer id="contact" className="border-t bg-slate-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2 text-primary mb-4">
              <HeartPulse className="h-6 w-6" />
              <span className="font-bold text-xl tracking-tight">
                Hematología Clinic
              </span>
            </div>
            <p className="text-slate-500 max-w-sm mb-6">
              {t("footer.slogan")}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">{t("footer.links")}</h3>
            <ul className="space-y-3">
              <li><a href="#services" className="text-slate-600 hover:text-primary transition-colors">{t("navbar.services")}</a></li>
              <li><a href="#team" className="text-slate-600 hover:text-primary transition-colors">{t("navbar.team")}</a></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-slate-900 mb-4">{t("footer.contact")}</h3>
            <ul className="space-y-3 text-slate-600">
              <li>contacto@hematologiaclinic.com</li>
              <li>+54 11 1234 5678</li>
              <li>Av. Clínica Salud 123, BA</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
          <p>© {new Date().getFullYear()} {t("footer.rights")}</p>
          <div className="flex gap-4 mt-4 md:mt-0">
             <span>Terms</span>
             <span>Privacy</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
