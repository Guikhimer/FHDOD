"use client";

import { useState } from "react";
import { ActionForm, type FormState } from "@/components/ActionForm";
import { Button } from "@/components/ui/button";

export function DeleteSurveyForm({
  id,
  title,
  sectorName,
  action,
  disabled = false,
}: {
  id: string;
  title: string;
  sectorName: string;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  disabled?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        variant="outline"
        disabled={disabled}
        aria-label={`Excluir pesquisa ${title} de ${sectorName}`}
        onClick={() => setConfirming(true)}
      >
        Excluir pesquisa
      </Button>
    );
  }

  return (
    <div role="group" aria-label={`Confirmar exclusão da pesquisa de ${sectorName}`}>
      <p>Excluir a pesquisa “{title}” de {sectorName}?</p>
      <p className="field-help">
        A pesquisa deixará de receber respostas e sairá da tela inicial. As avaliações já recebidas
        serão preservadas no histórico.
      </p>
      <ActionForm action={action} label="Confirmar exclusão" disabled={disabled}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="confirmed" value="yes" />
        <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </ActionForm>
    </div>
  );
}
