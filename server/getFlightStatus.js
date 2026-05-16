
/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/
import { getFlight } from './getFlight.js';



export async function getFlightStatus(flightid) {
	console.log(`Fetching flight data for flight with id: ${flightid}`);

	const flightData = await getFlight(flightid);
	console.log(flightData.data.passengers);
	console.log(`Flight number: ${flightData.data.flight.flight_number}`);
	console.log(`Current coordinates (lat, lon): (${flightData.data.flight.current_latitude},${flightData.data.flight.current_longitude})`);
	console.log(`Flight number: ${flightData.data.flight.flight_number}`);
	console.log(`Flight number: ${flightData.data.flight.flight_number}`);
}