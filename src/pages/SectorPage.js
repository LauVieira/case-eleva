import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import {
  Alert, Button, Card, Container,
} from 'react-bootstrap';
import { BsPlusCircleFill } from 'react-icons/bs';
import Header from '../components/Header';

export default function SectorPage () {
  const { id } = useParams();
  const location = useLocation();
  const history = useHistory();
  const [deletedSchool] = useState(() => location.state && location.state.deletedSchool);
  const noticeRef = useRef(null);
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [schoolsMissing, setSchoolsMissing] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [sector, setSector] = useState(null);
  const [sectorState, setSectorState] = useState('loading');

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setLoadError(false);
    setSchoolsMissing(false);

    axios.get(`http://localhost:3000/sectors/${id}/schools`)
      .then((response) => {
        if (!active) return;
        setSchools([...response.data]);
        setIsLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        const status = error.response && error.response.status;
        setSchools([]);
        setSchoolsMissing(status === 404 || status === 422);
        setLoadError(status !== 404 && status !== 422);
        setIsLoading(false);
      });

    return () => { active = false; };
  }, [id, loadAttempt]);

  useEffect(() => {
    let active = true;
    setSector(null);
    setSectorState('loading');

    axios.get('http://localhost:3000/sectors')
      .then((response) => {
        if (!active) return;
        const found = response.data.find((item) => String(item.id) === String(id));
        setSector(found || null);
        setSectorState(found ? 'found' : 'missing');
      })
      .catch(() => {
        if (!active) return;
        setSector(null);
        setSectorState('error');
      });

    return () => { active = false; };
  }, [id, loadAttempt]);

  useEffect(() => {
    if (deletedSchool && noticeRef.current) {
      noticeRef.current.focus();
      history.replace({ ...location, state: { ...location.state, deletedSchool: null } });
    }
  }, []);

  const sectorMissing = schoolsMissing || sectorState === 'missing';

  return (
    <StyledContainer fluid>

      <Header />

      {deletedSchool && (
        <Alert variant="success" role="status" tabIndex={-1} ref={noticeRef}>
          Escola <strong>{deletedSchool.name}</strong> excluída com sucesso.
        </Alert>
      )}

      <ContextBar>
        {sectorMissing && <p role="alert">Setor não encontrado.</p>}
        {!sectorMissing && sectorState === 'loading' && <p role="status">Identificando o setor...</p>}
        {!sectorMissing && sectorState === 'error' && <p role="alert">Não foi possível identificar o setor.</p>}
        {!sectorMissing && sector && (
          <p>
            Setor:
            {' '}
            <strong>{sector.name}</strong>
            {' · '}
            Código:
            {' '}
            <strong>{sector.code}</strong>
          </p>
        )}
        <Link to="/">Voltar aos setores</Link>
      </ContextBar>

      {isLoading && !sectorMissing && <p role="status">Carregando...</p>}
      {loadError && !sectorMissing && (
        <QueryError>
          <p role="alert">Não foi possível carregar as escolas.</p>
          <Button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Tentar novamente
          </Button>
        </QueryError>
      )}
      {!isLoading && !loadError && !sectorMissing && (
          <CardGrid>
            <SchoolItem href={`/setor/${id}/escolas/nova`} tabIndex="0">
              <StyledCard>
                <Card.Text className="add-school">
                  <BsPlusCircleFill />
                  Adicionar Escola
                </Card.Text>
              </StyledCard>
            </SchoolItem>
            {schools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </CardGrid>
        )}

    </StyledContainer>
  );
}

function SchoolCard (props) {
  const { school } = props;
  const link = `/escola/${school.id}`;

  return (
    <SchoolItem href={link} tabIndex="0">
      <StyledCard>
        <Card.Body>
          <Card.Title>{school.name}</Card.Title>
          <Card.Text>
            {school.address}
          </Card.Text>
        </Card.Body>
      </StyledCard>
    </SchoolItem>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
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

const SchoolItem = styled.a`
  color: initial;
  display: flex;
  flex: 0 0 18rem;
  font-size: 18px;
  height: 200px;
  max-width: 100%;
  text-align: center;
  width: 18rem;

  :hover {
    color: initial;
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

  .add-school {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
  }
`;
