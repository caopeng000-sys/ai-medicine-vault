import Link from "next/link"

export default function DisclaimerPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <Link className="text-sm text-emerald-700 hover:text-emerald-800" href="/">
        ← 返回首页
      </Link>

      <h1 className="mt-6 text-3xl font-semibold text-slate-950">医疗免责声明</h1>
      <p className="mt-3 text-sm text-slate-500">最近更新：2026-06-07</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-950">1. 产品定位</h2>
          <p className="mt-2">
            MedRecord 是家庭健康资料管理工具，用于记录、检索和整理已有信息。它不是医疗机构，不提供在线诊疗、处方或紧急医疗服务。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-950">2. AI 功能边界</h2>
          <p className="mt-2">
            AI 助手、图片识别、就医准备生成等功能仅基于您已录入的资料进行整理与归纳，可能不完整或存在误差。AI
            输出不构成诊断、治疗、用药或替代医疗专业意见。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-950">3. 何时应寻求专业帮助</h2>
          <p className="mt-2">
            若您或家人出现急性症状、严重过敏、用药疑问或需要调整治疗方案，请立即咨询医生、药师或拨打当地急救电话，不要依赖本产品做医疗决策。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-950">4. 资料准确性</h2>
          <p className="mt-2">
            请核对 OCR 识别结果与 AI 摘要后再用于就医参考。您对录入内容的准确性负责，我们不对因资料缺失、过期或误读造成的后果承担责任。
          </p>
        </section>
      </div>
    </div>
  )
}
