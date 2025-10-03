import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { cadastrarAluno } from "./actions"

export default function NovoAlunoPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/alunos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Novo Aluno</h2>
          <p className="text-gray-600 mt-1">Cadastre um novo aluno no sistema</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados do Aluno</CardTitle>
          <CardDescription>Preencha as informações do aluno</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={cadastrarAluno} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" name="nome" placeholder="Digite o nome completo" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input id="cpf" name="cpf" placeholder="000.000.000-00" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
                <Input id="data_nascimento" name="data_nascimento" type="date" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" placeholder="aluno@email.com" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input id="telefone" name="telefone" placeholder="(00) 00000-0000" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço</Label>
                <Input id="endereco" name="endereco" placeholder="Rua, número, bairro" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome_responsavel">Nome do Responsável</Label>
                <Input id="nome_responsavel" name="nome_responsavel" placeholder="Nome completo do responsável" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone_responsavel">Telefone do Responsável</Label>
                <Input id="telefone_responsavel" name="telefone_responsavel" placeholder="(00) 00000-0000" />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Link href="/alunos">
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Cadastrar Aluno
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
