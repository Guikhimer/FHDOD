import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import ExcelJS from "exceljs";
async function startSurvey(page: import("@playwright/test").Page) {
  await page.goto("/p/pronto-atendimento");
  await page.getByRole("button", { name: "Aumentar texto" }).click();
  await expect.poll(() => page.locator(".survey-shell").evaluate((el) => getComputedStyle(el).getPropertyValue("--survey-font").trim())).toBe("20px");
  await page.getByLabel("Data do atendimento").fill("2026-11-01");
  await page.getByLabel("Horário do atendimento").fill("10:30");
  await expect(page.getByLabel("Data do atendimento")).toHaveValue("2026-11-01");
  await page.getByRole("button", { name: /TOQUE AQUI PARA COMEÇAR|Iniciar Avaliação Rápida/i }).click();
}
test("optional answers, required NPS zero, successful submission", async ({ page }) => {
  await startSurvey(page);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Avançar" }).click();
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Escolha uma nota");
  await page.getByRole("radio", { name: "0", exact: true }).check();
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  await expect(page.getByRole("heading", { name: "Muito Obrigado pela sua Avaliação!" })).toBeVisible({
    timeout: 15000,
  });
});
test("low score opens optional complaint, tablet clears it after reset", async ({ page }) => {
  await page.goto("/p/pronto-atendimento?tablet=1");
  await page.getByRole("button", { name: "Aumentar texto" }).click();
  await expect.poll(() => page.locator(".survey-shell").evaluate((el) => getComputedStyle(el).getPropertyValue("--survey-font").trim())).toBe("20px");
  await page.getByLabel("Data do atendimento").fill("2026-11-01");
  await page.getByLabel("Horário do atendimento").fill("10:30");
  await expect(page.getByLabel("Data do atendimento")).toHaveValue("2026-11-01");
  await page.getByRole("button", { name: /TOQUE AQUI PARA COMEÇAR/ }).click();
  await page.getByRole("radio", { name: /Péssimo Nível 1 de 5/ }).check();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Avançar" }).click();
  await page.getByRole("radio", { name: "5", exact: true }).check();
  await page.getByRole("button", { name: "Avançar" }).click();
  await expect(page.getByRole("heading", { name: "Deseja um retorno formal da Ouvidoria?" })).toBeVisible();
  await page.getByRole("button", { name: /Sim, quero receber retorno da Ouvidoria/ }).click();
  await page.getByLabel("Seu relato ou sugestão").fill("Demorou para atender.");
  await page.getByLabel("Telefone ou WhatsApp com DDD").fill("51999999999");
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Autorize");
  await page.getByRole("checkbox").check();
  await page.clock.install();
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  await expect(page.getByRole("heading", { name: "Muito Obrigado pela sua Avaliação!" })).toBeVisible();
  await page.clock.fastForward(21000);
  await expect(page.getByRole("button", { name: /TOQUE AQUI PARA COMEÇAR/ })).toBeVisible();
  await page.getByLabel("Data do atendimento").fill("2026-11-01");
  await page.getByLabel("Horário do atendimento").fill("10:30");
  await page.getByRole("button", { name: /TOQUE AQUI PARA COMEÇAR/ }).click();
  await expect(page.getByRole("radio", { name: /Péssimo Nível 1 de 5/ })).not.toBeChecked();
});
test("mobile zoom, keyboard and automated WCAG checks", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/p/pronto-atendimento");
  await page.getByRole("button", { name: "Aumentar texto" }).click();
  await page.getByRole("button", { name: "Aumentar texto" }).click();
  await expect.poll(() => page.locator(".survey-shell").evaluate((el) => getComputedStyle(el).getPropertyValue("--survey-font").trim())).toBe("22px");
  await page.getByLabel("Data do atendimento").fill("2026-11-01");
  await page.getByLabel("Horário do atendimento").fill("10:30");
  await page.getByRole("button", { name: /Iniciar Avaliação Rápida/i }).click();
  const radio = page.getByRole("radio", { name: /Péssimo Nível 1 de 5/ });
  await radio.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Ruim Nível 2 de 5/ })).toBeChecked();
  const horizontalOverflow = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    elements: [...document.querySelectorAll("body *")].map((element) => ({
      tag: element.tagName,
      className: typeof element.className === "string" ? element.className : "",
      width: Math.round(element.getBoundingClientRect().width),
      right: Math.round(element.getBoundingClientRect().right),
    })).filter((element) => element.right > window.innerWidth + 1).slice(0, 8),
  }));
  expect(horizontalOverflow.document <= horizontalOverflow.viewport, JSON.stringify(horizontalOverflow)).toBe(true);
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole("heading").focus();
  await page.screenshot({ path: "test-results/survey-mobile.png", fullPage: true });
});
test("submission disables repeated clicks and preserves the retry identifier", async ({ page }) => {
  const ids: string[] = [];
  let release: (() => void) | undefined;
  await page.route("**/api/surveys/pronto-atendimento", async (route) => {
    ids.push(route.request().postDataJSON().submissionId);
    if (ids.length === 1) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      await route.fulfill({ status: 503, json: { error: "Falha de conexão. Tente novamente." } });
    } else await route.fulfill({ status: 200, json: { ok: true } });
  });
  await startSurvey(page);
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Avançar" }).click();
  await page.getByRole("radio", { name: "10", exact: true }).check();
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  await expect(page.getByRole("button", { name: "Enviando" })).toBeDisabled();
  await expect.poll(() => ids.length).toBe(1);
  release!();
  await expect(page.getByRole("main").getByRole("alert")).toContainText("Falha de conexão");
  await expect(page.getByRole("radio", { name: "10", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Enviar avaliação" }).click();
  await expect(page.getByRole("heading", { name: "Muito Obrigado pela sua Avaliação!" })).toBeVisible();
  expect(ids).toHaveLength(2);
  expect(ids[0]).toBe(ids[1]);
});
test("dashboard, TV and Excel demonstration are reviewable", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Escutar. Entender. Melhorar." })).toBeVisible();
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
  await page.screenshot({ path: "test-results/dashboard.png", fullPage: true });
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Exportar Excel" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("fhdod-demonstracao.xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile((await file.path())!);
  expect(workbook.getWorksheet("Demonstração")?.getCell("A3").value).toBe("Pronto Atendimento");
  await page.goto("/tv-wall");
  await expect(page.getByRole("heading", { name: "Painel público de satisfação" })).toBeVisible();
  await expect(page.getByText("Mural de Elogios")).toHaveCount(0);
  expect(
    (await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze()).violations,
  ).toEqual([]);
  await page.screenshot({ path: "test-results/tv-wall.png", fullPage: true });
});
