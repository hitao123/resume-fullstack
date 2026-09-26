import type {
  AwardInput,
  CertificationInput,
  CustomSectionInput,
  EducationInput,
  LanguageInput,
  PersonalInfoInput,
  ProjectInput,
  ResumeSectionConfig,
  SkillInput,
  WorkExperienceInput,
} from '@/types/resume.types';
import { DEFAULT_SECTION_CONFIG, TEMPLATES } from '@/utils/constants';

export type RoleCategory = 'engineering' | 'ai' | 'manufacturing' | 'business';
export type RoleLocale = 'zh-CN' | 'en-US';

export interface RoleTemplateContent {
  roleName: string;
  tagline: string;
  highlights: string[];
  keywords: string[];
  resumeTitle: string;
  targetRole: string;
  personalInfo: PersonalInfoInput;
  workExperiences: WorkExperienceInput[];
  education: EducationInput[];
  skills: SkillInput[];
  projects: ProjectInput[];
  certifications: CertificationInput[];
  languages: LanguageInput[];
  awards: AwardInput[];
  customSections: CustomSectionInput[];
}

export interface RoleTemplate {
  id: string;
  category: RoleCategory;
  templateId: number;
  themeColor: string;
  layoutDensity: 'compact' | 'balanced' | 'spacious';
  sectionOrder: string[];
  content: Record<RoleLocale, RoleTemplateContent>;
}

const THEME = {
  navy: '#1f3a5f',
  graphite: '#1f2933',
  burgundy: '#8c1d2f',
  forest: '#1d5b45',
  teal: '#0e5c6b',
  indigo: '#3730a3',
} as const;

const emptyCustom: CustomSectionInput[] = [];

function withOrder<T extends object>(items: T[]): Array<T & { displayOrder: number }> {
  return items.map((item, displayOrder) => ({ ...item, displayOrder }));
}

// The document renders every skill row as its own entry headed by its category,
// so one row per category keeps the category label from repeating.
function groupSkills(items: Array<{ category: string; name: string }>): SkillInput[] {
  const groups = new Map<string, string[]>();
  items.forEach(({ category, name }) => groups.set(category, [...(groups.get(category) || []), name]));
  return [...groups].map(([category, names], displayOrder) => ({ category, name: names.join(' / '), displayOrder }));
}

const frontendZh: RoleTemplateContent = {
  roleName: '前端开发工程师',
  tagline: '把复杂业务做成可复用、可度量的前端系统',
  highlights: [
    '用 LCP、INP、错误率等指标写结果，而不是只列技术栈',
    '突出组件复用、工程化与质量门禁，体现可规模化能力',
    '项目写清你的决策、协作范围和上线后的变化',
  ],
  keywords: ['React', 'TypeScript', '性能', '工程化'],
  resumeTitle: '前端开发工程师 · 模板',
  targetRole: '前端开发工程师',
  personalInfo: {
    fullName: '林一',
    email: 'lin.yi@example.com',
    phone: '138-0000-0000',
    location: '上海',
    summary:
      '<p>5 年前端，主栈 React 与 TypeScript。习惯把复杂交易与中后台拆成可复用模块，并用指标验证效果。近一年将核心交易页首屏 LCP 从 3.2s 降到 1.4s，同时把组件库推广到 6 条业务线。</p>',
  },
  workExperiences: withOrder([
    {
      companyName: '星澜科技',
      position: '高级前端工程师',
      location: '上海',
      startDate: '2023-03-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>主导交易页性能专项，<strong>LCP 从 3.2s 降到 1.4s</strong>，INP 稳定低于 180ms，下单转化提升 11%</li><li>搭建内部组件库 48 个组件，覆盖 6 条业务线，新页面交付周期缩短 30%</li><li>推动 TypeScript 严格模式与 monorepo 工程化，CI 类型错误拦截率提升到 98%</li><li>建立包体积、Web Vitals 与错误率周报，线上 JS 错误下降 42%</li></ul>',
    },
    {
      companyName: '澄谷互联',
      position: '前端工程师',
      location: '杭州',
      startDate: '2020-07-01',
      endDate: '2023-02-28',
      isCurrent: false,
      description:
        '<ul><li>将 12 个遗留 B 端页面迁移到 React，平均接口等待减少 35%</li><li>做可视化表单配置，运营可自助上线 80% 活动页，每年节省约 200 人天</li><li>引入单测与视觉回归，核心模块覆盖率从 18% 提升到 71%</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: '华东理工大学',
      degree: '工学学士',
      fieldOfStudy: '计算机科学与技术',
      location: '上海',
      startDate: '2016-09-01',
      endDate: '2020-06-30',
      gpa: '3.6/4.0',
    },
  ]),
  skills: groupSkills([
    { category: '语言', name: 'TypeScript' },
    { category: '语言', name: 'JavaScript' },
    { category: '框架', name: 'React' },
    { category: '框架', name: 'Next.js' },
    { category: '工程', name: 'Vite' },
    { category: '工程', name: 'Webpack' },
    { category: '质量', name: 'Vitest' },
    { category: '质量', name: 'Playwright' },
    { category: '样式', name: 'CSS' },
    { category: '样式', name: '组件库' },
  ]),
  projects: withOrder([
    {
      name: '内部设计系统与组件库',
      technologies: 'React, TypeScript, Storybook',
      startDate: '2023-04-01',
      endDate: '2024-11-01',
      description:
        '<ul><li>统一 4 套历史 UI，沉淀 48 个无障碍组件，跨团队复用率 73%</li><li>配套文档与变更检查，发版回归时间从 2 天降到 4 小时</li></ul>',
    },
    {
      name: '前端性能看板',
      technologies: 'React, ECharts, Web Vitals',
      startDate: '2024-01-01',
      endDate: '2024-08-01',
      description:
        '<p>把 LCP、INP、JS 错误按页面聚合，帮助 3 个业务组在一个季度内关闭 27 个性能缺陷。</p>',
    },
  ]),
  certifications: [],
  languages: withOrder([
    { language: '中文', proficiency: '母语' },
    { language: '英语', proficiency: '商务沟通' },
  ]),
  awards: [],
  customSections: emptyCustom,
};

