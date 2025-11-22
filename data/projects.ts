export type FundingRule = "todo-nada" | "parcial";

export type ProjectShowcase = {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: string;
  developer: string;
  developerId: string;
  verifiedDeveloper: boolean;
  goal: number;
  raised: number;
  deposit: number;
  minTicket: number;
  maxTicket: number;
  currency: "USD" | "MXN";
  deadline: string;
  rule: FundingRule;
  description: string;
  gallery: string[];
  videoUrl?: string;
  documents: { title: string; url: string }[];
};

export const projectsData: ProjectShowcase[] = [
  {
    id: "proj-01",
    slug: "torre-marina",
    name: "Torre Marina",
    city: "Cancún",
    country: "México",
    developer: "Blue Horizon",
    developerId: "dev-01",
    verifiedDeveloper: true,
    goal: 3500000,
    raised: 1800000,
    deposit: 15000,
    minTicket: 5000,
    maxTicket: 50000,
    currency: "USD",
    deadline: "2024-12-20",
    rule: "todo-nada",
    description: "Departamentos frente al mar con amenidades resort. Entrega estimada Q2 2027.",
    gallery: [
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=900&auto=format&fit=crop"
    ],
    videoUrl: "https://www.youtube.com/embed/ysz5S6PUM-U",
    documents: [
      { title: "Título de propiedad", url: "https://example.com/titulo.pdf" },
      { title: "Permiso de construcción", url: "https://example.com/permiso.pdf" },
      { title: "Términos de la ronda", url: "https://example.com/terminos.pdf" }
    ]
  },
  {
    id: "proj-02",
    slug: "loft-distrito",
    name: "Loft Distrito",
    city: "CDMX",
    country: "México",
    developer: "Urban Loop",
    developerId: "dev-02",
    verifiedDeveloper: true,
    goal: 2200000,
    raised: 940000,
    deposit: 7500,
    minTicket: 3000,
    maxTicket: 30000,
    currency: "MXN",
    deadline: "2024-11-15",
    rule: "parcial",
    description: "Lofts urbanos en corredor financiero con cowork y roof garden.",
    gallery: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=900&auto=format&fit=crop"
    ],
    documents: [
      { title: "Ficha técnica", url: "https://example.com/ficha.pdf" },
      { title: "Contrato de adhesión", url: "https://example.com/contrato.pdf" }
    ]
  },
  {
    id: "proj-03",
    slug: "villa-aurora",
    name: "Villa Aurora",
    city: "Mérida",
    country: "México",
    developer: "Norte Vivo",
    developerId: "dev-03",
    verifiedDeveloper: true,
    goal: 1500000,
    raised: 1200000,
    deposit: 10000,
    minTicket: 8000,
    maxTicket: 60000,
    currency: "USD",
    deadline: "2025-01-10",
    rule: "todo-nada",
    description: "Residencias premium con paneles solares y casa club lista.",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-0ef3c08dcdb6?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-0ef3c08dcdb6?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1600585154340-0ef3c08dcdb6?q=80&w=900&auto=format&fit=crop"
    ],
    documents: [
      { title: "Plano arquitectónico", url: "https://example.com/plano.pdf" },
      { title: "Reglamento de condominio", url: "https://example.com/reglamento.pdf" }
    ]
  }
];
