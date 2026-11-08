import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import {
  Button, Container, ListGroup,
} from 'react-bootstrap';
import colorContrast from 'color-contrast';

import Header from '../components/Header';

export default function LandingPage () {
  const [sectors, setSectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(false);

    axios.get('http://localhost:3000/sectors')
      .then((response) => {
        if (!active) return;
        setSectors([...response.data]);
        setIsLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setSectors([]);
        setLoadError(true);
        setIsLoading(false);
      });

    return () => { active = false; };
  }, [loadAttempt]);

  return (
    <StyledContainer fluid>

      <Header />

      {isLoading && <p role="status">Carregando...</p>}
      {loadError && (
        <QueryError>
          <p role="alert">Não foi possível carregar os setores.</p>
          <Button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Tentar novamente
          </Button>
        </QueryError>
      )}
      {!isLoading && !loadError && sectors.length === 0 && <p>Nenhum setor cadastrado.</p>}
      {!isLoading && !loadError && sectors.length > 0 && (
        <StyledListGroup>
          {sectors.map((sector) => <SectorCard key={sector.id} sector={sector} />)}
        </StyledListGroup>
      )}

    </StyledContainer>
  );
}

function SectorCard (props) {
  const { sector } = props;
  const link = `/setor/${sector.id}`;
  const contrast = colorContrast(sector.color, '#000');
  const textColor = contrast > 7 ? '#000' : '#FFF';

  return (
    <SectorItem action href={link} color={sector.color} textColor={textColor}>
      <p>{sector.name}</p>
      <p>{sector.code}</p>
    </SectorItem>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
`;

const QueryError = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 48px auto;
  text-align: center;
`;

const StyledListGroup = styled(ListGroup)``;

const SectorItem = styled(ListGroup.Item)`
  align-items: center;
  background-color: ${(props) => props.color};
  display: flex;
  font-size: 18px;
  justify-content: space-between;
  margin: 0 auto 5px auto;
  width: 90vw;
  color: ${(props) => props.textColor};

  :hover {
    color: #000;
  }

  p {
    margin-bottom: 0;
  }
`;
