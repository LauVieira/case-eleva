import React, { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Container } from 'react-bootstrap';

import Header from '../components/Header';
import SchoolForm from '../components/SchoolForm';
import api from '../services/api';
import {
  formatSchoolName, serializeSchoolForm, validateSchoolForm,
} from '../utils/schoolForm';

const fieldIds = {
  sectorId: 'school-sector',
  name: 'school-name',
  address: 'school-address',
  headteacher: 'school-headteacher',
  phone: 'school-phone',
};

function emptyForm (sectorId) {
  return {
    sectorId, name: '', address: '', headteacher: '', phone: '',
  };
}

export default function SchoolCreatePage () {
  const { id } = useParams();
  const [sectors, setSectors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [values, setValues] = useState(() => emptyForm(id));
  const [createdSchool, setCreatedSchool] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorFocusKey, setErrorFocusKey] = useState(0);
  const headingRef = useRef(null);
  const errorRef = useRef(null);
  const saveInProgress = useRef(false);
  const requestVersion = useRef(0);

  useEffect(() => {
    let active = true;
    requestVersion.current += 1;
    saveInProgress.current = false;
    setIsLoading(true);
    setLoadError(false);
    setValues(emptyForm(id));
    setCreatedSchool(null);
    setErrors({});
    setServerError('');
    setIsSaving(false);

    api.get('/sectors').then((response) => {
      if (!active) return;
      setSectors(response.data);
      setIsLoading(false);
    }).catch(() => {
      if (!active) return;
      setSectors([]);
      setLoadError(true);
      setIsLoading(false);
    });

    return () => {
      active = false;
      requestVersion.current += 1;
    };
  }, [id, loadAttempt]);

  useEffect(() => {
    const previousTitle = document.title;
    const originMissing = !isLoading && !loadError && sectors.length > 0
      && !sectors.some((sector) => sector.id === Number(id));
    document.title = createdSchool
      ? 'Escola cadastrada | Gestão Escolar'
      : originMissing
        ? 'Setor não encontrado | Gestão Escolar'
        : 'Cadastrar escola | Gestão Escolar';

    return () => { document.title = previousTitle; };
  }, [createdSchool, isLoading, loadError, sectors, id]);

  useEffect(() => {
    if (!isLoading && headingRef.current) headingRef.current.focus();
  }, [isLoading, createdSchool]);

  useEffect(() => {
    if (errorFocusKey > 0 && errorRef.current) errorRef.current.focus();
  }, [errorFocusKey]);

  const originSector = sectors.find((sector) => sector.id === Number(id));
  const originMissing = !isLoading && !loadError && sectors.length > 0 && !originSector;

  function handleChange (event) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setServerError('');
  }

  function handleSubmit (event) {
    event.preventDefault();
    if (saveInProgress.current) return;
    const fieldErrors = validateSchoolForm(values, sectors);
    setErrors(fieldErrors);
    setServerError('');

    if (Object.keys(fieldErrors).length > 0) {
      setErrorFocusKey((key) => key + 1);
      return;
    }

    const saveVersion = requestVersion.current;
    saveInProgress.current = true;
    setIsSaving(true);
    api.post('/schools', serializeSchoolForm(values))
      .then((response) => {
        if (saveVersion === requestVersion.current) setCreatedSchool(response.data);
      })
      .catch((error) => {
        if (saveVersion !== requestVersion.current) return;
        const { response } = error;
        if (response && response.status === 409) {
          setErrors({ name: 'Já existe uma escola com este nome. Informe outro nome.' });
        } else if (response && response.status === 422) {
          const message = response.data && response.data.message;
          if (typeof message === 'string' && (message.startsWith('sectorId:') || message.includes('"sectorId"'))) {
            setErrors({ sectorId: 'O setor selecionado não está disponível. Escolha outro setor.' });
          } else {
            setServerError(typeof message === 'string' ? message : 'Confira os dados informados e tente novamente.');
          }
        } else {
          setServerError('Não foi possível confirmar o cadastro. Os dados preenchidos foram mantidos.');
        }
        setErrorFocusKey((key) => key + 1);
      })
      .finally(() => {
        if (saveVersion !== requestVersion.current) return;
        saveInProgress.current = false;
        setIsSaving(false);
      });
  }

  function renderContent () {
    if (isLoading) return <p role="status">Carregando setores...</p>;

    if (loadError) {
      return (
        <QueryError>
          <p role="alert">Não foi possível carregar os setores.</p>
          <Button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
            Tentar novamente
          </Button>
        </QueryError>
      );
    }

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

    const fieldErrors = Object.entries(errors).filter(([, message]) => message);
    return (
      <>
        <ContextText>
          Setor de origem:
          {' '}
          <strong>{originSector.name}</strong>
        </ContextText>
        {(serverError || fieldErrors.length > 0) && (
          <ErrorSummary ref={errorRef} tabIndex={-1} role="alert">
            <p>{serverError || 'Confira os campos indicados para cadastrar a escola.'}</p>
            {fieldErrors.length > 0 && (
              <ul>
                {fieldErrors.map(([field, message]) => (
                  <li key={field}><a href={`#${fieldIds[field]}`}>{message}</a></li>
                ))}
              </ul>
            )}
          </ErrorSummary>
        )}
        {isSaving && <p role="status">Salvando escola...</p>}
        <SchoolForm
          values={values}
          sectors={sectors}
          onChange={handleChange}
          onSubmit={handleSubmit}
          errors={errors}
          submitting={isSaving}
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
          {createdSchool ? 'Escola cadastrada' : originMissing ? 'Setor não encontrado.' : 'Cadastrar escola'}
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

const QueryError = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin: 24px auto;
  text-align: center;
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

const ErrorSummary = styled.div`
  background: #fff5f5;
  border: 1px solid #b02a37;
  border-radius: 4px;
  color: #842029;
  margin-bottom: 24px;
  padding: 16px;

  p { margin-bottom: 8px; }
  ul { margin-bottom: 0; padding-left: 24px; }
  a { color: inherit; text-decoration: underline; }
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
