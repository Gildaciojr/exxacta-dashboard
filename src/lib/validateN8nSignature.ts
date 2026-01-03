export function validateN8nSignature(req: Request) {
  const signature = req.headers.get("x-exxacta-signature");
  const secret = process.env.EXXACTA_N8N_SECRET;

  if (!secret) {
    console.error("❌ Faltando variável EXXACTA_N8N_SECRET no .env");
    return false;
  }

  if (!signature || signature !== secret) {
    console.warn("🔐 Assinatura inválida ou ausente no webhook");
    return false;
  }

  return true;
}
