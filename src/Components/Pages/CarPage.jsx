import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import moment from "moment";
import { Loading } from "../Elements";
import { useToken, useFetch } from "../../Hooks";
import { Endpoints, InputProps } from "../../Utils";
import { Box, Typography, Modal, Button, Input } from "@mui/material";
import AlertBox from "../Elements/AlertBox";
import { useAlert } from "../../Utils/AlertContext";

const style = {
	position: "absolute",
	top: "50%",
	left: "50%",
	transform: "translate(-50%, -50%)",
	width: 400,
	bgcolor: "background.paper",
	border: "2px solid #000",
	boxShadow: 24,
	p: 4,
	display: "flex",
	flexDirection: "column",
	borderRadius: "0.75rem",
};

const CarPage = () => {
	const { showAlert } = useAlert();
	const { token } = useToken();
	const params = useParams();
	const [car, setCar] = useState(null); // Πληροφορίες αυτοκινήτου
	const [quantity, setQuantity] = useState(0); // Τρέχουσα ποσότητα από τη βάση
	const [newQuantity, setNewQuantity] = useState(0); // Τοπική ποσότητα για εισαγωγή
	const [testDriveCars, setTestDriveCars] = useState(0); // Αριθμός αυτοκινήτων σε test drive
	const [isCustomerModalVisible, setIsCustomerModalVisible] = useState(false); // Αριθμός αυτοκινήτων σε test drive
	const [isAgentModalVisible, setIsAgentModalVisible] = useState(false); // Αριθμός αυτοκινήτων σε test drive
	const [date, setDate] = useState("");
	const [time, setTime] = useState("");
	const [customerTestDrive, setCustomerTestDrive] = useState("");
	const [isAgent, setIsAgent] = useState(null);
	const [userId, setUserId] = useState("");
	const navigate = useNavigate();
	const { carId } = params;
	const {
		data: carData,
		loading: carLoading,
		error: carError,
	} = useFetch(`${Endpoints.CARS_URL}/${carId}`, {
		method: "get",
	});
	const {
		data: reservationData,
		loading: reservationLoading,
		error: reservationError,
		refetch: reservationRefetch,
	} = useFetch(
		`${Endpoints.RESERVATIONS_URL}`,
		{
			method: "post",
		},
		false
	);
	const { data: reservationCarData, refetch: reservationCarRefetch } = useFetch(
		`${Endpoints.RESERVATIONS_CAR_URL}/${carId}`,
		{
			method: "get",
		}
	);
	const {
		data: quantityData,
		loading: quantityLoading,
		error: quantityError,
		refetch: quantityRefetch,
	} = useFetch(
		`${Endpoints.CARS_QUANTITY_URL}/${carId}`,
		{
			method: "patch",
		},
		false
	);
	const {
		data: buyCarData,
		loading: buyCarLoading,
		error: buyCarError,
		refetch: buyCarRefetch,
	} = useFetch(
		`${Endpoints.CARS_BUY_URL}/${carId}`,
		{
			method: "patch",
		},
		false
	);
	const {
		data: reservationDeleteData,
		loading: reservationDeleteLoading,
		error: reservationDeleteError,
		refetch: reservationDeleteRefetch,
	} = useFetch(
		`${Endpoints.RESERVATIONS_URL}`,
		{
			method: "delete",
		},
		false
	);

	useEffect(() => {
		// Ελέγχει αν υπάρχει ήδη συνδεδεμένος χρήστης
		if (!token) {
			navigate("/");
		} else {
			const user = JSON.parse(sessionStorage.getItem("user"));
			setUserId(user.afm);
			setIsAgent(user.roles[0] === "AGENCY");
		}
	}, [carId]);

	useEffect(() => {
		if (carData) {
			if (carData.quantity > 0 || isAgent) {
				setCar(carData);
				setQuantity(carData.quantity); // Τρέχουσα ποσότητα
			} else {
				navigate("/dashboard");
			}
		}
	}, [carData, carError]);

	useEffect(() => {
		if (reservationCarData) setTestDriveCars(reservationCarData.length);
	}, [reservationCarData, quantity]);

	useEffect(() => {
		if (quantityData) {
			setQuantity(newQuantity); // Ενημέρωση της τρέχουσας ποσότητας μόνο μετά την επιτυχή αποστολή
			setNewQuantity(0);
		} else if (quantityError) {
			showAlert("Error updating quantity", "error");
		}
	}, [quantityData, quantityError]);

	useEffect(() => {
		if (reservationData) {
			setTestDriveCars((prev) => prev + 1);
			reservationCarRefetch();
		} else if (reservationError) {
			showAlert("Test Drive arrangment failed", "error");
		}
	}, [reservationData, reservationError]);

	useEffect(() => {
		if (reservationDeleteData) {
			setTestDriveCars((prev) => prev - 1);
			reservationCarRefetch();
		} else if (reservationDeleteError) {
			showAlert("Failed to confirm test drive", "error");
		}
		setCustomerTestDrive("");
	}, [reservationDeleteData, reservationDeleteError]);

	useEffect(() => {
		if (!buyCarLoading) {
			if (buyCarData) {
				setQuantity(buyCarData.quantity);
				showAlert("Thank you for your purchase", "success");
			} else if (buyCarError) showAlert("Car buy failed", "error");
		}
	}, [buyCarData, buyCarError]);

	// Ενημέρωση ποσότητας αυτοκινήτων στην βάση
	const handleUpdateQuantity = () => {
		quantityRefetch({
			data: {
				quantity: newQuantity,
			},
		});
	};
	// Λειτουργία Test Drive (παίρνει ΜΟΝΟ ένα αμάξι για test drive)
	const handleTestDrive = () => {
		if (moment().diff(moment(date)) >= 0) {
			showAlert("Pick a day in the future", "info");
			return;
		}
		reservationRefetch({
			data: {
				carId: car?.id,
				citizenId: userId,
				date: date,
				time: time,
			},
		});
		setIsCustomerModalVisible(false);
	};
	const handleTestDriveConfirm = () => {
		reservationDeleteRefetch({}, [customerTestDrive]);
		setIsAgentModalVisible(false);
	};
	// Αγορά αυτοκινήτου (μείωση της ποσότητας κατά 1)
	// Εάν έχει αυτοκίνητο σε test drive, δεν μπορεί να αγοράσει άλλο
	const handleBuyCar = () => {
		buyCarRefetch();
		for (let reservation of reservationCarData) {
			reservationDeleteRefetch({}, [reservation.id]);
		}
		setTestDriveCars(0);
		setCustomerTestDrive("");
	};

	const handleCancel = () => {
		navigate("/dashboard"); // Επιστροφή στο Dashboard (όταν έχει κάτι να επιστρέψει)
	};

	if (
		isAgent == null ||
		carLoading ||
		reservationLoading ||
		quantityLoading ||
		buyCarLoading ||
		reservationDeleteLoading
	)
		return <Loading />;

	// Εδώ προστέθηκε Talwind CSS
	return (
		<div className="flex flex-col md:flex-row gap-4 p-6 bg-gray-100 mx-4 rounded-lg h-full w-10/12">
			{/* Πληροφορίες Αυτοκινήτου */}
			<div className="grid grid-cols-2 grid-rows-5 items-center justify-items-center bg-beige-200 p-4 rounded-lg shadow-md flex-grow">
				<Typography variant="h4" className="col-span-2 justify-self-center">
					{car?.brand} {car?.model}
				</Typography>
				<div className="w-full h-full flex flex-col justify-center items-center">
					<Typography>Fuel Type:</Typography>
					<input
						className="text-center"
						type="text"
						disabled
						value={car?.fuel}
					/>
				</div>
				<div className="w-full h-full flex flex-col justify-center items-center">
					<Typography>Engine (cc):</Typography>
					<input
						className="text-center"
						type="text"
						disabled
						value={car?.engine}
					/>
				</div>
				<div className="w-full h-full flex flex-col justify-center items-center">
					<Typography>Seats:</Typography>
					<input
						className="text-center"
						type="text"
						disabled
						value={car?.seats}
					/>
				</div>
				<div className="w-full h-full flex flex-col justify-center items-center">
					<Typography>Price ($):</Typography>
					<input
						className="text-center"
						type="text"
						disabled
						value={car?.price}
					/>
				</div>
				<div className="w-full h-full flex flex-col justify-center items-center">
					<Typography>Additional Info:</Typography>
					<textarea
						className="text-center"
						type="text"
						disabled
						value={car?.additionalInfo ? car?.additionalInfo : ""}
					/>
				</div>
				<div className="w-full h-full flex flex-col justify-center items-center">
					<Typography>Quantity:</Typography>
					<input
						className="text-center"
						type="text"
						disabled
						value={quantity}
					/>
				</div>
				<Typography className="col-span-2 justify-self-center">
					Test drive reservations: {testDriveCars}
				</Typography>
			</div>

			{/* Κουμπιά */}
			<div className="flex flex-col gap-4 bg-white p-4 rounded-lg shadow-md">
				{isAgent ? (
					<div className="flex flex-col justify-center">
						<h2 className="text-xl text-center font-semibold mb-2">
							Update Quantity
						</h2>
						<Input
							sx={{
								mb: 2,
							}}
							type="number"
							value={newQuantity}
							onChange={(e) => setNewQuantity(Number(e.target.value))}
							inputProps={{
								...InputProps.QUANTITY_PROPS,
								style: { textAlign: "center" },
							}}
						/>
						<button
							onClick={handleUpdateQuantity}
							className="bg-green-500 text-white px-4 py-2 rounded-md mt-2 w-full"
						>
							OK
						</button>
					</div>
				) : (
					<div className="flex gap-4 h-12">
						<button
							onClick={handleBuyCar}
							className="w-24 bg-green-500 text-white px-4 py-2 rounded-md"
						>
							Buy
						</button>
						<button
							onClick={() => {
								setIsCustomerModalVisible(true);
							}}
							className="text-nowrap w-24 bg-yellow-500 text-white px-4 py-2 rounded-md"
						>
							Test Drive
						</button>
					</div>
				)}

				{/* Εμφάνιση του κουμπιού Car Return μόνο αν δεν είναι agent */}
				{isAgent && (
					<button
						onClick={() => {
							setIsAgentModalVisible(true);
						}}
						className="bg-red-500 text-white px-4 py-2 rounded-md"
					>
						Test Drive Return
					</button>
				)}

				<button
					onClick={handleCancel}
					className="bg-blue-500 text-white px-4 py-2 rounded-md"
				>
					Back
				</button>
			</div>
			<Modal
				open={isCustomerModalVisible}
				onClose={() => setIsCustomerModalVisible(false)}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<Typography
						id="modal-modal-title"
						variant="h6"
						component="h2"
						sx={{ alignSelf: "center" }}
					>
						Test Drive {`${car?.brand} ${car?.model}`}
					</Typography>
					<Typography
						id="modal-modal-description"
						sx={{ mt: 2, alignSelf: "center" }}
					>
						Set time and date for the test drive
					</Typography>
					<input
						className="w-1/2 text-center self-center m-2 border-2 rounded-xl p-2"
						type="date"
						onChange={(e) => {
							setDate(moment(new Date(e.target.value)).format("YYYY-MM-DD"));
						}}
					/>
					<input
						className="w-1/2 text-center self-center m-2 border-2 rounded-xl p-2"
						type="time"
						onChange={(e) => {
							setTime(`${e.target.value}:00`);
						}}
					/>
					<Button
						sx={{ width: "50%", alignSelf: "center", mt: 2 }}
						variant="contained"
						onClick={handleTestDrive}
					>
						Book
					</Button>
				</Box>
			</Modal>
			<Modal
				open={isAgentModalVisible}
				onClose={() => setIsAgentModalVisible(false)}
				aria-labelledby="modal-modal-title"
				aria-describedby="modal-modal-description"
			>
				<Box sx={style}>
					<Typography
						id="modal-modal-title"
						variant="h6"
						component="h2"
						sx={{ alignSelf: "center" }}
					>
						Test Drive {`${car?.brand} ${car?.model}`}
					</Typography>
					<Typography
						id="modal-modal-description"
						sx={{ mt: 2, alignSelf: "center" }}
					>
						Provide customer AFM and date of Test Drive
					</Typography>
					{reservationCarData && (
						<select
							className="w-full h-10 mx-2 my-4"
							value={customerTestDrive}
							onChange={(event) => setCustomerTestDrive(event.target.value)}
						>
							<option value="" disabled>
								Select test drive
							</option>
							{reservationCarData.map((reservation) => (
								<option
									key={reservation.id}
									value={reservation.id}
								>{`${reservation.date} | ${reservation.time} | ${reservation.citizen.afm} | ${reservation.citizen.email}`}</option>
							))}
						</select>
					)}
					<Button
						sx={{ width: "50%", alignSelf: "center", mt: 2 }}
						variant="contained"
						onClick={handleTestDriveConfirm}
					>
						Confirm
					</Button>
				</Box>
			</Modal>
		</div>
	);
};

export default CarPage;
