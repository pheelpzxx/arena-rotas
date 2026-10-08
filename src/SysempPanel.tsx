import {useEffect,useRef,useState} from 'react';
import {Alert,Box,Button,Chip,Paper,Stack,Table,TableBody,TableCell,TableHead,TableRow,TextField,Typography} from '@mui/material';
import {requestApi,validateConsulta,type Consulta} from './sysemp';

export function useSysemp(date:string){
  const [url,setUrlState]=useState(''),[key,setKeyState]=useState('');
  const [data,setData]=useState<Consulta|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('Não conectado');
  const revision=useRef(0);
  function invalidate(){revision.current++;setData(null);setError('');setStatus('Não conectado');setBusy(false)}
  useEffect(()=>{invalidate()},[date]);
  function setUrl(v:string){invalidate();setUrlState(v)}
  function setKey(v:string){invalidate();setKeyState(v)}
  async function run(action:'status'|'cargas'|'conferir',orders:string[]=[]){
    const rev=++revision.current;setBusy(true);setError('');setData(null);setStatus('Consultando');
    try{
      const value=await requestApi(url,key,action==='cargas'?`cargas?data=${encodeURIComponent(date)}`:action,action==='conferir'?{data:date,pedidos:orders}:undefined);
      if(rev!==revision.current)return;
      if(action==='status'){
        const result=value as Record<string,unknown>;
        if(result.service!=='arena-sysemp'||result.database!=='connected'||result.read_only!==true)throw Error('O endereço não retornou uma conexão SYSEMP válida.');
      }else{
        const result=validateConsulta(value);
        if(result.kind!=='live'||result.data!==date)throw Error('A API retornou uma consulta diferente da solicitada.');
        setData(result);
      }
      setStatus('API conectada');
    }catch(e){if(rev===revision.current){setError(e instanceof Error?e.message:'Falha na consulta.');setStatus('Conexão indisponível')}}
    finally{if(rev===revision.current)setBusy(false)}
  }
  async function importSnapshot(file:File){
    const rev=++revision.current;setBusy(true);setData(null);setError('');
    try{
      if(file.size>5*1024*1024)throw Error('Arquivo maior que 5 MB.');
      const result=validateConsulta(JSON.parse(await file.text()));
      if(result.kind!=='snapshot')throw Error('Importe um arquivo exportado pelo script local.');
      if(result.data!==date)throw Error(`Selecione a data ${result.data} antes de importar essa consulta.`);
      if(rev!==revision.current)return;
      setData(result);setStatus('Consulta local importada');
    }catch(e){if(rev===revision.current){setError(e instanceof Error?e.message:'Arquivo inválido.');setStatus('Importação não concluída')}}
    finally{if(rev===revision.current)setBusy(false)}
  }
  function disconnect(){invalidate();setKeyState('')}
  return {url,key,setUrl,setKey,data,busy,error,status,run,importSnapshot,disconnect};
}
type Props={connection:ReturnType<typeof useSysemp>;date:string;orders:string[];settings?:boolean};
export default function SysempPanel({connection:c,date,orders,settings=false}:Props){
  const data=c.data;
  const allOrders=new Set(data?.cargas.flatMap(x=>x.pedidos)??[]);
  const matches=orders.filter(x=>allOrders.has(x));
  const missing=orders.filter(x=>!allOrders.has(x));
  const totalPb=data?.cargas.every(x=>x.pb_total!==null)?data.cargas.reduce((sum,x)=>sum+(x.pb_total??0),0):null;
  return <Stack gap={3}>
    <Paper sx={{p:3}}>
      <Stack direction="row" justifyContent="space-between" gap={2}><Typography variant="h6">SYSEMP · dados reais</Typography><Chip label={c.busy?'Consultando…':c.status} color={data||c.status==='API conectada'?'success':'default'} variant="outlined"/></Stack>
      <Typography color="text.secondary" sx={{my:2}}>Consulte cargas pela previsão de entrega ou pela data cadastrada nas notas. Nenhum dado é alterado no SYSEMP.</Typography>
      {settings&&<Stack gap={2} sx={{mb:2}}>
        <Alert severity="info">Informe a URL HTTPS e a chave da API PHP hospedada. A senha do banco fica somente no servidor. A chave abaixo fica apenas na memória desta aba.</Alert>
        <TextField label="URL base da API" placeholder="https://api.seudominio.com.br" value={c.url} onChange={e=>c.setUrl(e.target.value)} autoComplete="off"/>
        <TextField label="Chave de acesso da API" type="password" value={c.key} onChange={e=>c.setKey(e.target.value)} autoComplete="off"/>
      </Stack>}
      <Stack direction={{xs:'column',sm:'row'}} gap={1} flexWrap="wrap">
        {settings&&<Button variant="outlined" disabled={c.busy||!c.url||!c.key} onClick={()=>void c.run('status')}>Testar conexão</Button>}
        <Button variant="contained" disabled={c.busy||!c.url||!c.key} onClick={()=>void c.run('cargas')}>Consultar cargas de {date}</Button>
        <Button variant="outlined" disabled={c.busy||!c.url||!c.key||orders.length===0||orders.length>500} onClick={()=>void c.run('conferir',orders)}>Conferir {orders.length} pedidos na API</Button>
        <Button variant="outlined" component="label" disabled={c.busy}>Importar consulta local (JSON)<input hidden type="file" accept=".json" onChange={e=>{if(e.target.files?.[0])void c.importSnapshot(e.target.files[0]);e.target.value=''}}/></Button>
        {(data||c.key)&&<Button onClick={c.disconnect}>Limpar consulta e chave</Button>}
      </Stack>
      {!c.url&&<Typography color="text.secondary" fontSize={13} mt={2}>Configure a hospedagem na aba Conexão SYSEMP. Enquanto isso, importe uma consulta gerada no seu computador pelo exportador local.</Typography>}
      {c.error&&<Alert severity="error" sx={{mt:2}}>{c.error}</Alert>}
    </Paper>
    {!data?<Alert severity="info">Nenhuma carga real carregada. Os números de exemplo não aparecem nesta visão.</Alert>:<>
      <Alert severity="warning">{data.kind==='snapshot'?'Consulta local exportada, sem atualização automática.':'Consulta online ao SYSEMP.'} Consultado em {new Date(data.consultado_em).toLocaleString('pt-BR')}. PBs calculados pelo cadastro dos subgrupos 21, 28, 45 e 125; classificação ainda precisa de validação operacional. Não libera carregamento.</Alert>
      {data.pedidos_consultados.length>0&&<Alert severity="info">Resultado limitado às cargas vinculadas aos {data.pedidos_consultados.length} pedidos consultados; pode incluir cargas de outras datas. Os PBs abaixo são da carga inteira, não apenas dos pedidos importados.</Alert>}
      <Box sx={{display:'grid',gridTemplateColumns:{xs:'1fr 1fr',lg:'repeat(4,1fr)'},gap:2}}>
        {[
          ['Cargas encontradas',data.cargas.length],
          ['Rotas cadastradas distintas',new Set(data.cargas.map(x=>x.rota).filter(Boolean)).size],
          ['Pedidos vinculados às cargas',allOrders.size],
          ['PBs pelo cadastro (provisório)',totalPb===null?'Incompleto':totalPb]
        ].map(([label,value])=><Paper key={label} sx={{p:3}}><Typography fontSize={13} color="text.secondary">{label}</Typography><Typography variant="h4" sx={{mt:1}}>{value}</Typography></Paper>)}
      </Box>
      {orders.length>0&&<Paper sx={{p:3}}><Typography variant="h6">Conferência com pedidos importados</Typography><Typography mt={1}>{matches.length} vinculados às cargas consultadas · {missing.length} sem vínculo neste resultado.</Typography>{missing.length>0&&<Typography fontSize={13} sx={{mt:1,wordBreak:'break-word'}}>Sem vínculo neste resultado: {missing.join(', ')}. Isso não significa que o pedido não existe no SYSEMP.</Typography>}<Typography fontSize={13} mt={1}>Pedido em mais de uma carga: {orders.filter(id=>(data.cargas.filter(x=>x.pedidos.includes(id)).length)>1).join(', ')||'Nenhum neste resultado'}.</Typography></Paper>}
      {data.cargas.length===0?<Alert severity="info">Nenhuma carga encontrada para esta consulta.</Alert>:<Paper sx={{p:2,overflowX:'auto'}}><Table size="small"><TableHead><TableRow>{['Carga / status','Rota / veículo','Entrega cadastrada','Pedidos','PB total / caminhão','Revisão'].map(x=><TableCell key={x}>{x}</TableCell>)}</TableRow></TableHead><TableBody>{data.cargas.map(x=>{
        const divergence=x.previsao_entrega!==date||x.datas_entrega.some(d=>d!==date);
        return <TableRow key={x.id_montagem_carga}><TableCell>{x.id_montagem_carga} · {x.descricao_carga||'Sem descrição'}<Typography fontSize={12}>Status SYSEMP: {x.status||'Não informado'}</Typography></TableCell><TableCell>{x.rota||'Rota não cadastrada'}<Typography fontSize={12}>{x.placa_veiculo||'Sem placa'} · motorista ID {x.id_motorista??'—'}</Typography></TableCell><TableCell>Previsão: {x.previsao_entrega||'Sem data'}<Typography fontSize={12}>Notas: {x.datas_entrega.join(', ')||'Sem data'}</Typography></TableCell><TableCell>{x.pedidos.length}<Typography fontSize={12} sx={{maxWidth:200,wordBreak:'break-word'}}>{x.pedidos.join(', ')}</Typography></TableCell><TableCell>{x.pb_total??'Indisponível'} / {x.pb_caminhao??'Indisponível'}<Typography fontSize={12}>Caminhão incluído no total</Typography></TableCell><TableCell>{divergence&&<Chip size="small" color="warning" label="Conferir data / POP"/>}{x.pb_total===null&&<Typography fontSize={12}>Itens ausentes, incompletos ou não classificados.</Typography>}<Typography fontSize={12}>Validar classificação e status da carga.</Typography></TableCell></TableRow>;
      })}</TableBody></Table></Paper>}
    </>}
  </Stack>;
}
