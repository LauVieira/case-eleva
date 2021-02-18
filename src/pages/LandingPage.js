import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import {
  Col, Container, Image, Row,
} from 'react-bootstrap';
import Header from '../components/Header';

export default function LandingPage() {
  const [sectors, setSectors] = useState([]);

  useEffect(getSectors, []);

  function getSectors () {
    const request = axios.get('http://localhost:3000/sectors');
    request.then((response) => {
      setSectors([...response.data]);
    });
    request.catch(() => alert('Erro ao buscar o curso selecionado'));
  }

  return (
    <Container fluid>
      <Header />
    </Container>
  );
}
