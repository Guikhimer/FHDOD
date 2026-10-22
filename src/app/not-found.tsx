import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <main id="main" className="message-page">
      <h1>Pesquisa indisponível</h1>
      <p>Confira o link ou peça ajuda à equipe do setor.</p>
      <Button asChild>
        <Link href="/">Voltar ao Início</Link>
      </Button>
    </main>
  );
}
