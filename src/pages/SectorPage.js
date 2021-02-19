import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import styled from 'styled-components';
import {
  Card, CardDeck, Container, Row, Col,
} from 'react-bootstrap';
import { BsPlusCircleFill } from 'react-icons/bs';
import Header from '../components/Header';

export default function SectorPage () {
  const { id } = useParams();
  const [schools, setSchools] = useState([]);

  if (id !== 'novo') useEffect(getSectors, []);

  function getSectors () {
    const request = axios.get(`http://localhost:3000/sectors/${id}/schools`);
    request.then((response) => {
      setSchools([...response.data]);
    });
    request.catch(() => alert('Erro ao buscar as escolas do setor selecionado'));
  }

  return (
    <StyledContainer fluid>

      <Header />

      {schools.length === 0
        ? <p>Carregando...</p>
        : (
          <StyledCardDeck>

            <Container fluid style={{ marginBottom: '20px' }}>
              <SchoolItem href="/" tabIndex="0" style={{ height: 'auto' }}>
                <StyledCard>
                  <Card.Text className="add-school">
                    <BsPlusCircleFill />
                    Adicionar Escola
                  </Card.Text>
                </StyledCard>
              </SchoolItem>

              <Row>
                {
                  schools.map((school) => (
                    <Col md={12}>
                      <SchoolCard key={school.id} school={school} />
                    </Col>
                  ))
                }
              </Row>
            </Container>

          </StyledCardDeck>
        )}

    </StyledContainer>
  );
}

function SchoolCard (props) {
  const { school } = props;
  const link = `/escola/${school.id}`;

  return (
    <SchoolItem href={link} tabIndex="0">
      <StyledCard style={{ width: '18rem' }}>
        <Card.Body>
          <Card.Title>{school.name}</Card.Title>
          <Card.Text>
            {school.address}
          </Card.Text>
        </Card.Body>
      </StyledCard>
    </SchoolItem>
  );
}

const StyledContainer = styled(Container)`
  padding-top: 100px;
`;

const StyledCardDeck = styled(CardDeck)``;

const SchoolItem = styled.a`
  display: flex;
  font-size: 18px;
  text-align: center;
  margin: 20px 0;
  color: initial;

  :hover {
    color: initial;
    text-decoration: none;
  }

  p {
    margin-bottom: 0;
  }

  svg {
    font-size: 20px;
    margin-right: 5px;
  }
`;

const StyledCard = styled(Card)`
  box-shadow: 3px 2px 10px 1px #B7B5B2;

  .add-school {
    align-items: center;
    display: flex;
    height: 100%;
    justify-content: center;
  }
`;
