"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Check, Copy } from "lucide-react"

import { createInviteAction } from "@/lib/actions/workspaces"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  email: z.string().email("Inserisci un'email valida"),
  role: z.enum(["member", "editor", "admin"]),
})

const ROLE_LABELS: Record<string, string> = {
  member: "Membro",
  editor: "Editor",
  admin: "Admin",
}

export function InviteMemberDialog({ workspaceId }: { workspaceId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", role: "member" },
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setInviteLink(null)
      setCopied(false)
      form.reset()
    }
  }

  async function onSubmit(values: z.infer<typeof schema>) {
    setIsSubmitting(true)
    try {
      const invite = await createInviteAction(workspaceId, values.email, values.role)
      if (!invite.token) throw new Error("Errore imprevisto")
      setInviteLink(`${window.location.origin}/invite/${invite.token}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function copyLink() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button>Invita collega</Button>} />
      <DialogContent>
        {inviteLink ? (
          <>
            <DialogHeader>
              <DialogTitle>Invito pronto</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Non inviamo email automaticamente — copia questo link e mandalo al tuo collega (chat, email, come
              preferisci). Aprendolo potrà registrarsi o accedere ed entrare direttamente nel workspace.
            </p>
            <div className="flex gap-2">
              <Input value={inviteLink} readOnly onFocus={(e) => e.target.select()} className="text-xs" />
              <Button type="button" variant="outline" size="icon" onClick={copyLink} aria-label="Copia link">
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Fatto
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invita un collega</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="collega@azienda.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ruolo</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue>{(value: string) => ROLE_LABELS[value] ?? value}</SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="member">Membro</SelectItem>
                          <SelectItem value="editor">Editor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Creazione..." : "Crea invito"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
