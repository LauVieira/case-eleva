import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import { Container } from 'react-bootstrap';

import Header from '../components/Header';
import SchoolCard from '../components/SchoolCard';

export default function SchoolPage () {
  const { id } = useParams();
  const [schoolData, setSchoolData] = useState({});

  useEffect(getSchoolData, []);

  function getSchoolData () {
    const request = axios.get(`http://localhost:3000/schools/${id}`);
    request.then((response) => {
      setSchoolData({ ...response.data });
    });
    request.catch(() => alert('Erro ao buscar a escola selecionada'));
  }

  return (
    <StyledContainer fluid>

      <Header />
      <SchoolCard schoolData={schoolData} />

    </StyledContainer>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
`;
