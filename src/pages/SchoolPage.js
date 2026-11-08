import React, { useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Container } from 'react-bootstrap';

import Header from '../components/Header';
import SchoolCard from '../components/SchoolCard';
import SchoolDeleteModal from '../components/SchoolDeleteModal';
import api from '../services/api';

export default function SchoolPage () {
  const { id } = useParams();
  const history = useHistory();
  const [schoolData, setSchoolData] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    let active = true;
    setSchoolData(null);
    setLoadError(null);
    setShowDelete(false);
    api.get(`/schools/${id}`)
      .then((response) => { if (active) setSchoolData(response.data); })
      .catch((error) => {
        if (!active) return;
        const notFound = error.response && error.response.status === 404;
        setLoadError({
          notFound,
          message: notFound ? 'Escola não encontrada.' : 'Não foi possível carregar a escola.',
        });
      });
    return () => { active = false; };
  }, [id, loadAttempt]);

  function onDeleted (school) {
    history.replace(`/setor/${school.sectorId}`, {
      deletedSchool: { name: school.name },
    });
  }

  return (
    <StyledContainer fluid>

      <Header />
      <main>
        {loadError && (
          <QueryError>
            <p role="alert">{loadError.message}</p>
            {!loadError.notFound && (
              <Button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>Tentar novamente</Button>
            )}
            <Link to="/">Voltar aos setores</Link>
          </QueryError>
        )}
        {!schoolData && !loadError && <p role="status">Carregando escola...</p>}
        {schoolData && (
          <>
            <SchoolCard schoolData={schoolData} onDelete={() => setShowDelete(true)} />
            <SchoolDeleteModal
              key={schoolData.id}
              school={schoolData}
              show={showDelete}
              onHide={() => setShowDelete(false)}
              onDeleted={onDeleted}
            />
          </>
        )}
      </main>

    </StyledContainer>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
`;

const QueryError = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 48px auto;
  text-align: center;
`;
