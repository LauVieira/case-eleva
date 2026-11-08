import React from 'react';
import styled from 'styled-components';
import {
  Col, Container, Image, Row,
} from 'react-bootstrap';
import LoginForm from '../components/LoginForm';

export default function SignIn () {
  return (
    <Container fluid>

      <MainWrapper fluid>

        <ColLeft sm={7}>
          <Image
            src="/images/gestao-escolar.svg"
            alt=""
            width="128"
            height="128"
          />
          <H1>Gestão Escolar</H1>
          <Subtitle>Protótipo acadêmico</Subtitle>
          <AcademicNotice>
            Protótipo desenvolvido para TCC. Aplicação não oficial.
          </AcademicNotice>
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
  min-height: 100vh;
`;

const ColLeft = styled(Col)`
  align-items: center;
  color: var(--navy-blue);
  display: flex;
  flex-direction: column;
  font-family: 'Source Sans Pro', sans-serif;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;

  img {
    margin-bottom: 24px;
    max-width: 40vw;
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
  font-size: clamp(32px, 5vw, 48px);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  font-size: 18px;
  margin-bottom: 16px;
`;

const AcademicNotice = styled.p`
  color: #535662;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 0;
  max-width: 26rem;
`;
