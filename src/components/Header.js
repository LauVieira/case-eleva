import React from 'react';
import styled from 'styled-components';
import {
  Col, Container, Image, Navbar,
} from 'react-bootstrap';

export default function Header() {
  return (
    <StyledContainer fluid noGutters>
      <Image
        src="/images/header.png"
        alt="Logotipo da prefeitura"
      />
    </StyledContainer>
  );
}

const StyledContainer = styled(Container)`
  background-color: #25117d;
  padding-left: 0 !important;
  padding-right: 0 !important;

  img {
    height: 60px;
  }
`;
