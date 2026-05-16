/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { killConnection } from './killConnection.js';
import { startSocketServer } from './sockets.js';
import { getFlightStatus } from './getFlightStatus.js';

async function CLI() {
	const args = process.argv.slice(2);
	const port = parseInt(args[0]);
	if (port < 1024 || port > 49151) {
		console.error(`Port must be in the range 1024-49151.\nExiting.`);
		return;
	}
	const passengerMap = new Map();
	const ATCMap = new Map();
	const io = await startSocketServer(port, passengerMap, ATCMap);
	console.log(`Started socket server on port: ${port}`);
	const rl = readline.createInterface({ input, output });

	console.log("Type 'QUIT' to quit.");

	while (true) {
		const command = await rl.question('>>> ');
		if (command.trim() == "") {
			continue;
		}

		if (command.trim().startsWith("FLIGHT_STATUS")) {
			const flightid = parseInt(command.trim().split(" ")[1]);
			await getFlightStatus(flightid);

		}
		else if (command.trim().startsWith("KILL")) {
			console.log("kill");
			const username = command.trim().split(" ")[1];
			await killConnection(io, username);

		}
		else if (command.trim() == "QUIT") {
			io.emit("QUIT");
			io.close();
			break;
		}
		else if (command.trim().toLowerCase() == "help") {
			console.log("Valid commands:")
			console.log("FLIGHT_STATUS <flightid>")
			console.log("KILL <username>")
			console.log("QUIT");
		}
		else {
			console.log(`Entered command "${command}" not recognised`);
		}

	}
	console.log("here");
	rl.close();
	console.log("here2");
	io.close();
}




CLI();




