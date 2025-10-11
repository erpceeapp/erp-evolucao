-- Adicionar novos campos à tabela alunos

-- Dados cadastrais do aluno
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS sexo TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS naturalidade TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS certidao_nascimento_numero TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS certidao_livro TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS certidao_folha TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS certidao_data_emissao DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS certidao_cartorio TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS certidao_uf TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS endereco_numero TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS cidade TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS telefone_residencial TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS telefone_comercial TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS celular_pai TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS celular_mae TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_mae TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS profissao_mae TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nome_pai TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS profissao_pai TEXT;

-- Dados do responsável financeiro
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_nome TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_data_nascimento DATE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_estado_civil TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_cpf TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_identidade TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_orgao_emissor TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_uf TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_grau_parentesco TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_endereco TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_bairro TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_telefone TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_cidade TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_uf_endereco TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS resp_fin_cep TEXT;

-- Informações médicas
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS uso_medicamento_continuo BOOLEAN DEFAULT FALSE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS medicamento_continuo_qual TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS alergia_medicamento BOOLEAN DEFAULT FALSE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS alergia_medicamento_qual TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS alergia_alimento BOOLEAN DEFAULT FALSE;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS alergia_alimento_qual TEXT;

-- Dados da matrícula (alguns já existem na tabela matriculas, mas incluímos aqui para referência)
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS periodo_letivo TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS nivel TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS turno_preferencial TEXT;
ALTER TABLE alunos ADD COLUMN IF NOT EXISTS responsavel_matricula TEXT;

COMMENT ON COLUMN alunos.sexo IS 'Sexo do aluno (Masculino/Feminino/Outro)';
COMMENT ON COLUMN alunos.naturalidade IS 'Cidade e UF de nascimento';
COMMENT ON COLUMN alunos.resp_fin_grau_parentesco IS 'Grau de parentesco do responsável financeiro com o aluno';
