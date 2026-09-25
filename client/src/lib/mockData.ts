export interface Team { id: string; name: string; competency: string; ine?: string; cnes?: string; value?: number; classification?: string; }
export interface Indicator { id: string; name: string; value: number; target: number; unit: string; trend: "up" | "down" | "stable"; goalType?: "min" | "max"; }
export interface PanelData { title: string; description: string; teams: Team[]; indicators: Indicator[]; totalTeams: number; totalIndicators: number; lastUpdate: string; }
export const panelsData = {} as Record<string, PanelData>;
export const allPanels = [
 {id:"acesso",code:"C1",title:"Mais Acesso",description:"Mais Acesso à Atenção Primária à Saúde",icon:"⚡",color:"bg-orange-500"},
 {id:"infantil",code:"C2",title:"Desenvolvimento Infantil",description:"Cuidado no desenvolvimento infantil",icon:"👶",color:"bg-blue-500"},
 {id:"gestante",code:"C3",title:"Gestação e Puerpério",description:"Cuidado na gestação e puerpério",icon:"🤰",color:"bg-pink-500"},
 {id:"diabetes",code:"C4",title:"Diabetes",description:"Cuidado da pessoa com diabetes",icon:"❤️",color:"bg-red-500"},
 {id:"hipertensao",code:"C5",title:"Hipertensão",description:"Cuidado da pessoa com hipertensão",icon:"💜",color:"bg-purple-500"},
 {id:"idosa",code:"C6",title:"Pessoa Idosa",description:"Cuidado da pessoa idosa",icon:"👴",color:"bg-teal-500"},
 {id:"cancer",code:"C7",title:"Prevenção do Câncer",description:"Cuidado da mulher na prevenção do câncer",icon:"🎀",color:"bg-rose-500"},
];
