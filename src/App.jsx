import { useState } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { shouldWork, formatDate, generateWhatsAppText, exportData, importData } from './utils/helpers';
import {
  Users, Calendar, Settings, Download, Upload, Trash2, Plus, Edit2, X,
  Menu, GripVertical, Clock, UserPlus, Shield, Zap, Copy, Check
} from 'lucide-react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex items-center gap-2">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-slate-500" />
        </button>
        {children}
      </div>
    </div>
  );
}

// Modal Component
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin border border-slate-800">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// Toast Component
function Toast({ message, isVisible }) {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 animate-bounce z-50">
      <Check className="w-5 h-5" />
      <span className="font-medium">{message}</span>
    </div>
  );
}

function App() {
  // State management
  const [employees, setEmployees] = useLocalStorage('employees', []);
  const [categories, setCategories] = useLocalStorage('categories', [
    { id: 'folga', name: 'Folga', order: 999, fixed: true }
  ]);
  const [schedules, setSchedules] = useLocalStorage('schedules', {});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentView, setCurrentView] = useState('schedule');

  // Modal states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  // Toast state
  const [toast, setToast] = useState({ message: '', isVisible: false });

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    role: '',
    startTime: '07:00',
    endTime: '19:00',
    startDate: new Date().toISOString().split('T')[0],
    shiftPattern: '12x36',
    isSubstitute: false,
    substituteSectors: [],
    isOnCall: false
  });

  const [categoryForm, setCategoryForm] = useState({ name: '' });

  const showToast = (message) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast({ message: '', isVisible: false }), 2000);
  };

  // Get schedule for selected date
  const currentSchedule = schedules[selectedDate] || {};

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Auto-generate schedule
  const autoGenerateSchedule = () => {
    const newSchedule = {};
    const date = new Date(selectedDate);

    // Initialize all categories
    categories.forEach(cat => {
      newSchedule[cat.id] = [];
    });

    const folgaCategory = categories.find(c => c.name === 'Folga');
    const availableSubstitutes = [];

    // First pass: assign fixed employees
    employees.forEach(employee => {
      if (employee.isSubstitute) {
        availableSubstitutes.push(employee);
      } else {
        const works = shouldWork(employee, date);
        if (works) {
          // Find employee's primary sector
          const primarySector = categories.find(c => c.id === employee.primarySector);
          if (primarySector) {
            newSchedule[primarySector.id].push(employee.id);
          }
        } else if (folgaCategory) {
          newSchedule[folgaCategory.id].push(employee.id);
        }
      }
    });

    // Second pass: assign substitutes to empty sectors
    categories.forEach(category => {
      if (category.name === 'Folga' || category.fixed) return;
      
      const employeesInSector = newSchedule[category.id] || [];
      if (employeesInSector.length === 0) {
        // Try to find a substitute for this sector
        const substitute = availableSubstitutes.find(sub => 
          sub.substituteSectors.includes(category.id) && 
          !Object.values(newSchedule).flat().includes(sub.id)
        );
        
        if (substitute) {
          newSchedule[category.id].push(substitute.id);
        }
      }
    });

    // Assign remaining substitutes to folga
    availableSubstitutes.forEach(sub => {
      if (!Object.values(newSchedule).flat().includes(sub.id)) {
        if (folgaCategory) {
          newSchedule[folgaCategory.id].push(sub.id);
        }
      }
    });

    setSchedules({ ...schedules, [selectedDate]: newSchedule });
    showToast('Escala gerada automaticamente!');
  };

  // Handle employee save
  const handleSaveEmployee = () => {
    if (!employeeForm.name.trim() || !employeeForm.role.trim()) {
      alert('Por favor, preencha nome e cargo');
      return;
    }

    if (editingEmployee) {
      setEmployees(employees.map(e => e.id === editingEmployee.id ? { ...employeeForm, id: e.id } : e));
      showToast('Colaborador atualizado!');
    } else {
      const newId = crypto.randomUUID();
      const newEmployee = { ...employeeForm, id: newId };
      setEmployees([...employees, newEmployee]);
      showToast('Colaborador adicionado!');
    }

    resetEmployeeForm();
    setShowEmployeeModal(false);
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      role: '',
      startTime: '07:00',
      endTime: '19:00',
      startDate: new Date().toISOString().split('T')[0],
      shiftPattern: '12x36',
      isSubstitute: false,
      substituteSectors: [],
      isOnCall: false
    });
    setEditingEmployee(null);
  };

  // Handle employee edit
  const handleEditEmployee = (employee) => {
    setEmployeeForm(employee);
    setEditingEmployee(employee);
    setShowEmployeeModal(true);
  };

  // Handle employee delete
  const handleDeleteEmployee = (id) => {
    if (confirm('Deseja realmente excluir este colaborador?')) {
      setEmployees(employees.filter(e => e.id !== id));
      // Remove from all schedules
      const updatedSchedules = { ...schedules };
      Object.keys(updatedSchedules).forEach(date => {
        Object.keys(updatedSchedules[date]).forEach(catId => {
          updatedSchedules[date][catId] = updatedSchedules[date][catId].filter(empId => empId !== id);
        });
      });
      setSchedules(updatedSchedules);
      showToast('Colaborador excluído!');
    }
  };

  // Handle category save
  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) {
      alert('Por favor, preencha o nome da categoria');
      return;
    }

    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: categoryForm.name } : c));
      showToast('Categoria atualizada!');
    } else {
      const newId = crypto.randomUUID();
      const newCategory = {
        id: newId,
        name: categoryForm.name,
        order: categories.length,
        fixed: false
      };
      setCategories([...categories, newCategory]);
      showToast('Categoria adicionada!');
    }

    setCategoryForm({ name: '' });
    setEditingCategory(null);
    setShowCategoryModal(false);
  };

  // Handle category edit
  const handleEditCategory = (category) => {
    setCategoryForm({ name: category.name });
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  // Handle category delete
  const handleDeleteCategory = (id) => {
    const category = categories.find(c => c.id === id);
    if (category?.fixed) {
      alert('Não é possível excluir categorias fixas');
      return;
    }

    if (confirm('Deseja realmente excluir esta categoria?')) {
      setCategories(categories.filter(c => c.id !== id));
      // Remove category from all schedules
      const updatedSchedules = { ...schedules };
      Object.keys(updatedSchedules).forEach(date => {
        delete updatedSchedules[date][id];
      });
      setSchedules(updatedSchedules);
      showToast('Categoria excluída!');
    }
  };

  // Handle category reorder
  const handleCategoryDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      const reordered = arrayMove(categories, oldIndex, newIndex).map((cat, idx) => ({
        ...cat,
        order: idx
      }));
      setCategories(reordered);
    }
  };

  // Handle employee drag between categories
  const handleEmployeeDrag = (employeeId, fromCategoryId, toCategoryId) => {
    const updatedSchedule = { ...currentSchedule };
    
    // Remove from source
    if (updatedSchedule[fromCategoryId]) {
      updatedSchedule[fromCategoryId] = updatedSchedule[fromCategoryId].filter(id => id !== employeeId);
    }
    
    // Add to target
    if (!updatedSchedule[toCategoryId]) {
      updatedSchedule[toCategoryId] = [];
    }
    updatedSchedule[toCategoryId].push(employeeId);
    
    setSchedules({ ...schedules, [selectedDate]: updatedSchedule });
  };

  // Export/Import functions
  const handleExport = () => {
    const data = exportData(employees, categories, schedules);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `escala-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    showToast('Backup exportado!');
  };

  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = importData(e.target.result);
          setEmployees(data.employees);
          setCategories(data.categories);
          setSchedules(data.schedules);
          showToast('Backup importado com sucesso!');
        } catch (error) {
          alert('Erro ao importar arquivo: ' + error.message);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = () => {
    if (confirm('⚠️ ATENÇÃO: Esta ação irá apagar TODOS os dados. Deseja continuar?')) {
      if (confirm('Tem certeza? Esta ação não pode ser desfeita!')) {
        setEmployees([]);
        setCategories([{ id: 'folga', name: 'Folga', order: 999, fixed: true }]);
        setSchedules({});
        showToast('Dados limpos!');
      }
    }
  };

  // Copy WhatsApp text
  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppText(currentSchedule, employees, categories, selectedDate);
    navigator.clipboard.writeText(text);
    showToast('Texto copiado!');
  };

  // Render sidebar/navigation
  const renderNavigation = () => {
    const navItems = [
      { id: 'schedule', icon: Calendar, label: 'Escala' },
      { id: 'employees', icon: Users, label: 'Equipe' },
      { id: 'categories', icon: Settings, label: 'Setores' },
      { id: 'backup', icon: Download, label: 'Backup' },
    ];

    return (
      <>
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-col md:w-64 bg-slate-900 border-r border-slate-800 h-screen">
          <div className="p-6 border-b border-slate-800">
            <h1 className="text-2xl font-bold text-emerald-400">⚡ Escala Pro</h1>
            <p className="text-sm text-slate-400 mt-1">Gestão 24/7</p>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  currentView === item.id
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40">
          <nav className="flex justify-around py-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1 px-4 py-2 ${
                  currentView === item.id ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </>
    );
  };

  // Render schedule view
  const renderScheduleView = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">Escala do Dia</h2>
            <p className="text-slate-400 mt-1">{formatDate(selectedDate)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={autoGenerateSchedule}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Gerar Automático
            </button>
            <button
              onClick={handleCopyWhatsApp}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {categories
            .sort((a, b) => a.order - b.order)
            .map(category => {
              const employeesInCategory = currentSchedule[category.id] || [];
              const isFolga = category.name === 'Folga';

              return (
                <div
                  key={category.id}
                  className={`bg-slate-800 rounded-2xl p-4 border ${
                    isFolga ? 'border-slate-700' : 'border-slate-700'
                  }`}
                >
                  <h3 className="text-lg font-bold text-slate-100 mb-3 flex items-center gap-2">
                    {isFolga ? '🏖️' : '🏢'} {category.name}
                    <span className="text-sm text-slate-400 font-normal">
                      ({employeesInCategory.length})
                    </span>
                  </h3>

                  <div className="space-y-2">
                    {employeesInCategory.length === 0 ? (
                      <p className="text-slate-500 text-sm italic">Nenhum colaborador alocado</p>
                    ) : (
                      employeesInCategory.map(empId => {
                        const employee = employees.find(e => e.id === empId);
                        if (!employee) return null;

                        return (
                          <div
                            key={empId}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('employeeId', empId);
                              e.dataTransfer.setData('fromCategoryId', category.id);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const draggedEmployeeId = e.dataTransfer.getData('employeeId');
                              const fromCategoryId = e.dataTransfer.getData('fromCategoryId');
                              if (draggedEmployeeId !== empId) {
                                handleEmployeeDrag(draggedEmployeeId, fromCategoryId, category.id);
                              }
                            }}
                            className="bg-slate-900 rounded-xl p-3 border border-slate-700 hover:border-emerald-500 transition-colors cursor-move"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                  {employee.isOnCall && <Zap className="w-4 h-4 text-yellow-400" title="Plantonista" />}
                                  {employee.isSubstitute && <Shield className="w-4 h-4 text-blue-400" title="Folguista" />}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-100">{employee.name}</p>
                                  <p className="text-sm text-slate-400">{employee.role}</p>
                                  {!isFolga && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                      <Clock className="w-3 h-3" />
                                      {employee.startTime} - {employee.endTime}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const updatedSchedule = { ...currentSchedule };
                                  updatedSchedule[category.id] = updatedSchedule[category.id].filter(id => id !== empId);
                                  setSchedules({ ...schedules, [selectedDate]: updatedSchedule });
                                }}
                                className="text-slate-500 hover:text-red-400 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Available employees to add */}
                  {!isFolga && (
                    <div className="mt-3">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleEmployeeDrag(e.target.value, 'none', category.id);
                            e.target.value = '';
                          }
                        }}
                        className="w-full bg-slate-900 text-slate-300 px-3 py-2 rounded-lg border border-slate-700 text-sm focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">+ Adicionar colaborador...</option>
                        {employees
                          .filter(emp => !Object.values(currentSchedule).flat().includes(emp.id))
                          .map(emp => (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} - {emp.role}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );

  // Render employees view
  const renderEmployeesView = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-100">Gestão de Equipe</h2>
          <button
            onClick={() => {
              resetEmployeeForm();
              setShowEmployeeModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>

        <div className="space-y-3">
          {employees.length === 0 ? (
            <p className="text-slate-500 text-center py-8">Nenhum colaborador cadastrado</p>
          ) : (
            employees.map(employee => (
              <div
                key={employee.id}
                className="bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {employee.isOnCall && <Zap className="w-4 h-4 text-yellow-400" />}
                      {employee.isSubstitute && <Shield className="w-4 h-4 text-blue-400" />}
                      <h3 className="font-bold text-slate-100">{employee.name}</h3>
                    </div>
                    <p className="text-slate-400 text-sm">{employee.role}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {employee.startTime} - {employee.endTime}
                      </span>
                      <span>Escala: {employee.shiftPattern}</span>
                      <span>Início: {new Date(employee.startDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {employee.isSubstitute && (
                      <p className="text-xs text-blue-400 mt-1">
                        Folguista - Coberturas: {employee.substituteSectors?.length || 0}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEmployee(employee)}
                      className="text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  // Render categories view
  const renderCategoriesView = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-100">Gestão de Setores</h2>
          <button
            onClick={() => {
              setCategoryForm({ name: '' });
              setEditingCategory(null);
              setShowCategoryModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
          <SortableContext items={categories.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {categories
                .filter(c => !c.fixed)
                .map(category => (
                  <SortableItem key={category.id} id={category.id}>
                    <div className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700 hover:border-slate-600 transition-colors">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-100">{category.name}</h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="text-slate-400 hover:text-blue-400 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </SortableItem>
                ))}
            </div>
          </SortableContext>
        </DndContext>

        <div className="mt-4 p-4 bg-slate-800 rounded-2xl border border-slate-700">
          <h3 className="font-bold text-slate-400 text-sm">Categoria Fixa:</h3>
          <p className="text-slate-100 mt-1">🏖️ Folga</p>
        </div>
      </div>
    </div>
  );

  // Render backup view
  const renderBackupView = () => (
    <div className="space-y-6">
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">Backup e Dados</h2>

        <div className="space-y-4">
          <button
            onClick={handleExport}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-medium transition-colors flex items-center justify-center gap-3"
          >
            <Download className="w-5 h-5" />
            Exportar Backup (JSON)
          </button>

          <label className="block">
            <div className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-2xl font-medium transition-colors flex items-center justify-center gap-3 cursor-pointer">
              <Upload className="w-5 h-5" />
              Importar Backup (JSON)
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          <button
            onClick={handleClearData}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-2xl font-medium transition-colors flex items-center justify-center gap-3"
          >
            <Trash2 className="w-5 h-5" />
            Zerar Todos os Dados
          </button>
        </div>

        <div className="mt-6 p-4 bg-slate-800 rounded-2xl border border-slate-700">
          <h3 className="font-bold text-slate-100 mb-2">Estatísticas</h3>
          <div className="space-y-1 text-sm text-slate-400">
            <p>Colaboradores: {employees.length}</p>
            <p>Setores: {categories.length}</p>
            <p>Escalas salvas: {Object.keys(schedules).length}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      {renderNavigation()}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-0 scrollbar-thin">
        <div className="max-w-7xl mx-auto p-4 md:p-8">
          {currentView === 'schedule' && renderScheduleView()}
          {currentView === 'employees' && renderEmployeesView()}
          {currentView === 'categories' && renderCategoriesView()}
          {currentView === 'backup' && renderBackupView()}
        </div>
      </div>

      {/* Employee Modal */}
      <Modal
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          resetEmployeeForm();
        }}
        title={editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nome</label>
            <input
              type="text"
              value={employeeForm.name}
              onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
              className="w-full bg-slate-800 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
              placeholder="Nome completo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cargo</label>
            <input
              type="text"
              value={employeeForm.role}
              onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
              className="w-full bg-slate-800 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
              placeholder="Ex: Porteiro, Vigilante"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Entrada</label>
              <input
                type="time"
                value={employeeForm.startTime}
                onChange={(e) => setEmployeeForm({ ...employeeForm, startTime: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Saída</label>
              <input
                type="time"
                value={employeeForm.endTime}
                onChange={(e) => setEmployeeForm({ ...employeeForm, endTime: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Data de Início do Ciclo</label>
            <input
              type="date"
              value={employeeForm.startDate}
              onChange={(e) => setEmployeeForm({ ...employeeForm, startDate: e.target.value })}
              className="w-full bg-slate-800 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Modelo de Escala</label>
            <select
              value={employeeForm.shiftPattern}
              onChange={(e) => setEmployeeForm({ ...employeeForm, shiftPattern: e.target.value })}
              className="w-full bg-slate-800 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
            >
              <option value="12x36">12x36 (12h trabalho, 36h descanso)</option>
              <option value="6x1">6x1 (6 dias trabalho, 1 folga)</option>
              <option value="5x1">5x1 (5 dias trabalho, 1 folga)</option>
            </select>
          </div>

          {!employeeForm.isSubstitute && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Setor Principal</label>
              <select
                value={employeeForm.primarySector || ''}
                onChange={(e) => setEmployeeForm({ ...employeeForm, primarySector: e.target.value })}
                className="w-full bg-slate-800 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">Selecione um setor</option>
                {categories
                  .filter(c => c.name !== 'Folga')
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isSubstitute"
              checked={employeeForm.isSubstitute}
              onChange={(e) => setEmployeeForm({ ...employeeForm, isSubstitute: e.target.checked, primarySector: '' })}
              className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded focus:ring-blue-500"
            />
            <label htmlFor="isSubstitute" className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              É Folguista (substituto)
            </label>
          </div>

          {employeeForm.isSubstitute && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Setores que pode cobrir
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto bg-slate-800 p-3 rounded-xl border border-slate-700">
                {categories
                  .filter(c => c.name !== 'Folga')
                  .map(cat => (
                    <label key={cat.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={employeeForm.substituteSectors?.includes(cat.id)}
                        onChange={(e) => {
                          const sectors = employeeForm.substituteSectors || [];
                          if (e.target.checked) {
                            setEmployeeForm({
                              ...employeeForm,
                              substituteSectors: [...sectors, cat.id]
                            });
                          } else {
                            setEmployeeForm({
                              ...employeeForm,
                              substituteSectors: sectors.filter(id => id !== cat.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded"
                      />
                      <span className="text-sm text-slate-300">{cat.name}</span>
                    </label>
                  ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isOnCall"
              checked={employeeForm.isOnCall}
              onChange={(e) => setEmployeeForm({ ...employeeForm, isOnCall: e.target.checked })}
              className="w-4 h-4 text-yellow-600 bg-slate-800 border-slate-700 rounded focus:ring-yellow-500"
            />
            <label htmlFor="isOnCall" className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              É Plantonista
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowEmployeeModal(false);
                resetEmployeeForm();
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEmployee}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setCategoryForm({ name: '' });
          setEditingCategory(null);
        }}
        title={editingCategory ? 'Editar Setor' : 'Novo Setor'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Nome do Setor</label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ name: e.target.value })}
              className="w-full bg-slate-800 text-slate-100 px-4 py-2 rounded-xl border border-slate-700 focus:border-emerald-500 focus:outline-none"
              placeholder="Ex: Portaria, CFTV, Limpeza"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowCategoryModal(false);
                setCategoryForm({ name: '' });
                setEditingCategory(null);
              }}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-100 px-4 py-2 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveCategory}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-colors"
            >
              Salvar
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}

export default App;
