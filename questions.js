const number = (id,title,text,answer,tolerance=0.001,hint='Inserisci il risultato numerico.') => ({id,title,text,answer,tolerance,hint,type:'number'});
const choice = (id,title,text,options,answer) => ({id,title,text,options,answer,type:'choice'});
export const physics = [
  number(1,'Componenti cartesiane','Dati i vettori a = (3, 4) e b = (2, −5), calcola il prodotto scalare a · b.\nIn componenti cartesiane: aₓ = 3, aᵧ = 4; bₓ = 2, bᵧ = −5.',-14),
  choice(2,'Vettori ortogonali','Due vettori non nulli sono perpendicolari. Quanto vale il loro prodotto scalare, e perché?',['È nullo, perché cos 90° = 0.','È uguale al prodotto dei moduli.','È negativo, perché l’angolo è ottuso.','È nullo solo se i moduli sono uguali.'],0),
  number(3,'Il versore dell’asse x','Calcola il prodotto scalare tra a⃗ = 5i⃗ − 2j⃗ e il versore i⃗.',5),
  number(4,'Moduli e angolo','Due vettori hanno moduli a = 4 e b = 6 e formano un angolo di 60°. Calcola il prodotto scalare.',12),
  choice(5,'Il segno del prodotto','Il prodotto scalare tra due vettori non nulli è negativo. Che cosa puoi affermare sull’angolo θ, con 0° ≤ θ ≤ 180°?',['0° ≤ θ < 90°','θ = 90°','90° < θ ≤ 180°','θ = 0°'],2),
  choice(6,'Proprietà commutativa','Vale sempre a⃗ · b⃗ = b⃗ · a⃗?',['Sì, il prodotto scalare è commutativo.','No, scambiando l’ordine cambia il segno.','Solo se i vettori sono paralleli.','Solo se i moduli sono uguali.'],0),
  number(7,'L’angolo tra due vettori','Per u⃗ = 1i⃗ + 0j⃗ e v⃗ = 1i⃗ + 1j⃗, calcola cos θ.',Math.SQRT1_2,0.001,'Puoi usare un numero decimale (almeno tre cifre), sqrt(2)/2 oppure 1/sqrt(2).'),
  number(8,'Ortogonali con un parametro','Per quale valore di k i vettori a⃗ = ki⃗ + 2j⃗ e b⃗ = 3i⃗ − 6j⃗ sono ortogonali?',4),
  choice(9,'Un vettore per se stesso','Esprimi a⃗ · a⃗ in funzione del modulo |a⃗|.',['|a⃗|','|a⃗|²','0','−|a⃗|²'],1),
  number(10,'Il lavoro di una forza','La forza F⃗ = (20i⃗ + 15j⃗) N produce uno spostamento s⃗ = (4i⃗ + 2j⃗) m. Calcola il lavoro L, in joule.',110,0.001,'Inserisci il lavoro in J, senza unità di misura.'),
  number(11,'Una forza inclinata','Un carrello è trainato con F = 50 N inclinata di 30° rispetto allo spostamento orizzontale. Per s = 10 m, quanto lavoro compie la forza, in joule?',250*Math.sqrt(3),0.06,'Inserisci i joule: sono accettati arrotondamenti a una cifra decimale o espressioni come 250*sqrt(3).'),
  choice(12,'La valigia in movimento','Una valigia di 15 kg è trasportata a mano per 20 m in orizzontale a velocità costante, mantenendola alla stessa altezza. Quanto valgono il lavoro della forza peso e quello della mano?',['Peso: 2943 J; mano: −2943 J.','Peso: 0 J; mano: 0 J, perché entrambe le forze sono perpendicolari allo spostamento.','Peso: −2943 J; mano: 2943 J.','Entrambi positivi.'],1),
  number(13,'Il lavoro dell’attrito','Un blocco scivola per s = 5 m su un piano orizzontale. L’attrito dinamico, opposto allo spostamento, ha modulo 12 N. Calcola il lavoro dell’attrito in joule.',-60),
  number(14,'La forza risultante','Agiscono F⃗₁ = (6i⃗ − 2j⃗) N e F⃗₂ = (−2i⃗ + 5j⃗) N. Lo spostamento è s⃗ = (3i⃗ + 4j⃗) m. Calcola il lavoro totale in joule.',24),
];
export const dante = choice(15,'Una domanda su Dante','In quale città nacque Dante Alighieri nel 1265?',['Firenze','Ravenna','Verona','Arezzo'],0);
export const bank = [...physics,dante];
export function randomInt(max){ const n=new Uint32Array(1); const ceiling=Math.floor(4294967296/max)*max; do{crypto.getRandomValues(n);}while(n[0]>=ceiling);return n[0]%max; }
export function shuffle(items){ const a=[...items]; for(let i=a.length-1;i>0;i--){const j=randomInt(i+1);[a[i],a[j]]=[a[j],a[i]];} return a; }
export function selectQuestions(){ return [...shuffle(physics).slice(0,3),dante].map(q=>({id:q.id,order:q.type==='choice'?shuffle(q.options.map((_,i)=>i)):null})); }
export function publicQuestions(selected){return selected.map(s=>{const q=bank.find(q=>q.id===s.id);return {id:q.id,title:q.title,text:q.text,type:q.type,hint:q.hint,options:s.order?.map(i=>q.options[i])};});}
// A tiny arithmetic parser, deliberately without eval or Function.
export function numeric(value){
  if(typeof value!=='string'||value.length>120)return NaN;
  let s=value.toLowerCase().replaceAll(',','.').replaceAll('√','sqrt').replace(/\s+/g,'');let pos=0;
  function atom(){if(s.startsWith('sqrt',pos)){pos+=4;return Math.sqrt(atom());}if(s[pos]==='('){pos++;const n=expr();if(s[pos++]!==')')throw 0;return n;}if(s[pos]==='+'||s[pos]==='-'){const sign=s[pos++];return(sign==='-'?-1:1)*atom();}const m=s.slice(pos).match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/);if(!m)throw 0;pos+=m[0].length;return Number(m[0]);}
  function term(){let n=atom();while(s[pos]==='*'||s[pos]==='/'){const op=s[pos++],b=atom();n=op==='*'?n*b:n/b;}return n;}
  function expr(){let n=term();while(s[pos]==='+'||s[pos]==='-'){const op=s[pos++],b=term();n=op==='+'?n+b:n-b;}return n;}
  try{const n=expr();return pos===s.length&&Number.isFinite(n)?n:NaN;}catch{return NaN;}
}
export function correct(selected,answers){return Array.isArray(answers)&&answers.length===4&&selected.every((s,i)=>{const q=bank.find(q=>q.id===s.id);return q.type==='choice'?Number.isInteger(answers[i])&&s.order[answers[i]]===q.answer:Math.abs(numeric(answers[i])-q.answer)<=q.tolerance;});}
