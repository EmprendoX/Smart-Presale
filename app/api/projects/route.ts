import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/config";
import { Project } from "@/lib/types";
import { validateAuthAndRole, createAuthErrorResponse, createPermissionErrorResponse } from "@/lib/auth/roles";

export async function GET() {
  const projects = await db.getProjects();
  const rounds = await db.getRounds();
  const data = projects.map(p => ({ ...p, round: rounds.find(r => r.projectId === p.id) || null }));
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  // Validar autenticación (permitir temporalmente a cualquier usuario autenticado)
  const user = await validateAuthAndRole(req);
  if (!user) {
    return createAuthErrorResponse("Debes iniciar sesión para crear proyectos");
  }

  // Advertencia si no es developer (pero permitir la acción temporalmente)
  if (user.role !== 'developer') {
    console.warn(`[projects] Usuario con rol '${user.role}' intentando crear proyecto. Permitido temporalmente.`);
  }

  const body = await req.json();
  const {
    name,
    city,
    country,
    currency,
    description,
    developerId: bodyDeveloperId,
    images,
    videoUrl,
    ticker,
    totalUnits,
    attributes,
    specs,
    zone,
    propertyType,
    propertyPrice,
    developmentStage,
    propertyDetails,
    listingType,
    stage,
    availabilityStatus,
    askingPrice,
    tags,
    featured,
    automationReady,
    agentIds,
    seo
  } = body || {};

  if (!name) return NextResponse.json({ ok: false, error: "Faltan campos" }, { status: 400 });

  // Obtener developerId del usuario autenticado o del body
  let developerId = bodyDeveloperId;
  
  if (!developerId) {
    // Buscar el developer asociado al usuario
    const developers = await db.getDevelopers();
    const developer = developers.find(d => d.userId === user.id);
    
    if (developer) {
      developerId = developer.id;
    } else {
      // Si no tiene developer asociado pero está autenticado, permitir usar un developerId del body
      // o crear un developer temporal (solo para desarrollo)
      if (user.role === 'developer') {
        return NextResponse.json({ 
          ok: false, 
          error: "No se encontró un perfil de desarrollador asociado a tu cuenta. Contacta al administrador." 
        }, { status: 400 });
      } else {
        // Para usuarios no-developer, requerir developerId en el body
        if (!bodyDeveloperId) {
          return NextResponse.json({ 
            ok: false, 
            error: "Se requiere un developerId para crear proyectos. Contacta al administrador para obtener permisos de desarrollador." 
          }, { status: 400 });
        }
        developerId = bodyDeveloperId;
      }
    }
  }

  const slug = name.toLowerCase().replace(/[^\w]+/g, "-");
  const generatedTicker = ticker || `SPS:${slug.substring(0, 5).toUpperCase()}`;

  const validListingType = listingType === "sale" ? "sale" : "presale";

  const tenantId = extractTenantIdFromCookie();

  const p: Project = {
    id: crypto.randomUUID(),
    slug,
    name, city, country, currency,
    status: "review",
    tenantId: body?.tenantId || tenantId || "tenant_default",
    images: images || [],
    videoUrl: videoUrl || undefined,
    description: description ?? "",
    developerId,
    createdAt: new Date().toISOString(),
    ticker: generatedTicker,
    totalUnits: totalUnits ? Number(totalUnits) : undefined,
    attributes: attributes || undefined,
    specs: specs || undefined,
    zone: zone || undefined,
    propertyType: propertyType || undefined,
    propertyPrice: propertyPrice ? Number(propertyPrice) : undefined,
    developmentStage: developmentStage || undefined,
    propertyDetails: propertyDetails || undefined,
    listingType: validListingType,
    stage: stage || developmentStage || undefined,
    availabilityStatus: availabilityStatus || (validListingType === "sale" ? "available" : "coming_soon"),
    askingPrice: askingPrice ? Number(askingPrice) : undefined,
    tags: Array.isArray(tags) ? tags : undefined,
    featured: Boolean(featured),
    automationReady: automationReady !== undefined ? Boolean(automationReady) : true,
    agentIds: Array.isArray(agentIds) ? agentIds : undefined,
    seo: seo || undefined
  };

  await db.createProject(p);
  return NextResponse.json({ ok: true, data: p });
}

function extractTenantIdFromCookie(): string | null {
  const cookieStore = cookies();
  const encoded = cookieStore.get("tenant_settings")?.value;

  if (!encoded) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(encoded);
    const payload = JSON.parse(decoded);
    return (payload?.tenant?.id as string) ?? null;
  } catch (error) {
    console.error("[projects] Failed to parse tenant cookie", error);
    return null;
  }
}

