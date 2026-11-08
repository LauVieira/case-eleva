import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';

import api from '../services/api';
import { formatClassName } from '../utils/classForm';

export default function ClassDeleteModal ({ classData, show, onHide, onDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const inProgress = useRef(false);
  const active = useRef(true);
  const cancelRef = useRef(null);
  const errorRef = useRef(null);
  const displayName = formatClassName(classData.name);

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

  function deleteClass () {
    if (inProgress.current) return;
    inProgress.current = true;
    setIsDeleting(true);
    setError(null);

    api.delete(`/classes/${classData.id}`)
      .then((response) => {
        if (response.status !== 204) throw new Error('Resposta inesperada da exclusão.');
        if (active.current) onDeleted(classData);
      })
      .catch((requestError) => {
        if (!active.current) return;
        const status = requestError.response && requestError.response.status;
        let message = 'Não foi possível confirmar a exclusão. Verifique sua conexão e tente novamente.';
        if (status === 404) {
          message = 'Esta turma não foi encontrada. Volte para a listagem atualizada.';
        } else if (status >= 500) {
          message = 'Não foi possível excluir a turma. Tente novamente.';
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
      aria-labelledby="delete-class-title"
      aria-describedby="delete-class-description"
      onShow={() => { if (cancelRef.current) cancelRef.current.focus(); }}
      centered
    >
      <Modal.Header>
        <Modal.Title id="delete-class-title">Excluir turma</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p id="delete-class-description" style={{ overflowWrap: 'anywhere' }}>
          Deseja excluir a turma
          {' '}
          <strong>{displayName}</strong>
          ?
          {' '}
          Esta ação não pode ser desfeita.
        </p>
        {error && (
          <Alert variant="danger" role="alert" tabIndex={-1} ref={errorRef}>
            <p>{error.message}</p>
          </Alert>
        )}
        {isDeleting && <p role="status">Excluindo turma...</p>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" type="button" onClick={close} disabled={isDeleting} ref={cancelRef} autoFocus>
          Cancelar
        </Button>
        <Button variant="danger" type="button" onClick={deleteClass} disabled={isDeleting || (error && error.status === 404)}>
          {isDeleting ? 'Excluindo...' : 'Excluir turma'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
