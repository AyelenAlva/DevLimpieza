<?php
require_once 'db.php';
try {
    $stmt = $pdo->query("SHOW PROCEDURE STATUS WHERE Db = DATABASE()");
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch(Exception $e) { echo json_encode(["error" => $e->getMessage()]); }