const frontendEn: RoleTemplateContent = {
  roleName: 'Frontend Engineer',
  tagline: 'Turn complex product flows into reusable, measurable UI',
  highlights: [
    'Lead with LCP, INP, and error-rate results, not a tool list',
    'Show reuse, tooling, and quality gates that scale across teams',
    'Describe decisions and post-launch change, not feature checklists',
  ],
  keywords: ['React', 'TypeScript', 'Performance', 'Platform'],
  resumeTitle: 'Frontend Engineer · Template',
  targetRole: 'Frontend Engineer',
  personalInfo: {
    fullName: 'Lin Yi',
    email: 'lin.yi@example.com',
    phone: '138-0000-0000',
    location: 'Shanghai',
    summary:
      '<p>Frontend engineer with 5 years on React and TypeScript. I break complex trading and admin flows into reusable modules and prove the work with metrics. In the past year I cut the core checkout LCP from 3.2s to 1.4s and rolled a component library out to 6 product lines.</p>',
  },
  workExperiences: withOrder([
    {
      companyName: 'Xinglan Digital',
      position: 'Senior Frontend Engineer',
      location: 'Shanghai',
      startDate: '2023-03-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>Led a checkout performance program: <strong>LCP 3.2s to 1.4s</strong>, INP under 180ms, conversion +11%</li><li>Built a 48-component library used by 6 teams, cutting new-page delivery time by 30%</li><li>Enforced strict TypeScript and a monorepo pipeline; CI now blocks 98% of type errors</li><li>Published weekly bundle, Web Vitals, and error reports; production JS errors fell 42%</li></ul>',
    },
    {
      companyName: 'Chenggu Interactive',
      position: 'Frontend Engineer',
      location: 'Hangzhou',
      startDate: '2020-07-01',
      endDate: '2023-02-28',
      isCurrent: false,
      description:
        '<ul><li>Migrated 12 legacy admin pages to React and cut average request wait time by 35%</li><li>Shipped a visual form builder so ops could launch 80% of campaign pages, saving ~200 engineer-days a year</li><li>Added unit and visual regression tests; core coverage rose from 18% to 71%</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: 'East China University of Science and Technology',
      degree: 'B.Eng.',
      fieldOfStudy: 'Computer Science',
      location: 'Shanghai',
      startDate: '2016-09-01',
      endDate: '2020-06-30',
      gpa: '3.6/4.0',
    },
  ]),
  skills: groupSkills([
    { category: 'Languages', name: 'TypeScript' },
    { category: 'Languages', name: 'JavaScript' },
    { category: 'Frameworks', name: 'React' },
    { category: 'Frameworks', name: 'Next.js' },
    { category: 'Tooling', name: 'Vite' },
    { category: 'Tooling', name: 'Webpack' },
    { category: 'Quality', name: 'Vitest' },
    { category: 'Quality', name: 'Playwright' },
    { category: 'UI', name: 'CSS' },
    { category: 'UI', name: 'Design system' },
  ]),
  projects: withOrder([
    {
      name: 'Internal design system',
      technologies: 'React, TypeScript, Storybook',
      startDate: '2023-04-01',
      endDate: '2024-11-01',
      description:
        '<ul><li>Replaced 4 legacy UI kits with 48 accessible components; cross-team reuse reached 73%</li><li>Docs and release checks cut regression time from 2 days to 4 hours</li></ul>',
    },
    {
      name: 'Frontend performance board',
      technologies: 'React, ECharts, Web Vitals',
      startDate: '2024-01-01',
      endDate: '2024-08-01',
      description:
        '<p>Aggregated LCP, INP, and JS errors by page so 3 teams closed 27 performance defects in one quarter.</p>',
    },
  ]),
  certifications: [],
  languages: withOrder([
    { language: 'Chinese', proficiency: 'Native' },
    { language: 'English', proficiency: 'Professional working' },
  ]),
  awards: [],
  customSections: emptyCustom,
};

const backendZh: RoleTemplateContent = {
  roleName: '后端开发工程师',
  tagline: '把高并发链路做成可观测、可恢复的服务',
  highlights: [
    '写清吞吐量、P99、成功率，证明你对稳定性负责',
    '用一致性、削峰和容量规划体现分布式经验',
    '故障恢复时间与值班机制比罗列中间件更有说服力',
  ],
  keywords: ['Go', '分布式', 'MySQL', '稳定性'],
  resumeTitle: '后端开发工程师 · 模板',
  targetRole: '后端开发工程师',
  personalInfo: {
    fullName: '陈启',
    email: 'chen.qi@example.com',
    phone: '138-0000-0000',
    location: '北京',
    summary:
      '<p>6 年后端，主栈 Go 与 Java，长期负责订单与库存核心链路。关注一致性、容量和故障恢复。近两年将核心接口 P99 从 420ms 降到 95ms，并把平均恢复时间缩短 60%。</p>',
  },
  workExperiences: withOrder([
    {
      companyName: '北屿计算',
      position: '高级后端工程师',
      location: '北京',
      startDate: '2022-04-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>重写订单状态机，日均 180 万单，<strong>超卖率从 0.08% 降到 0.004%</strong></li><li>引入消息削峰与幂等消费，大促峰值 QPS 2.4 万，核心接口成功率 99.97%</li><li>完成分库分表与多级缓存，P99 从 420ms 降到 95ms</li><li>建立 SLO 与值班手册，MTTR 从 46 分钟降到 18 分钟</li></ul>',
    },
    {
      companyName: '青栈软件',
      position: '后端工程师',
      location: '南京',
      startDate: '2019-06-01',
      endDate: '2022-03-31',
      isCurrent: false,
      description:
        '<ul><li>用 Go 重写结算批处理，耗时从 4.5 小时降到 38 分钟</li><li>设计统一鉴权网关，覆盖 22 个内部服务，未授权访问下降 90%</li><li>补齐链路追踪，覆盖率从 20% 提升到 86%</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: '东南大学',
      degree: '工学学士',
      fieldOfStudy: '软件工程',
      location: '南京',
      startDate: '2015-09-01',
      endDate: '2019-06-30',
      gpa: '3.5/4.0',
    },
  ]),
  skills: groupSkills([
    { category: '语言', name: 'Go' },
    { category: '语言', name: 'Java' },
    { category: '数据', name: 'MySQL' },
    { category: '数据', name: 'Redis' },
    { category: '消息', name: 'Kafka' },
    { category: '服务', name: 'gRPC' },
    { category: '运行', name: 'Kubernetes' },
    { category: '观测', name: 'Prometheus' },
    { category: '质量', name: '单测' },
    { category: '质量', name: '压测' },
  ]),
  projects: withOrder([
    {
      name: '订单中台',
      technologies: 'Go, Kafka, MySQL',
      startDate: '2022-06-01',
      endDate: '2024-03-01',
      description:
        '<ul><li>统一 5 个业务线的下单与售后状态，对账差异下降 93%</li><li>峰值压测到 3 万 QPS，核心路径无单点写入</li></ul>',
    },
    {
      name: '统一鉴权网关',
      technologies: 'Go, Redis',
      startDate: '2020-03-01',
      endDate: '2021-11-01',
      description:
        '<p>收敛内部鉴权与限流，平均鉴权耗时 4ms，错误码可按团队拆分告警。</p>',
    },
  ]),
  certifications: [],
  languages: [],
  awards: [],
  customSections: emptyCustom,
};

