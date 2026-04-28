export default function PrivacyPage() {
  return (
    <article className="mx-auto grid max-w-4xl gap-6 rounded-[32px] border border-slate-200 bg-white p-7 leading-7 text-slate-600 shadow-[0_24px_90px_rgba(15,23,42,0.08)]">
      <div>
        <p className="text-sm font-medium text-emerald-600">隐私政策</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">家庭健康资料台隐私政策</h1>
      </div>
      <p>
        本产品用于整理家庭成员、病历、药品、过敏和就医准备资料。健康资料属于敏感信息，系统会以登录账号为边界隔离数据。
      </p>
      <section>
        <h2 className="text-lg font-semibold text-slate-900">我们保存的数据</h2>
        <p className="mt-2">包括成员档案、病历记录、药品信息、药品图片、过敏记录、AI 提问内容和 AI 调用状态日志。</p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-900">数据使用方式</h2>
        <p className="mt-2">
          数据仅用于资料管理、搜索、导出和基于已保存资料的 AI 整理。AI 调用日志用于排查问题、控制成本和改进稳定性。
        </p>
      </section>
      <section>
        <h2 className="text-lg font-semibold text-slate-900">你的控制权</h2>
        <p className="mt-2">你可以新增、编辑、删除药品和成员资料，也可以通过导出接口下载自己的健康资料 JSON。</p>
      </section>
    </article>
  )
}
