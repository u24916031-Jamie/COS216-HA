
/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/
import { getFlight } from './getFlight.js';
import { getCoordinates } from './getCoordinates.js'


export async function getFlightStatus(flightid) {

	const res = await getFlight(flightid, process.env.SERVERAPIKEY);

	const flightData = res.data.flight;
	const passengers = res.data.passengers;

	let totalBooked = 0;
	let totalConfirmed = 0;
	for (const passenger of passengers) {
		if (passenger.boarding_confirmed == 1) {
			totalConfirmed++;
		}
		totalBooked++;
	}

	const airports = (await getCoordinates(flightid, process.env.SERVERAPIKEY)).data;
	const current = flightData.current_latitude;
	const start = airports.origin.latitude;
	const end = airports.destination.latitude;

	const progress = (current - start) / (end - start);
	const timeRemaining = (1 - progress) * parseFloat(flightData.flight_duration_hours);

	console.log(`Flight number: ${flightData.flight_number}`);
	console.log(`Current coordinates (lat, lon): (${flightData.current_latitude},${flightData.current_longitude})`);
	console.log(`Number of confirmed bookings: ${totalConfirmed}`);
	console.log(`Number of total bookings: ${totalBooked}`);
	console.log(`Estimated time remaining: ${timeRemaining} hours`);
}