import React from 'react';
import styled from 'styled-components';
import { Button, Form } from 'react-bootstrap';

import {
  GRADES_BY_SEGMENT, SEGMENTS, SHIFTS, STATUSES, gradeFieldLabel,
} from '../utils/classForm';

export default function ClassForm (props) {
  const {
    values, onChange, onSubmit, errors = {}, submitting = false, onBack,
    submitLabel = 'Cadastrar turma', cancelLabel = 'Voltar para as turmas',
    notice = '', noticeRef,
  } = props;
  const grades = GRADES_BY_SEGMENT[values.segment] || [];
  const gradeLabel = gradeFieldLabel(values.segment);
  const gradeHelpId = errors.grade ? 'class-grade-help class-grade-error' : 'class-grade-help';

  return (
    <Form noValidate onSubmit={onSubmit}>
      <Form.Group controlId="class-name">
        <Form.Label>Nome da turma (obrigatório)</Form.Label>
        <Form.Control
          type="text"
          name="name"
          value={values.name}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.name)}
          aria-invalid={errors.name ? true : undefined}
          aria-required="true"
          aria-describedby={errors.name ? 'class-name-help class-name-error' : 'class-name-help'}
        />
        {errors.name && (
          <Form.Control.Feedback type="invalid" id="class-name-error">
            {errors.name}
          </Form.Control.Feedback>
        )}
        <Form.Text id="class-name-help">
          Até 50 caracteres. Espaços extras serão ajustados ao salvar.
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="class-segment">
        <Form.Label>Segmento (obrigatório)</Form.Label>
        <Form.Control
          as="select"
          name="segment"
          value={values.segment}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.segment)}
          aria-invalid={errors.segment ? true : undefined}
          aria-required="true"
          aria-describedby={errors.segment ? 'class-segment-help class-segment-error' : 'class-segment-help'}
        >
          <option value="">Selecione um segmento</option>
          {SEGMENTS.map((segment) => (
            <option key={segment} value={segment}>{segment}</option>
          ))}
        </Form.Control>
        {errors.segment && (
          <Form.Control.Feedback type="invalid" id="class-segment-error">
            {errors.segment}
          </Form.Control.Feedback>
        )}
        <Form.Text id="class-segment-help">
          O grupo ou ano disponível depende do segmento escolhido.
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="class-grade">
        <Form.Label>{`${gradeLabel} (obrigatório)`}</Form.Label>
        <Form.Control
          as="select"
          name="grade"
          value={values.grade}
          onChange={onChange}
          disabled={submitting || !values.segment}
          isInvalid={Boolean(errors.grade)}
          aria-invalid={errors.grade ? true : undefined}
          aria-required="true"
          aria-describedby={gradeHelpId}
        >
          <option value="">{values.segment ? 'Selecione' : 'Selecione o segmento primeiro'}</option>
          {grades.map((grade) => (
            <option key={grade} value={grade}>{grade}</option>
          ))}
        </Form.Control>
        {errors.grade && (
          <Form.Control.Feedback type="invalid" id="class-grade-error">
            {errors.grade}
          </Form.Control.Feedback>
        )}
        <Form.Text id="class-grade-help">
          {values.segment
            ? 'A seleção anterior é limpa quando deixa de pertencer ao segmento.'
            : 'Selecione o segmento para ver as opções.'}
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="class-shift">
        <Form.Label>Turno (obrigatório)</Form.Label>
        <Form.Control
          as="select"
          name="shift"
          value={values.shift}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.shift)}
          aria-invalid={errors.shift ? true : undefined}
          aria-required="true"
          aria-describedby={errors.shift ? 'class-shift-help class-shift-error' : 'class-shift-help'}
        >
          <option value="">Selecione um turno</option>
          {SHIFTS.map((shift) => (
            <option key={shift} value={shift}>{shift}</option>
          ))}
        </Form.Control>
        {errors.shift && (
          <Form.Control.Feedback type="invalid" id="class-shift-error">
            {errors.shift}
          </Form.Control.Feedback>
        )}
        <Form.Text id="class-shift-help">
          Matutino, Vespertino, Noturno ou Integral.
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="class-status">
        <Form.Label>Situação (obrigatório)</Form.Label>
        <Form.Control
          as="select"
          name="status"
          value={values.status}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.status)}
          aria-invalid={errors.status ? true : undefined}
          aria-required="true"
          aria-describedby={errors.status ? 'class-status-help class-status-error' : 'class-status-help'}
        >
          {STATUSES.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </Form.Control>
        {errors.status && (
          <Form.Control.Feedback type="invalid" id="class-status-error">
            {errors.status}
          </Form.Control.Feedback>
        )}
        <Form.Text id="class-status-help">
          A turma começa como Ativa. A situação escolhida é enviada no cadastro.
        </Form.Text>
      </Form.Group>

      <Form.Group controlId="class-occupancy">
        <Form.Label>Limite de alunos (obrigatório)</Form.Label>
        <Form.Control
          type="text"
          inputMode="numeric"
          name="maxOccupancy"
          value={values.maxOccupancy}
          onChange={onChange}
          disabled={submitting}
          isInvalid={Boolean(errors.maxOccupancy)}
          aria-invalid={errors.maxOccupancy ? true : undefined}
          aria-required="true"
          aria-describedby={errors.maxOccupancy ? 'class-occupancy-help class-occupancy-error' : 'class-occupancy-help'}
        />
        {errors.maxOccupancy && (
          <Form.Control.Feedback type="invalid" id="class-occupancy-error">
            {errors.maxOccupancy}
          </Form.Control.Feedback>
        )}
        <Form.Text id="class-occupancy-help">
          Número inteiro a partir de zero. Zero é aceito.
        </Form.Text>
      </Form.Group>

      {notice && (
        <Notice ref={noticeRef} tabIndex={-1} role="status">
          {notice}
        </Notice>
      )}
      <Actions>
        <SubmitButton type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : submitLabel}
        </SubmitButton>
        {onBack && (
          <CancelButton type="button" variant="outline-secondary" onClick={onBack} disabled={submitting}>
            {cancelLabel}
          </CancelButton>
        )}
      </Actions>
    </Form>
  );
}

const Notice = styled.p`
  margin-bottom: 12px;
`;

const Actions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
`;

const SubmitButton = styled(Button)`
  background-color: var(--navy-blue);
  border-color: var(--navy-blue);
  margin-top: 8px;
`;

const CancelButton = styled(Button)`
  margin-top: 8px;
`;
