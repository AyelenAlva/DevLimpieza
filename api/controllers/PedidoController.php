<?php
class PedidoController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function handleRequest($method, $id, $data) {
        if ($method === 'GET') {
            // Si viene con ID_PEDIDO, retornamos el detalle
            if (isset($_GET['id_pedido'])) {
                $id_pedido = $_GET['id_pedido'];
                $sql = "SELECT
                            pd.ID_PEDIDO_DET,
                            pr.ID_PRODUCTO,
                            pr.DESCRIPCION                AS PRODUCTO,
                            pr.CODIGO_PRODUCTO,
                            pr.MARCA,
                            um.DESCRIPCION                AS UNIDAD_MEDIDA,
                            tp.DESCRIPCION                AS TIPO_PRESENTACION,
                            pr.CANTIDAD_PRESENTACION,
                            pd.CANTIDAD                   AS CANTIDAD_PEDIDA,
                            pd.COSTO_UNITARIO,
                            (pd.CANTIDAD * pd.COSTO_UNITARIO) AS SUBTOTAL_LINEA
                        FROM PEDIDO_CAB p
                        JOIN PEDIDO_DET pd
                            ON pd.ID_PEDIDO_CAB = p.ID_PEDIDO
                        JOIN PRODUCTO pr
                            ON pr.ID_PRODUCTO = pd.ID_PRODUCTO
                        LEFT JOIN UNIDAD_MEDIDA um
                            ON um.ID_UNIDAD_MEDIDA = pr.ID_UNIDAD_MEDIDA
                        LEFT JOIN TIPO_PRESENTACION tp
                            ON tp.ID_TIPO_PRESENTACION = pr.ID_TIPO_PRESENTACION
                        WHERE p.ID_PEDIDO = ?";
                $stmt = $this->pdo->prepare($sql);
                $stmt->execute([$id_pedido]);
                echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
                exit;
            } else {
                // Si no hay ID, retornamos la cabecera
                $sql = "SELECT
                            p.ID_PEDIDO,
                            CONCAT(PER.NOMBRE, ' ', PER.APELLIDO) AS DISTRIBUIDORA,
                            e.ID_ESTADO,
                            e.CODIGO,
                            e.DESCRIPCION                AS ESTADO_PEDIDO,
                            p.FECHA_PEDIDO,
                            p.FECHA_RECEPCION,
                            p.OBSERVACION,
                            (SELECT COUNT(*) FROM RECEPCION_CAB r WHERE r.ID_PEDIDO = p.ID_PEDIDO) > 0 AS TIENE_RECEPCION
                        FROM PEDIDO_CAB p
                        JOIN DISTRIBUIDORA d
                            ON d.ID_DISTRIBUIDORA = p.ID_DISTRIBUIDORA
                        JOIN PERSONA PER 
                            ON PER.ID_PERSONA = d.ID_PERSONA
                        JOIN ESTADO e
                            ON e.ID_ESTADO = p.ID_ESTADO
                        ORDER BY p.ID_PEDIDO DESC";
                $rows = $this->pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
                echo json_encode($rows);
                exit;
            }
        }

        if ($method === 'POST') {
            if (!$data) {
                http_response_code(400); echo json_encode(["error" => "Datos JSON invalidos"]); exit;
            }

            $id_distribuidora = $data['id_distribuidora'] ?? null;
            $observacion = $data['observacion'] ?? null;
            $detalles = $data['detalles'] ?? [];

            if (!$id_distribuidora || empty($detalles)) {
                http_response_code(400); echo json_encode(["error" => "Se requiere la distribuidora y al menos un detalle de producto."]); exit;
            }

            $this->pdo->beginTransaction();
            try {
                // 1. Obtener ID_ESTADO para "NUEVO"
                $stmt_estado = $this->pdo->prepare("SELECT ID_ESTADO FROM ESTADO WHERE TIPO_ESTADO = 'PEDIDO_STOCK' AND CODIGO = 'NUEVO'");
                $stmt_estado->execute();
                $estado = $stmt_estado->fetch(PDO::FETCH_ASSOC);
                
                if (!$estado) {
                    throw new Exception("No se encontro el estado NUEVO para PEDIDO_STOCK");
                }
                $id_estado_nuevo = $estado['ID_ESTADO'];

                // 2. Insertar en PEDIDO_CAB
                // Usamos la fecha actual de MySQL (NOW()) para la fecha de pedido
                $stmt_cab = $this->pdo->prepare("INSERT INTO PEDIDO_CAB (ID_DISTRIBUIDORA, ID_ESTADO, FECHA_PEDIDO, OBSERVACION) VALUES (?, ?, NOW(), ?)");
                $stmt_cab->execute([$id_distribuidora, $id_estado_nuevo, $observacion]);
                
                $id_pedido_generado = $this->pdo->lastInsertId();

                // 3. Insertar Detalles
                $stmt_det = $this->pdo->prepare("INSERT INTO PEDIDO_DET (ID_PEDIDO_CAB, ID_PRODUCTO, CANTIDAD, COSTO_UNITARIO) VALUES (?, ?, ?, ?)");
                
                foreach ($detalles as $det) {
                    $stmt_det->execute([
                        $id_pedido_generado,
                        $det['id_producto'],
                        $det['cantidad'],
                        $det['costo_unitario']
                    ]);
                }

                $this->pdo->commit();
                echo json_encode(["success" => true, "message" => "Pedido guardado correctamente", "id_pedido" => $id_pedido_generado]);
            } catch (Exception $e) {
                $this->pdo->rollBack();
                http_response_code(500);
                echo json_encode(["error" => "Error al guardar el pedido: " . $e->getMessage()]);
            }
            exit;
        }
    }
}
