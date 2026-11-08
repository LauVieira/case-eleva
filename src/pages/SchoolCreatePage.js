import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Container } from 'react-bootstrap';

import Header from '../components/Header';
import SchoolForm from '../components/SchoolForm';
import api from '../services/api';
import { formatSchoolName, serializeSchoolForm } from '../utils/schoolForm';

function emptyForm (sectorId) {
  return {
    sectorId, name: '', address: '', headteacher: '', phone: '',
  };
}

export default function SchoolCreatePage () {
  const { id } = useParams();
  const [sectors, setSectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [values, setValues] = useState(() => emptyForm(id));
  const [createdSchool, setCreatedSchool] = useState(null);
  const headingRef = useRef(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setValues(emptyForm(id));
    setCreatedSchool(null);

    api.get('/sectors').then((response) => {
      if (active) {
        setSectors(response.data);
        setIsLoading(false);
      }
    });

    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = createdSchool
      ? 'Escola cadastrada | Gestão Escolar'
      : 'Cadastrar escola | Gestão Escolar';

    return () => { document.title = previousTitle; };
  }, [createdSchool]);

  useEffect(() => {
    if (!isLoading && headingRef.current) headingRef.current.focus();
  }, [isLoading, createdSchool]);

  const originSector = sectors.find((sector) => sector.id === Number(id));

  function handleChange (event) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
  }

  function handleSubmit (event) {
    event.preventDefault();
    api.post('/schools', serializeSchoolForm(values)).then((response) => {
      setCreatedSchool(response.data);
    });
  }

  function renderContent () {
    if (isLoading) return <p role="status">Carregando setores...</p>;

    if (sectors.length === 0) {
      return (
        <>
          <p>Nenhum setor disponível para cadastrar uma escola.</p>
          <Link to="/">Ver setores</Link>
        </>
      );
    }

    if (!originSector) {
      return (
        <>
          <p>Setor não encontrado.</p>
          <Link to="/">Ver setores</Link>
        </>
      );
    }

    if (createdSchool) {
      return (
        <>
          <p role="status">
            Escola cadastrada com sucesso.
          </p>
          <SchoolName>{formatSchoolName(createdSchool.name)}</SchoolName>
          <SuccessLinks>
            <Link to={`/escola/${createdSchool.id}`}>Ver escola</Link>
            <Link to={`/setor/${createdSchool.sectorId}`}>Voltar ao setor</Link>
          </SuccessLinks>
        </>
      );
    }

    return (
      <>
        <ContextText>
          Setor de origem:
          {' '}
          <strong>{originSector.name}</strong>
        </ContextText>
        <SchoolForm
          values={values}
          sectors={sectors}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      </>
    );
  }

  return (
    <StyledContainer fluid>
      <SkipLink href="#conteudo-principal">Ir para o conteúdo principal</SkipLink>
      <Header />
      <Main id="conteudo-principal" tabIndex={-1}>
        <Heading ref={headingRef} tabIndex={-1}>
          {createdSchool ? 'Escola cadastrada' : 'Cadastrar escola'}
        </Heading>
        {renderContent()}
      </Main>
    </StyledContainer>
  );
}

const StyledContainer = styled(Container)`
  padding-bottom: 40px;
  padding-top: 100px;
`;

const Main = styled.main`
  margin: 0 auto;
  max-width: 720px;
`;

const Heading = styled.h1`
  color: var(--navy-blue);
  font-size: 28px;
  margin-bottom: 20px;
`;

const ContextText = styled.p`
  margin-bottom: 24px;
`;

const SchoolName = styled.p`
  font-size: 20px;
  font-weight: 700;
`;

const SuccessLinks = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 24px;
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
