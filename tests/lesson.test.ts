import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newLesson, parseStoredLessons, printSections, quarterSummary, timeUsed, validLesson } from '../src/lesson.ts';

const sample = { ...newLesson('2026-11-22', '2026-04'), title: 'Unidade', theme: 'Igreja', objectives: 'Ler e discutir', references: 'Efésios 4:1–6' };
test('aceita uma aula completa com agenda equilibrada', () => {
  assert.equal(timeUsed(sample), 60);
  assert.equal(validLesson(sample), '');
});
test('rejeita uma lição sem conteúdo obrigatório', () => assert.match(validLesson({ ...sample, title: ' ' }), /título/));
test('rejeita trimestre e dia de calendário inválidos', () => {
  assert.match(validLesson({ ...sample, quarter: '2026-05' }), /trimestre/);
  assert.match(validLesson({ ...sample, date: '2026-02-29' }), /data/);
});
test('rejeita duração e etapas fora dos limites', () => {
  assert.match(validLesson({ ...sample, duration: 0 }), /duração/);
  assert.match(validLesson({ ...sample, opening: 11 }), /Distribua/);
  assert.match(validLesson({ ...sample, opening: -1 }), /Distribua/);
});
test('dashboard filtra o trimestre e conta apenas as aulas ministradas', () => {
  const data = [sample, { ...sample, taught: true, date: '2026-11-15' }, { ...sample, quarter: '2026-03' }];
  const summary = quarterSummary(data, '2026-04');
  assert.equal(summary.planned, 2);
  assert.equal(summary.taught, 1);
  assert.equal(summary.minutes, 120);
  assert.equal(summary.lessons[0].date, '2026-11-15');
});
test('conteúdo de exportação preserva os objetivos e o tempo', () => {
  const sections = new Map(printSections(sample));
  assert.equal(sections.get('Objetivos pedagógicos'), 'Ler e discutir');
  assert.match(sections.get('Distribuição do tempo')!, /Encerramento — 5 min/);
  assert.ok(!sections.has('Roteiro'));
});

test('leitura local preserva lições válidas e rejeita estruturas corrompidas', () => {
  const saved = { ...sample, id: 'lição-1' };
  assert.deepEqual(parseStoredLessons(JSON.stringify([saved])), [saved]);
  assert.deepEqual(parseStoredLessons('[]'), []);
  for (const value of [null, {}, [null], [{ ...saved, date: null }], [saved, saved]]) {
    assert.throws(() => parseStoredLessons(JSON.stringify(value)), /Formato inválido/);
  }
});
