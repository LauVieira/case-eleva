export function serializeSchoolForm (values) {
  const phone = values.phone.trim().replace(/[()\s.-]/g, '');
  let canonicalPhone = null;
  if (phone) canonicalPhone = phone.startsWith('+') ? phone : `+55${phone}`;

  return {
    sectorId: Number(values.sectorId),
    name: values.name.trim().replace(/\s+/g, ' ').toLowerCase(),
    address: values.address.trim(),
    headteacher: values.headteacher.trim() || null,
    phone: canonicalPhone,
  };
}

export function formatSchoolName (name) {
  return name.replace(/\S+/g, (word) => word.charAt(0).toUpperCase() + word.slice(1));
}

export function schoolToFormValues (school) {
  return {
    sectorId: String(school.sectorId),
    name: formatSchoolName(school.name || ''),
    address: school.address || '',
    headteacher: school.headteacher || '',
    phone: school.phone || '',
  };
}

export function validateSchoolForm (values, sectors) {
  const data = serializeSchoolForm(values);
  const errors = {};

  if (!Number.isInteger(data.sectorId) || data.sectorId <= 0
    || !sectors.some((sector) => sector.id === data.sectorId)) {
    errors.sectorId = 'Selecione um setor existente.';
  }

  if (!data.name) errors.name = 'Informe o nome da escola.';
  else if (data.name.length > 100) errors.name = 'O nome deve ter até 100 caracteres após normalização.';

  if (!data.address) errors.address = 'Informe o endereço da escola.';
  else if (data.address.length > 255) errors.address = 'O endereço deve ter até 255 caracteres.';

  if (data.headteacher && data.headteacher.length > 150) {
    errors.headteacher = 'O nome do(a) diretor(a) deve ter até 150 caracteres.';
  }

  if (data.phone && !/^\+55\d{10,11}$/.test(data.phone)) {
    errors.phone = 'Informe telefone com DDD e 8 ou 9 dígitos, como (22) 2345-6789.';
  }

  return errors;
}
