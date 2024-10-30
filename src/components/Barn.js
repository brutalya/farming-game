import React, { useEffect, useState } from 'react';
import { getInventory, sell } from '../api';
import './Barn.css';

function Barn({ updateMoney }) {
	const [inventory, setInventory] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [selling, setSelling] = useState({});

	// Fetch player inventory data
	const fetchInventory = async () => {
		try {
			const data = await getInventory();
			setInventory(data.inventory);
			setLoading(false);
		} catch (err) {
			setError(err.message);
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchInventory();
	}, [updateMoney]);

	// Handle selling plants with better error handling and sync
	const handleSell = async (plantId, quantity) => {
		setSelling((prev) => ({ ...prev, [plantId]: true }));
		try {
			const result = await sell(plantId, quantity);

			// Update money and inventory based on response
			updateMoney(result.remainingMoney);
			setInventory((prevInventory) =>
				prevInventory.map((item) =>
					item.plant.id === plantId
						? { ...item, amount: result.remainingAmount }
						: item
				)
			);
		} catch (error) {
			setError(`Error: ${error.message}`);
			console.error('Error selling plant:', error);
		} finally {
			setSelling((prev) => ({ ...prev, [plantId]: false }));
		}
	};

	if (loading) return <p className="loading">Loading Barn...</p>;
	if (error) return <p className="error">Error: {error}</p>;
	if (inventory.length === 0)
		return <p className="empty-message">Inventory is empty</p>;

	// Function to get the plant icon
	const getPlantIcon = (plantName) => {
		try {
			return require(`../img/plants/${plantName.toLowerCase()}.png`);
		} catch (error) {
			console.error(`Error loading icon for ${plantName}:`, error);
			return require('../img/plants/default.png');
		}
	};

	// Sort inventory by plant's selling price
	const sortedInventory = [...inventory].sort(
		(a, b) => b.plant.sellPrice - a.plant.sellPrice
	);

	return (
		<div className="barn-container">
			<div className="inventory-grid">
				{sortedInventory.map((item) => (
					<div key={item.plant.id} className="inventory-item">
						<img src={getPlantIcon(item.plant.name)} alt={item.plant.name} />
						<div className="plant-info">{item.plant.name}</div>
						<div className="plant-info">Amount: {item.amount}</div>
						<div className="plant-info">
							Sell Price: ${item.plant.sellPrice}
						</div>
						<div className="sell-buttons">
							<button
								onClick={() => handleSell(item.plant.id, 1)}
								disabled={item.amount < 1 || selling[item.plant.id]}
							>
								{selling[item.plant.id] ? 'Selling...' : 'Sell 1'}
							</button>
							<button
								onClick={() => handleSell(item.plant.id, 10)}
								disabled={item.amount < 10 || selling[item.plant.id]}
							>
								{selling[item.plant.id] ? 'Selling...' : 'Sell 10'}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}

export default Barn;
