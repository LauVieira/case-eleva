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
