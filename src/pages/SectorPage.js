import React, { useEffect, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import {
  Container, ListGroup,
} from 'react-bootstrap';
import { BsPlusCircleFill } from 'react-icons/bs';
import Header from '../components/Header';

export default function SectorPage () {
  const { id } = useParams();
  // const history = useHistory();
  const [schools, setSchools] = useState([]);

  if (id !== 'novo') useEffect(getSectors, []);

  function getSectors () {
    const request = axios.get(`http://localhost:3000/sectors/${id}/schools`);
    request.then((response) => {
      setSchools([...response.data]);
      console.log(response.data);
    });
    request.catch(() => alert('Erro ao buscar as escolas do setor selecionado'));
  }

  return (
    <StyledContainer fluid>

      <Header />

      {schools.length === 0
        ? <p>Carregando...</p>
        : (
          <StyledListGroup>
            <SchoolItem>
              <span>
                <BsPlusCircleFill />
                Adicionar Escola
              </span>
            </SchoolItem>
            {schools.map((school) => <SchoolCard key={school.id} school={school} />)}
          </StyledListGroup>
        )}

    </StyledContainer>
  );
}

function SchoolCard (props) {
  const { school } = props;

  return (
    <SchoolItem>
      {school.name}
    </SchoolItem>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
`;

const StyledListGroup = styled(ListGroup)``;

const SchoolItem = styled(ListGroup.Item)`
  font-size: 18px;

  p {
    margin-bottom: 0;
  }

  svg {
    font-size: 20px;
    margin: 0 8px -3px -3px;
  }
`;
