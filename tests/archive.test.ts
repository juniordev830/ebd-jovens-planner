import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ArchiveError, listArchivedLessons, readArchivedLesson, saveArchivedLesson } from '../src/archive.ts';
import { newLesson } from '../src/lesson.ts';

const token = 't'.repeat(64);
const lesson = {
  ...newLesson('2026-11-22', '2026-04'), id: '018e5280-56b2-74e1-8d54-a832a2b32878',
  title: 'Unidade', theme: 'Igreja', objectives: 'Ler e discutir', references: 'Efésios 4:1–6',
};
const record = { lesson, revision: 1, updatedAt: '2026-11-28T15:00:00Z' };

test('valida o contrato do servidor antes de importar uma lição', () => {
  assert.deepEqual(readArchivedLesson(record), record);
  assert.throws(() => readArchivedLesson({ ...record, revision: 0 }));
  assert.throws(() => readArchivedLesson({ ...record, lesson: { ...lesson, duration: -1 } }));
  assert.throws(() => readArchivedLesson({ ...record, lesson: null }));
});

test('consulta paginação usando token e sem cache ou cookies', async context => {
  const page = { data: [record], meta: { current_page: 2, last_page: 3, total: 41 } };
  const fetcher = context.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, '/archive-api/lessons?quarter=2026-04&page=2&limit=20');
    assert.equal((options.headers as Record<string, string>).Authorization, 'Bearer ' + token);
    assert.equal(options.credentials, 'omit');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.redirect, 'error');
    return Response.json(page);
  });
  assert.deepEqual(await listArchivedLessons(token, '2026-04', 2), page);
  assert.equal(fetcher.mock.callCount(), 1);
});

test('envia a revisão conhecida e preserva o conteúdo da lição', async context => {
  context.mock.method(globalThis, 'fetch', async (url: string, options: RequestInit) => {
    assert.equal(url, '/archive-api/lessons/' + lesson.id);
    assert.equal(options.method, 'PUT');
    assert.deepEqual(JSON.parse(String(options.body)), { lesson, revision: 1 });
    return Response.json({ data: { ...record, revision: 2 } });
  });
  assert.equal((await saveArchivedLesson(token, lesson, 1)).revision, 2);
});

test('um conflito informa o usuário e não tenta sobrescrever automaticamente', async context => {
  const fetcher = context.mock.method(globalThis, 'fetch', async () => Response.json({ message: 'internal' }, { status: 409 }));
  await assert.rejects(saveArchivedLesson(token, lesson, 1), (reason: unknown) => reason instanceof ArchiveError && reason.status === 409);
  assert.equal(fetcher.mock.callCount(), 1);
});

test('token ausente e respostas inválidas não entram nos dados locais', async context => {
  const fetcher = context.mock.method(globalThis, 'fetch', async () => Response.json({ data: 'bad' }));
  await assert.rejects(listArchivedLessons('', '2026-04'));
  assert.equal(fetcher.mock.callCount(), 0);
  await assert.rejects(listArchivedLessons(token, '2026-04'));
});
