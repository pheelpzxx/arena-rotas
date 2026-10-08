import test from 'node:test';
import assert from 'node:assert/strict';
import {apiBase,validateConsulta,requestApi} from '../src/sysemp.ts';

const carga={id_montagem_carga:100,descricao_carga:'Teste',rota:'01',id_motorista:1,placa_veiculo:null,previsao_entrega:'2026-10-09',status:'A',pedidos:['000123'],datas_entrega:['2026-10-09'],pb_total:8,pb_caminhao:2,quantidade_itens:10,km_referencia:120,itens_na_carga:3,itens_sem_cadastro:0,itens_sem_quantidade:0};
const consulta=()=>({source:'sysemp',kind:'snapshot',data:'2026-10-09',consultado_em:'2026-10-08T15:00:00Z',classificacao_validada:false,cargas:[structuredClone(carga)],pedidos_consultados:[]});
test('preserva zeros dos pedidos e PB desconhecido sem inventar zero',()=>{
  const value=consulta();value.cargas[0].pb_total=null;
  assert.equal(validateConsulta(value).cargas[0].pedidos[0],'000123');
  assert.equal(validateConsulta(value).cargas[0].pb_total,null);
});
test('rejeita calendário impossível e cargas duplicadas',()=>{
  const value=consulta();value.data='2026-02-30';assert.throws(()=>validateConsulta(value));
  const duplicate=consulta();duplicate.cargas.push({...carga});assert.throws(()=>validateConsulta(duplicate));
});
test('rejeita quantidades inválidas e caminhão acima do total',()=>{
  for(const amount of [-1,Infinity,NaN,'8']){const value=consulta();value.cargas[0].pb_total=amount;assert.throws(()=>validateConsulta(value));}
  const value=consulta();value.cargas[0].pb_caminhao=9;assert.throws(()=>validateConsulta(value));
});
test('exige HTTPS remoto e rejeita credenciais em URL',()=>{
  assert.equal(apiBase('https://api.exemplo.com/'),'https://api.exemplo.com');
  assert.equal(apiBase('http://localhost:8080'),'http://localhost:8080');
  for(const url of ['http://api.exemplo.com','https://user:senha@api.exemplo.com','https://api.exemplo.com?token=x'])assert.throws(()=>apiBase(url));
});
test('envia pedidos via POST e traduz falhas da hospedagem',async()=>{
  const original=globalThis.fetch;
  try{
    globalThis.fetch=async(url,options)=>{
      assert.equal(url,'https://api.exemplo.com/api/conferir');assert.equal(options.method,'POST');assert.equal(options.credentials,'omit');
      assert.deepEqual(JSON.parse(options.body),{data:'2026-10-09',pedidos:['000123']});
      return new Response(JSON.stringify(consulta()),{status:200});
    };
    await requestApi('https://api.exemplo.com','x'.repeat(32),'conferir',{data:'2026-10-09',pedidos:['000123']});
    globalThis.fetch=async()=>new Response('<html>PHP indisponível</html>',{status:200});
    await assert.rejects(requestApi('https://api.exemplo.com','x'.repeat(32),'status'),/página em vez da API/);
    globalThis.fetch=async()=>new Response(JSON.stringify({error:'Chave de acesso inválida.'}),{status:401});
    await assert.rejects(requestApi('https://api.exemplo.com','x'.repeat(32),'status'),/Chave de acesso inválida/);
  }finally{globalThis.fetch=original;}
});
