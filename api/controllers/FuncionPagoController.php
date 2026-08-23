<?php
class FuncionPagoController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function handleRequest($method, $id, $data) {
        if ($method === 'GET') {
            $sql = "SELECT * FROM VW_FUNCION_PAGO_DETALLE";
            $rows = $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($rows);
            exit;
        }

        if ($method === 'POST') {
            if (!$data) {
                http_response_code(400); echo json_encode(["error" => "Datos JSON invalidos"]); exit;
            }

            try {
                $stmt = $this->pdo->prepare("CALL PRC_ALTA_FUNCION_PAGO(?, ?, ?, ?, ?, @res, @msg)");
                $stmt->execute([
                    $data['id_funcion'],
                    $data['id_tipo_pago'],
                    $data['fecha_desde'],
                    $data['monto'],
                    'test' // p_usuario (hardcoded por ahora)
                ]);
                
                $out = $this->pdo->query("SELECT @res AS resultado, @msg AS mensaje")->fetch();
                if ($out['resultado'] == 0 || $out['resultado'] === null) {
                    echo json_encode(["success" => true, "message" => $out['mensaje'] ?: 'Operación exitosa']);
                } else {
                    http_response_code(400); echo json_encode(["error" => $out['mensaje']]);
                }
            } catch(Exception $ex) {
                http_response_code(500); echo json_encode(["error" => $ex->getMessage()]);
            }
            exit;
        }

        if ($method === 'PUT') {
            if (!$id) {
                http_response_code(400); echo json_encode(["error" => "ID es requerido"]); exit;
            }
            try {
                $stmt = $this->pdo->prepare("CALL PRC_UPD_FUNCION_PAGO(?, ?, ?, ?, ?, ?, ?, @res, @msg)");
                $stmt->execute([
                    $id,
                    $data['old_id_funcion'],
                    $data['old_id_tipo_pago'],
                    $data['fecha_desde'],
                    $data['fecha_hasta'] ?: null,
                    $data['monto'],
                    'test'
                ]);
                
                $out = $this->pdo->query("SELECT @res AS resultado, @msg AS mensaje")->fetch();
                if ($out['resultado'] == 0 || $out['resultado'] === null) {
                    echo json_encode(["success" => true, "message" => $out['mensaje'] ?: 'Operación exitosa']);
                } else {
                    http_response_code(400); echo json_encode(["error" => $out['mensaje']]);
                }
            } catch(Exception $ex) {
                http_response_code(500); echo json_encode(["error" => $ex->getMessage()]);
            }
            exit;
        }
    }
}
