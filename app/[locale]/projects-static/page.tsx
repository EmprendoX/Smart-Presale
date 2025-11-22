import { Metadata } from "next";
import { ProjectExplorer } from "./ProjectExplorer";
import { projectsData } from "@/data/projects";

export const metadata: Metadata = {
  title: "Proyectos verificados",
  description: "Explora rondas verificadas con filtros rápidos y datos clave."
};

export default function ProjectsStaticPage({ params }: { params: { locale: string } }) {
  const { locale } = params;

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-primary)]">
          Rondas verificadas
        </p>
        <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Portafolio público</h1>
        <p className="text-sm text-[color:var(--text-muted)] max-w-2xl">
          Consulta proyectos con desarrolladores verificados, metas claras y depósitos publicados. Filtra por ubicación y rango de
          ticket para encontrar la ronda adecuada para ti.
        </p>
      </header>

      <ProjectExplorer projects={projectsData} locale={locale} />
    </div>
  );
}
