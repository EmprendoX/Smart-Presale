"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { projectsData } from "@/data/projects";
import { fmtCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Progress } from "@/components/ui/Progress";
import { Link } from "@/i18n/routing";
import { BarChart } from "@/components/charts/BarChart";
import { useEventLog } from "@/frontend/src/utils/event-log";

const buyerOriginsSeed = [
  { label: "CDMX", value: 24, color: "#0ea5e9" },
  { label: "Jalisco", value: 16, color: "#f97316" },
  { label: "Nuevo León", value: 12, color: "#22c55e" },
  { label: "USA", value: 9, color: "#6366f1" },
  { label: "Otros", value: 6, color: "#64748b" }
];

const reservationSeed = [12, 18, 26, 21, 19, 24, 28];

export default function DeveloperPanelPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { events: adminEvents } = useEventLog({ audience: "admin" });

  const developerOptions = useMemo(() => {
    const byId = new Map<string, string>();
    projectsData.forEach(project => {
      byId.set(project.developerId, project.developer);
    });
    return Array.from(byId.entries()).map(([id, name]) => ({ id, name }));
  }, []);

  const selectedDeveloperId = useMemo(() => {
    const fromParams = searchParams.get("developer_id");
    if (fromParams && developerOptions.some(dev => dev.id === fromParams)) return fromParams;
    return developerOptions[0]?.id ?? "dev-01";
  }, [developerOptions, searchParams]);

  const filteredProjects = useMemo(
    () => projectsData.filter(project => project.developerId === selectedDeveloperId),
    [selectedDeveloperId]
  );

  const totals = useMemo(() => {
    const goal = filteredProjects.reduce((acc, project) => acc + project.goal, 0);
    const raised = filteredProjects.reduce((acc, project) => acc + project.raised, 0);
    const progress = goal === 0 ? 0 : Math.round((raised / goal) * 100);
    return { goal, raised, progress };
  }, [filteredProjects]);

  const reservationsByDay = useMemo(() => {
    const today = new Date();
    return reservationSeed.map((value, idx) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (reservationSeed.length - idx - 1));
      return {
        label: day.toLocaleDateString(locale === "en" ? "en-US" : "es-MX", { weekday: "short", day: "numeric" }),
        value
      };
    });
  }, [locale]);

  const recentEvents = useMemo(() => adminEvents.slice(0, 8), [adminEvents]);

  const handleDeveloperChange = (developerId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("developer_id", developerId);
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleExportCsv = () => {
    const header = "project_id,name,developer_id,goal,raised,deposit,currency";
    const rows = filteredProjects.map(project =>
      [
        project.id,
        project.name,
        project.developerId,
        project.goal,
        project.raised,
        project.deposit,
        project.currency
      ].join(",")
    );
    const payload = [header, ...rows].join("\n");
    const blob = new Blob([payload], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `developer-${selectedDeveloperId}-resumen.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-primary)]">Panel</p>
          <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Control de desarrollador</h1>
          <p className="text-sm text-[color:var(--text-muted)] max-w-2xl">
            Revisa el desempeño de tus proyectos publicados. Los datos se filtran por tu identificador de desarrollador
            y muestran KPIs simulados para pruebas en el entorno de preventa.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[color:var(--text-muted)]">Desarrollador</span>
            <Select
              value={selectedDeveloperId}
              onChange={event => handleDeveloperChange(event.target.value)}
              aria-label="Selecciona desarrollador"
            >
              {developerOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </div>
          <Button asChild variant="secondary" className="self-start sm:self-end">
            <Link href="/panel/desarrollador/onboarding">Onboarding de documentos</Link>
          </Button>
          <Button onClick={handleExportCsv} className="self-start sm:self-end">
            Exportar CSV simulado
          </Button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[color:var(--line)]">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Proyectos activos</p>
            <p className="text-3xl font-bold text-[color:var(--text-strong)]">{filteredProjects.length}</p>
            <p className="text-xs text-[color:var(--text-muted)]">Filtrados por tu developer_id</p>
          </CardContent>
        </Card>
        <Card className="border-[color:var(--line)]">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Capital recaudado</p>
            <p className="text-3xl font-bold text-[color:var(--text-strong)]">{fmtCurrency(totals.raised, "USD", locale)}</p>
            <p className="text-xs text-[color:var(--text-muted)]">
              Meta combinada: {fmtCurrency(totals.goal, "USD", locale)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-[color:var(--line)]">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between text-xs text-[color:var(--text-muted)]">
              <span>Avance ponderado</span>
              <span className="font-semibold text-[color:var(--text-strong)]">{totals.progress}%</span>
            </div>
            <Progress value={totals.progress} />
            <p className="text-xs text-[color:var(--text-muted)]">
              KPI simulado basado en objetivos y recaudación acumulada.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-[color:var(--line)] lg:col-span-2">
          <CardHeader className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Actividad</p>
            <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Reservas por día (simulado)</h2>
            <p className="text-sm text-[color:var(--text-muted)]">Serie mock para verificar visualización diaria.</p>
          </CardHeader>
          <CardContent>
            <BarChart data={reservationsByDay} orientation="vertical" />
          </CardContent>
        </Card>

        <Card className="border-[color:var(--line)]">
          <CardHeader className="flex flex-col gap-1">
            <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Origen</p>
            <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Compradores por estado</h2>
            <p className="text-sm text-[color:var(--text-muted)]">Datos semilla para pruebas de distribución.</p>
          </CardHeader>
          <CardContent>
            <BarChart data={buyerOriginsSeed} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-[color:var(--line)]">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Alertas</p>
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Bitácora de eventos locales</h2>
          <p className="text-sm text-[color:var(--text-muted)]">
            Registro temporal de hitos generados por las reservas almacenadas en el navegador.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentEvents.length === 0 ? (
            <p className="text-sm text-[color:var(--text-muted)]">Aún no hay eventos registrados.</p>
          ) : (
            recentEvents.map(event => (
              <div
                key={event.id}
                className="flex items-start justify-between rounded border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge color="neutral">{event.title}</Badge>
                    <span className="text-xs text-[color:var(--text-muted)]">
                      {new Date(event.timestamp).toLocaleString(locale === "en" ? "en-US" : "es-MX", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-[color:var(--text-strong)]">{event.description}</p>
                  <p className="text-xs text-[color:var(--text-muted)]">Ronda: {event.roundId}</p>
                </div>
                <span className="text-xs font-semibold uppercase text-[color:var(--brand-primary)]">{event.type}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-[color:var(--line)]">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Portafolio</p>
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Proyectos del desarrollador</h2>
          <p className="text-sm text-[color:var(--text-muted)]">Detalle rápido de cada ronda publicada en modo estático.</p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {filteredProjects.map(project => (
            <div key={project.id} className="rounded-lg border border-[color:var(--line)] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs uppercase text-[color:var(--text-muted)]">{project.city}, {project.country}</p>
                  <p className="text-base font-semibold text-[color:var(--text-strong)]">{project.name}</p>
                </div>
                {project.verifiedDeveloper && <Badge color="success">Verificado</Badge>}
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between text-[color:var(--text-muted)]">
                  <span>Meta</span>
                  <span className="font-semibold text-[color:var(--text-strong)]">{fmtCurrency(project.goal, project.currency, locale)}</span>
                </div>
                <div className="flex items-center justify-between text-[color:var(--text-muted)]">
                  <span>Recaudado</span>
                  <span className="font-semibold text-[color:var(--text-strong)]">{fmtCurrency(project.raised, project.currency, locale)}</span>
                </div>
                <Progress value={Math.round((project.raised / project.goal) * 100)} />
                <div className="flex items-center justify-between text-[color:var(--text-muted)]">
                  <span>Depósito mínimo</span>
                  <span className="font-semibold text-[color:var(--text-strong)]">{fmtCurrency(project.deposit, project.currency, locale)}</span>
                </div>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-2 rounded-lg border border-dashed border-[color:var(--line)] bg-neutral-50 p-6 text-center text-sm text-[color:var(--text-muted)]">
              No hay proyectos con este developer_id en los datos estáticos.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[color:var(--line)]">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Próximos pasos</p>
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Checklist operativo</h2>
          <p className="text-sm text-[color:var(--text-muted)]">Tareas de seguimiento sugeridas para tu equipo.</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {[
            {
              title: "Validar contratos",
              description: "Revisa borradores con el fiduciario antes del lanzamiento público."
            },
            {
              title: "Sincronizar calendario",
              description: "Confirma fechas de corte y actualiza la fecha límite en la ficha del proyecto."
            },
            {
              title: "Configurar avisos",
              description: "Activa notificaciones de umbral y recordatorios previos al cierre técnico."
            },
            {
              title: "Exportar reservas",
              description: "Descarga el CSV simulado y pruébalo en tu flujo de conciliación."
            }
          ].map(step => (
            <div key={step.title} className="rounded-lg border border-[color:var(--line)] bg-neutral-50 p-4">
              <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">{step.title}</h3>
              <p className="text-sm text-[color:var(--text-muted)]">{step.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
