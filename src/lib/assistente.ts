import type { MascotePose } from "@/components/mascote";
import { PLAN_PRICE_LABEL, TRIAL_DAYS } from "@/lib/plan-constants";

/**
 * Conteúdo do assistente (fase 1, sem IA): uma dica por tela + perguntas rápidas.
 * Quando entrar IA, ela responde no mesmo balão; estas respostas continuam como atalho.
 */

export type AssistenteContexto = {
  orcamentos: number;
  clientes: number;
  pedidosNovos: number;
  temLogo: boolean;
  temDescricao: boolean;
};

export type AssistenteAcao = { label: string; href: string };

export type AssistenteFala = {
  id: string;
  pose: MascotePose;
  texto: string;
  acao?: AssistenteAcao;
};

export type AssistentePergunta = {
  id: string;
  pergunta: string;
  resposta: AssistenteFala;
};

const NOVO_ORCAMENTO: AssistenteAcao = { label: "Criar orçamento", href: "/painel/orcamentos/novo" };

export function dicaDaTela(pathname: string, ctx: AssistenteContexto): AssistenteFala {
  if (pathname.startsWith("/painel/orcamentos/novo")) {
    return {
      id: "novo",
      pose: "explicando",
      texto: "Escolha o cliente, o serviço e o valor. Depois é só salvar e mandar no WhatsApp.",
    };
  }
  if (pathname.startsWith("/painel/orcamentos/")) {
    return {
      id: "orcamento",
      pose: "trabalhando",
      texto:
        "Toque em “Enviar pelo WhatsApp”. O cliente abre o link no celular e aprova, recusa ou pede alteração.",
    };
  }
  if (pathname.startsWith("/painel/pedidos")) {
    if (ctx.pedidosNovos > 0) {
      return {
        id: "pedidos-novos",
        pose: "atencao",
        texto:
          ctx.pedidosNovos === 1
            ? "Chegou 1 pedido novo! Responda rápido: quem manda o orçamento primeiro costuma fechar."
            : `Chegaram ${ctx.pedidosNovos} pedidos novos! Responda rápido: quem manda o orçamento primeiro costuma fechar.`,
      };
    }
    return {
      id: "pedidos",
      pose: "pensando",
      texto: "Quando alguém pedir orçamento pela sua página, eu te aviso por aqui.",
    };
  }
  if (pathname.startsWith("/painel/clientes")) {
    return ctx.clientes === 0
      ? { id: "clientes-vazio", pose: "boas-vindas", texto: "Vamos cadastrar seu primeiro cliente? Também dá para cadastrar direto ao criar um orçamento." }
      : { id: "clientes", pose: "dicas", texto: "Busque pelo nome ou telefone. Todo cliente de orçamento entra aqui sozinho." };
  }
  if (pathname.startsWith("/painel/empresa")) {
    if (!ctx.temLogo) {
      return { id: "empresa-logo", pose: "dicas", texto: "Coloque sua logo: o orçamento e a sua página ficam com a sua cara." };
    }
    if (!ctx.temDescricao) {
      return { id: "empresa-descricao", pose: "dicas", texto: "Escreva uma descrição curta do que você faz. Ajuda o cliente a confiar em você." };
    }
    return { id: "empresa", pose: "sucesso", texto: "Sua página está caprichada! Compartilhe o link no Instagram e no status do WhatsApp." };
  }
  if (pathname.startsWith("/painel/plano")) {
    return {
      id: "plano",
      pose: "explicando",
      texto: `São ${TRIAL_DAYS} dias grátis e depois ${PLAN_PRICE_LABEL}. Sem limite de orçamentos.`,
    };
  }
  if (pathname.startsWith("/painel/mais")) {
    return { id: "mais", pose: "dicas", texto: "Aqui você vê seu plano, abre sua página pública e sai da conta." };
  }
  if (ctx.orcamentos === 0) {
    return { id: "inicio-vazio", pose: "boas-vindas", texto: "Oi! Eu sou seu assistente. Vamos montar seu primeiro orçamento?", acao: NOVO_ORCAMENTO };
  }
  return { id: "inicio", pose: "dicas", texto: "Tudo em dia por aqui. Precisa de um orçamento novo?", acao: NOVO_ORCAMENTO };
}

export const perguntasRapidas: AssistentePergunta[] = [
  {
    id: "enviar",
    pergunta: "Como mando o orçamento?",
    resposta: {
      id: "r-enviar",
      pose: "explicando",
      texto:
        "Crie o orçamento e salve. Na tela dele, toque em “Enviar pelo WhatsApp”: a mensagem já vai pronta com o link.",
      acao: NOVO_ORCAMENTO,
    },
  },
  {
    id: "aprovar",
    pergunta: "Como o cliente aprova?",
    resposta: {
      id: "r-aprovar",
      pose: "sucesso",
      texto:
        "Ele abre o link no celular, sem instalar nada, e toca em Aprovar, Recusar ou pede uma alteração. O status muda aqui no Início.",
    },
  },
  {
    id: "pedidos",
    pergunta: "O que são os pedidos?",
    resposta: {
      id: "r-pedidos",
      pose: "pensando",
      texto:
        "São clientes que pediram orçamento pela sua página pública. Você responde montando o orçamento para eles.",
      acao: { label: "Ver pedidos", href: "/painel/pedidos" },
    },
  },
  {
    id: "pagina",
    pergunta: "Como deixo minha página mais bonita?",
    resposta: {
      id: "r-pagina",
      pose: "dicas",
      texto: "Em Página você coloca logo, descrição, fotos dos seus trabalhos e contatos. Tudo aparece para o cliente.",
      acao: { label: "Editar página", href: "/painel/empresa" },
    },
  },
  {
    id: "preco",
    pergunta: "Quanto custa o Orçah?",
    resposta: {
      id: "r-preco",
      pose: "explicando",
      texto: `${TRIAL_DAYS} dias grátis para testar. Depois, ${PLAN_PRICE_LABEL}, com orçamentos ilimitados.`,
      acao: { label: "Ver plano", href: "/painel/plano" },
    },
  },
];
