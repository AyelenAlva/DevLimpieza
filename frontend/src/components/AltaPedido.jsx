import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.PROD 
  ? '../api/index.php' 
  : 'http://hispaniaimports.com/DEV_Limpieza/api/index.php';

export default function AltaPedido() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detalles, setDetalles] = useState({});
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [distribuidoras, setDistribuidoras] = useState([]);
  const [productos, setProductos] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    id_distribuidora: '',
    observacion: '',
    items: [] // array of { id_producto, cantidad, costo_unitario }
  });

  useEffect(() => {
    fetchPedidos();
    loadOptions();
  }, []);

  const fetchPedidos = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}?action=pedido`);
      setPedidos(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOptions = async () => {
    try {
      const [resDist, resProd] = await Promise.all([
        axios.get(`${API_BASE}?tabla=vw_distribuidora`),
        axios.get(`${API_BASE}?tabla=producto`)
      ]);
      setDistribuidoras(resDist.data);
      setProductos(resProd.data);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleExpand = async (idPedido) => {
    if (expandedId === idPedido) {
      setExpandedId(null);
      return;
    }
    setExpandedId(idPedido);
    
    if (!detalles[idPedido]) {
      setLoadingDetalle(true);
      try {
        const res = await axios.get(`${API_BASE}?action=pedido&id_pedido=${idPedido}`);
        setDetalles(prev => ({ ...prev, [idPedido]: res.data }));
      } catch (err) {
        console.error("Error al obtener detalle", err);
      } finally {
        setLoadingDetalle(false);
      }
    }
  };

  const handleOpenModal = () => {
    setFormData({ id_distribuidora: '', observacion: '', items: [] });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { id_producto: '', cantidad: 1, costo_unitario: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.id_distribuidora) return alert("Seleccione una distribuidora");
    if (formData.items.length === 0) return alert("Agregue al menos un producto");
    
    for (let item of formData.items) {
      if (!item.id_producto || item.cantidad <= 0 || item.costo_unitario < 0) {
        return alert("Revise que todos los productos tengan datos válidos");
      }
    }

    try {
      await axios.post(`${API_BASE}?action=pedido`, {
        id_distribuidora: formData.id_distribuidora,
        observacion: formData.observacion,
        detalles: formData.items
      });
      setIsModalOpen(false);
      fetchPedidos();
    } catch (err) {
      console.error(err);
      alert("Error al guardar el pedido");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pedidos de Stock</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de cabeceras y detalles de compras</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Pedido
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Cargando pedidos...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50/80 text-gray-600 font-semibold uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 w-10"></th>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Distribuidora</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Fecha Pedido</th>
                  <th className="px-6 py-4">Observación</th>
                  <th className="px-6 py-4">Recepción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pedidos.map((p) => (
                  <React.Fragment key={p.ID_PEDIDO}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => toggleExpand(p.ID_PEDIDO)}
                          className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                        >
                          {expandedId === p.ID_PEDIDO ? '-' : '+'}
                        </button>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">#{p.ID_PEDIDO}</td>
                      <td className="px-6 py-4">{p.DISTRIBUIDORA}</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                          {p.ESTADO_PEDIDO || p.CODIGO}
                        </span>
                      </td>
                      <td className="px-6 py-4">{p.FECHA_PEDIDO}</td>
                      <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{p.OBSERVACION}</td>
                      <td className="px-6 py-4">
                        <button className="text-gray-400 hover:text-green-600 transition-colors" title="Recepción">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Fila expandible para el detalle */}
                    {expandedId === p.ID_PEDIDO && (
                      <tr className="bg-gray-50/50">
                        <td colSpan="7" className="p-0 border-b border-gray-200">
                          <div className="p-6 pl-16 border-l-4 border-blue-500">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                              Detalle del Pedido #{p.ID_PEDIDO}
                            </h4>
                            {loadingDetalle && !detalles[p.ID_PEDIDO] ? (
                              <p className="text-sm text-gray-500">Cargando productos...</p>
                            ) : (
                              <table className="w-full text-sm bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                                <thead className="bg-gray-100/50 text-gray-600 text-xs uppercase">
                                  <tr>
                                    <th className="px-4 py-3">Cód.</th>
                                    <th className="px-4 py-3">Producto</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3 text-right">Costo U.</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {detalles[p.ID_PEDIDO]?.length > 0 ? (
                                    detalles[p.ID_PEDIDO].map(d => (
                                      <tr key={d.ID_PEDIDO_DET} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 text-gray-500">{d.CODIGO_PRODUCTO}</td>
                                        <td className="px-4 py-3 font-medium text-gray-800">{d.PRODUCTO}</td>
                                        <td className="px-4 py-3 text-right">{d.CANTIDAD_PEDIDA} {d.UNIDAD_MEDIDA}</td>
                                        <td className="px-4 py-3 text-right">${parseFloat(d.COSTO_UNITARIO).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-right font-medium text-blue-700">${parseFloat(d.SUBTOTAL_LINEA).toFixed(2)}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="5" className="px-4 py-6 text-center text-gray-500">No hay productos en este pedido</td>
                                    </tr>
                                  )}
                                  {detalles[p.ID_PEDIDO]?.length > 0 && (
                                    <tr className="bg-blue-50/30">
                                      <td colSpan="4" className="px-4 py-3 text-right font-semibold text-gray-700">Total:</td>
                                      <td className="px-4 py-3 text-right font-bold text-blue-800">
                                        ${detalles[p.ID_PEDIDO].reduce((sum, item) => sum + parseFloat(item.SUBTOTAL_LINEA), 0).toFixed(2)}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {pedidos.length === 0 && !loading && (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">No hay pedidos registrados</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Alta de Pedido de Stock</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="pedidoForm" onSubmit={handleSave} className="space-y-6">
                
                {/* Cabecera */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Distribuidora *</label>
                    <select 
                      required
                      value={formData.id_distribuidora}
                      onChange={e => setFormData({...formData, id_distribuidora: e.target.value})}
                      className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 bg-white border"
                    >
                      <option value="">Seleccione una distribuidora</option>
                      {distribuidoras.map(d => (
                        <option key={d.ID_DISTRIBUIDORA} value={d.ID_DISTRIBUIDORA}>
                          {d.ID_DISTRIBUIDORA} - {d.DESCRIPCION || d.ID_PERSONA}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Observación</label>
                    <input 
                      type="text"
                      value={formData.observacion}
                      onChange={e => setFormData({...formData, observacion: e.target.value})}
                      className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                      placeholder="Ej. Pedido urgente..."
                    />
                  </div>
                </div>

                {/* Detalle */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800">Productos a Comprar</h4>
                    <button 
                      type="button" 
                      onClick={handleAddItem}
                      className="text-sm flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-medium transition-colors border border-blue-100"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Añadir Producto
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex flex-wrap md:flex-nowrap gap-3 items-end bg-white p-3 rounded-xl border border-gray-200 shadow-sm relative group">
                        <div className="flex-1 min-w-[200px]">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Producto</label>
                          <select 
                            required
                            value={item.id_producto}
                            onChange={e => handleItemChange(index, 'id_producto', e.target.value)}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm border"
                          >
                            <option value="">Seleccionar...</option>
                            {productos.map(p => (
                              <option key={p.ID_PRODUCTO} value={p.ID_PRODUCTO}>
                                {p.CODIGO_PRODUCTO} - {p.DESCRIPCION}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-24">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Cantidad</label>
                          <input 
                            type="number"
                            min="1"
                            required
                            value={item.cantidad}
                            onChange={e => handleItemChange(index, 'cantidad', parseFloat(e.target.value))}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm border text-right"
                          />
                        </div>
                        <div className="w-32">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Costo Unit. ($)</label>
                          <input 
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={item.costo_unitario}
                            onChange={e => handleItemChange(index, 'costo_unitario', parseFloat(e.target.value))}
                            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 text-sm border text-right"
                          />
                        </div>
                        <div className="w-32 pb-2 text-right">
                          <div className="text-xs font-medium text-gray-500 mb-1">Subtotal</div>
                          <div className="font-bold text-gray-800">${(item.cantidad * item.costo_unitario).toFixed(2)}</div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveItem(index)}
                          className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                          title="Quitar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                    {formData.items.length === 0 && (
                      <div className="text-center p-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                        No hay productos en este pedido. Haga clic en "Añadir Producto".
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                form="pedidoForm"
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-md hover:shadow-lg transition-all"
              >
                Guardar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
