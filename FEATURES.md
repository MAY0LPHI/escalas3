# Escala Pro - Documentação de Funcionalidades

## 📋 Visão Geral
Escala Pro é um sistema completo de gestão de escalas de trabalho desenvolvido para empresas que operam 24/7. O sistema permite gerenciar colaboradores, setores, e gerar automaticamente escalas de trabalho baseadas em diferentes padrões de turno.

## 🎯 Funcionalidades Principais

### 1. Gestão de Colaboradores
- **Cadastro Completo**: Nome, cargo, horário de entrada/saída, data de início do ciclo
- **Padrões de Escala**: 12x36, 6x1, 5x1
- **Folguistas**: Colaboradores que podem cobrir múltiplos setores
- **Plantonistas**: Marcação especial para colaboradores de emergência
- **CRUD Completo**: Criar, visualizar, editar e excluir colaboradores

### 2. Gestão de Setores
- **Criação de Setores**: Adicione departamentos como Portaria, CFTV, Limpeza
- **Reordenação**: Drag & drop para reorganizar setores
- **Edição e Exclusão**: Gerencie setores facilmente
- **Categoria Fixa**: "Folga" é uma categoria protegida para colaboradores de descanso

### 3. Montagem de Escala

#### Auto-Geração Inteligente
O sistema calcula automaticamente quem trabalha em cada dia:
1. **Cálculo de Ciclos**: Baseado na data de início e padrão de trabalho
2. **Alocação de Fixos**: Colaboradores regulares são alocados primeiro
3. **Cobertura Inteligente**: Folguistas são alocados em setores vazios
4. **Folgas Automáticas**: Colaboradores fora do turno vão para "Folga"

#### Ajuste Manual
- **Drag & Drop**: Arraste colaboradores entre setores
- **Adição Rápida**: Dropdown para adicionar colaboradores a setores
- **Remoção Fácil**: Botão X para remover de um setor

### 4. Exportação

#### WhatsApp
Gera texto formatado pronto para compartilhar:
```
📋 *ESCALA DO DIA*
quinta-feira, 15 de janeiro de 2026

🏢 *Portaria*
👤 João Silva
   Porteiro
   ⏰ 07:00 - 19:00

⚡ Maria Santos
   Vigilante
   ⏰ 19:00 - 07:00

🏖️ *FOLGA*
• Carlos Oliveira
• Ana Costa
```

#### Backup JSON
- Exporta todos os dados (colaboradores, setores, escalas)
- Formato JSON legível
- Nome do arquivo com data automática

### 5. Interface do Usuário

#### Desktop
- **Sidebar Lateral**: Navegação fixa à esquerda
- **4 Seções**: Escala, Equipe, Setores, Backup
- **Cards Premium**: Bordas arredondadas e sombras suaves
- **Dark Mode**: Tema escuro profissional (Slate 950/900)

#### Mobile
- **Bottom Navigation**: Barra de navegação inferior
- **Responsivo**: Adapta automaticamente para telas pequenas
- **Touch-Friendly**: Botões grandes e fáceis de tocar

#### Feedback Visual
- **Toast Notifications**: Mensagens de sucesso animadas
- **Hover Effects**: Transições suaves em botões e cards
- **Cores Semânticas**: 
  - Verde (Emerald): Ações positivas
  - Azul: Folguistas/Coberturas
  - Amarelo: Plantonistas
  - Vermelho: Ações destrutivas

## �� Lógica de Cálculo de Escalas

### 12x36 (12 horas trabalho, 36 horas descanso)
```javascript
Trabalha se: (dias desde início) % 2 == 0
Exemplo: Dia 0, 2, 4, 6, 8... = Trabalha
         Dia 1, 3, 5, 7, 9... = Folga
```

### 6x1 (6 dias trabalho, 1 dia folga)
```javascript
Trabalha se: (dias desde início) % 7 < 6
Exemplo: Trabalha 6 dias seguidos, depois 1 dia de folga
```

### 5x1 (5 dias trabalho, 1 dia folga)
```javascript
Trabalha se: (dias desde início) % 6 < 5
Exemplo: Trabalha 5 dias seguidos, depois 1 dia de folga
```

## 🎨 Design System

