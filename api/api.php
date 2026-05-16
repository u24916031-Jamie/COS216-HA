

<?php

header("Content-Type: application/json");

include("./config.php");



//random strings for api and salting
function generateRandomString($length = 32)
{
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $result = '';
    for ($i = 0; $i < $length; $i++) {
        $result .= $characters[random_int(0, strlen($characters) - 1)];
    }
    return $result;
}

//each endpoint has to validate key so function...
function validateApiKey($db, $apikey)
{
    //test to see if valid key is in db
    $sql = $db->prepare("SELECT id,type FROM Users WHERE api_key = ?");

    $sql->bind_param("s", $apikey);

    $sql->execute();

    $result = $sql->get_result();

    //no rows so invalid
    if ($result->num_rows === 0) {
    http_response_code(401); 
        echo json_encode([
            "status" => "error",
            "message" => "Invalid API key"
        ]);

        exit;
    }

    //returns valid key
    return $result->fetch_assoc();
}

//singleton
class Database
{
    public $conn;
    public static function instance()
    {
        static $instance = null;
        if ($instance === null) {
            $instance = new Database();
        }
        return $instance;
    }

    private function __construct()
    {
        global $conn;
        $this->conn = $conn;
    }
}

$db = Database::instance()->conn;

//get input to run tests then perform queries
$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput, true);

if (!$data || !isset($data["type"])) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid request"
    ]);
    exit;
}

$type = $data["type"];

if ($type === "Register") {

    $required = ["username", "email", "password", "user_type"];

    foreach ($required as $field) {

        if (
            !isset($data[$field]) || trim($data[$field]) === ""
        ) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Missing parameters"
            ]);

            exit;
        }
    }

    $username = trim($data["username"]);
    $email = trim($data["email"]);
    $password = $data["password"];
    $user_type = trim($data["user_type"]);

    $allowedTypes = ["Passenger", "ATC"];  //array for types, if input type not in this array then invalid

    if (!in_array($user_type, $allowedTypes)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid user type"
        ]);

        exit;
    }

    $emailRegex = "/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/";

    if (!preg_match($emailRegex, $email)) { //checks if input email matches regex 
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid email format"
        ]);

        exit;
    }

    $passwordRegex = "/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/";

    if (!preg_match($passwordRegex, $password)) {   //checks if input password matches regex
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Weak password"
        ]);

        exit;
    }

    //test to see if the email is already in use
    $sql = $db->prepare("SELECT id FROM Users WHERE email = ?");

    $sql->bind_param("s", $email);
    $sql->execute();

    $result = $sql->get_result();

    if ($result->num_rows > 0) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Email already exists"
        ]);

        exit;
    }

    $salt = generateRandomString(16);

    $hashedPassword = hash("sha256", $password . $salt);

    $api_key = generateRandomString(64);

    //all checks passed so insert new user
    $sql = $db->prepare("
        INSERT INTO Users
        (username, password, salt, email, type, api_key) VALUES (?, ?, ?, ?, ?, ?)");

    $sql->bind_param(
        "ssssss",
        $username,
        $hashedPassword,
        $salt,
        $email,
        $user_type,
        $api_key
    );

    if (!$sql->execute()) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Database error",
            "debug" => $sql->error
        ]);
        exit;
    }
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "timestamp" => time(),
        "data" => [
            "apikey" => $api_key
        ]
    ]);

    exit;
}

if ($type === "Login") {

    if (!isset($data["email"]) || !isset($data["password"])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing parameters"
        ]);

        exit;
    }

    $email = trim($data["email"]);
    $password = $data["password"];

    $sql = $db->prepare("SELECT id, username, password, salt, email, type, api_key FROM Users 
    WHERE email = ?");

    $sql->bind_param("s", $email);

    $sql->execute();

    $result = $sql->get_result();

    //couldnt find email so return error
    if ($result->num_rows === 0) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid email or password"
        ]);

        exit;
    }

    $user = $result->fetch_assoc();

    $hashedInput = hash("sha256", $password . $user["salt"]);

    /*
    test to see if password is correct
    takes input password then adds the salt from the database then hash it using the same hashing algorithm then checks if the newly hashed password matches the hashed password in the database
    */
    if ($hashedInput !== $user["password"]) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid email or password"
        ]);
        exit;
    }
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "timestamp" => time(),
        "data" => [
            [
                "id" => $user["id"],
                "username" => $user["username"],
                "email" => $user["email"],
                "type" => $user["type"],
                "apikey" => $user["api_key"]
            ]
        ]
    ]);
    exit;
}

