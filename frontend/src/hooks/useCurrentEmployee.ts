'use client'
import { useQuery } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { apiFetch } from '@/lib/api'
import type { Employee } from '@/lib/personnel'

export function useCurrentEmployee() {
  const { data: session } = useSession()

  return useQuery({
    queryKey: ['current-employee'],
    queryFn: () => apiFetch<Employee>('/personnel/employees/me'),
    enabled: !!session?.accessToken,
    staleTime: 5 * 60 * 1000,
  })
}
