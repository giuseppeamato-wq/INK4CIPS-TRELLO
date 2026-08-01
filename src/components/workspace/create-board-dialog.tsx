"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"

import { createBoardAction } from "@/lib/actions/boards"
import { BOARD_BACKGROUNDS, DEFAULT_BOARD_BACKGROUND_ID } from "@/lib/board-backgrounds"
import { cn } from "@/lib/utils"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const schema = z.object({
  name: z.string().min(1, "Inserisci un nome").max(80),
  background: z.string(),
})

export function CreateBoardDialog({
  workspaceId,
  trigger,
}: {
  workspaceId: string
  trigger?: React.ReactElement
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", background: DEFAULT_BOARD_BACKGROUND_ID },
  })

  async function onSubmit(values: z.infer<typeof schema>) {
    setIsSubmitting(true)
    try {
      await createBoardAction(workspaceId, values.name, values.background)
      setOpen(false)
      form.reset()
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore imprevisto")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger ?? <Button>Nuova board</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuova board</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Es. Sprint Luglio" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="background"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sfondo</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {BOARD_BACKGROUNDS.map((bg) => (
                        <button
                          key={bg.id}
                          type="button"
                          aria-label={bg.label}
                          onClick={() => field.onChange(bg.id)}
                          className={cn(
                            "size-8 rounded-full ring-2 ring-offset-2 ring-offset-background transition-shadow",
                            bg.className,
                            field.value === bg.id ? "ring-foreground" : "ring-transparent"
                          )}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creazione..." : "Crea"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
