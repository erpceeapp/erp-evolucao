export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      alunos: {
        Row: {
          id: string
          nome_completo: string | null
          cpf: string | null
          rg: string | null
          data_nascimento: string
          sexo: string | null
          naturalidade: string | null
          endereco: string | null
          endereco_numero: string | null
          bairro: string | null
          cidade: string | null
          uf: string | null
          cep: string | null
          telefone: string | null
          telefone_residencial: string | null
          telefone_comercial: string | null
          email: string | null
          nome_mae: string | null
          celular_mae: string | null
          profissao_mae: string | null
          nome_pai: string | null
          celular_pai: string | null
          profissao_pai: string | null
          nome_responsavel: string | null
          telefone_responsavel: string | null
          email_responsavel: string | null
          responsavel_matricula: string | null
          certidao_nascimento_numero: string | null
          certidao_livro: string | null
          certidao_folha: string | null
          certidao_cartorio: string | null
          certidao_uf: string | null
          certidao_data_emissao: string | null
          resp_fin_nome: string | null
          resp_fin_cpf: string | null
          resp_fin_identidade: string | null
          resp_fin_orgao_emissor: string | null
          resp_fin_uf: string | null
          resp_fin_estado_civil: string | null
          resp_fin_grau_parentesco: string | null
          resp_fin_data_nascimento: string | null
          resp_fin_endereco: string | null
          resp_fin_bairro: string | null
          resp_fin_cidade: string | null
          resp_fin_uf_endereco: string | null
          resp_fin_cep: string | null
          resp_fin_telefone: string | null
          uso_medicamento_continuo: boolean | null
          medicamento_continuo_qual: string | null
          alergia_medicamento: boolean | null
          alergia_medicamento_qual: string | null
          alergia_alimento: boolean | null
          alergia_alimento_qual: string | null
          nivel: string | null
          periodo_letivo: string | null
          turno_preferencial: string | null
          observacoes: string | null
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome_completo?: string | null
          cpf?: string | null
          rg?: string | null
          data_nascimento: string
          sexo?: string | null
          naturalidade?: string | null
          endereco?: string | null
          endereco_numero?: string | null
          bairro?: string | null
          cidade?: string | null
          uf?: string | null
          cep?: string | null
          telefone?: string | null
          telefone_residencial?: string | null
          telefone_comercial?: string | null
          email?: string | null
          nome_mae?: string | null
          celular_mae?: string | null
          profissao_mae?: string | null
          nome_pai?: string | null
          celular_pai?: string | null
          profissao_pai?: string | null
          nome_responsavel?: string | null
          telefone_responsavel?: string | null
          email_responsavel?: string | null
          responsavel_matricula?: string | null
          certidao_nascimento_numero?: string | null
          certidao_livro?: string | null
          certidao_folha?: string | null
          certidao_cartorio?: string | null
          certidao_uf?: string | null
          certidao_data_emissao?: string | null
          resp_fin_nome?: string | null
          resp_fin_cpf?: string | null
          resp_fin_identidade?: string | null
          resp_fin_orgao_emissor?: string | null
          resp_fin_uf?: string | null
          resp_fin_estado_civil?: string | null
          resp_fin_grau_parentesco?: string | null
          resp_fin_data_nascimento?: string | null
          resp_fin_endereco?: string | null
          resp_fin_bairro?: string | null
          resp_fin_cidade?: string | null
          resp_fin_uf_endereco?: string | null
          resp_fin_cep?: string | null
          resp_fin_telefone?: string | null
          uso_medicamento_continuo?: boolean | null
          medicamento_continuo_qual?: string | null
          alergia_medicamento?: boolean | null
          alergia_medicamento_qual?: string | null
          alergia_alimento?: boolean | null
          alergia_alimento_qual?: string | null
          nivel?: string | null
          periodo_letivo?: string | null
          turno_preferencial?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome_completo?: string | null
          cpf?: string | null
          rg?: string | null
          data_nascimento?: string
          sexo?: string | null
          naturalidade?: string | null
          endereco?: string | null
          endereco_numero?: string | null
          bairro?: string | null
          cidade?: string | null
          uf?: string | null
          cep?: string | null
          telefone?: string | null
          telefone_residencial?: string | null
          telefone_comercial?: string | null
          email?: string | null
          nome_mae?: string | null
          celular_mae?: string | null
          profissao_mae?: string | null
          nome_pai?: string | null
          celular_pai?: string | null
          profissao_pai?: string | null
          nome_responsavel?: string | null
          telefone_responsavel?: string | null
          email_responsavel?: string | null
          responsavel_matricula?: string | null
          certidao_nascimento_numero?: string | null
          certidao_livro?: string | null
          certidao_folha?: string | null
          certidao_cartorio?: string | null
          certidao_uf?: string | null
          certidao_data_emissao?: string | null
          resp_fin_nome?: string | null
          resp_fin_cpf?: string | null
          resp_fin_identidade?: string | null
          resp_fin_orgao_emissor?: string | null
          resp_fin_uf?: string | null
          resp_fin_estado_civil?: string | null
          resp_fin_grau_parentesco?: string | null
          resp_fin_data_nascimento?: string | null
          resp_fin_endereco?: string | null
          resp_fin_bairro?: string | null
          resp_fin_cidade?: string | null
          resp_fin_uf_endereco?: string | null
          resp_fin_cep?: string | null
          resp_fin_telefone?: string | null
          uso_medicamento_continuo?: boolean | null
          medicamento_continuo_qual?: string | null
          alergia_medicamento?: boolean | null
          alergia_medicamento_qual?: string | null
          alergia_alimento?: boolean | null
          alergia_alimento_qual?: string | null
          nivel?: string | null
          periodo_letivo?: string | null
          turno_preferencial?: string | null
          observacoes?: string | null
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      [key: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
      }
    }
    Views: {
      [_: string]: {
        Row: Record<string, any>
      }
    }
    Functions: {
      [_: string]: any
    }
    Enums: {
      [_: string]: string
    }
  }
}
