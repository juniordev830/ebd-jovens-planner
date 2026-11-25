import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newLesson } from '../src/lesson.ts';
import { decodeBackup, makeBackup, maxBackupBytes, newBackupLessons, readBackup } from '../src/backup.ts';

const lesson = {
  ...newLesson('2026-11-22', '2026-04'),
  id: 'aula-1', title: 'Unidade', theme: 'Oração',
  objectives: 'Ler e discutir', references: 'Efésios 4:1–6',
};

test('o backup preserva conteúdo, caracteres e trimestre', () => {
  assert.deepEqual(readBackup(makeBackup([lesson])), [lesson]);
});

test('o backup rejeita versões desconhecidas e dados duplicados ou inválidos', () => {
  assert.throws(() => readBackup(makeBackup([lesson]).replace('"version": 1', '"version": 9')));
  assert.throws(() => readBackup(makeBackup([lesson, lesson])));
  assert.throws(() => readBackup(makeBackup([{ ...lesson, duration: -1 }])));
});

test('a importação conserva a lição local quando encontra o mesmo ID', () => {
  const another = { ...lesson, id: 'aula-2' };
  assert.deepEqual(newBackupLessons([lesson], [{ ...lesson, title: 'Outra versão' }, another]), [another]);
});

test('rejeita backups acima do limite em bytes, inclusive com caracteres multibyte', () => {
  assert.throws(() => readBackup(' '.repeat(maxBackupBytes + 1)), /limite/);
  const raw = makeBackup([{ ...lesson, outline: 'á'.repeat(Math.ceil(maxBackupBytes / 2)) }]);
  assert.ok(raw.length < maxBackupBytes);
  assert.throws(() => readBackup(raw), /limite/);
});

test('decodifica UTF-8 válido e rejeita sequências malformadas', () => {
  const bytes = new TextEncoder().encode(makeBackup([lesson]));
  assert.deepEqual(decodeBackup(bytes.buffer as ArrayBuffer), [lesson]);
  assert.throws(() => decodeBackup(new Uint8Array([0xc3, 0x28]).buffer));
  assert.throws(() => decodeBackup(new ArrayBuffer(maxBackupBytes + 1)), /limite/);
});
