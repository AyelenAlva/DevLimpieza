<?php
class ParametricasController {
    private $pdo;
    private $allowedTables;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->allowedTables = [
            'ciudad',
            'estado',
            'estado_usa',
            'funcion',
            'origen_cliente',
            'tipo_pago',
            'tipo_servicio',
            'vw_cliente',
            'vw_empleado',
            'vw_distribuidora',
            'producto',
            'vw_producto',
            'unidad_medida',
            'tipo_presentacion'
        ];
    }

    public function handleRequest($method, $tabla, $action, $data) {
        // Acciones específicas de listado paramétrico
        if ($method === 'GET' && $action === 'estados_cliente') {
            $stmt = $this->pdo->query("SELECT ID_ESTADO, DESCRIPCION FROM ESTADO WHERE TIPO_ESTADO = 'CLIENTE'");
            $rows = $stmt->fetchAll();
            echo json_encode($rows);
            exit;
        }

        if (!$tabla) {
            http_response_code(400); echo json_encode(["error" => "Parámetro 'tabla' no provisto"]); exit;
        }

        if (!in_array(strtolower($tabla), $this->allowedTables)) {
            http_response_code(403); echo json_encode(["error" => "Tabla no permitida"]); exit;
        }

        $tabla_db = strtoupper($tabla);

        if ($method === 'GET') {
            try {
                if ($tabla_db === 'PRODUCTO') {
                    $stmt = $this->pdo->query("SELECT p.CODIGO_PRODUCTO, vw.* FROM VW_PRODUCTO vw JOIN PRODUCTO p ON vw.ID_PRODUCTO = p.ID_PRODUCTO");
                } else {
                    $stmt = $this->pdo->query("SELECT * FROM $tabla_db");
                }
                $rows = $stmt->fetchAll();
                echo json_encode($rows);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
            exit;
        }

        if ($method === 'POST') {
            try {
                if (!$data) {
                    http_response_code(400); echo json_encode(["error" => "Datos JSON invalidos"]); exit;
                }
                $columns = implode(", ", array_keys($data));
                $placeholders = implode(", ", array_fill(0, count($data), "?"));
                $sql = "INSERT INTO $tabla_db ($columns) VALUES ($placeholders)";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute(array_values($data));
                echo json_encode(["success" => true, "id" => $this->pdo->lastInsertId()]);
            } catch (Exception $e) {
                http_response_code(500); echo json_encode(["error" => $e->getMessage()]);
            }
            exit;
        }

        if ($method === 'PUT') {
            try {
                if (!$data) {
                    http_response_code(400); echo json_encode(["error" => "Datos JSON invalidos"]); exit;
                }
                $idField = 'ID_' . $tabla_db; 
                if (!isset($data[$idField])) {
                    http_response_code(400); echo json_encode(["error" => "Campo ID no encontrado ($idField)"]); exit;
                }
                $id = $data[$idField];
                unset($data[$idField]);
                $updates = [];
                foreach ($data as $key => $val) {
                    $updates[] = "$key = ?";
                }
                $sql = "UPDATE $tabla_db SET " . implode(", ", $updates) . " WHERE $idField = ?";
                $params = array_values($data);
                $params[] = $id;
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute($params);
                echo json_encode(["success" => true]);
            } catch (Exception $e) {
                http_response_code(500); echo json_encode(["error" => $e->getMessage()]);
            }
            exit;
        }

        if ($method === 'DELETE') {
            try {
                $idField = 'ID_' . $tabla_db;
                $id = $_GET['id'] ?? null;
                if (!$id) {
                    http_response_code(400); echo json_encode(["error" => "Campo ID no encontrado"]); exit;
                }
                $sql = "DELETE FROM $tabla_db WHERE $idField = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$id]);
                echo json_encode(["success" => true]);
            } catch (Exception $e) {
                http_response_code(500); echo json_encode(["error" => $e->getMessage()]);
            }
            exit;
        }
    }
}
