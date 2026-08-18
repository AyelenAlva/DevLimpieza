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
require_once 'controllers/ClienteController.php';
require_once 'controllers/EmpleadoController.php';
require_once 'controllers/DistribuidoraController.php';
require_once 'controllers/ParametricasController.php';
require_once 'controllers/PedidoController.php';

$method = $_SERVER['REQUEST_METHOD'];
$tabla = $_GET['tabla'] ?? null;
$action = $_GET['action'] ?? null;
$id = $_GET['id'] ?? null;
$data = json_decode(file_get_contents("php://input"), true);

try {
    if (in_array($action, ['crud_cliente', 'alta_cliente'])) {
        $controller = new ClienteController($pdo);
        $controller->handleRequest($method, $id, $data);
    } 
    elseif (in_array($action, ['crud_empleado', 'alta_empleado'])) {
        $controller = new EmpleadoController($pdo);
        $controller->handleRequest($method, $id, $data);
    } 
    elseif (in_array($action, ['crud_distribuidora', 'alta_distribuidora'])) {
        $controller = new DistribuidoraController($pdo);
        $controller->handleRequest($method, $id, $data);
    } 
    elseif ($action === 'pedido') {
        $controller = new PedidoController($pdo);
        $controller->handleRequest($method, $id, $data);
    }
    else {
        $controller = new ParametricasController($pdo);
        $controller->handleRequest($method, $tabla, $action, $data);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error interno en la BD: " . $e->getMessage()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Error en el servidor: " . $e->getMessage()]);
}
