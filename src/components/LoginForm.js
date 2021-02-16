import React from 'react';
import styled from 'styled-components';
import {
  Button, Form,
} from 'react-bootstrap';

export default function LoginForm() {
  return (
    <StyledForm>
      <Form.Group controlId="formBasicEmail">
        <Form.Label>Email</Form.Label>
        <Form.Control type="email" placeholder="Email" />
      </Form.Group>

      <Form.Group controlId="formBasicPassword">
        <Form.Label>Senha</Form.Label>
        <Form.Control type="password" placeholder="Senha" />
      </Form.Group>
      <StyledButton variant="primary" type="submit">
        Entrar
      </StyledButton>
    </StyledForm>
  );
}

const StyledForm = styled(Form)`
  background-color: #FFF;
  border-radius: 4px;
  padding: 30px;

  label {
    font-size: 18px;
  }
`;

const StyledButton = styled(Button)`
  background-color: var(--navy-blue)!important;
  font-size: 20px;
  width: 100%;
`;
