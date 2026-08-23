import { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

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

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Listado de Distribuidoras</h2>
        <button onClick={handleCreate} className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700">
          + Nueva Distribuidora
        </button>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-lg shadow">
        {loadingList ? (
          <div className="p-4 text-center">Cargando distribuidoras...</div>
        ) : (
          <table className="min-w-full text-left text-sm whitespace-nowrap">
            <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Razón Social</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Ciudad</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">{row.ID_DISTRIBUIDORA || row.ID_PERSONA}</td>
                  <td className="px-6 py-4">{row.APELLIDO}</td>
                  <td className="px-6 py-4">{row.TELEFONO}</td>
                  <td className="px-6 py-4">{row.EMAIL}</td>
                  <td className="px-6 py-4">{row.DESC_CIUDAD || row.ID_CIUDAD}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleEdit(row)} className="text-indigo-600 hover:text-indigo-900 mr-3">Editar</button>
                    <button onClick={() => handleDelete(row.ID_PERSONA)} className="text-red-600 hover:text-red-900">Eliminar</button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-50 transition-all duration-300">
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
            
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">Cancelar</button>
              <button type="submit" form="form-distribuidora" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
                {saving ? 'Guardando...' : 'Guardar Distribuidora'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
