# Arena — Central de rotas

React + TypeScript + Material UI, API PHP puro e PostgreSQL como fonte SYSEMP. A estrutura MySQL em database é uma base futura; não é usada para copiar o SYSEMP.

## Executar

Node.js 22.18+:

```
npm ci
npm run dev
npm run build
npm test
```

## Funcionalidades

- Importação XLSX com escolha da coluna de pedidos, limpeza, deduplicação e comparação de listas.
- Visão inicial vazia; exemplos disponíveis apenas quando selecionados explicitamente.
- Consulta de cargas por previsão ou data das notas; conferência dos pedidos importados contra cargas.
- PB total e PB de caminhão por carga, data, placa, ID do motorista, pedidos e avisos de divergência.
- Importação de consulta local JSON como alternativa à API hospedada, sem atualização automática.
- Configuração e simulação de motoristas e capacidade somente na sessão.

## Integração

Veja CONEXAO_SYSEMP.md para instalar a API e o exportador Python. A API ainda precisa de hospedagem, configuração privada e teste de conectividade. Credenciais ficam no servidor; nunca em React, variáveis VITE_, GitHub ou arquivos públicos. Nenhum acesso à hospedagem é necessário para compilar o frontend.

Vercel e GitHub Pages publicam o frontend estático. O PHP deve rodar em servidor compatível separado. O workflow em .github publica Pages ao atualizar main. Publique apenas esta pasta, sem node_modules/dist nem dados e conexão da pasta pai.

## Limites operacionais

PBs seguem os subgrupos do cadastro e exigem validação operacional. Total é da carga inteira e caminhão já está incluído. A classificação não libera carregamento. Datas divergentes são sinalizadas para conferência com o POP, sem correção automática.

Ainda não implementa otimização geográfica, fadiga calculada, escala persistente, preenchimento do KPI nem calendário completo do POP. Os exemplos de capacidade não são parâmetros operacionais validados. Autenticação individual, auditoria e controle de requisições precisam ser concluídos antes do uso por equipe.

## Verificação

npm test verifica contratos de resposta, datas inválidas, duplicação de cargas, PBs inconsistentes, segurança de URL e erros da API. npm run build verifica TypeScript e gera a aplicação. Essas verificações não substituem o teste PHP/Hostinger e a validação das regras de negócio no encerramento da configuração.
