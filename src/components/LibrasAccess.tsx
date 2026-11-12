"use client";

import { Hand, LoaderCircle, RotateCcw } from "lucide-react";
import { useState } from "react";

type VLibrasWidget = {
  initBtn?: HTMLButtonElement;
};

declare global {
  interface Window {
    VLibras?: { Widget: new () => unknown };
    VLibrasWidget?: VLibrasWidget;
  }
}

type Status = "idle" | "loading" | "ready" | "error";

const SCRIPT_ID = "fhdod-vlibras-script";
const SCRIPT_URL = "https://vlibras.gov.br/app/vlibras-plugin.js";

export function LibrasAccess() {
  const [status, setStatus] = useState<Status>("idle");
  const [expanded, setExpanded] = useState(false);

  function openWidget() {
    const widgetButton = window.VLibrasWidget?.initBtn;
    if (widgetButton) {
      widgetButton.style.display = "none";
      widgetButton.click();
      setExpanded((open) => !open);
      return;
    }

    if (status === "loading") return;
    setStatus("loading");

    const script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const onReady = () => {
      const trigger = window.VLibrasWidget?.initBtn;
      if (!trigger) {
        setStatus("error");
        setExpanded(true);
        return;
      }
      trigger.style.display = "none";
      trigger.click();
      setStatus("ready");
      setExpanded(true);
    };
    const onError = () => {
      setStatus("error");
      setExpanded(true);
    };

    if (script) {
      if (window.VLibrasWidget?.initBtn) onReady();
      else {
        script.addEventListener("load", onReady, { once: true });
        script.addEventListener("error", onError, { once: true });
      }
      return;
    }

    const newScript = document.createElement("script");
    newScript.id = SCRIPT_ID;
    newScript.src = SCRIPT_URL;
    newScript.async = true;
    newScript.addEventListener("load", onReady, { once: true });
    newScript.addEventListener("error", onError, { once: true });
    document.body.appendChild(newScript);
  }

  function retry() {
    const oldScript = document.getElementById(SCRIPT_ID);
    oldScript?.remove();
    setStatus("idle");
    setExpanded(false);
  }

  return (
    <div className="libras-access" lang="pt-BR">
      {expanded && (
        <section className="libras-status" aria-live="polite" aria-atomic="true">
          <div className="libras-status-heading">
            <strong>Tradução em Libras</strong>
            <button
              type="button"
              className="libras-close"
              aria-label="Fechar aviso de Libras"
              onClick={() => setExpanded(false)}
            >
              ×
            </button>
          </div>
          {status === "loading" && (
            <p>
              <LoaderCircle size={17} aria-hidden="true" className="libras-spinner" />
              Conectando ao VLibras…
            </p>
          )}
          {status === "ready" && (
            <p>
              O avatar do VLibras está aberto. Selecione um texto da página para traduzi-lo. Use os
              controles do avatar para pausar, ajustar a exibição ou ampliar a área de tradução.
            </p>
          )}
          {status === "error" && (
            <>
              <p>
                O serviço de tradução em Libras está indisponível no momento. Nenhuma tradução foi
                exibida. Verifique sua conexão e tente novamente.
              </p>
              <button type="button" className="libras-retry" onClick={retry}>
                <RotateCcw size={16} aria-hidden="true" /> Tentar novamente
              </button>
            </>
          )}
        </section>
      )}
      <button
        type="button"
        className="libras-trigger"
        aria-label={status === "ready" ? "Abrir ou fechar tradução em Libras" : "Ativar tradução em Libras"}
        aria-expanded={expanded}
        onClick={openWidget}
      >
        <Hand size={22} aria-hidden="true" />
        <span>{status === "ready" ? "Libras" : "Traduzir em Libras"}</span>
      </button>
    </div>
  );
}
