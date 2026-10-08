# Conexão SYSEMP

## O que já está implementado

A tela inicial começa vazia, sem números fictícios. A aba Conexão SYSEMP permite testar uma API, consultar cargas pela data e conferir até 500 pedidos importados. A URL deve ser HTTPS. A chave da API é temporária e não é salva no navegador.

As consultas preservam previsão da carga, datas das notas e status original. Datas divergentes pedem conferência com o POP, sem correção automática. Pedidos ligados a mais de uma carga aparecem na conferência. A quantidade de PB mostrada é sempre da carga inteira; não se reparte um item agrupado entre pedidos por estimativa.

O XLSX identifica pedidos e rótulos de rotas; não confirma que uma carga foi montada. A associação usada pela API é montagem_carga_notas → nota_saida.id_pedido_vda_importado. Sem vínculo nesse resultado não significa pedido inexistente; pedidos sem nota, integração diferente e reentregas precisam de validação.

## PBs pelo cadastro

Foram encontrados no SYSEMP os subgrupos 21 PARABRISA, 28 PARABRISA (CAMINHAO), 45 PARABRISA (ONIBUS) e 125 PARABRISA CAMINHAO. O SQL soma qtde de montagem_carga_itens uma vez por linha; notas são agregadas separadamente para não multiplicar quantidades.

O total inclui caminhão. Itens sem produto/subgrupo, quantidade nula/negativa e cargas sem itens deixam o total indisponível. A contagem segue o cadastro, com classificação operacional provisória: conferir produtos fora desses subgrupos, kits, cancelamentos, duplicações operacionais e regras do POP antes de usar para ocupação. Não há liberação de carregamento, classificação Scania série 5/6 ou capacidade do veículo validada.

## Hospedagem PHP / Hostinger

Requer PHP 8.1+ e **PDO PostgreSQL (pdo_pgsql)**, HTTPS, acesso de saída ao servidor do SYSEMP e usuário com permissões SELECT nas tabelas consultadas. A Hostinger informa PostgreSQL como serviço de VPS; isso não prova que seu plano Web/Cloud tem o driver para conexão externa. Confirmar no hPanel a extensão pdo_pgsql e testar a conexão remota antes de escolher outra hospedagem. Não é necessário migrar o banco do SYSEMP.

Referências: https://www.hostinger.com/support/which-databases-and-data-tools-are-supported-at-hostinger/

No domínio escolhido, coloque api/index.php, api/cargas.sql e api/.htaccess na pasta pública api. O .htaccess encaminha /api/status, /api/cargas e /api/conferir para index.php e bloqueia acesso direto a SQL/Python/configuração. Confirme que a hospedagem aplica essas regras. Não sobrescreva o site existente.

Configure as variáveis de api/.env.example no ambiente. Alternativa: copie api/config.example.php para **arena-private/config.php, fora de todos os diretórios públicos**, no diretório pai do DOCUMENT_ROOT. É o caminho padrão procurado pela API. Se o subdomínio tiver DOCUMENT_ROOT dentro de public_html, esse padrão também pode ficar público: nesse caso use uma localização realmente privada e a variável ARENA_CONFIG_FILE com o caminho absoluto. Mantenha permissões restritas. Nunca publique esse arquivo preenchido.

ALLOWED_ORIGINS aceita origens exatas, por exemplo https://arena-rotas.vercel.app. Não inclui caminhos ou barra final. API_TOKEN deve ser aleatório com pelo menos 32 caracteres; nunca é senha do banco. Não configurar segredos como VITE_ na Vercel. A chave é para teste piloto autorizado; autenticação por usuário, auditoria, limite de requisições e expiração ainda precisam ser implementados para uso por equipe.

## Teste local da API

Configure variáveis de ambiente e execute na raiz do projeto:

```
php -S 127.0.0.1:8080 api/index.php
```

O navegador deve abrir o frontend local em http://localhost:5173 para consultar HTTP local; o site HTTPS publicado pode bloquear endpoints HTTP. GET /api/health testa só o serviço; GET /api/status, autenticado, testa o banco. GET /api/cargas?data=YYYY-MM-DD considera previsão da carga **ou** data das notas. POST /api/conferir recebe {"data":"YYYY-MM-DD","pedidos":["179509"]} e busca vínculos em qualquer data para sinalizar divergências.

## Alternativa imediata: consulta local exportada

No computador que já tem conexao_local.py e psycopg2:

```
python api/exportar_sysemp.py --data 2026-10-09
```

Se necessário, passe --conexao com o caminho absoluto do conexao_local.py. O caminho padrão pressupõe site/api dentro de projeto2.0. O arquivo sai em Downloads/consulta_sysemp_2026-10-09.json. Para consultar as cargas de uma lista específica em qualquer data, acrescente --pedidos "179509,179500".

No site selecione a mesma data e clique Importar consulta local (JSON). O arquivo é lido na memória da aba, sem envio ao servidor ou gravação no repositório. Não é atualização automática. Credenciais não entram no JSON. Esses arquivos contêm dados operacionais e devem permanecer privados. Recarregar limpa a consulta.

## O que ainda falta

Hospedar a API com pdo_pgsql, configurar credenciais privadas e conectividade, confirmar correspondência entre número do pedido e nota, validar classificação PB/status/POP, e implementar autenticação individual antes de liberar dados reais à equipe. A escala, histórico, MySQL e otimização de trajetos continuam pendentes.
