import { createClient } from "npm:@supabase/supabase-js@2";
type Job = {
  id: string;
  complaint_id: string;
  sector: string;
  created_at: string;
  recipients: string[];
};
Deno.serve(async (request: Request) => {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  // verify_jwt can be disabled for this function: this check still restricts it to service calls.
  if (request.method !== "POST" || request.headers.get("Authorization") !== `Bearer ${key}`)
    return new Response("Unauthorized", { status: 401 });
  const resend = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("NOTIFICATION_FROM");
  const site = Deno.env.get("SITE_URL");
  if (!resend || !from || !site)
    return new Response("Notification configuration missing", { status: 503 });
  const client = createClient(Deno.env.get("SUPABASE_URL")!, key);
  const { data, error } = await client.rpc("claim_notification_jobs");
  if (error) return new Response("Cannot claim notifications", { status: 500 });
  let sent = 0;
  for (const job of data as Job[]) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(15000),
        headers: {
          Authorization: `Bearer ${resend}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `complaint-${job.id}`,
        },
        body: JSON.stringify({
          from,
          to: job.recipients,
          subject: "FHDOD · Nova avaliação para a ouvidoria",
          text: `Uma avaliação com nota 1 ou 2 foi recebida no setor ${job.sector}.\n\nAcesse a área protegida para acompanhar: ${site}/dashboard/manage\n\nNenhum comentário ou telefone é enviado neste e-mail.`,
        }),
      });
      if (!response.ok) throw new Error(`Email provider HTTP ${response.status}`);
      const { error: finishError } = await client.rpc("finish_notification_job", {
        p_id: job.id,
        p_success: true,
      });
      if (finishError) throw new Error("Cannot mark delivery");
      sent++;
    } catch (error) {
      await client.rpc("finish_notification_job", {
        p_id: job.id,
        p_success: false,
        p_error: error instanceof Error ? error.message : "Email delivery failed",
      });
    }
  }
  return Response.json({ processed: data.length, sent });
});
