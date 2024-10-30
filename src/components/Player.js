import React, { useEffect, useState } from 'react';
import {
	buySpot,
	getField,
	getPlayerInfo,
	getPlayerPlants,
	harvest,
	login,
	plant,
} from '../api';
import fenceImage from '../img/fence.png'; // Path to fence image
import leftArrow from '../img/left-arrow.png'; // Add left arrow icon
import lockIcon from '../img/lock.png'; // Path to lock icon
import rightArrow from '../img/right-arrow.png'; // Add right arrow icon
import { getCurrentPlayerId } from '../services/playerService'; // Utility to get the current player ID
import './Player.css';

const Player = ({ updateMoney }) => {
	const [playerData, setPlayerData] = useState(null);
	const [fieldData, setFieldData] = useState(null);
	const [plantList, setPlantList] = useState([]); // Store the list of plants
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [currentPlantIndex, setCurrentPlantIndex] = useState(0); // Track the visible plant in the carousel

	const currentPlayerId = getCurrentPlayerId(); // Get the current playerId here

	// Fetch player, field, and plant data
	const fetchFieldAndPlayerData = async () => {
		try {
			console.log('PLAYER START');
			// Fetch player dataconst
			// await login('123456');
			const playerData = await getPlayerInfo();

			// Fetch field data
			const fieldData = await getField();
			const plantList = await getPlayerPlants();

			// Calculate timeLeft based on timePlanted and growTime
			const updatedSpots = (fieldData.spots || []).map((spot) => {
				const timeElapsed = spot.timePlanted
					? Math.ceil(
							(new Date().getTime() - new Date(spot.timePlanted).getTime()) /
								1000
					  )
					: null;
				const growTime = spot.plant ? spot.plant.growTime : 0;
				return {
					...spot,
					timeLeft:
						timeElapsed !== null ? Math.max(growTime - timeElapsed, 0) : null,
				};
			});

			setPlayerData(playerData);
			setFieldData({ ...fieldData, spots: updatedSpots });
			setPlantList(plantList);
			setLoading(false);

			updateMoney(playerData.money); // Update the money in the parent component
		} catch (err) {
			setError(err.message);
			setLoading(false);
		}
	};

	const handleUnlockSpot = async (spot) => {
		try {
			if (playerData.money < spot.cost) return null;
			// Optimistically deduct money for unlocking
			updateMoney(playerData.money - spot.cost);
			setPlayerData((prevPlayerData) => ({
				...prevPlayerData,
				money: prevPlayerData.money - spot.cost,
			}));

			const data = await buySpot();
			// if (data.success) {
			// 	setFieldData((prevFieldData) => ({
			// 		...prevFieldData,
			// 		spots: prevFieldData.spots.map((s) =>
			// 			s.spotNumber === data.nextSpot.spotNumber
			// 				? { ...s, isActive: true, isOccupied: false }
			// 				: s
			// 		),
			// 	}));
			// }
		} catch (error) {
			console.error('Error unlocking spot:', error);
			// Rollback money deduction on error
			updateMoney(playerData.money + spot.cost);
			setPlayerData((prevPlayerData) => ({
				...prevPlayerData,
				money: prevPlayerData.money + spot.cost,
			}));
		}
	};

	useEffect(() => {
		fetchFieldAndPlayerData();
	}, [currentPlayerId]);

	// Timer effect to update the remaining time every second
	useEffect(() => {
		const timer = setInterval(() => {
			setFieldData((prevFieldData) => {
				const updatedSpots = prevFieldData.spots.map((spot) => {
					if (spot.isOccupied && spot.timeLeft > 0) {
						return { ...spot, timeLeft: spot.timeLeft - 1 };
					}
					return spot;
				});
				return { ...prevFieldData, spots: updatedSpots };
			});
		}, 1000);

		return () => clearInterval(timer); // Clear interval on unmount
	}, []);

	const getNextInactiveSpot = () => {
		if (!fieldData || !fieldData.spots) return null;

		// Sort spots by spotNumber and find the first inactive spot
		const sortedSpots = [...fieldData.spots].sort(
			(a, b) => a.spotNumber - b.spotNumber
		);
		return sortedSpots.find((spot) => !spot.isActive) || null;
	};

	const handleSpotClick = async (spot, index) => {
		const previousFieldData = JSON.parse(JSON.stringify(fieldData)); // Deep copy for rollback

		console.log('Spots 1', spots);
		console.log('nextInactiveSpot ', getNextInactiveSpot());
		if (!spot.isActive) {
			const nextInactiveSpot = getNextInactiveSpot();

			console.log('nextInactiveSpot ', nextInactiveSpot);
			if (nextInactiveSpot && nextInactiveSpot.spotNumber === spot.spotNumber) {
				handleUnlockSpot(spot);
			}
		} else {
			const currentPlant = plantList[currentPlantIndex];
			console.log(
				'Selected plant:',
				currentPlant.name,
				'Grow Time:',
				currentPlant.growTime
			);
			// Deduct money optimistically
			const previousMoney = playerData.money;
			const newMoney = previousMoney - currentPlant.cost;

			console.log('Spots 2', spots);
			if (spot.isOccupied) {
				if (spot.timeLeft === 0) {
					try {
						// Optimistic UI update for planting

						setFieldData((prevFieldData) => {
							// Map through spots and only update the target spot
							const updatedSpots = prevFieldData.spots.map((s, i) =>
								s.spotNumber === index
									? {
											...s,
											isOccupied: false,
											plant: null,
											timeLeft: null,
									  }
									: s
							);
							return { ...prevFieldData, spots: updatedSpots };
						});

						console.log('Spots 3', spots);
						await harvest(index);
					} catch (error) {
						console.error('Error harvesting:', error);

						setFieldData(previousFieldData); // Rollback on error
					}
				}
			} else {
				if (playerData.money < currentPlant.cost) return null;
				// Handle planting
				try {
					updateMoney(newMoney); // Deduct plant cost immediately

					// Update player's money in playerData
					setPlayerData((prevPlayerData) => ({
						...prevPlayerData,
						money: newMoney, // Optimistically update money
					}));

					// Create a proper plant object for the spot
					const plantForSpot = {
						...currentPlant,
						timePlanted: new Date().toISOString(),
					};

					// Optimistic UI update for planting
					setFieldData((prevFieldData) => ({
						...prevFieldData,
						spots: prevFieldData.spots.map((s, i) =>
							s.spotNumber === index
								? {
										...s,
										spotNumber: index,
										isActive: true,
										isOccupied: true,
										plant: plantForSpot,
										timeLeft: currentPlant.growTime + 1,
										spotNumber: index,
								  }
								: s
						),
					}));

					console.log('Spots 4', spots);
					console.log('FIELD 4', fieldData.spots);
					console.log('currentPlant.id', currentPlant.id);
					console.log('index', index);

					const result = await plant(currentPlant.id, index);
				} catch (error) {
					console.log('Error planting:', error);
					// Roll back optimistic update if there's an error
					updateMoney(previousMoney);

					// Update player's money in playerData
					setPlayerData((prevPlayerData) => ({
						...prevPlayerData,
						money: previousMoney, // Optimistically update money
					}));
					setFieldData((prevFieldData) => {
						const updatedSpots = prevFieldData.spots.map((s, i) => {
							if (i === index) {
								return { ...s, isOccupied: false, plant: null, timeLeft: null }; // Revert if error
							}
							return s;
						});
						return { ...prevFieldData, spots: updatedSpots };
					});
				}
				console.log('Spots 5', spots);
			}
		}
	};

	// Navigation functions for the carousel
	const goToNextPlant = () => {
		if (currentPlantIndex < plantList.length - 1) {
			setCurrentPlantIndex((prevIndex) => prevIndex + 1);
		}
	};

	const goToPreviousPlant = () => {
		if (currentPlantIndex > 0) {
			setCurrentPlantIndex((prevIndex) => prevIndex - 1);
		}
	};

	// Helper function to get plant icon with error fallback
	const getPlantIcon = (plantName) => {
		try {
			return require(`../img/plants/${plantName.toLowerCase()}.png`); // Ensure plantName is lowercase
		} catch (error) {
			console.error(`Error loading icon for ${plantName}:`, error);
			return require('../img/plants/default.png'); // Fallback icon if not found
		}
	};

	// Carousel rendering
	const renderCarousel = () => {
		const currentPlant = plantList[currentPlantIndex];

		if (plantList.length === 0)
			return <p className="empty-message">Nothing to plant!</p>;

		return (
			<div className="plant-carousel">
				<img
					src={leftArrow}
					alt="Previous"
					className={`arrow ${currentPlantIndex === 0 ? 'hidden' : ''}`}
					onClick={currentPlantIndex > 0 ? goToPreviousPlant : undefined}
				/>

				<div className="carousel-item">
					<img
						src={getPlantIcon(currentPlant.name)}
						alt={currentPlant.name}
						className="plant-icon"
					/>
				</div>

				<img
					src={rightArrow}
					alt="Next"
					className={`arrow ${
						currentPlantIndex === plantList.length - 1 ? 'hidden' : ''
					}`}
					onClick={
						currentPlantIndex < plantList.length - 1 ? goToNextPlant : undefined
					}
				/>
			</div>
		);
	};

	if (loading) return <p className="loading">Loading...</p>;
	if (error) return <p className="error">Error: {error}</p>;

	// Ensure we have a 5x5 grid with a max of 25 spots
	const totalSpots = 25;
	const spots = Array.from({ length: totalSpots }, (_, index) => {
		const spot = fieldData.spots.find((s) => s.spotNumber === index) || {};
		const isActive = spot.isActive || false;
		const isOccupied = spot.isOccupied || false;
		const plantImg =
			isOccupied && spot.plant ? getPlantIcon(spot.plant.name) : null; // Load the image dynamically only if the plant exists
		return { ...spot, isActive, isOccupied, plantImg };
	});

	return (
		<div className="player-container">
			<div className="field-wrapper">
				<div
					className="field-container"
					style={{ backgroundImage: `url(${fenceImage})` }}
				>
					{spots.map((spot, index) => (
						<div
							key={index}
							className={`spot ${
								spot.isActive ? 'active-spot' : 'locked-spot'
							}`} // Active or Locked
							onClick={() => handleSpotClick(spot, index)}
						>
							{/* Render the lock icon if the spot is locked */}
							{!spot.isActive && (
								<>
									<img src={lockIcon} alt="Locked" className="lock-icon" />
									{spot.spotNumber == getNextInactiveSpot().spotNumber && (
										<span className="unlock-cost">${spot.cost}</span>
									)}
								</>
							)}

							{/* Render crop timer and plant image on active spots */}
							{spot.isActive && spot.isOccupied && spot.plantImg && (
								<>
									<img src={spot.plantImg} className="plant-icon-on-spot" />
									{spot.timeLeft > 0 && (
										<span className="crop-timer">{spot.timeLeft}s</span>
									)}
								</>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Render plant carousel */}
			{renderCarousel()}
		</div>
	);
};

export default Player;
