import Link from "next/link"
import { ChevronLeft } from "lucide-react"

const FAQ = [
  {
    q: "Come creo un nuovo workspace o board?",
    a: 'Usa il pulsante "Nuovo workspace" nella barra laterale, oppure "Nuova board" dentro un workspace.',
  },
  {
    q: "Come invito un collega in un workspace?",
    a: 'Vai in "Impostazioni" del workspace e invita la persona tramite la sua email.',
  },
  {
    q: "Come sposto una card tra le colonne?",
    a: 'Trascina la card con il mouse (o tieni premuto su mobile) da una colonna all\'altra: "Da Fare", "In Corso", "Fatto".',
  },
  {
    q: "Perché mi viene chiesta la password per eliminare una card?",
    a: "È una conferma di sicurezza per evitare eliminazioni accidentali di lavoro del team.",
  },
]

export default function HelpPage() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col p-5">
      <div className="mb-5 flex items-center gap-3.5">
        <Link
          href="/profile"
          aria-label="Torna al profilo"
          className="flex size-9 items-center justify-center rounded-[9px] bg-ink-soft"
        >
          <ChevronLeft className="size-4 text-foreground" />
        </Link>
        <h1 className="font-heading text-[19px] font-bold text-foreground">Aiuto e supporto</h1>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        {FAQ.map((item) => (
          <div key={item.q} className="rounded-2xl border border-border p-4">
            <div className="mb-1.5 text-sm font-semibold text-foreground">{item.q}</div>
            <div className="text-sm text-muted-foreground">{item.a}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-ink-soft p-4 text-sm text-foreground">
        Per problemi non risolti da questa pagina, contatta chi amministra il tuo workspace
        o l&apos;owner del progetto INK4CIPS.
      </div>
    </div>
  )
}
