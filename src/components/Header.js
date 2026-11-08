import React from 'react';
import styled from 'styled-components';
import {
  Image, Navbar,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { Link } from 'react-router-dom';
import { IoMdLogOut } from 'react-icons/io';

export default function Header () {
  return (
    <>
      <StyledNavbar fixed="top" expand="md">

        <BrandLink to="/" aria-label="Gestão Escolar — início">
          <BrandIcon src="/images/gestao-escolar.svg" alt="" width="48" height="48" />
          <BrandText>
            <BrandName>Gestão Escolar</BrandName>
            <BrandSubtitle>Protótipo acadêmico</BrandSubtitle>
          </BrandText>
        </BrandLink>

        <LinkContainer to="/login">
          <NavbarText>
            <IoMdLogOut />
            <p>Sair</p>
          </NavbarText>
        </LinkContainer>

      </StyledNavbar>
      <AcademicNotice>
        Protótipo desenvolvido para TCC. Aplicação não oficial.
      </AcademicNotice>
    </>
  );
}

const StyledNavbar = styled(Navbar)`
  align-items: center;
  background-color: var(--navy-blue);
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-height: 72px;
  padding: 8px 16px;
`;

const BrandLink = styled(Link)`
  align-items: center;
  color: #FFF;
  display: flex;
  gap: 12px;
  min-width: 0;

  :hover {
    color: #FFF;
    text-decoration: none;
  }
`;

const BrandIcon = styled(Image)`
  flex-shrink: 0;
`;

const BrandText = styled.span`
  display: flex;
  flex-direction: column;
`;

const BrandName = styled.span`
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
`;

const BrandSubtitle = styled.span`
  font-size: 12px;
  line-height: 1.4;
`;

const AcademicNotice = styled.p`
  color: #535662;
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 20px;
  text-align: center;
`;

const NavbarText = styled(Navbar.Text)`
  align-items: center;
  color: #FFF!important;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-size: 18px;
  justify-content: center;
  margin-right: 0;
  padding: 0;

  p {
    margin-bottom: 0;
  }

  svg {
    font-size: 22px;
    margin: 0;
  }
`;
