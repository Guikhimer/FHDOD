"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="message-page">
      <h1>Não foi possível carregar esta página</h1>
      <p>Confira a conexão e tente novamente.</p>
      <Button onClick={reset}>Tentar novamente</Button>
    </main>
  );
}
