/* eslint-disable react/jsx-one-expression-per-line */

import React from 'react';
import styled from 'styled-components';
import {
  Card, ListGroup,
} from 'react-bootstrap';
import { SiGoogleclassroom } from 'react-icons/si';
import { BiEdit } from 'react-icons/bi';
import { ImBin, ImInfo } from 'react-icons/im';

export default function SchoolCard (props) {
  const { schoolData } = props;
  const {
    address, headteacher, id, name, phone,
  } = schoolData;
  const link = `/escola/${id}/classes`;

  return (
    <StyledCard style={{ width: '50rem' }}>

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
          Capacidade máxima de alunos: -
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
        <SchoolItem>
          <BiEdit /> Editar informações
        </SchoolItem>
        <SchoolItem>
          <ImBin /> Apagar informações
        </SchoolItem>

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