if ($type === "GetAllFlights") {

    //check if key is empty or valid, if valid $user get row from result
    if (!isset($data["api_key"]) || empty($data["api_key"])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing API key"
        ]);
        exit;
    }

    $user = validateApiKey($db, $data["api_key"]);

    if ($user["type"] === "ATC") {

        //gets all flights with status and GPS coordinates 
        $sql = $db->prepare("SELECT id, status, current_latitude, current_longitude FROM Flights;");

        $sql->execute();

        $result = $sql->get_result();

        $flights = [];

        //from result we append the array row by row
        while ($row = $result->fetch_assoc()) {
            array_push($flights, $row);
        }
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "user type" => "ATC",
            "data" => $flights
        ]);

        exit;
    }


    if ($user["type"] === "Passenger") {

        /*gets info from Flights, Passenger_Flights and Airports and displays them but only where the passenger_id(foreign key in Passenger_Flights) matches the id from the input */
        $sql = $db->prepare("
        SELECT
        Flights.id,
        Flights.flight_number,
        Flights.departure_time,
        Flights.flight_duration_hours,
        Flights.status,

        Passenger_Flights.seat_number,
        Passenger_Flights.boarding_confirmed,
        Passenger_Flights.confirmed_at,

        origin.name AS origin_airport,
        destination.name AS destination_airport

        FROM Passenger_Flights JOIN Flights ON Passenger_Flights.flight_id = Flights.id

        JOIN Airports AS origin ON Flights.origin_airport_id = origin.id
        JOIN Airports AS destination ON Flights.destination_airport_id = destination.id

        WHERE Passenger_Flights.passenger_id = ?;");

        $sql->bind_param("i", $user["id"]);

        $sql->execute();

        $result = $sql->get_result();

        $flights = [];

        //from result we append the array row by row
        while ($row = $result->fetch_assoc()) {
            array_push($flights, $row);
        }
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "user type" => "Passenger",
            "data" => $flights
        ]);

        exit;
    }
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Invalid user type"
    ]);

    exit;
}

if ($type === "GetFlight") {

    if (!isset($data["flight_id"])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing flight id"
        ]);
        exit;
    }

    $flight_id = (int)$data["flight_id"];

    //check if key is empty or invalid
    if (!isset($data["api_key"]) || empty($data["api_key"])) {
		http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing API key"
        ]);
        exit;
    }

    $user = validateApiKey($db, $data["api_key"]);

    $user_id = $user["id"];
    $user_type = $user["type"];

    if ($user_type === "Passenger") {

        //gets all flight details for specific flight ONLY if they are on it meaning id should be there
        $sql = $db->prepare("
            SELECT
            Flights.*
            FROM Flights
            JOIN Passenger_Flights ON Passenger_Flights.flight_id = Flights.id
            WHERE Flights.id = ? AND Passenger_Flights.passenger_id = ?
        ");

        $sql->bind_param("ii", $flight_id, $user_id);
    } else if ($user_type === "ATC") {

        /*gets all flights info, get id and username for passengers, left join since there could be flights with no passengers*/
        $sql = $db->prepare("
            SELECT
            Flights.*, Users.id AS passenger_id, Users.username, Passenger_Flights.boarding_confirmed
            FROM Flights
            LEFT JOIN Passenger_Flights ON Passenger_Flights.flight_id = Flights.id
            LEFT JOIN Users ON Users.id = Passenger_Flights.passenger_id
            WHERE Flights.id = ?");

        $sql->bind_param("i", $flight_id);
    }

    $sql->execute();
    $result = $sql->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Flight not found"
        ]);
        exit;
    }

    $flight = null;
    $passengers = [];

    //one by one append the flight array and passenger array
    while ($row = $result->fetch_assoc()) {

        if ($flight === null) {
            $flight = [
                "id" => $row["id"],
                "flight_number" => $row["flight_number"],
                "departure_time" => $row["departure_time"],
                "flight_duration_hours" => $row["flight_duration_hours"],
                "status" => $row["status"],
                "current_latitude" => $row["current_latitude"],
                "current_longitude" => $row["current_longitude"],
                "dispatched_at" => $row["dispatched_at"]
            ];
        }
        if (!empty($row["passenger_id"])) {
            $passengers[] = [
                "id" => $row["passenger_id"],
                "username" => $row["username"],
				"boarding_confirmed" => $row["boarding_confirmed"]
            ];
        }
    }
    //show the arrays in the response but passengers dont get passenger list
    if ($user_type === "Passenger") {
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "data" => [
                "flight" => $flight
            ]
        ]);
        exit;
    } else if ($user_type === "ATC") {
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "data" => [
                "flight" => $flight,
                "passengers" => $passengers
            ]
        ]);
        exit;
    }

    exit;
}

