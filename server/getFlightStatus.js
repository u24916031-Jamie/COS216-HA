
/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/
import { getFlight } from './getFlight.js';
import { getFlightAirports } from './getFlightAirports.js';



export async function getFlightStatus(flightid) {
	console.log(`Fetching flight data for flight with id: ${flightid}`);

	const res = await getFlight(flightid);
	const flightData = res.data.flight;
	const passengers = flightData.data.passengers;
	let bookedCount = 0;
	let confirmedCount = 0;

	for (const passenger of passenger) {
		if (passenger.boarding_confirmed == 1) {
			confirmedCount++;
		}
		bookedCount++;
	}

	const airports = getFlightAirports(flightid);

	const current = flightData.current_latitude;
	const start = airports.origin.latitude;
	const end = airports.destination.latitude;



	const progress = (current - start) / (end - start);
	const flightHours = parseFloat(flightData.flight_duration_hours);

	const remainingTime = (1 - progress) * flightHours;

	console.log(`Flight number: ${flightData.flight_number}`);
	console.log(`Current coordinates (lat, lon): (${flightData.current_latitude},${flightData.current_longitude})`);
	console.log(`Number of confirmed bookings: ${confirmedCount}`);
	console.log(`Number of total bookings: ${bookedCount}`);
	console.log(`Estimated time until landing: ${remainingTime} hours`);
}