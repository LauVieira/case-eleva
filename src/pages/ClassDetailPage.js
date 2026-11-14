import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Container } from 'react-bootstrap';

import Header from '../components/Header';
import ClassDeleteModal from '../components/ClassDeleteModal';
import api from '../services/api';
import { formatSchoolName } from '../utils/schoolForm';
import {
  formatClassDate, formatClassName, formatClassStatus, gradeFieldLabel,
} from '../utils/classForm';

const maxId = 2147483647;

export default function ClassDetailPage () {
  const { id } = useParams();
  const classId = Number(id);
  const history = useHistory();
  const [showDelete, setShowDelete] = useState(false);
  const [classData, setClassData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const headingRef = useRef(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(null);
    setClassData(null);
    setShowDelete(false);

    const validId = Number.isInteger(classId) && classId > 0 && classId <= maxId;
    if (!validId) {
      setLoadError({ notFound: true, message: 'Turma não encontrada.' });
      setIsLoading(false);
    } else {
      api.get(`/classes/${classId}`)
        .then((response) => {
          if (active) {
            setClassData(response.data);
            setIsLoading(false);
          }
        })
        .catch((error) => {
          if (!active) return;
          const status = error.response && error.response.status;
          const notFound = status === 404 || status === 422;
          setLoadError({
            notFound,
            message: notFound ? 'Turma não encontrada.' : 'Não foi possível carregar a turma.',
          });
          setIsLoading(false);
        });
    }

    return () => { active = false; };
  }, [classId, loadAttempt]);

  const classMissing = !isLoading && Boolean(loadError && loadError.notFound);
  const classHeading = classData
    ? formatClassName(classData.name)
    : classMissing
      ? 'Turma não encontrada.'
      : 'Turma';

  useEffect(() => {
    const previousTitle = document.title;
    document.title = classData
      ? `${formatClassName(classData.name)} | Gestão Escolar`
      : classMissing
        ? 'Turma não encontrada | Gestão Escolar'
        : 'Turma | Gestão Escolar';
    return () => { document.title = previousTitle; };
  }, [classData, classMissing]);

  useEffect(() => {
    if (!isLoading && headingRef.current) headingRef.current.focus();
  }, [isLoading, classData]);

  const school = classData && classData.school;
  const schoolId = classData && (classData.schoolId || (school && school.id));
  const schoolName = school && school.name ? formatSchoolName(school.name) : '';
  const classesPath = schoolId ? `/escola/${schoolId}/classes` : '/';
  const schoolPath = schoolId ? `/escola/${schoolId}` : '/';

  function renderContent () {
    if (isLoading) return <p role="status">Carregando turma...</p>;

    if (loadError) {
      return (
        <>
          <p role="alert">{loadError.message}</p>
          <Actions>
            {!loadError.notFound && (
              <Button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
                Tentar novamente
              </Button>
            )}
            <Link to="/">Ver setores</Link>
          </Actions>
        </>
      );
    }

    return (
      <>
        <ContextText>
          Escola:
          {' '}
          <Link to={schoolPath}>{schoolName}</Link>
        </ContextText>
        <DetailList>
          <div>
            <dt>{gradeFieldLabel(classData.segment)}</dt>
            <dd>{classData.grade}</dd>
          </div>
          <div>
            <dt>Segmento</dt>
            <dd>{classData.segment}</dd>
          </div>
          <div>
            <dt>Turno</dt>
            <dd>{classData.shift}</dd>
          </div>
          <div>
            <dt>Situação</dt>
            <dd>{formatClassStatus(classData.status)}</dd>
          </div>
          <div>
            <dt>Limite de alunos</dt>
            <dd>{classData.maxOccupancy}</dd>
          </div>
          <div>
            <dt>Criada em</dt>
            <dd>{formatClassDate(classData.createdAt)}</dd>
          </div>
          <div>
            <dt>Atualizada em</dt>
            <dd>{formatClassDate(classData.updatedAt)}</dd>
          </div>
        </DetailList>
        <Actions>
          <Link to={`/turma/${classData.id}/editar`}>Editar turma</Link>
          <Button type="button" variant="danger" onClick={() => setShowDelete(true)}>
            Excluir turma
          </Button>
          <Link to={classesPath}>Voltar para as turmas</Link>
        </Actions>
        <ClassDeleteModal
          classData={classData}
          show={showDelete}
          onHide={() => setShowDelete(false)}
          onDeleted={() => history.replace(classesPath, {
            deletedClass: { name: formatClassName(classData.name) },
          })}
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
          {classHeading}
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
  margin-left: auto;
  margin-right: auto;
  max-width: 95%;
  width: max-content;
`;

const Heading = styled.h1`
  color: var(--navy-blue);
  font-size: 28px;
  margin-bottom: 20px;
`;

const ContextText = styled.p`
  margin-bottom: 24px;
`;

const DetailList = styled.dl`
  display: grid;
  gap: 16px;
  margin-bottom: 8px;

  div { margin: 0; }
  dt {
    color: #5c6b73;
    font-size: 14px;
    margin-bottom: 4px;
  }
  dd {
    font-size: 18px;
    margin-bottom: 0;
  }
`;

const Actions = styled.div`
  align-items: center;
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

  :focus { transform: translateY(0); }
`;
