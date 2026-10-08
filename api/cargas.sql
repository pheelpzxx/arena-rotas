-- Notas e itens agregados separadamente para não multiplicar quantidades.
-- Subgrupos do cadastro: 21 PB, 28/125 caminhão, 45 ônibus. Validar com POP.
SELECT m.id_montagem_carga, m.descricao_carga, m.id_rota,
       r.rota, r.km_ida_volta AS km_referencia, m.id_motorista,
       m.placa_veiculo, m.previsao_entrega, m.status,
       COALESCE(n.pedidos_json, '[]') AS pedidos_json,
       COALESCE(n.datas_entrega_json, '[]') AS datas_entrega_json,
       COALESCE(i.itens_na_carga, 0) AS itens_na_carga,
       COALESCE(i.itens_sem_cadastro, 0) AS itens_sem_cadastro,
       COALESCE(i.itens_sem_quantidade, 0) AS itens_sem_quantidade,
       CASE WHEN i.itens_sem_quantidade = 0 THEN i.quantidade_itens END AS quantidade_itens,
       CASE WHEN i.itens_na_carga > 0 AND i.itens_sem_cadastro = 0 AND i.itens_sem_quantidade = 0 THEN i.pb_total END AS pb_total,
       CASE WHEN i.itens_na_carga > 0 AND i.itens_sem_cadastro = 0 AND i.itens_sem_quantidade = 0 THEN i.pb_caminhao END AS pb_caminhao
FROM sysemp.montagem_carga m
LEFT JOIN sysemp.rota r ON r.id_rota=m.id_rota
LEFT JOIN LATERAL (
    SELECT json_agg(DISTINCT ns.id_pedido_vda_importado::text)
               FILTER (WHERE ns.id_pedido_vda_importado IS NOT NULL)::text AS pedidos_json,
           json_agg(DISTINCT mn.data_entrega::text)
               FILTER (WHERE mn.data_entrega IS NOT NULL)::text AS datas_entrega_json
    FROM sysemp.montagem_carga_notas mn
    LEFT JOIN sysemp.nota_saida ns ON ns.id_nota_saida=mn.id_nota_saida
    WHERE mn.id_carga=m.id_montagem_carga
) n ON TRUE
LEFT JOIN LATERAL (
    SELECT count(*) AS itens_na_carga,
           count(*) FILTER (WHERE p.id_produto IS NULL OR p.id_subgrupo IS NULL) AS itens_sem_cadastro,
           count(*) FILTER (WHERE ci.qtde IS NULL OR ci.qtde < 0) AS itens_sem_quantidade,
           sum(ci.qtde) AS quantidade_itens,
           COALESCE(sum(ci.qtde) FILTER (WHERE p.id_subgrupo IN (21,28,45,125)),0) AS pb_total,
           COALESCE(sum(ci.qtde) FILTER (WHERE p.id_subgrupo IN (28,125)),0) AS pb_caminhao
    FROM sysemp.montagem_carga_itens ci
    LEFT JOIN sysemp.produto p ON p.id_produto=ci.id_produto
    WHERE ci.id_montagem_carga=m.id_montagem_carga
) i ON TRUE
WHERE /*FILTRO*/
ORDER BY m.id_montagem_carga DESC
LIMIT 1001
