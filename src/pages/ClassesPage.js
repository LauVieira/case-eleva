/* eslint-disable react/jsx-one-expression-per-line */

import React, { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import {
  Alert, Button, Card, Container,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { BsPlusCircleFill } from 'react-icons/bs';
import Header from '../components/Header';
import { formatClassStatus } from '../utils/classForm';

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
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [statusFilter, setStatusFilter] = useState('current');
  const selectedFilter = STATUS_FILTERS.find((item) => item.value === statusFilter) || STATUS_FILTERS[0];

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

    axios.get(`http://localhost:3000/schools/${id}/classes`, {
      params: { status: statusFilter },
    }).then((response) => {
      if (version !== requestVersion.current) return;
      setClasses([...response.data]);
      setIsLoading(false);
    }).catch(() => {
      if (version !== requestVersion.current) return;
      setClasses([]);
      setLoadFailed(true);
      setIsLoading(false);
    });
  }, [id, statusFilter, loadAttempt]);

  return (
    <StyledContainer fluid>

      <Header />

      {deletedClass && (
        <Alert variant="success" role="status" tabIndex={-1} ref={noticeRef}>
          Turma <strong>{deletedClass.name}</strong> excluída com sucesso.
        </Alert>
      )}

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

      {isLoading && <p role="status">Carregando...</p>}
      {!isLoading && (
          <>
            {!loadFailed && classes.length === 0 && <p role="status">{selectedFilter.empty}</p>}
            <CardGrid>

              <ClassItem to={`/escola/${id}/classes/nova`}>
                <StyledCard>
                  <Card.Text className="add-class">
                    <BsPlusCircleFill />
                    Adicionar Turma
                  </Card.Text>
                </StyledCard>
              </ClassItem>

              {!loadFailed && classes.map((classs) => <ClassCard key={classs.id} classs={classs} />)}

            </CardGrid>
          </>
        )}
      {loadFailed && (
        <QueryError>
          <p role="alert">Erro ao buscar as turmas da escola selecionada.</p>
          <Button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Tentar novamente
          </Button>
        </QueryError>
      )}

    </StyledContainer>
  );
}

function ClassCard (props) {
  const { classs } = props;
  const link = `/turma/${classs.id}`;

  return (
    <ClassItem to={link}>
      <StyledCard>
        <Card.Body>
          <Card.Title>
            Turma {classs.name}
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

const CardGrid = styled.div`
  align-items: stretch;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: flex-start;
`;

const ClassItem = styled(LinkContainer)`
  cursor: pointer;
  flex: 0 0 18rem;
  font-size: 18px;
  max-width: 100%;
  width: 18rem;

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

  .add-class {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
    min-height: 180px;
  }
`;
