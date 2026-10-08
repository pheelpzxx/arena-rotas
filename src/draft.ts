export const draftKey='arena-importacao-v1';
export type Draft={date:string;raw:string;left:string;right:string;fileName:string;column:string;columns:string[];rows:Record<string,unknown>[]};
export function loadDraft():Partial<Draft>{
  try{
    const saved=sessionStorage.getItem(draftKey);
    if(!saved||saved.length>5*1024*1024)return {};
    const v=JSON.parse(saved);
    if(!v||typeof v!=='object'||!['date','raw','left','right','fileName','column'].every(k=>typeof v[k]==='string')||
      !/^\d{4}-\d{2}-\d{2}$/.test(v.date)||!Array.isArray(v.columns)||!v.columns.every((x:unknown)=>typeof x==='string')||
      !Array.isArray(v.rows)||v.rows.length>20000||!v.rows.every((x:unknown)=>x!==null&&typeof x==='object'&&!Array.isArray(x)))return {};
    return v;
  }catch{return {}}
}
