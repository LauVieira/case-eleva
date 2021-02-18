import React from 'react';
import styled from 'styled-components';
import {
  Image, Navbar,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { IoMdLogOut } from 'react-icons/io';

export default function Header () {
  return (
    <StyledNavbar fixed="top" expand="md">

      <LinkContainer to="/">
        <Image
          src="/images/header.png"
          alt="Logotipo da prefeitura"
        />
      </LinkContainer>

      <LinkContainer to="/login">
        <NavbarText>
          <IoMdLogOut />
          <p>Sair</p>
        </NavbarText>
      </LinkContainer>

    </StyledNavbar>
  );
}

const StyledNavbar = styled(Navbar)`
  align-items: center;
  background-color: #25117d;
  display: flex;
  justify-content: space-between;
  padding: 5px;

  img {
    height: 55px;
    cursor: pointer;
  }
`;

const NavbarText = styled(Navbar.Text)`
  align-items: center;
  color: #FFF!important;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  font-size: 18px;
  justify-content: center;
  margin-right: 20px;
  padding: 0;

  p {
    margin-bottom: 0;
  }

  svg {
    font-size: 22px;
    margin: 0;
  }
`;
