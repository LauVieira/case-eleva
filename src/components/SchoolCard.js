/* eslint-disable react/jsx-one-expression-per-line */

import React from 'react';
import styled from 'styled-components';
import {
  Card, ListGroup,
} from 'react-bootstrap';
import { SiGoogleclassroom } from 'react-icons/si';
import { BiEdit } from 'react-icons/bi';
import { ImBin } from 'react-icons/im';
import { formatClassDate } from '../utils/classForm';
import { formatSchoolName } from '../utils/schoolForm';

function formatTotalCapacity (value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return String(Number(value));
  }
  return '';
}

export default function SchoolCard (props) {
  const { schoolData, onDelete, headingRef } = props;
  const {
    address, createdAt, headteacher, id, name, phone, totalCapacity, updatedAt,
  } = schoolData;
  const link = `/escola/${id}/classes`;
  const editLink = id ? `/escola/${id}/editar` : null;

  return (
    <StyledCard>

      <Card.Body>

        <Card.Title as="h1" ref={headingRef} tabIndex={-1}>{formatSchoolName(name || '')}</Card.Title>

        <CardText>
          Endereço: {address}
        </CardText>
        <CardText>
          Telefone: {phone}
        </CardText>
        <CardText>
          Diretor(a): {headteacher}
        </CardText>
        <CardText>
          Limite de alunos: {formatTotalCapacity(totalCapacity)}
        </CardText>
        <CardText>
          Criada em: {formatClassDate(createdAt)}
        </CardText>
        <CardText>
          Atualizada em: {formatClassDate(updatedAt)}
        </CardText>

      </Card.Body>

      <StyledListGroup className="list-group-flush">

        <SchoolItem action href={link}>
          <SiGoogleclassroom /> Ver turmas
        </SchoolItem>
        {editLink && (
          <SchoolItem action href={editLink}>
            <BiEdit aria-hidden="true" focusable="false" /> Editar escola
          </SchoolItem>
        )}
        {id && onDelete && (
          <SchoolItem action type="button" onClick={onDelete}>
            <ImBin aria-hidden="true" focusable="false" /> Excluir escola
          </SchoolItem>
        )}

      </StyledListGroup>

    </StyledCard>
  );
}

const StyledListGroup = styled(ListGroup)`
  margin-top: 15px;
`;

const StyledCard = styled(Card)`
  box-shadow: 3px 2px 10px 1px #B7B5B2;
  margin-left: auto;
  margin-right: auto;
  max-width: 95%;
  width: 50rem;

  .card-title {
    font-size: 24px !important;
    font-weight: 500;
    line-height: 1.2;
    margin-bottom: 25px;
    margin-top: 0;
    text-align: center;
  }
`;

const CardText = styled(Card.Text)``;

const SchoolItem = styled(ListGroup.Item)`
  cursor: pointer;

  svg {
    margin: 0 5px -2px 0;
  }
`;
