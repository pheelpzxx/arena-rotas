export type Carga = {
  id_montagem_carga:number; descricao_carga:string|null; rota:string|null;
  id_motorista:number|null; placa_veiculo:string|null; previsao_entrega:string|null;
  status:string|null; pedidos:string[]; datas_entrega:string[]; pb_total:number|null;
  pb_caminhao:number|null; quantidade_itens:number|null; km_referencia:number|null;
  itens_na_carga:number; itens_sem_cadastro:number; itens_sem_quantidade:number;
};
export type Consulta = {source:'sysemp'; kind:'live'|'snapshot'; data:string; consultado_em:string;
  classificacao_validada:false; cargas:Carga[]; pedidos_consultados:string[]};
function object(value:unknown):value is Record<string,unknown>{return typeof value==='object'&&value!==null&&!Array.isArray(value)}
function strings(value:unknown):value is string[]{return Array.isArray(value)&&value.every(x=>typeof x==='string')}
function validDate(value:unknown):value is string{
  return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&
    !Number.isNaN(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
export function validateConsulta(value:unknown):Consulta {
  if(!object(value)||value.source!=='sysemp'||!['live','snapshot'].includes(String(value.kind))||
    !validDate(value.data)||typeof value.consultado_em!=='string'||
    Number.isNaN(Date.parse(value.consultado_em))||value.classificacao_validada!==false||
    !strings(value.pedidos_consultados)||value.pedidos_consultados.length>500||value.pedidos_consultados.some(x=>!/^\d{1,20}$/.test(x))||!Array.isArray(value.cargas)||value.cargas.length>1000)
    throw Error('Arquivo/resposta incompatível com a consulta SYSEMP versão 2.');
  const seen=new Set<number>();
  for(const row of value.cargas){
    if(!object(row)||!Number.isSafeInteger(row.id_montagem_carga)||seen.has(row.id_montagem_carga as number)||
      (row.id_montagem_carga as number)<=0||!strings(row.pedidos)||!strings(row.datas_entrega)||row.pedidos.some(x=>!/^\d{1,20}$/.test(x))||row.datas_entrega.some(x=>!validDate(x))) throw Error('Carga ou pedido inválido na consulta.');
    seen.add(row.id_montagem_carga as number);
    for(const key of ['pb_total','pb_caminhao','quantidade_itens','km_referencia'])
      if(row[key]!==null&&(typeof row[key]!=='number'||!Number.isFinite(row[key])||(row[key] as number)<0)) throw Error(`Valor inválido: ${key}.`);
    for(const key of ['itens_na_carga','itens_sem_cadastro','itens_sem_quantidade'])
      if(!Number.isSafeInteger(row[key])||(row[key] as number)<0)throw Error('Contagem de itens inválida.');
    for(const key of ['descricao_carga','rota','placa_veiculo','previsao_entrega','status'])
      if(row[key]!==null&&typeof row[key]!=='string')throw Error('Identificação da carga inválida.');
    if(row.previsao_entrega!==null&&!validDate(row.previsao_entrega))throw Error('Previsão de entrega inválida.');
    if(row.id_motorista!==null&&(!Number.isSafeInteger(row.id_motorista)||(row.id_motorista as number)<0))throw Error('Motorista inválido.');
    if(typeof row.pb_total==='number'&&typeof row.pb_caminhao==='number'&&row.pb_caminhao>row.pb_total)throw Error('PB de caminhão excede o total da carga.');
  }
  return value as Consulta;
}
export function apiBase(raw:string){
  const url=new URL(raw);
  if(url.username||url.password||url.search||url.hash)throw Error('Use apenas a URL base da API, sem usuário, senha ou parâmetros.');
  if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['localhost','127.0.0.1'].includes(url.hostname)))throw Error('A API deve usar HTTPS.');
  return url.href.replace(/\/$/,'');
}
export async function requestApi(base:string,key:string,path:string,body?:unknown):Promise<unknown>{
  const url=apiBase(base);
  if(key.length<32)throw Error('Informe a chave de acesso da API (mínimo de 32 caracteres).');
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),20000);
  try{
    const response=await fetch(`${url}/api/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${key}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),signal:controller.signal,cache:'no-store',credentials:'omit'});
    const json:unknown=await response.json().catch(()=>{throw Error('O endereço retornou uma página em vez da API. Confira a hospedagem PHP.');});
    if(!response.ok)throw Error(object(json)&&typeof json.error==='string'?json.error:`API respondeu HTTP ${response.status}.`);
    return json;
  }catch(error){if(error instanceof TypeError)throw Error('Não foi possível alcançar a API. Confira HTTPS, CORS e disponibilidade do servidor.');throw error;}
  finally{clearTimeout(timer)}
}
