import React, { useState } from 'react';
import { useSortableData } from '../hooks/useSortableData';

export default function TablaParametrica({ data, onEdit, onDelete, onAdd, title, description, fields = [], selectOptions = {} }) {
  const [searchTerm, setSearchTerm] = useState('');

  if (!data || data.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in flex flex-col h-full">
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <p className="text-gray-500 text-sm mt-1">{description}</p>
          </div>
          <button onClick={onAdd} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nuevo Registro
          </button>
        </div>
        <div className="p-8 text-center text-gray-500 bg-white rounded-2xl shadow-sm border border-gray-100">
          No hay registros disponibles.
        </div>
      </div>
    );
  }

  const CAMPOS_OCULTOS = ['USUARIO_ALTA', 'FECHA_ALTA', 'USUARIO_MOD', 'FECHA_MOD', 'ID_UNIDAD_MEDIDA', 'ID_TIPO_PRESENTACION'];
  
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

  const { items: sortedData, requestSort, getSortIcon } = useSortableData(filteredData, { key: columns[0], direction: 'asc' });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">{description}</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg font-medium cursor-pointer">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nuevo Registro
        </button>
      </div>

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

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="uppercase tracking-wider border-b-2 border-gray-200 bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-6 py-4 cursor-pointer hover:bg-gray-200 transition-colors"
                onClick={() => requestSort(col)}
              >
                {col.replace('_', ' ')}{getSortIcon(col)}
              </th>
            ))}
            <th scope="col" className="px-6 py-4">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => {
            const pkValue = row[columns[0]] || index;
            return (
            <tr key={pkValue} className="border-b border-gray-100 hover:bg-gray-50">
              {columns.map((col) => (
                <td key={`${pkValue}-${col}`} className="px-6 py-4">
                  {renderCell(col, row[col])}
                </td>
              ))}
              <td className="px-6 py-4 flex gap-2">
                <button
                  onClick={() => onEdit(row)}
                  className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  Editar
                </button>
              </td>
            </tr>
          )})}
        </tbody>
      </table>
      </div>
    </div>
    </div>
  );
}
