import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';

async function CLI() {
	const args = process.argv.slice(2);
	const port = parseInt(args[0]);
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
		}
		else if (command.trim().startsWith("KILL")) {
			console.log("kill");
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




