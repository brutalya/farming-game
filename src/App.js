import React, { useEffect, useState } from 'react';
import { getPlayerInfo, loginWithTelegram } from './api';
import './App.css';
import AuthWrapper from './components/AuthWrapper';
import Barn from './components/Barn';
import Plants from './components/Plants';
import Player from './components/Player';
import { getCurrentPlayerId } from './services/playerService'; // Import the utility

// Icons for the tabs
import barnIcon from './icons/barn.svg';
import farmerIcon from './icons/farmer.svg';
import plantsIcon from './icons/plants.svg';

function App() {
	const [activeTab, setActiveTab] = useState('Farmer');
	const [money, setMoney] = useState(0); // Manage the player's money here
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [user, setUser] = useState(null);

	const currentPlayerId = getCurrentPlayerId(); // Get the playerId here

	// Authenticate on load
	useEffect(() => {
		console.log('APP START');
		const authenticateWithTelegram = async () => {
			try {
				const initDataUnsafe = window.Telegram.WebApp.initDataUnsafe;
				const telegramData = window.Telegram.WebApp.initDataUnsafe.user;
				console.log('telegramData: ', telegramData);
				console.log('initDataUnsafe: ', initDataUnsafe);
				if (telegramData) {
					const { hash } = initDataUnsafe;
					const { id: telegramId, username } = telegramData;
					// Call backend to verify and log in the user
					const player = await loginWithTelegram(
						telegramId,
						username,
						hash,
						telegramData
					);
					setUser(player);
					setLoading(false);
				} else {
					throw new Error('Telegram authentication failed');
				}
			} catch (err) {
				setError(err.message);
				setLoading(false);
			}
		};

		authenticateWithTelegram();
		// const authenticate = async () => {
		// 	try {
		// 		const telegramData = {}; // Populate this with the Telegram data, id, username, hash, etc.
		// 		// await login('123456');
		// 		const playerData = getPlayerInfo();
		// 		// setPlayer(playerData);
		// 		setMoney(playerData.money);
		// 		setLoading(false);
		// 	} catch (err) {
		// 		setError('Authentication failed', err);
		// 		setLoading(false);
		// 	}
		// };

		// authenticate();
	}, [activeTab, currentPlayerId]);

	// Fetch player money each time the active tab changes
	// useEffect(() => {
	// 	const fetchMoney = async () => {
	// 		try {
	// 			const response = await fetch(
	// 				`http://localhost:3000/api/player/${currentPlayerId}`
	// 			);
	// 			if (!response.ok) {
	// 				throw new Error('Failed to fetch player data');
	// 			}
	// 			const playerData = await response.json();
	// 			setMoney(playerData.money); // Update the player's money
	// 			setLoading(false);
	// 		} catch (err) {
	// 			setError(err.message);
	// 			setLoading(false);
	// 		}
	// 	};
	// 	fetchMoney();
	// }, [activeTab, currentPlayerId]); // This will run the fetch whenever the activeTab changes or playerId changes

	// Function to update the player's money (used by Player component)
	const updateMoney = (newMoney) => {
		setMoney(newMoney); // Update the money state
	};

	const tabs = [
		{ name: 'Farmer', icon: farmerIcon },
		{ name: 'Plants', icon: plantsIcon },
		{ name: 'Barn', icon: barnIcon },
	];

	// Function to render content based on the active tab
	const renderContent = () => {
		switch (activeTab) {
			case 'Farmer':
				return <Player updateMoney={updateMoney} />;
			case 'Plants':
				return <Plants />;
			case 'Barn':
				return <Barn updateMoney={updateMoney} />;
			default:
				return <h2>Welcome to the Farming Game!</h2>;
		}
	};

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error}</p>;

	return (
		<AuthWrapper>
			<div className="app-wrapper">
				<div className="App">
					{/* Header section for sky background and player money */}
					<header className="header">
						<div>
							{/* Display player money directly in the header */}
							<div className="money">
								<span className="money-text">${money}</span>
							</div>
						</div>
					</header>

					<main className="content">{renderContent()}</main>

					{/* Bottom Tab Navigation */}
					<footer className="tab-navigation">
						{tabs.map((tab) => (
							<div
								key={tab.name}
								className={`svg-tab ${activeTab === tab.name ? 'active' : ''}`}
								onClick={() => setActiveTab(tab.name)} // Change tab and trigger a new fetch
							>
								<div className="tab-shape">
									<img src={tab.icon} alt={tab.name} className="tab-icon" />
								</div>
							</div>
						))}
					</footer>
				</div>
			</div>
		</AuthWrapper>
	);
}

export default App;
