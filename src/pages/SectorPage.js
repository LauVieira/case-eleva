import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import {
  Alert, Button, Card, Container,
} from 'react-bootstrap';
import { BsPlusCircleFill } from 'react-icons/bs';
import Header from '../components/Header';
import { formatSchoolName } from '../utils/schoolForm';

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

  useEffect(() => {
    const previousTitle = document.title;
    if (sector) document.title = `${sector.name} | Gestão Escolar`;
    else if (sectorMissing) document.title = 'Setor não encontrado | Gestão Escolar';
    else document.title = 'Setor | Gestão Escolar';
    return () => { document.title = previousTitle; };
  }, [sector, sectorMissing]);

  return (
    <StyledContainer fluid>
      <SkipLink href="#conteudo-principal">Ir para o conteúdo principal</SkipLink>
      <Header />
      <Main id="conteudo-principal" tabIndex={-1}>

      {deletedSchool && (
        <Alert variant="success" role="status" tabIndex={-1} ref={noticeRef}>
          Escola <strong>{formatSchoolName(deletedSchool.name || '')}</strong> excluída com sucesso.
        </Alert>
      )}

      <ContextBar>
        <PageTitle>
          {sectorMissing && 'Setor não encontrado.'}
          {!sectorMissing && sector && (
            <>
              Setor:
              {' '}
              <strong>{sector.name}</strong>
              {' · '}
              Código:
              {' '}
              <strong>{sector.code}</strong>
            </>
          )}
          {!sectorMissing && !sector && 'Setor'}
        </PageTitle>
        {!sectorMissing && sectorState === 'loading' && <p role="status">Identificando o setor...</p>}
        {!sectorMissing && sectorState === 'error' && <p role="alert">Não foi possível identificar o setor.</p>}
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
            <CollectionItem>
              <SchoolItem href={`/setor/${id}/escolas/nova`} tabIndex="0">
                <StyledCard>
                  <Card.Text className="add-school">
                    <BsPlusCircleFill />
                    Adicionar Escola
                  </Card.Text>
                </StyledCard>
              </SchoolItem>
            </CollectionItem>
            {schools.map((school) => (
              <CollectionItem key={school.id}>
                <SchoolCard school={school} />
              </CollectionItem>
            ))}
          </CardGrid>
        )}
      </Main>

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
          <Card.Title as="h2">{formatSchoolName(school.name || '')}</Card.Title>
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

const Main = styled.main`
  scroll-margin-top: 100px;
`;

const PageTitle = styled.h1`
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  margin: 0;
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

  h2.card-title {
    font-size: 1.25rem;
    font-weight: 500;
    line-height: 1.2;
    margin-bottom: 0.75rem;
    margin-top: 0;
  }

  .add-school {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
  }
`;
