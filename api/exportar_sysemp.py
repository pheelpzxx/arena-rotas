"""Exporta somente leitura para importar no site; nunca exporta credenciais."""
import argparse, contextlib, datetime as dt, importlib.util, io, json, pathlib, sys

def exportar(data, conexao, destino, pedidos=None):
    spec = importlib.util.spec_from_file_location('arena_conexao_local', conexao)
    module = importlib.util.module_from_spec(spec)
    with contextlib.redirect_stdout(io.StringIO()):
        spec.loader.exec_module(module)
        conn = module.conectar()
    try:
        conn.rollback()
        conn.set_session(readonly=True, autocommit=False)
        with conn.cursor() as cur:
            cur.execute("SET LOCAL statement_timeout = '10s'")
            sql = pathlib.Path(__file__).with_name('cargas.sql').read_text(encoding='utf-8')
            if pedidos:
                if len(pedidos)>500 or any(not str(x).isdigit() or len(str(x))>20 for x in pedidos):
                    raise ValueError('Informe até 500 pedidos numéricos.')
                filtro = 'EXISTS (SELECT 1 FROM sysemp.montagem_carga_notas f JOIN sysemp.nota_saida nf ON nf.id_nota_saida=f.id_nota_saida WHERE f.id_carga=m.id_montagem_carga AND nf.id_pedido_vda_importado::text = ANY(%(pedidos)s))'
                params={'pedidos':list(dict.fromkeys(map(str,pedidos)))}
            else:
                filtro='(m.previsao_entrega = %(data)s OR EXISTS (SELECT 1 FROM sysemp.montagem_carga_notas f WHERE f.id_carga=m.id_montagem_carga AND f.data_entrega = %(data)s))'
                params={'data':data}
            cur.execute(sql.replace('/*FILTRO*/', filtro),params)
            names=[x[0] for x in cur.description]
            rows=[dict(zip(names,row)) for row in cur.fetchall()]
            if len(rows)>1000: raise ValueError('Mais de 1000 cargas; reduza a consulta.')
            for row in rows:
                row['pedidos']=json.loads(row.pop('pedidos_json'))
                row['datas_entrega']=json.loads(row.pop('datas_entrega_json'))
                for key in ['pb_total','pb_caminhao','quantidade_itens','km_referencia']:
                    row[key]=None if row[key] is None else float(row[key])
                if row['previsao_entrega'] is not None: row['previsao_entrega']=row['previsao_entrega'].isoformat()
            payload={'source':'sysemp','kind':'snapshot','data':data,'consultado_em':dt.datetime.now(dt.timezone.utc).isoformat(),'classificacao_validada':False,'cargas':rows,'pedidos_consultados':list(map(str,pedidos or []))}
            pathlib.Path(destino).write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
            return payload
    finally:
        conn.rollback();conn.close()

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--data',required=True,help='YYYY-MM-DD')
    parser.add_argument('--conexao',default=str(pathlib.Path(__file__).resolve().parents[2]/'conexao_local.py'))
    parser.add_argument('--saida')
    parser.add_argument('--pedidos',help='Opcional: números separados por vírgula; consulta cargas desses pedidos em qualquer data.')
    args=parser.parse_args()
    try:
        dt.date.fromisoformat(args.data)
        output=args.saida or str(pathlib.Path.home()/'Downloads'/f'consulta_sysemp_{args.data}.json')
        payload=exportar(args.data,args.conexao,output,args.pedidos.split(',') if args.pedidos else None)
        print(f"Consulta salva: {output}\nCargas encontradas: {len(payload['cargas'])}. Não é atualização automática.")
    except Exception as exc:
        print(f'Não foi possível exportar ({type(exc).__name__}). Confira conexão, data, dependência psycopg2 e permissões; nenhum dado foi alterado.',file=sys.stderr)
        sys.exit(1)
