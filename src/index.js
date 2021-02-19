import React from 'react';
import ReactDOM from 'react-dom';
import FloatingFocus from '@q42/floating-focus-a11y';

import App from './App';

const root = document.querySelector('#root');
new FloatingFocus(root);

ReactDOM.render(<App />, root);
