import "./App.css";
import React, { useState } from "react";
import {
	BrowserRouter as Router,
	Route,
	Routes,
	Navigate,
} from "react-router-dom";
import LoginPage from "./Components/LoginPage";
import RegisterPage from "./Components/RegisterPage";
import DashboardPage from "./Components/DashboardPage";
import CarPage from "./Components/CarPage";

function App() {
	// Ορίζουμε το state για τον χρήστη και τον ρόλο του (πολίτης ή αντιπρόσωπος)
	const [user, setUser] = useState(null);
	return (
		<Router>
			<Routes>
				<Route path="*" element={<Navigate to="/" />} />
				<Route path="/" element={<Navigate to="/login" />} />
				<Route
					path="/login"
					element={<LoginPage setUser={setUser} />}
				/>
				<Route
					path="/register"
					element={<RegisterPage setUser={setUser} />}
				/>
				<Route
					path="/dashboard"
					element={<DashboardPage />}
				/>
				<Route path="/car/:carId" element={<CarPage />} />
			</Routes>
		</Router>
	);
}

export default App;
