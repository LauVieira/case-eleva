/* eslint-disable react/jsx-one-expression-per-line */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import {
  Card, CardDeck, Container,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { BsPlusCircleFill } from 'react-icons/bs';
import Header from '../components/Header';

export default function ClassesPage () {
  const { id } = useParams();
  const [classes, setClasses] = useState([]);

  useEffect(getClasses, []);

  function getClasses () {
    const request = axios.get(`http://localhost:3000/schools/${id}/classes`);
    request.then((response) => {
      setClasses([...response.data]);
    });
    request.catch(() => alert('Erro ao buscar as classes da escola selecionada'));
  }

  return (
    <StyledContainer fluid>

      <Header />

      {classes.length === 0
        ? <p>Carregando...</p>
        : (
          <StyledCardDeck>

            <ClassItem to="/">
              <StyledCard>
                <Card.Text className="add-class">
                  <BsPlusCircleFill />
                  Adicionar Classe
                </Card.Text>
              </StyledCard>
            </ClassItem>

            {classes.map((classs) => <ClassCard key={classs.id} classs={classs} />)}

          </StyledCardDeck>
        )}

    </StyledContainer>
  );
}

function ClassCard (props) {
  const { classs } = props;
  const link = '/';

  return (
    <ClassItem to={link}>
      <StyledCard style={{ width: '18rem' }}>
        <Card.Body>
          <Card.Title>
            Turma {classs.name}
          </Card.Title>
          <Card.Text>
            {classs.grade}
          </Card.Text>
          <Card.Text>
            {classs.segment}
          </Card.Text>
          <Card.Text>
            Período: {classs.shift}
          </Card.Text>
          <Card.Text>
            Limite de alunos: {classs.maxOccupancy}
          </Card.Text>
          <Card.Text>
            Alunos matriculados: -
          </Card.Text>
        </Card.Body>
      </StyledCard>
    </ClassItem>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
`;

const StyledCardDeck = styled(CardDeck)``;

const ClassItem = styled(LinkContainer)`
  cursor: pointer;
  font-size: 18px;

  p {
    margin-bottom: 0;
  }

  svg {
    font-size: 20px;
    margin-right: 5px;
  }
`;

const StyledCard = styled(Card)`
  box-shadow: 3px 2px 10px 1px #B7B5B2;

  .add-class {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
  }
`;
