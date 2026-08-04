"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const loginSchema = z.object({
  email: z.string().email("Inserisci un'email valida"),
  password: z.string().min(1, "Inserisci la password"),
})

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setError(null)
    setIsSubmitting(true)
    const { error } = await authClient.signIn.email(values)
    setIsSubmitting(false)

    if (error) {
      setError(error.message ?? "Errore imprevisto")
      return
    }

    router.replace("/")
    router.refresh()
  }

  return (
    <div className="w-full px-7 pb-10 lg:p-0">
      <div className="mb-1.5 font-heading text-2xl font-bold text-foreground">Bentornato</div>
      <p className="mb-8 text-sm text-muted-foreground">
        Accedi al tuo spazio di lavoro per continuare.
      </p>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-foreground">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="tu@azienda.com"
                    className="h-[46px] rounded-[10px] border-[#e5e5e5] bg-[#fafafa] px-3.5 text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold text-foreground">Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    className="h-[46px] rounded-[10px] border-[#e5e5e5] bg-[#fafafa] px-3.5 text-sm"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button
            type="submit"
            className="mt-2.5 h-12 w-full rounded-[10px] text-[15px] font-semibold"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Accesso in corso..." : "Accedi"}
          </Button>
          <p className="mt-1 text-center text-[13px] text-muted-foreground">
            Non hai un account?{" "}
            <Link href="/signup" className="font-semibold text-foreground no-underline">
              Registrati
            </Link>
          </p>
        </form>
      </Form>
    </div>
  )
}
