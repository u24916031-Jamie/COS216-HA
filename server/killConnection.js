/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/


export async function killConnection(io, username) {
	console.log(`Killing connection with username: ${username}`);

	for (const socket of await io.sockets()) {
		if (socket.data.username == username) {
			socket.emit("KILLED");
			socket.disconnect(true);
		}
	}

}
