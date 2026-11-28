# Arquivo de lições — Laravel 13

API complementar ao React/TypeScript/Vite: persistência Eloquent em PostgreSQL, validação de planos, paginação e controle otimista de versões. O modo local, PDFs e backups JSON continuam independentes. Nenhuma lição local é enviada automaticamente.

## Instalação

PHP 8.3+ com `pdo_pgsql`, Composer 2, PostgreSQL 17 e Node.js 24.

```sh
cd laravel
composer install
cp .env.example .env
php -r 'echo bin2hex(random_bytes(32)), PHP_EOL;'
# Configure LOCAL_API_TOKEN e o banco no .env privado.
php artisan migrate
php artisan serve --host=127.0.0.1 --port=8000
```

O comando de cópia destina-se apenas a uma instalação nova. O banco e o usuário precisam existir antes da migração; nenhum comando apaga dados. Para experimentar sem PostgreSQL, use `DB_CONNECTION=sqlite`, crie um arquivo SQLite vazio e informe seu caminho absoluto em `DB_DATABASE`. Nunca publique bancos, credenciais ou `.env`.

Na raiz, execute `npm ci` e `npm run dev`. O proxy Vite encaminha `/archive-api` para `http://127.0.0.1:8000/api`. No painel “Arquivo no servidor”, informe o token, consulte o trimestre e selecione a lição que deseja salvar. O token permanece somente na memória da página. Desconectar apaga o token do painel. A importação nunca substitui uma lição local com o mesmo ID.

## Autenticação e autorização

Todos os endpoints `/api/lessons` exigem `Authorization: Bearer TOKEN`. O segredo deve ter pelo menos 32 caracteres aleatórios. Sem configuração a API falha fechada (503); token incorreto retorna 401. O servidor representa um único proprietário e seu arquivo de lições. Não há cadastro, múltiplas contas, papéis ou compartilhamento entre professores. Use apenas em loopback nesta versão. A rota `/up` é pública.

API sem cookies/sessões: não há autenticação implícita por navegador. O CORS não autoriza origens externas; Vite usa o proxy de mesma origem. React renderiza títulos e textos como texto, sem HTML arbitrário. O cliente usa `credentials: omit`, `cache: no-store`, redirecionamentos desativados e timeout de 10 segundos. Não grave o token em `localStorage`, URLs ou variáveis `VITE_*`.

## API

| Método | Rota | Corpo ou filtros | Resultado |
|---|---|---|---|
| GET | `/api/lessons` | `quarter=2026-04&page=1&limit=20` | `data`, `links`, `meta`; máximo 100 por página |
| GET | `/api/lessons/{uuid}` | — | `data: {lesson, revision, updatedAt}` |
| PUT | `/api/lessons/{uuid}` | `{lesson, revision:0}` | Criação, HTTP 201 e revisão 1 |
| PUT | `/api/lessons/{uuid}` | `{lesson, revision:N}` | Atualização, HTTP 200 e revisão N+1 |
| DELETE | `/api/lessons/{uuid}` | `{revision:N}` | Exclusão condicional, HTTP 204 |

`lesson` segue os campos de `src/lesson.ts`: `id`, `title`, `theme`, `quarter`, `date`, `duration`, `objectives`, `references`, `questions`, `opening`, `development`, `discussion`, `closing`, `outline`, `taught`. IDs são UUIDs e devem coincidir com a URL. Campos desconhecidos são rejeitados. Duração entre 15 e 240 minutos; a soma das etapas não pode exceder a duração. Datas usam AAAA-MM-DD e trimestres AAAA-01 a AAAA-04. Textos opcionais aceitam string vazia; campos obrigatórios rejeitam somente espaços.

Atualizações e exclusões usam uma única instrução SQL condicionada à revisão atual. Criação duplicada, revisão antiga ou atualização de um ID ausente retornam 409 sem sobrescrever dados. O cliente pede para atualizar a lista; não tenta gravar novamente automaticamente. A revisão precisa ser recarregada quando o item está em outra página. HTTP 422 indica validação, 413 limite de 64 KiB, 415 conteúdo diferente de JSON e 429 limite de 60 chamadas/minuto/IP. Nenhum upload é aceito.

## Banco e estrutura

Tabela `lessons`: UUID primário; título; trimestre; data da aula; payload JSON com o contrato do frontend; revisão inteira e timestamps. Índice composto em trimestre/data/ID suporta o filtro e a ordenação estável. Os dados de coluna usados em busca são derivados do payload validado. O modelo não faz atribuição em massa de campos recebidos sem validação.

- `app/Http/Controllers`: CRUD e concorrência.
- `app/Http/Requests`: validação e equivalência com os campos React.
- `app/Http/Resources`: contrato de saída.
- `app/Http/Middleware`: token e limite do corpo.
- `app/Models`: Eloquent.
- `database/migrations`: estrutura do banco.
- `tests/Feature`: autenticação, validação, CRUD, paginação e concorrência por revisão.

## Testar

```sh
composer validate --no-check-publish
composer audit
php artisan route:list --json
php artisan test
```

A suíte usa SQLite em memória por padrão via `.env.testing`, que contém apenas configuração de testes sem credenciais. Para testar PostgreSQL: defina `DB_CONNECTION=pgsql`, `DB_DATABASE`, `DB_HOST`, `DB_USERNAME` e `DB_PASSWORD` no ambiente de uma base exclusiva de testes antes de executar a suíte. `RefreshDatabase` recria as tabelas de teste; nunca aponte os testes para uma base com dados reais. O workflow executa os mesmos testes em SQLite e PostgreSQL. Na raiz: `npm test` e `npm run build`.

## Operação

O build estático continua utilizável sem a API; o painel de arquivo precisa do backend e do proxy. Em uma implantação futura, configure o proxy `/archive-api` para o backend e sirva ambos por HTTPS. Não inclua o token no bundle. `CACHE_STORE=file` é destinado a um servidor local; múltiplas instâncias exigem um cache compartilhado e uma revisão de proxy/IP. Filas, Sanctum e policies por usuário ficam fora deste escopo de proprietário único.
