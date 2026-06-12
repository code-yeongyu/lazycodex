import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const skillText = readFileSync("plugins/omo/skills/ulw-plan/SKILL.md", "utf8")
const workflowText = readFileSync(
  "plugins/omo/skills/ulw-plan/references/full-workflow.md",
  "utf8",
)
const approvalGateText = `${skillText}\n${workflowText}`

test("approval gate accepts direct approval replies", () => {
  // Given: a user has just received the approval brief.
  const directApprovalReplies = ["yes", "approve", "proceed", "write the plan", "create the plan"]

  // When: the bundled workflow documents accepted approval replies.
  const missingReplies = directApprovalReplies.filter(
    (reply) => !approvalGateText.toLowerCase().includes(reply),
  )

  // Then: common direct approvals are documented as sufficient to enter Phase 3.
  assert.deepEqual(missingReplies, [])
  assert.match(workflowText, /Phase 3/i)
})

test("non-approval replies remain gated", () => {
  // Given: a user reply changes scope instead of approving the current brief.
  const scopeChangeReply = "change the scope first"

  // When: the bundled workflow documents the non-approval branch.
  const workflowLower = workflowText.toLowerCase()

  // Then: scope changes are explicitly handled before Phase 3 instead of counted as approval.
  assert.equal(workflowLower.includes(scopeChangeReply), true)
  assert.match(workflowText, /fold it in and re-present the brief/i)
})
