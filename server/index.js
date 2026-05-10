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

import { getFlightStatus } from './flightStatus.js';
import { killConnection } from './killConnection.js';
import { startSocketServer } from './sockets.js';

async function CLI() {
	const args = process.argv.slice(2);
	const port = parseInt(args[0]);
	if (port < 1024 || port > 49151) {
		console.error(`Port must be in the range 1024-49151.\nExiting.`);
		return;
	}
	const passengerMap = new Map();
	const ATCMap = new Map();
	startSocketServer(port, passengerMap, ATCMap);
	console.log(`Started socket server on port: ${port}`);
	const rl = readline.createInterface({ input, output });

	console.log("Type 'QUIT' to quit.");

	while (true) {
		const command = await rl.question('>>> ');
		if (command.trim() == "") {
			continue;
		}

		if (command.trim().startsWith("FLIGHT_STATUS")) {
			console.log("flight status");
			getFlightStatus(parseInt(command.trim().split(" ")[1]));

		}
		else if (command.trim().startsWith("KILL")) {
			console.log("kill");
			killConnection(command.trim().split(" ")[1]);
		}
		else if (command.trim() == "QUIT") {
			break;
		}
		else if (command.trim().toLowerCase() == "help") {
			console.log()
		}
		else {
			console.log(`Entered command "${command}" not recognised`);
		}

	}

	rl.close();
}




CLI();




