import React from 'react';

export default function TablaParametrica({ data, onEdit, onDelete, fields = [], selectOptions = {} }) {
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

  return (
    <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                scope="col"
                className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 uppercase tracking-wider"
              >
                {col.replace('_', ' ')}
              </th>
            ))}
            <th scope="col" className="relative px-3 py-3.5">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row, index) => {
            const pkValue = row[columns[0]] || index;
            return (
            <tr key={pkValue} className="hover:bg-gray-50">
              {columns.map((col) => (
                <td key={`${pkValue}-${col}`} className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {renderCell(col, row[col])}
                </td>
              ))}
              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                <button
                  onClick={() => onEdit(row)}
                  className="text-indigo-600 hover:text-indigo-900 mr-4"
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
  );
}
