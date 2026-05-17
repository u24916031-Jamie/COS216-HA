/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/



export async function getFlight(flightid, api_key) {

	const unencoded = `${process.env.STUNUM}:${process.env.PASSWORD}`
	const encoded = btoa(unencoded);
	const data = {
		flight_id: flightid,
		api_key: api_key,
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
		return json;
	}
	catch (err) {
		console.error("Network Error:", err)
	}
	return undefined;
}