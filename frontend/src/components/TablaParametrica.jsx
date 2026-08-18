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
          {data.map((row, index) => {
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
  );
}
