# Arquitetura — EBD Jovens Planner

O frontend React/TypeScript/Vite mantém suas lições em `localStorage`, exporta PDF e troca backups JSON. A integração opcional adiciona o módulo `laravel/` como arquivo de lições em um banco PostgreSQL. Não há backend anterior a migrar nem substituição dos dados locais.

`ArchivePanel` realiza apenas operações solicitadas pelo usuário. `archive.ts` valida o contrato recebido, envia o token por cabeçalho e trata erros sem repetição automática de gravações. A interface permite arquivar cópias e importar somente IDs inexistentes no navegador. O servidor protege o CRUD por um token de proprietário único e revisão otimista. O contrato completo, modelo de dados, limites e comandos estão no [README da API](laravel/README.md).

As validações React existentes são reaproveitadas no cliente. Como o servidor não pode confiar no navegador, `StoreLessonRequest` valida o mesmo contrato em PHP; os testes de ida e volta mantêm os campos equivalentes. Não são copiados os geradores de PDF, os backups ou a lógica de armazenamento local. PostgreSQL é o banco operacional; SQLite em memória verifica rapidamente o contrato HTTP nos testes.
