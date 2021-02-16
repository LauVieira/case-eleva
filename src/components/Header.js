import React from 'react';
import styled from 'styled-components';
import {
  Image, Navbar,
} from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { IoMdLogOut } from 'react-icons/io';

export default function Header() {
  return (
    <StyledNavbar fixed="top" expand="md">

      <LinkContainer to="/">
        <Image
          src="/images/header.png"
          alt="Logotipo da prefeitura"
        />
      </LinkContainer>

      <Navbar.Collapse className="justify-content-end">
        <LinkContainer to="/login">
          <NavbarText>
            <IoMdLogOut />
            <p>Sair</p>
          </NavbarText>
        </LinkContainer>
      </Navbar.Collapse>

    </StyledNavbar>
  );
}

const StyledNavbar = styled(Navbar)`
  background-color: #25117d;
  padding: 0 !important;

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

  svg {
    font-size: 22px;
    margin: 5px 0 -5px 0;
  }
`;
