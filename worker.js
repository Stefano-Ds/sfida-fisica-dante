import { selectQuestions, publicQuestions, correct } from './questions.js';
import { html, client } from './ui.js';
import { fileBase64, fileName } from './protected-file.js';
const hour=3600000, life=1800000;
function response(body,status=200,extra={}){return new Response(typeof body==='string'||body instanceof Uint8Array?body:JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',...extra}});}
function cookie(token){return {'Set-Cookie':`__Host-quiz=${token}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=3600`};}
function session(req){return req.headers.get('cookie')?.match(/(?:^|;\s*)__Host-quiz=([a-f0-9-]+)/)?.[1];}
async function ipKey(req,env){
  // Cloudflare replaces this header at the trusted edge. Do not trust X-Forwarded-For.
  const ip=req.headers.get('CF-Connecting-IP');
  if(!ip || !env.IP_SECRET) return null;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.IP_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip)))).map(x=>x.toString(16).padStart(2,'0')).join('');
}
export default { async fetch(req,env){try{
  const url=new URL(req.url), path=url.pathname, now=Date.now();
  if(path==='/'&&req.method==='GET')return response(html,200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'self'"});
  if(path==='/app.js'&&req.method==='GET')return response(client,200,{'Content-Type':'text/javascript; charset=utf-8'});
  if(!['/api/start','/api/submit','/download'].includes(path))return response({error:'Pagina non trovata.'},404);
  if(path.startsWith('/api/')&&req.method!=='POST'||path==='/download'&&req.method!=='GET')return response({error:'Metodo non consentito.'},405);
  if(path.startsWith('/api/')&&(req.headers.get('origin')!==url.origin||req.headers.get('content-type')!=='application/json'))return response({error:'Richiesta non valida.'},403);
  const ip=await ipKey(req,env);if(!ip||!env.DB)return response({error:'Verifica dell’indirizzo di rete non disponibile. Riprova più tardi.'},503);
  const db=env.DB.withSession?env.DB.withSession('first-primary'):env.DB;
  let row=await db.prepare('SELECT * FROM attempts WHERE ip = ?').bind(ip).first();
  if(row?.blocked_until>now)return response({state:'blocked',until:row.blocked_until,error:'Una risposta era errata. Potrai riprovare al termine del blocco.'},429,{'Retry-After':String(Math.ceil((row.blocked_until-now)/1000))});
  if(path==='/api/start'){
    if(!row||row.expires<=now){
      const selected=selectQuestions(),token=crypto.randomUUID();
      await db.batch([
        db.prepare('DELETE FROM attempts WHERE expires < ? AND blocked_until < ?').bind(now-hour,now),
        db.prepare("INSERT INTO attempts (ip, token, questions, expires, state, blocked_until) VALUES (?, ?, ?, ?, 'active', 0) ON CONFLICT(ip) DO UPDATE SET token=excluded.token, questions=excluded.questions, expires=excluded.expires, state='active', blocked_until=0 WHERE attempts.expires <= ? AND attempts.blocked_until <= ?").bind(ip,token,JSON.stringify(selected),now+life,now,now),
      ]);
      row=await db.prepare('SELECT * FROM attempts WHERE ip = ?').bind(ip).first();
    }
    if(row.blocked_until>now)return response({state:'blocked',until:row.blocked_until},429);
    // A success belongs to the browser that completed the attempt, not all devices sharing an IP.
    if(row.state==='passed')return response({state:session(req)===row.token?'passed':'other',expires:row.expires},200);
    return response({state:'active',questions:publicQuestions(JSON.parse(row.questions)),expires:row.expires},200,cookie(row.token));
  }
  if(!row||row.expires<=now||session(req)!==row.token)return response({error:'Sessione scaduta. Ricarica la pagina per una nuova prova.'},403);
  if(path==='/api/submit'){
    if(row.state!=='active')return response({error:'Questa prova è già stata consegnata.'},409);
    if(Number(req.headers.get('content-length'))>4096)return response({error:'Risposte non valide.'},400);
    const raw=await req.text();if(raw.length>4096)return response({error:'Risposte non valide.'},400);
    let body;try{body=JSON.parse(raw);}catch{return response({error:'Formato non valido.'},400);}
    const answers=body?.answers;
    if(!Array.isArray(answers)||answers.length!==4||answers.some(a=>typeof a!=='number'&&typeof a!=='string'||typeof a==='string'&&(!a.trim()||a.length>120)))return response({error:'Completa tutte e quattro le risposte.'},400);
    const passed=correct(JSON.parse(row.questions),answers);
    const result=await db.prepare("UPDATE attempts SET state = ?, blocked_until = ?, expires = ? WHERE ip = ? AND token = ? AND state = 'active' AND blocked_until <= ? AND expires > ?").bind(passed?'passed':'blocked',passed?0:now+hour,passed?now+life:now+hour,ip,row.token,now,now).run();
    if(result.meta.changes!==1)return response({error:'Prova già consegnata. Ricarica per vedere lo stato.'},409);
    return passed?response({state:'passed',expires:now+life},200,cookie(row.token)):response({state:'blocked',until:now+hour},429,{'Retry-After':'3600'});
  }
  if(row.state!=='passed')return response({error:'Completa correttamente la prova prima di scaricare.'},403);
  if(!fileBase64)return response({error:'Il file non è ancora disponibile.'},503);
  const bytes=Uint8Array.from(atob(fileBase64),c=>c.charCodeAt(0));
  return response(bytes,200,{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${fileName}"`,'Content-Length':String(bytes.length)});
}catch{return response({error:'Servizio momentaneamente non disponibile. Ricarica la pagina per verificare lo stato della prova.'},503);}} };
