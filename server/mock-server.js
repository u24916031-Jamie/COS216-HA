/*
 * Tamlyn Khan
 * u24675815
 * Jamie King
 * u24916031
 * Isabella Engelbrecht
 * u25090501
 *
 * Test credentials:
 *   ATC: atc@test.com / Atc12345!
 *   Passenger 1: pass@test.com / Pass1234!
 *   Passenger 2: pass2@test.com / Pass1234!
 */

import { createServer } from 'http';
import { Server } from 'socket.io';

const AIRPORTS = [
  { id: 1,  name: 'O.R. Tambo International',    iata_code: 'JNB', city: 'Johannesburg', country: 'South Africa', latitude: -26.133, longitude: 28.242 },
  { id: 2,  name: 'Cape Town International',       iata_code: 'CPT', city: 'Cape Town',    country: 'South Africa', latitude: -33.965, longitude: 18.602 },
  { id: 3,  name: 'Dubai International',           iata_code: 'DXB', city: 'Dubai',        country: 'UAE',          latitude:  25.252, longitude: 55.364 },
  { id: 4,  name: 'Heathrow Airport',              iata_code: 'LHR', city: 'London',       country: 'UK',           latitude:  51.477, longitude: -0.461 },
  { id: 5,  name: 'John F. Kennedy International', iata_code: 'JFK', city: 'New York',     country: 'USA',          latitude:  40.639, longitude: -73.779 },
  { id: 6,  name: 'Sydney Kingsford Smith',        iata_code: 'SYD', city: 'Sydney',       country: 'Australia',    latitude: -33.947, longitude: 151.179 },
  { id: 7,  name: 'Haneda Airport',                iata_code: 'HND', city: 'Tokyo',        country: 'Japan',        latitude:  35.553, longitude: 139.781 },
  { id: 8,  name: 'Charles de Gaulle Airport',     iata_code: 'CDG', city: 'Paris',        country: 'France',       latitude:  49.009, longitude: 2.548   },
  { id: 9,  name: 'Jomo Kenyatta International',   iata_code: 'NBO', city: 'Nairobi',      country: 'Kenya',        latitude:  -1.319, longitude: 36.927  },
  { id: 10, name: 'Guarulhos International',        iata_code: 'GRU', city: 'São Paulo',   country: 'Brazil',       latitude: -23.432, longitude: -46.469 },
];

const airportById = Object.fromEntries(AIRPORTS.map(a => [a.id, a]));

const FLIGHTS = [
  { id: 1,  flight_number: 'SA101', origin_airport_id: 1, destination_airport_id: 4, departure_time: '2026-05-18 08:00:00', flight_duration_hours: 11, status: 'Scheduled', current_latitude: -26.133, current_longitude: 28.242,   dispatched_at: null },
  { id: 2,  flight_number: 'SA102', origin_airport_id: 2, destination_airport_id: 3, departure_time: '2026-05-18 10:00:00', flight_duration_hours: 9,  status: 'Scheduled', current_latitude: -33.965, current_longitude: 18.602,   dispatched_at: null },
  { id: 3,  flight_number: 'SA201', origin_airport_id: 1, destination_airport_id: 6, departure_time: '2026-05-18 12:00:00', flight_duration_hours: 13, status: 'Scheduled', current_latitude: -26.133, current_longitude: 28.242,   dispatched_at: null },
  { id: 4,  flight_number: 'QK303', origin_airport_id: 4, destination_airport_id: 5, departure_time: '2026-05-18 14:00:00', flight_duration_hours: 7,  status: 'Scheduled', current_latitude:  51.477, current_longitude: -0.461,   dispatched_at: null },
  { id: 5,  flight_number: 'EK500', origin_airport_id: 3, destination_airport_id: 7, departure_time: '2026-05-18 16:00:00', flight_duration_hours: 10, status: 'Scheduled', current_latitude:  25.252, current_longitude: 55.364,   dispatched_at: null },
  { id: 6,  flight_number: 'AF100', origin_airport_id: 8, destination_airport_id: 9, departure_time: '2026-05-18 18:00:00', flight_duration_hours: 8,  status: 'Scheduled', current_latitude:  49.009, current_longitude: 2.548,    dispatched_at: null },
  { id: 7,  flight_number: 'KE900', origin_airport_id: 7, destination_airport_id: 5, departure_time: '2026-05-18 20:00:00', flight_duration_hours: 14, status: 'Scheduled', current_latitude:  35.553, current_longitude: 139.781, dispatched_at: null },
  { id: 8,  flight_number: 'LA200', origin_airport_id: 10, destination_airport_id: 8, departure_time: '2026-05-18 22:00:00', flight_duration_hours: 11, status: 'Scheduled', current_latitude: -23.432, current_longitude: -46.469, dispatched_at: null },
  { id: 9,  flight_number: 'SA303', origin_airport_id: 1, destination_airport_id: 2, departure_time: '2026-05-19 06:00:00', flight_duration_hours: 2,  status: 'Scheduled', current_latitude: -26.133, current_longitude: 28.242,   dispatched_at: null },
  { id: 10, flight_number: 'QK404', origin_airport_id: 9, destination_airport_id: 10, departure_time: '2026-05-19 08:00:00', flight_duration_hours: 9,  status: 'Scheduled', current_latitude:  -1.319, current_longitude: 36.927,  dispatched_at: null },
];

