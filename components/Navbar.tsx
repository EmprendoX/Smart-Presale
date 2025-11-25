"use client";

import { Link, usePathname, useRouter } from "@/i18n/routing";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";
import { useTenant } from "@/providers/TenantProvider";
import { useAuth } from "@/providers/AuthProvider";

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { tenant, settings } = useTenant();
  const { user, signOut } = useAuth();

  const brandName = tenant?.name ?? "Smart Pre-Sale";
  const brandLogo = settings?.logoUrl ?? settings?.darkLogoUrl ?? settings?.squareLogoUrl ?? null;
  
  // Hooks de next-intl (siempre deben llamarse, no condicionalmente)
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // Solo usar localStorage después de montar (cliente)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevenir loops infinitos en cambio de locale
  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    
    try {
      const savedLocale = localStorage.getItem("sps_locale");
      if (savedLocale && savedLocale !== locale && (savedLocale === "es" || savedLocale === "en")) {
        // Solo cambiar si el locale guardado es diferente y válido
        const currentPath = pathname || "/";
        const pathWithoutLocale = currentPath.replace(/^\/(es|en)/, "") || "/";
        router.replace(pathWithoutLocale, { locale: savedLocale });
      }
    } catch (error) {
      console.error("Error en cambio de locale:", error);
    }
  }, [mounted, locale, pathname, router]);

  const changeLanguage = (newLocale: string) => {
    if (typeof window !== "undefined" && (newLocale === "es" || newLocale === "en")) {
      try {
        localStorage.setItem("sps_locale", newLocale);
        const currentPath = pathname || "/";
        const pathWithoutLocale = currentPath.replace(/^\/(es|en)/, "") || "/";
        router.replace(pathWithoutLocale, { locale: newLocale });
      } catch (error) {
        console.error("Error cambiando idioma:", error);
      }
    }
  };

  return (
    <header className="border-b overflow-x-hidden">
      <div className="container flex items-center justify-between py-3 min-w-0">
        <div className="flex items-center gap-6 min-w-0 flex-shrink-0">
          <Link href="/" className="flex items-center gap-3 text-xl font-semibold text-brand flex-shrink-0">
            {brandLogo ? (
              <img src={brandLogo} alt={brandName} className="h-8 w-auto" />
            ) : (
              <span className="leading-none">{brandName}</span>
            )}
          </Link>
              <nav className="hidden md:flex items-center gap-4 text-sm flex-shrink-0">
                <Link href="/" className="hover:underline whitespace-nowrap">{t("projects")}</Link>
                <Link href="/community" className="hover:underline whitespace-nowrap">{t("communities")}</Link>
                <Link href="/p/how-it-works" className="hover:underline whitespace-nowrap">{t("howItWorks")}</Link>
                <Link href="/dashboard" className="hover:underline whitespace-nowrap">{t("myReservations")}</Link>
                <Link href="/admin" className="hover:underline whitespace-nowrap font-semibold text-[color:var(--brand-primary)]">{t("admin")}</Link>
              </nav>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
          <Select value={locale} onChange={e => changeLanguage(e.target.value)} aria-label={t("language")}>
            <option value="es">{t("spanish")}</option>
            <option value="en">{t("english")}</option>
          </Select>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-[color:var(--text-muted)] hidden sm:inline">
                {user.fullName || user.email}
              </span>
              <Button variant="secondary" onClick={() => signOut()}>
                {t("signOut") || "Salir"}
              </Button>
            </div>
          ) : (
            <Button variant="secondary" asChild>
              <Link href="/auth/login">{t("signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}


