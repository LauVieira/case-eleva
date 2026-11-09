import React, { useEffect, useRef, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Button, Container } from 'react-bootstrap';

import Header from '../components/Header';
import ClassForm from '../components/ClassForm';
import api from '../services/api';
import { formatSchoolName } from '../utils/schoolForm';
import {
  GRADES_BY_SEGMENT,
  changedClassFields,
  classToFormValues,
  formatClassDate,
  formatClassName,
  serializeClassForm,
  validateClassForm,
} from '../utils/classForm';

const fieldIds = {
  name: 'class-name',
  segment: 'class-segment',
  grade: 'class-grade',
  shift: 'class-shift',
  status: 'class-status',
  maxOccupancy: 'class-occupancy',
};

const maxId = 2147483647;
const duplicateMessage = 'Já existe uma turma ativa com este nome nesta escola. Informe outro nome.';

export default function ClassEditPage () {
  const { id } = useParams();
  const classId = Number(id);
  const history = useHistory();
  const [classData, setClassData] = useState(null);
  const [values, setValues] = useState(null);
  const [original, setOriginal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedClass, setSavedClass] = useState(null);
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
    setClassData(null);
    setSavedClass(null);
    setValues(null);
    setOriginal(null);
    setErrors({});
    setServerError('');
    setNotice('');
    setIsSaving(false);

    const validId = Number.isInteger(classId) && classId > 0 && classId <= maxId;
    if (!validId) {
      setLoadError({ notFound: true, message: 'Turma não encontrada.' });
      setIsLoading(false);
    } else {
      api.get(`/classes/${classId}`)
        .then((response) => {
          if (!active) return;
          const initialValues = classToFormValues(response.data);
          setClassData(response.data);
          setValues(initialValues);
          setOriginal(serializeClassForm(initialValues));
          setIsLoading(false);
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

    return () => {
      active = false;
      requestVersion.current += 1;
    };
  }, [classId, loadAttempt]);

  const classMissing = !isLoading && Boolean(loadError && loadError.notFound);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = savedClass
      ? 'Turma atualizada | Gestão Escolar'
      : classMissing
        ? 'Turma não encontrada | Gestão Escolar'
        : 'Editar turma | Gestão Escolar';
    return () => { document.title = previousTitle; };
  }, [savedClass, classMissing]);

  useEffect(() => {
    if (!isLoading && headingRef.current) headingRef.current.focus();
  }, [isLoading, savedClass]);

  useEffect(() => {
    if (errorFocusKey > 0 && errorRef.current) errorRef.current.focus();
  }, [errorFocusKey]);

  function handleChange (event) {
    const { name, value } = event.target;
    setValues((previous) => {
      const next = { ...previous, [name]: value };
      if (name === 'segment' && !(GRADES_BY_SEGMENT[value] || []).includes(previous.grade)) {
        next.grade = '';
      }
      return next;
    });
    setErrors((previous) => {
      const next = { ...previous, [name]: undefined };
      if (name === 'segment') next.grade = undefined;
      return next;
    });
    setServerError('');
    setNotice('');
  }

  function handleSubmit (event) {
    event.preventDefault();
    if (saveInProgress.current) return;
    const fieldErrors = validateClassForm(values);
    setErrors(fieldErrors);
    setServerError('');
    setNotice('');

    if (Object.keys(fieldErrors).length > 0) {
      setErrorFocusKey((key) => key + 1);
      return;
    }

    const changes = changedClassFields(serializeClassForm(values), original);
    if (Object.keys(changes).length === 0) {
      setNotice('Nenhuma alteração para salvar.');
      return;
    }

    const saveVersion = requestVersion.current;
    saveInProgress.current = true;
    setIsSaving(true);
    api.patch(`/classes/${classId}`, changes)
      .then((response) => {
        if (saveVersion === requestVersion.current) setSavedClass(response.data);
      })
      .catch((error) => {
        if (saveVersion !== requestVersion.current) return;
        const response = error.response;
        if (response && response.status === 409) {
          const message = response.data && response.data.message;
          setErrors({ name: typeof message === 'string' ? message : duplicateMessage });
        } else if (response && response.status === 422) {
          const message = response.data && response.data.message;
          setServerError(typeof message === 'string' ? message : 'Confira os dados informados e tente novamente.');
        } else if (response && response.status === 404) {
          setServerError('A turma não foi encontrada. Os dados preenchidos foram mantidos.');
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

  const school = classData && classData.school;
  const schoolId = classData && (classData.schoolId || (school && school.id));
  const schoolName = school && school.name ? formatSchoolName(school.name) : '';
  const detailPath = `/turma/${id}`;
  const classesPath = schoolId ? `/escola/${schoolId}/classes` : '/';

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

    if (savedClass) {
      return (
        <>
          <p role="status">Turma atualizada com sucesso.</p>
          <ClassName>{formatClassName(savedClass.name)}</ClassName>
          <ContextText>
            Criada em
            {' '}
            {formatClassDate(savedClass.createdAt)}
            . Atualizada em
            {' '}
            {formatClassDate(savedClass.updatedAt)}
            .
          </ContextText>
          <Actions>
            <Link to={detailPath}>Ver turma</Link>
            <Link to={classesPath}>Voltar para as turmas</Link>
          </Actions>
        </>
      );
    }

    const fieldErrors = Object.entries(errors).filter(([, message]) => message);
    return (
      <>
        <ContextText>
          Escola:
          {' '}
          <strong>{schoolName}</strong>
          . A turma permanece nesta escola. A escola não pode ser alterada.
        </ContextText>
        <ContextText>
          Criada em
          {' '}
          {formatClassDate(classData.createdAt)}
          . Atualizada em
          {' '}
          {formatClassDate(classData.updatedAt)}
          .
        </ContextText>
        {(serverError || fieldErrors.length > 0) && (
          <ErrorSummary ref={errorRef} tabIndex={-1} role="alert">
            <p>{serverError || 'Confira os campos indicados para salvar a turma.'}</p>
            {fieldErrors.length > 0 && (
              <ul>
                {fieldErrors.map(([field, message]) => (
                  <li key={field}>
                    <a href={`#${fieldIds[field]}`}>{message}</a>
                  </li>
                ))}
              </ul>
            )}
          </ErrorSummary>
        )}
        {notice && <p role="status">{notice}</p>}
        {isSaving && <p role="status">Salvando turma...</p>}
        <ClassForm
          values={values}
          onChange={handleChange}
          onSubmit={handleSubmit}
          errors={errors}
          submitting={isSaving}
          onBack={() => history.push(detailPath)}
          submitLabel="Salvar alterações"
          cancelLabel="Cancelar"
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
          {savedClass ? 'Turma atualizada' : classMissing ? 'Turma não encontrada.' : 'Editar turma'}
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
  margin-bottom: 16px;
`;

const ClassName = styled.p`
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
