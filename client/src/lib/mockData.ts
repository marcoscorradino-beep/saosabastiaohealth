// Mock data for São Sebastião Health Dashboard
// Replace with real data from your API or database

export interface Team {
  id: string;
  name: string;
  competency: string;
}

export interface Indicator {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: "up" | "down" | "stable";
  goalType?: "min" | "max";
}

export interface PanelData {
  title: string;
  description: string;
  teams: Team[];
  indicators: Indicator[];
  totalTeams: number;
  totalIndicators: number;
  lastUpdate: string;
}

// Teams data
const teams: Team[] = [
  { id: "1", name: "USF Boraceia", competency: "Competência" },
  { id: "2", name: "USF Barra do Una", competency: "Competência" },
  { id: "3", name: "USF Juquehy I", competency: "Competência" },
  { id: "4", name: "USF Juquehy II", competency: "Competência" },
  { id: "5", name: "USF Barra do Sahy", competency: "Competência" },
  { id: "6", name: "USF Camburi I", competency: "Competência" },
  { id: "7", name: "USF Camburi II", competency: "Competência" },
  { id: "8", name: "USF Boiçucanga I", competency: "Competência" },
  { id: "9", name: "USF Boiçucanga II", competency: "Competência" },
  { id: "10", name: "USF Maresias I", competency: "Competência" },
  { id: "11", name: "USF Maresias II", competency: "Competência" },
  { id: "12", name: "USF Maresias III", competency: "Competência" },
  { id: "13", name: "USF Pauba", competency: "Competência" },
  { id: "14", name: "USF Barequeçaba", competency: "Competência" },
  { id: "15", name: "USF Varadouro", competency: "Competência" },
  { id: "16", name: "USF Olaria", competency: "Competência" },
  { id: "17", name: "USF Itatinga I", competency: "Competência" },
  { id: "18", name: "USF Itatinga II", competency: "Competência" },
  { id: "19", name: "USF Centro", competency: "Competência" },
  { id: "20", name: "USF Pontal da Cruz", competency: "Competência" },
  { id: "21", name: "USF Morro do Abrigo", competency: "Competência" },
  { id: "22", name: "USF São Francisco", competency: "Competência" },
  { id: "23", name: "USF Enseada I", competency: "Competência" },
  { id: "24", name: "USF Enseada II", competency: "Competência" },
  { id: "25", name: "USF Jaragua", competency: "Competência" },
  { id: "26", name: "USF Canto do Mar", competency: "Competência" },
];

