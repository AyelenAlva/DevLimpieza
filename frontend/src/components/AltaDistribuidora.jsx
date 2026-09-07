import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import Select from 'react-select';
import { useSortableData } from '../hooks/useSortableData';

export default function AltaDistribuidora({ apiBase }) {
  const [data, setData] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id_persona: '', razon_social: '', telefono: '', email: '', direccion: '', id_ciudad: ''
  });

  const [ciudades, setCiudades] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadList = async () => {
    setLoadingList(true);
    try {
      const res = await axios.get(`${apiBase}?action=crud_distribuidora`);
      setData(res.data);
    } catch (err) {
      console.error('Error cargando lista de distribuidoras', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    loadList();
    const loadCiudades = async () => {
      try {
        const res = await axios.get(`${apiBase}?tabla=ciudad`);
        setCiudades(res.data);
      } catch (err) {
        console.error('Error cargando ciudades:', err);
      }
    };
    loadCiudades();
  }, [apiBase]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCreate = () => {
    setFormData({ id_persona: '', razon_social: '', telefono: '', email: '', direccion: '', id_ciudad: '' });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (row) => {
    setFormData({
      id_persona: row.ID_PERSONA,
      id_distribuidora: row.ID_DISTRIBUIDORA,
      razon_social: row.APELLIDO || '',
      telefono: row.TELEFONO || '',
      email: row.EMAIL || '',
      direccion: row.DIRECCION || '',
      id_ciudad: row.ID_CIUDAD || ''
    });
    setMessage(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta distribuidora?')) return;
    try {
      await axios.delete(`${apiBase}?action=crud_distribuidora&id=${id}`);
      alert('Distribuidora eliminada correctamente.');
      loadList();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (formData.id_persona) {
        await axios.put(`${apiBase}?action=crud_distribuidora&id=${formData.id_distribuidora}`, {
          ...formData, tipo_persona: 'J', apellido_razon: formData.razon_social
        });
        alert('Distribuidora actualizada exitosamente.');
      } else {
        const res = await axios.post(`${apiBase}?action=alta_distribuidora`, formData);
        alert(res.data.message || 'Distribuidora registrada exitosamente.');
      }
      setIsModalOpen(false);
      loadList(); // Recargar lista
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Error al guardar distribuidora.' });
    } finally {
      setSaving(false);
    }
  };

  const filteredData = data.filter(row => 
    Object.values(row).some(val => 
      val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const { items: sortedData, requestSort, getSortIcon } = useSortableData(filteredData, { key: 'ID_DISTRIBUIDORA', direction: 'desc' });

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-full">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Distribuidoras</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de proveedores y distribuidoras</p>
        </div>
        <button onClick={handleCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nueva Distribuidora
        </button>
      </div>

      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono, email, etc..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-2xl shadow-sm border border-gray-100">
        {loadingList ? (
          <div className="p-4 text-center">Cargando distribuidoras...</div>
        ) : (
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('ID_DISTRIBUIDORA')}>ID{getSortIcon('ID_DISTRIBUIDORA')}</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('APELLIDO')}>Razón Social{getSortIcon('APELLIDO')}</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('TELEFONO')}>Teléfono{getSortIcon('TELEFONO')}</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('EMAIL')}>Email{getSortIcon('EMAIL')}</th>
                <th className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors" onClick={() => requestSort('DESC_CIUDAD')}>Ciudad{getSortIcon('DESC_CIUDAD')}</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">{row.ID_DISTRIBUIDORA || row.ID_PERSONA}</td>
                  <td className="px-6 py-4">{row.APELLIDO}</td>
                  <td className="px-6 py-4">{row.TELEFONO}</td>
                  <td className="px-6 py-4">{row.EMAIL}</td>
                  <td className="px-6 py-4">{row.DESC_CIUDAD || row.ID_CIUDAD}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={() => handleEdit(row)} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No hay distribuidoras registradas.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-gray-900/60 backdrop-filter backdrop-blur-sm flex items-center justify-center z-[100] transition-all duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">{formData.id_persona ? 'Editar Distribuidora' : 'Alta de Nueva Distribuidora'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-500 text-2xl">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {message && <div className="p-4 mb-4 rounded bg-red-100 text-red-800">{message.text}</div>}
              
              <form id="form-distribuidora" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Razón Social *</label>
                  <input type="text" name="razon_social" value={formData.razon_social} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                    <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ciudad</label>
                  <Select
                    options={ciudades.map(c => ({ value: c.ID_CIUDAD, label: c.NOMBRE }))}
                    value={ciudades.map(c => ({ value: c.ID_CIUDAD, label: c.NOMBRE })).find(o => o.value == formData.id_ciudad) || null}
                    onChange={opt => handleChange({ target: { name: 'id_ciudad', value: opt ? opt.value : '' } })}
                    placeholder="Ninguna / Opcional"
                    isClearable
                    menuPortalTarget={document.body}
                    styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                  />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setIsModalOpen(false)} type="button" className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 cursor-pointer transition-colors shadow-sm">Cancelar</button>
              <button type="submit" form="form-distribuidora" disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md hover:from-blue-700 hover:to-indigo-700 cursor-pointer transition-all disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar Distribuidora'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
