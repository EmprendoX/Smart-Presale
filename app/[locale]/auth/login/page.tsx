"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al iniciar sesión");
      }

      setSuccess(true);
      // Redirigir al dashboard después de iniciar sesión
      setTimeout(() => {
        const redirectUrl = new URLSearchParams(window.location.search).get("redirect") || "/dashboard";
        router.push(redirectUrl);
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error. Por favor intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <h1 className="text-2xl font-semibold text-[color:var(--text-strong)]">
            {t("login.title")}
          </h1>
          <p className="text-sm text-[color:var(--text-muted)] mt-2">
            {t("login.subtitle")}
          </p>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                <p className="text-sm text-green-800">
                  {t("login.successMessage")}
                </p>
                <p className="text-xs text-green-700 mt-2">
                  {t("login.checkEmail")}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  setSuccess(false);
                  setFormData({ fullName: "", email: "", phone: "" });
                }}
                className="w-full"
              >
                {t("login.sendAnother")}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t("login.fullName")}
                type="text"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder={t("login.fullNamePlaceholder")}
              />
              <Input
                label={t("login.email")}
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder={t("login.emailPlaceholder")}
              />
              <Input
                label={t("login.phone")}
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder={t("login.phonePlaceholder")}
              />
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? t("login.sending") : t("login.sendCode")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



