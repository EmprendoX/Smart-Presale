"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

const reviewProjects = [
  {
    id: "rev-001",
    name: "Distrito Reforma",
    developer: "Lumen Capital",
    city: "CDMX",
    legalChecks: [
      { id: "constitucion", label: "Acta constitutiva", completed: true },
      { id: "poderes", label: "Poderes notariales", completed: true },
      { id: "cumplimiento", label: "Opinión de cumplimiento SAT", completed: false },
      { id: "kym", label: "Expediente KYC", completed: true }
    ]
  },
  {
    id: "rev-002",
    name: "Parque Insurgentes",
    developer: "Norte Vivo",
    city: "Monterrey",
    legalChecks: [
      { id: "constitucion", label: "Acta constitutiva", completed: true },
      { id: "poderes", label: "Poderes notariales", completed: true },
      { id: "cumplimiento", label: "Opinión de cumplimiento SAT", completed: true },
      { id: "ambiental", label: "Manifestación de impacto ambiental", completed: false }
    ]
  },
  {
    id: "rev-003",
    name: "Costa Azul",
    developer: "Blue Horizon",
    city: "Cancún",
    legalChecks: [
      { id: "constitucion", label: "Acta constitutiva", completed: true },
      { id: "poderes", label: "Poderes notariales", completed: true },
      { id: "cumplimiento", label: "Opinión de cumplimiento SAT", completed: true },
      { id: "contrato", label: "Contrato marco fiduciario", completed: true }
    ]
  }
];

const reimbursementInbox = [
  {
    id: "rb-101",
    buyer: "María Torres",
    project: "Torre Marina",
    amount: "$5,000 USD",
    reason: "Disputa por fecha de entrega"
  },
  {
    id: "rb-102",
    buyer: "Luis Pérez",
    project: "Loft Distrito",
    amount: "$3,200 MXN",
    reason: "Solicitud de reembolso por duplicado"
  },
  {
    id: "rb-103",
    buyer: "Ana Díaz",
    project: "Villa Aurora",
    amount: "$8,000 USD",
    reason: "Disputa sobre cláusula de cancelación"
  }
];

const LOG_STORAGE_KEY = "admin-panel-log";

type DecisionStatus = "pendiente" | "aprobado" | "rechazado";

type LogEntry = {
  id: string;
  action: "aprobado" | "rechazado" | "resuelto";
  message: string;
  timestamp: number;
};

