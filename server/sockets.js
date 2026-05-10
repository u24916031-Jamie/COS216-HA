/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/

import { Server } from "socket.io";
import { DispatchFlight } from "./api.js";

export async function startSocketServer(port, passengerMap, ATCMap) {

	const io = new Server(port, { /* options */ });
	const flightMap = new Map();

	io.on("connection", (socket) => {
		socket.on("INIT", ({ type, username }) => {
			socket.data.type = type;
			socket.data.username = username;
			if (type == "passenger") {
				passengerMap.set(username, socket);
			} else if (type == "ATC") {
				ATCMap.set(username, socket);
			}
			else {
				//INVALID TYPE;
			}
		})

		socket.on("DISPATCH", (flightid) => {
			const flightinfo = DispatchFlight(flightid);
			if (flightinfo.status = "error") {

				//fail
				return;
			}




			const passengers = GetPassengers(flightid);
			for (let i = 0; i < passengers.length; i++) {
				passengerMap.get(passengers[i]).emit("BOARDING_CALL");
			}

		})
		socket.on("BOARD", (flightid) => {
			if (!BoardFlight(socket.data.username, flightid)) {

				//fail
				return;
			}
			const passengers = GetPassengers(flightid);
			for (let i = 0; i < passengers.length; i++) {
				socketMap.get(passengers[i]).emit("BOARDING_CALL");
			}

		})
		socket.on("TRACK", () => {
			socket.data.type = type;
			socket.data.username = username;
			socketMap.set(username, socket);
		})
	});

}