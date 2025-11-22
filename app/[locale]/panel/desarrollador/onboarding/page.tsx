"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const STORAGE_KEY = "sps_dev_onboarding";
const USER_STATE_KEY = "sps_user_state";

type EntityType = "company" | "individual";

type ChecklistState = {
  title: boolean;
  permits: boolean;
  masterPlan: boolean;
  reservationContract: boolean;
  refundPolicy: boolean;
};

type DocumentEntry = {
  id: string;
  name: string;
  url: string;
};

type OnboardingState = {
  entityType: EntityType;
  companyName: string;
  personName: string;
  email: string;
  phone: string;
  website: string;
  documents: DocumentEntry[];
  checklist: ChecklistState;
  verifiedDeveloper: boolean;
  verifiedAt: string | null;
};

const defaultState: OnboardingState = {
  entityType: "company",
  companyName: "",
  personName: "",
  email: "",
  phone: "",
  website: "",
  documents: [],
  checklist: {
    title: false,
    permits: false,
    masterPlan: false,
    reservationContract: false,
    refundPolicy: false
  },
  verifiedDeveloper: false,
  verifiedAt: null
};

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function DeveloperOnboardingPage() {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [documentName, setDocumentName] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as OnboardingState;
      setState({ ...defaultState, ...parsed });
    } catch (error) {
      console.warn("No se pudo cargar el estado de onboarding", error);
    }
  }, [mounted]);

  const checklistComplete = useMemo(
    () => Object.values(state.checklist).every(Boolean),
    [state.checklist]
  );

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    const verifiedAt = checklistComplete ? state.verifiedAt ?? new Date().toISOString() : null;
    window.localStorage.setItem(
      USER_STATE_KEY,
      JSON.stringify({
        developerVerified: checklistComplete,
        verifiedAt,
        entityType: state.entityType,
        lastSubmitted: new Date().toISOString()
      })
    );
  }, [state, mounted, checklistComplete]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    if (checklistComplete && !state.verifiedDeveloper) {
      setState(prev => ({ ...prev, verifiedDeveloper: true, verifiedAt: new Date().toISOString() }));
    }
    if (!checklistComplete && state.verifiedDeveloper) {
      setState(prev => ({ ...prev, verifiedDeveloper: false, verifiedAt: null }));
    }
  }, [mounted, checklistComplete, state.verifiedDeveloper]);

  const addDocument = () => {
    if (!documentName.trim() || !documentUrl.trim()) return;
    const entry: DocumentEntry = { id: generateId(), name: documentName.trim(), url: documentUrl.trim() };
    setState(prev => ({ ...prev, documents: [...prev.documents, entry] }));
    setDocumentName("");
    setDocumentUrl("");
  };

  const removeDocument = (id: string) => {
    setState(prev => ({ ...prev, documents: prev.documents.filter(doc => doc.id !== id) }));
  };

  const updateChecklist = (key: keyof ChecklistState) => {
    setState(prev => ({ ...prev, checklist: { ...prev.checklist, [key]: !prev.checklist[key] } }));
  };

  const handleFieldChange = (field: keyof OnboardingState, value: string) => {
    if (field === "entityType" && (value === "company" || value === "individual")) {
      setState(prev => ({ ...prev, entityType: value }));
      return;
    }

    if (field in state) {
      setState(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-primary)]">Onboarding</p>
          <h1 className="text-3xl font-bold text-[color:var(--text-strong)]">Configura tu perfil de desarrollador</h1>
          <p className="text-sm text-[color:var(--text-muted)]">
            Completa la información básica y confirma el checklist legal para activar el estado de "Desarrollador verificado" en el modo demo.
          </p>
        </div>
        <Badge color={checklistComplete ? "success" : "warning"}>
          {checklistComplete ? "Desarrollador verificado" : "Verificación pendiente"}
        </Badge>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-[color:var(--line)]">
          <CardHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Datos de contacto</h2>
            <p className="text-sm text-[color:var(--text-muted)]">Selecciona si operarás como persona física o empresa y comparte tus datos de referencia.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 text-sm font-medium">
              <button
                type="button"
                onClick={() => handleFieldChange("entityType", "company")}
                className={`rounded-md border px-3 py-2 ${
                  state.entityType === "company"
                    ? "border-[color:var(--brand-primary)] bg-[color:var(--bg-soft)] text-[color:var(--brand-primary)]"
                    : "border-[color:var(--line)] text-[color:var(--text-strong)]"
                }`}
              >
                Empresa
              </button>
              <button
                type="button"
                onClick={() => handleFieldChange("entityType", "individual")}
                className={`rounded-md border px-3 py-2 ${
                  state.entityType === "individual"
                    ? "border-[color:var(--brand-primary)] bg-[color:var(--bg-soft)] text-[color:var(--brand-primary)]"
                    : "border-[color:var(--line)] text-[color:var(--text-strong)]"
                }`}
              >
                Persona
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label={state.entityType === "company" ? "Razón social" : "Nombre completo"}
                value={state.entityType === "company" ? state.companyName : state.personName}
                onChange={event =>
                  handleFieldChange(state.entityType === "company" ? "companyName" : "personName", event.target.value)
                }
                placeholder={state.entityType === "company" ? "BlueRock Dev S.A." : "Carlos Pérez"}
              />
              <Input
                label="Correo de contacto"
                type="email"
                value={state.email}
                onChange={event => handleFieldChange("email", event.target.value)}
                placeholder="dev@example.com"
              />
              <Input
                label="Teléfono"
                value={state.phone}
                onChange={event => handleFieldChange("phone", event.target.value)}
                placeholder="+52 55 1234 5678"
              />
              <Input
                label="Sitio web o portafolio"
                value={state.website}
                onChange={event => handleFieldChange("website", event.target.value)}
                placeholder="https://tudesarrollo.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[color:var(--line)]">
          <CardHeader className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Documentos</h2>
            <p className="text-sm text-[color:var(--text-muted)]">Registra el nombre del archivo y la URL mock. No se sube nada real.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              label="Nombre del archivo"
              value={documentName}
              onChange={event => setDocumentName(event.target.value)}
              placeholder="permiso-construccion.pdf"
            />
            <Input
              label="URL (mock)"
              value={documentUrl}
              onChange={event => setDocumentUrl(event.target.value)}
              placeholder="https://ejemplo.com/archivo"
            />
            <Button onClick={addDocument} disabled={!documentName.trim() || !documentUrl.trim()}>Agregar documento</Button>
            <div className="space-y-2 text-sm">
              {state.documents.length === 0 && <p className="text-[color:var(--text-muted)]">Aún no agregas documentos.</p>}
              {state.documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between rounded-md border border-[color:var(--line)] px-3 py-2">
                  <div className="space-y-0.5">
                    <p className="font-medium text-[color:var(--text-strong)]">{doc.name}</p>
                    <p className="text-[color:var(--text-muted)]">{doc.url}</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => removeDocument(doc.id)}>
                    Quitar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[color:var(--line)]">
        <CardHeader className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[color:var(--text-strong)]">Checklist legal</h2>
          <p className="text-sm text-[color:var(--text-muted)]">Activa cada toggle cuando tengas el documento listo para revisión.</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <ChecklistToggle
            label="Título de propiedad"
            checked={state.checklist.title}
            onToggle={() => updateChecklist("title")}
          />
          <ChecklistToggle
            label="Permisos vigentes"
            checked={state.checklist.permits}
            onToggle={() => updateChecklist("permits")}
          />
          <ChecklistToggle
            label="Plan maestro"
            checked={state.checklist.masterPlan}
            onToggle={() => updateChecklist("masterPlan")}
          />
          <ChecklistToggle
            label="Contrato de reserva"
            checked={state.checklist.reservationContract}
            onToggle={() => updateChecklist("reservationContract")}
          />
          <ChecklistToggle
            label="Política de reembolso"
            checked={state.checklist.refundPolicy}
            onToggle={() => updateChecklist("refundPolicy")}
          />
        </CardContent>
      </Card>

      <Card className="border-[color:var(--line)]">
        <CardContent className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-[color:var(--text-strong)]">Estado del desarrollador</p>
            <p className="text-sm text-[color:var(--text-muted)]">
              Guardamos el estado en localStorage para que los mocks de la app puedan leer la verificación.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge color={checklistComplete ? "success" : "warning"}>
              {checklistComplete ? "Verificado" : "Pendiente"}
            </Badge>
            <div className="text-sm text-[color:var(--text-muted)]">
              {state.verifiedAt ? `Actualizado ${new Date(state.verifiedAt).toLocaleString()}` : "Sin verificar"}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

type ChecklistToggleProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

function ChecklistToggle({ label, checked, onToggle }: ChecklistToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left transition hover:shadow-sm ${
        checked
          ? "border-[color:var(--success)] bg-[color:var(--success)]/10 text-[color:var(--text-strong)]"
          : "border-[color:var(--line)] bg-[color:var(--bg-surface)] text-[color:var(--text-strong)]"
      }`}
      aria-pressed={checked}
    >
      <div className="space-y-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-[color:var(--text-muted)]">Confirma que el documento está listo.</p>
      </div>
      <span
        className={`h-6 w-11 rounded-full p-1 transition ${
          checked ? "bg-[color:var(--success)]" : "bg-[color:var(--line)]"
        }`}
      >
        <span
          className={`block h-4 w-4 rounded-full bg-white shadow-sm transition ${checked ? "translate-x-5" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}

