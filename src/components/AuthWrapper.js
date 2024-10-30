// src/AuthWrapper.js
import React, { useEffect, useState } from 'react';
import { clearToken, getPlayerInfo, getToken, login } from '../api';

const AuthWrapper = ({ children }) => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	useEffect(() => {
		console.log('WRAPPER START');
		const authenticate = async () => {
			console.log('authenticate');
			const token = getToken();

			if (!token) {
				await handleLogin();
			} else {
				await loadPlayerData();
			}
			setLoading(false);
		};

		const handleLogin = async () => {
			console.log('handleLogin');
			try {
				const telegramId = '123456'; // Replace this with actual Telegram ID logic
				await login(telegramId);
				await loadPlayerData();
			} catch (err) {
				setError('Failed to authenticate');
			}
		};

		const loadPlayerData = async () => {
			console.log('loadPlayerData');
			try {
				await getPlayerInfo();
			} catch (err) {
				clearToken();
				await handleLogin();
			}
		};

		authenticate();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div>{error}</div>;

	return <>{children}</>;
};

export default AuthWrapper;
