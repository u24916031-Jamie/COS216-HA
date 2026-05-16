/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/

import { Server } from "socket.io";
import { dispatchFlight } from "./dispatchFlight.js";
import { notifyNoShow } from "./notifyNoShow.js";
import { confirmBoarding } from "./confirmBoarding.js";
import { updateFlightPosition } from "./updateFlightPosition.js";
import { getFlight } from "./getFlight.js";
import { getCoordinates } from "./getCoordinates.js";

//random change


export async function startSocketServer(port) {

	const io = new Server(port, { /* options */ });
	const passengerMap = new Map(); // all passengers
	const ATC = {} // all ATCs
	const boardingCallSet = new Set(); // flightid to isBoarding
	const userTrackingMap = new Map(); // username to set of handles for emitting POSITION;


	io.on("connection", (socket) => {
		socket.on("INIT", (type, username, api_key) => {
			socket.data.type = type;
			socket.data.username = username;
			socket.data.api_key = api_key;
			if (type == "passenger") {
				passengerMap.set(username, socket);
			} else if (type == "ATC") {
				ATC = { username: username, socket: socket };
			}
			else {
				//INVALID TYPE;
			}
		})

		socket.on("DISPATCH", async (flightid) => {
			if (socket.data.type != "ATC") {
				return;
			}


			await dispatchFlight(flightid, socket.data.api_key);

			const flightInfo = (await getFlight(flightid, socket.data.api_key)).data;
			const coordinates = (await getCoordinates(flightid, socket.data.api_key)).data;



			for (const passenger of flightInfo.passengers) {
				passengerMap.get(passenger.username).emit("BOARDING_CALL", flightid);
			}

			boardingCallSet.add(flightid);
			setTimeout(() => {
				boardingCallSet.delete(flightid);
				let progress = 0.0;
				let current_latitude = coordinates.origin.latitude;
				let current_longitude = coordinates.origin.longitude;
				const handle = setInterval(() => {
					if (progress > 1.0) {
						clearInterval(handle);
						updateFlightPosition(flightid, coordinates.destination.latitude, coordinates.destination.longitude, "Landed");
						return;
					}
					progress = (Date.now() - startTime) / (parseFloat(flightInfo.flight_duration_hours) * 1000);
					current_latitude = coordinates.origin.latitude + progress * (coordinates.destination.latitude - coordinates.origin.latitude);
					current_longitude = coordinates.origin.longitude + progress * (coordinates.destination.longitude - coordinates.origin.longitude);

					updateFlightPosition(flightid, current_latitude, current_longitude, "In Flight");
				}, 1.0 / 30.0);
			}, 60);




		})
		socket.on("BOARD", async (flightid) => {
			if (boardingCallSet.has(flightid)) {
				await confirmBoarding(flightid, socket.data.api_key);
			}
			else {
				await notifyNoShow(ATC, flightid, socket.data.username);

			}

		})

		socket.on("TRACK", async (flightid) => {
			const res = await getFlight(flightid, socket.data.api_key)
			if (!res) {
				//return error if passenger tries to track another flight
				return;
			}
			if (!(userTrackingMap.get(socket.data.username))) {
				userTrackingMap.set(socket.data.username, new Set());
			}
			const handles = userTrackingMap.get(socket.data.username);


			const handle = setInterval(() => {
				// gives status to stop when plane has landed
				let flightData = getFlight(flightid, socket.data.api_key);
				socket.emit("POSITION", flightData.data.current_latitude, flightData.data.current_longitude, flightData.data.status);
				if (flightData.status == "Landed") {
					clearInterval(handle);
					handles.delete(handle);
				}

			}, 1.0 / 30.0);

			handles.add(handle)
		});

		socket.on('disconnect', async (reason) => {
			const handles = userTrackingMap.get(socket.data.username);
			if (handles) {
				for (const handle of handles) {
					clearInterval(handle);
				}
			}
			if (socket.data.type == "passenger") {
				passengerMap.delete(socket.data.username);
			} else if (socket.data.type == "ATC") {
				for (const [username, socket] of passengerMap) {
					socket.emit("ATCDISCONNECT");
				}
				ATC = {};
			}
		});
	});


	return io;

}