const USERS = {
  'atc@test.com':   { id: 1, username: 'atc_user',  email: 'atc@test.com',  password: 'Atc12345!', type: 'ATC',       apikey: 'mock-atc-apikey-00001' },
  'pass@test.com':  { id: 2, username: 'passenger1', email: 'pass@test.com', password: 'Pass1234!', type: 'Passenger', apikey: 'mock-pax-apikey-00002' },
  'pass2@test.com': { id: 3, username: 'passenger2', email: 'pass2@test.com',password: 'Pass1234!', type: 'Passenger', apikey: 'mock-pax-apikey-00003' },
};

const BOOKINGS = {
  2: [1, 3, 9],
  3: [1, 5, 7],
};

const boardingConfirmed = {};

const activeFlights = {};

function getFlightById(id)
{
  return FLIGHTS.find(f => f.id === id) ?? null;
}

function getUserByApiKey(apikey)
{
  return Object.values(USERS).find(u => u.apikey === apikey) ?? null;
}

function enrichFlight(flight)
{
  const origin = airportById[flight.origin_airport_id];
  const dest   = airportById[flight.destination_airport_id];
  return {
    ...flight,
    origin_airport:      origin?.name ?? '',
    destination_airport: dest?.name ?? '',
  };
}

function getPassengersForFlight(flightId)
{
  return Object.entries(BOOKINGS)
    .filter(([, flights]) => flights.includes(flightId))
    .map(([passId]) =>
    {
      const user = Object.values(USERS).find(u => u.id === parseInt(passId));
      const key  = `${passId}_${flightId}`;
      return { id: parseInt(passId), username: user?.username ?? '?', boarding_confirmed: boardingConfirmed[key] ? 1 : 0 };
    });
}

function sendJson(res, status, body)
{
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(body));
}