const backendEn: RoleTemplateContent = {
  roleName: 'Backend Engineer',
  tagline: 'Build observable, recoverable services for hot paths',
  highlights: [
    'Quote throughput, P99, and success rate to show ownership of reliability',
    'Use consistency, shedding, and capacity work to prove distributed depth',
    'Recovery time and on-call practice beat a middleware name-drop',
  ],
  keywords: ['Go', 'Distributed', 'MySQL', 'Reliability'],
  resumeTitle: 'Backend Engineer · Template',
  targetRole: 'Backend Engineer',
  personalInfo: {
    fullName: 'Chen Qi',
    email: 'chen.qi@example.com',
    phone: '138-0000-0000',
    location: 'Beijing',
    summary:
      '<p>Backend engineer with 6 years in Go and Java, mostly on order and inventory paths. I care about consistency, capacity, and recovery. Over the last two years I cut core P99 from 420ms to 95ms and reduced mean time to recover by 60%.</p>',
  },
  workExperiences: withOrder([
    {
      companyName: 'Beiyu Computing',
      position: 'Senior Backend Engineer',
      location: 'Beijing',
      startDate: '2022-04-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>Rewrote the order state machine for 1.8M orders/day; <strong>oversell rate 0.08% to 0.004%</strong></li><li>Added queue shedding and idempotent consumers; peak 24k QPS with 99.97% success</li><li>Sharded MySQL and layered Redis; P99 fell from 420ms to 95ms</li><li>Defined SLOs and on-call runbooks; MTTR 46 minutes to 18 minutes</li></ul>',
    },
    {
      companyName: 'Qingzhan Software',
      position: 'Backend Engineer',
      location: 'Nanjing',
      startDate: '2019-06-01',
      endDate: '2022-03-31',
      isCurrent: false,
      description:
        '<ul><li>Rewrote settlement batches in Go, 4.5 hours down to 38 minutes</li><li>Shipped a shared auth gateway for 22 services; unauthorized access dropped 90%</li><li>Raised tracing coverage from 20% to 86%</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: 'Southeast University',
      degree: 'B.Eng.',
      fieldOfStudy: 'Software Engineering',
      location: 'Nanjing',
      startDate: '2015-09-01',
      endDate: '2019-06-30',
      gpa: '3.5/4.0',
    },
  ]),
  skills: groupSkills([
    { category: 'Languages', name: 'Go' },
    { category: 'Languages', name: 'Java' },
    { category: 'Data', name: 'MySQL' },
    { category: 'Data', name: 'Redis' },
    { category: 'Messaging', name: 'Kafka' },
    { category: 'Services', name: 'gRPC' },
    { category: 'Runtime', name: 'Kubernetes' },
    { category: 'Observability', name: 'Prometheus' },
    { category: 'Quality', name: 'Testing' },
    { category: 'Quality', name: 'Load tests' },
  ]),
  projects: withOrder([
    {
      name: 'Order platform',
      technologies: 'Go, Kafka, MySQL',
      startDate: '2022-06-01',
      endDate: '2024-03-01',
      description:
        '<ul><li>Unified checkout and after-sales state across 5 lines; reconciliation gaps fell 93%</li><li>Load-tested to 30k QPS with no single-writer hotspot on the core path</li></ul>',
    },
    {
      name: 'Shared auth gateway',
      technologies: 'Go, Redis',
      startDate: '2020-03-01',
      endDate: '2021-11-01',
      description:
        '<p>Centralized auth and rate limits; median auth cost 4ms with per-team error alerts.</p>',
    },
  ]),
  certifications: [],
  languages: [],
  awards: [],
  customSections: emptyCustom,
};

