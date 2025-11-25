import { NextRequest, NextResponse } from "next/server";
import { getJsonAuthClient } from "@/lib/auth/json-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // En modo mock, simplemente autenticar con usuario demo basado en email
    const client = getJsonAuthClient();
    
    // Buscar usuario demo por email o usar buyer por defecto
    const userId = email?.includes("admin") ? "u_admin_1" : 
                   email?.includes("dev") ? "u_dev_1" : 
                   "u_buyer_1";
    
    await client.signIn(userId);

    return NextResponse.json({
      success: true,
      message: "Sesión iniciada exitosamente (modo demo)"
    });
  } catch (error: any) {
    console.error("[API /auth/signin] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error al procesar la solicitud" },
      { status: 500 }
    );
  }
}



