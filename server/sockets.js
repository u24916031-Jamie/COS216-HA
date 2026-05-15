/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/

import { Server } from "socket.io";
import { getPassengers } from "./getPassengers.js";
import { dispatchFlight } from "./dispatchFlight.js";
import { notifyNoShow } from "./notifyNoShow.js";
import { confirmBoarding } from "./confirmBoarding.js";
import { updateFlightPosition } from "./updateFlightPosition.js";
import { getFlight } from "./getFlight.js";

export async function startSocketServer(port) {

	const io = new Server(port, { /* options */ });
	const passengerMap = new Map(); // all passengers
	const ATCMap = new Map(); // all ATCs
	const boardingCallSet = new Set(); // flightid to isBoarding
	const userTrackingMap = new Map(); // username to handle for emitting POSITION;


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
			if (socket.data.type != "ATC") {
				return;
			}


			const dispatchResult = dispatchFlight(socket.data.username, flightid);
			if (dispatchResult.status == 400) {

				//fail
				return;
			}
			const flightInfo = getFlight(socket.data.username, flightid);
			updateFlightPosition(flightid, flightInfo.origin_latitude, flightInfo.origin_longitude, "Boarding")
			for (const username of flightInfo.passengerList) {
				passengerMap.get(username).emit("BOARDING_CALL");
			}

			boardingCallSet.add(flightid);
			setTimeout(() => {
				boardingCallSet.delete(flightid);
				let progress = 0.0;
				let current_latitude = flightInfo.origin_latitude;
				let current_longitude = flightInfo.origin_longitude;
				const handle = setInterval(() => {
					if (progress > 1.0) {
						clearInterval(handle);
						updateFlightPosition(flightid, flightInfo.destination_latitude, flightInfo.destination_longitude, "Landed");
						return;
					}
					progress = (Date.now() - startTime) / (flightinfo.length * 1000);
					current_latitude = flightInfo.origin_latitude + progress * (flightInfo.destination_latitude - flightInfo.origin_latitude);
					current_longitude = flightInfo.origin_longitude + progress * (flightInfo.destination_longitude - flightInfo.origin_longitude);

					updateFlightPosition(flightid, current_latitude, current_longitude, "In Flight");
				}, 1.0 / 30.0);
			}, 60);




		})
		socket.on("BOARD", (flightid) => {
			if (!BoardFlight(socket.data.username, flightid)) {

				//fail
				return;
			}
			if (!(boardingCallSet.has(flightid))) {
				notifyNoShow(socket.data.username, flightid);
			}

		})

		socket.on("TRACK", (flightid) => {
			if (!(getFlight(socket.data.username, flightid))) {
				//return error if passenger tries to track another flight
				return;
			}



			const handle = setInterval(() => {
				// gives status to stop when plane has landed
				let flightData = getFlight(socket.data.username, flightid);
				socket.emit("POSITION", flightData.current_latitude, flightData.current_longitude, flightData.status);
				if (flightData.status == "Landed") {
					clearInterval(handle);
				}

			}, 1.0 / 30.0);

			let handles = userTrackingMap.get(socket.data.username);
			if (handles == undefined) {
				handles = [handle];
			} else {
				handles = [...handles, handle];
			}
			userTrackingMap.set(socket.data.username, handles);
		});

		socket.on('disconnect', (reason) => {
			const handles = userTrackingMap.get(socket.data.username);
			if (handles != undefined) {
				for (const handle of handles) {
					clearInterval(handle);
				}
			}
			if (socket.data.type == "passenger") {

			} else if (socket.data.type == "ATC") {

			}
		});
	});

}