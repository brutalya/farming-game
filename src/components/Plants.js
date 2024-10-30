import React, { useCallback, useEffect, useState } from 'react';
import { getPlants, getPlayerPlants, unlockPlant } from '../api';
import './Plants.css';

function Plants({ playerId }) {
	const [plants, setPlants] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Fetch all plants and player's accessible plants
	const fetchPlants = useCallback(async () => {
		try {
			const allPlantsData = await getPlants();
			const playerPlantsData = await getPlayerPlants();

			// Mark accessible plants
			const accessiblePlantIds = new Set(
				playerPlantsData.map((plant) => plant.id)
			);
			const mergedPlants = allPlantsData.map((plant) => ({
				...plant,
				isAccessible: accessiblePlantIds.has(plant.id), // Mark if accessible by player
			}));

			// Sort plants by growTime
			const sortedPlants = mergedPlants.sort((a, b) => a.growTime - b.growTime);
			setPlants(sortedPlants);
			setLoading(false);
		} catch (err) {
			setError(err.message);
			setLoading(false);
		}
	}, [playerId]);

	useEffect(() => {
		fetchPlants();
	}, [fetchPlants]);

	// Handle Unlock Button
	const handleUnlock = async (plantId) => {
		console.log(`Attempting to unlock: ${plantId}`);
		try {
			const result = await unlockPlant(plantId);
			console.log('Unlock success:', result);
			fetchPlants(); // Refresh the plant list after unlocking
		} catch (error) {
			console.error('Error unlocking plant:', error);
		}
	};

	if (loading) return <p className="loading">Loading plants...</p>;
	if (error) return <p className="error">Error: {error}</p>;

	// Helper function to get plant icon
	const getPlantIcon = (plantName) => {
		try {
			// Assuming icons are named after plant names, e.g., cabbage.png, carrot.png
			return require(`../img/plants/${plantName}.png`);
		} catch (error) {
			console.error(`Error loading icon for ${plantName}:`, error);
			return require('../img/plants/default.png'); // Fallback icon if not found
		}
	};

	// Determine the first non-accessible plant
	const firstLockedPlantIndex = plants.findIndex(
		(plant) => !plant.isAccessible
	);

	return (
		<div className="plants-container">
			<div className="plants-grid">
				{plants.map((plant, index) => (
					<div
						key={plant.id}
						className={`plant-card ${
							plant.isAccessible ? 'accessible' : 'locked'
						}`}
					>
						{/* Plant Info on the right */}
						<div className="plant-details">
							{/* Plant Icon on the left */}
							<img src={getPlantIcon(plant.name)} alt={`${plant.name} icon`} />
							<h3 className="plant-name">{plant.name}</h3>
							<p className="plant-info">Cost: ${plant.cost}</p>
							<p className="plant-info">Grow Time: {plant.growTime}s</p>
							<p className="plant-info">Sell Price: ${plant.sellPrice}</p>

							{plant.isAccessible ? (
								<p className="plant-status unlocked">Unlocked</p>
							) : index === firstLockedPlantIndex ? (
								<button
									className="unlock-button"
									onClick={() => handleUnlock(plant.id)}
								>
									Unlock for ${plant.unlockPrice}
								</button>
							) : (
								<p className="plant-status locked">Locked</p>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export default Plants;
