<?php
// Archivo de prueba de conexión a IONOS
$host = 'db5021069620.hosting-data.io';
$db = 'dbs15964907';
$user = 'dbu5432127';
$pass = 'DEV_Limpieza@2010';
$charset = 'utf8mb4';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=$charset", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<div style='font-family: sans-serif; text-align: center; margin-top: 50px;'>";
    echo "<h1 style='color: green;'> ¡Conexión exitosa a IONOS!</h1>";
    echo "<p>La base de datos respondió correctamente. Ya puedes subir el resto del sistema.</p>";
    echo "</div>";
} catch (PDOException $e) {
    echo "<div style='font-family: sans-serif; text-align: center; margin-top: 50px;'>";
    echo "<h1 style='color: red;'> Error de conexión</h1>";
    echo "<p>Verifica que los datos de usuario y contraseña sean correctos.</p>";
    echo "<p><strong>Detalle técnico:</strong> " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "</div>";
}
?>
