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

const flightPositionMap = new Map();

export async function startSocketServer(port) {

	const io = new Server(port, { /* options */ });
	const passengerMap = new Map();
	const flightMap = new Map();
	const boardingCallMap = new Map();
	const flightTrackingMap = new Map();
	const ATCMap = new Map();



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
			const flightinfo = dispatchFlight(flightid);
			if (flightinfo.status = "error") {

				//fail
				return;
			}


			for (const [username, passengersocket] of passengerMap) {
				passengersocket.emit("BOARDING_CALL");
			}

			boardingCallMap.set(flightid, true);
			setTimeout(() => {
				boardingCallMap.set(flightid, false);
			}, 60);

			flightPositionMap.set(flightid, 0);
			const startTime = Date.now();
			const handle = setInterval(() => {
				if (flightPositionMap.get(flightid) > 1.0) {
					clearInterval(handle);
					return;
				}
				const progress = (Date.now() - startTime) / (flightinfo.length * 1000);
				updateFlightPosition(flightid, progress);

				flightPositionMap.set(flightid, progress)
			}, 1.0 / 30.0);


		})
		socket.on("BOARD", (flightid) => {
			if (!BoardFlight(socket.data.username, flightid)) {

				//fail
				return;
			}
			if (!(boardingCallMap.get(flightid))) {
				notifyNoShow(socket.data.username, flightid);
			}
			else {
				confirmBoarding(socket.data.username, flightid);
			}



		})
		socket.on("TRACK", (flightid) => {
			if (!allowedToTrack(socket.data.username, flightid)) {
				//return error if passenger tries to track another flight
				return;
			}

			const handle = setInterval(() => {
				if (flightPositionMap.get(flightid) > 1.0) {
					clearInterval(handle);
					return;
				}
				flightPositionMap.set(flightid, (Date.now() - startTime) / (flightinfo.length * 1000))
			}, 1.0 / 30.0);
			flightTrackingMap.set(socket.data.username, flightid);
		});

		socket.on('disconnect', (reason) => {

			if (socket.data.type == "passenger") {

			} else if (socket.data.type == "ATC") {

			}
		});
	});
	return io;
}