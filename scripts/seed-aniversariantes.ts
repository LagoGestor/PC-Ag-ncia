import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { PrismaClient } from "../src/generated/prisma/client";

neonConfig.webSocketConstructor = ws;
neonConfig.poolQueryViaFetch = true;

// Importado uma única vez a partir de "PASTA RAIZ - Pastores & Líderes". dia/mes null = data não
// informada na planilha original (ex.: Livia Pimenta, Giorgia Amaral).
const ANIVERSARIANTES: {
  nome: string;
  ministerio: string;
  cargo: string;
  instagram: string;
  dia: number | null;
  mes: number | null;
}[] = [
  { nome: "Esdras Perea", ministerio: "Sede / Missão Global", cargo: "Pastor Regional", instagram: "gabrielaperea", dia: 2, mes: 6 },
  { nome: "Gabriela Perea", ministerio: "Sede / Shine", cargo: "Pastora Regional", instagram: "esdraspereaoficial", dia: 3, mes: 9 },
  { nome: "Richarde Guerra", ministerio: "Gerações / Culto Fé", cargo: "Pastor", instagram: "richarde_guerra", dia: 2, mes: 4 },
  { nome: "Priscila Guerra", ministerio: "Gerações / Culto Fé", cargo: "Pastora", instagram: "priscilallguerra", dia: 12, mes: 6 },
  { nome: "Ezenete Rodrigues", ministerio: "Global", cargo: "Pastora", instagram: "ezenete.rodrigues", dia: 20, mes: 3 },
  { nome: "Ângela Valadão", ministerio: "Global", cargo: "Pastora", instagram: "angelavaladao", dia: 17, mes: 5 },
  { nome: "Márcio Valadão", ministerio: "Global", cargo: "Pastor", instagram: "prmarciovaladao", dia: 24, mes: 11 },
  { nome: "Cassi Valadão", ministerio: "Global", cargo: "Pastora", instagram: "cassi_valadao", dia: 17, mes: 5 },
  { nome: "André Valadão", ministerio: "Global", cargo: "Pastor", instagram: "andrevaladao", dia: 16, mes: 4 },
  { nome: "Cristiane Barcellos", ministerio: "À Mesa", cargo: "Diaconisa", instagram: "cris.barcellosmk", dia: 2, mes: 2 },
  { nome: "Fabricio Barcellos", ministerio: "À Mesa", cargo: "Diácono", instagram: "fabriciopadilhabarcellos", dia: 19, mes: 4 },
  { nome: "Paula Poubel", ministerio: "Acolher", cargo: "Pastora", instagram: "poubelpaulinha", dia: 10, mes: 11 },
  { nome: "Samuel Rofergo", ministerio: "Art Factory", cargo: "Diácono (pastorável)", instagram: "samuelrofergo", dia: 20, mes: 1 },
  { nome: "Francisco Araujo", ministerio: "Capelania", cargo: "Pastor", instagram: "drfranciscogineco", dia: 3, mes: 11 },
  { nome: "Milena Araujo", ministerio: "Capelania", cargo: "Pastora", instagram: "milenahermano10", dia: 22, mes: 2 },
  { nome: "Fernado Saraiva", ministerio: "Carisma", cargo: "Pastor", instagram: "fernandojsaraiva", dia: 29, mes: 3 },
  { nome: "Nathália Delgado", ministerio: "Carisma", cargo: "Pastora", instagram: "nathalia_delgado", dia: 22, mes: 5 },
  { nome: "Thaiana Soares", ministerio: "Centurião", cargo: "Diácono", instagram: "", dia: 5, mes: 9 },
  { nome: "Filipe", ministerio: "Centuriões", cargo: "Diácono", instagram: "filipegpa", dia: 27, mes: 7 },
  { nome: "Alessandro Santos", ministerio: "Champions, Host", cargo: "Diácono", instagram: "alessandro_s", dia: 9, mes: 8 },
  { nome: "Jennyffer Lucy", ministerio: "Champions, Host", cargo: "Diaconisa", instagram: "jennyfferlucypmu", dia: 29, mes: 4 },
  { nome: "Watson Lima", ministerio: "Consolidação", cargo: "Diácono (pastorável)", instagram: "wlimasouza", dia: 16, mes: 5 },
  { nome: "Loiane Lima", ministerio: "Consolidação", cargo: "Diaconisa (pastorável)", instagram: "loianeablima", dia: 22, mes: 6 },
  { nome: "Livia Pimenta", ministerio: "CRIE", cargo: "Diácono", instagram: "liviapimenta", dia: null, mes: null },
  { nome: "Janderson Facchin", ministerio: "CRIE", cargo: "Diaconisa", instagram: "jandersonfacchin", dia: 12, mes: 6 },
  { nome: "Fernanda Nascimento", ministerio: "Diaconia", cargo: "Pastora", instagram: "nandavrd", dia: 13, mes: 1 },
  { nome: "Higor Nascimento", ministerio: "Diaconia", cargo: "Pastor", instagram: "higorgnascimento", dia: 2, mes: 8 },
  { nome: "Rebeca Felix", ministerio: "DNA Dança", cargo: "Pastora", instagram: "rebecanfelix", dia: 5, mes: 5 },
  { nome: "Débora Cristiane", ministerio: "EBD", cargo: "Diaconisa (Pastorável)", instagram: "deboracristiane78", dia: 24, mes: 4 },
  { nome: "Márcio José", ministerio: "EBD", cargo: "Diácono (Pastorável)", instagram: "marcioj_cunha", dia: 2, mes: 9 },
  { nome: "Jô Carvalho", ministerio: "Ephatá", cargo: "Diaconisa", instagram: "joceanna_carvalho", dia: 1, mes: 10 },
  { nome: "Matheus Sadi", ministerio: "Evangelismo", cargo: "Voluntário", instagram: "matheussadi_", dia: 18, mes: 11 },
  { nome: "Eduarda Sadi", ministerio: "Evangelismo", cargo: "Voluntário", instagram: "eduardasadi", dia: 26, mes: 7 },
  { nome: "Marta Perea", ministerio: "Feira Missionária", cargo: "Pastora", instagram: "martagperea", dia: 12, mes: 10 },
  { nome: "Leonardo Felix", ministerio: "Hero", cargo: "Pastor", instagram: "prleofelix", dia: 7, mes: 12 },
  { nome: "Guilherme Santiago", ministerio: "Future", cargo: "Diácono", instagram: "gui_alexander", dia: 23, mes: 9 },
  { nome: "Everton de Andrade", ministerio: "Future", cargo: "Pastor", instagram: "evertonlandrad", dia: 12, mes: 7 },
  { nome: "Thaysa de Andrade", ministerio: "Future", cargo: "Pastora", instagram: "thaysatfa", dia: 28, mes: 2 },
  { nome: "Cezar Perea", ministerio: "Grupos de Crescimento", cargo: "Pastor", instagram: "cezarperea", dia: 5, mes: 2 },
  { nome: "Érica Carvalho Perea", ministerio: "Grupos de Crescimento", cargo: "Pastora", instagram: "erica.carvalho.perea", dia: 28, mes: 10 },
  { nome: "Antonio Ricardo Tamiozzo", ministerio: "Hero +", cargo: "", instagram: "antonioricardotamiozzo", dia: 4, mes: 7 },
  { nome: "Fabio Bulhões", ministerio: "Integração", cargo: "Diácono (pastorável)", instagram: "", dia: 15, mes: 12 },
  { nome: "Emanuelly Bulhoes", ministerio: "Integração", cargo: "Diaconisa (pastorável)", instagram: "emanuellybulhoes", dia: 8, mes: 10 },
  { nome: "Daniel Pedroso", ministerio: "Intercessão", cargo: "Pastor", instagram: "danielscpedroso", dia: 21, mes: 1 },
  { nome: "Leandra Pedroso", ministerio: "Intercessão", cargo: "Pastora", instagram: "leandra_mpedroso", dia: 11, mes: 3 },
  { nome: "Nilson Karlton", ministerio: "kids", cargo: "Diácono (pastorável)", instagram: "nilsonkarlton", dia: 16, mes: 11 },
  { nome: "Marcela Macedo", ministerio: "kids", cargo: "Diaconisa (pastorável)", instagram: "marcelamaacedo", dia: 26, mes: 3 },
  { nome: "Júnior Müller", ministerio: "Legacy", cargo: "Pastor", instagram: "mullerjr_", dia: 24, mes: 5 },
  { nome: "Miry Lopes", ministerio: "Legacy", cargo: "Pastora", instagram: "mirylopes_", dia: 15, mes: 3 },
  { nome: "Rafael Fonseca", ministerio: "Link", cargo: "Diácono (pastorável)", instagram: "rafa.fonz", dia: 30, mes: 10 },
  { nome: "Lorena Tomaz", ministerio: "Link", cargo: "Diaconisa (Pastorável)", instagram: "lo.tomaz", dia: 30, mes: 3 },
  { nome: "Jacson Costa", ministerio: "Louvor", cargo: "Diácono (Pastorável)", instagram: "jacson.sc", dia: 11, mes: 9 },
  { nome: "Paloma Costa", ministerio: "Louvor", cargo: "Diaconisa (Pastorável)", instagram: "palomapssc", dia: 22, mes: 11 },
  { nome: "Yasmin Amany", ministerio: "Meeting Grace", cargo: "Voluntária", instagram: "yasminamany", dia: 17, mes: 5 },
  { nome: "Priscila Godoi", ministerio: "Meeting Grace", cargo: "Voluntária", instagram: "psilagodoi", dia: 8, mes: 3 },
  { nome: "Fábio Melo", ministerio: "Pais", cargo: "Diácono", instagram: "fabio.melosilva", dia: 23, mes: 9 },
  { nome: "Renatha Calazans", ministerio: "Pais", cargo: "Diaconisa", instagram: "renathacalazans", dia: 6, mes: 10 },
  { nome: "Katiana Felix", ministerio: "Pérolas", cargo: "Pastora", instagram: "katianafelixx", dia: 27, mes: 7 },
  { nome: "Bruno Paixão", ministerio: "Planejamento", cargo: "Diácono", instagram: "brunopaixao7", dia: 22, mes: 6 },
  { nome: "Gabriel Santos", ministerio: "Plug", cargo: "Pastor", instagram: "gabrielsantos_1988", dia: 3, mes: 7 },
  { nome: "Julia Viegas", ministerio: "Rocket", cargo: "Pastora", instagram: "viegasju", dia: 19, mes: 7 },
  { nome: "Vladimir Júnior", ministerio: "Rocket", cargo: "Pastor", instagram: "junior_vladi", dia: 29, mes: 7 },
  { nome: "Elisabeth Oliveira", ministerio: "Shine +", cargo: "Pastora", instagram: "elisabethtamiozzo", dia: 1, mes: 10 },
  { nome: "Roberto Felix", ministerio: "Start", cargo: "Pastor", instagram: "prrobertofelix", dia: 13, mes: 1 },
  { nome: "Sany Felix", ministerio: "Start", cargo: "Pastora", instagram: "sanyaraujooficial", dia: 31, mes: 3 },
  { nome: "Leonardo Paixão", ministerio: "Voluntários", cargo: "Pastor", instagram: "leopaixao78", dia: 9, mes: 9 },
  { nome: "Márcia Paixão", ministerio: "Voluntários", cargo: "Pastora", instagram: "", dia: 25, mes: 2 },
  { nome: "Giorgia Amaral", ministerio: "we Care", cargo: "Diaconisa", instagram: "", dia: null, mes: null },
  { nome: "Luiz Augusto", ministerio: "we Care", cargo: "Diácono", instagram: "", dia: 30, mes: 10 },
];

async function main() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const total = await prisma.aniversariante.count();
  if (total > 0) {
    console.log(`[seed-aniversariantes] Já existem ${total} aniversariante(s) cadastrados, nada a fazer.`);
  } else {
    await prisma.aniversariante.createMany({ data: ANIVERSARIANTES });
    console.log(`[seed-aniversariantes] ${ANIVERSARIANTES.length} aniversariante(s) importados da lista de Pastores & Líderes.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("[seed-aniversariantes] Erro ao semear aniversariantes:", err);
  process.exit(1);
});
