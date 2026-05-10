import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ table?: string }>
}

export default async function TablesRedirect({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params
  const { table } = await searchParams

  if (table) {
    redirect(`/studio/${slug}?activeTable=${table}`)
  }
  redirect(`/studio/${slug}`)
}
