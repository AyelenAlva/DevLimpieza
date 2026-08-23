<?php
class RecepcionController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function handleRequest($method, $id, $data) {
        if ($method === 'GET') {
            if (isset($_GET['id_pedido'])) {
                $id_pedido = $_GET['id_pedido'];
                $stmt = $this->pdo->prepare("SELECT ID_RECEPCION FROM RECEPCION_CAB WHERE ID_PEDIDO = ? ORDER BY ID_RECEPCION DESC LIMIT 1");
                $stmt->execute([$id_pedido]);
                $rec = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($rec) {
                    $stmt2 = $this->pdo->prepare("SELECT * FROM VW_RECEPCION WHERE ID_RECEPCION = ?");
                    $stmt2->execute([$rec['ID_RECEPCION']]);
                    echo json_encode($stmt2->fetchAll(PDO::FETCH_ASSOC));
                } else {
                    echo json_encode([]);
                }
                exit;
            }
            echo json_encode([]);
            exit;
        }

        if ($method === 'POST') {
            if (!$data) {
                http_response_code(400); echo json_encode(["error" => "Datos JSON invalidos"]); exit;
            }

            $id_pedido = $data['id_pedido'] ?? null;
            $id_estado_cabecera = $data['id_estado_cabecera'] ?? null;
            $observaciones = $data['observaciones'] ?? null;
            $detalles = $data['detalles'] ?? [];

            if (!$id_pedido || !$id_estado_cabecera || empty($detalles)) {
                http_response_code(400); echo json_encode(["error" => "Se requiere ID_PEDIDO, ID_ESTADO y al menos un detalle de recepción."]); exit;
            }

            $this->pdo->beginTransaction();
            try {
                // Insertar RECEPCION_CAB
                $stmt_cab = $this->pdo->prepare("INSERT INTO RECEPCION_CAB (ID_PEDIDO, ID_ESTADO, OBSERVACION, FECHA_RECEPCION) VALUES (?, ?, ?, NOW())");
                $stmt_cab->execute([$id_pedido, $id_estado_cabecera, $observaciones]);
                $id_recepcion_generado = $this->pdo->lastInsertId();

                // Obtener ID_ESTADO por defecto para RECEPCION_DET
                $stmt_est = $this->pdo->prepare("SELECT ID_ESTADO FROM ESTADO WHERE TIPO_ESTADO = 'RECEPCION_STOCK_DET' AND CODIGO = 'PENDIENTE_INGRESO_STOCK'");
                $stmt_est->execute();
                $estado_det = $stmt_est->fetch(PDO::FETCH_ASSOC);
                if (!$estado_det) throw new Exception("Falta estado PENDIENTE_INGRESO_STOCK en tabla ESTADO");
                $id_estado_det = $estado_det['ID_ESTADO'];

                // Insertar RECEPCION_DET
                $stmt_det = $this->pdo->prepare("INSERT INTO RECEPCION_DET (ID_RECEPCION_CAB, ID_PEDIDO_DET, ID_PRODUCTO, CANTIDAD_RECIBIDA, COSTO_UNITARIO_REAL, ID_ESTADO) VALUES (?, ?, ?, ?, ?, ?)");
                foreach ($detalles as $det) {
                    $stmt_det->execute([
                        $id_recepcion_generado,
                        $det['id_pedido_det'],
                        $det['id_producto'],
                        $det['cantidad_recibida'],
                        $det['costo_unitario_real'],
                        $id_estado_det
                    ]);
                }

                // Llamar SP
                $stmt_sp = $this->pdo->prepare("CALL PRC_UPD_ESTADO_PEDIDO(?, NULL, @resultado, @mensaje)");
                $stmt_sp->execute([$id_pedido]);

                $out = $this->pdo->query("SELECT @resultado AS resultado, @mensaje AS mensaje")->fetch();
                if ($out && $out['resultado'] != 0) {
                     throw new Exception($out['mensaje']);
                }

                $this->pdo->commit();
                echo json_encode(["success" => true, "message" => "Recepción registrada correctamente"]);
            } catch (Exception $e) {
                $this->pdo->rollBack();
                http_response_code(500);
                echo json_encode(["error" => $e->getMessage()]);
            }
            exit;
        }
    }
}