export default function AdminPanelPage() {
  const [statuses, setStatuses] = useState<Record<string, DecisionStatus>>(() => {
    const initial: Record<string, DecisionStatus> = {};
    reviewProjects.forEach(project => {
      initial[project.id] = "pendiente";
    });
    return initial;
  });

  const [refundStatuses, setRefundStatuses] = useState<Record<string, "pendiente" | "resuelto">>(() => {
    const initial: Record<string, "pendiente" | "resuelto"> = {};
    reimbursementInbox.forEach(item => {
      initial[item.id] = "pendiente";
    });
    return initial;
  });

  const [log, setLog] = useState<LogEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    if (stored) {
      try {
        setLog(JSON.parse(stored));
      } catch (err) {
        console.error("No se pudo leer la bitácora local", err);
      }
    }
  }, []);

  const legalHealth = useMemo(() => {
    return reviewProjects.reduce((acc, project) => {
      const completed = project.legalChecks.filter(check => check.completed).length;
      const total = project.legalChecks.length;
      acc[project.id] = Math.round((completed / total) * 100);
      return acc;
    }, {} as Record<string, number>);
  }, []);

  const appendLog = (entry: LogEntry) => {
    setLog(prev => {
      const next = [entry, ...prev];
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleDecision = (projectId: string, next: Exclude<DecisionStatus, "pendiente">) => {
    setStatuses(prev => ({ ...prev, [projectId]: next }));
    const project = reviewProjects.find(item => item.id === projectId);
    appendLog({
      id: crypto.randomUUID(),
      action: next,
      message: `${project?.name ?? projectId} marcado como ${next}`,
      timestamp: Date.now()
    });
  };

  const handleResolveRefund = (refundId: string) => {
    setRefundStatuses(prev => ({ ...prev, [refundId]: "resuelto" }));
    const item = reimbursementInbox.find(entry => entry.id === refundId);
    appendLog({
      id: crypto.randomUUID(),
      action: "resuelto",
      message: `Reserva de ${item?.buyer ?? refundId} marcada como resuelta`,
      timestamp: Date.now()
    });
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-primary)]">Panel</p>
        <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Control administrativo</h1>
        <p className="text-sm text-[color:var(--text-muted)] max-w-2xl">
          Consola local para validar expedientes legales, aprobar proyectos en revisión y monitorear disputas de
          compradores sin tocar servicios externos.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[color:var(--line)]">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Revisión</p>
            <p className="text-3xl font-bold text-[color:var(--text-strong)]">{reviewProjects.length}</p>
            <p className="text-xs text-[color:var(--text-muted)]">Proyectos cargados con checklist legal.</p>
          </CardContent>
        </Card>
        <Card className="border-[color:var(--line)]">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Pendientes</p>
            <p className="text-3xl font-bold text-[color:var(--text-strong)]">
              {Object.values(statuses).filter(status => status === "pendiente").length}
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">Solicitudes sin decisión.</p>
          </CardContent>
        </Card>
        <Card className="border-[color:var(--line)]">
          <CardContent className="space-y-2 p-4">
            <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Disputas</p>
            <p className="text-3xl font-bold text-[color:var(--text-strong)]">
              {Object.values(refundStatuses).filter(status => status === "pendiente").length}
            </p>
            <p className="text-xs text-[color:var(--text-muted)]">Reembolsos pendientes de revisión.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[color:var(--line)]">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Legal</p>
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Proyectos en revisión</h2>
          <p className="text-sm text-[color:var(--text-muted)]">
            Datos simulados con checklist legal y semáforo de cumplimiento. Las acciones actualizan solo el estado local.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {reviewProjects.map(project => {
            const progress = legalHealth[project.id];
            const status = statuses[project.id];
            const isComplete = progress === 100;
            return (
              <div key={project.id} className="space-y-3 rounded-lg border border-[color:var(--line)] bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-[color:var(--text-muted)]">{project.city}</p>
                    <p className="text-base font-semibold text-[color:var(--text-strong)]">{project.name}</p>
                    <p className="text-xs text-[color:var(--text-muted)]">{project.developer}</p>
                  </div>
                  <Badge color={isComplete ? "success" : progress > 70 ? "warning" : "neutral"}>
                    {isComplete ? "Checklist completo" : `${progress}% listo`}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[color:var(--text-muted)]">
                    <span>Semáforo legal</span>
                    <span className="font-semibold text-[color:var(--text-strong)]">{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <div className="grid gap-1 text-xs text-[color:var(--text-muted)]">
                    {project.legalChecks.map(check => (
                      <div key={check.id} className="flex items-center justify-between rounded border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-2">
                        <span>{check.label}</span>
                        <Badge color={check.completed ? "success" : "warning"}>
                          {check.completed ? "Cargado" : "Falta"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge color={status === "aprobado" ? "success" : status === "rechazado" ? "error" : "neutral"}>
                    {status === "pendiente" ? "Pendiente" : status === "aprobado" ? "Aprobado" : "Rechazado"}
                  </Badge>
                  <Button variant="secondary" onClick={() => handleDecision(project.id, "aprobado")} disabled={status === "aprobado"}>
                    Aprobar
                  </Button>
                  <Button variant="outline" onClick={() => handleDecision(project.id, "rechazado")} disabled={status === "rechazado"}>
                    Rechazar
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-[color:var(--line)]">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Compradores</p>
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Bandeja de reembolsos y disputas</h2>
          <p className="text-sm text-[color:var(--text-muted)]">
            Reservas pendientes de revisión. Al resolver se actualiza únicamente el estado local de la bandeja.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {reimbursementInbox.map(refund => {
            const status = refundStatuses[refund.id];
            return (
              <div key={refund.id} className="space-y-2 rounded-lg border border-[color:var(--line)] bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase text-[color:var(--text-muted)]">{refund.id}</p>
                    <p className="text-base font-semibold text-[color:var(--text-strong)]">{refund.buyer}</p>
                    <p className="text-xs text-[color:var(--text-muted)]">{refund.project}</p>
                  </div>
                  <Badge color={status === "resuelto" ? "success" : "warning"}>
                    {status === "resuelto" ? "Resuelto" : "Pendiente"}
                  </Badge>
                </div>
                <p className="text-sm text-[color:var(--text-strong)]">{refund.amount}</p>
                <p className="text-sm text-[color:var(--text-muted)]">{refund.reason}</p>
                <Button
                  variant="secondary"
                  onClick={() => handleResolveRefund(refund.id)}
                  disabled={status === "resuelto"}
                  className="w-full sm:w-auto"
                >
                  Marcar como resuelto
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-[color:var(--line)]">
        <CardHeader className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase text-[color:var(--text-muted)]">Bitácora</p>
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Cambios locales</h2>
          <p className="text-sm text-[color:var(--text-muted)]">
            Se almacenan en localStorage para pruebas. Incluye aprobaciones, rechazos y disputas resueltas.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {log.length === 0 ? (
            <p className="text-sm text-[color:var(--text-muted)]">Aún no hay movimientos registrados en esta sesión.</p>
          ) : (
            log.map(entry => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-3 rounded border border-[color:var(--line)] bg-[color:var(--bg-soft)] p-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge color={entry.action === "aprobado" ? "success" : entry.action === "rechazado" ? "error" : "neutral"}>
                      {entry.action}
                    </Badge>
                    <span className="text-xs text-[color:var(--text-muted)]">
                      {new Date(entry.timestamp).toLocaleString("es-MX", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-[color:var(--text-strong)]">{entry.message}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
