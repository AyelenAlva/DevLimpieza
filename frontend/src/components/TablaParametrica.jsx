import React, { useState } from 'react';

export default function TablaParametrica({ data, onEdit, onDelete, fields = [], selectOptions = {} }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!data || data.length === 0) {
    return <div className="p-4 text-center text-gray-500">No hay registros disponibles.</div>;
  }

  const CAMPOS_OCULTOS = ['USUARIO_ALTA', 'FECHA_ALTA', 'USUARIO_MOD', 'FECHA_MOD'];
  
  // Extraer las columnas dinámicas de la primera fila excluyendo las de auditoría
  const columns = Object.keys(data[0]).filter(key => !CAMPOS_OCULTOS.includes(key));

  const renderCell = (col, value) => {
    const fieldConf = fields.find(f => f.name === col);
    if (fieldConf && fieldConf.type === 'select') {
      const opts = selectOptions[fieldConf.name] || [];
      const matched = opts.find(o => (o.id || o.ID_ESTADO_USA) == value);
      return matched ? (matched.NOMBRE || matched.nombre || matched.id) : value;
    }
    return value;
  };

  const filteredData = data.filter(row => 
    Object.values(row).some(val => 
      val && String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full relative">
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full md:w-1/3 pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <div className="flex-1 overflow-auto bg-white rounded-lg shadow">
        <table className="min-w-full text-left text-sm whitespace-nowrap">
        <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-6 py-4"
              >
                {col.replace('_', ' ')}
              </th>
            ))}
            <th scope="col" className="px-6 py-4">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, index) => {
            const pkValue = row[columns[0]] || index;
            return (
            <tr key={pkValue} className="border-b border-gray-100 hover:bg-gray-50">
              {columns.map((col) => (
                <td key={`${pkValue}-${col}`} className="px-6 py-4">
                  {renderCell(col, row[col])}
                </td>
              ))}
              <td className="px-6 py-4">
                <button
                  onClick={() => onEdit(row)}
                  className="text-indigo-600 hover:text-indigo-900 mr-3"
                >
                  Editar
                </button>
                <button
                  onClick={() => onDelete(pkValue)}
                  className="text-red-600 hover:text-red-900"
                >
                  Eliminar
                </button>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
    </div>
    </div>
  );
}
