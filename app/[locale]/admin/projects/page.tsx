"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Project, ProjectStatus } from "@/lib/types";
import { fmtCurrency } from "@/lib/format";

export default function AdminProjectsPage() {
  const t = useTranslations("admin");
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<ProjectStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listProjects();
      if (result.ok && result.data) {
        setProjects(result.data);
      } else {
        setError(result.error || "Error al cargar proyectos");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar proyectos");
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = filter === "all"
    ? projects
    : projects.filter(p => p.status === filter);

  if (loading) {
    return (
      <div className="container py-12">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-[color:var(--text-muted)]">{t("loading") || "Cargando..."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[color:var(--text-strong)]">
            {t("projects.title") || "Proyectos"}
          </h1>
          <p className="text-sm text-[color:var(--text-muted)] mt-2">
            {t("projects.subtitle") || "Administra todos los proyectos"}
          </p>
        </div>
        <Link href="/admin/projects/new">
          <Button variant="primary">
            {t("newProject")}
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          {t("filters.all")}
        </Button>
        <Button
          variant={filter === "draft" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setFilter("draft")}
        >
          {t("filters.draft")}
        </Button>
        <Button
          variant={filter === "review" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setFilter("review")}
        >
          {t("filters.review")}
        </Button>
        <Button
          variant={filter === "published" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setFilter("published")}
        >
          {t("filters.published")}
        </Button>
      </div>

      {/* Lista de proyectos */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-[color:var(--text-muted)]">
              {filter === "all" ? t("noProjects") : t("noProjectsFiltered", { status: filter })}
            </p>
            <Link href="/admin/projects/new">
              <Button variant="primary" className="mt-4">
                {t("newProject")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <Card key={project.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-[color:var(--text-strong)]">
                        {project.name}
                      </h3>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        project.status === "published" ? "bg-green-100 text-green-800" :
                        project.status === "review" ? "bg-yellow-100 text-yellow-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {t(`status.${project.status}`)}
                      </span>
                    </div>
                    <div className="text-sm text-[color:var(--text-muted)]">
                      {project.city}, {project.country} • {t(`listingType.${project.listingType}`)}
                    </div>
                    {project.askingPrice && (
                      <div className="text-sm font-medium text-[color:var(--text-strong)]">
                        {fmtCurrency(project.askingPrice, project.currency, "es")}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/projects/${project.slug}`}>
                      <Button variant="secondary" size="sm">
                        {t("view")}
                      </Button>
                    </Link>
                    <Link href={`/admin/projects/${project.slug}/edit`}>
                      <Button variant="primary" size="sm">
                        {t("edit")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

