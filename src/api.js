// src/api.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
const TOKEN_KEY = 'auth_token';

// Centralized token storage
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// Axios instance with baseURL
const api = axios.create({
	baseURL: API_BASE_URL,
});

// Attach token to requests automatically
api.interceptors.request.use(
	(config) => {
		const token = getToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

// Automatic re-authentication on 401 response
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		if (error.response && error.response.status === 401) {
			clearToken();
			window.location.reload(); // Force re-login by reloading the app
		}
		return Promise.reject(error);
	}
);

export const login = async (telegramId) => {
	console.log('LOGIN');
	console.log(telegramId);
	const response = await api.post('/auth/login', { telegramId });
	console.log('setToken: ', response.data.token);
	setToken(response.data.token);
	return response.data.token;
};

// Auth API
export const loginWithTelegram = async (telegramId, username, hash, data) => {
	const response = await axios.get(`${API_BASE_URL}/auth/telegram`, {
		request: { id: telegramId, username, hash, ...data },
	});
	setToken(response.data.token);
	return response.data.player;
};

// GETS
// get getPlayerInfo
export const getPlayerInfo = async () => {
	const response = await api.get('/player');
	return response.data;
};

// get field
export const getField = async () => {
	console.log('getField token', getToken());
	const response = await api.get('/field');
	console.log('response.data.field');
	console.log(response.data);
	return response.data;
};

// get all plants
export const getPlants = async () => {
	console.log('getPlants token', getToken());
	const response = await api.get('/plants');
	console.log('response.data.plants');
	console.log(response.data);
	return response.data;
};

// get plants
export const getPlayerPlants = async () => {
	console.log('getPlayerPlants token', getToken());
	const response = await api.get('/player-plants');
	console.log('response.data.plants');
	console.log(response.data);
	return response.data;
};

// get inventory
export const getInventory = async () => {
	console.log('getInventory token', getToken());
	const response = await api.get('/player');
	console.log('response.data.inventory');
	console.log(response.data);
	return response.data;
};

// POSTS
// unlock
export const unlockPlant = async (plantId) => {
	console.log('unlockPlant token', getToken());
	// const response = await axios.post(`${API_BASE_URL}/unlock-plant`, {
	// 	request: { plantId: plantId },
	// });
	const response = await api.post('/unlock-plant', {
		plantId: plantId,
	});
	console.log('response.data.unlock-plant');
	console.log(response);

	if (response.statusText != 'OK') {
		throw new Error(`Failed to unlock plant: ${response.statusText}`);
	}
	return response.data;
};

// PLANT
export const plant = async (plantId, spotNumber) => {
	console.log('plant token', getToken());
	const response = await api.post('/plant', {
		spotNumber: spotNumber,
		plantId: plantId,
	});
	console.log('response.data.plant');
	console.log(response.data);

	if (response.statusText != 'OK') {
		throw new Error(`Failed to plant on spot: ${response.statusText}`);
	}
	return response.data;
};

// HARVEST
export const harvest = async (spotNumber) => {
	console.log('harvest token', getToken());
	// const response = await axios.post(`${API_BASE_URL}/harvest`, {
	// 	spotNumber: spotNumber,
	// });
	const response = await api.post('/harvest', {
		spotNumber: spotNumber,
	});
	console.log('response.data.harvest');
	console.log(response.data);

	if (response.statusText != 'OK') {
		throw new Error(`Failed to harvest on spot: ${response.statusText}`);
	}
	return response.data;
};

// SELL
export const sell = async (plantId, quantityToSell) => {
	console.log('sell token', getToken());
	const response = await api.post('/sell-plants', {
		plantId: plantId,
		quantityToSell: quantityToSell,
	});
	console.log('response.data.sell');
	console.log(response.data);

	if (response.statusText != 'OK') {
		throw new Error(`Failed to sell plant: ${response.statusText}`);
	}
	return response.data;
};

// SELL
export const buySpot = async () => {
	console.log('buySpot token', getToken());
	const response = await api.post('/buy-spot');
	console.log('response.data.buySpot');
	console.log(response.data);

	if (response.statusText != 'OK') {
		throw new Error(`Failed to buy a spot: ${response.statusText}`);
	}
	return response.data;
};