function handleApi(data, res)
{
  const { type } = data;

  if (type === 'Login')
  {
    const user = USERS[data.email];
    if (!user || user.password !== data.password)
    {
      return sendJson(res, 401, { status: 'error', message: 'Invalid email or password' });
    }
    return sendJson(res, 200, {
      status: 'success',
      data: [{ id: user.id, username: user.username, email: user.email, type: user.type, apikey: user.apikey }]
    });
  }

  const user = getUserByApiKey(data.api_key);
  if (!user) return sendJson(res, 401, { status: 'error', message: 'Invalid API key' });

  if (type === 'GetAirports')
  {
    return sendJson(res, 200, { status: 'success', data: AIRPORTS });
  }

  if (type === 'GetAllFlights')
  {
    if (user.type === 'ATC')
    {
      const flights = FLIGHTS.map(f => ({ id: f.id, status: f.status, current_latitude: f.current_latitude, current_longitude: f.current_longitude }));
      return sendJson(res, 200, { status: 'success', 'user type': 'ATC', data: flights });
    }
    const myFlightIds = BOOKINGS[user.id] ?? [];
    const flights = myFlightIds.map(fid =>
    {
      const f = enrichFlight(getFlightById(fid));
      const key = `${user.id}_${fid}`;
      return { ...f, seat_number: `${10 + fid}A`, boarding_confirmed: boardingConfirmed[key] ? 1 : 0 };
    });
    return sendJson(res, 200, { status: 'success', 'user type': 'Passenger', data: flights });
  }

  if (type === 'GetFlight')
  {
    const flight = getFlightById(parseInt(data.flight_id));
    if (!flight) return sendJson(res, 404, { status: 'error', message: 'Flight not found' });

    if (user.type === 'Passenger')
    {
      const myFlights = BOOKINGS[user.id] ?? [];
      if (!myFlights.includes(flight.id))
        return sendJson(res, 403, { status: 'error', message: 'Not booked on this flight' });
      return sendJson(res, 200, { status: 'success', data: { flight: enrichFlight(flight) } });
    }

    const passengers = getPassengersForFlight(flight.id);
    return sendJson(res, 200, { status: 'success', data: { flight: enrichFlight(flight), passengers } });
  }

  sendJson(res, 400, { status: 'error', message: 'Unknown request type' });
}

const httpServer = createServer((req, res) =>
{
  if (req.method === 'OPTIONS')
  {
    res.writeHead(204, {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    });
    return res.end();
  }

  if (req.method !== 'POST')
  {
    res.writeHead(405);
    return res.end();
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', () =>
  {
    try
    {
      const data = JSON.parse(body);
      handleApi(data, res);
    }
    catch
    {
      sendJson(res, 400, { status: 'error', message: 'Invalid JSON' });
    }
  });
});

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const passengerMap = new Map();
const atcMap       = new Map();
const trackingMap  = new Map();

function broadcastPosition(flightId, progress = 0)
{
  const flight = getFlightById(flightId);
  if (!flight) return;

  for (const [username, flightIds] of trackingMap)
  {
    if (!flightIds.has(flightId)) continue;
    const socket = passengerMap.get(username) ?? atcMap.get(username);
    if (socket?.connected)
    {
      socket.emit('POSITION', flight.current_latitude, flight.current_longitude, flight.status, progress, flightId);
    }
  }
}

function startFlightAnimation(flightId)
{
  if (activeFlights[flightId]) return;

  const flight = getFlightById(flightId);
  if (!flight) return;

  const origin = airportById[flight.origin_airport_id];
  const dest   = airportById[flight.destination_airport_id];
  const durationMs = flight.flight_duration_hours * 1000;
  const startTime  = Date.now();

  flight.status = 'In Flight';

  const handle = setInterval(() =>
  {
    const progress = Math.min((Date.now() - startTime) / durationMs, 1.0);
    flight.current_latitude  = origin.latitude  + progress * (dest.latitude  - origin.latitude);
    flight.current_longitude = origin.longitude + progress * (dest.longitude - origin.longitude);

    broadcastPosition(flightId, progress);

    if (progress >= 1.0)
    {
      clearInterval(handle);
      delete activeFlights[flightId];
      flight.status            = 'Landed';
      flight.current_latitude  = dest.latitude;
      flight.current_longitude = dest.longitude;
      broadcastPosition(flightId, 1.0);
      console.log(`Flight ${flight.flight_number} has landed.`);
    }
  }, 100);

  activeFlights[flightId] = handle;
}