// Panel data for each health care area
export const panelsData = {
  infantil: {
    title: "Painel de Desenvolvimento Infantil",
    description: "Acompanhamento do desenvolvimento de crianças",
    teams,
    indicators: [
      { id: "1", name: "Crianças Avaliadas", value: 1250, target: 1500, unit: "pessoas", trend: "up" as const },
      { id: "2", name: "Desenvolvimento Normal", value: 92, target: 95, unit: "%", trend: "stable" as const },
      { id: "3", name: "Intervenções Realizadas", value: 180, target: 200, unit: "casos", trend: "up" as const },
      { id: "4", name: "Taxa de Adesão", value: 87, target: 90, unit: "%", trend: "up" as const },
      { id: "5", name: "Satisfação das Famílias", value: 94, target: 95, unit: "%", trend: "stable" as const },
    ],
    totalTeams: 26,
    totalIndicators: 5,
    lastUpdate: "Agosto de 2025",
  },
  diabetes: {
    title: "Painel de Cuidado da Pessoa com Diabetes",
    description: "Monitoramento de pacientes com diabetes",
    teams,
    indicators: [
      { id: "1", name: "Pacientes Registrados", value: 2840, target: 3000, unit: "pessoas", trend: "up" as const },
      { id: "2", name: "Controle Glicêmico", value: 78, target: 85, unit: "%", trend: "up" as const },
      { id: "3", name: "Consultas Realizadas", value: 4520, target: 5000, unit: "consultas", trend: "stable" as const },
      { id: "4", name: "Medicações Prescritas", value: 2650, target: 2800, unit: "prescrições", trend: "up" as const },
      { id: "5", name: "Complicações Evitadas", value: 156, target: 200, unit: "casos", trend: "up" as const },
      { id: "6", name: "Qualidade de Vida", value: 81, target: 90, unit: "%", trend: "stable" as const },
    ],
    totalTeams: 26,
    totalIndicators: 6,
    lastUpdate: "Agosto de 2025",
  },
  gestante: {
    title: "Painel de Cuidado da Gestante e Puérpera",
    description: "Cuidado pré e pós-natal",
    teams,
    indicators: [
      { id: "1", name: "Gestantes Acompanhadas", value: 420, target: 500, unit: "pessoas", trend: "up" as const },
      { id: "2", name: "Pré-Natal Completo", value: 89, target: 95, unit: "%", trend: "up" as const },
      { id: "3", name: "Partos Acompanhados", value: 145, target: 160, unit: "partos", trend: "stable" as const },
      { id: "4", name: "Puérperas Visitadas", value: 138, target: 155, unit: "visitas", trend: "up" as const },
      { id: "5", name: "Aleitamento Materno", value: 91, target: 95, unit: "%", trend: "stable" as const },
    ],
    totalTeams: 26,
    totalIndicators: 5,
    lastUpdate: "Agosto de 2025",
  },
  hipertensao: {
    title: "Painel de Cuidado da Pessoa com Hipertensão",
    description: "Controle de pressão arterial",
    teams,
    indicators: [
      { id: "1", name: "Hipertensos Registrados", value: 3200, target: 3500, unit: "pessoas", trend: "up" as const },
      { id: "2", name: "Pressão Controlada", value: 72, target: 80, unit: "%", trend: "up" as const },
      { id: "3", name: "Medicações Prescritas", value: 2980, target: 3200, unit: "prescrições", trend: "stable" as const },
      { id: "4", name: "Consultas Realizadas", value: 5120, target: 5500, unit: "consultas", trend: "up" as const },
      { id: "5", name: "Comorbidades Controladas", value: 68, target: 75, unit: "%", trend: "up" as const },
    ],
    totalTeams: 26,
    totalIndicators: 5,
    lastUpdate: "Agosto de 2025",
  },
  acesso: {
    title: "Painel de Mais Acesso",
    description: "Acesso à atenção primária",
    teams,
    indicators: [
      { id: "1", name: "Consultas Agendadas", value: 12500, target: 15000, unit: "consultas", trend: "up" as const },
      { id: "2", name: "Consultas Realizadas", value: 11800, target: 14500, unit: "consultas", trend: "up" as const },
      { id: "3", name: "Taxa de Absenteísmo", value: 5, target: 3, unit: "%", trend: "down" as const, goalType: "min" as const },
      { id: "4", name: "Tempo Médio de Espera", value: 15, target: 10, unit: "minutos", trend: "down" as const, goalType: "min" as const },
      { id: "5", name: "Satisfação do Usuário", value: 88, target: 95, unit: "%", trend: "up" as const },
    ],
    totalTeams: 26,
    totalIndicators: 5,
    lastUpdate: "Agosto de 2025",
  },
  idosa: {
    title: "Painel de Cuidado da Pessoa Idosa",
    description: "Cuidado integral da pessoa idosa",
    teams,
    indicators: [
      { id: "1", name: "Idosos Acompanhados", value: 1680, target: 2000, unit: "pessoas", trend: "up" as const },
      { id: "2", name: "Fragilidade Avaliada", value: 85, target: 95, unit: "%", trend: "up" as const },
      { id: "3", name: "Quedas Prevenidas", value: 240, target: 300, unit: "casos", trend: "up" as const },
      { id: "4", name: "Medicações Revisadas", value: 1450, target: 1800, unit: "revisões", trend: "up" as const },
      { id: "5", name: "Qualidade de Vida", value: 79, target: 85, unit: "%", trend: "stable" as const },
    ],
    totalTeams: 26,
    totalIndicators: 5,
    lastUpdate: "Agosto de 2025",
  },
  cancer: {
    title: "Painel de Prevenção do Câncer",
    description: "Prevenção do câncer na mulher",
    teams,
    indicators: [
      { id: "1", name: "Mulheres Rastreadas", value: 4200, target: 5000, unit: "pessoas", trend: "up" as const },
      { id: "2", name: "Mamografias Realizadas", value: 2100, target: 2500, unit: "exames", trend: "up" as const },
      { id: "3", name: "Citologia Cervical", value: 2050, target: 2400, unit: "exames", trend: "up" as const },
      { id: "4", name: "Casos Detectados Precocemente", value: 45, target: 50, unit: "casos", trend: "stable" as const },
      { id: "5", name: "Taxa de Positividade", value: 2.1, target: 2.5, unit: "%", trend: "stable" as const },
    ],
    totalTeams: 26,
    totalIndicators: 5,
    lastUpdate: "Agosto de 2025",
  },
  acompanhamento: {
    title: "Painel de Acompanhamento e Vínculo",
    description: "Acompanhamento e vínculo com usuários",
    teams,
    indicators: [
      { id: "1", name: "Usuários Vinculados", value: 8500, target: 10000, unit: "pessoas", trend: "up" as const },
      { id: "2", name: "Taxa de Adesão", value: 85, target: 95, unit: "%", trend: "up" as const },
      { id: "3", name: "Acompanhamentos Realizados", value: 6200, target: 7500, unit: "visitas", trend: "up" as const },
      { id: "4", name: "Satisfação do Usuário", value: 92, target: 95, unit: "%", trend: "stable" as const },
      { id: "5", name: "Taxa de Retorno", value: 88, target: 90, unit: "%", trend: "up" as const },
    ],
    totalTeams: 26,
    totalIndicators: 5,
    lastUpdate: "Agosto de 2025",
  },
};

export const allPanels = [
  {
    id: "infantil",
    title: "Desenvolvimento Infantil",
    description: "Acompanhamento do desenvolvimento de crianças",
    icon: "👶",
    color: "bg-blue-500",
  },
  {
    id: "diabetes",
    title: "Cuidado com Diabetes",
    description: "Monitoramento de pacientes com diabetes",
    icon: "❤️",
    color: "bg-red-500",
  },
  {
    id: "gestante",
    title: "Gestante e Puérpera",
    description: "Cuidado pré e pós-natal",
    icon: "👩‍🤰",
    color: "bg-pink-500",
  },
  {
    id: "hipertensao",
    title: "Cuidado com Hipertensão",
    description: "Controle de pressão arterial",
    icon: "💜",
    color: "bg-purple-500",
  },
  {
    id: "acesso",
    title: "Mais Acesso",
    description: "Acesso à atenção primária",
    icon: "⚡",
    color: "bg-orange-500",
  },
  {
    id: "idosa",
    title: "Pessoa Idosa",
    description: "Cuidado integral da pessoa idosa",
    icon: "👴",
    color: "bg-teal-500",
  },
  {
    id: "cancer",
    title: "Prevenção Câncer",
    description: "Prevenção do câncer na mulher",
    icon: "🎀",
    color: "bg-rose-500",
  },
  {
    id: "acompanhamento",
    title: "Acompanhamento e Vínculo",
    description: "Acompanhamento e vínculo com usuários",
    icon: "🤝",
    color: "bg-green-500",
  },
];
