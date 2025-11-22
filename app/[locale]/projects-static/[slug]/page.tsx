import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { fmtCurrency } from "@/lib/format";
import { projectsData } from "@/data/projects";
import { ReservationCheckout } from "@/frontend/src/components/ReservationCheckout";

export default function ProjectStaticDetail({ params }: { params: { slug: string; locale: string } }) {
  const project = projectsData.find(item => item.slug === params.slug);
  if (!project) return notFound();

  const percent = Math.min(Math.round((project.raised / project.goal) * 100), 100);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Badge color="green" className="uppercase tracking-wide">Desarrollador verificado</Badge>
        <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">{project.name}</h1>
        <p className="text-sm text-[color:var(--text-muted)]">
          {project.city}, {project.country} · {project.developer}
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {project.gallery.map(image => (
              <div key={image} className="relative aspect-video overflow-hidden rounded-2xl border border-[color:var(--line)]">
                <Image src={image} alt={project.name} fill className="object-cover" />
              </div>
            ))}
          </div>

          <Card className="border-[color:var(--line)]">
            <CardContent className="space-y-3 p-5">
              <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Video</h2>
              {project.videoUrl ? (
                <div className="aspect-video overflow-hidden rounded-xl border border-[color:var(--line)]">
                  <iframe
                    src={project.videoUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Video del proyecto"
                  />
                </div>
              ) : (
                <div className="flex aspect-video items-center justify-center rounded-xl border border-dashed border-[color:var(--line)] bg-[color:var(--bg-soft)] text-sm text-[color:var(--text-muted)]">
                  Video próximamente
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-[color:var(--line)]">
            <CardContent className="space-y-3 p-5">
              <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Documentos</h2>
              <ul className="space-y-2 text-sm text-[color:var(--brand-primary)]">
                {project.documents.map(doc => (
                  <li key={doc.url}>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="hover:underline">
                      {doc.title}
                    </a>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="border-[color:var(--line)]">
            <CardContent className="space-y-4 p-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-[color:var(--text-muted)] uppercase">Meta de ronda</p>
                <p className="text-2xl font-bold text-[color:var(--text-strong)]">
                  {fmtCurrency(project.goal, project.currency, params.locale)}
                </p>
                <p className="text-sm text-[color:var(--text-muted)]">Depósito mínimo: {fmtCurrency(project.deposit, project.currency, params.locale)}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-[color:var(--text-muted)]">
                  <span>Progreso publicado</span>
                  <span>{percent}%</span>
                </div>
                <Progress value={percent} />
                <p className="text-xs text-[color:var(--text-muted)]">
                  {fmtCurrency(project.raised, project.currency, params.locale)} / {fmtCurrency(project.goal, project.currency, params.locale)}
                </p>
              </div>

              <div className="rounded-xl bg-[color:var(--bg-soft)] p-3 text-sm text-[color:var(--text-strong)]">
                <p className="font-semibold">Fecha límite</p>
                <p className="text-[color:var(--text-muted)]">
                  {new Date(project.deadline).toLocaleDateString(params.locale === "en" ? "en-US" : "es-MX", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </p>
              </div>

              <div className="rounded-xl bg-[color:var(--bg-soft)] p-3 text-sm text-[color:var(--text-strong)]">
                <p className="font-semibold">Reglas de la ronda</p>
                <p className="text-[color:var(--text-muted)]">
                  {project.rule === "todo-nada"
                    ? "Todo o nada: se devuelven los depósitos si no se llega a la meta."
                    : "Parcial: se liberan fondos conforme se cumple cada hito del plan."}
                </p>
              </div>

              <div className="rounded-xl bg-[color:var(--brand-primary)] text-[color:var(--text-inverse)] p-4 space-y-1">
                <p className="text-sm font-semibold">Ticket sugerido</p>
                <p className="text-lg font-bold">
                  {fmtCurrency(project.minTicket, project.currency, params.locale)} – {fmtCurrency(project.maxTicket, project.currency, params.locale)}
                </p>
                <p className="text-xs opacity-90">Actualizado en tiempo real.</p>
              </div>
            </CardContent>
          </Card>

          <ReservationCheckout
            roundId={project.id}
            depositAmount={project.deposit}
            goal={project.goal}
            raised={project.raised}
            currency={project.currency}
            deadline={project.deadline}
            locale={params.locale}
            defaultSlots={1}
            rule={project.rule}
          />
        </aside>
      </div>
    </div>
  );
}
