const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const output = process.argv[2];
if (!output || fs.existsSync(output)) throw new Error('Informe um resultado novo.');

const source = fs.readFileSync('src/utils/classForm.js', 'utf8');
const transformed = babel.transformSync(source, {
  filename: path.resolve('src/utils/classForm.js'),
  presets: [['@babel/preset-env', { modules: 'commonjs', targets: { node: 'current' } }]],
  babelrc: false,
  configFile: false,
}).code;
const loaded = new module.constructor();
loaded._compile(transformed, path.resolve('src/utils/classForm.js'));
const form = loaded.exports;

const backendOptions = require(path.resolve('../case-eleva-api/src/constants/classOptions.js'));
const results = [];
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const pass = (caso) => results.push({ caso, resultado: 'passou' });

const creche = 'Educação Infantil — Creche';
const presch = 'Educação Infantil — Pré-escola';
const fundamental = 'Ensino Fundamental';
const medio = 'Ensino Médio';

assert(form.SEGMENTS.join('|') === [creche, presch, fundamental, medio].join('|'), 'Segmentos divergentes.');
assert(JSON.stringify(form.GRADES_BY_SEGMENT) === JSON.stringify(backendOptions.GRADES_BY_SEGMENT), 'Grupos divergentes do backend.');
assert(JSON.stringify(form.SHIFTS) === JSON.stringify(backendOptions.SHIFTS), 'Turnos divergentes do backend.');
pass('opcoes_iguais_ao_contrato');

assert(form.normaliseClassName('  TURMA   A  ') === 'turma a', 'Normalizacao do exemplo.');
assert(form.normaliseClassName('  José   ') === 'josé', 'Acento removido indevidamente.');
assert(form.formatClassName('turma a') === 'TURMA A', 'Apresentacao da turma.');
assert(form.formatClassName('josé') === 'JOSÉ', 'Apresentacao com acento.');
assert(form.gradeFieldLabel(fundamental) === 'Ano' && form.gradeFieldLabel(medio) === 'Ano', 'Rotulo de ano.');
assert(form.gradeFieldLabel(creche) === 'Grupo' && form.gradeFieldLabel(presch) === 'Grupo', 'Rotulo de grupo.');
assert(form.gradeFieldLabel('') === 'Grupo/ano', 'Rotulo sem segmento.');
pass('normalizacao_apresentacao_e_rotulos');

const base = {
  name: 'Turma A', segment: fundamental, grade: '1º ano', shift: 'Matutino', status: 'current', maxOccupancy: '0',
};
assert(Object.keys(form.validateClassForm(base)).length === 0, 'Formulario valido rejeitado.');
const payload = form.serializeClassForm({ ...base, name: '  TURMA   A  ' });
assert(JSON.stringify(payload) === JSON.stringify({
  name: 'turma a', segment: fundamental, grade: '1º ano', shift: 'Matutino', status: 'current', maxOccupancy: 0,
}), 'Payload de capacidade zero divergente.');
assert(!Object.prototype.hasOwnProperty.call(payload, 'schoolId'), 'schoolId entrou no corpo.');
pass('payload_zero_sem_school_id');

assert(form.validateClassForm({ ...base, name: '   ' }).name, 'Nome vazio aceito.');
assert(form.validateClassForm({ ...base, name: 'a'.repeat(51) }).name, 'Nome acima de 50 aceito.');
assert(!form.validateClassForm({ ...base, name: 'a'.repeat(50) }).name, 'Nome de 50 rejeitado.');
assert(form.validateClassForm({ ...base, segment: '', grade: '' }).segment, 'Segmento vazio aceito.');
assert(form.validateClassForm({ ...base, grade: '' }).grade, 'Grupo vazio aceito.');
assert(form.validateClassForm({ ...base, segment: creche, grade: '1º ano' }).grade, 'Combinacao incompativel aceita.');
assert(form.validateClassForm({ ...base, shift: '' }).shift, 'Turno vazio aceito.');
assert(form.validateClassForm({ ...base, status: 'ativa' }).status, 'Situacao fora do contrato aceita.');
assert(!form.validateClassForm({ ...base, status: 'completed' }).status, 'Encerrada rejeitada no cadastro.');
['', ' ', '-1', '1.5', '1e2', '00', '+1', '2147483648'].forEach((value) => {
  assert(form.validateClassForm({ ...base, maxOccupancy: value }).maxOccupancy, `Capacidade invalida aceita: ${value}`);
});
assert(!form.validateClassForm({ ...base, maxOccupancy: '2147483647' }).maxOccupancy, 'Limite tecnico rejeitado.');
assert(form.serializeClassForm({ ...base, maxOccupancy: '2147483647' }).maxOccupancy === 2147483647, 'Limite nao serializado.');
pass('validacao_de_nome_combinacao_situacao_e_capacidade');

const record = {
  data: '2026-11-08',
  metodo: 'Node, funcoes de src/utils/classForm.js carregadas por Babel, sem navegador e sem API.',
  resultados: results,
  resultado: 'passou_nos_casos_verificados',
};
fs.writeFileSync(output, `${JSON.stringify(record, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ casos: results.length, resultado: record.resultado }));