const aiZh: RoleTemplateContent = {
  roleName: 'AI 应用开发工程师',
  tagline: '用评测和线上反馈把大模型做成可用产品',
  highlights: [
    '同时写清离线评测与线上指标，避免只讲“调了 Prompt”',
    'RAG、Agent、成本要落到采纳率、幻觉率和时延',
    '说明你如何建评测集、回归和工具调用边界',
  ],
  keywords: ['LLM 应用', 'RAG', 'Agent', '评测'],
  resumeTitle: 'AI 应用开发工程师 · 模板',
  targetRole: 'AI 应用开发工程师',
  personalInfo: {
    fullName: '苏晚',
    email: 'su.wan@example.com',
    phone: '138-0000-0000',
    location: '深圳',
    summary:
      '<p>4 年算法工程，近 3 年做大模型应用。从评测集、检索质量到工具调用，习惯用离线指标和线上反馈一起判断效果。主导客服助手上线后，人工接管率下降 28%，平均解决时长缩短 41%。</p>',
  },
  workExperiences: withOrder([
    {
      companyName: '澜析智能',
      position: 'LLM 应用工程师',
      location: '深圳',
      startDate: '2023-01-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>搭建客服 RAG（检索 + 重排），<strong>答案采纳率从 54% 提升到 81%</strong></li><li>设计 Agent 工具框架，覆盖工单、知识库、订单，一次解决率提升 22%</li><li>沉淀 1,200 条评测集，幻觉率从 17% 降到 6.4%，并做周度回归</li><li>优化上下文与缓存，单次对话 token 成本下降 37%</li></ul>',
    },
    {
      companyName: '数澄实验室',
      position: '机器学习工程师',
      location: '广州',
      startDate: '2021-07-01',
      endDate: '2022-12-31',
      isCurrent: false,
      description:
        '<ul><li>搭建文档解析流水线，日处理 4 万页，抽取 F1 从 0.71 提升到 0.88</li><li>优化检索向量，Top-5 召回提升 19 个百分点</li><li>将模型服务化，P95 推理从 1.8s 降到 420ms</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: '中山大学',
      degree: '工学硕士',
      fieldOfStudy: '计算机科学与技术',
      location: '广州',
      startDate: '2018-09-01',
      endDate: '2021-06-30',
      gpa: '3.7/4.0',
    },
  ]),
  skills: groupSkills([
    { category: '语言', name: 'Python' },
    { category: '服务', name: 'FastAPI' },
    { category: '模型', name: 'PyTorch' },
    { category: '应用', name: 'RAG' },
    { category: '应用', name: 'Agent' },
    { category: '检索', name: '向量检索' },
    { category: '检索', name: '重排' },
    { category: '评测', name: '离线集' },
    { category: '数据', name: 'SQL' },
    { category: '工程', name: '服务化' },
  ]),
  projects: withOrder([
    {
      name: '客服助手评测平台',
      technologies: 'Python, FastAPI, 向量库',
      startDate: '2023-03-01',
      endDate: '2024-06-01',
      description:
        '<ul><li>把准确率、幻觉、拒答和时延做成可回归任务，发版前自动对比基线</li><li>帮助产品在 8 周内淘汰 2 条低收益工作流</li></ul>',
    },
    {
      name: '企业知识问答',
      technologies: 'Python, RAG, 重排',
      startDate: '2023-08-01',
      endDate: '2024-12-01',
      description:
        '<p>对 6 万篇内部文档做分段与权限过滤，一线同学平均查找时间从 9 分钟降到 2 分钟。</p>',
    },
  ]),
  certifications: [],
  languages: [],
  awards: withOrder([
    {
      title: '内部技术突破奖',
      issuer: '澜析智能',
      issueDate: '2024-12-01',
      description: '<p>客服助手上线后人工接管率下降 28%，成为当年内部标杆项目。</p>',
    },
  ]),
  customSections: emptyCustom,
};

const aiEn: RoleTemplateContent = {
  roleName: 'AI Application Engineer',
  tagline: 'Turn LLMs into products with evals and live feedback',
  highlights: [
    'Pair offline evals with live metrics; do not stop at prompt tweaks',
    'Tie RAG, agents, and cost to adoption, hallucination, and latency',
    'Show how you built the eval set, regressions, and tool boundaries',
  ],
  keywords: ['LLM apps', 'RAG', 'Agents', 'Evals'],
  resumeTitle: 'AI Application Engineer · Template',
  targetRole: 'AI Application Engineer',
  personalInfo: {
    fullName: 'Su Wan',
    email: 'su.wan@example.com',
    phone: '138-0000-0000',
    location: 'Shenzhen',
    summary:
      '<p>Four years in applied ML, three of them on LLM products. I judge quality with offline evals and live feedback together. After shipping a support assistant, human takeover fell 28% and median resolution time fell 41%.</p>',
  },
  workExperiences: withOrder([
    {
      companyName: 'Lanxi Intelligence',
      position: 'LLM Application Engineer',
      location: 'Shenzhen',
      startDate: '2023-01-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>Built support RAG with retrieval and rerank; <strong>answer adoption 54% to 81%</strong></li><li>Designed an agent tool layer for tickets, docs, and orders; first-contact resolution +22%</li><li>Created a 1,200-item eval set; hallucination 17% to 6.4%, with weekly regressions</li><li>Cut conversation token cost 37% via context control and caching</li></ul>',
    },
    {
      companyName: 'Shucheng Lab',
      position: 'Machine Learning Engineer',
      location: 'Guangzhou',
      startDate: '2021-07-01',
      endDate: '2022-12-31',
      isCurrent: false,
      description:
        '<ul><li>Built a document parsing pipeline for 40k pages/day; extraction F1 0.71 to 0.88</li><li>Improved retrieval embeddings; Top-5 recall +19 points</li><li>Served the model with P95 latency 1.8s to 420ms</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: 'Sun Yat-sen University',
      degree: 'M.Eng.',
      fieldOfStudy: 'Computer Science',
      location: 'Guangzhou',
      startDate: '2018-09-01',
      endDate: '2021-06-30',
      gpa: '3.7/4.0',
    },
  ]),
  skills: groupSkills([
    { category: 'Languages', name: 'Python' },
    { category: 'Serving', name: 'FastAPI' },
    { category: 'Models', name: 'PyTorch' },
    { category: 'Apps', name: 'RAG' },
    { category: 'Apps', name: 'Agents' },
    { category: 'Retrieval', name: 'Vector search' },
    { category: 'Retrieval', name: 'Rerank' },
    { category: 'Evals', name: 'Offline sets' },
    { category: 'Data', name: 'SQL' },
    { category: 'Platform', name: 'Model serving' },
  ]),
  projects: withOrder([
    {
      name: 'Support-assistant eval console',
      technologies: 'Python, FastAPI, vector store',
      startDate: '2023-03-01',
      endDate: '2024-06-01',
      description:
        '<ul><li>Turned accuracy, hallucination, refusal, and latency into a regression job against a baseline</li><li>Helped product drop 2 low-yield workflows in 8 weeks</li></ul>',
    },
    {
      name: 'Enterprise knowledge QA',
      technologies: 'Python, RAG, rerank',
      startDate: '2023-08-01',
      endDate: '2024-12-01',
      description:
        '<p>Chunked 60k internal docs with permission filters; average lookup time fell from 9 minutes to 2.</p>',
    },
  ]),
  certifications: [],
  languages: [],
  awards: withOrder([
    {
      title: 'Internal technical breakthrough award',
      issuer: 'Lanxi Intelligence',
      issueDate: '2024-12-01',
      description: '<p>Recognized after the support assistant cut human takeover by 28%.</p>',
    },
  ]),
  customSections: emptyCustom,
};

