import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Modal } from 'react-bootstrap';

import api from '../services/api';

export default function SchoolDeleteModal ({ school, show, onHide, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const inProgress = useRef(false);
  const active = useRef(true);
  const cancelRef = useRef(null);
  const errorRef = useRef(null);

  useEffect(() => () => { active.current = false; }, []);

  useEffect(() => {
    if (show) setError(null);
  }, [show]);

  useEffect(() => {
    if (error && errorRef.current) errorRef.current.focus();
  }, [error]);

  function close () {
    if (!inProgress.current) onHide();
  }

  function deleteSchool () {
    if (inProgress.current) return;
    inProgress.current = true;
    setIsDeleting(true);
    setError(null);

    api.delete(`/schools/${school.id}`)
      .then((response) => {
        if (response.status !== 204) throw new Error('Resposta inesperada da exclusão.');
        if (active.current) onDeleted(school);
      })
      .catch((requestError) => {
        if (!active.current) return;
        const status = requestError.response && requestError.response.status;
        let message = 'Não foi possível confirmar a exclusão. Verifique sua conexão e tente novamente.';
        if (status === 409) {
          message = 'Não é possível excluir esta escola porque existem turmas vinculadas a ela. Exclua primeiro as turmas e tente novamente. O bloqueio inclui turmas ativas e encerradas.';
        } else if (status === 404) {
          message = 'Esta escola não foi encontrada. Volte ao setor para consultar a listagem atualizada.';
        } else if (status >= 500) {
          message = 'Não foi possível excluir a escola. Tente novamente.';
        }
        setError({ status, message });
      })
      .finally(() => {
        inProgress.current = false;
        if (active.current) setIsDeleting(false);
      });
  }

  return (
    <Modal
      show={show}
      onHide={close}
      animation={false}
      backdrop={isDeleting ? 'static' : true}
      keyboard={!isDeleting}
      aria-labelledby="delete-school-title"
      aria-describedby="delete-school-description"
      onShow={() => { if (cancelRef.current) cancelRef.current.focus(); }}
      centered
    >
      <Modal.Header>
        <Modal.Title id="delete-school-title">Excluir escola</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p id="delete-school-description" style={{ overflowWrap: 'anywhere' }}>
          Deseja excluir a escola <strong>{school.name}</strong>?
          {' '}Esta ação não pode ser desfeita.
        </p>
        <p>A escola só pode ser excluída quando não houver turmas vinculadas.</p>
        {error && (
          <Alert variant="danger" role="alert" tabIndex={-1} ref={errorRef}>
            <p>{error.message}</p>
            {error.status === 409 && (
              <Link to={`/escola/${school.id}/classes`}>Ver turmas da escola</Link>
            )}
            {error.status === 404 && (
              <Link to={`/setor/${school.sectorId}`}>Voltar ao setor</Link>
            )}
          </Alert>
        )}
        {isDeleting && <p role="status">Excluindo escola...</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" type="button" onClick={close} disabled={isDeleting} ref={cancelRef} autoFocus>
          Cancelar
        </Button>
        <Button variant="danger" type="button" onClick={deleteSchool} disabled={isDeleting || (error && error.status === 404)}>
          {isDeleting ? 'Excluindo...' : 'Excluir escola'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
