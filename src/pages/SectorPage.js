import React from 'react';
import styled from 'styled-components';
import {
  Container,
} from 'react-bootstrap';
import Header from '../components/Header';

export default function SectorPage () {
  return (
    <StyledContainer fluid>

      <Header />

    </StyledContainer>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
`;