if ($type === "DispatchFlight") {

    $flight_id = (int)$data["flight_id"];

    if (!isset($data["api_key"]) || empty($data["api_key"])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing API key"
        ]);
        exit;
    }

    $user = validateApiKey($db, $data["api_key"]);

    if ($user["type"] !== "ATC") {
        http_response_code(403);
        echo json_encode([
            "status" => "error",
            "message" => "Only ATC can dispatch flights"
        ]);
        exit;
    }

    //check flight id 
    if (!isset($data["flight_id"])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing flight id"
        ]);
        exit;
    }

    $checkSql = $db->prepare("SELECT status FROM Flights WHERE id = ?");
    $checkSql->bind_param("i", $flight_id);
    $checkSql->execute();
    $result = $checkSql->get_result();

    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Flight not found"
        ]);
        exit;
    }

    $flight = $result->fetch_assoc();


    if ($flight["status"] !== "Scheduled") {
        //well..flight isnt in Scheduled so send status code 400
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Flight is not in Scheduled state",
            "response code" => 400
        ]);
        exit;
    }

    //Scheduled state so update to Boarding
    $updateSql = $db->prepare("
        UPDATE Flights
        SET status = 'Boarding',
            dispatched_at = NOW()
        WHERE id = ?
    ");

    $updateSql->bind_param("i", $flight_id);

    if (!$updateSql->execute()) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Failed to dispatch flight"
        ]);
        exit;
    }
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Flight dispatched",
        "data" => [
            "flight_id" => $flight_id,
            "status" => "Boarding",
            "dispatched_at" => date("Y-m-d H:i:s") //timestamp? so maybe time()? but surely not
        ]
    ]);

    exit;
}

if ($type === "UpdateFlightPosition") {

    $SERVER_API_KEY = $_ENV["SERVER_API_KEY"];

    if (
        !isset($data["api_key"]) ||
        $data["api_key"] !== $SERVER_API_KEY
    ) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Unauthorized"
        ]);

        exit;
    }

    //all required fields in array if field not in array then input is invalid
    $required = ["flight_id", "current_latitude", "current_longitude", "status"];

    foreach ($required as $field) {

        if (!isset($data[$field]) || empty($data[$field])) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "message" => "Missing parameter: $field"
            ]);

            exit;
        }
    }

    $flight_id = (int)$data["flight_id"];

    $current_latitude = $data["current_latitude"];

    $current_longitude = $data["current_longitude"];

    $status = trim($data["status"]);

    //same thing here, everything allowed is put in an array, if its not in the array then invalid
    $allowedStatuses = ["Boarding", "In Flight", "Landed"];

    if (!in_array($status, $allowedStatuses)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid flight status"
        ]);

        exit;
    }

    $checkSql = $db->prepare("SELECT id FROM Flights WHERE id = ? ");

    $checkSql->bind_param("i", $flight_id);

    $checkSql->execute();

    $checkResult = $checkSql->get_result();

    if ($checkResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Flight not found"
        ]);

        exit;
    }

    //takes input latitude,longitude,status and updates db
    $updateSql = $db->prepare("
        UPDATE Flights SET current_latitude = ?, current_longitude = ?, status = ? WHERE id = ?");

    $updateSql->bind_param(
        "ddsi",
        $current_latitude,
        $current_longitude,
        $status,
        $flight_id
    );

    if (!$updateSql->execute()) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Could not update flight position"
        ]);

        exit;
    }
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Flight position updated",
        "data" => [
            "flight_id" => $flight_id,
            "current_latitude" => $current_latitude,
            "current_longitude" => $current_longitude,
            "status" => $status
        ]
    ]);

    exit;
}

if ($type === "GetAirports") {

    if (!isset($data["api_key"]) || empty($data["api_key"])) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Missing API key"
        ]);
        exit;
    }

    $user = validateApiKey($db, $data["api_key"]);

    $sql = $db->prepare("SELECT * FROM Airports ORDER BY id ASC");

    $sql->execute();

    $result = $sql->get_result();

    $airports = [];

    //each row from result gets appended one by one
    while ($row = $result->fetch_assoc()) {
        array_push($airports, $row);
    }
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => $airports
    ]);

    exit;
}

