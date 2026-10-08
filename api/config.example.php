<?php
// Copie para uma pasta PRIVADA fora de todos os diretórios públicos.
// Nunca envie a cópia preenchida ao GitHub.
return [
    'SYSEMP_DSN' => 'pgsql:host=SEU_HOST;port=5432;dbname=SEU_BANCO;connect_timeout=10',
    'SYSEMP_USER' => 'usuario_somente_leitura',
    'SYSEMP_PASSWORD' => '',
    'API_TOKEN' => '', // Gere uma chave aleatória com pelo menos 32 caracteres.
    'ALLOWED_ORIGINS' => 'https://arena-rotas.vercel.app,https://pheelpzxx.github.io',
];
