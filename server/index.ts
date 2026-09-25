import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import crypto from "crypto";

const __filename=fileURLToPath(import.meta.url),__dirname=path.dirname(__filename);
const DATA_DIR=process.env.DATA_DIR||path.resolve(process.cwd(),"data"),STORE=path.join(DATA_DIR,"imports.json");
const ADMIN_USER=process.env.ADMIN_USER||"admin",ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"",SESSION_SECRET=process.env.SESSION_SECRET||"";

type Metric={label:string;value:number|null;text?:string};
type Row={ine:string;cnes:string;establishment:string;name:string;teamType:string;value:number|null;classification:string;practices:{label:string;value:number|null}[];metrics?:Metric[];dimension?:string;indicator?:string;finalValue?:number|null;finalClassification?:string};
type Hist={id:string;filename:string;panelId:string;datasetType:string;competence:string;rows:number;importedAt:string;user:string};
type Store={datasets:Record<string,Record<string,Row[]>>;history:Hist[]};
const emptyStore=():Store=>({datasets:{},history:[]});
function readStore():Store{try{return JSON.parse(fs.readFileSync(STORE,"utf8"))}catch{return emptyStore()}}
function writeStore(s:Store){fs.mkdirSync(DATA_DIR,{recursive:true});const tmp=STORE+".tmp";fs.writeFileSync(tmp,JSON.stringify(s,null,2));fs.renameSync(tmp,STORE)}
function cookie(req:express.Request,name:string){for(const p of (req.headers.cookie||"").split(";")){const [k,...v]=p.trim().split("=");if(k===name)return decodeURIComponent(v.join("="))}return ""}
function sign(p:string){return crypto.createHmac("sha256",SESSION_SECRET).update(p).digest("base64url")}
function makeSession(user:string){const p=Buffer.from(JSON.stringify({u:user,e:Date.now()+8*60*60*1000})).toString("base64url");return p+"."+sign(p)}
function sessionUser(req:express.Request){if(!SESSION_SECRET)return null;const [p,s]=cookie(req,"ss_admin").split(".");if(!p||!s)return null;const expected=sign(p);if(s.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(s)))return null;try{const x=JSON.parse(Buffer.from(p,"base64url").toString());return x.e>Date.now()?x.u:null}catch{return null}}
function auth(req:express.Request,res:express.Response,next:express.NextFunction){const u=sessionUser(req);if(!u)return res.status(401).json({error:"Não autenticado"});(req as any).adminUser=u;next()}
function safeEq(a:string,b:string){const ah=crypto.createHash("sha256").update(a).digest(),bh=crypto.createHash("sha256").update(b).digest();return crypto.timingSafeEqual(ah,bh)}
function clean(v:string){return (v||"").replace(/^"|"$/g,"").replace(/\t/g,"").trim()}
function parseLine(line:string){const out:string[]=[];let cur="",q=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(q&&line[i+1]==='"'){cur+='"';i++}else q=!q}else if(c===';'&&!q){out.push(clean(cur));cur=""}else cur+=c}out.push(clean(cur));return out}
function num(v:string){let s=clean(v);if(!s||s==="-")return null;if(/^[-+]?\d{1,3}(\.\d{3})+,\d+$/.test(s))s=s.replace(/\./g,"").replace(",",".");else if(s.includes(","))s=s.replace(/\./g,"").replace(",",".");const x=Number(s);return Number.isFinite(x)?x:null}
function idx(headers:string[],...names:string[]){return headers.findIndex(h=>names.some(n=>h.toLocaleLowerCase("pt-BR").trim()===n.toLocaleLowerCase("pt-BR").trim()))}
function findHeader(lines:string[],quadr=false){return lines.findIndex(l=>quadr?l.startsWith("Quadrimestre;"):l.includes("INE;")&&(l.includes("NOME DA EQUIPE")||l.includes("NOME DA EQUIPE\t")))}

