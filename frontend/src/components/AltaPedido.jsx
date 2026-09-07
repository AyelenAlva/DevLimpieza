import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Select from 'react-select';
import { useSortableData } from '../hooks/useSortableData';

const API_BASE = import.meta.env.PROD 
  ? '../api/index.php' 
  : 'http://hispaniaimports.com/DEV_Limpieza/api/index.php';

export default function AltaPedido({ apiBase, setError, showSuccess }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [detalles, setDetalles] = useState({});
  const [recepciones, setRecepciones] = useState({});
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecepcionModalOpen, setIsRecepcionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [distribuidoras, setDistribuidoras] = useState([]);
  const [productos, setProductos] = useState([]);
  const [estadosRecepcion, setEstadosRecepcion] = useState([]);
  
  // Form state para Pedido
  const [formData, setFormData] = useState({
    id_distribuidora: '',
    observacion: '',
    items: [] 
  });

  // Form state para Recepcion
  const [recepcionData, setRecepcionData] = useState({
    id_pedido: '',
    id_estado_cabecera: '',
    observaciones: '',
    detalles: []
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
      const [resDist, resProd, resEst] = await Promise.all([
        axios.get(`${API_BASE}?tabla=vw_distribuidora`),
        axios.get(`${API_BASE}?tabla=producto`),
        axios.get(`${API_BASE}?tabla=estado`)
      ]);
      setDistribuidoras(resDist.data);
      setProductos(resProd.data);
      setEstadosRecepcion(resEst.data.filter(e => e.TIPO_ESTADO === 'RECEPCION_STOCK' || e.tipo_estado === 'RECEPCION_STOCK'));
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

        const p = pedidos.find(x => x.ID_PEDIDO === idPedido);
        if (p && p.TIENE_RECEPCION) {
          const resRec = await axios.get(`${API_BASE}?action=recepcion&id_pedido=${idPedido}`);
          setRecepciones(prev => ({ ...prev, [idPedido]: resRec.data }));
        }
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

  const handleOpenRecepcionModal = async (pedido) => {
    // Buscar detalles del pedido si no los tenemos
    let det = detalles[pedido.ID_PEDIDO];
    if (!det) {
      const res = await axios.get(`${API_BASE}?action=pedido&id_pedido=${pedido.ID_PEDIDO}`);
      det = res.data;
      setDetalles(prev => ({ ...prev, [pedido.ID_PEDIDO]: det }));
    }

    setRecepcionData({
      id_pedido: pedido.ID_PEDIDO,
      id_estado_cabecera: '',
      observaciones: '',
      detalles: det.map(d => ({
        id_pedido_det: d.ID_PEDIDO_DET,
        id_producto: d.ID_PRODUCTO,
        codigo_producto: d.CODIGO_PRODUCTO,
        producto_nombre: d.PRODUCTO,
        cantidad_recibida: d.CANTIDAD_PEDIDA,
        costo_unitario_real: d.COSTO_UNITARIO
      }))
    });
    setIsRecepcionModalOpen(true);
  };

  const handleRecepcionItemChange = (index, field, value) => {
    const newDetalles = [...recepcionData.detalles];
    newDetalles[index][field] = value;
    setRecepcionData({ ...recepcionData, detalles: newDetalles });
  };

  const handleSaveRecepcion = async (e) => {
    e.preventDefault();
    if (!recepcionData.id_estado_cabecera) return setError("🚨 Error: Seleccione el estado de la recepción");

    for (let det of recepcionData.detalles) {
      if (det.cantidad_recibida < 0 || det.costo_unitario_real < 0) {
        return setError("🚨 Error: No puede ingresar cantidades o costos negativos.");
      }
    }

    try {
      const res = await axios.post(`${API_BASE}?action=recepcion`, recepcionData);
      setIsRecepcionModalOpen(false);
      await fetchPedidos();
      // Refrescar el expand si estaba abierto o limpiarlo de la caché
      if (expandedId === recepcionData.id_pedido) {
        setExpandedId(null);
      }
      setDetalles(prev => { const c = {...prev}; delete c[recepcionData.id_pedido]; return c; });
      setRecepciones(prev => { const c = {...prev}; delete c[recepcionData.id_pedido]; return c; });
      
      showSuccess(res.data.message || 'Recepción guardada correctamente');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error al guardar la recepción");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.id_distribuidora) return setError("🚨 Error: Seleccione una distribuidora");
    if (formData.items.length === 0) return setError("🚨 Error: Agregue al menos un producto");
    
    for (let item of formData.items) {
      if (!item.id_producto) return setError("🚨 Error: Hay productos sin seleccionar en la lista.");
      if (item.cantidad <= 0 || item.costo_unitario < 0) {
        return setError("🚨 Error: No puede ingresar cantidades cero/negativas o costos negativos.");
      }
    }
    
    try {
      await axios.post(`${API_BASE}?action=pedido`, {
        id_distribuidora: formData.id_distribuidora,
        observacion: formData.observacion,
        detalles: formData.items
      });
      setIsModalOpen(false);
      showSuccess("Pedido guardado correctamente");
      fetchPedidos();
    } catch (err) {
      console.error(err);
      setError("Error al guardar el pedido");
    }
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

  const filteredPedidos = pedidos.filter(row => 
    Object.values(row).some(val => 
      val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const { items: sortedPedidos, requestSort, getSortIcon } = useSortableData(filteredPedidos, { key: 'ID_PEDIDO', direction: 'desc' });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Pedidos de Stock</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de pedidos</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Pedido
        </button>
      </div>

      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Buscar por distribuidora, usuario, estado..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
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
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('ID_PEDIDO')}>ID{getSortIcon('ID_PEDIDO')}</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('DISTRIBUIDORA')}>Distribuidora{getSortIcon('DISTRIBUIDORA')}</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('ESTADO_PEDIDO')}>Estado{getSortIcon('ESTADO_PEDIDO')}</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('FECHA_PEDIDO')}>Fecha Pedido{getSortIcon('FECHA_PEDIDO')}</th>
                  <th className="px-6 py-4">Observación</th>
                  <th className="px-6 py-4">Recepción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedPedidos.map((p) => (
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
                      <td className="px-6 py-4 font-medium text-gray-900">{p.ID_PEDIDO}</td>
                      <td className="px-6 py-4">{p.DISTRIBUIDORA}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${p.ESTADO_PEDIDO === 'COMPLETA' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                          {p.ESTADO_PEDIDO || p.CODIGO}
                        </span>
                      </td>
                      <td className="px-6 py-4">{p.FECHA_PEDIDO}</td>
                      <td className="px-6 py-4 text-gray-500 truncate max-w-xs">{p.OBSERVACION}</td>
                      <td className="px-6 py-4">
                        {!p.TIENE_RECEPCION ? (
                          <button 
                            onClick={() => handleOpenRecepcionModal(p)}
                            className="text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1 bg-green-50 px-3 py-1 rounded-full text-xs font-semibold hover:bg-green-100" 
                            title="Registrar Recepción"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Recibir
                          </button>
                        ) : (
                          <span className="text-green-600 font-bold text-xs flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            RECIBIDO
                          </span>
                        )}
                      </td>
                    </tr>
                    
                    {/* Fila expandible para el detalle */}
                    {expandedId === p.ID_PEDIDO && (
                      <tr className="bg-gray-50/50">
                        <td colSpan="7" className="p-0 border-b border-gray-200">
                          <div className="p-6 pl-16 border-l-4 border-blue-500">
                            
                            {/* DETALLE PEDIDO */}
                            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                              Detalle del Pedido {p.ID_PEDIDO}
                            </h4>
                            {loadingDetalle && !detalles[p.ID_PEDIDO] ? (
                              <p className="text-sm text-gray-500">Cargando productos...</p>
                            ) : (
                              <table className="w-full text-sm bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
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
                                  {detalles[p.ID_PEDIDO]?.map(d => (
                                    <tr key={d.ID_PEDIDO_DET} className="hover:bg-gray-50/80">
                                      <td className="px-4 py-3 text-gray-500">{d.CODIGO_PRODUCTO}</td>
                                      <td className="px-4 py-3 font-medium text-gray-800">{d.PRODUCTO}</td>
                                      <td className="px-4 py-3 text-right">
                                        <div className="flex flex-col gap-0.5 items-end text-xs">
                                          <div><span className="text-gray-400 font-normal mr-1">Cantidad:</span> <span className="font-medium text-gray-800">{parseFloat(d.CANTIDAD_PEDIDA).toFixed(2)}</span></div>
                                          <div><span className="text-gray-400 font-normal mr-1">Marca:</span> <span className="text-gray-600">{d.MARCA || '-'}</span></div>
                                          <div><span className="text-gray-400 font-normal mr-1">U. Medida:</span> <span className="text-gray-600">{d.UNIDAD_MEDIDA || '-'}</span></div>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right">${parseFloat(d.COSTO_UNITARIO).toFixed(2)}</td>
                                      <td className="px-4 py-3 text-right font-medium text-blue-700">${parseFloat(d.SUBTOTAL_LINEA).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}

                            {/* DETALLE RECEPCION (SI TIENE) */}
                            {p.TIENE_RECEPCION && recepciones[p.ID_PEDIDO] && (
                              <>
                                <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2 mt-4">
                                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  Resultados de la Recepción
                                </h4>
                                <table className="w-full text-sm bg-white rounded-lg shadow-sm border border-green-100 overflow-hidden">
                                  <thead className="bg-green-50 text-green-800 text-xs uppercase">
                                    <tr>
                                      <th className="px-4 py-3">Producto Pedido</th>
                                      <th className="px-4 py-3">Producto Recibido</th>
                                      <th className="px-4 py-3 text-right">Cant. Pedida</th>
                                      <th className="px-4 py-3 text-right">Cant. Recibida</th>
                                      <th className="px-4 py-3 text-right">Costo Real U.($)</th>
                                      <th className="px-4 py-3 text-center">Estado</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {recepciones[p.ID_PEDIDO].map((r, idx) => (
                                      <tr key={idx} className="hover:bg-gray-50/80">
                                        <td className="px-4 py-3 font-medium text-gray-600">{r.DESCRIPCION_PRODUCTO_PEDIDO}</td>
                                        <td className="px-4 py-3 font-medium text-green-700">{r.DESCRIPCION_PRODUCTO_RECIBIDO}</td>
                                        <td className="px-4 py-3 text-right text-gray-500">{r.CANTIDAD_PEDIDA}</td>
                                        <td className="px-4 py-3 text-right font-bold text-gray-800">{r.CANTIDAD_RECIBIDA}</td>
                                        <td className="px-4 py-3 text-right font-bold text-green-700">${parseFloat(r.COSTO_UNITARIO_REAL ?? r.COSTO_CAMBIO ?? 0).toFixed(2)}</td>
                                        <td className="px-4 py-3 text-center">
                                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">{r.ESTADO_DETALLE_RECEPCION}</span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL NUEVO PEDIDO */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-gray-900/60 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-[100] transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800">Alta de Pedido de Stock</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <form id="pedidoForm" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Distribuidora *</label>
                    <Select
                      options={distribuidoras.map(d => ({ value: d.ID_DISTRIBUIDORA, label: `${d.ID_DISTRIBUIDORA} - ${d.DISTRIBUIDORA}` }))}
                      value={distribuidoras.map(d => ({ value: d.ID_DISTRIBUIDORA, label: `${d.ID_DISTRIBUIDORA} - ${d.DISTRIBUIDORA}` })).find(o => o.value === formData.id_distribuidora) || null}
                      onChange={opt => setFormData({...formData, id_distribuidora: opt ? opt.value : ''})}
                      placeholder="Buscar distribuidora..."
                      isClearable
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Observación</label>
                    <input 
                      type="text"
                      value={formData.observacion}
                      onChange={e => setFormData({...formData, observacion: e.target.value})}
                      className="w-full rounded-xl border-gray-300 p-2.5 border"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800">Productos a Comprar</h4>
                    <button type="button" onClick={handleAddItem} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100">Añadir Producto</button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.length > 0 && (
                      <div className="flex text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                        <div className="flex-1">Producto</div>
                        <div className="w-24 text-right">Cantidad</div>
                        <div className="w-32 text-right">Costo</div>
                        <div className="w-10"></div>
                      </div>
                    )}
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                        <div className="flex-1">
                          <Select
                            options={productos.map(p => ({ value: p.ID_PRODUCTO, label: p.CODIGO_PRODUCTO ? `${p.CODIGO_PRODUCTO} - ${p.DESCRIPCION}` : p.DESCRIPCION }))}
                            value={productos.map(p => ({ value: p.ID_PRODUCTO, label: p.CODIGO_PRODUCTO ? `${p.CODIGO_PRODUCTO} - ${p.DESCRIPCION}` : p.DESCRIPCION })).find(o => o.value === item.id_producto) || null}
                            onChange={opt => handleItemChange(index, 'id_producto', opt ? opt.value : '')}
                            placeholder="Buscar producto..."
                            isClearable
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          />
                        </div>
                        <input type="number" min="1" required value={item.cantidad} onChange={e => handleItemChange(index, 'cantidad', parseFloat(e.target.value))} className="w-24 border p-2 rounded-lg text-right" placeholder="Cant." />
                        <input type="number" step="0.01" min="0" required value={item.costo_unitario} onChange={e => handleItemChange(index, 'costo_unitario', parseFloat(e.target.value))} className="w-32 border p-2 rounded-lg text-right" placeholder="Costo" />
                        <button type="button" onClick={() => handleRemoveItem(index)} className="w-10 text-red-500 hover:bg-red-50 py-2 rounded-lg flex justify-center">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-gray-50/80 rounded-b-2xl flex justify-end gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-300">Cancelar</button>
              <button type="submit" form="pedidoForm" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium">Guardar Pedido</button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* MODAL RECEPCION */}
      {isRecepcionModalOpen && createPortal(
        <div className="fixed inset-0 bg-gray-900/60 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-[100] transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-scale-in border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-green-800 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Recepción del Pedido {recepcionData.id_pedido}
              </h3>
              <button onClick={() => setIsRecepcionModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <form id="recepcionForm" onSubmit={handleSaveRecepcion} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado de Recepción *</label>
                    <select 
                      required
                      value={recepcionData.id_estado_cabecera}
                      onChange={e => setRecepcionData({...recepcionData, id_estado_cabecera: e.target.value})}
                      className="w-full rounded-xl border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2.5 border"
                    >
                      <option value="">Seleccione estado...</option>
                      {estadosRecepcion.map(e => (
                        <option key={e.ID_ESTADO} value={e.ID_ESTADO}>{e.DESCRIPCION}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Observaciones</label>
                    <input 
                      type="text"
                      value={recepcionData.observaciones}
                      onChange={e => setRecepcionData({...recepcionData, observaciones: e.target.value})}
                      className="w-full rounded-xl border-gray-300 shadow-sm p-2.5 border"
                      placeholder="Faltó mercancía, cajas rotas..."
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-800 mb-3">Detalle de Recepción</h4>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600 font-medium">
                        <tr>
                          <th className="px-4 py-3">Producto Pedido</th>
                          <th className="px-4 py-3">Producto Ingresado</th>
                          <th className="px-4 py-3 text-right">Cant. Recibida</th>
                          <th className="px-4 py-3 text-right">Costo Real U.($)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {recepcionData.detalles.map((det, index) => (
                          <tr key={index} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 text-gray-500 text-xs">
                              <span className="block font-medium">{det.codigo_producto}</span>
                              {det.producto_nombre}
                            </td>
                            <td className="px-4 py-3">
                              <Select
                                options={productos.map(p => ({ value: p.ID_PRODUCTO, label: p.CODIGO_PRODUCTO ? `${p.CODIGO_PRODUCTO} - ${p.DESCRIPCION}` : p.DESCRIPCION }))}
                                value={productos.map(p => ({ value: p.ID_PRODUCTO, label: p.CODIGO_PRODUCTO ? `${p.CODIGO_PRODUCTO} - ${p.DESCRIPCION}` : p.DESCRIPCION })).find(o => o.value === det.id_producto) || null}
                                onChange={opt => handleRecepcionItemChange(index, 'id_producto', opt ? opt.value : '')}
                                placeholder="Buscar..."
                                isClearable
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                              />
                            </td>
                            <td className="px-4 py-3 w-32">
                              <input 
                                type="number" 
                                min="0" 
                                required
                                value={det.cantidad_recibida}
                                onChange={e => handleRecepcionItemChange(index, 'cantidad_recibida', parseFloat(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg p-2 text-right text-sm"
                              />
                            </td>
                            <td className="px-4 py-3 w-32">
                              <input 
                                type="number" 
                                step="0.01" 
                                min="0" 
                                required
                                value={det.costo_unitario_real}
                                onChange={e => handleRecepcionItemChange(index, 'costo_unitario_real', parseFloat(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg p-2 text-right text-sm"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 bg-white rounded-b-2xl flex justify-end gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <button type="button" onClick={() => setIsRecepcionModalOpen(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 font-medium">Cancelar</button>
              <button type="submit" form="recepcionForm" className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-medium shadow-md hover:bg-green-700">Confirmar Recepción</button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