if ($type === "BoardFlight") {

    if (!isset($data["flight_id"])) {
        echo json_encode([
            "status" => "error",
            "message" => "Missing flight id"
        ]);
        exit;
    }

    //checks if key is empty or invalid
    if (!isset($data["api_key"]) || empty($data["api_key"])) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Missing API key"
        ]);
        exit;
    }

    $flight_id = (int)$data["flight_id"];

    $user = validateApiKey($db, $data["api_key"]);

    //ATC tries to board
    if ($user["type"] !== "Passenger") {
        http_response_code(403);
        echo json_encode([
            "status" => "error",
            "message" => "Only passengers can board flights"
        ]);
        exit;
    }

    $passenger_id = $user["id"];

    $bookingSql = $db->prepare("
        SELECT Passenger_Flights.id,
               Passenger_Flights.boarding_confirmed,
               Flights.dispatched_at
        FROM Passenger_Flights
        JOIN Flights ON Flights.id = Passenger_Flights.flight_id
        WHERE Passenger_Flights.flight_id = ?
        AND Passenger_Flights.passenger_id = ?
    ");

    $bookingSql->bind_param("ii", $flight_id, $passenger_id);
    $bookingSql->execute();
    $bookingResult = $bookingSql->get_result();

    //pasenger not on flight
    if ($bookingResult->num_rows === 0) {
        http_response_code(404);
        echo json_encode([
            "status" => "error",
            "message" => "Flight booking not found"
        ]);
        exit;
    }

    $booking = $bookingResult->fetch_assoc();

    //passenger tries to board again for some reason
    if ((int)$booking["boarding_confirmed"] === 1) {
        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Passenger already boarded",
            "data" => [
                "flight_id" => $flight_id,
                "boarding_confirmed" => 1
            ]
        ]);
        exit;
    }

    //passenger tries to board but the flight hasnt even been dispatched
    if (empty($booking["dispatched_at"]) || $booking["dispatched_at"] === "0000-00-00 00:00:00") {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Flight has not been dispatched"
        ]);
        exit;
    }

    $dispatchTime = strtotime($booking["dispatched_at"]);
    $currentTime = time();

    $boardingWindowSec = 60; //CHANGE THIS IF YOU WANNA HAVE MORE TIME TO BOARD

    if (($currentTime - $dispatchTime) > $boardingWindowSec) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Boarding confirmation window expired",
            "response code" => 400
        ]);
        exit;
    }

    $updateSql = $db->prepare("
        UPDATE Passenger_Flights
        SET boarding_confirmed = 1, confirmed_at = NOW()
        WHERE flight_id = ? AND passenger_id = ? AND boarding_confirmed = 0");

    $updateSql->bind_param("ii", $flight_id, $passenger_id);

    if (!$updateSql->execute()) {
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "message" => "Could not confirm boarding"
        ]);
        exit;
    }
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "message" => "Boarding confirmed",
        "data" => [
            "flight_id" => $flight_id,
            "boarding_confirmed" => 1
        ]
    ]);

    exit;
}
if ($type === "GetCoordinates") {

    //same old story, test for key then flight id

    if (!isset($data["api_key"]) || empty($data["api_key"])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing API key"
        ]);
        exit;
    }
    $user = validateApiKey($db, $data["api_key"]);

    if (!isset($data["flight_id"])) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Missing flight id"
        ]);
        exit;
    }
    $flight_id = (int)$data["flight_id"];

    //so basically select origin name+lat+long then same for destination, join with airports twice, first for origin airport then for the destination
    $sql = $db->prepare("
        SELECT origin.name AS oriname,origin.latitude AS orilatitude, origin.longitude AS orilongitude,
        destination.name AS desname, destination.latitude AS deslatitude, 
        destination.longitude AS deslongitude
        FROM Flights
        JOIN Airports AS origin ON Flights.origin_airport_id = origin.id
        JOIN Airports AS destination ON Flights.destination_airport_id = destination.id WHERE Flights.id = ?");

    $sql->bind_param("i", $flight_id);
    $sql->execute();
    $result = $sql->get_result();

    //no rows so no flight
    if ($result->num_rows === 0) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Flight not found"
        ]);
        exit;
    }

    $airports = $result->fetch_assoc();

    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => [
            "flight_id" => $flight_id,
            "origin : " => [
                "name" => $airports["oriname"],
                "latitude" => $airports["orilatitude"],
                "longitude" => $airports["orilongitude"]
            ],
            "destination : " => [
                "name" => $airports["desname"],
                "latitude" => $airports["deslatitude"],
                "longitude" => $airports["deslongitude"]
            ]
        ]
    ]);
    exit;
}

//all types fail so return invalid
http_response_code(400);
echo json_encode([
    "status" => "error",
    "message" => "Invalid request type"
]);



//post man POST Authorization http://localhost:8080/COS216/api.php
