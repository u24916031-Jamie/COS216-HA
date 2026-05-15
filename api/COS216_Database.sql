-- phpMyAdmin SQL Dump
-- version 5.0.4deb2~bpo10+1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 15, 2026 at 06:49 PM
-- Server version: 10.3.39-MariaDB-0+deb10u2
-- PHP Version: 7.3.31-1~deb10u7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u25090501`
--
CREATE DATABASE IF NOT EXISTS `u24916031_216HA` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `u24916031_216HA`;

-- --------------------------------------------------------

--
-- Table structure for table `Airports`
--

CREATE TABLE IF NOT EXISTS `Airports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `iata_code` char(3) NOT NULL,
  `city` varchar(100) NOT NULL,
  `country` varchar(50) NOT NULL,
  `latitude` double NOT NULL,
  `longitude` double NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_iata` (`iata_code`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Airports`
--

INSERT INTO `Airports` (`id`, `name`, `iata_code`, `city`, `country`, `latitude`, `longitude`) VALUES
(1, 'John F. Kennedy International', 'JFK', 'New York', 'United States', 40.6413, -73.7781),
(2, 'Heathrow', 'LHR', 'London', 'United Kingdom', 51.47, -0.4543),
(3, 'Haneda', 'HND', 'Tokyo', 'Japan', 35.5494, 139.7798),
(4, 'Charles de Gaulle', 'CDG', 'Paris', 'France', 49.0097, 2.5479),
(5, 'Dubai International', 'DXB', 'Dubai', 'United Arab Emirates', 25.2532, 55.3644),
(6, 'Sydney Kingsford Smith', 'SYD', 'Sydney', 'Australia', -33.9399, 151.1772),
(7, 'Frankfurt', 'FRA', 'Frankfurt', 'Germany', 50.0379, 8.5706),
(8, 'Singapore Changi', 'SIN', 'Singapore', 'Singapore', 1.3644, 103.9915),
(9, 'São Paulo/Guarulhos International', 'GRU', 'Sao Paulo', 'Brazil', -23.4356, -46.4731),
(10, 'Cape Town International', 'CPT', 'Cape Town', 'South Africa', -33.97, 18.6017);

-- --------------------------------------------------------

--
-- Table structure for table `Flights`
--

