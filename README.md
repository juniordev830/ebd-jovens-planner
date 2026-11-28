# Planejador EBD Jovens

**Navegação** · [Como executar](#como-executar) · [Exemplo de uso](#exemplo-de-uso) · [Limitações](#limitações) · [Código e estudo](docs/ENGENHARIA_REVERSA.md)

Cadastro de lições, trimestre, objetivos, referências, divisão de tempo, questões, acompanhamento e exportação em PDF.

## Como executar

Requisitos: Node.js 24 e npm. Para a concordância, Python 3.12 também é necessário.

```bash
npm ci
npm run dev
```

Abra o endereço local informado pelo Vite. Para conferir o projeto:

```bash
npm test
npm run build
```

## Exemplo de uso

Cadastre uma lição com data, objetivos e referências, distribua o tempo e baixe o PDF.

Em **Backup das lições**, baixe um JSON com todos os trimestres. Em outro navegador, selecione o arquivo, confira quantas lições serão adicionadas e clique em **Importar lições**. A importação preserva as lições com IDs que já existem.

## Limitações

As lições são criadas pelo professor. Não há reprodução de revistas ou lições da CPAD.

## Arquitetura e fontes

A interface usa React e TypeScript, com Vite para desenvolvimento e build. A lógica do domínio fica em módulos de `src/`, separados da interface, e os testes em `tests/`. Os dados pessoais dos recursos que exigem persistência usam armazenamento local do navegador. A concordância possui API FastAPI e índice local em `backend/`.

As fontes e licenças estão em [docs/FONTES.md](docs/FONTES.md). A licença do código está em [LICENSE](LICENSE). O fluxo em `.github/workflows/ci.yml` executa testes e build em pushes e pull requests.

## Código e roteiro de estudo

Como testar que um planejamento acima do tempo disponível é identificado antes da exportação? O [guia de engenharia reversa](docs/ENGENHARIA_REVERSA.md) reúne o mapa dos módulos e uma pergunta técnica baseada no projeto.

Mantido por [João Junior](https://github.com/juniordev830).
