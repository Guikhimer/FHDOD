-- Run separately after enabling Supabase Cron + pg_net and configuring Vault.
-- Store fhdod_project_url and fhdod_service_role_key in Vault via the Dashboard.
-- No service secrets belong in this file or in Git.
select cron.schedule(
  'fhdod-notify-complaints',
  '* * * * *',
  $$select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'fhdod_project_url') || '/functions/v1/notify-complaints',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' ||
      (select decrypted_secret from vault.decrypted_secrets where name = 'fhdod_service_role_key')),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  );$$
);
