import test from 'node:test';
import assert from 'node:assert/strict';
import {clean,parseOrders,prepareImport,detectOrderColumn} from '../src/orders.ts';
import {loadDraft,draftKey} from '../src/draft.ts';
test('lista copiada e lista por linha representam os mesmos nove pedidos',()=>{
  const ids=['179509','179500','179494','179491','179448','179440','179350','179414','179283'];
  assert.deepEqual(parseOrders(ids.join(',')),parseOrders(ids.join('\n')));
  assert.equal(new Set(parseOrders(ids.join(','))).size,9);
});
test('importação trata pontuação da célula sem transformar um pedido em vários',()=>{
  const result=prepareImport([['Nº Pedido','ROTA'],['001.234','01'],['179,509','01']]);
  assert.equal(result.column,'Nº Pedido');assert.deepEqual(parseOrders(result.raw),['001234','179509']);
  assert.equal(detectOrderColumn(['PEDIDO','NUM PEDIDO']),'');
});
test('rejeita cabeçalhos duplicados e não converte números imprecisos em IDs válidos',()=>{
  assert.throws(()=>prepareImport([['PEDIDO','pedido'],[1,2]]));
  const result=prepareImport([['NUM PEDIDO'],[Number.MAX_SAFE_INTEGER+1],[12.3]]);
  assert.deepEqual(parseOrders(result.raw),[]);
});
test('avisos preservam inválidos e deduplicação conserva os IDs',()=>{
  const raw='179.509;179509\nABC\t000123';
  assert.deepEqual([...new Set(parseOrders(raw))],['179509','000123']);
  assert.equal(clean(raw).filter(x=>!/^\d{1,20}$/.test(x.clean)).length,1);
});
test('restaura somente o rascunho válido e tolera conteúdo inválido',()=>{
  let value=JSON.stringify({date:'2026-10-09',raw:'123',left:'123',right:'',fileName:'teste.xlsx',column:'PEDIDO',columns:['PEDIDO'],rows:[{PEDIDO:'123'}]});
  const old=globalThis.sessionStorage;
  globalThis.sessionStorage={getItem:key=>{assert.equal(key,draftKey);return value}};
  try{assert.equal(loadDraft().raw,'123');value='{quebrado';assert.deepEqual(loadDraft(),{});}finally{globalThis.sessionStorage=old;}
});