const apsMap:[RegExp,string][]=[[/Mais_Acesso|Mais Acesso/i,"acesso"],[/desenvolvimento_infantil|desenvolvimento infantil/i,"infantil"],[/Gestação|Gestacao/i,"gestante"],[/Diabetes/i,"diabetes"],[/Hipertensão|Hipertensao/i,"hipertensao"],[/pessoa_idosa|pessoa idosa/i,"idosa"],[/prevenção_do_câncer|prevenção do câncer|prevencao_do_cancer/i,"cancer"]];
const oralMap:[RegExp,string][]=[[/Primeira_consulta_odontológica|Primeira consulta odontológica/i,"b1"],[/Tratamento_Odontológico_Concluído|Tratamento Odontológico Concluído/i,"b2"],[/Taxa_de_exodontias|Taxa de exodontias/i,"b3"],[/Escovação_supervisionada|Escovação supervisionada/i,"b4"],[/Procedimentos_odontológicos_individuais_preventivos|Procedimentos odontológicos individuais preventivos/i,"b5"],[/Tratamento_Restaurador_Atraumático|Tratamento Restaurador Atraumático/i,"b6"]];
function detect(filename:string,content:string){
 const probe=filename+"\n"+content.slice(0,2200);
 if(/Desempenho Quadrimestral\s*-\s*Componente (Vínculo|Vinculo) e Acompanhamento Territorial/i.test(probe)||/Quadrimestre_Cvat/i.test(probe)||(/Quadrimestre;CNES;Estabelecimento;INE;Tipo de Equipe;Nome da Equipe;Dimensão Cadastro;Dimensão Acompanhamento;Nota Final;Classificação Final/i.test(content)))return {id:"quadrimestral-cvat",type:"Quadrimestral — Vínculo e Acompanhamento Territorial"};
 if(/Desempenho Quadrimestral\s*-\s*Componente Qualidade/i.test(probe)||/Quadrimestre_Qualidade/i.test(probe)||/Quadrimestre;CNES;Estabelecimento;INE;Tipo de Equipe;Nome da Equipe;Nota Final;Classificação Final/i.test(content))return {id:"quadrimestral-qualidade",type:"Quadrimestral — Componente Qualidade"};
 if(/Visão_Geral_-_Componente_Vínculo|Visão Geral - Componente Vínculo/i.test(probe))return {id:"territorial",type:"Vínculo e Acompanhamento Territorial — visão geral"};
 if(/Componente_Vínculo_e_Acompanhamento_Territorial|Componente Vínculo e Acompanhamento Territorial/i.test(probe))return {id:"territorial-detalhe",type:"Vínculo e Acompanhamento Territorial — detalhado"};
 for(const [r,id] of oralMap)if(r.test(probe))return {id,type:`Saúde Bucal ${id.toUpperCase()}`};for(const [r,id] of apsMap)if(r.test(probe))return {id,type:`APS ${id}`};return null}
function parseStandard(filename:string,content:string,d:{id:string,type:string}){const lines=content.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean);const hm=content.match(/Competência selecionada:\s*([^\r\n]+)/i);let competence=hm?clean(hm[1]):"";const hi=findHeader(lines);if(hi<0)throw new Error("Cabeçalho SIAPS não reconhecido.");const h=parseLine(lines[hi]),b=baseIndexes(h),iComp=idx(h,"Competência/Ano");if([b.cnes,b.est,b.ine,b.name].some(i=>i<0))throw new Error("Colunas de equipe obrigatórias não encontradas.");const ratio=h.findIndex(x=>/RAZÃO ENTRE O NUMERADOR E DENOMINADOR/i.test(x));const cls=h.findIndex(x=>/^Classificação$/i.test(x));const cvatVal=h.findIndex(x=>/^PONTUAÇÃO$/i.test(x)||/^Resultado do Componente Vínculo/i.test(x));const cvatCls=h.findIndex(x=>/Classificação do Componente Vínculo/i.test(x));const valueIx=ratio>=0?ratio:cvatVal;const classIx=cls>=0?cls:cvatCls;const identity=new Set([iComp,1,2,3,4,b.cnes,b.est,7,b.ine,b.name,b.team,valueIx,classIx]);const rows:Row[]=[];
 for(const line of lines.slice(hi+1)){const c=parseLine(line);const ine=clean(c[b.ine]||"");if(!ine)continue;if(!competence&&iComp>=0)competence=clean(c[iComp]||"");const metrics=h.map((label,i)=>({label,i})).filter(x=>x.i>=0&&!identity.has(x.i)&&x.i>10).map(x=>({label:x.label,value:num(c[x.i]),text:num(c[x.i])===null?clean(c[x.i]):undefined}));let practices:{label:string;value:number|null}[]=[];if(d.id.startsWith("b")){const practiceIx=11;practices=[{label:h[practiceIx],value:num(c[practiceIx])}]}else if(!d.id.startsWith("territorial")){practices=metrics.map(m=>({label:m.label,value:m.value}))}
 rows.push({ine,cnes:clean(c[b.cnes]),establishment:clean(c[b.est]),name:clean(c[b.name]),teamType:b.team>=0?clean(c[b.team]):"",value:valueIx>=0?num(c[valueIx]):null,classification:classIx>=0?clean(c[classIx]):"",practices,metrics});}
 if(!competence||!rows.length)throw new Error("Não foi possível identificar competência/equipes.");return {panelId:d.id,datasetType:d.type,competence,rows};}
