# ⚡ Escala Pro

Sistema completo de gestão de escala de trabalho para empresas que operam 24/7.

![Escala Pro](https://github.com/user-attachments/assets/28a943ff-ca13-46fa-b7f4-de6bc533a4ed)

## 🚀 Funcionalidades

### Gestão de Equipe
- ✅ Cadastro completo de colaboradores (nome, cargo, horários, data de início)
- ✅ Modelos de escala: 12x36, 6x1, 5x1
- ✅ Sistema de folguistas (substitutos) que cobrem setores específicos
- ✅ Marcação de plantonistas com destaque visual
- ✅ Edição e exclusão de colaboradores

### Gestão de Setores
- ✅ Criação e organização de setores/departamentos
- ✅ Reordenação por drag & drop
- ✅ Categoria fixa "Folga" para colaboradores de descanso

### Montagem de Escala
- ✅ Geração automática baseada em ciclos e padrões de trabalho
- ✅ Alocação inteligente de folguistas em setores vazios
- ✅ Ajuste manual via drag & drop entre setores
- ✅ Visualização clara do efetivo por setor

### Exportação e Backup
- ✅ Exportação para WhatsApp com formatação em markdown e emojis
- ✅ Backup completo em JSON
- ✅ Importação de dados
- ✅ Estatísticas do sistema

### Interface
- ✅ Dark mode premium (Slate-950/900)
- ✅ Totalmente responsivo (sidebar desktop + bottom nav mobile)
- ✅ Animações suaves e feedback visual
- ✅ Toast notifications para ações do usuário

## 🛠️ Tecnologias

- **React 18** - Framework UI
- **Vite** - Build tool e dev server
- **Tailwind CSS v3** - Estilização
- **Lucide React** - Ícones
- **@dnd-kit** - Drag & drop
- **localStorage** - Persistência de dados

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Executar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build de produção
npm run preview
```

## 💡 Como Usar

### 1. Configurar Setores
Acesse a aba "Setores" e crie os departamentos da sua empresa (ex: Portaria, CFTV, Limpeza).

### 2. Cadastrar Colaboradores
Na aba "Equipe", adicione colaboradores com:
- Nome e cargo
- Horários de trabalho (entrada/saída)
- Data de início do ciclo
- Modelo de escala (12x36, 6x1, 5x1)
- Setor principal (ou marcar como folguista)

### 3. Gerar Escala
Na aba "Escala":
- Selecione a data desejada
- Clique em "Gerar Automático" para criação inteligente
- Ajuste manualmente arrastando colaboradores entre setores
- Use o botão "Copiar" para exportar para WhatsApp

### 4. Backup
Na aba "Backup":
- Exporte seus dados regularmente
- Importe backups quando necessário
- Visualize estatísticas do sistema

## 📋 Regras de Cálculo

### Padrões de Escala
- **12x36**: Trabalha se (dias desde o início) % 2 == 0
- **6x1**: Trabalha se (dias desde o início) % 7 < 6
- **5x1**: Trabalha se (dias desde o início) % 6 < 5

### Sistema de Folguistas
1. Colaboradores fixos são alocados primeiro baseado em seu ciclo
2. Setores vazios recebem folguistas habilitados para aquele setor
3. Folguistas não alocados ficam na categoria "Folga"

## 🎨 Design

- **Cores principais**: Slate-950, Slate-900 (backgrounds)
- **Destaque positivo**: Emerald/Green (ações, botões ativos)
- **Coberturas**: Blue (folguistas)
- **Urgência**: Yellow (plantonistas)
- **Bordas arredondadas**: 2xl/3xl para cards
- **Sombras suaves**: Para profundidade visual

## 📱 Responsividade

- **Desktop**: Sidebar lateral fixa com navegação
- **Mobile**: Bottom navigation bar flutuante
- **Breakpoint**: md (768px)

## 🔒 Persistência

Todos os dados são salvos automaticamente no localStorage do navegador:
- `employees`: Lista de colaboradores
- `categories`: Lista de setores
- `schedules`: Escalas por data (formato: YYYY-MM-DD)

## 📄 Licença

MIT

---

Desenvolvido com ⚡ para facilitar a gestão de escalas 24/7
