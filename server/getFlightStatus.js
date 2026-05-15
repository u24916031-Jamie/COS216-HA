/*
Jamie King
u24916031
Tamlyn Khan
u24675815
Isabella Engelbrecht
u25090501
*/
import { XMLHttpRequest } from "xmlhttprequest";

export function getFlightStatus(flightID) {
	console.log(`Flight with id: ${flightID}`);
	var req = new XMLHttpRequest();
	req.onreadystatechange = function () {

		if (this.readyState == 4) {
			console.log(this.responseText);
			var response = JSON.parse(this.responseText);
			console.log(response);
		} else if (this.readyState == 4) {
			console.log(this.responseText);
		}
	};

	req.open("POST", "wheatley.cs.up.ac.za/u24916031/COS216HA/api/api.php", true);
	var data = {
		flight_id: flightID,
		api_key: "cgfxwKhUpmzQL1wSWtcM0KJ4FCpeBalf",
		type: "GetFlight"
	};
	req.send(JSON.stringify(data));



}
