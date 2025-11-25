"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Reservation, Project, Round } from "@/lib/types";
import { fmtCurrency, shortDate } from "@/lib/format";
import { db } from "@/lib/config";

export default function AdminReservationsPage() {
  const t = useTranslations("admin");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [projects, setProjects] = useState<Record<string, Project>>({});
  const [rounds, setRounds] = useState<Record<string, Round>>({});
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [reservationsResult, projectsList, roundsList] = await Promise.all([
        db.getReservations(),
        db.getProjects(),
        db.getRounds()
      ]);

      setReservations(reservationsResult);

      // Crear mapas para búsqueda rápida
      const projectsMap: Record<string, Project> = {};
      projectsList.forEach(p => {
        projectsMap[p.id] = p;
      });
      setProjects(projectsMap);

      const roundsMap: Record<string, Round> = {};
      roundsList.forEach(r => {
        roundsMap[r.id] = r;
        if (r.projectId) {
          roundsMap[r.projectId] = r; // También indexar por projectId para búsqueda rápida
        }
      });
      setRounds(roundsMap);
    } catch (err: any) {
      console.error("Error loading reservations:", err);
      setError(err.message || "Error al cargar reservas");
    } finally {
      setLoading(false);
    }
  };

  const filteredReservations = filter === "all"
    ? reservations
    : reservations.filter(r => r.status === filter);

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
      <div>
        <h1 className="text-3xl font-semibold text-[color:var(--text-strong)]">
          {t("quickLinks.reservations") || "Reservas"}
        </h1>
        <p className="text-sm text-[color:var(--text-muted)] mt-2">
          {t("quickLinks.reservationsDescription") || "Revisa y gestiona todas las reservas"}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          Todas
        </Button>
        <Button
          variant={filter === "pending" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setFilter("pending")}
        >
          Pendientes
        </Button>
        <Button
          variant={filter === "confirmed" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setFilter("confirmed")}
        >
          Confirmadas
        </Button>
        <Button
          variant={filter === "refunded" ? "primary" : "secondary"}
          size="sm"
          onClick={() => setFilter("refunded")}
        >
          Reembolsadas
        </Button>
      </div>

      {/* Lista de reservas */}
      {error && (
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}

      {filteredReservations.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-[color:var(--text-muted)]">
              No hay reservas {filter !== "all" ? `con estado "${filter}"` : ""}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => {
            const round = rounds[reservation.roundId];
            const project = round ? projects[round.projectId] : null;
            
            return (
              <Card key={reservation.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-[color:var(--text-strong)]">
                          Reserva #{reservation.id.slice(0, 8)}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          reservation.status === "confirmed" ? "bg-green-100 text-green-800" :
                          reservation.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          reservation.status === "refunded" ? "bg-red-100 text-red-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {reservation.status}
                        </span>
                      </div>
                      {project && (
                        <div className="text-sm font-medium text-[color:var(--text-strong)]">
                          {project.name}
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-[color:var(--text-muted)]">Slots:</span>{" "}
                          <span className="font-medium">{reservation.slots}</span>
                        </div>
                        <div>
                          <span className="text-[color:var(--text-muted)]">Monto:</span>{" "}
                          <span className="font-medium">
                            {fmtCurrency(reservation.amount, project?.currency || "USD", "es")}
                          </span>
                        </div>
                        <div>
                          <span className="text-[color:var(--text-muted)]">Usuario:</span>{" "}
                          <span className="font-medium">{reservation.userId.slice(0, 8)}...</span>
                        </div>
                        <div>
                          <span className="text-[color:var(--text-muted)]">Fecha:</span>{" "}
                          <span className="font-medium">
                            {shortDate(reservation.createdAt, "es")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {project && (
                      <div className="flex gap-2">
                        <Link href={`/projects/${project.slug}`}>
                          <Button variant="secondary" size="sm">
                            Ver Proyecto
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

