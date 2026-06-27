import { redirect } from "next/navigation"

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams

  // Se o email de recuperacao apontou pra raiz (site_url), redireciona pro callback
  if (params.type === "recovery" && params.code) {
    const code = Array.isArray(params.code) ? params.code[0] : params.code
    redirect(`/auth/redefinir-senha?code=${code}`)
  }

  redirect("/dashboard")
}
