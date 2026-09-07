import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select from 'react-select';

const API_BASE = 'http://localhost:3000/api';

export default function FormularioModal({ isOpen, onClose, onSave, itemEdit, fields = [], selectOptions = {} }) {
  const [formData, setFormData] = useState({});

  // Cuando se abre el modal, reiniciamos el formulario
  useEffect(() => {
    if (itemEdit) {
      setFormData(itemEdit);
    } else {
      // Iniciar form vacío solo con los campos de negocio configurados
      const emptyForm = {};
      fields.forEach(f => { emptyForm[f.name] = ''; });
      setFormData(emptyForm);
    }
  }, [itemEdit, isOpen, fields]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        
        <div 
          className="fixed inset-0 transition-opacity bg-gray-900/60 backdrop-filter backdrop-blur-sm" 
          aria-hidden="true" 
          onClick={onClose}
        ></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-2xl shadow-2xl text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-scale-in">
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
              {itemEdit ? `Editar Registro #${itemEdit[Object.keys(itemEdit)[0]]}` : 'Crear Nuevo Registro'}
            </h3>
            <div className="mt-4">
              <form onSubmit={handleSubmit} id="crud-form">
                
                {fields.map((field) => {
                  return (
                    <div className="mb-4" key={field.name}>
                      <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                        {field.label}
                      </label>

                      {field.type === 'select' ? (
                        <div className="mt-1">
                          <Select
                            options={(selectOptions[field.name] || []).map(opt => ({
                              value: opt.id || opt.ID_ESTADO_USA,
                              label: opt.NOMBRE || opt.nombre || opt.id
                            }))}
                            value={(selectOptions[field.name] || []).map(opt => ({
                              value: opt.id || opt.ID_ESTADO_USA,
                              label: opt.NOMBRE || opt.nombre || opt.id
                            })).find(o => o.value == formData[field.name]) || null}
                            onChange={opt => handleChange({ target: { name: field.name, value: opt ? opt.value : '' } })}
                            placeholder="Selecciona una opción"
                            isClearable
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                          />
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          id={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleChange}
                          className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                          required
                        />
                      )}
                    </div>
                  );
                })}

              </form>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 cursor-pointer transition-colors shadow-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="crud-form"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-md hover:from-blue-700 hover:to-indigo-700 cursor-pointer transition-all"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
