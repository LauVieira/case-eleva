import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import {
  Container, ListGroup,
} from 'react-bootstrap';
import Header from '../components/Header';

export default function LandingPage () {
  const [sectors, setSectors] = useState([]);

  useEffect(getSectors, []);

  function getSectors () {
    const request = axios.get('http://localhost:3000/sectors');
    request.then((response) => {
      setSectors([...response.data]);
    });
    request.catch(() => alert('Erro ao buscar o curso selecionado'));
  }

  return (
    <StyledContainer fluid>

      <Header />

      {sectors.length === 0
        ? <p>Carregando...</p>
        : (
          <StyledListGroup>
            {sectors.map((sector) => <SectorCard key={sector.id} sector={sector} />)}
          </StyledListGroup>
        )}

    </StyledContainer>
  );
}

function SectorCard (props) {
  const { sector } = props;

  return (
    <SectorItem color={sector.color}>
      <p>{sector.name}</p>
      <p>{sector.code}</p>
    </SectorItem>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
`;

const StyledListGroup = styled(ListGroup)``;

const SectorItem = styled(ListGroup.Item)`
  align-items: center;
  background-color: ${(props) => props.color};
  display: flex;
  justify-content: space-between;
  margin: 0 auto 5px auto;
  width: 90vw;

  p {
    margin-bottom: 0;
  }
`;
