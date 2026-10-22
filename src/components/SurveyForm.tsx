"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
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
  MessageCircle,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { RatingFace, ratingLabels } from "@/components/RatingFace";
import type { Survey } from "@/types";
type Step =
  | { type: "rating"; id: string; text: string; general: boolean }
  | { type: "nps"; text: string }
  | { type: "complaint" };
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
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(survey.tablet_reset_seconds);
  const submissionId = useRef<string | null>(null);
  const busy = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
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
    setDone(false);
    setError("");
    setRemaining(survey.tablet_reset_seconds);
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
    // A deadline also handles background-tab timer throttling and clock jumps.
    const timer = setTimeout(reset, survey.tablet_reset_seconds * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [done, tablet, reset, survey.tablet_reset_seconds]);
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
      <header className="survey-header">
        <Brand />
        <div className="text-controls" role="group" aria-label="Tamanho do texto">
          <span>Texto</span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Diminuir texto"
            onClick={() => setZoom(Math.max(0, zoom - 1))}
            disabled={zoom === 0}
          >
            A−
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Aumentar texto"
            onClick={() => setZoom(Math.min(3, zoom + 1))}
            disabled={zoom === 3}
          >
            A+
          </Button>
        </div>
      </header>
      {demo && (
        <div className="demo-strip">Demonstração · suas respostas não serão armazenadas.</div>
      )}
      <main id="main" className="survey-main">
        <div className="sector-tag">
          <span className="status-dot" />
          {survey.sector_name}
        </div>
        {!started && !done ? (
          <section className="welcome-panel">
            <div className="welcome-icon">
              <Heart size={44} strokeWidth={1.5} aria-hidden="true" />
            </div>
            <p className="eyebrow">SUA EXPERIÊNCIA IMPORTA</p>
            <h1>
              Queremos cuidar
              <br />
              cada vez melhor.
            </h1>
            <p className="lead">
              Conte como foi o seu atendimento.
              <br />
              Sua opinião ajuda a melhorar nosso hospital.
            </p>
            <div className="welcome-facts">
              <span>
                <Check aria-hidden="true" /> É rápido e simples
              </span>
              <span>
                <LockKeyhole aria-hidden="true" /> Você não precisa se identificar
              </span>
            </div>
            <Button size="large" variant="warm" onClick={() => setStarted(true)}>
              Começar avaliação <ArrowRight aria-hidden="true" />
            </Button>
            <p className="fine-print">
              Responda no seu ritmo. Você pode pular as perguntas,
              <br />
              exceto a nota final de recomendação.
            </p>
          </section>
        ) : done ? (
          <section className="success-panel">
            <CircleCheck size={76} strokeWidth={1.5} aria-hidden="true" />
            <h1 ref={heading} tabIndex={-1}>
              Obrigado por compartilhar!
            </h1>
            <p>
              {demo
                ? "Você concluiu a demonstração da pesquisa."
                : "Sua avaliação foi enviada com sucesso."}
              <br />
              Sua opinião nos ajuda a cuidar melhor de você.
            </p>
            <Button variant="outline" onClick={reset}>
              <RotateCcw aria-hidden="true" /> Iniciar nova avaliação
            </Button>
            {!tablet && (
              <Button variant="ghost" asChild>
                <Link href="/">
                  <Home aria-hidden="true" /> Voltar ao Início
                </Link>
              </Button>
            )}
            {tablet && (
              <p className="fine-print" role="status">
                A tela inicial voltará em {remaining} segundos.
              </p>
            )}
          </section>
        ) : (
          <section className="question-panel" aria-busy={sending}>
            <div className="survey-progress">
              <span>
                Etapa {step + 1} de {steps.length}
              </span>
              <span>
                {current.type === "complaint"
                  ? "Queremos ouvir você"
                  : current.type === "nps"
                    ? "Nota de recomendação"
                    : current.general
                      ? "Sobre o hospital"
                      : "Sobre o atendimento"}
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
              {current.type === "complaint" ? "O que podemos melhorar?" : current.text}
            </h1>
            <p className="question-hint">
              {current.type === "nps"
                ? "Esta é a única pergunta obrigatória. Toque na nota que representa sua opinião."
                : current.type === "complaint"
                  ? "Sentimos que sua experiência poderia ter sido melhor. Se quiser, conte mais para a nossa ouvidoria."
                  : "Toque em uma opção. Se preferir, você pode avançar sem responder."}
            </p>
            {current.type === "rating" && (
              <fieldset className="rating-options">
                <legend className="sr-only">{current.text}</legend>
                {ratingLabels.map((label, i) => {
                  const value = i + 1;
                  return (
                    <label
                      className={`rating-option ${answers[current.id] === value ? "selected" : ""}`}
                      key={value}
                    >
                      <input
                        type="radio"
                        className="choice-input"
                        name={current.id}
                        value={value}
                        checked={answers[current.id] === value}
                        onChange={() => setAnswers({ ...answers, [current.id]: value })}
                        disabled={sending}
                      />
                      <RatingFace value={value} />
                      <strong>
                        {value} · {label}
                      </strong>
                      {answers[current.id] === value && (
                        <span className="choice-check">
                          <Check size={16} aria-hidden="true" />
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
            {current.type === "nps" && (
              <fieldset className="nps-options">
                <legend className="sr-only">Nota de recomendação obrigatória, de 0 a 10</legend>
                <div className="nps-grid">
                  {Array.from({ length: 11 }, (_, value) => (
                    <label key={value} className={`nps-option ${nps === value ? "selected" : ""}`}>
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
            {current.type === "complaint" && (
              <div className="complaint-fields">
                <label htmlFor="comment">
                  Seu comentário <span>(opcional)</span>
                </label>
                <textarea
                  id="comment"
                  rows={4}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={sending}
                  placeholder="Conte o que aconteceu ou deixe uma sugestão."
                />
                <label htmlFor="contact">
                  Telefone ou WhatsApp <span>(opcional)</span>
                </label>
                <input
                  id="contact"
                  type="tel"
                  autoComplete="off"
                  maxLength={30}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  disabled={sending}
                  placeholder="(DDD) 99999-9999"
                />
                <label className="consent-label">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    disabled={sending}
                  />
                  <span>
                    Autorizo a ouvidoria a usar este telefone para falar comigo sobre esta
                    avaliação.
                  </span>
                </label>
                <p className="privacy-note">
                  <LockKeyhole size={20} aria-hidden="true" /> Seu comentário e contato serão vistos
                  somente pela administração.
                </p>
              </div>
            )}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
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
          <MessageCircle size={20} aria-hidden="true" />
          <span>Um hospital melhor começa com a sua opinião.</span>
        </footer>
      </main>
    </div>
  );
}
