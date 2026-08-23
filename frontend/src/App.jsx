import { useState, useEffect } from 'react';
import axios from 'axios';
import TablaParametrica from './components/TablaParametrica';
import FormularioModal from './components/FormularioModal';
import AltaCliente from './components/AltaCliente';
import AltaEmpleado from './components/AltaEmpleado';
import AltaDistribuidora from './components/AltaDistribuidora';
import AltaPedido from './components/AltaPedido';
import AltaFuncionPago from './components/AltaFuncionPago';

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
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ciudad');
  const [openSection, setOpenSection] = useState('gestion'); // 'parametricas' | 'gestion'
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
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Sidebar - Solid Dark theme */}
      <aside className="w-72 bg-[#0B1120] text-gray-300 flex flex-col shadow-2xl relative z-20">
        <div className="p-6 text-center border-b border-gray-800">
          <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300 tracking-tight">
            LIMPIEZA
          </h1>
          <p className="text-xs font-medium text-gray-400 mt-1 uppercase tracking-wider">Sistema de Gestión</p>
        </div>
        
        <button 
          onClick={() => setOpenSection(openSection === 'parametricas' ? null : 'parametricas')}
          className="w-full px-6 py-4 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest mt-2 hover:text-white transition-colors"
        >
          <span>Paramétricas</span>
          <svg className={`w-4 h-4 transition-transform ${openSection === 'parametricas' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div className={`transition-all duration-300 ease-in-out ${openSection === 'parametricas' ? 'opacity-100 max-h-[1000px]' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <nav className="px-4 pb-2">
            <ul className="space-y-1">
            {TABLAS.map(tabla => (
              <li key={tabla.id}>
                <button
                  onClick={() => setActiveTab(tabla.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm ${
                    activeTab === tabla.id 
                      ? 'bg-blue-600/20 text-blue-400 font-semibold' 
                      : 'hover:bg-gray-800/80 hover:text-white'
                  }`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${activeTab === tabla.id ? 'bg-blue-400' : 'bg-transparent'}`}></div>
                  {tabla.label}
                </button>
              </li>
            ))}
            </ul>
          </nav>
        </div>
        
        <button 
          onClick={() => setOpenSection(openSection === 'gestion' ? null : 'gestion')}
          className="w-full px-6 py-4 flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-widest border-t border-gray-800 hover:text-white transition-colors"
        >
          <span>Gestión de Personas</span>
          <svg className={`w-4 h-4 transition-transform ${openSection === 'gestion' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>
        <div className={`transition-all duration-300 ease-in-out ${openSection === 'gestion' ? 'opacity-100 max-h-[1000px]' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <nav className="px-4 pb-4">
            <ul className="space-y-1">
            <li>
              <button
                onClick={() => setActiveTab('alta_cliente')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm ${
                  activeTab === 'alta_cliente' 
                    ? 'bg-blue-600/20 text-blue-400 font-semibold' 
                    : 'hover:bg-gray-800/80 hover:text-white'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'alta_cliente' ? 'bg-blue-400' : 'bg-transparent'}`}></div>
                Alta Clientes
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('alta_empleado')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm ${
                  activeTab === 'alta_empleado' 
                    ? 'bg-blue-600/20 text-blue-400 font-semibold' 
                    : 'hover:bg-gray-800/80 hover:text-white'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'alta_empleado' ? 'bg-blue-400' : 'bg-transparent'}`}></div>
                Alta Empleados
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('alta_distribuidora')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm ${
                  activeTab === 'alta_distribuidora' 
                    ? 'bg-blue-600/20 text-blue-400 font-semibold' 
                    : 'hover:bg-gray-800/80 hover:text-white'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'alta_distribuidora' ? 'bg-blue-400' : 'bg-transparent'}`}></div>
                Alta Distribuidoras
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('alta_pedido')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm ${
                  activeTab === 'alta_pedido' 
                    ? 'bg-blue-600/20 text-blue-400 font-semibold' 
                    : 'hover:bg-gray-800/80 hover:text-white'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'alta_pedido' ? 'bg-blue-400' : 'bg-transparent'}`}></div>
                Alta Pedidos
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('funcion_pago')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-3 text-sm ${
                  activeTab === 'funcion_pago' 
                    ? 'bg-blue-600/20 text-blue-400 font-semibold' 
                    : 'hover:bg-gray-800/80 hover:text-white'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${activeTab === 'funcion_pago' ? 'bg-blue-400' : 'bg-transparent'}`}></div>
                Pago por Función
              </button>
            </li>
          </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
        
        {/* Header */}
        <header className="glass shadow-sm px-8 py-5 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
            {activeTab === 'alta_cliente' ? 'Alta de Cliente' :
             activeTab === 'alta_empleado' ? 'Alta de Empleado' :
             activeTab === 'alta_distribuidora' ? 'Alta de Distribuidora' :
             activeTab === 'alta_pedido' ? 'Alta de Pedido' :
             activeTab === 'funcion_pago' ? 'Pago por Función' :
             TABLAS.find(t => t.id === activeTab)?.label}
          </h1>
          {!activeTab.startsWith('alta_') && activeTab !== 'funcion_pago' && (
            <button
              onClick={handleCreate}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg flex items-center transition-all font-medium gap-2 animate-scale-in"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Nuevo Registro
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
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 custom-scrollbar relative z-0">
          <div className="animate-slide-up h-full">
          {activeTab === 'alta_cliente' ? (
            <AltaCliente apiBase={API_BASE} />
          ) : activeTab === 'alta_empleado' ? (
            <AltaEmpleado apiBase={API_BASE} />
          ) : activeTab === 'alta_distribuidora' ? (
            <AltaDistribuidora apiBase={API_BASE} />
          ) : activeTab === 'alta_pedido' ? (
            <AltaPedido apiBase={API_BASE} />
          ) : activeTab === 'funcion_pago' ? (
            <AltaFuncionPago apiBase={API_BASE} />
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
        </div>

        {/* Footer */}
        <footer className="glass text-center py-3 text-xs text-gray-500 font-medium z-10 border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <p>&copy; {new Date().getFullYear()} Sistema de Gestión de Limpieza. Todos los derechos reservados.</p>
        </footer>
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