io.on('connection', socket =>
{
  console.log(`Client connected: ${socket.id}`);

  socket.on('INIT', (type, username, apikey) =>
  {
    const user = getUserByApiKey(apikey);
    if (!user)
    {
      socket.emit('ERROR', 'Invalid API key');
      return;
    }
    socket.data.type     = type;
    socket.data.username = username;
    socket.data.apikey   = apikey;

    if (type === 'passenger') passengerMap.set(username, socket);
    else if (type === 'ATC')  atcMap.set(username, socket);

    console.log(`INIT: ${username} (${type})`);
  });

  socket.on('DISPATCH', flightId =>
  {
    if (socket.data.type !== 'ATC') return;

    const flight = getFlightById(flightId);
    if (!flight || flight.status !== 'Scheduled')
    {
      socket.emit('ERROR', 'Flight cannot be dispatched');
      return;
    }

    flight.status       = 'Boarding';
    flight.dispatched_at = new Date().toISOString();
    console.log(`ATC dispatched flight ${flight.flight_number}`);

    const passengers = getPassengersForFlight(flightId);
    for (const pax of passengers)
    {
      const paxSocket = passengerMap.get(pax.username);
      if (paxSocket?.connected)
      {
        paxSocket.emit('BOARDING_CALL', { flightId, flightNumber: flight.flight_number });
      }
    }

    const BOARDING_WINDOW_MS = 60000;
    setTimeout(() =>
    {
      if (flight.status === 'Boarding')
      {
        for (const pax of getPassengersForFlight(flightId))
        {
          const key = `${pax.id}_${flightId}`;
          if (!boardingConfirmed[key])
          {
            const atcSocket = atcMap.values().next().value;
            if (atcSocket?.connected)
            {
              atcSocket.emit('NO_SHOW', { username: pax.username, flightId });
            }
          }
        }
        startFlightAnimation(flightId);
      }
    }, BOARDING_WINDOW_MS);
  });

  socket.on('BOARD', flightId =>
  {
    if (socket.data.type !== 'passenger') return;

    const user   = getUserByApiKey(socket.data.apikey);
    const flight = getFlightById(flightId);
    if (!user || !flight) return;

    if (flight.status !== 'Boarding')
    {
      socket.emit('ERROR', 'Boarding window has expired');
      for (const [, atcSocket] of atcMap)
      {
        if (atcSocket.connected) atcSocket.emit('NO_SHOW', { username: user.username, flightId });
      }
      return;
    }

    const key = `${user.id}_${flightId}`;
    boardingConfirmed[key] = true;
    console.log(`${user.username} confirmed boarding for flight ${flight.flight_number}`);

    for (const [, atcSocket] of atcMap)
    {
      if (atcSocket.connected)
      {
        atcSocket.emit('BOARDING_CONFIRMED', { username: user.username, flightId });
      }
    }
  });

  socket.on('TRACK', flightId =>
  {
    const flight = getFlightById(flightId);
    if (!flight)
    {
      socket.emit('ERROR', 'Flight not found');
      return;
    }

    if (socket.data.type === 'passenger')
    {
      const user = getUserByApiKey(socket.data.apikey);
      const myFlights = user ? (BOOKINGS[user.id] ?? []) : [];
      if (!myFlights.includes(flightId))
      {
        socket.emit('ERROR', 'Not authorised to track this flight');
        return;
      }
    }

    if (!trackingMap.has(socket.data.username))
    {
      trackingMap.set(socket.data.username, new Set());
    }
    trackingMap.get(socket.data.username).add(flightId);
    console.log(`${socket.data.username} tracking flight ${flightId}`);

    socket.emit('POSITION', flight.current_latitude, flight.current_longitude, flight.status, 0, flightId);
  });

  socket.on('disconnect', reason =>
  {
    const username = socket.data.username;
    if (username)
    {
      passengerMap.delete(username);
      atcMap.delete(username);
      trackingMap.delete(username);
    }
    console.log(`Client disconnected: ${username ?? socket.id} (${reason})`);
  });
});

const PORT = parseInt(process.argv[2]) || 3001;
httpServer.listen(PORT, () =>
{
  console.log(`\nMock server running on port ${PORT}`);
  console.log('──────────────────────────────────');
  console.log('HTTP API  →  POST http://localhost:' + PORT + '/api');
  console.log('WebSocket →  ws://localhost:' + PORT);
  console.log('\nTest credentials:');
  console.log('  ATC       atc@test.com   / Atc12345!');
  console.log('  Passenger pass@test.com  / Pass1234!');
  console.log('  Passenger pass2@test.com / Pass1234!');
  console.log('\nBoarding window is 15 seconds (spec: 60s) for easier testing.');
  console.log('Enter port 3001 in the Angular login form WebSocket field.\n');
});
