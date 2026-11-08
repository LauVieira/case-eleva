/* eslint-disable react/jsx-one-expression-per-line */

import React from 'react';
import styled from 'styled-components';
import {
  Card, ListGroup,
} from 'react-bootstrap';
import { SiGoogleclassroom } from 'react-icons/si';
import { BiEdit } from 'react-icons/bi';
import { ImBin, ImInfo } from 'react-icons/im';

function formatTotalCapacity (value) {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return String(Number(value));
  }
  return '';
}

export default function SchoolCard (props) {
  const { schoolData, onDelete } = props;
  const {
    address, headteacher, id, name, phone, totalCapacity,
  } = schoolData;
  const link = `/escola/${id}/classes`;
  const editLink = id ? `/escola/${id}/editar` : null;

  return (
    <StyledCard style={{ width: '50rem', maxWidth: '95%' }}>

      <Card.Body>

        <Card.Title>{name}</Card.Title>

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
          Capacidade total: {formatTotalCapacity(totalCapacity)}
        </CardText>
        <CardText>
          Vagas ocupadas: -
        </CardText>

      </Card.Body>

      <StyledListGroup className="list-group-flush">

        <SchoolItem action href={link}>
          <SiGoogleclassroom /> Ver turmas
        </SchoolItem>
        <SchoolItem>
          <ImInfo /> Dados avançados
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
  margin: 0 auto;

  .card-title {
    font-size: 24px !important;
    margin-bottom: 25px;
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
