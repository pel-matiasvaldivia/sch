"use client";

import { useTranslation } from "@/hooks/use-translation";
import { CopyPlus, Dna, Syringe, TestTube2 } from "lucide-react";
import { useEffect, useState } from "react";

export function ServicesSection() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const services = [
    {
      icon: TestTube2,
      title: t("services.lab.title"),
      desc: t("services.lab.desc"),
      color: "text-blue-500",
      bg: "bg-blue-100",
      border: "border-blue-200"
    },
    {
      icon: CopyPlus,
      title: t("services.consults.title"),
      desc: t("services.consults.desc"),
      color: "text-indigo-500",
      bg: "bg-indigo-100",
      border: "border-indigo-200"
    },
    {
      icon: Dna,
      title: t("services.onco.title"),
      desc: t("services.onco.desc"),
      color: "text-purple-500",
      bg: "bg-purple-100",
      border: "border-purple-200"
    },
    {
      icon: Syringe,
      title: t("services.transfusion.title"),
      desc: t("services.transfusion.desc"),
      color: "text-rose-500",
      bg: "bg-rose-100",
      border: "border-rose-200"
    },
  ];

  return (
    <section id="services" className="py-24 bg-white relative">
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl mb-4">
            {t("services.title")}
          </h2>
          <p className="text-lg text-slate-600">
            {t("services.description")}
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, idx) => (
            <div
              key={idx}
              className="flex flex-col relative group overflow-hidden rounded-3xl bg-slate-50 p-8 hover:bg-white hover:shadow-xl transition-all border border-transparent shadow-sm border-slate-100 duration-300"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl ${service.bg} ${service.color} mb-6 group-hover:scale-110 transition-transform`}
              >
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {service.desc}
              </p>
              
              <div className={`absolute -right-4 -bottom-4 h-24 w-24 rounded-full ${service.bg} opacity-20 group-hover:scale-150 transition-transform duration-500`}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
