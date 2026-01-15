// Calculate if an employee should work on a given date based on their shift pattern
export function shouldWork(employee, date) {
  if (!employee.startDate || !employee.shiftPattern) return false;
  
  const start = new Date(employee.startDate);
  start.setHours(0, 0, 0, 0);
  
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);
  
  const diffTime = current.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return false;
  
  switch (employee.shiftPattern) {
    case '12x36':
      return diffDays % 2 === 0;
    case '6x1':
      return diffDays % 7 < 6;
    case '5x1':
      return diffDays % 6 < 5;
    default:
      return false;
  }
}

// Format time for display
export function formatTime(time) {
  if (!time) return '';
  return time;
}

// Format date for display
export function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Generate WhatsApp formatted text
export function generateWhatsAppText(schedule, employees, categories, date) {
  const dateStr = formatDate(date);
  let text = `📋 *ESCALA DO DIA*\n${dateStr}\n\n`;
  
  categories.forEach(category => {
    if (category.name === 'Folga') return;
    
    const employeesInCategory = schedule[category.id] || [];
    if (employeesInCategory.length === 0) return;
    
    text += `🏢 *${category.name}*\n`;
    
    employeesInCategory.forEach(empId => {
      const employee = employees.find(e => e.id === empId);
      if (employee) {
        const icon = employee.isOnCall ? '⚡' : employee.isSubstitute ? '🔄' : '👤';
        text += `${icon} ${employee.name}\n`;
        text += `   ${employee.role}\n`;
        text += `   ⏰ ${employee.startTime} - ${employee.endTime}\n`;
      }
    });
    text += '\n';
  });
  
  // Add folga section
  const folgaCategory = categories.find(c => c.name === 'Folga');
  if (folgaCategory) {
    const employeesOnLeave = schedule[folgaCategory.id] || [];
    if (employeesOnLeave.length > 0) {
      text += `🏖️ *FOLGA*\n`;
      employeesOnLeave.forEach(empId => {
        const employee = employees.find(e => e.id === empId);
        if (employee) {
          text += `• ${employee.name}\n`;
        }
      });
    }
  }
  
  return text;
}

// Export data to JSON
export function exportData(employees, categories, schedules) {
  return JSON.stringify({
    employees,
    categories,
    schedules,
    exportDate: new Date().toISOString()
  }, null, 2);
}

// Import data from JSON
export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    return {
      employees: data.employees || [],
      categories: data.categories || [],
      schedules: data.schedules || {}
    };
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}
