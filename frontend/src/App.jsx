import { useState, useEffect } from 'react';
import axios from 'axios';
import TablaParametrica from './components/TablaParametrica';
import FormularioModal from './components/FormularioModal';
import AltaCliente from './components/AltaCliente';
import AltaEmpleado from './components/AltaEmpleado';
import AltaDistribuidora from './components/AltaDistribuidora';

// Configuración de las tablas paramétricas y los campos de negocio editables en los formularios
const TABLAS = [
  { 
    id: 'ciudad', 
    label: 'Ciudades', 
    fields: [
      { name: 'NOMBRE', label: 'Nombre', type: 'text' },
      { name: 'CONDADO', label: 'Condado', type: 'text' },
      { name: 'ID_ESTADO_USA', label: 'Estado USA', type: 'select', endpoint: 'estado_usa' }
    ] 
  },
  { 
    id: 'estado', 
    label: 'Estados', 
    fields: [
      { name: 'TIPO_ESTADO', label: 'Tipo Estado', type: 'text' },
      { name: 'CODIGO', label: 'Código', type: 'text' },
      { name: 'DESCRIPCION', label: 'Descripción', type: 'text' }
    ] 
  },
  { id: 'estado_usa', label: 'Estados USA', fields: [{ name: 'NOMBRE', label: 'Nombre', type: 'text' }] },
  { id: 'funcion', label: 'Funciones', fields: [{ name: 'DESCRIPCION', label: 'Descripción', type: 'text' }] },
  { id: 'origen_cliente', label: 'Orígenes Cliente', fields: [{ name: 'DESCRIPCION', label: 'Descripción', type: 'text' }] },
  { id: 'tipo_pago', label: 'Tipos de Pago', fields: [{ name: 'DESCRIPCION', label: 'Descripción', type: 'text' }] },
  { id: 'tipo_servicio', label: 'Tipos de Servicio', fields: [{ name: 'DESCRIPCION', label: 'Descripción', type: 'text' }] }
];

const API_BASE = import.meta.env.PROD 
  ? '../api/index.php' 
  : 'http://hispaniaimports.com/DEV_Limpieza/api/index.php';

function App() {
  const [activeTab, setActiveTab] = useState(TABLAS[0].id);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Estados del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemEdit, setItemEdit] = useState(null);
  
  // Opciones para campos de tipo select
  const [selectOptions, setSelectOptions] = useState({});

  // Fetch de datos al cambiar de tabla
  useEffect(() => {
    fetchData(activeTab);
    loadSelectOptions(activeTab);
  }, [activeTab]);

  const loadSelectOptions = async (tabla) => {
    const fields = TABLAS.find(t => t.id === tabla)?.fields || [];
    fields.forEach(async (field) => {
      if (field.type === 'select' && field.endpoint) {
        try {
          const res = await axios.get(`${API_BASE}?tabla=${field.endpoint}`);
          setSelectOptions(prev => ({ ...prev, [field.name]: res.data }));
        } catch (err) {
          console.error(`Error loading options for ${field.name}`, err);
        }
      }
    });
  };

  const fetchData = async (tabla) => {
    if (tabla.startsWith('alta_')) return; // No fetch for forms
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE}?tabla=${tabla}`);
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError('Error al obtener los datos. Verifica la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    console.log('Clic en + Nuevo Registro. Abriendo modal...');
    setItemEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setItemEdit(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este registro?')) return;
    
    try {
      await axios.delete(`${API_BASE}?tabla=${activeTab}&id=${id}`);
      showSuccess('Registro eliminado correctamente');
      fetchData(activeTab); // Recargar
    } catch (err) {
      console.error(err);
      setError('Error al eliminar el registro');
    }
  };

  const handleSave = async (formData) => {
    try {
      if (itemEdit) {
        // PUT para actualizar. Buscamos la clave primaria dinámica (ej. ID_CIUDAD)
        const pkName = Object.keys(itemEdit)[0];
        const pkValue = itemEdit[pkName];
        await axios.put(`${API_BASE}?tabla=${activeTab}&id=${pkValue}`, formData);
        showSuccess('Registro actualizado correctamente');
      } else {
        // POST para crear
        await axios.post(`${API_BASE}?tabla=${activeTab}`, formData);
        showSuccess('Registro creado correctamente');
      }
      setIsModalOpen(false);
      fetchData(activeTab);
    } catch (err) {
      console.error(err);
      setError('Error al guardar el registro');
    }
  };

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 bg-gray-800 text-center font-bold text-xl">
          Paramétricas
        </div>
        <nav className="flex-1 overflow-y-auto mt-4">
          <ul className="space-y-1">
            {TABLAS.map(tabla => (
              <li key={tabla.id}>
                <button
                  onClick={() => setActiveTab(tabla.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${activeTab === tabla.id ? 'bg-indigo-600 border-l-4 border-indigo-300' : ''}`}
                >
                  {tabla.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 bg-gray-800 text-center font-bold text-xl border-t border-gray-700">
          Gestión de Personas
        </div>
        <nav className="flex-1 overflow-y-auto mt-2">
          <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveTab('alta_cliente')}
                className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${activeTab === 'alta_cliente' ? 'bg-indigo-600 border-l-4 border-indigo-300' : ''}`}
              >
                Alta Clientes
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('alta_empleado')}
                className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${activeTab === 'alta_empleado' ? 'bg-indigo-600 border-l-4 border-indigo-300' : ''}`}
              >
                Alta Empleados
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('alta_distribuidora')}
                className={`w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors ${activeTab === 'alta_distribuidora' ? 'bg-indigo-600 border-l-4 border-indigo-300' : ''}`}
              >
                Alta Distribuidoras
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            {activeTab === 'alta_cliente' ? 'Alta de Cliente' :
             activeTab === 'alta_empleado' ? 'Alta de Empleado' :
             activeTab === 'alta_distribuidora' ? 'Alta de Distribuidora' :
             TABLAS.find(t => t.id === activeTab)?.label}
          </h1>
          {!activeTab.startsWith('alta_') && (
            <button
              onClick={handleCreate}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 shadow flex items-center transition-colors"
            >
              + Nuevo Registro
            </button>
          )}
        </header>

        {/* Alerts & Messages */}
        <div className="px-6 pt-4">
          {error && (
            <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg" role="alert">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-4 mb-4 text-green-700 bg-green-100 rounded-lg" role="alert">
              {successMsg}
            </div>
          )}
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {activeTab === 'alta_cliente' ? (
            <AltaCliente apiBase={API_BASE} />
          ) : activeTab === 'alta_empleado' ? (
            <AltaEmpleado apiBase={API_BASE} />
          ) : activeTab === 'alta_distribuidora' ? (
            <AltaDistribuidora apiBase={API_BASE} />
          ) : loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <TablaParametrica
              data={data}
              onEdit={handleEdit}
              onDelete={handleDelete}
              fields={TABLAS.find(t => t.id === activeTab)?.fields || []}
              selectOptions={selectOptions}
            />
          )}
        </div>
      </main>

      {/* Modal form */}
      <FormularioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        itemEdit={itemEdit}
        fields={TABLAS.find(t => t.id === activeTab)?.fields || []}
        selectOptions={selectOptions}
      />
      
    </div>
  );
}

export default App;
