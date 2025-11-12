import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/config";
import { validateAuthAndRole, createAuthErrorResponse, createPermissionErrorResponse } from "@/lib/auth/roles";
import { Role } from "@/lib/types";
import { getSupabaseBrowserClient } from "@/lib/auth/supabase";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Solo admin puede cambiar roles
    const adminUser = await validateAuthAndRole(req, ['admin']);
    if (!adminUser) {
      return createPermissionErrorResponse("Solo los administradores pueden asignar roles");
    }

    const { id } = await params;
    const body = await req.json();
    const { role } = body || {};

    if (!role) {
      return NextResponse.json({ ok: false, error: "El rol es requerido" }, { status: 400 });
    }

    // Validar que el rol sea válido
    const validRoles: Role[] = ['buyer', 'developer', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        ok: false, 
        error: `Rol inválido. Roles permitidos: ${validRoles.join(', ')}` 
      }, { status: 400 });
    }

    // Obtener el usuario actual
    const currentUser = await db.getUserById(id);
    if (!currentUser) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    // Actualizar rol en app_users
    const updatedUser = await db.upsertUser({
      ...currentUser,
      role: role as Role
    });

    // También actualizar en user_metadata de Supabase Auth (requiere service role)
    // Nota: Esto requiere usar el cliente con service role key
    try {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (serviceKey) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        if (supabaseUrl) {
          const supabaseAdmin = createClient(supabaseUrl, serviceKey);
          await supabaseAdmin.auth.admin.updateUserById(id, {
            user_metadata: {
              ...currentUser.metadata,
              role: role
            }
          });
        }
      }
    } catch (error) {
      console.warn('[users/role] No se pudo actualizar user_metadata, pero el rol se actualizó en app_users:', error);
    }

    return NextResponse.json({ 
      ok: true, 
      data: updatedUser,
      message: `Rol actualizado a '${role}' exitosamente` 
    });
  } catch (error: any) {
    console.error('[PATCH /api/users/[id]/role] Error:', error);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || "Error al actualizar el rol" 
    }, { status: 500 });
  }
}