function parseQuadrimestral(filename:string,content:string,d:{id:string,type:string}){
 const lines=content.replace(/^\uFEFF/,"").split(/\r?\n/).filter(Boolean),hi=findHeader(lines,true);if(hi<0)throw new Error("Cabeçalho quadrimestral não reconhecido.");
 const h=parseLine(lines[hi]),b=baseIndexes(h),iQ=idx(h,"Quadrimestre"),iCad=idx(h,"Dimensão Cadastro"),iAcomp=idx(h,"Dimensão Acompanhamento"),iDim=idx(h,"Dimensão"),iInd=idx(h,"Indicador"),iResult=idx(h,"Resultado do Quadrimestre Média dos meses"),iDimClass=idx(h,"Classificação final da Dimensão"),iConcept=idx(h,"Conceito obtido do indicador no quadrimestre"),iFinal=idx(h,"Nota Final","Nota final da equipe","NOTA FINAL DA EQUIPE"),iFinalClass=idx(h,"Classificação Final","Classificação final","CLASSIFICAÇÃO FINAL");
 if(iQ<0||[b.cnes,b.est,b.ine,b.name].some(i=>i<0)||iFinal<0||iFinalClass<0)throw new Error("Colunas quadrimestrais obrigatórias não encontradas.");
 const byPeriod:Record<string,Row[]>={};
 for(const line of lines.slice(hi+1)){
  const c=parseLine(line),period=clean(c[iQ]||""),ine=clean(c[b.ine]||"");if(!/^Q[1-3]\/\d{2}$/i.test(period)||!ine)continue;
  const finalValue=num(c[iFinal]),finalClassification=clean(c[iFinalClass]);
  const metrics:Metric[]=[];if(iCad>=0)metrics.push({label:"Dimensão Cadastro",value:num(c[iCad])});if(iAcomp>=0)metrics.push({label:"Dimensão Acompanhamento",value:num(c[iAcomp])});
  const value=iResult>=0?num(c[iResult]):finalValue,classification=iConcept>=0?clean(c[iConcept]):iDimClass>=0?clean(c[iDimClass]):finalClassification;
  (byPeriod[period]??=[]).push({ine,cnes:clean(c[b.cnes]),establishment:clean(c[b.est]),name:clean(c[b.name]),teamType:b.team>=0?clean(c[b.team]):"",value,classification,practices:[],metrics,dimension:iDim>=0?clean(c[iDim]):undefined,indicator:iInd>=0?clean(c[iInd]):undefined,finalValue,finalClassification});
 }
 const periods=Object.keys(byPeriod).sort((a,b)=>{const [qa,ya]=a.slice(1).split('/').map(Number),[qb,yb]=b.slice(1).split('/').map(Number);return ya-yb||qa-qb});
 if(!periods.length)throw new Error("Não foi possível identificar quadrimestres/equipes.");
 return {panelId:d.id,datasetType:d.type,periods:periods.map(competence=>({competence,rows:byPeriod[competence]}))};
}
function parseSiaps(filename:string,content:string){const d=detect(filename,content);if(!d)throw new Error("Tipo de relatório não reconhecido. Aceitos: C1–C7, B1–B6, Territorial e Quadrimestral.");if(d.id.startsWith("quadrimestral-"))return parseQuadrimestral(filename,content,d);const p=parseStandard(filename,content,d);return {...p,periods:[{competence:p.competence,rows:p.rows}]}}

