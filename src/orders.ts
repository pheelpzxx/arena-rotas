export function clean(raw:string){
  return raw.split(/[\n;,\t]+/).map(x=>x.trim()).filter(Boolean).map(x=>({original:x,clean:x.replace(/[.\s]/g,'')}));
}
export function parseOrders(raw:string){return clean(raw).filter(x=>/^\d{1,20}$/.test(x.clean)).map(x=>x.clean)}
export function normalizeHeader(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]/g,'')}
export function detectOrderColumn(headers:string[]){
  const names=['NUMPEDIDO','NUMEROPEDIDO','NUMERODOPEDIDO','NPEDIDO','PEDIDO','PEDIDOS'];
  const matches=headers.filter(x=>names.includes(normalizeHeader(x)));
  return matches.length===1?matches[0]:'';
}
export function orderCell(value:unknown){
  if(typeof value==='number'&&(!Number.isSafeInteger(value)||value<0))return '[Número de pedido inválido no Excel]';
  return String(value??'').trim().replace(/[.,\s]/g,'');
}
export function prepareImport(values:unknown[][]){
  const headers=(values[0]??[]).map((v,i)=>String(v??'').trim()||`Coluna ${i+1}`);
  if(new Set(headers.map(normalizeHeader)).size!==headers.length)throw Error('Existem cabeçalhos duplicados. Corrija a planilha antes de importar.');
  const rows=values.slice(1).filter(row=>row.some(v=>v!==null&&v!==undefined&&String(v).trim()!==''))
    .map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]??''])));
  if(!rows.length)throw Error('A primeira aba não contém registros abaixo do cabeçalho.');
  if(rows.length>20000)throw Error('Importe até 20.000 registros por arquivo.');
  const column=detectOrderColumn(headers);
  return {headers,rows,column,raw:column?rows.map(row=>orderCell(row[column])).join('\n'):''};
}
