export default function DisclaimerPage() {
  return (
    <article className="mx-auto grid max-w-4xl gap-6 rounded-[32px] border border-slate-200 bg-white p-7 leading-7 text-slate-600 shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
      <div>
        <p className="text-sm font-medium text-amber-600">医疗免责声明</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">AI 只做资料整理，不替代医生或药师</h1>
      </div>
      <p>
        本产品提供的是家庭健康资料整理、检索和辅助汇总能力，不提供诊断、治疗、处方、换药或停药建议。
      </p>
      <section>
        <h2 className="text-lg font-semibold text-slate-900">关于 AI 回答</h2>
        <p className="mt-2">
          AI 助手会优先基于你已保存的病历和药品记录生成回答。任何涉及疾病判断、用药剂量、联合用药和不良反应处理的问题，都应咨询医生或药师。
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-900">紧急情况</h2>
        <p className="mt-2">如果出现严重过敏、呼吸困难、胸痛、高热不退或意识异常，请立即联系急救或前往医疗机构。</p>
      </section>
    </article>
  )
}