const processZh: RoleTemplateContent = {
  roleName: '工艺工程师',
  tagline: '用试验和过程能力把经验变成可复制窗口',
  highlights: [
    '良率、PPM、Cpk 比“熟悉 SMT”更有说服力',
    '写清 DOE、FMEA、SPC 如何改变工艺窗口',
    '导入与 8D 要写周期、关闭数和是否复发',
  ],
  keywords: ['SMT', 'DOE', 'FMEA', '良率'],
  resumeTitle: '工艺工程师 · 模板',
  targetRole: '工艺工程师',
  personalInfo: {
    fullName: '周衡',
    email: 'zhou.heng@example.com',
    phone: '138-0000-0000',
    location: '苏州',
    summary:
      '<p>7 年工艺开发，覆盖 SMT 与精密注塑。擅长用 DOE、FMEA 和 SPC 把经验变成可复制的工艺窗口。最近一次新产线导入，良率由 92.1% 提升到 97.6%，试产周期缩短 3 周。</p>',
  },
  workExperiences: withOrder([
    {
      companyName: '澄川精密',
      position: '工艺工程师',
      location: '苏州',
      startDate: '2021-05-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>优化 SMT 回流曲线，焊点缺陷 <strong>PPM 从 860 降到 210</strong></li><li>用 DOE 锁定注塑窗口，良率 92.1% 提升到 97.6%，材料报废下降 18%</li><li>建立 SPC 看板覆盖 14 个关键参数，Cpk 从 1.12 提升到 1.41</li><li>组织 8D 关闭 11 起客户投诉，重复故障为 0</li></ul>',
    },
    {
      companyName: '启明电子',
      position: '助理工艺工程师',
      location: '无锡',
      startDate: '2018-07-01',
      endDate: '2021-04-30',
      isCurrent: false,
      description:
        '<ul><li>参与 2 条 SMT 线体导入，爬坡周期从 8 周压缩到 5 周</li><li>编写作业指导与点检表 36 份，培训产线员工 40 人以上</li><li>推动首件检查电子化，漏检率下降 55%</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: '南京理工大学',
      degree: '工学学士',
      fieldOfStudy: '材料成型及控制工程',
      location: '南京',
      startDate: '2014-09-01',
      endDate: '2018-06-30',
      gpa: '3.4/4.0',
    },
  ]),
  skills: groupSkills([
    { category: '工艺', name: 'SMT' },
    { category: '工艺', name: '注塑' },
    { category: '方法', name: 'DOE' },
    { category: '方法', name: 'FMEA' },
    { category: '方法', name: 'SPC' },
    { category: '方法', name: '8D' },
    { category: '质量', name: 'Cpk' },
    { category: '质量', name: 'MSA' },
    { category: '工具', name: 'Minitab' },
    { category: '工具', name: '作业指导' },
  ]),
  projects: withOrder([
    {
      name: '新产线导入专项',
      technologies: 'DOE, FMEA, SPC',
      startDate: '2023-02-01',
      endDate: '2023-11-01',
      description:
        '<ul><li>从试产到量产 9 周，比原计划提前 3 周，量产首月良率 97.6%</li><li>输出工艺窗口、点检与异常升级标准，后续换型可在 5 天内复制</li></ul>',
    },
  ]),
  certifications: withOrder([
    {
      name: '六西格玛绿带',
      issuingOrganization: '中国质量协会',
      issueDate: '2022-09-01',
    },
  ]),
  languages: [],
  awards: [],
  customSections: emptyCustom,
};

const processEn: RoleTemplateContent = {
  roleName: 'Process Engineer',
  tagline: 'Turn shop-floor judgment into a repeatable process window',
  highlights: [
    'Yield, PPM, and Cpk beat “familiar with SMT”',
    'Show how DOE, FMEA, and SPC changed the process window',
    'For ramp and 8D, write cycle time, closures, and recurrence',
  ],
  keywords: ['SMT', 'DOE', 'FMEA', 'Yield'],
  resumeTitle: 'Process Engineer · Template',
  targetRole: 'Process Engineer',
  personalInfo: {
    fullName: 'Zhou Heng',
    email: 'zhou.heng@example.com',
    phone: '138-0000-0000',
    location: 'Suzhou',
    summary:
      '<p>Process engineer with 7 years across SMT and precision molding. I use DOE, FMEA, and SPC to turn tribal knowledge into a repeatable window. On the latest line launch, yield moved from 92.1% to 97.6% and trial production shrank by 3 weeks.</p>',
  },
  workExperiences: withOrder([
    {
      companyName: 'Chengchuan Precision',
      position: 'Process Engineer',
      location: 'Suzhou',
      startDate: '2021-05-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>Tuned the SMT reflow profile; solder-defect <strong>PPM 860 to 210</strong></li><li>Locked the molding window with DOE; yield 92.1% to 97.6%, scrap -18%</li><li>Built an SPC board for 14 CTQs; Cpk 1.12 to 1.41</li><li>Closed 11 customer 8Ds with zero repeat failures</li></ul>',
    },
    {
      companyName: 'Qiming Electronics',
      position: 'Assistant Process Engineer',
      location: 'Wuxi',
      startDate: '2018-07-01',
      endDate: '2021-04-30',
      isCurrent: false,
      description:
        '<ul><li>Supported two SMT line launches; ramp 8 weeks to 5</li><li>Wrote 36 work instructions and check sheets; trained 40+ operators</li><li>Digitized first-article checks; missed defects fell 55%</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: 'Nanjing University of Science and Technology',
      degree: 'B.Eng.',
      fieldOfStudy: 'Materials Forming and Control',
      location: 'Nanjing',
      startDate: '2014-09-01',
      endDate: '2018-06-30',
      gpa: '3.4/4.0',
    },
  ]),
  skills: groupSkills([
    { category: 'Process', name: 'SMT' },
    { category: 'Process', name: 'Molding' },
    { category: 'Methods', name: 'DOE' },
    { category: 'Methods', name: 'FMEA' },
    { category: 'Methods', name: 'SPC' },
    { category: 'Methods', name: '8D' },
    { category: 'Quality', name: 'Cpk' },
    { category: 'Quality', name: 'MSA' },
    { category: 'Tools', name: 'Minitab' },
    { category: 'Tools', name: 'Work instructions' },
  ]),
  projects: withOrder([
    {
      name: 'New line launch',
      technologies: 'DOE, FMEA, SPC',
      startDate: '2023-02-01',
      endDate: '2023-11-01',
      description:
        '<ul><li>Trial to volume in 9 weeks, 3 weeks early, first-month yield 97.6%</li><li>Documented windows, checks, and escalation so the next changeover copied in 5 days</li></ul>',
    },
  ]),
  certifications: withOrder([
    {
      name: 'Six Sigma Green Belt',
      issuingOrganization: 'China Association for Quality',
      issueDate: '2022-09-01',
    },
  ]),
  languages: [],
  awards: [],
  customSections: emptyCustom,
};

