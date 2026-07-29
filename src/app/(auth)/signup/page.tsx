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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const signupSchema = z.object({
  fullName: z.string().min(1, "Inserisci il tuo nome"),
  email: z.string().email("Inserisci un'email valida"),
  password: z.string().min(8, "Almeno 8 caratteri"),
})

export default function SignupPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  })

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setError(null)
    setIsSubmitting(true)
    const { error } = await authClient.signUp.email({
      email: values.email,
      password: values.password,
      name: values.fullName,
    })
    setIsSubmitting(false)

    if (error) {
      setError(error.message ?? "Errore imprevisto")
      return
    }

    router.replace("/")
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <img src="/logo.png" alt="INK4CIPS" className="mx-auto mb-2 size-16 rounded-xl" />
        <CardTitle>Crea il tuo account</CardTitle>
        <CardDescription>
          Inizia a gestire i tuoi progetti con INK4CIPS-TRELLO.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid gap-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Mario Rossi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="tu@azienda.com" {...field} />
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creazione account..." : "Registrati"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Hai già un account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Accedi
              </Link>
            </p>
          </CardFooter>
        </form>
      </Form>
    </Card>
  )
}