### Paleta de Cores
- **Backgrounds**: Slate-950, Slate-900, Slate-800
- **Borders**: Slate-700, Slate-600
- **Text**: Slate-100 (primário), Slate-400 (secundário), Slate-500 (terciário)
- **Primary**: Emerald-600, Emerald-700 (hover)
- **Secondary**: Blue-600, Blue-700 (hover)
- **Accent**: Yellow-400 (plantonistas)
- **Danger**: Red-600, Red-700 (hover)

### Tipografia
- **Headers**: 2xl, xl, lg (bold)
- **Body**: Base (medium/normal)
- **Small**: sm, xs (labels e meta-info)

### Espaçamento
- **Gap**: 2, 3, 4, 6 (entre elementos)
- **Padding**: 3, 4, 6 (interno dos cards)
- **Margin**: Usado minimamente, preferindo gap

### Bordas
- **Radius**: xl (modais), 2xl/3xl (cards principais), lg (inputs)
- **Width**: 1px padrão para borders

## 💾 Persistência de Dados

### localStorage Keys
1. **employees**: `Array<Employee>`
   - id, name, role, startTime, endTime, startDate, shiftPattern
   - isSubstitute, substituteSectors, isOnCall, primarySector

2. **categories**: `Array<Category>`
   - id, name, order, fixed

3. **schedules**: `Object<date, Schedule>`
   - Chave: data no formato "YYYY-MM-DD"
   - Valor: objeto mapeando category_id para array de employee_ids

## 🔐 Regras de Negócio

### Colaboradores
- Nome e cargo são obrigatórios
- Folguistas não têm setor principal
- Folguistas podem cobrir múltiplos setores
- Plantonistas podem trabalhar em qualquer setor

### Setores
- Categoria "Folga" é protegida (não pode ser editada/excluída)
- Ordem dos setores pode ser personalizada
- Nome do setor é obrigatório

### Escalas
- Uma pessoa só pode estar em um setor por dia
- Geração automática respeita ciclos de trabalho
- Ajustes manuais sobrescrevem automação
- Dados são salvos automaticamente

## 🚀 Comandos e Scripts

```bash
# Desenvolvimento
npm install          # Instalar dependências
npm run dev         # Servidor de desenvolvimento (porta 5173)
npm run build       # Build de produção
npm run preview     # Preview do build
npm run lint        # Verificar código com ESLint
```

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px (md)
- **Desktop**: >= 768px (md)

### Adaptações Mobile
- Sidebar lateral -> Bottom navigation
- Cards em coluna única
- Botões com texto completo
- Modais em tela cheia
- Touch gestures otimizados

## 🔧 Manutenção e Extensão

### Adicionar Novo Padrão de Escala
1. Editar `src/utils/helpers.js` -> função `shouldWork()`
2. Adicionar opção no select de "Modelo de Escala" em App.jsx
3. Documentar o cálculo

### Adicionar Nova Funcionalidade
1. Criar componente se necessário
2. Adicionar state no App.jsx
3. Implementar lógica
4. Adicionar na navegação se for nova página
5. Atualizar README e FEATURES.md

### Customizar Tema
1. Editar `tailwind.config.js` para cores customizadas
2. Modificar `src/index.css` para estilos globais
3. Usar classes Tailwind para ajustes específicos

## 📊 Estatísticas e Analytics

O sistema fornece estatísticas básicas:
- Total de colaboradores cadastrados
- Total de setores criados
- Total de escalas salvas (dias únicos)

## 🐛 Debugging

### localStorage
```javascript
// Console do navegador
localStorage.getItem('employees')
localStorage.getItem('categories')
localStorage.getItem('schedules')

// Limpar tudo
localStorage.clear()
```

### React DevTools
- Use React DevTools para inspecionar componentes
- Verifique state e props
- Monitore re-renders

## 🔮 Melhorias Futuras Sugeridas

1. **Autenticação**: Login de usuários
2. **Multi-tenant**: Suporte a múltiplas empresas
3. **Histórico**: Log de alterações
4. **Relatórios**: Dashboard com gráficos
5. **Notificações**: Avisos de escala próxima
6. **API Backend**: Sincronização cloud
7. **Impressão**: Layout otimizado para PDF
8. **Tema Claro**: Opção de light mode
9. **Idiomas**: Internacionalização
10. **Mobile App**: PWA ou React Native
