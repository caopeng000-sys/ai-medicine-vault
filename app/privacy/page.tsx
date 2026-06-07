import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <Link className="text-sm text-emerald-700 hover:text-emerald-800" href="/">
        ← 返回首页
      </Link>

      <h1 className="mt-6 text-3xl font-semibold text-slate-950">隐私政策</h1>
      <p className="mt-3 text-sm text-slate-500">最近更新：2026-06-07</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
        <section>
          <h2 className="text-base font-semibold text-slate-950">1. 我们收集什么</h2>
          <p className="mt-2">
            MedRecord 用于帮助您和家人整理健康资料，包括成员信息、病历记录、药品、过敏史、就医准备清单，以及您主动上传的药品图片和 AI
            对话记录。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-950">2. 数据如何使用</h2>
          <p className="mt-2">
            您的数据仅用于在本产品中展示、搜索、导出和 AI 资料整理。AI 功能基于您账户内的数据进行回答，不会用于训练对外公开的通用模型（以实际服务提供商政策为准）。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-950">3. 数据隔离与访问控制</h2>
          <p className="mt-2">
            每位登录用户只能访问自己账户下的资料。我们不会在 API 中接受客户端传入的 userId 作为权限依据，图片与导出接口均按当前登录用户过滤。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-950">4. 存储与备份</h2>
          <p className="mt-2">
            业务数据存储在 PostgreSQL；药品图片可配置为对象存储。建议您定期使用「设置 → 导出 JSON」保留副本，并确保生产数据库与对象存储启用了备份策略。
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-950">5. 联系我们</h2>
          <p className="mt-2">若对数据删除、导出或隐私有疑问，请通过您部署本产品的管理员渠道联系我们。</p>
        </section>
      </div>
    </div>
  )
}