const hrbpZh: RoleTemplateContent = {
  roleName: 'HRBP',
  tagline: '把招聘、绩效和员工关系放进同一套组织诊断',
  highlights: [
    '招聘周期、接受率和留存比“熟悉面试”更关键',
    '绩效与盘点要写清覆盖范围和内部补位结果',
    '员工关系用争议结果与复发率证明风险控制',
  ],
  keywords: ['组织诊断', '招聘', '绩效', '人才盘点'],
  resumeTitle: 'HRBP · 模板',
  targetRole: 'HRBP',
  personalInfo: {
    fullName: '沈宁',
    email: 'shen.ning@example.com',
    phone: '138-0000-0000',
    location: '杭州',
    summary:
      '<p>6 年 HRBP，服务过 180 人的研发组织。把招聘、绩效和员工关系放在同一套组织诊断里看。过去一年关键岗位招聘周期缩短 35%，主动离职率从 18% 降到 11%。</p>',
  },
  workExperiences: withOrder([
    {
      companyName: '禾川网络',
      position: 'HRBP',
      location: '杭州',
      startDate: '2022-02-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>搭建研发任职资格，覆盖 4 个通道，晋升一次通过率提升到 76%</li><li>关键岗位招聘周期从 52 天降到 34 天，<strong>缩短 35%</strong>，offer 接受率 81%</li><li>组织两轮人才盘点，高潜 18 人，内部补位占比 44%</li><li>处理劳动争议 0 败诉，员工关系升级事件同比下降 40%</li></ul>',
    },
    {
      companyName: '安澜咨询',
      position: 'HR 专员',
      location: '上海',
      startDate: '2019-06-01',
      endDate: '2022-01-31',
      isCurrent: false,
      description:
        '<ul><li>独立完成三季校招，入职 96 人，3 个月留存 91%</li><li>优化绩效校准，强制分布争议工单减少 50%</li><li>编写劳动法实务手册并培训 20 名直线经理</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: '浙江工业大学',
      degree: '管理学学士',
      fieldOfStudy: '人力资源管理',
      location: '杭州',
      startDate: '2015-09-01',
      endDate: '2019-06-30',
      gpa: '3.6/4.0',
    },
  ]),
  skills: groupSkills([
    { category: '组织', name: '组织诊断' },
    { category: '组织', name: '任职资格' },
    { category: '招聘', name: '社招' },
    { category: '招聘', name: '校招' },
    { category: '发展', name: '绩效' },
    { category: '发展', name: '人才盘点' },
    { category: '关系', name: '员工关系' },
    { category: '关系', name: '劳动法' },
    { category: '协同', name: '经理辅导' },
    { category: '数据', name: '人力分析' },
  ]),
  projects: [],
  certifications: withOrder([
    {
      name: '企业人力资源管理师二级',
      issuingOrganization: '人力资源和社会保障部',
      issueDate: '2021-11-01',
    },
  ]),
  languages: withOrder([
    { language: '中文', proficiency: '母语' },
    { language: '英语', proficiency: '工作沟通' },
  ]),
  awards: [],
  customSections: emptyCustom,
};

