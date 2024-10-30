import React, { useEffect, useState } from 'react';
import './Header.css';

const Header = ({ playerId }) => {
	const [money, setMoney] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch player data when the component mounts
	useEffect(() => {
		const fetchMoney = async () => {
			try {
				const response = await fetch(
					`http://localhost:3000/api/player/${playerId}`
				);

				if (!response.ok) {
					throw new Error('Failed to fetch player data');
				}

				const playerData = await response.json();
				setMoney(playerData.money);
				setLoading(false);
			} catch (err) {
				setError(err.message);
				setLoading(false);
			}
		};

		fetchMoney();
	}, [playerId]);

	if (loading) return <p>Loading...</p>;
	if (error) return <p>Error: {error}</p>;

	return (
		<header className="header">
			<div>
				{/* Player Money Button */}
				<div className="money">
					<span className="money-text">${money}</span>
				</div>
			</div>
		</header>
	);
};

export default Header;
