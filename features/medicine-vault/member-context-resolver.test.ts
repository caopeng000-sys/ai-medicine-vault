import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { members } from "./data"
import { filterByMemberId, filterMembersById, resolveMemberFromHint, resolveMemberFromQuestion } from "./member-context-resolver"
describe("member context resolver", () => {
  it("resolves members from question text by name, relationship, and nicknames", () => {
    assert.equal(resolveMemberFromQuestion("妈妈最近血压怎么样？", members), "member-mom")
    assert.equal(resolveMemberFromQuestion("小朋友有没有海鲜过敏记录？", members), "member-child")
    assert.equal(resolveMemberFromQuestion("曹鹏的青霉素过敏情况", members), "member-cp")
    assert.equal(resolveMemberFromQuestion("家里有哪些感冒药？", members), undefined)
  })
  it("resolves explicit UI hints by member id or display name", () => {
    assert.equal(resolveMemberFromHint("member-mom", members), "member-mom")
    assert.equal(resolveMemberFromHint("妈妈", members), "member-mom")
    assert.equal(resolveMemberFromHint("小朋友", members), "member-child")
  })
  it("filters records and members by member id", () => {
    const records = [{ id: "r1", memberId: "member-cp" }, { id: "r2", memberId: "member-mom" }]
    assert.equal(filterByMemberId(records, "member-mom").length, 1)
    assert.equal(filterMembersById(members, "member-child").length, 1)
  })
})