CREATE TABLE IF NOT EXISTS `Flights` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `flight_number` varchar(10) NOT NULL,
  `origin_airport_id` int(11) NOT NULL,
  `destination_airport_id` int(11) NOT NULL,
  `departure_time` datetime NOT NULL,
  `flight_duration_hours` decimal(4,2) NOT NULL,
  `status` enum('Scheduled','Boarding','In Flight','Landed') NOT NULL,
  `current_latitude` double NOT NULL,
  `current_longitude` double NOT NULL,
  `dispatched_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_origin_airport` (`origin_airport_id`),
  KEY `fk_destination_airport` (`destination_airport_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Flights`
--

INSERT INTO `Flights` (`id`, `flight_number`, `origin_airport_id`, `destination_airport_id`, `departure_time`, `flight_duration_hours`, `status`, `current_latitude`, `current_longitude`, `dispatched_at`) VALUES
(1, 'UA101', 1, 2, '2026-05-15 08:00:00', '7.00', 'In Flight', 45.8561, -65.8324, '2026-05-15 04:45:00'),
(2, 'BA202', 2, 4, '2026-05-15 10:30:00', '1.25', 'Boarding', 51.47, -0.4543, '2026-05-15 07:45:00'),
(3, 'JL303', 3, 8, '2026-05-15 12:15:00', '7.10', 'In Flight', 20, 120, '2026-05-15 10:05:00'),
(4, 'AF404', 4, 7, '2026-05-15 14:00:00', '1.15', 'Scheduled', 49.0097, 2.5479, NULL),
(5, 'EK505', 5, 3, '2026-05-15 16:20:00', '9.50', 'In Flight', 30, 90, '2026-05-15 14:10:00'),
(6, 'QF606', 6, 10, '2026-05-15 18:45:00', '14.30', 'Scheduled', -33.9399, 151.1772, '2026-05-15 15:32:00'),
(7, 'LH707', 7, 2, '2026-05-15 20:00:00', '1.40', 'Landed', 50.0379, 8.5706, '2026-05-15 17:50:00'),
(8, 'SQ808', 8, 5, '2026-05-15 21:15:00', '7.20', 'Scheduled', 1.3644, 103.9915, NULL),
(9, 'LA909', 9, 1, '2026-05-16 06:30:00', '10.50', 'Scheduled', -23.4356, -46.4731, NULL),
(10, 'SA010', 10, 6, '2026-05-16 09:00:00', '11.45', 'Boarding', -33.97, 18.6017, '2026-05-15 16:29:36');

-- --------------------------------------------------------

--
-- Table structure for table `Passenger_Flights`
--

CREATE TABLE IF NOT EXISTS `Passenger_Flights` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `passenger_id` int(11) NOT NULL,
  `flight_id` int(11) NOT NULL,
  `seat_number` varchar(5) DEFAULT NULL,
  `boarding_confirmed` tinyint(1) NOT NULL,
  `confirmed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_passenger_id` (`passenger_id`),
  KEY `fk_flight_id` (`flight_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Passenger_Flights`
--

INSERT INTO `Passenger_Flights` (`id`, `passenger_id`, `flight_id`, `seat_number`, `boarding_confirmed`, `confirmed_at`) VALUES
(1, 1, 6, '12A', 1, '2026-05-15 15:32:29'),
(2, 1, 3, '14C', 0, NULL),
(3, 3, 2, '1A', 1, '2026-05-15 07:45:14'),
(4, 3, 5, '3B', 0, NULL),
(5, 5, 4, '10F', 0, NULL),
(6, 5, 6, '7D', 0, NULL),
(7, 6, 7, '22C', 1, '2026-05-15 15:50:00'),
(8, 8, 3, '5A', 0, NULL),
(9, 9, 2, '2B', 1, '2026-05-16 07:45:37'),
(10, 9, 10, '13D', 1, '2026-05-15 16:29:43'),
(11, 3, 3, '1C', 1, '2026-05-15 10:00:00'),
(12, 5, 1, '9F', 0, '2026-05-15 04:45:30');

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE IF NOT EXISTS `Users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `salt` char(16) NOT NULL,
  `email` varchar(255) NOT NULL,
  `type` enum('Passenger','ATC') NOT NULL,
  `api_key` char(64) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `Users`
--

INSERT INTO `Users` (`id`, `username`, `password`, `salt`, `email`, `type`, `api_key`) VALUES
(1, 'PeterPark', '1c8565b31cd0bea8bb8816e677cb8b6e604c48ee286c48aa6cf7a0a82893d3c9', 'yFhrRc7BrZQ1ayPU', 'spiderman@avengers.com', 'Passenger', 'KdGn8ymvvqX29RwjxLpJ4IdPbjKRXeBV'),
(2, 'IronManReal', '3bb21ff20482b1ceed3d4b9e72af355fd7e4e60045f02b7b4bb3f94e6db8deca', 'BDRgQTirEurHxISw', 'ironman@avengers.com', 'ATC', 'cgfxwKhUpmzQL1wSWtcM0KJ4FCpeBalf'),
(3, 'CaptainA', '2677aa8f650679792117abcee1986e2636567f07e1b6bf1cae74b7162075ec47', 'cJjoNdJRormswDEV', 'captainamerica@avengers.com', 'Passenger', 'RRy1z63NFnYIkLuALEUJc9n4QZrLxYyX'),
(4, 'Bats', 'a9c1b0461c860feeb2912b70433acedfd1bc3eeca503a0cb277e431301f20968', '273utIdhgbggFQHy', 'batman@gotham.com', 'ATC', 'XeKr3OEG8PVWSgbWeUcLaPy98bIwO2lK'),
(5, 'KryptoniteEnjoyer2', 'a3b420f764ed8b8488c2dac7d815d4759c3a85c563c4c06fb2ee06850c7192df', 'uPhsaUJFF5BLiLEw', 'superman@dailyplanet.com', 'Passenger', 'hD1dGUfXruSwjx280DMT7GqIisEBOkaq'),
(6, 'SonicTheHedgehog', '414db33dcc36f2ec40dd89fd149dedaf9c34d38ae881b516b2e12bb16882ce37', 'UtxYrlZQ5gEDXbM2', 'flash@centralcity.com', 'Passenger', 'NhxcdWYscuwZrhoicllolyr8VFUP6BjN'),
(7, 'Widow', '9a3dd5f48ebca344223e775a9b73b8b61be1aed3286f987882d1c4aaed3a94b7', 'D0ilyZGP2V57bgWU', 'blackwidow@shield.com', 'ATC', 'UAFsJ127om4vdTDSMt0n1DXxrlh8S0NS'),
(8, 'Zatanna', '0696f3f06a72ed583b493ff93493d2ef7e2427c98c2546aa8a64de52bab8abfd', 'agizFyDiWkEW7HUF', 'zatanna@magic.com', 'Passenger', 'wCbtJHik6gcoQWAp2jg4gtWP5nji9UAI'),
(9, 'Woman-Wondering', 'c770d2b081df35e312cfd12c17f10997a3b4683318c9896fda77878d91df4541', 'ehOUUBjsbIE7dZIN', 'wonderwoman@thelasso.com', 'Passenger', '3F999FT14y5FfT04PKrPQTFvI2L0FAf1'),
(10, 'HarleyDavidson', '3698bfda4f0560afc56eef6c0ea040c6beb0b19ccbd40d4b405adcf96f887741', '9l1KOQRTFPr063V6', 'harleyquinn@gotham.com', 'ATC', 'xAjYiajljlmOuRf4DeYQb9PF5GLhTEvu'),
(11, 'Test', '1a81f02c50991d764fa98dd51d48a8ab16200b640e9502e49a45da341b6a1984', 'IFbXpKjdsN0u8VmK', 'test@test.com', 'Passenger', 'szCGn84yiKzcmPrBDDOWZj2z0Sn30gHqCW8G9otp7MdI81a2BXlA4KCnUrnbMWhn'),
(12, 'GreenLantern', 'bb7c54f47d8fec2289a2186f7cc3bab44589178d57b5a695bb7aa8c8e2801ae8', 'BwtiPnRtTwpOVNET', 'hal@league.com', 'ATC', 'qETLendaiHAEvCELPdQzADup8IrifymnWn20e01z1VHDQgk5IkoCUJTI7hSIiDwt');

--
-- Constraints for dumped tables
--

--
-- Constraints for table `Flights`
--
ALTER TABLE `Flights`
  ADD CONSTRAINT `fk_destination_airport` FOREIGN KEY (`destination_airport_id`) REFERENCES `Airports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_origin_airport` FOREIGN KEY (`origin_airport_id`) REFERENCES `Airports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `Passenger_Flights`
--
ALTER TABLE `Passenger_Flights`
  ADD CONSTRAINT `fk_flight_id` FOREIGN KEY (`flight_id`) REFERENCES `Flights` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_passenger_id` FOREIGN KEY (`passenger_id`) REFERENCES `Users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
