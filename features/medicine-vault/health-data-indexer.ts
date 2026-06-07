import type { AllergyRecord, MedicalRecord, MedicalRecordAttachment, Medicine, Member } from "./data"
import type { HealthDataChunk } from "./health-data-chunk"

export function indexAttachmentChunks(
  attachments: MedicalRecordAttachment[],
  members: Member[],
): HealthDataChunk[] {
  const memberNameById = new Map(members.map((member) => [member.id, member.name]))
  return attachments.map((attachment) => ({
    id: `attachment-${attachment.id}`,
    sourceType: "attachment",
    sourceId: attachment.id,
    memberId: attachment.memberId,
    memberName: memberNameById.get(attachment.memberId),
    title: `附件 · ${attachment.fileName}`,
    content: [memberNameById.get(attachment.memberId), attachment.fileName, attachment.extractedText]
      .filter(Boolean)
      .join(" · "),
    href: `/records?member=${attachment.memberId}`,
  }))
}

export function indexHealthData(input: {
  members: Member[]
  records: MedicalRecord[]
  medicines: Medicine[]
  allergies: AllergyRecord[]
  attachments?: MedicalRecordAttachment[]
}): HealthDataChunk[] {
  const memberNameById = new Map(input.members.map((member) => [member.id, member.name]))
  const chunks: HealthDataChunk[] = []

  for (const member of input.members) {
    chunks.push({
      id: `member-${member.id}`,
      sourceType: "member",
      sourceId: member.id,
      memberId: member.id,
      memberName: member.name,
      title: `成员 · ${member.name}`,
      content: [
        member.name,
        member.relationship,
        `${member.birthYear} 年出生`,
        member.gender,
        member.note,
        member.allergySummary,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/members/${member.id}`,
    })
  }

  for (const record of input.records) {
    const memberName = memberNameById.get(record.memberId)
    chunks.push({
      id: `record-${record.id}`,
      sourceType: "record",
      sourceId: record.id,
      memberId: record.memberId,
      memberName,
      title: `病历 · ${record.diagnosis}`,
      content: [
        memberName,
        record.visitedAt,
        record.hospitalName,
        record.department,
        record.diagnosis,
        record.symptoms,
        record.doctorAdvice,
        record.prescriptionNote,
        record.note,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/records?member=${record.memberId}`,
    })
  }

  for (const medicine of input.medicines) {
    const memberName = memberNameById.get(medicine.memberId)
    chunks.push({
      id: `medicine-${medicine.id}`,
      sourceType: "medicine",
      sourceId: medicine.id,
      memberId: medicine.memberId,
      memberName,
      title: `药品 · ${medicine.name}`,
      content: [
        memberName,
        medicine.name,
        medicine.category,
        medicine.purpose,
        medicine.instructions,
        medicine.specification,
        medicine.usageNote,
        medicine.safetyNote,
        `有效期 ${medicine.expiresAt}`,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/medicines?member=${medicine.memberId}`,
    })
  }

  for (const allergy of input.allergies) {
    const memberName = memberNameById.get(allergy.memberId)
    chunks.push({
      id: `allergy-${allergy.id}`,
      sourceType: "allergy",
      sourceId: allergy.id,
      memberId: allergy.memberId,
      memberName,
      title: `过敏 · ${allergy.allergen}`,
      content: [
        memberName,
        allergy.allergen,
        allergy.severity,
        allergy.reaction,
        allergy.discoveredAt,
        allergy.note,
      ]
        .filter(Boolean)
        .join(" · "),
      href: `/allergies?member=${allergy.memberId}`,
    })
  }

  return [...chunks, ...indexAttachmentChunks(input.attachments ?? [], input.members)]
}
