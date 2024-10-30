import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css';

ReactDOM.render(
	<React.StrictMode>
		<script async src="https://telegram.org/js/telegram-web-app.js"></script>

		<App />
	</React.StrictMode>,
	document.getElementById('root')
);
