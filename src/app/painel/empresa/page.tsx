import { redirect } from "next/navigation";

// a antiga tela "Página" virou /painel/pagina
export default function EmpresaPainelPage() {
  redirect("/painel/pagina");
}
