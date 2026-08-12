<?php
require_once 'db.php';

try {
    // Obtener parámetros de los SP
    $stmt = $pdo->query("SELECT SPECIFIC_NAME, PARAMETER_NAME, DATA_TYPE, PARAMETER_MODE, ORDINAL_POSITION 
                         FROM information_schema.PARAMETERS 
                         WHERE SPECIFIC_NAME IN ('PRC_ALTA_PERSONA_CLIENTE', 'PRC_ALTA_PERSONA_EMPLEADO', 'PRC_ALTA_PERSONA_DISTRIBUIDORA')
                         ORDER BY SPECIFIC_NAME, ORDINAL_POSITION");
    $sps = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Obtener tablas y vistas
    $stmt = $pdo->query("SHOW FULL TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        "sps" => $sps,
        "tables" => $tables
    ]);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
