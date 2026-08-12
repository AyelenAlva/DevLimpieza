<?php
$host = 'db5021069620.hosting-data.io';
$db = 'dbs15964907';
$user = 'dbu5432127';
$pass = 'DEV_Limpieza@2010';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<h1>✅ Conexión exitosa</h1>";

    // CREATE
    $stmt = $pdo->prepare("INSERT INTO estado (TIPO_ESTADO, CODIGO, DESCRIPCION, USUARIO_ALTA, FECHA_ALTA, USUARIO_MOD, FECHA_MOD) VALUES (1, 'TST', 'TEST CRUD', 'admin', NOW(), 'admin', NOW())");
    $stmt->execute();
    $id = $pdo->lastInsertId();
    echo "<p>✅ CREATE: Se insertó un registro de prueba con ID $id.</p>";

    // READ
    $stmt = $pdo->prepare("SELECT * FROM estado WHERE ID_ESTADO = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    echo "<p>✅ READ: Se leyó el registro correctamente (" . $row['DESCRIPCION'] . ").</p>";

    // UPDATE
    $stmt = $pdo->prepare("UPDATE estado SET DESCRIPCION = 'TEST MODIFICADO' WHERE ID_ESTADO = ?");
    $stmt->execute([$id]);
    echo "<p>✅ UPDATE: Se modificó el registro correctamente.</p>";

    // DELETE
    $stmt = $pdo->prepare("DELETE FROM estado WHERE ID_ESTADO = ?");
    $stmt->execute([$id]);
    echo "<p>✅ DELETE: Se eliminó el registro para no dejar basura.</p>";

    echo "<h2 style='color: green;'>✅ ¡LA BASE DE DATOS TIENE TODOS LOS PERMISOS PERFECTOS PARA EL CRUD!</h2>";

} catch (PDOException $e) {
    echo "<h1>❌ Error</h1>";
    echo "<p>" . $e->getMessage() . "</p>";
}
?>
