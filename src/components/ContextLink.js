import { Link } from 'react-router-dom';
import styled from 'styled-components';

const ContextLink = styled(Link)`
  color: #0069d9;

  &:hover,
  &:focus,
  &:visited {
    color: #0056b3;
  }
`;

export default ContextLink;