const hrbpEn: RoleTemplateContent = {
  roleName: 'HRBP',
  tagline: 'Diagnose org issues across hiring, performance, and ER',
  highlights: [
    'Time-to-fill, offer-accept, and retention beat “good at interviews”',
    'For performance and talent reviews, write coverage and internal fill rate',
    'For employee relations, show case outcomes and whether issues returned',
  ],
  keywords: ['Org diagnosis', 'Hiring', 'Performance', 'Talent review'],
  resumeTitle: 'HRBP · Template',
  targetRole: 'HRBP',
  personalInfo: {
    fullName: 'Shen Ning',
    email: 'shen.ning@example.com',
    phone: '138-0000-0000',
    location: 'Hangzhou',
    summary:
      '<p>HRBP with 6 years supporting a 180-person R&D org. I look at hiring, performance, and employee relations as one diagnosis. In the last year, critical-role time-to-fill fell 35% and voluntary turnover moved from 18% to 11%.</p>',
  },
  workExperiences: withOrder([
    {
      companyName: 'Hechuan Network',
      position: 'HRBP',
      location: 'Hangzhou',
      startDate: '2022-02-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>Built R&D career architecture across 4 tracks; first-pass promotion rate reached 76%</li><li>Cut critical-role time-to-fill from 52 to 34 days (<strong>-35%</strong>); offer accept 81%</li><li>Ran two talent reviews; 18 high-potentials and 44% internal fill</li><li>Closed labor disputes with 0 losses; ER escalations -40% year over year</li></ul>',
    },
    {
      companyName: 'Anlan Consulting',
      position: 'HR Specialist',
      location: 'Shanghai',
      startDate: '2019-06-01',
      endDate: '2022-01-31',
      isCurrent: false,
      description:
        '<ul><li>Owned three campus cycles; 96 hires and 91% 90-day retention</li><li>Reworked calibration; forced-distribution dispute tickets fell 50%</li><li>Wrote a labor-law playbook and trained 20 line managers</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: 'Zhejiang University of Technology',
      degree: 'B.A.',
      fieldOfStudy: 'Human Resource Management',
      location: 'Hangzhou',
      startDate: '2015-09-01',
      endDate: '2019-06-30',
      gpa: '3.6/4.0',
    },
  ]),
  skills: groupSkills([
    { category: 'Organization', name: 'Org diagnosis' },
    { category: 'Organization', name: 'Career architecture' },
    { category: 'Hiring', name: 'Experienced hire' },
    { category: 'Hiring', name: 'Campus' },
    { category: 'Development', name: 'Performance' },
    { category: 'Development', name: 'Talent review' },
    { category: 'Relations', name: 'Employee relations' },
    { category: 'Relations', name: 'Labor law' },
    { category: 'Partnership', name: 'Manager coaching' },
    { category: 'Data', name: 'People analytics' },
  ]),
  projects: [],
  certifications: withOrder([
    {
      name: 'Enterprise HR Manager Level 2',
      issuingOrganization: 'Ministry of Human Resources and Social Security',
      issueDate: '2021-11-01',
    },
  ]),
  languages: withOrder([
    { language: 'Chinese', proficiency: 'Native' },
    { language: 'English', proficiency: 'Limited working' },
  ]),
  awards: [],
  customSections: emptyCustom,
};

const pmZh: RoleTemplateContent = {
  roleName: '产品经理',
  tagline: '用数据和实验把需求做成可上线的决策',
  highlights: [
    '用漏斗、成功率和客诉写结果，而不是功能清单',
    '写清你如何做用户研究、A/B 和跨团队排期',
    'PRD 要体现取舍：砍了什么、为什么、释放了多少带宽',
  ],
  keywords: ['需求分析', 'A/B', 'PRD', '数据'],
  resumeTitle: '产品经理 · 模板',
  targetRole: '产品经理',
  personalInfo: {
    fullName: '顾清',
    email: 'gu.qing@example.com',
    phone: '138-0000-0000',
    location: '成都',
    summary:
      '<p>5 年 B 端产品，擅长从数据里找真需求，再用实验验证。独立负责过增长与履约两条线。最近一次支付改版，通过 A/B 将支付成功率提升 6.8 个百分点，客诉下降 23%。</p>',
  },
  workExperiences: withOrder([
    {
      companyName: '望海科技',
      position: '产品经理',
      location: '成都',
      startDate: '2022-08-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>重构支付漏斗并定位失败主因，<strong>成功率从 91.2% 提升到 98.0%</strong></li><li>协调研发、风控与客服排期，需求按期交付率从 62% 提升到 88%</li><li>建立周度指标会，北极星指标周波动均可解释</li><li>输出 PRD 42 份，平均一次评审通过</li></ul>',
    },
    {
      companyName: '拾光出行',
      position: '助理产品经理',
      location: '成都',
      startDate: '2020-07-01',
      endDate: '2022-07-31',
      isCurrent: false,
      description:
        '<ul><li>负责司机端任务中心，日活任务完成率从 47% 提升到 69%</li><li>用访谈和漏斗分析砍掉 3 个低价值功能，释放约 1.5 人月研发带宽</li><li>设计客诉分类，平均处理时长从 16 小时降到 7 小时</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: '四川大学',
      degree: '管理学学士',
      fieldOfStudy: '信息管理与信息系统',
      location: '成都',
      startDate: '2016-09-01',
      endDate: '2020-06-30',
      gpa: '3.5/4.0',
    },
  ]),
  skills: groupSkills([
    { category: '发现', name: '用户研究' },
    { category: '发现', name: '需求分析' },
    { category: '决策', name: 'A/B' },
    { category: '决策', name: '数据分析' },
    { category: '文档', name: 'PRD' },
    { category: '协同', name: '跨团队推进' },
    { category: '增长', name: '漏斗' },
    { category: '增长', name: '留存' },
    { category: '工具', name: 'SQL' },
    { category: '工具', name: '原型' },
  ]),
  projects: withOrder([
    {
      name: '支付成功率专项',
      technologies: '漏斗分析, A/B, PRD',
      startDate: '2023-01-01',
      endDate: '2023-09-01',
      description:
        '<ul><li>拆出验证、风控与渠道 3 类失败，分周实验，成功率累计 +6.8 个百分点</li><li>客诉下降 23%，客服人均日处理量下降 15%</li></ul>',
    },
    {
      name: '任务中心改版',
      technologies: '用户访谈, 数据分析',
      startDate: '2021-03-01',
      endDate: '2022-01-01',
      description:
        '<p>把 11 个入口收成 3 个任务队列，司机日完成率从 47% 提升到 69%。</p>',
    },
  ]),
  certifications: [],
  languages: [],
  awards: [],
  customSections: emptyCustom,
};

