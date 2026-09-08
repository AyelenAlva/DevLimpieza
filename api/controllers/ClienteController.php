<?php
class ClienteController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function handleRequest($method, $id, $data) {
        if ($method === 'GET') {
            $sql = "SELECT p.ID_PERSONA, p.TIPO_PERSONA, p.NOMBRE, p.APELLIDO, p.TELEFONO, p.EMAIL, p.DIRECCION, p.ID_CIUDAD, 
                           c.ID_CLIENTE, c.ID_ESTADO, c.ID_ORIGEN,
                           est.DESCRIPCION AS DESC_ESTADO, ciu.NOMBRE AS DESC_CIUDAD
                    FROM PERSONA p
                    JOIN CLIENTE c ON p.ID_PERSONA = c.ID_PERSONA
                    LEFT JOIN ESTADO est ON c.ID_ESTADO = est.ID_ESTADO
                    LEFT JOIN CIUDAD ciu ON p.ID_CIUDAD = ciu.ID_CIUDAD";
            $rows = $this->pdo->query($sql)->fetchAll();
            echo json_encode($rows);
            exit;
        }

        if ($method === 'POST') {
            if (!$data) {
                http_response_code(400); echo json_encode(["error" => "Datos JSON invalidos"]); exit;
            }
            $stmt = $this->pdo->prepare("CALL PRC_ALTA_PERSONA_CLIENTE(?, ?, ?, ?, ?, ?, ?, ?, ?, @resultado, @mensaje)");
            $stmt->execute([
                $data['tipo_persona'] ?? 'F',
                $data['nombre'] ?? null,
                $data['apellido'] ?? $data['razon_social'],
                $data['telefono'] ?? null,
                $data['email'] ?? null,
                $data['direccion'] ?? null,
                $data['id_ciudad'] ?: null,
                $data['id_estado'],
                $data['id_origen'] ?: null
            ]);
            $out = $this->pdo->query("SELECT @resultado AS resultado, @mensaje AS mensaje")->fetch();
            if ((int)$out['resultado'] >= 0) {
                echo json_encode(["success" => true, "message" => $out['mensaje']]);
            } else {
                http_response_code(400); echo json_encode(["error" => $out['mensaje']]);
            }
            exit;
        }

        if ($method === 'PUT') {
            if (!$id) {
                http_response_code(400); echo json_encode(["error" => "ID_CLIENTE es requerido"]); exit;
            }
            try {
                $stmt = $this->pdo->prepare("CALL prc_upd_persona_cliente(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @resultado, @mensaje)");
                $stmt->execute([
                    $id,
                    $data['tipo_persona'] ?? 'F',
                    $data['nombre'] ?? null,
                    $data['apellido_razon'] ?? $data['apellido'] ?? $data['razon_social'],
                    $data['telefono'] ?? null,
                    $data['email'] ?? null,
                    $data['direccion'] ?? null,
                    $data['id_ciudad'] ?: null,
                    $data['id_estado'],
                    $data['id_origen'] ?: null
                ]);
                $out = $this->pdo->query("SELECT @resultado AS resultado, @mensaje AS mensaje")->fetch();
                if ((int)$out['resultado'] >= 0) {
                    echo json_encode(["success" => true, "message" => $out['mensaje']]);
                } else {
                    http_response_code(400); echo json_encode(["error" => $out['mensaje']]);
                }
            } catch(Exception $ex) {
                http_response_code(500); echo json_encode(["error" => $ex->getMessage()]);
            }
            exit;
        }

        if ($method === 'DELETE') {
            if (!$id) {
                http_response_code(400); echo json_encode(["error" => "ID_PERSONA es requerido"]); exit;
            }
            $this->pdo->beginTransaction();
            try {
                $this->pdo->prepare("DELETE FROM CLIENTE WHERE ID_PERSONA=?")->execute([$id]);
                $this->pdo->prepare("DELETE FROM PERSONA WHERE ID_PERSONA=?")->execute([$id]);
                $this->pdo->commit();
                echo json_encode(["success" => true, "message" => "Registro eliminado"]);
            } catch(Exception $ex) {
                $this->pdo->rollBack();
                http_response_code(500); echo json_encode(["error" => $ex->getMessage()]);
            }
            exit;
        }
    }
}
