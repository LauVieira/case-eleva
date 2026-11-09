import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Container } from 'react-bootstrap';

import Header from '../components/Header';
import SchoolCard from '../components/SchoolCard';
import SchoolDeleteModal from '../components/SchoolDeleteModal';
import api from '../services/api';
import { formatSchoolName } from '../utils/schoolForm';

export default function SchoolPage () {
  const { id } = useParams();
  const history = useHistory();
  const [schoolData, setSchoolData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [sectors, setSectors] = useState(null);
  const [sectorsFailed, setSectorsFailed] = useState(false);
  const headingRef = useRef(null);

  useEffect(() => {
    let active = true;
    setSchoolData(null);
    setLoadError(null);
    setShowDelete(false);
    api.get(`/schools/${id}`)
      .then((response) => { if (active) setSchoolData(response.data); })
      .catch((error) => {
        if (!active) return;
        const status = error.response && error.response.status;
        const notFound = status === 404 || status === 422;
        setLoadError({
          notFound,
          message: notFound ? 'Escola não encontrada.' : 'Não foi possível carregar a escola.',
        });
      });
    return () => { active = false; };
  }, [id, loadAttempt]);

  useEffect(() => {
    let active = true;
    setSectors(null);
    setSectorsFailed(false);
    api.get('/sectors')
      .then((response) => { if (active) setSectors(response.data); })
      .catch(() => { if (active) setSectorsFailed(true); });
    return () => { active = false; };
  }, [id, loadAttempt]);

  function onDeleted (school) {
    history.replace(`/setor/${school.sectorId}`, {
      deletedSchool: { name: school.name },
    });
  }

  useEffect(() => {
    const previousTitle = document.title;
    const name = schoolData && schoolData.name ? formatSchoolName(schoolData.name) : '';
    if (name) document.title = `${name} | Gestão Escolar`;
    else if (loadError && loadError.notFound) document.title = 'Escola não encontrada | Gestão Escolar';
    else document.title = 'Escola | Gestão Escolar';
    return () => { document.title = previousTitle; };
  }, [schoolData, loadError]);

  useEffect(() => {
    if ((schoolData || loadError) && headingRef.current) headingRef.current.focus();
  }, [schoolData, loadError]);

  return (
    <StyledContainer fluid>
      <SkipLink href="#conteudo-principal">Ir para o conteúdo principal</SkipLink>
      <Header />
      <Main id="conteudo-principal" tabIndex={-1}>
        {loadError && (
          <QueryError>
            <PageTitle ref={headingRef} tabIndex={-1}>{loadError.message}</PageTitle>
            {!loadError.notFound && (
              <Button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Tentar novamente</Button>
            )}
            <Link to="/">Voltar aos setores</Link>
          </QueryError>
        )}
        {!schoolData && !loadError && (
          <>
            <PageTitle>Escola</PageTitle>
            <p role="status">Carregando escola...</p>
          </>
        )}
        {schoolData && (
          <>
            <ContextBar>
              {renderSectorContext(schoolData, sectors, sectorsFailed)}
            </ContextBar>
            <SchoolCard
              schoolData={schoolData}
              headingRef={headingRef}
              onDelete={() => setShowDelete(true)}
            />
            <SchoolDeleteModal
              key={schoolData.id}
              school={schoolData}
              show={showDelete}
              onHide={() => setShowDelete(false)}
              onDeleted={onDeleted}
            />
          </>
        )}
      </Main>

    </StyledContainer>
  );
}

function renderSectorContext (school, sectors, sectorsFailed) {
  const sector = sectors && sectors.find((item) => item.id === school.sectorId);
  const sectorPath = school.sectorId ? `/setor/${school.sectorId}` : '/';

  if (sectorsFailed || (sectors && !sector)) {
    return (
      <>
        <p role="alert">Não foi possível identificar o setor.</p>
        <Link to={sectorPath}>Voltar ao setor</Link>
      </>
    );
  }

  if (!sector) return <p role="status">Identificando o setor...</p>;

  return (
    <>
      <p>
        Setor:
        {' '}
        <Link to={sectorPath}>{sector.name}</Link>
        {' · '}
        Código:
        {' '}
        <strong>{sector.code}</strong>
      </p>
      <Link to={sectorPath}>Voltar ao setor</Link>
    </>
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
  margin: 0 0 20px;
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

const ContextBar = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 0 auto 20px;
  max-width: 95%;
  width: 50rem;

  p {
    margin: 0;
  }
`;

const QueryError = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 48px auto;
  text-align: center;
`;
