<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'db.php';
require_once __DIR__ . '/controllers/ParametricasController.php';
require_once __DIR__ . '/controllers/ClienteController.php';
require_once __DIR__ . '/controllers/EmpleadoController.php';
require_once __DIR__ . '/controllers/DistribuidoraController.php';
require_once __DIR__ . '/controllers/PedidoController.php';
require_once __DIR__ . '/controllers/RecepcionController.php';
require_once __DIR__ . '/controllers/FuncionPagoController.php';

$tabla = $_GET['tabla'] ?? null;
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

try {
    if ($action === 'crud_cliente' || $action === 'alta_cliente') {
        (new ClienteController($pdo))->handleRequest($method, $id, $data);
    } elseif ($action === 'crud_empleado' || $action === 'alta_empleado') {
        (new EmpleadoController($pdo))->handleRequest($method, $id, $data);
    } elseif ($action === 'crud_distribuidora' || $action === 'alta_distribuidora') {
        (new DistribuidoraController($pdo))->handleRequest($method, $id, $data);
    } elseif ($action === 'pedido') {
        (new PedidoController($pdo))->handleRequest($method, $id, $data);
    } elseif ($action === 'recepcion' || $action === 'ingresar_stock') {
        (new RecepcionController($pdo))->handleRequest($method, $id, $data);
    } elseif ($action === 'funcion_pago') {
        (new FuncionPagoController($pdo))->handleRequest($method, $id, $data);
    } elseif ($tabla) {
        (new ParametricasController($pdo))->handleRequest($method, $tabla, $action, $data);
    } else {
        http_response_code(400);
        echo json_encode(["error" => "Acción no válida"]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno en la BD: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en el servidor: " . $e->getMessage()]);
}
