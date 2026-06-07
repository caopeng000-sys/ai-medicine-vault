import { AssistantPanel } from "@/components/medicine-vault/assistant-panel"
import { requireCurrentUser } from "@/features/medicine-vault/auth-context"
import { listMembers } from "@/features/medicine-vault/repository"
export const dynamic = "force-dynamic"
export default async function AssistantPage() { const ctx = await requireCurrentUser(); return <AssistantPanel members={await listMembers(ctx)} /> }
