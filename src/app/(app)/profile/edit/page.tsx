import { redirect } from "next/navigation"
import { getSession } from "@/lib/auth/session"
import { EditProfileForm } from "@/components/profile/edit-profile-form"

export default async function EditProfilePage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <EditProfileForm
      initialName={session.user.name}
      email={session.user.email}
      image={session.user.image ?? null}
      initialJobTitle={session.user.jobTitle ?? ""}
      initialBio={session.user.bio ?? ""}
    />
  )
}
