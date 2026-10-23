"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  Heart,
  Home,
  LoaderCircle,
  LockKeyhole,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Phone,
  Delete,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { RatingFace, ratingLabels } from "@/components/RatingFace";
import type { Survey } from "@/types";

type Step =
  | { type: "rating"; id: string; text: string; general: boolean }
  | { type: "nps"; text: string }
  | { type: "complaint" };

const QUICK_TAGS = [
  "Equipe muito atenciosa e carinhosa",
  "Atendimento médico humanizado",
  "Ambiente limpo e higienizado",
  "Demora no tempo de espera",
  "Falta de informação sobre o fluxo",
];

export function SurveyForm({
  survey,
  demo,
  tablet = false,
}: {
  survey: Survey;
  demo: boolean;
  tablet?: boolean;
}) {
  const [zoom, setZoom] = useState(0);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [nps, setNps] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [contact, setContact] = useState("");
  const [consent, setConsent] = useState(false);
  const [wantsContact, setWantsContact] = useState<boolean>(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(survey.tablet_reset_seconds);
  const [protocol, setProtocol] = useState("");

  const submissionId = useRef<string | null>(null);
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const instanceId = useId();

  const low = Object.values(answers).some((value) => value < 3);

  const steps: Step[] = [
    ...survey.questions
      .filter((q) => q.kind === "rating")
      .map((q) => ({ type: "rating" as const, id: q.id, text: q.text, general: !q.sector_id })),
    {
      type: "nps",
      text:
        survey.questions.find((q) => q.kind === "nps")?.text ||
        "De 0 a 10, quanto você recomendaria este hospital?",
    },
    ...(low ? [{ type: "complaint" as const }] : []),
  ];

  const current = steps[step];

  const reset = useCallback(() => {
    setStarted(false);
    setStep(0);
    setAnswers({});
    setNps(null);
    setComment("");
    setContact("");
    setConsent(false);
    setWantsContact(false);
    setDone(false);
    setError("");
    setRemaining(survey.tablet_reset_seconds);
    setProtocol("");
    submissionId.current = null;
    busy.current = false;
  }, [survey.tablet_reset_seconds]);

  useEffect(() => {
    if (started || done) heading.current?.focus();
  }, [started, step, done]);

  useEffect(() => {
    if (!done || !tablet) return;
    const deadline = Date.now() + survey.tablet_reset_seconds * 1000;
    const interval = setInterval(
      () => setRemaining(Math.max(0, Math.ceil((deadline - Date.now()) / 1000))),
      1000,
    );
    const timer = setTimeout(reset, survey.tablet_reset_seconds * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [done, tablet, reset, survey.tablet_reset_seconds]);

  function formatPhoneDisplay(raw: string) {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  }

  function handleKeypadPress(digit: string) {
    const raw = contact.replace(/\D/g, "");
    if (raw.length < 11) {
      setContact(formatPhoneDisplay(raw + digit));
    }
  }

  function handleKeypadBackspace() {
    const raw = contact.replace(/\D/g, "");
    setContact(formatPhoneDisplay(raw.slice(0, -1)));
  }

  function handleKeypadClear() {
    setContact("");
  }

  function handleTagClick(tagText: string) {
    if (comment.includes(tagText)) return;
    const updated = comment.trim() ? `${comment.trim()} • ${tagText}` : tagText;
    setComment(updated);
  }

  function handleAudioHelp() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const text =
        current?.type === "rating"
          ? `${current.text}. Selecione uma das cinco carinhas na tela.`
          : current?.type === "nps"
            ? `${current.text}. Escolha uma nota de zero a dez.`
            : "Por favor, avalie nosso atendimento. Sua opinião melhora o hospital de forma anônima.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  async function next() {
    if (busy.current) return;
    setError("");

    if (current.type === "nps" && nps === null) {
      setError("Escolha uma nota de 0 a 10 para continuar.");
      return;
    }

    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    if (contact.trim() && !consent) {
      setError("Autorize o uso do telefone ou deixe o contato em branco.");
      return;
    }

    if (contact.trim() && !/^[+()\d\s-]{8,30}$/.test(contact.trim())) {
      setError("Confira o telefone, incluindo o DDD, ou deixe em branco.");
      return;
    }

    busy.current = true;
    setSending(true);
    submissionId.current ??= crypto.randomUUID();

    try {
      const response = await fetch(`/api/surveys/${survey.sector_slug}`, {
        method: "POST",
        signal: AbortSignal.timeout(20000),
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submissionId.current,
          nps,
          answers: Object.entries(answers).map(([question_id, value]) => ({ question_id, value })),
          comment: low ? comment : "",
          contact: low ? contact : "",
          consent: low && consent,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Gerar protocolo institucional amigável
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      setProtocol(tablet ? `#PA-${randomNum}` : `#QR-${randomNum}`);

      setDone(true);
      setAnswers({});
      setComment("");
      setContact("");
      setConsent(false);
      setNps(null);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "Error"
          ? err.message
          : "Não conseguimos enviar. Confira a conexão e tente novamente. Suas escolhas foram mantidas.",
      );
    } finally {
      busy.current = false;
      setSending(false);
    }
  }

  return (
    <div
      className="survey-shell"
      style={{ "--survey-font": `${18 + zoom * 2}px` } as CSSProperties}
    >
      {/* 1. TOP UTILITY & ACCESSIBILITY BAR (Telas 5, 7, 8) */}
      <header className="survey-header">
        <Brand />

        {/* Setor e Identificação Kiosk */}
        <div className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f2f4f6] border border-[#e0e3e5] shadow-inner text-[#0f3854]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#da2f37] animate-pulse" />
          <span className="font-semibold text-sm">
            {survey.sector_name} {tablet ? "• Totem 02" : "• Totem Virtual QR"}
          </span>
        </div>

        {/* Controles de Acessibilidade Táteis */}
        <div className="flex items-center gap-2">
          {/* Ajuste de Fonte com hit-targets generosos */}
          <div className="text-controls" role="group" aria-label="Tamanho do texto">
            <span>Texto</span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Diminuir texto"
              onClick={() => setZoom(Math.max(0, zoom - 1))}
              disabled={zoom === 0}
              className="w-11 h-11 font-bold text-base rounded-full"
            >
              A−
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Aumentar texto"
              onClick={() => setZoom(Math.min(3, zoom + 1))}
              disabled={zoom === 3}
              className="w-11 h-11 font-bold text-base rounded-full"
            >
              A+
            </Button>
          </div>

          {/* Botão de Áudio / Ajuda Acessível */}
          <button
            type="button"
            onClick={handleAudioHelp}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#f2f4f6] hover:bg-[#eceef0] text-[#0f3854] font-semibold text-sm transition-all shadow-sm active:scale-95"
            title="Ouvir instruções da tela"
          >
            <Volume2 size={18} className="text-[#0f3854]" aria-hidden="true" />
            <span>Ouvir</span>
          </button>
        </div>
      </header>

      {demo && (
        <div className="demo-strip">
          Demonstração · suas respostas não serão armazenadas.
        </div>
      )}

      <main id="main" className="survey-main">
        {/* Setor badge móvel */}
        <div className="flex justify-center md:hidden mb-4">
          <div className="sector-tag">
            <span className="status-dot" />
            {survey.sector_name}
          </div>
        </div>

        {/* 2. TELA DE INÍCIO & ACOLHIMENTO (Telas 3 e 5) */}
        {!started && !done ? (
          tablet ? (
            /* --- TOTEM KIOSK WELCOME (Tela 5: 3eb6337...) --- */
            <section className="welcome-panel text-center max-w-4xl mx-auto my-4 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f2f4f6] text-[#da2f37] border border-[#e0e3e5] mb-5 shadow-sm">
                <Sparkles size={20} className="text-[#da2f37]" />
                <span className="font-semibold text-sm uppercase tracking-wider">
                  Espaço da Voz do Paciente • Ouvidoria & Experiência
                </span>
              </div>

              <h1 className="font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#da2f37] tracking-tight mb-4">
                Bem-vindo(a) ao Hospital Care.
              </h1>

              <p className="lead max-w-2xl text-xl text-[#424750] mb-8 leading-relaxed">
                Sua opinião transforma o nosso atendimento e acolhe quem mais precisa.
              </p>

              {/* Cards de garantia e agilidade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-8 text-left">
                <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-[#dee0e2] text-[#0f3854] flex items-center justify-center shrink-0">
                    <span className="font-bold text-xl">⏱️</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#191c1e]">Rápido e Simples</h3>
                    <p className="text-sm text-[#424750]">Leva menos de 1 minuto para responder.</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-[#ffdad7] text-[#da2f37] flex items-center justify-center shrink-0">
                    <LockKeyhole size={26} className="text-[#da2f37]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#191c1e]">100% Anônimo</h3>
                    <p className="text-sm text-[#424750]">Sua identidade é totalmente preservada.</p>
                  </div>
                </div>
              </div>

              {/* BOTÃO GIGANTE TÁTIL DE ENTRADA (Tela 5) */}
              <button
                type="button"
                onClick={() => setStarted(true)}
                className="w-full max-w-xl h-24 rounded-full bg-[#da2f37] hover:bg-[#ba1a23] text-white flex items-center justify-center gap-4 shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-200 cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-3xl">👆</span>
                </div>
                <span className="font-extrabold text-2xl tracking-wide uppercase">
                  TOQUE AQUI PARA COMEÇAR
                </span>
                <ArrowRight size={32} />
              </button>

              <p className="fine-print mt-5 text-sm text-[#5c5f61] flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#da2f37] animate-pulse" />
                Toque leve em qualquer parte da tela para iniciar sua avaliação.
              </p>
            </section>
          ) : (
            /* --- MOBILE QR WELCOME (Tela 3: 8925997...) --- */
            <section className="welcome-panel max-w-xl mx-auto my-2">
              <div className="welcome-icon">
                <Heart size={44} strokeWidth={1.8} aria-hidden="true" />
              </div>
              <p className="eyebrow">CANAL OFICIAL E SEGURO</p>
              <h1>
                Sua opinião cuida de
                <br />
                quem cuida de você.
              </h1>
              <p className="lead">
                Avalie seu atendimento de forma rápida, segura e 100% anônima direto pelo celular.
              </p>

              <div className="welcome-facts">
                <span>
                  <Check aria-hidden="true" className="text-[#da2f37]" /> Rápido e simples (&lt; 1 min)
                </span>
                <span>
                  <LockKeyhole aria-hidden="true" className="text-[#da2f37]" /> Totalmente anônimo (LGPD)
                </span>
              </div>

              <Button
                size="large"
                variant="warm"
                onClick={() => setStarted(true)}
                className="w-full shadow-lg"
              >
                Iniciar Avaliação Rápida <ArrowRight aria-hidden="true" />
              </Button>

              <p className="fine-print">
                Responda no seu ritmo. Você pode pular etapas e focar no que achar importante.
              </p>
            </section>
          )
        ) : done ? (
          /* 3. TELA DE SUCESSO & PROTOCOLO (Telas 4 e 8) */
          <section className="success-panel max-w-2xl mx-auto my-4 text-center">
            {/* Círculo com check animado (Tela 8) */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#10b981] to-[#059669] text-white flex items-center justify-center mx-auto mb-4 shadow-xl">
              <CircleCheck size={60} strokeWidth={2.2} aria-hidden="true" />
            </div>

            <h1 ref={heading} tabIndex={-1} className="font-extrabold text-3xl text-[#191c1e] mb-3">
              Muito Obrigado pela sua Avaliação!
            </h1>

            <p className="text-lg text-[#424750] max-w-md mx-auto mb-5 leading-relaxed">
              {demo
                ? "Você concluiu a demonstração da pesquisa. As escolhas foram registradas no ambiente de testes."
                : "Sua opinião foi registrada com sucesso e ajuda diretamente a aprimorar o atendimento aos nossos pacientes."}
            </p>

            {/* Badge de Protocolo Anônimo */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#eceef0] border border-[#c2c6d2] text-[#0f3854] font-semibold text-sm mb-6 shadow-inner">
              <ShieldCheck size={20} className="text-[#10b981]" />
              <span>Protocolo: {protocol || "#QR-94218"} • 100% Anônimo</span>
            </div>

            {/* Inatividade e Auto-Reset com Anel SVG (Tela 8) */}
            {tablet && (
              <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-sm max-w-md mx-auto mb-6 flex flex-col items-center">
                <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle
                      className="stroke-[#eceef0] fill-none stroke-[5]"
                      cx="32"
                      cy="32"
                      r="26"
                    />
                    <circle
                      className="stroke-[#da2f37] fill-none stroke-[5] stroke-linecap-round transition-all duration-1000"
                      cx="32"
                      cy="32"
                      r="26"
                      strokeDasharray="163.3"
                      strokeDashoffset={
                        163.3 - (163.3 * remaining) / (survey.tablet_reset_seconds || 15)
                      }
                    />
                  </svg>
                  <span className="absolute font-bold text-xl text-[#da2f37]">{remaining}</span>
                </div>
                <p className="text-sm text-[#424750] font-medium" role="status">
                  A tela reiniciará automaticamente em <strong>{remaining}s</strong> para garantir sua privacidade.
                </p>
                <Button
                  variant="warm"
                  size="large"
                  onClick={reset}
                  className="w-full mt-4 font-bold uppercase tracking-wider"
                >
                  CONCLUIR AGORA <ArrowRight />
                </Button>
              </div>
            )}

            {!tablet && (
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={reset}>
                  <RotateCcw aria-hidden="true" /> Iniciar nova avaliação
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/">
                    <Home aria-hidden="true" /> Voltar ao Início
                  </Link>
                </Button>
              </div>
            )}
          </section>
        ) : (
          /* 4. PERGUNTAS DA PESQUISA (Telas 1, 2, 6, 7) */
          <section className="question-panel" aria-busy={sending}>
            {/* Barra de Progresso com Identificação de Etapa */}
            <div className="survey-progress">
              <span>
                Etapa {step + 1} de {steps.length}
              </span>
              <span className="uppercase text-xs tracking-wider text-[#da2f37] font-bold">
                {current.type === "complaint"
                  ? "Espaço de Ouvidoria"
                  : current.type === "nps"
                    ? "Pergunta Obrigatória"
                    : current.general
                      ? "Avaliação Geral"
                      : "Etapa Opcional por Setor"}
              </span>
            </div>

            <div
              className="progress-track"
              role="progressbar"
              aria-label="Progresso da avaliação"
              aria-valuemin={0}
              aria-valuemax={steps.length}
              aria-valuenow={step + 1}
            >
              <span style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>

            <h1 ref={heading} tabIndex={-1}>
              {current.type === "complaint"
                ? "Deseja um retorno formal da Ouvidoria?"
                : current.text}
            </h1>

            <p className="question-hint">
              {current.type === "nps"
                ? "Esta é a única pergunta obrigatória. Toque na nota de 0 a 10 que representa sua recomendação."
                : current.type === "complaint"
                  ? "Você pode permanecer totalmente anônimo ou, se preferir, informar seu contato para acolhimento."
                  : tablet
                    ? "Toque com a mão ou o dedo indicador em uma das opções abaixo. Não tenha pressa."
                    : "Toque na opção que melhor descreve sua experiência. Se preferir, você pode avançar."}
            </p>

            {/* 4.1 ESCALA CSAT (1 A 5 CARINHAS) - Telas 2 e 7 */}
            {current.type === "rating" && (
              <fieldset className="rating-options">
                <legend className="sr-only">{current.text}</legend>
                {ratingLabels.map((label, i) => {
                  const value = i + 1;
                  const isSelected = answers[current.id] === value;
                  return (
                    <label
                      className={`rating-option ${isSelected ? "selected" : ""}`}
                      key={value}
                    >
                      <input
                        type="radio"
                        className="choice-input"
                        name={current.id}
                        value={value}
                        checked={isSelected}
                        onChange={() => setAnswers({ ...answers, [current.id]: value })}
                        disabled={sending}
                      />
                      <RatingFace value={value} size={tablet ? 72 : 56} />
                      <strong>{label}</strong>
                      <span className="text-xs text-[#5c5f61]">Nível {value} de 5</span>

                      {isSelected && (
                        <span className="choice-check">
                          <Check size={16} aria-hidden="true" strokeWidth={3} />
                          <span className="sr-only">Selecionado</span>
                        </span>
                      )}
                    </label>
                  );
                })}

                <Button
                  variant="ghost"
                  className="clear-rating"
                  onClick={() =>
                    setAnswers((old) => {
                      const copy = { ...old };
                      delete copy[current.id];
                      return copy;
                    })
                  }
                  disabled={!answers[current.id] || sending}
                >
                  Limpar resposta
                </Button>
              </fieldset>
            )}

            {/* 4.2 ESCALA NUMÉRICA NPS (0 A 10) */}
            {current.type === "nps" && (
              <fieldset className="nps-options">
                <legend className="sr-only">Nota de recomendação obrigatória, de 0 a 10</legend>
                <div className="nps-grid">
                  {Array.from({ length: 11 }, (_, value) => (
                    <label
                      key={value}
                      className={`nps-option ${nps === value ? "selected" : ""}`}
                    >
                      <input
                        className="choice-input"
                        type="radio"
                        name="nps"
                        value={value}
                        checked={nps === value}
                        onChange={() => {
                          setNps(value);
                          setError("");
                        }}
                        disabled={sending}
                      />
                      <span>{value}</span>
                    </label>
                  ))}
                </div>
                <div className="scale-captions">
                  <span>0 · Não recomendaria</span>
                  <span>10 · Recomendaria com certeza</span>
                </div>
              </fieldset>
            )}

            {/* 4.3 RECLAMAÇÃO / OUVIDORIA / ELOGIO (Telas 1, 4, 6 e 8) */}
            {current.type === "complaint" && (
              <div className="complaint-fields">
                {/* Opção de Anonimato vs Retorno Formal (Telas 4 e 8) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setWantsContact(false);
                      setContact("");
                      setConsent(false);
                    }}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      !wantsContact
                        ? "bg-[#ffedec] border-[#da2f37] shadow-sm text-[#930016]"
                        : "bg-white border-[#c2c6d2] text-[#424750] hover:bg-[#f2f4f6]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        !wantsContact ? "bg-[#da2f37] text-white" : "bg-[#e0e3e5] text-transparent"
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <div>
                      <strong className="block text-base">Não precisa, prefiro manter anônimo</strong>
                      <span className="text-xs">Sua opinião será contabilizada sem identificação pessoal.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWantsContact(true)}
                    className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                      wantsContact
                        ? "bg-[#ffedec] border-[#da2f37] shadow-sm text-[#930016]"
                        : "bg-white border-[#c2c6d2] text-[#424750] hover:bg-[#f2f4f6]"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        wantsContact ? "bg-[#da2f37] text-white" : "bg-[#e0e3e5] text-transparent"
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </div>
                    <div>
                      <strong className="block text-base">Sim, quero receber retorno da Ouvidoria</strong>
                      <span className="text-xs">Informe seu telefone ou WhatsApp para acolhimento da equipe.</span>
                    </div>
                  </button>
                </div>

                {/* Pills de Sugestão Rápida para o Comentário */}
                <div className="mb-2">
                  <label className="block text-sm font-semibold text-[#191c1e] mb-2">
                    Toque para adicionar frases prontas ao seu relato:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TAGS.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagClick(tag)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#f2f4f6] hover:bg-[#ffedec] hover:text-[#da2f37] text-[#191c1e] border border-[#e0e3e5] transition-all active:scale-95 shadow-sm"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <label htmlFor={`${instanceId}-comment`}>
                  Seu relato ou sugestão <span>(opcional)</span>
                </label>
                <textarea
                  id={`${instanceId}-comment`}
                  rows={3}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={sending}
                  placeholder="Conte o que aconteceu ou deixe um elogio nominal à equipe..."
                />

                {/* Campo de Telefone e Teclado Virtual (apenas se optou por retorno) */}
                {wantsContact && (
                  <div className="bg-[#f7f9fb] p-4 rounded-2xl border border-[#c2c6d2] mt-2">
                    <label htmlFor={`${instanceId}-contact`} className="flex items-center gap-2 mb-2">
                      <Phone size={18} className="text-[#da2f37]" />
                      <span>Telefone ou WhatsApp com DDD</span>
                    </label>

                    <input
                      id={`${instanceId}-contact`}
                      type="tel"
                      autoComplete="off"
                      maxLength={30}
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      disabled={sending}
                      placeholder="(DDD) 99999-9999"
                      className="text-center font-bold text-lg tracking-wider"
                    />

                    {/* TECLADO VIRTUAL TÁTIL PARA TOTEM (Tela 8) */}
                    {tablet && (
                      <div className="mt-4 pt-3 border-t border-[#e0e3e5]">
                        <p className="text-xs text-center text-[#5c5f61] mb-2 font-medium">
                          Teclado Numérico Tátil da Tela:
                        </p>
                        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => handleKeypadPress(num)}
                              className="h-14 rounded-xl bg-white border border-[#c2c6d2] font-bold text-xl text-[#0f3854] shadow-sm active:translate-y-0.5 hover:bg-[#ffedec] hover:text-[#da2f37] transition-all"
                            >
                              {num}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={handleKeypadClear}
                            className="h-14 rounded-xl bg-[#eceef0] border border-[#c2c6d2] font-semibold text-xs text-[#5c5f61] shadow-sm active:translate-y-0.5"
                          >
                            LIMPAR
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKeypadPress("0")}
                            className="h-14 rounded-xl bg-white border border-[#c2c6d2] font-bold text-xl text-[#0f3854] shadow-sm active:translate-y-0.5 hover:bg-[#ffedec] hover:text-[#da2f37] transition-all"
                          >
                            0
                          </button>
                          <button
                            type="button"
                            onClick={handleKeypadBackspace}
                            className="h-14 rounded-xl bg-[#eceef0] border border-[#c2c6d2] flex items-center justify-center text-[#ba1a1a] shadow-sm active:translate-y-0.5"
                            aria-label="Apagar dígito"
                          >
                            <Delete size={22} />
                          </button>
                        </div>
                      </div>
                    )}

                    <label className="consent-label mt-3">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        disabled={sending}
                      />
                      <span className="text-sm">
                        Autorizo a ouvidoria a usar este telefone exclusivamente para retorno sobre esta avaliação.
                      </span>
                    </label>
                  </div>
                )}

                <p className="privacy-note mt-3">
                  <LockKeyhole size={18} aria-hidden="true" className="text-[#da2f37]" />
                  <span>Protegido conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018 - LGPD).</span>
                </p>
              </div>
            )}

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            {/* NAVEGAÇÃO TÁTIL DA PESQUISA (Telas 6 e 7) */}
            <nav className="survey-navigation" aria-label="Navegação da pesquisa">
              <Button
                variant="outline"
                disabled={sending}
                onClick={() => {
                  setError("");
                  if (step === 0) setStarted(false);
                  else setStep(step - 1);
                }}
              >
                <ArrowLeft aria-hidden="true" /> Voltar
              </Button>

              <Button size="large" variant="warm" disabled={sending} onClick={next}>
                {sending ? (
                  <>
                    <LoaderCircle className="spinner" aria-hidden="true" /> Enviando…
                  </>
                ) : step === steps.length - 1 ? (
                  <>
                    Enviar avaliação <Check aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Avançar <ArrowRight aria-hidden="true" />
                  </>
                )}
              </Button>
            </nav>
          </section>
        )}

        <footer className="survey-footer">
          <ShieldCheck size={20} className="text-[#10b981]" aria-hidden="true" />
          <span>FHDOD · Escutar para cuidar melhor • 100% Anônimo</span>
        </footer>
      </main>
    </div>
  );
}
