# Arena — Central de rotas

Primeira versão: React + TypeScript + Material UI, API PHP puro e estrutura MySQL. PostgreSQL é a fonte do SYSEMP.

## Testar localmente

Instale Node.js 22 ou superior. Nesta pasta:

```
npm install
npm run dev
```

Para compilar: `npm run build`. Para visualizar a compilação: `npm run preview`.

## GitHub Pages

Crie um repositório e envie **somente o conteúdo desta pasta site**, incluindo o package-lock.json e .github. Não envie a pasta pai projeto2.0: ela contém conexão local e dados privados.
Em Settings → Pages → Source, escolha GitHub Actions. O workflow publica a demonstração quando houver push em main.

GitHub Pages hospeda apenas o frontend estático. PHP e bancos precisam de outro servidor. Esta versão demonstra a interface com dados fictícios; não conecta ao banco no navegador.

## O que funciona

- Visão de rotas e cálculo ilustrativo de ocupação.
- Revisão de motorista e PB na sessão.
- Importação da primeira aba XLSX com cabeçalho na primeira linha e seleção explícita da coluna dos pedidos.
- Limpeza de pontuação, deduplicação, lista de inválidos e cópia dos pedidos.
- Comparação de duas listas de pedidos (um por linha).
- Configuração temporária de motoristas fixos e limites de capacidade.
- Interface responsiva e operação Bonini separada.

## Limites

Dados fictícios, sem salvar mudanças entre recargas. Não calcula trajetos, não mede fadiga, não libera carregamento e não implementa ainda calendário do POP ou preenchimento do KPI. Data selecionada não filtra os dados fictícios. PB caminhão está incluído no total, não é somado novamente. Classificação por SKU e capacidade mista exigem validação.

## API PHP (base para integração)

PHP 8.1+ com PDO PostgreSQL. Configure variáveis do ambiente listadas em api/.env.example; o PHP não carrega .env automaticamente. Inicie na raiz: `php -S localhost:8080 api/index.php`.
GET /api/health verifica o serviço. GET /api/cargas?data=2026-10-09 requer Authorization: Bearer com API_TOKEN configurado e consulta apenas cargas pela previsão de entrega. A consulta usa transação somente leitura e timeout. Não foi validada contra registros reais. O frontend não consome a API ainda; autenticação de usuários e integração devem preceder publicação dos dados reais. Nunca coloque API_TOKEN ou credenciais do banco em variáveis VITE_ ou no GitHub Pages.

## MySQL

Execute database/schema.sql em uma base separada do SYSEMP. É uma estrutura inicial; ainda não é usada pela interface.

