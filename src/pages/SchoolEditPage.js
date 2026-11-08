import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Container } from 'react-bootstrap';

import Header from '../components/Header';
import SchoolForm from '../components/SchoolForm';
import api from '../services/api';
import {
  formatSchoolName, schoolToFormValues, serializeSchoolForm, validateSchoolForm,
} from '../utils/schoolForm';

const fieldIds = {
  sectorId: 'school-sector',
  name: 'school-name',
  address: 'school-address',
  headteacher: 'school-headteacher',
  phone: 'school-phone',
};

export default function SchoolEditPage () {
  const { id } = useParams();
  const schoolId = Number(id);
  const history = useHistory();
  const [school, setSchool] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [values, setValues] = useState(null);
  const [original, setOriginal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSchool, setSavedSchool] = useState(null);
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
    setLoadError(null);
    setSchool(null);
    setSavedSchool(null);
    setErrors({});
    setServerError('');
    setNotice('');
    setIsSaving(false);

    if (!Number.isInteger(schoolId) || schoolId <= 0 || schoolId > 2147483647) {
      setLoadError({ notFound: true, message: 'Escola não encontrada.' });
      setIsLoading(false);
    } else {
      Promise.all([api.get(`/schools/${schoolId}`), api.get('/sectors')])
        .then(([schoolResponse, sectorResponse]) => {
          if (!active) return;
          const initialValues = schoolToFormValues(schoolResponse.data);
          setSchool(schoolResponse.data);
          setSectors(sectorResponse.data);
          setValues(initialValues);
          setOriginal(serializeSchoolForm(initialValues));
          setIsLoading(false);
        })
        .catch((error) => {
          if (!active) return;
          const notFound = error.response && error.response.status === 404;
          setLoadError({
            notFound,
            message: notFound ? 'Escola não encontrada.' : 'Não foi possível carregar os dados da escola.',
          });
          setIsLoading(false);
        });
    }

    return () => {
      active = false;
      requestVersion.current += 1;
    };
  }, [schoolId, loadAttempt]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = savedSchool
      ? 'Escola atualizada | Gestão Escolar'
      : 'Editar escola | Gestão Escolar';
    return () => { document.title = previousTitle; };
  }, [savedSchool]);

  useEffect(() => {
    if (!isLoading && headingRef.current) headingRef.current.focus();
  }, [isLoading, savedSchool]);

  useEffect(() => {
    if (errorFocusKey > 0 && errorRef.current) errorRef.current.focus();
  }, [errorFocusKey]);

  function handleChange (event) {
    const { name, value } = event.target;
    setValues((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
    setServerError('');
    setNotice('');
  }

  function handleSubmit (event) {
    event.preventDefault();
    if (saveInProgress.current) return;
    const fieldErrors = validateSchoolForm(values, sectors);
    setErrors(fieldErrors);
    setServerError('');
    setNotice('');

    if (Object.keys(fieldErrors).length > 0) {
      setErrorFocusKey((key) => key + 1);
      return;
    }

    const complete = serializeSchoolForm(values);
    const changes = Object.fromEntries(
      Object.entries(complete).filter(([field, value]) => value !== original[field]),
    );
    if (Object.keys(changes).length === 0) {
      setNotice('Nenhuma alteração para salvar.');
      return;
    }

    const saveVersion = requestVersion.current;
    saveInProgress.current = true;
    setIsSaving(true);
    api.patch(`/schools/${schoolId}`, changes)
      .then((response) => {
        if (saveVersion === requestVersion.current) setSavedSchool(response.data);
      })
      .catch((error) => {
        if (saveVersion !== requestVersion.current) return;
        const response = error.response;
        if (response && response.status === 409) {
          setErrors({ name: 'Já existe uma escola com este nome. Informe outro nome.' });
        } else if (response && response.status === 422) {
          const message = response.data && response.data.message;
          if (typeof message === 'string' && (message.startsWith('sectorId:') || message.includes('"sectorId"'))) {
            setErrors({ sectorId: 'O setor selecionado não está disponível. Escolha outro setor.' });
          } else {
            setServerError(typeof message === 'string' ? message : 'Confira os dados informados e tente novamente.');
          }
        } else if (response && response.status === 404) {
          setServerError('A escola não foi encontrada. Seus dados preenchidos foram mantidos.');
        } else {
          setServerError('Não foi possível confirmar a atualização. Verifique sua conexão e tente novamente.');
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
    if (isLoading) return <p role="status">Carregando dados da escola...</p>;
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

    if (savedSchool) {
      return (
        <>
          <p role="status">Escola atualizada com sucesso.</p>
          <SchoolName>{formatSchoolName(savedSchool.name)}</SchoolName>
          <Actions>
            <Link to={`/escola/${schoolId}`}>Ver escola</Link>
            <Link to={`/setor/${savedSchool.sectorId}`}>Voltar ao setor</Link>
          </Actions>
        </>
      );
    }

    if (sectors.length === 0) {
      return (
        <>
          <p>Nenhum setor disponível para editar esta escola.</p>
          <Link to={`/escola/${schoolId}`}>Ver escola</Link>
        </>
      );
    }

    const fieldErrors = Object.entries(errors).filter(([, message]) => message);
    return (
      <>
        <ContextText>
          Escola:
          {' '}
          <strong>{formatSchoolName(school.name)}</strong>
        </ContextText>
        {(serverError || fieldErrors.length > 0) && (
          <ErrorSummary ref={errorRef} tabIndex={-1} role="alert">
            <p>{serverError || 'Confira os campos indicados para salvar.'}</p>
            {fieldErrors.length > 0 && (
              <ul>
                {fieldErrors.map(([field, message]) => (
                  <li key={field}><a href={`#${fieldIds[field]}`}>{message}</a></li>
                ))}
              </ul>
            )}
          </ErrorSummary>
        )}
        {notice && <p role="status">{notice}</p>}
        {isSaving && <p role="status">Salvando alterações...</p>}
        <SchoolForm
          values={values}
          sectors={sectors}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitLabel="Salvar alterações"
          sectorHelp="A escola ficará no setor selecionado. Suas turmas permanecem vinculadas à mesma escola."
          errors={errors}
          submitting={isSaving}
          onCancel={() => history.push(`/escola/${schoolId}`)}
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
          {savedSchool ? 'Escola atualizada' : 'Editar escola'}
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

const Actions = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: 24px;
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
