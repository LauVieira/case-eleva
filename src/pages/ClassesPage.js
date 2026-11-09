/* eslint-disable react/jsx-one-expression-per-line */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import {
  Alert, Button, Card, Container,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { BsPlusCircleFill } from 'react-icons/bs';
import Header from '../components/Header';
import { formatClassName, formatClassStatus } from '../utils/classForm';
import { formatSchoolName } from '../utils/schoolForm';

const STATUS_FILTERS = [
  { value: 'current', label: 'Ativas', empty: 'Nenhuma turma ativa.' },
  { value: 'all', label: 'Todas', empty: 'Nenhuma turma nesta escola.' },
  { value: 'completed', label: 'Encerradas', empty: 'Nenhuma turma encerrada.' },
];

export default function ClassesPage () {
  const { id } = useParams();
  const location = useLocation();
  const history = useHistory();
  const [deletedClass] = useState(() => location.state && location.state.deletedClass);
  const noticeRef = useRef(null);
  const requestVersion = useRef(0);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [classesMissing, setClassesMissing] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [school, setSchool] = useState(null);
  const [schoolState, setSchoolState] = useState('loading');
  const [statusFilter, setStatusFilter] = useState('current');
  const selectedFilter = STATUS_FILTERS.find((item) => item.value === statusFilter) || STATUS_FILTERS[0];
  const schoolMissing = classesMissing || schoolState === 'missing';
  const schoolName = school && school.name ? formatSchoolName(school.name) : '';

  useEffect(() => {
    if (deletedClass && noticeRef.current) {
      noticeRef.current.focus();
      history.replace({ ...location, state: { ...location.state, deletedClass: null } });
    }
  }, []);

  useEffect(() => {
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    setIsLoading(true);
    setLoadFailed(false);
    setClassesMissing(false);

    axios.get(`http://localhost:3000/schools/${id}/classes`, {
      params: { status: statusFilter },
    }).then((response) => {
      if (version !== requestVersion.current) return;
      setClasses([...response.data]);
      setIsLoading(false);
    }).catch((error) => {
      if (version !== requestVersion.current) return;
      const status = error.response && error.response.status;
      setClasses([]);
      setClassesMissing(status === 404 || status === 422);
      setLoadFailed(status !== 404 && status !== 422);
      setIsLoading(false);
    });
  }, [id, statusFilter, loadAttempt]);

  useEffect(() => {
    let active = true;
    setSchool(null);
    setSchoolState('loading');

    axios.get(`http://localhost:3000/schools/${id}`)
      .then((response) => {
        if (!active) return;
        setSchool(response.data);
        setSchoolState('found');
      })
      .catch((error) => {
        if (!active) return;
        const status = error.response && error.response.status;
        setSchool(null);
        setSchoolState(status === 404 || status === 422 ? 'missing' : 'error');
      });

    return () => { active = false; };
  }, [id, loadAttempt]);

  useEffect(() => {
    const previousTitle = document.title;
    if (schoolName) document.title = `Turmas | ${schoolName} | Gestão Escolar`;
    else document.title = 'Turmas | Gestão Escolar';
    return () => { document.title = previousTitle; };
  }, [schoolName]);

  return (
    <StyledContainer fluid>
      <SkipLink href="#conteudo-principal">Ir para o conteúdo principal</SkipLink>
      <Header />
      <Main id="conteudo-principal" tabIndex={-1}>

      {deletedClass && (
        <Alert variant="success" role="status" tabIndex={-1} ref={noticeRef}>
          Turma <strong>{formatClassName(deletedClass.name)}</strong> excluída com sucesso.
        </Alert>
      )}

      <PageTitle>Turmas</PageTitle>

      <ContextBar>
        {schoolMissing && <p role="alert">Escola não encontrada.</p>}
        {!schoolMissing && schoolState === 'loading' && <p role="status">Identificando a escola...</p>}
        {!schoolMissing && schoolState === 'error' && <p role="alert">Não foi possível identificar a escola.</p>}
        {!schoolMissing && school && (
          <p>
            Escola:
            {' '}
            <Link to={`/escola/${id}`}>{schoolName}</Link>
          </p>
        )}
        {schoolMissing
          ? <Link to="/">Ver setores</Link>
          : <Link to={`/escola/${id}`}>Voltar para a escola</Link>}
      </ContextBar>

      {!schoolMissing && (
      <StatusFilter>
        <legend>Filtrar por situação</legend>
        {STATUS_FILTERS.map((filter) => (
          <label key={filter.value} data-selected={statusFilter === filter.value ? 'true' : 'false'}>
            <input
              type="radio"
              name="class-status-filter"
              value={filter.value}
              checked={statusFilter === filter.value}
              onChange={() => setStatusFilter(filter.value)}
            />
            {filter.label}
          </label>
        ))}
      </StatusFilter>
      )}

      {isLoading && !schoolMissing && <p role="status">Carregando...</p>}
      {!isLoading && !schoolMissing && (
          <>
            {!loadFailed && classes.length === 0 && <p role="status">{selectedFilter.empty}</p>}
            <CardGrid>
              <CollectionItem>
                <ClassItem to={`/escola/${id}/classes/nova`}>
                  <StyledCard as="a">
                    <Card.Text className="add-class">
                      <BsPlusCircleFill />
                      Adicionar Turma
                    </Card.Text>
                  </StyledCard>
                </ClassItem>
              </CollectionItem>

              {!loadFailed && classes.map((classs) => (
                <CollectionItem key={classs.id}>
                  <ClassCard classs={classs} />
                </CollectionItem>
              ))}
            </CardGrid>
          </>
        )}
      {loadFailed && !schoolMissing && (
        <QueryError>
          <p role="alert">Erro ao buscar as turmas da escola selecionada.</p>
          <Button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Tentar novamente
          </Button>
        </QueryError>
      )}
      </Main>

    </StyledContainer>
  );
}

function ClassCard (props) {
  const { classs } = props;
  const link = `/turma/${classs.id}`;

  return (
    <ClassItem to={link}>
      <StyledCard as="a">
        <Card.Body>
          <Card.Title as="h2">
            Turma {formatClassName(classs.name)}
          </Card.Title>
          <Card.Text>
            Situação: {formatClassStatus(classs.status)}
          </Card.Text>
          <Card.Text>
            {classs.grade}
          </Card.Text>
          <Card.Text>
            {classs.segment}
          </Card.Text>
          <Card.Text>
            Turno: {classs.shift}
          </Card.Text>
          <Card.Text>
            Limite de alunos: {classs.maxOccupancy}
          </Card.Text>
        </Card.Body>
      </StyledCard>
    </ClassItem>
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
  margin: 0 0 16px;
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
  margin-bottom: 20px;

  p {
    margin: 0;
  }
`;

const StatusFilter = styled.fieldset`
  border: 1px solid #6c757d;
  border-radius: 4px;
  margin: 0 0 16px;
  padding: 12px 16px;

  legend {
    font-size: 16px;
    font-weight: 700;
    padding: 0 6px;
    width: auto;
  }

  label {
    align-items: center;
    display: inline-flex;
    font-size: 16px;
    margin: 0 16px 0 0;
  }

  label[data-selected='true'] {
    font-weight: 700;
  }

  input {
    margin-right: 6px;
  }
`;

const QueryError = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 48px auto;
  text-align: center;
`;

const CardGrid = styled.ul`
  align-items: stretch;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: flex-start;
  list-style: none;
  margin: 0;
  padding: 0;
`;

const CollectionItem = styled.li`
  display: contents;
`;

const ClassItem = styled(LinkContainer)`
  color: inherit;
  cursor: pointer;
  flex: 0 0 18rem;
  font-size: 18px;
  max-width: 100%;
  text-decoration: none;
  width: 18rem;

  :hover {
    color: inherit;
    text-decoration: none;
  }

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
  height: 100%;
  width: 18rem;

  h2.card-title {
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 1.2;
    margin-bottom: 0.75rem;
    margin-top: 0;
  }

  .add-class {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
    min-height: 180px;
  }
`;
