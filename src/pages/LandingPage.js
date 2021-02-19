import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import {
  Container, ListGroup,
} from 'react-bootstrap';
import { BsPlusCircleFill } from 'react-icons/bs';
import colorContrast from 'color-contrast';

import Header from '../components/Header';

export default function LandingPage () {
  const [sectors, setSectors] = useState([]);

  useEffect(getSectors, []);

  function getSectors () {
    const request = axios.get('http://localhost:3000/sectors');
    request.then((response) => {
      setSectors([...response.data]);
    });
    request.catch(() => alert('Erro ao buscar o setor selecionado'));
  }

  return (
    <StyledContainer fluid>

      <Header />

      {sectors.length === 0
        ? <p>Carregando...</p>
        : (
          <StyledListGroup>
            <SectorItem action href="/setor/novo" color="#fff" textColor="#000">
              <span>
                <BsPlusCircleFill />
                Adicionar Setor
              </span>
            </SectorItem>
            {sectors.map((sector) => <SectorCard key={sector.id} sector={sector} />)}
          </StyledListGroup>
        )}

    </StyledContainer>
  );
}

function SectorCard (props) {
  const { sector } = props;
  const link = `/setor/${sector.id}`;
  const contrast = colorContrast(sector.color, '#000');
  const textColor = contrast > 7 ? '#000' : '#FFF';

  return (
    <SectorItem action href={link} color={sector.color} textColor={textColor}>
      <p>{sector.name}</p>
      <p>{sector.code}</p>
    </SectorItem>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
`;

const StyledListGroup = styled(ListGroup)``;

const SectorItem = styled(ListGroup.Item)`
  align-items: center;
  background-color: ${(props) => props.color};
  display: flex;
  font-size: 18px;
  justify-content: space-between;
  margin: 0 auto 5px auto;
  width: 90vw;
  color: ${(props) => props.textColor};

  :hover {
    color: #000;
  }

  p {
    margin-bottom: 0;
  }

  svg {
    font-size: 20px;
    margin: 0 8px -3px -3px;
  }
`;
