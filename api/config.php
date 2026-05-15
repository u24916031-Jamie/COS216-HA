
<?php

require_once __DIR__ . '/vendor/autoload.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

$db_server = "wheatley.cs.up.ac.za";
$db_user   = $_ENV['DB_USER'];
$db_pass   = $_ENV['DB_PASS'];
$db_name   = $_ENV['DB_NAME'];
$conn = "";

$conn = mysqli_connect($db_server, $db_user, $db_pass , $db_name);

if (!$conn) {
    die("Connection failed: " .
        mysqli_connect_error());
}

?>
