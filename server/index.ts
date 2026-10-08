import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import { readStore, saveImport } from "./importStore";
import { hasImportReplacementConflict } from "./importReplacement";
import { buildPublicSummary } from "./publicSummary";
import { buildRegionalComparisonFromDirectory } from "./regionalComparisonStore";
import { readLocalCsvStore } from "./localCsvStore";

const __filename=fileURLToPath(import.meta.url),__dirname=path.dirname(__filename);
const ADMIN_USER=process.env.ADMIN_USER||"admin",ADMIN_PASSWORD=process.env.ADMIN_PASSWORD||"",SESSION_SECRET=process.env.SESSION_SECRET||"";

function cookie(req:express.Request,name:string){for(const p of (req.headers.cookie||"").split(";")){const [k,...v]=p.trim().split("=");if(k===name)return decodeURIComponent(v.join("="))}return ""}
function sign(p:string){return crypto.createHmac("sha256",SESSION_SECRET).update(p).digest("base64url")}
function makeSession(user:string){const p=Buffer.from(JSON.stringify({u:user,e:Date.now()+8*60*60*1000})).toString("base64url");return p+"."+sign(p)}
function sessionUser(req:express.Request){if(!SESSION_SECRET)return null;const [p,s]=cookie(req,"ss_admin").split(".");if(!p||!s)return null;const expected=sign(p);if(s.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(s)))return null;try{const x=JSON.parse(Buffer.from(p,"base64url").toString());return x.e>Date.now()?x.u:null}catch{return null}}
function auth(req:express.Request,res:express.Response,next:express.NextFunction){const u=sessionUser(req);if(!u)return res.status(401).json({error:"Não autenticado"});(req as any).adminUser=u;next()}
function safeEq(a:string,b:string){const ah=crypto.createHash("sha256").update(a).digest(),bh=crypto.createHash("sha256").update(b).digest();return crypto.timingSafeEqual(ah,bh)}

import { parseSiaps } from "./siapsParser";
export { detectPanel, parseSiaps } from "./siapsParser";

async function readPublicStore() {
  if (process.env.DATABASE_URL) {
    return readStore();
  }

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.LOCAL_DATA_DIR
  ) {
    return readLocalCsvStore(process.env.LOCAL_DATA_DIR);
  }

  return readStore();
}

export function registerLegacyRoutes(app:express.Express){
 app.get("/api/health",(_q,r)=>r.json({ok:true,adminConfigured:Boolean(ADMIN_PASSWORD&&SESSION_SECRET),persistentStorage:Boolean(process.env.DATABASE_URL)}));
 app.post("/api/admin/login",(req,res)=>{if(!ADMIN_PASSWORD||!SESSION_SECRET)return res.status(503).json({error:"Área administrativa ainda não configurada no servidor."});const {user,password}=req.body||{};if(!safeEq(String(user||""),ADMIN_USER)||!safeEq(String(password||""),ADMIN_PASSWORD))return res.status(401).json({error:"Usuário ou senha inválidos."});res.setHeader("Set-Cookie",`ss_admin=${encodeURIComponent(makeSession(ADMIN_USER))}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==="production"?"; Secure":""}`);res.json({ok:true,user:ADMIN_USER})});
 app.post("/api/admin/logout",(_q,res)=>{res.setHeader("Set-Cookie",`ss_admin=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${process.env.NODE_ENV==="production"?"; Secure":""}`);res.json({ok:true})});app.get("/api/admin/me",auth,(req,res)=>res.json({user:(req as any).adminUser}));app.get("/api/admin/history",auth,async(_q,res)=>res.json((await readStore()).history));
 app.post("/api/admin/import",auth,async(req,res)=>{try{const filename=String(req.body?.filename||""),content=String(req.body?.content||"");if(!filename.toLowerCase().endsWith(".csv"))return res.status(400).json({error:"Selecione um arquivo CSV."});if(!content||content.length>12_000_000)return res.status(400).json({error:"Arquivo vazio ou acima de 12 MB."});const p=parseSiaps(filename,content),s=await readStore();s.datasets[p.panelId]??={};const conflicts=p.periods.filter(x=>hasImportReplacementConflict(p.panelId,x.rows,s.datasets[p.panelId][x.competence]??[])).map(x=>x.competence);const summary={panelId:p.panelId,datasetType:p.datasetType,competence:p.periods.length===1?p.periods[0].competence:`${p.periods.length} quadrimestres`,periods:p.periods.map(x=>({competence:x.competence,rows:x.rows.length,replaced:conflicts.includes(x.competence)})),rows:p.periods.reduce((n,x)=>n+x.rows.length,0),replaced:conflicts.length>0};if(conflicts.length&&!req.body?.overwrite)return res.status(409).json({error:`${p.datasetType}: já existem dados correspondentes para ${conflicts.join(", ")}. Confirme a substituição desses dados.`,needsOverwrite:true,summary});await saveImport({filename,panelId:p.panelId,datasetType:p.datasetType,periods:p.periods,user:(req as any).adminUser,replacedPeriods:new Set(conflicts)});res.json({ok:true,summary})}catch(e:any){res.status(400).json({error:e?.message||"Falha ao importar CSV."})}});
 app.get("/api/data/:panelId",async(req,res)=>{res.setHeader("Cache-Control","no-store");res.json((await readPublicStore()).datasets[req.params.panelId]||{})});
 app.get("/api/public/summary",async(_req,res)=>{try{res.setHeader("Cache-Control","no-store");res.json(buildPublicSummary((await readPublicStore()).datasets));}catch(e:any){res.status(503).json({error:e?.message||"Dados persistidos indisponíveis."})}});
 app.get("/api/public/comparativo",async(_req,res)=>{try{
  res.setHeader("Cache-Control","no-store");
  const directory=process.env.LOCAL_DATA_DIR;
  if(!directory)return res.status(503).json({error:"Fonte do comparativo regional ainda não configurada."});
  res.json(buildRegionalComparisonFromDirectory(directory));
 }catch(e:any){res.status(503).json({error:e?.message||"Comparativo regional indisponível."})}});
}

export async function startServer(){const app=express(),server=createServer(app);app.disable("x-powered-by");app.use(express.json({limit:"15mb"}));registerLegacyRoutes(app);
 app.use(express.static(process.env.NODE_ENV==="production"?path.resolve(__dirname,"public"):path.resolve(__dirname,"..","dist","public")));
 app.get("*",(_q,res)=>res.sendFile(path.join(process.env.NODE_ENV==="production"?path.resolve(__dirname,"public"):path.resolve(__dirname,"..","dist","public"),"index.html")));
 server.listen(process.env.PORT||3000,()=>console.log(`Server running on port ${process.env.PORT||3000}`))}
if(process.env.LEGACY_SERVER_ENTRY==="true")startServer().catch(console.error);
