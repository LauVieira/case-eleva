import React from 'react';
import styled from 'styled-components';
import { Button, Form } from 'react-bootstrap';

export default function SchoolForm (props) {
  const {
    values, sectors, onChange, onSubmit,
    submitLabel = 'Cadastrar escola',
    sectorHelp = 'A escola será cadastrada no setor selecionado.',
    errors = {}, submitting = false, onCancel,
  } = props;

  return (
    <Form noValidate onSubmit={onSubmit}>
      <Form.Group controlId="school-sector">
        <Form.Label>Setor (obrigatório)</Form.Label>
        <Form.Control
          as="select"
          name="sectorId"
          value={values.sectorId}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.sectorId)}
          aria-invalid={errors.sectorId ? true : undefined}
          aria-required="true"
          aria-describedby={errors.sectorId ? 'school-sector-help school-sector-error' : 'school-sector-help'}
        >
          <option value="">Selecione um setor</option>
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.id}>{sector.name}</option>
          ))}
        </Form.Control>
        {errors.sectorId && (
          <Form.Control.Feedback type="invalid" id="school-sector-error">
            {errors.sectorId}
          </Form.Control.Feedback>
        )}
        <Form.Text id="school-sector-help">
          {sectorHelp}
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="school-name">
        <Form.Label>Nome da escola (obrigatório)</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={values.name}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.name)}
          aria-invalid={errors.name ? true : undefined}
          aria-required="true"
          aria-describedby={errors.name ? 'school-name-help school-name-error' : 'school-name-help'}
        />
        {errors.name && (
          <Form.Control.Feedback type="invalid" id="school-name-error">
            {errors.name}
          </Form.Control.Feedback>
        )}
        <Form.Text id="school-name-help">
          Informe o nome completo da escola, com até 100 caracteres.
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="school-address">
        <Form.Label>Endereço (obrigatório)</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          name="address"
          value={values.address}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.address)}
          aria-invalid={errors.address ? true : undefined}
          aria-required="true"
          aria-describedby={errors.address ? 'school-address-help school-address-error' : 'school-address-help'}
        />
        {errors.address && (
          <Form.Control.Feedback type="invalid" id="school-address-error">
            {errors.address}
          </Form.Control.Feedback>
        )}
        <Form.Text id="school-address-help">
          Informe o endereço completo em um único campo, com até 255 caracteres.
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="school-headteacher">
        <Form.Label>Diretor(a) (opcional)</Form.Label>
        <Form.Control
          type="text"
          name="headteacher"
          value={values.headteacher}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.headteacher)}
          aria-invalid={errors.headteacher ? true : undefined}
          aria-describedby={errors.headteacher ? 'school-headteacher-help school-headteacher-error' : 'school-headteacher-help'}
        />
        {errors.headteacher && (
          <Form.Control.Feedback type="invalid" id="school-headteacher-error">
            {errors.headteacher}
          </Form.Control.Feedback>
        )}
        <Form.Text id="school-headteacher-help">
          Até 150 caracteres. Pode deixar em branco.
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="school-phone">
        <Form.Label>Telefone (opcional)</Form.Label>
        <Form.Control
          type="tel"
          inputMode="tel"
          name="phone"
          value={values.phone}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.phone)}
          aria-invalid={errors.phone ? true : undefined}
          aria-describedby={errors.phone ? 'school-phone-help school-phone-error' : 'school-phone-help'}
        />
        {errors.phone && (
          <Form.Control.Feedback type="invalid" id="school-phone-error">
            {errors.phone}
          </Form.Control.Feedback>
        )}
        <Form.Text id="school-phone-help">
          Informe DDD e número. Exemplos: (22) 2345-6789 ou (22) 99876-5432.
        </Form.Text>
      </Form.Group>

      <Actions>
        <SubmitButton type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : submitLabel}
        </SubmitButton>
        {onCancel && (
          <CancelButton type="button" variant="outline-secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </CancelButton>
        )}
      </Actions>
    </Form>
  );
}

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const CancelButton = styled(Button)`
  margin-top: 8px;
`;

const SubmitButton = styled(Button)`
  background-color: var(--navy-blue);
  border-color: var(--navy-blue);
  margin-top: 8px;
`;
