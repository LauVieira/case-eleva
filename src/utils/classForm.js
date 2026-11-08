export const MAX_OCCUPANCY = 2147483647;

export const GRADES_BY_SEGMENT = {
  'Educação Infantil — Creche': ['Berçário', 'Maternal I', 'Maternal II'],
  'Educação Infantil — Pré-escola': ['Jardim I', 'Jardim II'],
  'Ensino Fundamental': ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano', '6º ano', '7º ano', '8º ano', '9º ano'],
  'Ensino Médio': ['1º ano', '2º ano', '3º ano'],
};

export const SEGMENTS = Object.keys(GRADES_BY_SEGMENT);

export const SHIFTS = ['Matutino', 'Vespertino', 'Noturno', 'Integral'];

export const STATUSES = [
  { value: 'current', label: 'Ativa' },
  { value: 'completed', label: 'Encerrada' },
];

export function gradeFieldLabel (segment) {
  if (segment === 'Ensino Fundamental' || segment === 'Ensino Médio') return 'Ano';
  if (segment === 'Educação Infantil — Creche' || segment === 'Educação Infantil — Pré-escola') return 'Grupo';
  return 'Grupo/ano';
}

export function normaliseClassName (value) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase();
}

export function formatClassName (name) {
  return String(name == null ? '' : name).toLocaleUpperCase('pt-BR');
}

export function formatClassStatus (status) {
  if (status === 'current') return 'Ativa';
  if (status === 'completed') return 'Encerrada';
  return '';
}

export function formatClassDate (value) {
  if (value == null || value === '') return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export function classToFormValues (record) {
  return {
    name: formatClassName(record.name || ''),
    segment: record.segment || '',
    grade: record.grade || '',
    shift: record.shift || '',
    status: record.status || 'current',
    maxOccupancy: record.maxOccupancy == null ? '' : String(record.maxOccupancy),
  };
}

export function changedClassFields (current, original) {
  return Object.fromEntries(
    Object.entries(current).filter(([field, value]) => value !== original[field]),
  );
}

export function emptyClassForm () {
  return {
    name: '',
    segment: '',
    grade: '',
    shift: '',
    status: 'current',
    maxOccupancy: '',
  };
}

function occupancyError (raw) {
  const text = String(raw == null ? '' : raw).trim();
  if (!text) return 'Informe a capacidade da turma.';
  if (!/^(0|[1-9]\d*)$/.test(text)) {
    return 'Informe um número inteiro maior ou igual a zero.';
  }
  if (text.length > 10 || Number(text) > MAX_OCCUPANCY) {
    return 'A capacidade deve ser um inteiro de 0 a 2147483647.';
  }
  return '';
}

export function serializeClassForm (values) {
  return {
    name: normaliseClassName(values.name),
    segment: values.segment,
    grade: values.grade,
    shift: values.shift,
    status: values.status,
    maxOccupancy: Number(String(values.maxOccupancy).trim()),
  };
}

export function validateClassForm (values) {
  const data = serializeClassForm(values);
  const errors = {};
  const grades = GRADES_BY_SEGMENT[data.segment];

  if (!data.name) errors.name = 'Informe o nome da turma.';
  else if (data.name.length > 50) errors.name = 'O nome deve ter até 50 caracteres após normalização.';

  if (!grades) errors.segment = 'Selecione um segmento.';

  if (!data.grade) errors.grade = 'Selecione o grupo ou ano do segmento.';
  else if (grades && !grades.includes(data.grade)) {
    errors.grade = 'Selecione um grupo ou ano compatível com o segmento.';
  }

  if (!SHIFTS.includes(data.shift)) errors.shift = 'Selecione um turno.';

  if (!STATUSES.some((item) => item.value === data.status)) {
    errors.status = 'Selecione a situação da turma.';
  }

  const occupancyMessage = occupancyError(values.maxOccupancy);
  if (occupancyMessage) errors.maxOccupancy = occupancyMessage;

  return errors;
}
