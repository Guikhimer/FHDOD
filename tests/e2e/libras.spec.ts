import { expect, test } from "@playwright/test";

test("loads VLibras on demand and explains how to translate page text", async ({ page }) => {
  let widgetRequested = false;
  await page.route("https://vlibras.gov.br/app/vlibras-plugin.js", async (route) => {
    widgetRequested = true;
    await route.fulfill({
      contentType: "application/javascript",
      body: `
        window.VLibrasWidget = { initBtn: document.createElement('button') };
        window.VLibrasWidget.initBtn.click = () => {
          const panel = document.createElement('div');
          panel.setAttribute('data-testid', 'mock-vlibras-avatar');
          panel.textContent = 'Avatar VLibras';
          document.body.appendChild(panel);
        };
      `,
    });
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const activate = page.getByRole("button", { name: "Ativar tradução em Libras" });
  await expect(activate).toBeVisible();
  expect(widgetRequested).toBe(false);

  await activate.click();
  await expect(page.getByText(/Selecione um texto da página para traduzi-lo/)).toBeVisible();
  await expect(page.locator('[data-testid="mock-vlibras-avatar"]')).toBeVisible();
  expect(widgetRequested).toBe(true);

  await page.setViewportSize({ width: 375, height: 812 });
  const box = await page.getByRole("button", { name: "Abrir ou fechar tradução em Libras" }).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  expect(box!.y + box!.height).toBeLessThanOrEqual(812);
});

test("reports the unavailable service without showing a translation", async ({ page }) => {
  await page.route("https://vlibras.gov.br/app/vlibras-plugin.js", (route) => route.abort());
  await page.goto("/");
  await page.getByRole("button", { name: "Ativar tradução em Libras" }).click();
  await expect(page.getByText(/serviço de tradução em Libras está indisponível/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Tentar novamente/ })).toBeVisible();
});