async function startServer(){const app=express(),server=createServer(app);app.disable("x-powered-by");app.use(express.json({limit:"15mb"}));
 app.get("/api/health",(_q,r)=>r.json({ok:true,adminConfigured:Boolean(ADMIN_PASSWORD&&SESSION_SECRET)}));
 app.post("/api/admin/login",(req,res)=>{if(!ADMIN_PASSWORD||!SESSION_SECRET)return res.status(503).json({error:"Área administrativa ainda não configurada no servidor."});const {user,password}=req.body||{};if(!safeEq(String(user||""),ADMIN_USER)||!safeEq(String(password||""),ADMIN_PASSWORD))return res.status(401).json({error:"Usuário ou senha inválidos."});res.setHeader("Set-Cookie",`ss_admin=${encodeURIComponent(makeSession(ADMIN_USER))}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==="production"?"; Secure":""}`);res.json({ok:true,user:ADMIN_USER})});
 app.post("/api/admin/logout",(_q,res)=>{res.setHeader("Set-Cookie",`ss_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV==="production"?"; Secure":""}`);res.json({ok:true})});app.get("/api/admin/me",auth,(req,res)=>res.json({user:(req as any).adminUser}));app.get("/api/admin/history",auth,(_q,res)=>res.json(readStore().history.slice().reverse()));
 app.post("/api/admin/import",auth,(req,res)=>{try{const filename=String(req.body?.filename||""),content=String(req.body?.content||"");if(!filename.toLowerCase().endsWith(".csv"))return res.status(400).json({error:"Selecione um arquivo CSV."});if(!content||content.length>12_000_000)return res.status(400).json({error:"Arquivo vazio ou acima de 12 MB."});const p=parseSiaps(filename,content),s=readStore();s.datasets[p.panelId]??={};const conflicts=p.periods.filter(x=>Boolean(s.datasets[p.panelId][x.competence])).map(x=>x.competence);const summary={panelId:p.panelId,datasetType:p.datasetType,competence:p.periods.length===1?p.periods[0].competence:`${p.periods.length} quadrimestres`,periods:p.periods.map(x=>({competence:x.competence,rows:x.rows.length,replaced:conflicts.includes(x.competence)})),rows:p.periods.reduce((n,x)=>n+x.rows.length,0),replaced:conflicts.length>0};if(conflicts.length&&!req.body?.overwrite)return res.status(409).json({error:`${p.datasetType}: já existem dados para ${conflicts.join(", ")}. Confirme a substituição desses períodos.`,needsOverwrite:true,summary});for(const x of p.periods){s.datasets[p.panelId][x.competence]=x.rows;s.history.push({id:crypto.randomUUID(),filename,panelId:p.panelId,datasetType:p.datasetType,competence:x.competence,rows:x.rows.length,importedAt:new Date().toISOString(),user:(req as any).adminUser})}writeStore(s);res.json({ok:true,summary})}catch(e:any){res.status(400).json({error:e?.message||"Falha ao importar CSV."})}});
 app.get("/api/data/:panelId",(req,res)=>{res.setHeader("Cache-Control","no-store");res.json(readStore().datasets[req.params.panelId]||{})});
 const staticPath=process.env.NODE_ENV==="production"?path.resolve(__dirname,"public"):path.resolve(__dirname,"..","dist","public");app.use(express.static(staticPath));app.get("*",(_q,res)=>res.sendFile(path.join(staticPath,"index.html")));server.listen(process.env.PORT||3000,()=>console.log(`Server running on port ${process.env.PORT||3000}`))}
startServer().catch(console.error);