const pmEn: RoleTemplateContent = {
  roleName: 'Product Manager',
  tagline: 'Turn research and experiments into shippable decisions',
  highlights: [
    'Lead with funnel, success-rate, and complaint results, not a feature list',
    'Show how you ran research, A/B tests, and cross-team sequencing',
    'In the PRD, write the cuts: what you dropped, why, and what capacity you freed',
  ],
  keywords: ['Discovery', 'A/B', 'PRD', 'Analytics'],
  resumeTitle: 'Product Manager · Template',
  targetRole: 'Product Manager',
  personalInfo: {
    fullName: 'Gu Qing',
    email: 'gu.qing@example.com',
    phone: '138-0000-0000',
    location: 'Chengdu',
    summary:
      '<p>B2B product manager with 5 years finding real demand in the data and proving it with experiments. I have owned growth and fulfillment. The latest payments redesign lifted success rate 6.8 points in an A/B test and cut complaints 23%.</p>',
  },
  workExperiences: withOrder([
    {
      companyName: 'Wanghai Tech',
      position: 'Product Manager',
      location: 'Chengdu',
      startDate: '2022-08-01',
      endDate: '',
      isCurrent: true,
      description:
        '<ul><li>Rebuilt the payment funnel and isolated failure causes; <strong>success rate 91.2% to 98.0%</strong></li><li>Sequenced engineering, risk, and support; on-time delivery 62% to 88%</li><li>Ran a weekly metric review so every North Star swing had an owner</li><li>Wrote 42 PRDs, most cleared in one review</li></ul>',
    },
    {
      companyName: 'Shiguang Mobility',
      position: 'Associate Product Manager',
      location: 'Chengdu',
      startDate: '2020-07-01',
      endDate: '2022-07-31',
      isCurrent: false,
      description:
        '<ul><li>Owned the driver task hub; daily task completion 47% to 69%</li><li>Cut 3 low-value features after interviews and funnel work, freeing ~1.5 engineer-months</li><li>Designed complaint taxonomy; handle time 16 hours to 7</li></ul>',
    },
  ]),
  education: withOrder([
    {
      institution: 'Sichuan University',
      degree: 'B.A.',
      fieldOfStudy: 'Information Management',
      location: 'Chengdu',
      startDate: '2016-09-01',
      endDate: '2020-06-30',
      gpa: '3.5/4.0',
    },
  ]),
  skills: groupSkills([
    { category: 'Discovery', name: 'User research' },
    { category: 'Discovery', name: 'Problem framing' },
    { category: 'Decisions', name: 'A/B' },
    { category: 'Decisions', name: 'Analytics' },
    { category: 'Docs', name: 'PRD' },
    { category: 'Delivery', name: 'Cross-team' },
    { category: 'Growth', name: 'Funnels' },
    { category: 'Growth', name: 'Retention' },
    { category: 'Tools', name: 'SQL' },
    { category: 'Tools', name: 'Prototyping' },
  ]),
  projects: withOrder([
    {
      name: 'Payment success program',
      technologies: 'Funnel analysis, A/B, PRD',
      startDate: '2023-01-01',
      endDate: '2023-09-01',
      description:
        '<ul><li>Split failures into verification, risk, and channel; weekly experiments added 6.8 success points</li><li>Complaints -23% and support tickets per agent -15%</li></ul>',
    },
    {
      name: 'Driver task-hub redesign',
      technologies: 'Interviews, analytics',
      startDate: '2021-03-01',
      endDate: '2022-01-01',
      description:
        '<p>Collapsed 11 entries into 3 queues; daily completion rose from 47% to 69%.</p>',
    },
  ]),
  certifications: [],
  languages: [],
  awards: [],
  customSections: emptyCustom,
};

export const ROLE_TEMPLATES: RoleTemplate[] = [
  {
    id: 'frontend-engineer',
    category: 'engineering',
    templateId: TEMPLATES.MODERN,
    themeColor: THEME.navy,
    layoutDensity: 'balanced',
    sectionOrder: ['summary', 'skills', 'workExperiences', 'projects', 'education', 'languages'],
    content: { 'zh-CN': frontendZh, 'en-US': frontendEn },
  },
  {
    id: 'backend-engineer',
    category: 'engineering',
    templateId: TEMPLATES.MINIMAL,
    themeColor: THEME.graphite,
    layoutDensity: 'balanced',
    sectionOrder: ['summary', 'workExperiences', 'projects', 'skills', 'education'],
    content: { 'zh-CN': backendZh, 'en-US': backendEn },
  },
  {
    id: 'ai-engineer',
    category: 'ai',
    templateId: TEMPLATES.MODERN,
    themeColor: THEME.indigo,
    layoutDensity: 'balanced',
    sectionOrder: ['summary', 'skills', 'projects', 'workExperiences', 'education', 'awards'],
    content: { 'zh-CN': aiZh, 'en-US': aiEn },
  },
  {
    id: 'process-engineer',
    category: 'manufacturing',
    templateId: TEMPLATES.CLASSIC,
    themeColor: THEME.forest,
    layoutDensity: 'balanced',
    sectionOrder: ['summary', 'workExperiences', 'projects', 'certifications', 'skills', 'education'],
    content: { 'zh-CN': processZh, 'en-US': processEn },
  },
  {
    id: 'hrbp',
    category: 'business',
    templateId: TEMPLATES.CLASSIC,
    themeColor: THEME.burgundy,
    layoutDensity: 'balanced',
    sectionOrder: ['summary', 'workExperiences', 'skills', 'certifications', 'education', 'languages'],
    content: { 'zh-CN': hrbpZh, 'en-US': hrbpEn },
  },
  {
    id: 'product-manager',
    category: 'business',
    templateId: TEMPLATES.MINIMAL,
    themeColor: THEME.teal,
    layoutDensity: 'balanced',
    sectionOrder: ['summary', 'workExperiences', 'projects', 'skills', 'education'],
    content: { 'zh-CN': pmZh, 'en-US': pmEn },
  },
];

export function getRoleContent(template: RoleTemplate, language?: string): RoleTemplateContent {
  return language?.toLowerCase().startsWith('zh') ? template.content['zh-CN'] : template.content['en-US'];
}

export function buildSectionConfig(template: RoleTemplate): ResumeSectionConfig[] {
  return DEFAULT_SECTION_CONFIG.map((item, index) => {
    const visibleIndex = template.sectionOrder.indexOf(item.key);
    return {
      key: item.key,
      visible: visibleIndex >= 0,
      order: visibleIndex >= 0 ? visibleIndex : template.sectionOrder.length + index,
    };
  });
}
