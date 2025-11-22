'use client';

import { useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Link } from "@/i18n/routing";
import { fmtCurrency } from "@/lib/format";
import { ProjectShowcase } from "@/data/projects";

const PROJECT_IMAGE_PLACEHOLDER = "/images/project-placeholder.svg";

type Props = {
  projects: ProjectShowcase[];
  locale: string;
};

export function ProjectExplorer({ projects, locale }: Props) {
  const countries = useMemo(() => Array.from(new Set(projects.map(p => p.country))), [projects]);
  const cities = useMemo(() => Array.from(new Set(projects.map(p => p.city))), [projects]);
  const minTicket = useMemo(() => Math.min(...projects.map(p => p.minTicket)), [projects]);
  const maxTicket = useMemo(() => Math.max(...projects.map(p => p.maxTicket)), [projects]);

  const [country, setCountry] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [ticketRange, setTicketRange] = useState<{ min: number; max: number }>({ min: minTicket, max: maxTicket });

  const filtered = useMemo(() => {
    return projects.filter(project => {
      const matchesCountry = country ? project.country === country : true;
      const matchesCity = city ? project.city === city : true;
      const matchesTicket =
        project.minTicket <= ticketRange.max && project.maxTicket >= ticketRange.min;
      return matchesCountry && matchesCity && matchesTicket;
    });
  }, [projects, country, city, ticketRange]);

  const resetFilters = () => {
    setCountry("");
    setCity("");
    setTicketRange({ min: minTicket, max: maxTicket });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-[color:var(--line)] bg-[color:var(--bg-surface)] p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[color:var(--text-muted)]">País</label>
            <select
              value={country}
              onChange={e => setCountry(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {countries.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[color:var(--text-muted)]">Ciudad</label>
            <select
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-full rounded-lg border border-[color:var(--line)] bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {cities.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[color:var(--text-muted)]">Ticket mínimo</label>
            <Input
              type="number"
              value={ticketRange.min}
              min={minTicket}
              max={ticketRange.max}
              onChange={e => setTicketRange(prev => ({ ...prev, min: Number(e.target.value) }))}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[color:var(--text-muted)]">Ticket máximo</label>
            <Input
              type="number"
              value={ticketRange.max}
              min={ticketRange.min}
              max={maxTicket}
              onChange={e => setTicketRange(prev => ({ ...prev, max: Number(e.target.value) }))}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="secondary" onClick={resetFilters}>
            Limpiar filtros
          </Button>
          <p className="text-xs text-[color:var(--text-muted)]">{filtered.length} proyectos encontrados</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map(project => {
          const percent = Math.min(Math.round((project.raised / project.goal) * 100), 100);
          return (
            <Card key={project.id} className="group overflow-hidden rounded-2xl border border-[color:var(--line)] shadow-sm">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[color:var(--bg-soft)]">
                  <Image
                    src={project.gallery[0] || PROJECT_IMAGE_PLACEHOLDER}
                    alt={project.name}
                    fill
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">{project.name}</h3>
                      <p className="text-sm text-[color:var(--text-muted)]">
                        {project.city}, {project.country}
                      </p>
                    </div>
                    <Badge color="green">Desarrollador verificado</Badge>
                  </div>

                  <p className="text-sm text-[color:var(--text-muted)] line-clamp-2">{project.description}</p>

                  <div className="grid gap-2 text-xs text-[color:var(--text-muted)] sm:grid-cols-2">
                    <span>Meta: {fmtCurrency(project.goal, project.currency, locale)}</span>
                    <span>Depósito: {fmtCurrency(project.deposit, project.currency, locale)}</span>
                    <span>Ticket: {fmtCurrency(project.minTicket, project.currency, locale)} – {fmtCurrency(project.maxTicket, project.currency, locale)}</span>
                    <span>Regla: {project.rule === "todo-nada" ? "Todo o nada" : "Parcial"}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[color:var(--text-muted)]">
                      <span>Progreso</span>
                      <span>{percent}%</span>
                    </div>
                    <Progress value={percent} />
                    <div className="text-xs text-[color:var(--text-muted)]">
                      Aportado: {fmtCurrency(project.raised, project.currency, locale)} / {fmtCurrency(project.goal, project.currency, locale)}
                    </div>
                  </div>

                  <Link
                    href={`/projects-static/${project.slug}`}
                    className="inline-flex text-sm font-medium text-[color:var(--brand-primary)] hover:text-[color:var(--brand-primary-hover)] hover:underline"
                  >
                    Ver detalle
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
