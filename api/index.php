<?php
declare(strict_types=1);
ini_set('display_errors', '0');
// Configuração privada opcional, útil em hospedagens com painel.
// ARENA_CONFIG_FILE pode apontar para outro arquivo fora dos diretórios públicos.
$privateFile = getenv('ARENA_CONFIG_FILE') ?: dirname(($_SERVER['DOCUMENT_ROOT'] ?? '') ?: __DIR__).'/arena-private/config.php';
if (is_file($privateFile)) {
    $private = require $privateFile;
    if (is_array($private)) foreach (['SYSEMP_DSN','SYSEMP_USER','SYSEMP_PASSWORD','API_TOKEN','ALLOWED_ORIGINS'] as $name) {
        if (isset($private[$name]) && is_string($private[$name]) && getenv($name) === false) putenv($name.'='.$private[$name]);
    }
}
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
function reply(int $status, array $body): never {
    http_response_code($status); echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR); exit;
}
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = array_filter(array_map('trim', explode(',', getenv('ALLOWED_ORIGINS') ?: '')));
if ($origin !== '') {
    if (!in_array($origin, $allowed, true)) reply(403, ['error'=>'Origem não autorizada na API.']);
    header('Access-Control-Allow-Origin: '.$origin); header('Vary: Origin');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($path === '/api/health' && $_SERVER['REQUEST_METHOD'] === 'GET') reply(200, ['service'=>'arena-sysemp','version'=>2]);
$token = getenv('API_TOKEN') ?: '';
if (strlen($token) < 32) reply(503, ['error'=>'API ainda não configurada no servidor.']);
if (!hash_equals('Bearer '.$token, $_SERVER['HTTP_AUTHORIZATION'] ?? '')) reply(401, ['error'=>'Chave de acesso inválida.']);
$method = $_SERVER['REQUEST_METHOD'];
if (!in_array($path, ['/api/status','/api/cargas','/api/conferir'], true)) reply(404, ['error'=>'Endpoint não encontrado.']);
if (($path === '/api/conferir' && $method !== 'POST') || ($path !== '/api/conferir' && $method !== 'GET')) reply(405, ['error'=>'Método não permitido.']);
$input = [];
if ($method === 'POST') {
    $body = file_get_contents('php://input', false, null, 0, 65537);
    if ($body === false || strlen($body) > 65536) reply(413, ['error'=>'Solicitação muito grande.']);
    try { $input = json_decode($body, true, 32, JSON_THROW_ON_ERROR); }
    catch (JsonException $e) { reply(400, ['error'=>'JSON inválido.']); }
    if (!is_array($input)) reply(400, ['error'=>'Informe um objeto JSON.']);
}
$date = $input['data'] ?? $_GET['data'] ?? '';
if ($path !== '/api/status') {
    if (!is_string($date)) reply(400, ['error'=>'Data inválida.']);
    $parsed = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
    if (!$parsed || $parsed->format('Y-m-d') !== $date) reply(400, ['error'=>'Informe data no formato YYYY-MM-DD.']);
}
$orders = $input['pedidos'] ?? [];
if ($path === '/api/conferir') {
    if (!is_array($orders) || count($orders) < 1 || count($orders) > 500) reply(400, ['error'=>'Informe de 1 a 500 pedidos.']);
    foreach ($orders as $order) if (!is_string($order) || !preg_match('/^[0-9]{1,20}$/D', $order)) reply(400, ['error'=>'Pedidos devem ser textos numéricos sem pontuação.']);
    $orders = array_values(array_unique($orders));
}
try {
    if (!in_array('pgsql', PDO::getAvailableDrivers(), true)) reply(503, ['error'=>'O servidor PHP não tem o driver PDO PostgreSQL (pdo_pgsql). Confira o plano e as extensões da hospedagem.']);
    $dsn = getenv('SYSEMP_DSN') ?: '';
    if (!str_starts_with($dsn, 'pgsql:')) throw new RuntimeException('configuration');
    $db = new PDO($dsn, getenv('SYSEMP_USER') ?: '', getenv('SYSEMP_PASSWORD') ?: '', [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION, PDO::ATTR_EMULATE_PREPARES=>false]);
    $db->exec('BEGIN TRANSACTION READ ONLY'); $db->exec("SET LOCAL statement_timeout = '10s'");
    if ($path === '/api/status') {
        $db->query('SELECT 1')->fetchColumn(); $db->commit();
        reply(200, ['service'=>'arena-sysemp','version'=>2,'database'=>'connected','read_only'=>true,'classificacao_validada'=>false]);
    }
    $sql = file_get_contents(__DIR__.'/cargas.sql');
    if ($sql === false) throw new RuntimeException('query');
    $params = [];
    if ($path === '/api/conferir') {
        $slots=[];
        foreach ($orders as $i=>$order) { $slots[]=':pedido_'.$i; $params['pedido_'.$i]=$order; }
        $filter = 'EXISTS (SELECT 1 FROM sysemp.montagem_carga_notas f JOIN sysemp.nota_saida nf ON nf.id_nota_saida=f.id_nota_saida WHERE f.id_carga=m.id_montagem_carga AND nf.id_pedido_vda_importado::text IN ('.implode(',', $slots).'))';
    } else {
        $filter = '(m.previsao_entrega = :data_carga OR EXISTS (SELECT 1 FROM sysemp.montagem_carga_notas f WHERE f.id_carga=m.id_montagem_carga AND f.data_entrega = :data_nota))';
        $params=['data_carga'=>$date,'data_nota'=>$date];
    }
    $stmt=$db->prepare(str_replace('/*FILTRO*/', $filter, $sql)); $stmt->execute($params);
    $rows=$stmt->fetchAll(PDO::FETCH_ASSOC); $db->commit();
    if (count($rows)>1000) reply(422,['error'=>'Mais de 1000 cargas. Reduza a consulta.']);
    foreach ($rows as &$row) {
        $row['id_motorista']=$row['id_motorista']===null?null:(int)$row['id_motorista'];
        foreach (['id_montagem_carga','itens_sem_cadastro','itens_sem_quantidade','itens_na_carga'] as $key) $row[$key]=(int)$row[$key];
        foreach (['pb_total','pb_caminhao','quantidade_itens','km_referencia'] as $key) $row[$key]=$row[$key]===null?null:(float)$row[$key];
        $row['pedidos']=json_decode($row['pedidos_json'],true,32,JSON_THROW_ON_ERROR); unset($row['pedidos_json']);
        $row['datas_entrega']=json_decode($row['datas_entrega_json'],true,32,JSON_THROW_ON_ERROR); unset($row['datas_entrega_json']);
    } unset($row);
    reply(200, ['source'=>'sysemp','kind'=>'live','data'=>$date,'consultado_em'=>gmdate('c'),'classificacao_validada'=>false,'cargas'=>$rows,'pedidos_consultados'=>$orders]);
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) $db->rollBack();
    error_log('arena-sysemp: '.get_class($e));
    reply(503,['error'=>'Não foi possível consultar o SYSEMP. Verifique conexão, permissões e configuração no servidor.']);
}
