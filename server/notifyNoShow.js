/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/


export async function notifyNoShow(ATC, flightid, username) {
	ATC.socket.emit("NOSHOW", flightid, username);
}
