<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($_SERVER['REQUEST_METHOD'] !== 'GET') { http_response_code(405); echo json_encode(['error'=>'Método não permitido']); exit; }
if ($path === '/api/health') { echo json_encode(['status'=>'ok','mode'=>'read-only']); exit; }
$token = getenv('API_TOKEN');
if (!$token || !hash_equals($token, preg_replace('/^Bearer /', '', $_SERVER['HTTP_AUTHORIZATION'] ?? ''))) { http_response_code(401); echo json_encode(['error'=>'Acesso não autorizado']); exit; }
if ($path !== '/api/cargas') { http_response_code(404); echo json_encode(['error'=>'Endpoint não encontrado']); exit; }
$date = $_GET['data'] ?? '';
$d = DateTimeImmutable::createFromFormat('!Y-m-d', $date);
if (!$d || $d->format('Y-m-d') !== $date) { http_response_code(400); echo json_encode(['error'=>'Informe data no formato YYYY-MM-DD']); exit; }
try {
 $db = new PDO(getenv('SYSEMP_DSN'), getenv('SYSEMP_USER'), getenv('SYSEMP_PASSWORD'), [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
 $db->exec('BEGIN TRANSACTION READ ONLY');
 $db->exec("SET LOCAL statement_timeout = '10s'");
 $stmt = $db->prepare('SELECT id_montagem_carga, descricao_carga, id_rota, id_motorista, placa_veiculo, previsao_entrega, status FROM sysemp.montagem_carga WHERE previsao_entrega = :data ORDER BY id_montagem_carga');
 $stmt->execute(['data'=>$date]);
 $rows=$stmt->fetchAll(PDO::FETCH_ASSOC); $db->commit();
 echo json_encode(['data'=>$date,'cargas'=>$rows,'observacao'=>'Filtro pela previsão cadastrada; divergências com o POP ainda exigem revisão.'], JSON_UNESCAPED_UNICODE);
} catch (Throwable $e) { if(isset($db) && $db->inTransaction()) $db->rollBack(); http_response_code(503); echo json_encode(['error'=>'Não foi possível consultar o SYSEMP. Verifique a configuração no servidor.']); }
