# Engenharia reversa e estudo — Planejador EBD Jovens

## Objetivo e fluxo

Planejamento de lições e exportação de material de EBD. lesson.ts concentra regras e composição das lições, pdf.ts prepara a exportação, e backup.ts valida a restauração dos registros locais.

**Tecnologias identificadas** · TypeScript, React, Vite, Node.js.

**Revisão de referência** · `c65a1f8e6545`.

## Mapa do código

| Caminho | Papel de leitura | Símbolos selecionados |
| --- | --- | --- |
| [src/App.tsx](../src/App.tsx) | Implementação | `App`, `change`, `edit`, `save`, `exportPdf`, `downloadBackup`, `selectBackup`, `confirmBackup`, `quarterLabel` |
| [src/backup.ts](../src/backup.ts) | Implementação | `makeBackup`, `readBackup`, `newBackupLessons` |
| [src/lesson.ts](../src/lesson.ts) | Implementação | `newLesson`, `timeUsed`, `validLesson`, `isStoredLesson`, `parseStoredLessons`, `quarterSummary`, `printSections` |
| [src/main.tsx](../src/main.tsx) | Ponto de leitura para entrada ou composição | — |
| [src/pdf.ts](../src/pdf.ts) | Implementação | `lessonPdf`, `line` |
| [src/storage.ts](../src/storage.ts) | Implementação | `useLocalState` |
| [vite.config.ts](../vite.config.ts) | Implementação | — |
| [index.html](../index.html) | Marcação ou estilos da interface | — |
| [src/style.css](../src/style.css) | Marcação ou estilos da interface | — |

## Configuração e referências

Ambiente e dependências: [package.json](../package.json).

## Roteiro de estudo e desenvolvimento

1. Comece pelo fluxo descrito acima e localize seus pontos de entrada no mapa. Acompanhe uma entrada válida até a transformação ou a resposta.
2. Abra um teste relacionado ao fluxo e descreva qual regra ele protege. Compare o tratamento esperado para entradas válidas, inválidas e nos limites.
3. Ao adicionar uma regra, determine qual módulo controla o dado e cubra o caso nesse nível. Em seguida, confira o efeito no comando, na API ou na interface de entrada.

**Pergunta de entrevista**

Como testar que um planejamento acima do tempo disponível é identificado antes da exportação?

## Testes versionados

Arquivos para começar a leitura dos cenários de teste: [tests/backup.test.ts](../tests/backup.test.ts), [tests/lesson.test.ts](../tests/lesson.test.ts).

Os comandos e versões de runtime usados no CI ficam em [.github/workflows/ci.yml](../.github/workflows/ci.yml).

[Voltar ao README](../README.md).
