import React from 'react';
import styled from 'styled-components';
import {
  Col, Container, Image, Row,
} from 'react-bootstrap';
import LoginForm from '../components/LoginForm';

export default function SignIn() {
  return (
    <Container fluid>

      <MainWrapper fluid>

        <ColLeft sm={7}>
          <H1>Prefeitura</H1>
          <Image
            src="/images/brasaomacae.png"
            alt="Brasão da cidade"
          />
          <H2>MACAÉ</H2>
          <H3>Secretaria de Educação</H3>
        </ColLeft>

        <ColRight>
          <LoginForm />
        </ColRight>

      </MainWrapper>

    </Container>
  );
}

const MainWrapper = styled(Row)`
  display: flex;
  height: 100vh;
`;

const ColLeft = styled(Col)`
  align-items: center;
  color: var(--navy-blue);
  display: flex;
  flex-direction: column;
  font-family: 'Source Sans Pro', sans-serif;
  justify-content: center;

  img {
    min-width: 40%;
    max-width: 60%;
  }
`;

const ColRight = styled(Col)`
  align-items: center;
  background-color: var(--navy-blue);
  display: flex;
  justify-content: center;
  padding: 20px 5px;
`;

const H1 = styled.h1`
  font-size: 50px;
`;

const H2 = styled.h2`
  font-size: 44px;
  margin: 10px 0 5px 0;
`;

const H3 = styled.h3`
  border-top: 1px solid;
  font-size: 40px;
  text-align: center;
`;
