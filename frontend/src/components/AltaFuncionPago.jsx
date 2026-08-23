import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AltaFuncionPago({ apiBase, setError, showSuccess }) {
  const [data, setData] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [funciones, setFunciones] = useState([]);
  const [tiposPago, setTiposPago] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    id_funcion: '',
    id_tipo_pago: '',
    fecha_desde: '',
    fecha_hasta: '',
    monto: ''
  });
  
  // Original state for editing
  const [oldData, setOldData] = useState({});

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const fetchData = async () => {
    try {
      setLoadingList(true);
      const res = await axios.get(`${apiBase}?action=funcion_pago`);
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Error al cargar la lista de funciones de pago');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const resFunc = await axios.get(`${apiBase}?tabla=funcion`);
      setFunciones(resFunc.data);
      
      const resTipo = await axios.get(`${apiBase}?tabla=tipo_pago`);
      setTiposPago(resTipo.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = () => {
    setFormData({
      id_funcion: '',
      id_tipo_pago: '',
      fecha_desde: '',
      fecha_hasta: '',
      monto: ''
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setFormData({
      id_funcion: row.ID_FUNCION || '',
      id_tipo_pago: row.ID_TIPO_PAGO || '',
      fecha_desde: row.FECHA_DESDE || '',
      fecha_hasta: row.FECHA_HASTA || '',
      monto: row.MONTO || ''
    });
    setOldData({
      id_funcion: row.ID_FUNCION,
      id_tipo_pago: row.ID_TIPO_PAGO,
      id_funcion_pago: row.ID_FUNCION_PAGO // asumiendo que la vista devuelve el PK o se usa el id_funcion
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        // Enviar old_id_funcion y old_id_tipo_pago
        const payload = {
          ...formData,
          old_id_funcion: oldData.id_funcion,
          old_id_tipo_pago: oldData.id_tipo_pago
        };
        // Use a dummy ID or the ID_FUNCION_PAGO if exists
        const pk = oldData.id_funcion_pago || oldData.id_funcion;
        await axios.put(`${apiBase}?action=funcion_pago&id=${pk}`, payload);
      } else {
        await axios.post(`${apiBase}?action=funcion_pago`, formData);
      }
      setIsModalOpen(false);
      showSuccess(isEditing ? 'Pago por función actualizado correctamente' : 'Pago por función creado correctamente');
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar');
    }
  };

  // Helper para mostrar nombres en grilla
  const getFuncionName = (id) => funciones.find(f => f.ID_FUNCION == id)?.DESCRIPCION || id;
  const getTipoPagoName = (id) => tiposPago.find(t => t.ID_TIPO_PAGO == id)?.DESCRIPCION || id;

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Listado de Pago por Función</h2>
        <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700">
          + Nuevo Registro
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-lg shadow">
        {loadingList ? (
          <div className="p-4 text-center">Cargando datos...</div>
        ) : (
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4">Función</th>
                <th className="px-6 py-4">Tipo de Pago</th>
                <th className="px-6 py-4">Monto</th>
                <th className="px-6 py-4">Fecha Desde</th>
                <th className="px-6 py-4">Fecha Hasta</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">{row.FUNCION || getFuncionName(row.ID_FUNCION)}</td>
                  <td className="px-6 py-4">{row.TIPO_PAGO || getTipoPagoName(row.ID_TIPO_PAGO)}</td>
                  <td className="px-6 py-4">${row.MONTO}</td>
                  <td className="px-6 py-4">{row.FECHA_DESDE}</td>
                  <td className="px-6 py-4">{row.FECHA_HASTA}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleEdit(row)} className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Editar Pago por Función' : 'Nuevo Pago por Función'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Función *</label>
                <select name="id_funcion" value={formData.id_funcion} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Seleccione...</option>
                  {funciones.map(f => (
                    <option key={f.ID_FUNCION} value={f.ID_FUNCION}>{f.DESCRIPCION}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pago *</label>
                <select name="id_tipo_pago" value={formData.id_tipo_pago} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">Seleccione...</option>
                  {tiposPago.map(t => (
                    <option key={t.ID_TIPO_PAGO} value={t.ID_TIPO_PAGO}>{t.DESCRIPCION}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Desde *</label>
                <input type="date" name="fecha_desde" value={formData.fecha_desde} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Hasta</label>
                  <input type="date" name="fecha_hasta" value={formData.fecha_hasta} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
                <input type="number" step="0.01" name="monto" value={formData.monto} onChange={handleChange} required className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium">
                  Cancelar
                </button>
                <button type="submit" className="px-5 py-2.5 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl font-medium shadow-md">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
