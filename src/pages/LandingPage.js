import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import {
  Button, Container, ListGroup,
} from 'react-bootstrap';
import colorContrast from 'color-contrast';

import Header from '../components/Header';
import api from '../services/api';

export default function LandingPage () {
  const [sectors, setSectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const headingRef = useRef(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(false);

    api.get('/sectors')
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

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Setores | Gestão Escolar';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    if (!isLoading && headingRef.current) headingRef.current.focus();
  }, [isLoading]);

  return (
    <StyledContainer fluid>
      <SkipLink href="#conteudo-principal">Ir para o conteúdo principal</SkipLink>
      <Header />
      <Main id="conteudo-principal" tabIndex={-1}>
      <PageTitle ref={headingRef} tabIndex={-1}>Setores</PageTitle>

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
        <StyledListGroup as="ul">
          {sectors.map((sector) => (
            <CollectionItem key={sector.id}>
              <SectorCard sector={sector} />
            </CollectionItem>
          ))}
        </StyledListGroup>
      )}
      </Main>

    </StyledContainer>
  );
}

function SectorCard (props) {
  const { sector } = props;
  const link = `/setor/${sector.id}`;
  const contrastWithBlack = colorContrast(sector.color, '#000');
  const contrastWithWhite = colorContrast(sector.color, '#FFF');
  const textColor = contrastWithBlack > 7
    ? '#000'
    : (contrastWithBlack >= contrastWithWhite ? '#000' : '#FFF');

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

const Main = styled.main`
  scroll-margin-top: 100px;
`;

const PageTitle = styled.h1`
  color: var(--navy-blue);
  font-size: 28px;
  margin: 0 auto 20px;
  width: 90vw;
`;

const SkipLink = styled.a`
  background-color: #FFF;
  color: var(--navy-blue);
  left: 16px;
  padding: 12px;
  position: fixed;
  top: 8px;
  transform: translateY(-200%);
  z-index: 1100;

  :focus {
    transform: translateY(0);
  }
`;

const QueryError = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 48px auto;
  text-align: center;
`;

const StyledListGroup = styled(ListGroup)`
  margin: 0;
  padding: 0;
`;

const CollectionItem = styled.li`
  display: contents;
`;

const SectorItem = styled(ListGroup.Item)`
  align-items: center;
  background-color: ${(props) => props.color};
  display: flex;
  font-size: 18px;
  justify-content: space-between;
  margin: 0 auto 5px auto;
  width: 90vw;
  color: ${(props) => props.textColor};

  &&:hover,
  &&:focus,
  &&:active {
    background-color: ${(props) => props.color};
    color: ${(props) => props.textColor};
  }

  p {
    margin-bottom: 0;
  }
`;
