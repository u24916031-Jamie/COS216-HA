/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/



export async function getFlightAirports(flightid) {
	console.log(`Fetching flight data for flight with id: ${flightid}`);

	const unencoded = `${process.env.STUNUM}:${process.env.PASSWORD}`
	const encoded = btoa(unencoded);
	const data = {
		flight_id: flightid,
		api_key: "cgfxwKhUpmzQL1wSWtcM0KJ4FCpeBalf",
		type: "GetFlight"
	};
	try {

		const res = await fetch("https://wheatley.cs.up.ac.za/u24916031/COS216HA/api/api.php", {
			method: "POST",
			headers: {
				"Authorization": `Basic ${encoded}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify(data)
		});
		console.log(res)
		const json = await res.json();
		console.log(json);
		return json;
	}
	catch (err) {
		console.error("Network Error:", err)
	}
	return undefined;
}