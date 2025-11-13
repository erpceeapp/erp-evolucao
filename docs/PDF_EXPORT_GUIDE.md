# Guia de Exportação de PDF - Ficha do Aluno

## Descrição

O sistema possui funcionalidade de exportar os dados completos de um aluno em formato PDF. Este documento contém todas as informações necessárias sobre esta funcionalidade.

## Como Usar

### Na Interface

1. Acesse a página de detalhes de um aluno em `/alunos/[id]`
2. No canto superior direito, clique no botão **"Exportar PDF"**
3. O PDF será gerado e automaticamente baixado para seu computador
4. O arquivo será nomeado como `Ficha_[Nome_do_Aluno].pdf`

### Conteúdo do PDF

O documento PDF exportado contém todas as informações do aluno organizadas em seções:

#### Página 1

**Dados Pessoais**
- Nome Completo
- CPF
- RG
- Data de Nascimento
- Sexo
- Naturalidade

**Certidão de Nascimento**
- Número
- Livro
- Folha
- Cartório
- UF
- Data de Emissão

**Endereço**
- Endereço
- Número
- Bairro
- Cidade
- UF
- CEP

**Contato**
- Telefone
- Telefone Residencial
- Telefone Comercial
- Email

#### Página 2

**Dados dos Pais**
- Nome da Mãe / Celular / Profissão
- Nome do Pai / Celular / Profissão

**Responsável pela Matrícula**
- Nome do Responsável
- Telefone
- Email

**Responsável Financeiro**
- Nome
- CPF / RG
- Órgão Emissor / UF
- Estado Civil
- Grau de Parentesco
- Data de Nascimento
- Telefone

**Endereço do Responsável Financeiro**
- Endereço
- Bairro
- Cidade / UF
- CEP

#### Página 3

**Informações de Saúde**
- Uso de Medicamento Contínuo (Sim/Não + Qual)
- Alergia a Medicamento (Sim/Não + Qual)
- Alergia a Alimento (Sim/Não + Qual)

**Informações Acadêmicas**
- Nível
- Período Letivo
- Turno Preferencial

**Observações**
- Texto livre com observações sobre o aluno

**Campo de Assinatura**
- Linha para assinatura do responsável
- Campo para data

## Aspectos Técnicos

### Biblioteca Utilizada

- **jsPDF v3.0.3** - Biblioteca JavaScript para geração de PDFs

### Arquivos Envolvidos

1. **`lib/pdf-generator.ts`** - Função principal de geração do PDF
2. **`components/alunos/export-aluno-pdf-button.tsx`** - Componente do botão de exportação
3. **`app/(authenticated)/alunos/[id]/page.tsx`** - Página de detalhes que usa o botão
4. **`types/supabase.ts`** - Tipos TypeScript do banco de dados

### Permissões

- Qualquer usuário autenticado pode exportar PDFs de alunos
- Não é necessário permissão especial

### Tratamento de Erros

O sistema possui tratamento de erros que:
1. Exibe mensagem de sucesso quando o PDF é gerado
2. Exibe mensagem de erro se houver falha na geração
3. Desabilita o botão durante o processo de exportação
4. Registra erros no console para debug

## Personalização

### Modificar Layout do PDF

Para personalizar o layout do PDF, edite o arquivo `lib/pdf-generator.ts`:

\`\`\`typescript
// Exemplo: Alterar cor do cabeçalho
doc.setFillColor(59, 130, 246) // Azul atual
// Altere para:
doc.setFillColor(34, 197, 94) // Verde

// Exemplo: Alterar fonte
doc.setFontSize(10)
doc.setFont("helvetica", "bold")
\`\`\`

### Adicionar Novos Campos

Para adicionar novos campos ao PDF:

1. Certifique-se que o campo existe na tabela `alunos` do banco de dados
2. Adicione a chamada `addField()` no local apropriado em `lib/pdf-generator.ts`

\`\`\`typescript
addField("Novo Campo", aluno.novo_campo)
\`\`\`

### Adicionar Logo da Escola

Para incluir o logo da escola no cabeçalho:

\`\`\`typescript
// Após criar o doc
const imgData = 'data:image/png;base64,...' // Logo em base64
doc.addImage(imgData, 'PNG', margin, 5, 20, 20)
\`\`\`

## Solução de Problemas

### PDF não é gerado

1. Verifique se o navegador permite downloads
2. Verifique o console do navegador para erros
3. Certifique-se que todos os dados do aluno estão carregados

### Campos aparecem como "-"

Campos que estão vazios ou null no banco de dados aparecem como "-" no PDF. Isso é intencional para manter o documento limpo.

### Texto cortado ou sobreposto

Se o texto está sendo cortado ou sobreposto:
1. Ajuste os valores de `yPosition` em `lib/pdf-generator.ts`
2. Verifique se há espaço suficiente na página antes de adicionar novo conteúdo
3. Adicione `doc.addPage()` se necessário

## Melhorias Futuras

Possíveis melhorias para esta funcionalidade:

- [ ] Adicionar logo da escola no cabeçalho
- [ ] Permitir escolher quais seções incluir no PDF
- [ ] Adicionar opção de enviar PDF por email
- [ ] Gerar múltiplos PDFs em lote
- [ ] Adicionar QR Code com informações do aluno
- [ ] Permitir personalização de cores e fontes via interface
- [ ] Adicionar foto do aluno no documento
