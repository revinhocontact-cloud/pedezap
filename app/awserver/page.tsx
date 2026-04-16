'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { renderNotificationTemplate } from '@/lib/message-templates';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  DollarSign,
  Download,
  Eye,
  ShoppingBag,
  Star,
  FileText,
  Filter,
  History,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Lock,
  Mail,
  Megaphone,
  MapPin,
  MoreVertical,
  Pencil,
  PieChart as PieChartIcon,
  Plus,
  QrCode,
  RefreshCw,
  RefreshCcw,
  Search,
  Settings,
  Target,
  ShieldOff,
  ShieldAlert,
  SlidersHorizontal,
  Store,
  TrendingDown,
  Wallet,
  Users,
  X,
  Trash2,
  Wand2,
  Copy,
  MessageCircle,
  TrendingUp,
  Activity,
  Upload
} from 'lucide-react';
const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000;
const ADMIN_IDLE_CHECK_MS = 15 * 1000;
const ADMIN_LAST_ACTIVITY_KEY = 'pedezap_admin_last_activity_at';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { BrandLogo } from '@/components/brand-logo';
import { buildSystemBackupSummary, type SystemBackupPayload, type SystemBackupSummary } from '@/lib/system-backup';

type AdminSession = { email: string; name: string; role?: string; permissions?: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function resolveBackupPreview(payload: unknown): { generatedAt: string | null; summary: SystemBackupSummary } | null {
  if (!isRecord(payload)) return null;
  const container = isRecord(payload.backup) ? payload.backup : payload;
  const storeCandidate = isRecord(container.store) ? container.store : container;
  if (!isRecord(storeCandidate) || !Array.isArray(storeCandidate.restaurants)) return null;
  return {
    generatedAt: typeof container.generatedAt === 'string' ? container.generatedAt : null,
    summary: buildSystemBackupSummary(storeCandidate)
  };
}

type PageId =
  | 'dashboard'
  | 'restaurants'
  | 'customers'
  | 'leads'
  | 'marketing'
  | 'financial'
  | 'plans'
  | 'payments'
  | 'stats'
  | 'team'
  | 'support'
  | 'settings'
  | 'security';

type AdminRestaurant = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string;
  plan: string;
  subscribedPlanId?: string | null;
  trialEndsAt?: string | null;
  subscriptionStatus?: 'trial' | 'active' | 'pending_payment' | 'expired' | 'canceled';
  subscriptionRawStatus?: 'trial' | 'active' | 'pending_payment' | 'expired' | 'canceled';
  active: boolean;
  ordersCount: number;
  ownerEmail?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  createdAt?: string;
  canceledAt?: string | null;
};

type PasswordResetPayload = {
  restaurantName: string;
  ownerEmail: string;
  whatsapp: string;
  expiresAt: string;
  resetLink: string;
  whatsappShareLink: string;
  emailShareLink: string;
};

type Stats = {
  totalRestaurants: number;
  activeRestaurants: number;
  totalOrders: number;
  totalLeads: number;
  grossRevenue: number;
};

type AdminDashboard = {
  updatedAt: string;
  kpis: {
    activeRestaurants: { value: number; change: number };
    monthlyRevenue: { value: number; change: number };
    orders24h: { value: number; change: number };
    pendingTickets: { value: number; newThisMonth: number; change: number };
  };
  growth: {
    periodLabel: string;
    orderChange: number;
    series: Array<{
      day: string;
      orders: number;
      restaurants: number;
    }>;
  };
  alerts: Array<{
    id: string;
    tone: 'red' | 'amber' | 'blue';
    text: string;
    href: PageId;
  }>;
  topRestaurants: Array<{
    id: string;
    name: string;
    plan: string;
    status: 'Ativo' | 'Inativo';
    ordersMonth: number;
    revenue: number;
  }>;
};

type AdminAnalytics = {
  periodDays: number;
  traffic: {
    visitsToday: number;
    visitsWeek: number;
    visitsMonth: number;
    conversionRate: number;
  };
  business: {
    restaurantsCount: number;
    totalOrders: number;
    grossRevenue: number;
    avgTicket: number;
  };
  restaurantStatus: {
    total: number;
    active: number;
    inactive: number;
  };
  visitsVsOrders: Array<{
    label: string;
    visits: number;
    orders: number;
    revenue: number;
  }>;
  revenueSeries: Array<{
    label: string;
    visits: number;
    orders: number;
    revenue: number;
  }>;
  paymentMethods: Array<{
    label: string;
    value: number;
    percent: number;
    color: string;
  }>;
  peakHours: Array<{
    label: string;
    orders: number;
    visits: number;
  }>;
  topRestaurants: Array<{
    id: string;
    name: string;
    slug: string;
    orders: number;
    revenue: number;
    growth: number;
  }>;
  leadsCount: number;
  todayOrders: number;
};

type AdminMarketing = {
  periodDays: number;
  summary: {
    landingVisitors: number;
    leadsCaptured: number;
    activeCampaigns: number;
    totalCampaigns: number;
    totalClicks: number;
    attributedOrders: number;
    adInvestment: number;
    cpl: number | null;
    clickRate: number | null;
  };
  trafficSeries: Array<{
    day: string;
    organico: number;
    pago: number;
    pedidos: number;
  }>;
  optimizations: Array<{
    tag: string;
    impact: 'ALTO' | 'MEDIO' | 'BAIXO';
    title: string;
    description: string;
  }>;
  seo: {
    score: number;
    checks: Array<{
      label: string;
      value: string;
      status: 'ok' | 'warn';
    }>;
  };
  keywords: Array<{
    keyword: string;
    position: string;
    volume: string;
    difficulty: string;
  }>;
  keywordsConnected: boolean;
  campaigns: Array<{
    id: string;
    name: string;
    restaurantName: string;
    platform: string;
    clicks: number;
    attributedOrders: number;
    couponCodes: string[];
    status: string;
    period: string;
    investment: number | null;
    cpl: number | null;
  }>;
};

type AdminCustomerRow = {
  id: string;
  name: string;
  email: string | null;
  whatsapp: string;
  restaurantSlug: string;
  restaurantName: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string | null;
  createdAt: string;
  status: 'Ativo' | 'VIP';
};

type AdminCustomersSummary = {
  total: number;
  active30d: number;
  activePercent: number;
  newThisMonth: number;
  avgLtv: number;
  vip: number;
  blocked: number;
};

type NewRestaurantForm = {
  name: string;
  legalName: string;
  document: string;
  email: string;
  password: string;
  whatsapp: string;
  address: string;
  city: string;
  state: string;
  slug: string;
  plan: string;
  subscribedPlanId: string;
};

type FinanceOverview = {
  kpis: {
    mrr: number;
    churnRate: number;
    arpu: number;
    delinquencyValue: number;
    delinquencyCount: number;
  };
  mrrData: { name: string; value: number }[];
  planDistribution: { name: string; value: number; color: string }[];
};

type FinanceInvoice = {
  id: string;
  restaurantSlug: string;
  restaurantName: string;
  plan: string;
  value: number;
  dueDate: string;
  status: 'Pago' | 'Pendente' | 'Vencido' | 'Estornado';
  method: 'Cartao de Credito' | 'Boleto' | 'Pix';
  createdAt: string;
  lastTwilioSentAt?: string | null;
  lastTwilioMessageSid?: string | null;
  lastTwilioStatus?: string | null;
};

type TwilioMessageLogRow = {
  id: string;
  to: string;
  from: string;
  body: string;
  templateId?: string | null;
  targetType: string;
  targetId: string;
  status: string;
  messageSid?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};

type TwilioHistorySummary = {
  total: number;
  sent: number;
  failed: number;
  delivered: number;
};

type TwilioAutomationMode = 'due' | 'overdue' | 'all';

type TwilioPerformance = {
  last7Days: {
    sent: number;
    delivered: number;
    failed: number;
    deliveryRate: number;
    failureRate: number;
  };
  byDay: Array<{
    date: string;
    sent: number;
    delivered: number;
    failed: number;
  }>;
};

type AuditLogRow = {
  id: string;
  createdAt: string;
  action: string;
  ip: string;
  actorType: 'admin' | 'master' | 'system' | 'anonymous';
  actorId: string;
  actorName: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string | number | boolean | null>;
};

type ActiveSessionRow = {
  id: string;
  kind: 'admin' | 'master';
  subjectId: string;
  subjectName: string;
  actorEmail?: string;
  restaurantSlug?: string;
  role?: string | null;
  ip: string;
  userAgent?: string | null;
  createdAt: string;
  lastSeenAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  isCurrent?: boolean;
};

type InvoiceSharePayload = {
  invoiceId: string;
  restaurantName: string;
  phoneDigits: string;
  ownerEmail: string;
  message: string;
  twilioTemplateId?: string;
};

type AdminPlan = {
  id: string;
  name: string;
  price: number;
  color: string;
  description: string;
  features: string[];
  allowedTabs?: PlanMasterTab[];
  manualOrderLimitEnabled?: boolean;
  manualOrderLimitPerMonth?: number | null;
  active: boolean;
  subscribers: number;
};

type PlanMasterTab =
  | 'dashboard'
  | 'orders'
  | 'menu'
  | 'highlights'
  | 'clients'
  | 'billing'
  | 'promotions'
  | 'banners'
  | 'marketing'
  | 'settings'
  | 'plans'
  | 'support';

type PlanForm = {
  name: string;
  price: string;
  color: string;
  description: string;
  features: string[];
  allowedTabs: PlanMasterTab[];
  manualOrderLimitEnabled: boolean;
  manualOrderLimitPerMonth: string;
};

type Payout = {
  id: string;
  restaurant: string;
  cycle: string;
  dueDate: string;
  pixKey: string;
  pixType: 'CNPJ' | 'CPF' | 'EMAIL' | 'RANDOM';
  amount: number;
  status: 'Pendente' | 'Pago' | 'Falha';
  group: 'today' | 'late' | 'upcoming';
};

type NotificationTemplate = {
  id: string;
  title: string;
  message: string;
  variables: string[];
  active: boolean;
};

type TeamUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Ativo' | 'Inativo';
  lastAccessAt?: string | null;
};

type TeamRole = {
  id: string;
  name: string;
  permissions: string[];
};

type SupportTicket = {
  id: string;
  subject: string;
  requesterName: string;
  requesterEmail: string;
  requesterType: 'Parceiro' | 'Cliente';
  restaurantName?: string;
  restaurantSlug?: string;
  status: 'Aberto' | 'Em andamento' | 'Aguardando' | 'Fechado';
  category: string;
  lastMessageAt: string;
  lastMessagePreview?: string;
};

type SupportMessage = {
  id: string;
  ticketId: string;
  authorName: string;
  authorRole: 'customer' | 'agent';
  body: string;
  createdAt: string;
  internal?: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    type?: string;
    size?: number;
  }>;
};

type SupportQuickReply = {
  id: string;
  label: string;
  body: string;
  status: SupportTicket['status'];
};

const initialForm: NewRestaurantForm = {
  name: '',
  legalName: '',
  document: '',
  email: '',
  password: '123456',
  whatsapp: '',
  address: '',
  city: '',
  state: 'SP',
  slug: '',
  plan: '',
  subscribedPlanId: ''
};

const financeTabs = [
  { id: 'overview', label: 'Visao Geral' },
  { id: 'invoices', label: 'Faturas & Cobrancas' },
  { id: 'delinquency', label: 'Inadimplencia' }
];

const masterTabOptions: Array<{ value: PlanMasterTab; label: string }> = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'orders', label: 'Pedidos' },
  { value: 'menu', label: 'Cardapio' },
  { value: 'highlights', label: 'Destaques' },
  { value: 'clients', label: 'Clientes' },
  { value: 'billing', label: 'Faturamento' },
  { value: 'promotions', label: 'Promocoes' },
  { value: 'banners', label: 'Banners' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'settings', label: 'Configuracoes' },
  { value: 'plans', label: 'Plano' },
  { value: 'support', label: 'Suporte' }
];

const defaultPlanTabs = masterTabOptions.map((item) => item.value);

const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const initialPlans: AdminPlan[] = [
  {
    id: 'plan_local',
    name: 'Plano Local',
    price: 149.9,
    color: '#6366f1',
    description: 'Ideal para pequenos comercios que vendem apenas no bairro.',
    features: ['Cardapio Digital', 'Recebimento via WhatsApp', 'Ate 500 pedidos/mes', 'Suporte por Email'],
    allowedTabs: ['dashboard', 'orders', 'menu', 'clients', 'settings', 'plans', 'support'],
    manualOrderLimitEnabled: true,
    manualOrderLimitPerMonth: 500,
    active: true,
    subscribers: 740
  },
  {
    id: 'plan_local_online',
    name: 'Plano Local + Online',
    price: 299.9,
    color: '#10b981',
    description: 'Para quem quer escalar e vender online com pagamento automatico.',
    features: [
      'Tudo do Plano Local',
      'Pagamento Online (Pix/Cartao)',
      'Pedidos Ilimitados',
      'Gestor de Entregas',
      'Ferramenta de Cupons'
    ],
    allowedTabs: [...defaultPlanTabs],
    manualOrderLimitEnabled: false,
    manualOrderLimitPerMonth: null,
    active: true,
    subscribers: 500
  }
];

const financeStatusStyles: Record<string, string> = {
  Pago: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  Vencido: 'bg-red-50 text-red-700 border-red-200',
  Estornado: 'bg-slate-100 text-slate-600 border-slate-200'
};

const menuItems = [
  { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'restaurants' as PageId, label: 'Restaurantes', icon: Store },
  { id: 'customers' as PageId, label: 'Consumidores', icon: Users },
  { id: 'leads' as PageId, label: 'Onboarding / Leads', icon: Users },
  { id: 'marketing' as PageId, label: 'Marketing & Campanhas', icon: Megaphone },
  { id: 'financial' as PageId, label: 'Financeiro', icon: CreditCard },
  { id: 'plans' as PageId, label: 'Planos', icon: Wallet },
  { id: 'stats' as PageId, label: 'Estatisticas', icon: LayoutDashboard },
  { id: 'team' as PageId, label: 'Equipe & Acessos', icon: ShieldAlert },
  { id: 'support' as PageId, label: 'Suporte & Tickets', icon: LifeBuoy },
  { id: 'settings' as PageId, label: 'Configuracoes', icon: Settings },
  { id: 'security' as PageId, label: 'Seguranca & Logs', icon: ShieldAlert }
];

const menuGroups = [
  { id: 'overview', label: 'Visao Geral', items: ['dashboard', 'stats'] as PageId[] },
  { id: 'operation', label: 'Operacao', items: ['restaurants', 'customers', 'leads', 'marketing'] as PageId[] },
  { id: 'finance', label: 'Financeiro', items: ['financial', 'plans'] as PageId[] },
  { id: 'admin', label: 'Administrativo', items: ['team', 'support'] as PageId[] },
  { id: 'system', label: 'Sistema', items: ['settings', 'security'] as PageId[] }
];

const statusColors = {
  Ativo: 'bg-green-100 text-green-700',
  Inativo: 'bg-slate-200 text-slate-700',
  Pendente: 'bg-yellow-100 text-yellow-700',
  Bloqueado: 'bg-red-100 text-red-700'
} as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function AdminPage() {
  const router = useRouter();
  const idleLogoutInProgressRef = useRef(false);
  const lastActivityWriteRef = useRef(0);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [activeFinanceTab, setActiveFinanceTab] = useState('overview');
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [dashboardData, setDashboardData] = useState<AdminDashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Ativo' | 'Inativo'>('all');
  const [financeOverview, setFinanceOverview] = useState<FinanceOverview | null>(null);
  const [financeLoading, setFinanceLoading] = useState(false);
  const [financeInvoices, setFinanceInvoices] = useState<FinanceInvoice[]>([]);
  const [financeTotal, setFinanceTotal] = useState(0);
  const [financeQuery, setFinanceQuery] = useState('');
  const [financeStatus, setFinanceStatus] = useState<'all' | 'Pago' | 'Pendente' | 'Vencido' | 'Estornado'>('all');
  const [financePage, setFinancePage] = useState(1);
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [plansSearch, setPlansSearch] = useState('');
  const [invoiceSharePayload, setInvoiceSharePayload] = useState<InvoiceSharePayload | null>(null);
  const [openInvoiceMenuId, setOpenInvoiceMenuId] = useState<string | null>(null);
  const [plans, setPlans] = useState<AdminPlan[]>(initialPlans);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanForm>({
    name: '',
    price: '0',
    color: '#000000',
    description: '',
    features: [''],
    allowedTabs: [...defaultPlanTabs],
    manualOrderLimitEnabled: false,
    manualOrderLimitPerMonth: ''
  });
  const [delinquencyInvoices, setDelinquencyInvoices] = useState<FinanceInvoice[]>([]);
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [teamRoles, setTeamRoles] = useState<TeamRole[]>([]);
  const [teamView, setTeamView] = useState<'users' | 'roles'>('users');
  const [teamQuery, setTeamQuery] = useState('');
  const [teamLoading, setTeamLoading] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [editingTeamUser, setEditingTeamUser] = useState<TeamUser | null>(null);
  const [teamForm, setTeamForm] = useState({
    name: '',
    email: '',
    role: '' as TeamUser['role'],
    status: 'Ativo' as TeamUser['status'],
    password: ''
  });
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleBusyId, setRoleBusyId] = useState<string | null>(null);
  const [roleForm, setRoleForm] = useState({
    name: '',
    permissions: [] as string[]
  });
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportQuery, setSupportQuery] = useState('');
  const [supportType, setSupportType] = useState<'all' | 'Parceiro' | 'Cliente'>('all');
  const [supportStatus, setSupportStatus] = useState<'all' | SupportTicket['status']>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [supportReply, setSupportReply] = useState('');
  const [supportTab, setSupportTab] = useState<'reply' | 'note' | 'quick'>('reply');
  const [supportQuickReplies, setSupportQuickReplies] = useState<SupportQuickReply[]>([]);
  const [editingQuickReplyId, setEditingQuickReplyId] = useState<string | null>(null);
  const [quickReplyForm, setQuickReplyForm] = useState({
    label: '',
    body: '',
    status: 'Aberto' as SupportTicket['status']
  });
  const supportMessagesRef = useRef<HTMLDivElement | null>(null);
  const [paymentsConfig, setPaymentsConfig] = useState({
    provider: 'stripe',
    methods: {
      pix: { enabled: true, percentFee: 1.0, fixedFee: 0 },
      card: { enabled: true, percentFee: 3.2, fixedFee: 0.39 }
    },
    payoutSchedule: 'weekly' as 'weekly' | 'daily',
    weeklyPayoutDay: 5,
    dailyEnabled: true,
    gatewayApiKey: 'abacae_live_****************',
    autoPayoutD1: true,
    autoPayoutD30: true,
    notifyWhatsapp: true
  });
  const [paymentsTab, setPaymentsTab] = useState<'agenda' | 'requests' | 'history' | 'gateway'>('agenda');
  const [paymentsQuery, setPaymentsQuery] = useState('');
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(false);
  const [gatewayBalance, setGatewayBalance] = useState<number | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    overview: true,
    operation: false,
    finance: false,
    admin: false,
    system: false
  });
  const [settingsTab, setSettingsTab] = useState<'general' | 'branding' | 'notifications' | 'integrations' | 'twilio' | 'security' | 'backup'>('general');
  const backupImportPayloadRef = useRef<SystemBackupPayload | Record<string, unknown> | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);
  const [backupBusyAction, setBackupBusyAction] = useState<null | 'export' | 'import'>(null);
  const [backupFileName, setBackupFileName] = useState('');
  const [backupPreview, setBackupPreview] = useState<{ generatedAt: string | null; summary: SystemBackupSummary } | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditActions, setAuditActions] = useState<string[]>([]);
  const [auditTargetTypes, setAuditTargetTypes] = useState<string[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditQuery, setAuditQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditTargetTypeFilter, setAuditTargetTypeFilter] = useState('all');
  const [auditTargetIdFilter, setAuditTargetIdFilter] = useState('');
  const [activeSessionsRows, setActiveSessionsRows] = useState<ActiveSessionRow[]>([]);
  const [activeSessionsLoading, setActiveSessionsLoading] = useState(false);
  const [sessionsScopeFilter, setSessionsScopeFilter] = useState<'all' | 'admin' | 'master'>('all');
  const [twoFactorState, setTwoFactorState] = useState<{ enabled: boolean; pending: boolean; secretPreview: string | null; otpauthUri: string | null }>({
    enabled: false,
    pending: false,
    secretPreview: null,
    otpauthUri: null
  });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    platformName: 'PedeZap',
    supportUrl: 'https://ajuda.pedezap.ai',
    contactEmail: 'contato@pedezap.ai',
    maintenanceMode: false,
    versionLabel: 'v2.4.0 (Build 9021)',
    logoUrl: '',
    faviconUrl: '',
    colorPrimary: '#10B981',
    colorSecondary: '#0F172A',
    colorAccent: '#FBBF24',
    locationAutocompleteMode: 'internet' as 'hybrid' | 'json' | 'internet',
    notificationTemplates: [
      {
        id: 'tpl_welcome',
        title: 'Boas-vindas (Novo Restaurante)',
        message: 'Ola {nome_restaurante}! Sua conta no PedeZap foi ativada com sucesso. Acesse seu painel em: {link_painel}',
        variables: ['{nome_restaurante}', '{link_painel}', '{senha_provisoria}'],
        active: true
      },
      {
        id: 'tpl_new_order',
        title: 'Novo Pedido (Para o Cliente)',
        message: 'Oi {nome_cliente}! Recebemos seu pedido #{numero_pedido} no valor de {valor_total}. Previsao: {tempo_estimado}.',
        variables: ['{nome_cliente}', '{numero_pedido}', '{valor_total}', '{tempo_estimado}'],
        active: true
      },
      {
        id: 'tpl_invoice_due',
        title: 'Cobranca de Fatura',
        message:
          'Ola {nome_restaurante}! Segue a cobranca da fatura {numero_fatura} do PedeZap.\nValor: {valor_fatura}\nVencimento: {vencimento_fatura}\nForma de pagamento: {forma_pagamento}\nAcesse seu painel: {link_painel}',
        variables: [
          '{nome_restaurante}',
          '{numero_fatura}',
          '{valor_fatura}',
          '{vencimento_fatura}',
          '{forma_pagamento}',
          '{link_painel}'
        ],
        active: true
      },
      {
        id: 'tpl_invoice_overdue',
        title: 'Cobranca Vencida',
        message:
          'Ola {nome_restaurante}! Sua fatura {numero_fatura} esta vencida.\nValor: {valor_fatura}\nRegularize o pagamento para evitar suspensao.\nPainel: {link_painel}',
        variables: ['{nome_restaurante}', '{numero_fatura}', '{valor_fatura}', '{link_painel}'],
        active: true
      }
    ] as NotificationTemplate[],
    integrations: {
      abacatepay: {
        connected: false,
        environment: 'Producao' as 'Producao' | 'Teste',
        webhookUrl: 'https://api.pedezap.ai/v1/webhooks/abacatepay'
      },
      stripe: {
        connected: true,
        webhookUrl: 'https://api.pedezap.ai/v1/webhooks/stripe'
      },
      whatsappEvolution: {
        connected: false,
        webhookUrl: 'https://api.pedezap.ai/v1/webhooks/whatsapp-evolution'
      },
      twilio: {
        connected: false,
        whatsappFrom: 'whatsapp:+14155238886',
        statusCallbackUrl: ''
      }
    },
    securityPolicies: {
      enforce2FA: false,
      auditLogs: true,
      suspiciousLoginAlert: true
    }
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [twilioTestPhone, setTwilioTestPhone] = useState('');
  const [twilioTestMessage, setTwilioTestMessage] = useState(
    'Ola! Esta e uma mensagem de teste enviada pelo modulo Twilio do PedeZap.'
  );
  const [twilioSending, setTwilioSending] = useState(false);
  const [twilioAutomationRunning, setTwilioAutomationRunning] = useState(false);
  const [twilioResendingId, setTwilioResendingId] = useState<string | null>(null);
  const [twilioHistory, setTwilioHistory] = useState<TwilioMessageLogRow[]>([]);
  const [twilioHistorySummary, setTwilioHistorySummary] = useState<TwilioHistorySummary>({
    total: 0,
    sent: 0,
    failed: 0,
    delivered: 0
  });
  const [twilioHistoryQuery, setTwilioHistoryQuery] = useState('');
  const [twilioHistoryStatusFilter, setTwilioHistoryStatusFilter] = useState('all');
  const [twilioHistoryTemplateFilter, setTwilioHistoryTemplateFilter] = useState('all');
  const [twilioHistoryTemplates, setTwilioHistoryTemplates] = useState<string[]>([]);
  const [twilioPerformance, setTwilioPerformance] = useState<TwilioPerformance>({
    last7Days: {
      sent: 0,
      delivered: 0,
      failed: 0,
      deliveryRate: 0,
      failureRate: 0
    },
    byDay: []
  });
  const [notificationsView, setNotificationsView] = useState<'templates' | 'dictionary'>('templates');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    title: '',
    message: '',
    variables: '{nome}, {valor}'
  });
  const [financeForm, setFinanceForm] = useState({
    restaurantSlug: '',
    value: '',
    dueDate: '',
    method: 'Cartao de Credito' as FinanceInvoice['method']
  });
  const [showModal, setShowModal] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7' | '30' | '90'>('30');
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AdminAnalytics | null>(null);
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [marketingData, setMarketingData] = useState<AdminMarketing | null>(null);
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [customersSummary, setCustomersSummary] = useState<AdminCustomersSummary | null>(null);
  const [customersQuery, setCustomersQuery] = useState('');
  const [customersStatusFilter, setCustomersStatusFilter] = useState<'all' | AdminCustomerRow['status']>('all');
  const [customersLoading, setCustomersLoading] = useState(false);
  const [form, setForm] = useState<NewRestaurantForm>(initialForm);
  const [saving, setSaving] = useState(false);
  const [modalTab, setModalTab] = useState<'general' | 'address' | 'access'>('general');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<NewRestaurantForm | null>(null);
  const [editingRestaurant, setEditingRestaurant] = useState<AdminRestaurant | null>(null);
  const [passwordResetPayload, setPasswordResetPayload] = useState<PasswordResetPayload | null>(null);
  const [generatingResetSlug, setGeneratingResetSlug] = useState<string | null>(null);

  const performAdminLogout = async (reason: 'manual' | 'idle' = 'manual') => {
    if (idleLogoutInProgressRef.current) return;
    idleLogoutInProgressRef.current = true;
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => null);
    localStorage.removeItem('pedezap_admin_session');
    localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
    if (reason === 'idle') {
      router.replace('/awserver/login?expired=1');
    } else {
      router.push('/awserver/login');
    }
  };

  const markAdminActivity = () => {
    if (typeof window === 'undefined' || !session) return;
    const now = Date.now();
    if (now - lastActivityWriteRef.current < 4000) return;
    lastActivityWriteRef.current = now;
    localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(now));
  };

  async function loadData() {
    const [restaurantsRes, statsRes] = await Promise.all([
      fetch('/api/admin/restaurants').then((res) => res.json()),
      fetch('/api/admin/stats').then((res) => res.json())
    ]);
    setRestaurants(restaurantsRes.restaurants ?? []);
    setStats(statsRes.stats ?? null);
  }

  async function loadDashboard() {
    setDashboardLoading(true);
    const response = await fetch('/api/admin/dashboard');
    const payload = await response.json().catch(() => null);
    if (payload?.success) {
      setDashboardData(payload.dashboard ?? null);
    } else {
      setDashboardData(null);
    }
    setDashboardLoading(false);
  }

  async function loadAnalytics(days: '7' | '30' | '90' = analyticsPeriod) {
    setAnalyticsLoading(true);
    const response = await fetch(`/api/admin/analytics?days=${days}`);
    const payload = await response.json().catch(() => null);
    if (payload?.success) {
      setAnalyticsData(payload.analytics ?? null);
    }
    setAnalyticsLoading(false);
  }

  async function loadMarketing() {
    setMarketingLoading(true);
    const response = await fetch('/api/admin/marketing?days=14');
    const payload = await response.json().catch(() => null);
    if (payload?.success) {
      setMarketingData(payload.marketing ?? null);
    } else {
      setMarketingData(null);
    }
    setMarketingLoading(false);
  }

  async function loadCustomers() {
    setCustomersLoading(true);
    const params = new URLSearchParams();
    if (customersQuery.trim()) params.set('q', customersQuery.trim());
    if (customersStatusFilter !== 'all') params.set('status', customersStatusFilter);
    const response = await fetch(`/api/admin/customers?${params.toString()}`);
    const payload = await response.json().catch(() => null);
    if (payload?.success) {
      setCustomers(payload.customers ?? []);
      setCustomersSummary(payload.summary ?? null);
    }
    setCustomersLoading(false);
  }

  async function loadFinanceOverview() {
    setFinanceLoading(true);
    const response = await fetch('/api/admin/finance/overview');
    const payload = await response.json();
    setFinanceOverview(
      payload?.success
        ? {
            kpis: payload.kpis,
            mrrData: payload.mrrData,
            planDistribution: payload.planDistribution
          }
        : null
    );
    setFinanceLoading(false);
  }

  async function loadPlans() {
    const response = await fetch("/api/admin/plans");
    const payload = await response.json().catch(() => null);
    if (!payload?.success) return;
    setPlans(payload.plans ?? []);
  }

  async function loadFinanceInvoices(page = financePage) {
    const params = new URLSearchParams();
    if (financeQuery) params.set('q', financeQuery);
    if (financeStatus !== 'all') params.set('status', financeStatus);
    params.set('page', String(page));
    params.set('pageSize', '5');
    const response = await fetch(`/api/admin/finance/invoices?${params.toString()}`);
    const payload = await response.json();
    if (payload?.success) {
      setFinanceInvoices(payload.invoices ?? []);
      setFinanceTotal(payload.total ?? 0);
    }
  }

  async function loadDelinquencyInvoices() {
    const params = new URLSearchParams();
    params.set('status', 'Vencido');
    params.set('page', '1');
    params.set('pageSize', '5');
    const response = await fetch(`/api/admin/finance/invoices?${params.toString()}`);
    const payload = await response.json();
    if (payload?.success) {
      setDelinquencyInvoices(payload.invoices ?? []);
    }
  }

  async function loadAuditLogs(page = auditPage) {
    setAuditLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: '20'
    });
    if (auditQuery) params.set('q', auditQuery);
    if (auditActionFilter !== 'all') params.set('action', auditActionFilter);
    if (auditTargetTypeFilter !== 'all') params.set('targetType', auditTargetTypeFilter);
    if (auditTargetIdFilter) params.set('targetId', auditTargetIdFilter);
    const response = await fetch(`/api/admin/security/audit-logs?${params.toString()}`);
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      setAuditLogs(payload.logs ?? []);
      setAuditActions(payload.actions ?? []);
      setAuditTargetTypes(payload.targetTypes ?? []);
      setAuditTotal(payload.total ?? 0);
    } else {
      setAuditLogs([]);
      setAuditActions([]);
      setAuditTargetTypes([]);
      setAuditTotal(0);
    }
    setAuditLoading(false);
  }

  async function loadActiveSessions() {
    setActiveSessionsLoading(true);
    const params = new URLSearchParams();
    if (sessionsScopeFilter !== 'all') params.set('scope', sessionsScopeFilter);
    const response = await fetch(`/api/admin/security/sessions?${params.toString()}`);
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      setActiveSessionsRows(payload.sessions ?? []);
    } else {
      setActiveSessionsRows([]);
    }
    setActiveSessionsLoading(false);
  }

  async function loadAdminTwoFactorState() {
    const response = await fetch('/api/admin/security/2fa');
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      setTwoFactorState({
        enabled: !!payload.twoFactor?.enabled,
        pending: !!payload.twoFactor?.pending,
        secretPreview: payload.twoFactor?.secretPreview ?? null,
        otpauthUri: payload.twoFactor?.otpauthUri ?? null
      });
    }
  }

  const startTwoFactorSetup = async () => {
    setTwoFactorLoading(true);
    const response = await fetch('/api/admin/security/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel iniciar configuracao do 2FA.');
      setTwoFactorLoading(false);
      return;
    }
    setTwoFactorState({
      enabled: !!payload.twoFactor?.enabled,
      pending: !!payload.twoFactor?.pending,
      secretPreview: payload.twoFactor?.secretPreview ?? null,
      otpauthUri: payload.twoFactor?.otpauthUri ?? null
    });
    setTwoFactorCode('');
    setTwoFactorLoading(false);
  };

  const confirmTwoFactorSetup = async () => {
    if (!twoFactorCode.trim()) {
      alert('Digite o codigo 2FA.');
      return;
    }
    setTwoFactorLoading(true);
    const response = await fetch('/api/admin/security/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', code: twoFactorCode })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel ativar o 2FA.');
      setTwoFactorLoading(false);
      return;
    }
    setTwoFactorCode('');
    await loadAdminTwoFactorState();
    await loadAuditLogs(1);
    setTwoFactorLoading(false);
  };

  const disableTwoFactor = async () => {
    if (!twoFactorCode.trim()) {
      alert('Digite o codigo atual do autenticador para desativar.');
      return;
    }
    setTwoFactorLoading(true);
    const response = await fetch('/api/admin/security/2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disable', code: twoFactorCode })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel desativar o 2FA.');
      setTwoFactorLoading(false);
      return;
    }
    setTwoFactorCode('');
    await loadAdminTwoFactorState();
    await loadAuditLogs(1);
    setTwoFactorLoading(false);
  };

  const handleRevokeSession = async (sessionId: string) => {
    const confirmRevoke = confirm('Encerrar esta sessao agora?');
    if (!confirmRevoke) return;
    const response = await fetch('/api/admin/security/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      alert(payload?.message ?? 'Nao foi possivel encerrar a sessao.');
      return;
    }
    await loadActiveSessions();
    await loadAuditLogs(1);
  };

  async function loadTeamUsers() {
    setTeamLoading(true);
    const response = await fetch('/api/admin/team');
    const payload = await response.json();
    if (payload?.success) {
      setTeamUsers(payload.users ?? []);
    }
    setTeamLoading(false);
  }

  async function loadTeamRoles() {
    const response = await fetch('/api/admin/roles');
    const payload = await response.json();
    if (payload?.success) {
      setTeamRoles(payload.roles ?? []);
    }
  }

  const handleSaveTeamUser = async () => {
    if (!teamForm.name || !teamForm.email || !teamForm.role || (!editingTeamUser && !teamForm.password)) {
      alert('Preencha os campos obrigatorios.');
      return;
    }
    if (!editingTeamUser && teamForm.password.length < 6) {
      alert('A senha precisa ter no minimo 6 caracteres.');
      return;
    }

    const payload = {
      name: teamForm.name,
      email: teamForm.email,
      role: teamForm.role,
      status: teamForm.status,
      password: teamForm.password || undefined
    };

    const response = await fetch(`/api/admin/team${editingTeamUser ? `/${editingTeamUser.id}` : ''}`, {
      method: editingTeamUser ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      alert(errorPayload?.message ?? 'Nao foi possivel salvar o usuario.');
      return;
    }

    setShowTeamModal(false);
    setEditingTeamUser(null);
    setTeamForm({ name: '', email: '', role: 'Suporte', status: 'Ativo', password: '' });
    await loadTeamUsers();
  };

  const handleEditTeamUser = (user: TeamUser) => {
    setEditingTeamUser(user);
    setTeamForm({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: ''
    });
    setShowTeamModal(true);
  };

  const handleDeleteTeamUser = async (userId: string) => {
    if (!confirm('Deseja remover este usuario?')) return;
    const response = await fetch(`/api/admin/team/${userId}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      alert(errorPayload?.message ?? 'Nao foi possivel remover o usuario.');
      return;
    }
    await loadTeamUsers();
  };

  const allPermissions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'restaurants', label: 'Restaurantes' },
    { id: 'customers', label: 'Consumidores' },
    { id: 'leads', label: 'Onboarding / Leads' },
    { id: 'marketing', label: 'Marketing & Campanhas' },
    { id: 'financial', label: 'Financeiro' },
    { id: 'plans', label: 'Planos' },
    { id: 'stats', label: 'Estatisticas' },
    { id: 'team', label: 'Equipe & Acessos' },
    { id: 'support', label: 'Suporte & Tickets' },
    { id: 'settings', label: 'Configuracoes' },
    { id: 'security', label: 'Seguranca & Logs' }
  ];

  const toggleRolePermission = (permissionId: string) => {
    setRoleForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((item) => item !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const resetRoleForm = () => {
    setShowRoleModal(false);
    setEditingRoleId(null);
    setRoleForm({ name: '', permissions: [] });
  };

  const handleEditRole = (role: TeamRole) => {
    setEditingRoleId(role.id);
    setRoleForm({
      name: role.name,
      permissions: role.permissions ?? []
    });
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name || roleForm.permissions.length === 0) {
      alert('Defina o nome e pelo menos uma permissao.');
      return;
    }
    const response = await fetch(`/api/admin/roles${editingRoleId ? `/${editingRoleId}` : ''}`, {
      method: editingRoleId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: roleForm.name.trim(),
        permissions: roleForm.permissions
      })
    });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      alert(errorPayload?.message ?? 'Nao foi possivel salvar o cargo.');
      return;
    }
    resetRoleForm();
    await loadTeamRoles();
    await loadTeamUsers();
  };

  const handleDeleteRole = async (role: TeamRole) => {
    const linkedUsers = teamUsers.filter((user) => user.role === role.name).length;
    const confirmMessage =
      linkedUsers > 0
        ? `O cargo "${role.name}" possui ${linkedUsers} usuario(s) vinculado(s) e nao pode ser excluido agora.`
        : `Deseja excluir o cargo "${role.name}"?`;
    if (linkedUsers > 0) {
      alert(confirmMessage);
      return;
    }
    if (!confirm(confirmMessage)) return;

    setRoleBusyId(role.id);
    const response = await fetch(`/api/admin/roles/${role.id}`, { method: 'DELETE' });
    setRoleBusyId(null);
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      alert(errorPayload?.message ?? 'Nao foi possivel excluir o cargo.');
      return;
    }
    await loadTeamRoles();
  };

  async function loadSupportTickets(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) setSupportLoading(true);
    const params = new URLSearchParams();
    if (supportQuery) params.set('q', supportQuery);
    if (supportType !== 'all') params.set('type', supportType);
    if (supportStatus !== 'all') params.set('status', supportStatus);
    const response = await fetch(`/api/admin/support/tickets?${params.toString()}`);
    const payload = await response.json();
    if (payload?.success) {
      setSupportTickets(payload.tickets ?? []);
      if (!selectedTicketId && payload.tickets?.length) {
        setSelectedTicketId(payload.tickets[0].id);
      }
    }
    if (!silent) setSupportLoading(false);
  }

  async function loadSupportTicketDetails(ticketId: string) {
    const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
    const payload = await response.json();
    if (payload?.success) {
      setSupportMessages(payload.messages ?? []);
    }
  }

  async function loadSupportQuickReplies() {
    const response = await fetch('/api/admin/support/quick-replies');
    const payload = await response.json();
    if (payload?.success) {
      setSupportQuickReplies(payload.quickReplies ?? []);
    }
  }

  async function loadPaymentsConfig() {
    const response = await fetch('/api/admin/payments/config');
    const payload = await response.json();
    if (payload?.success) {
      setPaymentsConfig(payload.config);
    }
  }

  async function loadPaymentsPayouts(tab = paymentsTab) {
    setPayoutsLoading(true);
    const params = new URLSearchParams();
    params.set('tab', tab);
    if (paymentsQuery) params.set('q', paymentsQuery);
    const response = await fetch(`/api/admin/payments/payouts?${params.toString()}`);
    const payload = await response.json();
    if (payload?.success) {
      setPayouts(payload.payouts ?? []);
    }
    setPayoutsLoading(false);
  }

  async function loadGatewayBalance() {
    const response = await fetch('/api/admin/abacatepay/store');
    const payload = await response.json();
    if (payload?.success) {
      const available = payload.store?.balance?.available ?? payload.store?.wallet?.available;
      if (typeof available === 'number') {
        setGatewayBalance(available / 100);
      }
    }
  }

  async function loadAdminSettings() {
    const response = await fetch('/api/admin/settings');
    const payload = await response.json();
    if (payload?.success) {
      setSettingsForm((prev) => ({
        ...prev,
        ...payload.settings,
        notificationTemplates: payload.settings.notificationTemplates ?? prev.notificationTemplates,
        integrations: {
          ...prev.integrations,
          ...(payload.settings.integrations ?? {}),
          abacatepay: {
            ...prev.integrations.abacatepay,
            ...(payload.settings.integrations?.abacatepay ?? {})
          },
          stripe: {
            ...prev.integrations.stripe,
            ...(payload.settings.integrations?.stripe ?? {})
          },
          whatsappEvolution: {
            ...prev.integrations.whatsappEvolution,
            ...(payload.settings.integrations?.whatsappEvolution ?? {})
          },
          twilio: {
            ...prev.integrations.twilio,
            ...(payload.settings.integrations?.twilio ?? {})
          }
        },
        securityPolicies: {
          ...prev.securityPolicies,
          ...(payload.settings.securityPolicies ?? {})
        }
      }));
    }
  }

  async function loadTwilioHistory() {
    const params = new URLSearchParams();
    if (twilioHistoryQuery.trim()) params.set('q', twilioHistoryQuery.trim());
    if (twilioHistoryStatusFilter !== 'all') params.set('status', twilioHistoryStatusFilter);
    if (twilioHistoryTemplateFilter !== 'all') params.set('templateId', twilioHistoryTemplateFilter);
    const response = await fetch(`/api/admin/twilio/history?${params.toString()}`);
    const payload = await response.json().catch(() => null);
    if (payload?.success) {
      setTwilioHistory(payload.messages ?? []);
      setTwilioHistoryTemplates(payload.templates ?? []);
      setTwilioPerformance(
        payload.performance ?? {
          last7Days: {
            sent: 0,
            delivered: 0,
            failed: 0,
            deliveryRate: 0,
            failureRate: 0
          },
          byDay: []
        }
      );
      setTwilioHistorySummary(
        payload.summary ?? {
          total: 0,
          sent: 0,
          failed: 0,
          delivered: 0
        }
      );
    }
  }

  async function saveAdminSettings() {
    setSettingsSaving(true);
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsForm)
    });
    setSettingsSaving(false);
    if (!response.ok) {
      alert('Nao foi possivel salvar as configuracoes.');
      return;
    }
  }

  async function exportSystemBackup() {
    setBackupBusyAction('export');
    setBackupError(null);
    setBackupMessage(null);
    const response = await fetch('/api/admin/backup');
    const rawText = await response.text();
    setBackupBusyAction(null);
    if (!response.ok) {
      try {
        const payload = JSON.parse(rawText) as { message?: string };
        setBackupError(payload.message ?? 'Nao foi possivel exportar o backup.');
      } catch {
        setBackupError('Nao foi possivel exportar o backup.');
      }
      return;
    }

    const parsed = JSON.parse(rawText) as SystemBackupPayload;
    const preview = resolveBackupPreview(parsed);
    const fileName = `pedezap-backup-${(preview?.generatedAt ?? new Date().toISOString()).slice(0, 19).replace(/[:T]/g, '-')}.json`;
    const blob = new Blob([rawText], { type: 'application/json;charset=utf-8' });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    setBackupPreview(preview);
    setBackupFileName(fileName);
    setBackupMessage('Backup completo exportado com sucesso.');
  }

  async function handleBackupFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBackupError(null);
    setBackupMessage(null);
    setBackupFileName(file.name);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as SystemBackupPayload | Record<string, unknown>;
      const preview = resolveBackupPreview(parsed);
      if (!preview) {
        throw new Error('Arquivo de backup invalido.');
      }
      backupImportPayloadRef.current = parsed;
      setBackupPreview(preview);
      setBackupMessage('Arquivo carregado. Revise o resumo e confirme a importacao.');
    } catch (error) {
      backupImportPayloadRef.current = null;
      setBackupPreview(null);
      setBackupError(error instanceof Error ? error.message : 'Nao foi possivel ler o arquivo de backup.');
    }
  }

  async function importSystemBackup() {
    if (!backupImportPayloadRef.current) {
      setBackupError('Selecione um arquivo de backup antes de importar.');
      return;
    }
    const confirmed = confirm(
      'Importar o backup vai substituir o estado atual do sistema inteiro. Deseja continuar?'
    );
    if (!confirmed) return;

    setBackupBusyAction('import');
    setBackupError(null);
    setBackupMessage(null);
    const response = await fetch('/api/admin/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backup: backupImportPayloadRef.current })
    });
    const payload = await response.json().catch(() => null);
    setBackupBusyAction(null);
    if (!response.ok || !payload?.success) {
      setBackupError(payload?.message ?? 'Nao foi possivel importar o backup.');
      return;
    }

    alert('Backup importado com sucesso. A pagina sera recarregada para aplicar os dados restaurados.');
    window.location.reload();
  }

  async function runTwilioAutomation(mode: 'due' | 'overdue' | 'all') {
    setTwilioAutomationRunning(true);
    const response = await fetch('/api/admin/twilio/automations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
    const payload = await response.json().catch(() => null);
    setTwilioAutomationRunning(false);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel rodar a automacao do Twilio.');
      return;
    }
    alert(
      `Automacao concluida. Enviadas: ${payload.summary?.sent ?? 0} | Falhas: ${
        payload.summary?.failed ?? 0
      } | Ignoradas: ${payload.summary?.skipped ?? 0}`
    );
    await Promise.all([loadTwilioHistory(), loadFinanceInvoices(financePage)]);
  }

  async function resendTwilioMessage(messageId: string) {
    setTwilioResendingId(messageId);
    const response = await fetch('/api/admin/twilio/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId })
    });
    const payload = await response.json().catch(() => null);
    setTwilioResendingId(null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel reenviar a mensagem Twilio.');
      return;
    }
    await Promise.all([loadTwilioHistory(), loadFinanceInvoices(financePage)]);
    alert('Mensagem reenviada com sucesso.');
  }

  function createNotificationTemplate() {
    const title = templateForm.title.trim();
    const message = templateForm.message.trim();
    if (!title || !message) {
      alert('Preencha titulo e mensagem.');
      return;
    }
    const variables = templateForm.variables
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const nextTemplate: NotificationTemplate = {
      id: `tpl_${Date.now()}`,
      title,
      message,
      variables,
      active: true
    };
    setSettingsForm((prev) => ({
      ...prev,
      notificationTemplates: [nextTemplate, ...prev.notificationTemplates]
    }));
    setTemplateForm({ title: '', message: '', variables: '{nome}, {valor}' });
    setShowTemplateModal(false);
  }

  function deleteNotificationTemplate(id: string) {
    setSettingsForm((prev) => ({
      ...prev,
      notificationTemplates: prev.notificationTemplates.filter((item) => item.id !== id)
    }));
  }

  function copyWebhookUrl(url: string) {
    navigator.clipboard.writeText(url);
  }

  async function handleProcessPayout(payoutId: string) {
    const response = await fetch('/api/admin/abacatepay/withdraw/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payoutId })
    });
    const payload = await response.json();
    if (!response.ok) {
      alert(payload?.message ?? 'Nao foi possivel processar o repasse.');
      return;
    }
    await loadPaymentsPayouts('requests');
  }

  async function savePaymentsConfig() {
    const response = await fetch('/api/admin/payments/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentsConfig)
    });
    if (!response.ok) {
      alert('Nao foi possivel salvar as taxas.');
      return;
    }
  }

  async function handleCreateQuickReply() {
    if (!quickReplyForm.label || !quickReplyForm.body) {
      alert('Preencha o titulo e a mensagem.');
      return;
    }
    const response = await fetch(
      `/api/admin/support/quick-replies${editingQuickReplyId ? `/${editingQuickReplyId}` : ''}`,
      {
        method: editingQuickReplyId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quickReplyForm)
      }
    );
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      alert(errorPayload?.message ?? 'Nao foi possivel criar a mensagem rapida.');
      return;
    }
    setEditingQuickReplyId(null);
    setQuickReplyForm({ label: '', body: '', status: 'Aberto' });
    await loadSupportQuickReplies();
  }

  const handleEditQuickReply = (reply: SupportQuickReply) => {
    setEditingQuickReplyId(reply.id);
    setSupportTab('quick');
    setQuickReplyForm({ label: reply.label, body: reply.body, status: reply.status });
  };

  const handleDeleteQuickReply = async (id: string) => {
    if (!confirm('Deseja excluir esta mensagem rapida?')) return;
    const response = await fetch(`/api/admin/support/quick-replies/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      alert(errorPayload?.message ?? 'Nao foi possivel excluir.');
      return;
    }
    await loadSupportQuickReplies();
  };

  async function sendSupportMessage(message: string, internal: boolean) {
    if (!selectedTicketId || !message.trim()) return;
    const response = await fetch(`/api/admin/support/tickets/${selectedTicketId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: message.trim(),
        authorName: session?.name ?? 'Agente',
        internal
      })
    });
    if (!response.ok) {
      alert('Nao foi possivel enviar a mensagem.');
      return;
    }
    setSupportReply('');
    await loadSupportTicketDetails(selectedTicketId);
    await loadSupportTickets();
  }

  async function handleSendSupportMessage() {
    await sendSupportMessage(supportReply, supportTab === 'note');
  }

  async function updateSupportStatus(nextStatus: SupportTicket['status']) {
    if (!selectedTicketId) return;
    const response = await fetch(`/api/admin/support/tickets/${selectedTicketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus })
    });
    if (!response.ok) {
      alert('Nao foi possivel atualizar o status.');
      return;
    }
    await loadSupportTickets();
  }

  const handleExportFinance = () => {
    const params = new URLSearchParams();
    if (financeQuery) params.set('q', financeQuery);
    if (financeStatus !== 'all') params.set('status', financeStatus);
    window.open(`/api/admin/finance/export?${params.toString()}`, '_blank');
  };

  const handleCreateInvoice = async () => {
    const value = Number(String(financeForm.value).replace(',', '.'));
    if (!financeForm.restaurantSlug || !financeForm.dueDate || !value) {
      alert('Preencha todos os campos obrigatorios.');
      return;
    }

    const response = await fetch('/api/admin/finance/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug: financeForm.restaurantSlug,
        value,
        dueDate: financeForm.dueDate,
        method: financeForm.method
      })
    });

    if (!response.ok) {
      alert('Nao foi possivel criar a cobranca.');
      return;
    }

    setShowFinanceModal(false);
    setFinanceForm({ restaurantSlug: '', value: '', dueDate: '', method: 'Cartao de Credito' });
    await loadFinanceInvoices(1);
    await loadFinanceOverview();
  };

  const findNotificationTemplate = (templateId: string) =>
    settingsForm.notificationTemplates.find((item) => item.id === templateId && item.active);

  const buildInvoiceTemplateVariables = (invoice: FinanceInvoice, restaurant?: AdminRestaurant | null) => ({
    nome_restaurante: invoice.restaurantName,
    numero_fatura: invoice.id,
    valor_fatura: moneyFormatter.format(invoice.value),
    vencimento_fatura: invoice.dueDate || '-',
    forma_pagamento: invoice.method,
    link_painel: `${window.location.origin}/master/login`,
    telefone_restaurante: restaurant?.whatsapp ?? ''
  });

  const buildWelcomeTemplateVariables = (payload: NewRestaurantForm) => ({
    nome_restaurante: payload.name,
    link_painel: `${window.location.origin}/master/login`,
    senha_provisoria: payload.password || '123456'
  });

  const buildInvoiceShareMessage = (invoice: FinanceInvoice) => {
    const restaurant = restaurants.find((item) => item.slug === invoice.restaurantSlug) ?? null;
    const template = findNotificationTemplate('tpl_invoice_due');
    if (template) {
      return renderNotificationTemplate(
        template.message,
        buildInvoiceTemplateVariables(invoice, restaurant)
      );
    }

    const dueDate = invoice.dueDate || '-';
    const value = moneyFormatter.format(invoice.value);
    return [
      `Ola! Segue a cobranca da fatura ${invoice.id}.`,
      `Restaurante: ${invoice.restaurantName}`,
      `Plano: ${invoice.plan}`,
      `Valor: ${value}`,
      `Vencimento: ${dueDate}`,
      `Forma de pagamento: ${invoice.method}`,
      '',
      'Acesse o painel para concluir o pagamento.'
    ].join('\n');
  };

  const handleOpenInvoiceShare = (invoice: FinanceInvoice) => {
    const restaurant = restaurants.find((item) => item.slug === invoice.restaurantSlug);
    const message = buildInvoiceShareMessage(invoice);
    const phoneDigits = (restaurant?.whatsapp ?? '').replace(/\D/g, '');
    const ownerEmail = restaurant?.ownerEmail?.trim() ?? '';

    setInvoiceSharePayload({
      invoiceId: invoice.id,
      restaurantName: invoice.restaurantName,
      phoneDigits,
      ownerEmail,
      message,
      twilioTemplateId: 'tpl_invoice_due'
    });
  };

  const sendTwilioMessage = async (payload: {
    to: string;
    message: string;
    templateId?: string;
    variables?: Record<string, string | number | boolean | null>;
    targetType: string;
    targetId: string;
  }) => {
    setTwilioSending(true);
    const response = await fetch('/api/admin/twilio/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => null);
    setTwilioSending(false);
    if (!response.ok || !data?.success) {
      alert(data?.message ?? 'Nao foi possivel enviar a mensagem pelo Twilio.');
      return false;
    }
    return true;
  };

  const handleSendTwilioTest = async () => {
    if (!twilioTestPhone.trim() || !twilioTestMessage.trim()) {
      alert('Preencha telefone e mensagem de teste.');
      return;
    }
    const sent = await sendTwilioMessage({
      to: twilioTestPhone,
      message: twilioTestMessage,
      targetType: 'twilio_test',
      targetId: 'settings'
    });
    if (sent) {
      await loadTwilioHistory();
      alert('Mensagem de teste enviada pelo Twilio.');
    }
  };

  const handleSendInvoiceViaTwilio = async () => {
    if (!invoiceSharePayload) return;
    if (!invoiceSharePayload.phoneDigits) {
      alert('Restaurante sem WhatsApp cadastrado.');
      return;
    }

    const invoice = financeInvoices.find((item) => item.id === invoiceSharePayload.invoiceId);
    const restaurant = invoice
      ? restaurants.find((item) => item.slug === invoice.restaurantSlug) ?? null
      : null;
    const variables = invoice
      ? buildInvoiceTemplateVariables(invoice, restaurant)
      : undefined;

    const sent = await sendTwilioMessage({
      to: invoiceSharePayload.phoneDigits,
      message: invoiceSharePayload.message,
      templateId: invoiceSharePayload.twilioTemplateId,
      variables,
      targetType: 'invoice',
      targetId: invoiceSharePayload.invoiceId
    });
    if (sent) {
      await Promise.all([loadTwilioHistory(), loadFinanceInvoices(financePage)]);
      alert('Cobranca enviada pelo Twilio.');
    }
  };

  const handleInvoiceAction = async (
    invoiceId: string,
    action: 'confirm' | 'refund' | 'mark_pending' | 'second_copy' | 'delete',
    options?: { dueDate?: string }
  ) => {
    const response =
      action === 'delete'
        ? await fetch(`/api/admin/finance/invoices/${invoiceId}`, { method: 'DELETE' })
        : await fetch(`/api/admin/finance/invoices/${invoiceId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...(options ?? {}) })
          });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      alert(payload?.message ?? 'Nao foi possivel atualizar a fatura.');
      return;
    }

    setOpenInvoiceMenuId(null);
    await loadFinanceInvoices(financePage);
    await loadFinanceOverview();
    await loadDelinquencyInvoices();
  };

  const resetPlanForm = () => {
    setPlanForm({
      name: '',
      price: '0',
      color: '#000000',
      description: '',
      features: [''],
      allowedTabs: [...defaultPlanTabs],
      manualOrderLimitEnabled: false,
      manualOrderLimitPerMonth: ''
    });
  };

  const openCreatePlanModal = () => {
    setEditingPlanId(null);
    resetPlanForm();
    setShowPlanModal(true);
  };

  const openEditPlanModal = (plan: AdminPlan) => {
    setEditingPlanId(plan.id);
    setPlanForm({
      name: plan.name,
      price: String(plan.price).replace('.', ','),
      color: plan.color,
      description: plan.description,
      features: plan.features.length ? [...plan.features] : [''],
      allowedTabs: plan.allowedTabs?.length ? [...plan.allowedTabs] : [...defaultPlanTabs],
      manualOrderLimitEnabled: plan.manualOrderLimitEnabled ?? false,
      manualOrderLimitPerMonth:
        plan.manualOrderLimitPerMonth && Number.isFinite(plan.manualOrderLimitPerMonth)
          ? String(plan.manualOrderLimitPerMonth)
          : ''
    });
    setShowPlanModal(true);
  };

  const handleAddPlanFeature = () => {
    setPlanForm((prev) => ({ ...prev, features: [...prev.features, ''] }));
  };

  const handleUpdatePlanFeature = (index: number, value: string) => {
    setPlanForm((prev) => ({
      ...prev,
      features: prev.features.map((item, featureIndex) => (featureIndex === index ? value : item))
    }));
  };

  const handleRemovePlanFeature = (index: number) => {
    setPlanForm((prev) => {
      if (prev.features.length === 1) {
        return { ...prev, features: [''] };
      }
      return { ...prev, features: prev.features.filter((_, featureIndex) => featureIndex !== index) };
    });
  };

  const handleTogglePlanTab = (tab: PlanMasterTab) => {
    setPlanForm((prev) => {
      const exists = prev.allowedTabs.includes(tab);
      if (exists) {
        if (prev.allowedTabs.length <= 1) return prev;
        return { ...prev, allowedTabs: prev.allowedTabs.filter((item) => item !== tab) };
      }
      return { ...prev, allowedTabs: [...prev.allowedTabs, tab] };
    });
  };

  const handleDeletePlan = (planId: string) => {
    if (!confirm('Tem certeza que deseja excluir este plano?')) return;
    fetch(`/api/admin/plans/${planId}`, { method: "DELETE" })
      .then((response) => {
        if (!response.ok) throw new Error("Erro ao excluir plano.");
        return loadPlans();
      })
      .catch(() => alert("Nao foi possivel excluir o plano."));
  };

  const handleSavePlan = async () => {
    const normalizedName = planForm.name.trim();
    const normalizedPrice = Number(planForm.price.replace(',', '.'));
    const normalizedDescription = planForm.description.trim();
    const normalizedFeatures = planForm.features.map((item) => item.trim()).filter(Boolean);

    if (!normalizedName || !Number.isFinite(normalizedPrice) || normalizedPrice <= 0) {
      alert('Preencha nome e preco mensal corretamente.');
      return;
    }
    if (!normalizedDescription) {
      alert('Preencha a descricao curta do plano.');
      return;
    }
    if (!normalizedFeatures.length) {
      alert('Adicione ao menos um beneficio.');
      return;
    }
    if (!planForm.allowedTabs.length) {
      alert('Selecione pelo menos uma aba permitida para este plano.');
      return;
    }
    const normalizedLimit = Number(planForm.manualOrderLimitPerMonth.replace(',', '.'));
    if (
      planForm.manualOrderLimitEnabled &&
      (!Number.isFinite(normalizedLimit) || normalizedLimit <= 0 || !Number.isInteger(normalizedLimit))
    ) {
      alert('Informe um limite mensal inteiro e maior que zero.');
      return;
    }

    const endpoint = editingPlanId ? `/api/admin/plans/${editingPlanId}` : "/api/admin/plans";
    const method = editingPlanId ? "PUT" : "POST";
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: normalizedName,
        price: normalizedPrice,
        color: planForm.color,
        description: normalizedDescription,
        features: normalizedFeatures,
        allowedTabs: planForm.allowedTabs,
        manualOrderLimitEnabled: planForm.manualOrderLimitEnabled,
        manualOrderLimitPerMonth: planForm.manualOrderLimitEnabled ? normalizedLimit : null,
        active: true
      })
    });
    if (!response.ok) {
      alert("Nao foi possivel salvar o plano.");
      return;
    }

    setShowPlanModal(false);
    setEditingPlanId(null);
    resetPlanForm();
    await loadPlans();
  };

  useEffect(() => {
    const bootstrap = async () => {
      const raw = localStorage.getItem('pedezap_admin_session');
      if (raw) {
        try {
          setSession(JSON.parse(raw) as AdminSession);
          await Promise.all([loadData(), loadPlans()]);
          return;
        } catch {}
      }

      const response = await fetch('/api/admin/session');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !payload?.user) {
        router.replace('/awserver/login');
        return;
      }
      localStorage.setItem('pedezap_admin_session', JSON.stringify(payload.user));
      setSession(payload.user as AdminSession);
      await Promise.all([loadData(), loadPlans()]);
    };

    bootstrap().finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!session) return;

    const ensureActivityTimestamp = () => {
      const raw = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
      if (!raw || !Number.isFinite(Number(raw))) {
        localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
      }
    };

    const onVisibilityChange = () => {
      if (!document.hidden) {
        markAdminActivity();
      }
    };

    const onUserActivity = () => {
      markAdminActivity();
    };

    ensureActivityTimestamp();
    markAdminActivity();

    const events: Array<keyof WindowEventMap> = ['click', 'keydown', 'focus', 'touchstart'];
    events.forEach((eventName) => window.addEventListener(eventName, onUserActivity, { passive: true }));
    window.addEventListener('scroll', onUserActivity, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);

    const interval = window.setInterval(() => {
      const raw = localStorage.getItem(ADMIN_LAST_ACTIVITY_KEY);
      const lastActivityAt = Number(raw ?? 0);
      if (!Number.isFinite(lastActivityAt) || lastActivityAt <= 0) {
        localStorage.setItem(ADMIN_LAST_ACTIVITY_KEY, String(Date.now()));
        return;
      }
      const idleMs = Date.now() - lastActivityAt;
      if (idleMs >= ADMIN_IDLE_TIMEOUT_MS) {
        void performAdminLogout('idle');
      }
    }, ADMIN_IDLE_CHECK_MS);

    return () => {
      window.clearInterval(interval);
      events.forEach((eventName) => window.removeEventListener(eventName, onUserActivity));
      window.removeEventListener('scroll', onUserActivity);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [session]);

  const allowedPageIds =
    session?.role === 'Admin Master'
      ? menuItems.map((item) => item.id)
      : session?.permissions?.length
      ? session.permissions
      : menuItems.map((item) => item.id);
  const allowedMenuItems = menuItems.filter((item) => allowedPageIds.includes(item.id));

  useEffect(() => {
    if (!session) return;
    if (!allowedPageIds.includes(activePage)) {
      setActivePage(allowedMenuItems[0]?.id ?? 'dashboard');
    }
  }, [session, activePage, allowedMenuItems, allowedPageIds]);

  useEffect(() => {
    if (activePage !== 'financial') return;
    if (activeFinanceTab === 'overview' && !financeOverview) {
      loadFinanceOverview();
    }
    if (activeFinanceTab === 'invoices') {
      loadFinanceInvoices(1);
    }
    if (activeFinanceTab === 'delinquency') {
      loadDelinquencyInvoices();
    }
  }, [activePage, activeFinanceTab]);

  useEffect(() => {
    if (activePage !== 'dashboard') return;
    loadDashboard();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'plans') return;
    if (!financeOverview) {
      loadFinanceOverview();
    }
    if (!restaurants.length) {
      loadData();
    }
    loadPlans();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'stats') return;
    loadAnalytics(analyticsPeriod);
  }, [activePage, analyticsPeriod]);

  useEffect(() => {
    if (activePage !== 'marketing') return;
    loadMarketing();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'customers') return;
    const timeout = window.setTimeout(() => {
      loadCustomers();
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [activePage, customersQuery, customersStatusFilter]);

  useEffect(() => {
    if (activePage !== 'team') return;
    loadTeamUsers();
    loadTeamRoles();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'support') return;
    loadSupportTickets();
    loadSupportQuickReplies();
  }, [activePage, supportQuery, supportType, supportStatus]);

  useEffect(() => {
    if (activePage !== 'support') return;
    const intervalId = window.setInterval(() => {
      void loadSupportTickets({ silent: true });
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [activePage, supportQuery, supportType, supportStatus, selectedTicketId]);

  useEffect(() => {
    if (activePage !== 'payments') return;
    loadPaymentsConfig();
    loadGatewayBalance();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'settings') return;
    loadAdminSettings();
    loadTwilioHistory();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'settings' || settingsTab !== 'twilio') return;
    loadTwilioHistory();
  }, [activePage, settingsTab, twilioHistoryQuery, twilioHistoryStatusFilter, twilioHistoryTemplateFilter]);

  useEffect(() => {
    if (activePage !== 'payments') return;
    if (paymentsTab === 'gateway') return;
    loadPaymentsPayouts(paymentsTab);
  }, [activePage, paymentsTab, paymentsQuery]);

  useEffect(() => {
    if (!selectedTicketId) return;
    loadSupportTicketDetails(selectedTicketId);
  }, [selectedTicketId]);

  useEffect(() => {
    if (activePage !== 'support' || !selectedTicketId) return;
    const intervalId = window.setInterval(() => {
      void loadSupportTicketDetails(selectedTicketId);
    }, 3000);
    return () => window.clearInterval(intervalId);
  }, [activePage, selectedTicketId]);

  useEffect(() => {
    if (!supportMessagesRef.current) return;
    supportMessagesRef.current.scrollTop = supportMessagesRef.current.scrollHeight;
  }, [supportMessages]);

  useEffect(() => {
    if (activePage !== 'financial' || activeFinanceTab !== 'invoices') return;
    setFinancePage(1);
    loadFinanceInvoices(1);
  }, [financeQuery, financeStatus]);

  useEffect(() => {
    if (activePage !== 'security') return;
    setAuditPage(1);
    loadAuditLogs(1);
    loadActiveSessions();
    loadAdminTwoFactorState();
  }, [activePage]);

  useEffect(() => {
    if (activePage !== 'security') return;
    setAuditPage(1);
    loadAuditLogs(1);
  }, [auditQuery, auditActionFilter, auditTargetTypeFilter, auditTargetIdFilter]);

  useEffect(() => {
    if (activePage !== 'security') return;
    loadActiveSessions();
  }, [activePage, sessionsScopeFilter]);

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((item) => {
      const status = item.active ? 'Ativo' : 'Inativo';
      const matchQuery =
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.slug.toLowerCase().includes(query.toLowerCase()) ||
        item.ownerEmail?.toLowerCase().includes(query.toLowerCase());
      const matchStatus = statusFilter === 'all' || status === statusFilter;
      return Boolean(matchQuery && matchStatus);
    });
  }, [restaurants, query, statusFilter]);

  const agendaToday = payouts.filter((item) => item.group === 'today');
  const agendaLate = payouts.filter((item) => item.group === 'late');
  const agendaTodayTotal = agendaToday.reduce((total, item) => total + item.amount, 0);
  const agendaPendingTotal = payouts.reduce((total, item) => total + item.amount, 0);
  const walletBalance = gatewayBalance ?? 0;
  const filteredPayoutRequests = payouts;
  const filteredPayoutHistory = payouts;
  const dashboardUpdatedAt = dashboardData?.updatedAt
    ? new Date(dashboardData.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : '--:--';
  const formatTrend = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  const dashboardAlertStyles: Record<AdminDashboard['alerts'][number]['tone'], string> = {
    red: 'border-red-100 bg-red-50 text-red-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    blue: 'border-blue-100 bg-blue-50 text-blue-700'
  };
  const dashboardAlertIconStyles: Record<AdminDashboard['alerts'][number]['tone'], string> = {
    red: 'text-red-500',
    amber: 'text-amber-500',
    blue: 'text-blue-500'
  };

  async function toggleRestaurantStatus(slug: string, active: boolean) {
    const response = await fetch(`/api/admin/restaurants/${slug}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      alert(payload?.message ?? 'Nao foi possivel alterar o status do restaurante.');
      return;
    }
    await loadData();
  }

  async function reactivateRestaurantForPlan(slug: string) {
    const response = await fetch(`/api/admin/restaurants/${slug}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reactivateSubscription: true })
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      alert(payload?.message ?? 'Nao foi possivel reativar o restaurante para renovacao.');
      return;
    }
    await loadData();
  }

  const copyLink = (slug: string) => {
    const url = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const handleGeneratePasswordResetLink = async (restaurant: AdminRestaurant) => {
    setGeneratingResetSlug(restaurant.slug);
    try {
      const response = await fetch(`/api/admin/restaurants/${restaurant.slug}/password-reset`, {
        method: 'POST'
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        alert(payload?.message ?? 'Nao foi possivel gerar link de redefinicao.');
        return;
      }

      const resetLink = `${window.location.origin}/master/reset-password?slug=${encodeURIComponent(payload.slug)}&token=${encodeURIComponent(payload.token)}`;
      const shareMessage =
        `Ola! Aqui esta seu link para redefinir a senha do painel do restaurante *${payload.restaurantName}*:\n\n` +
        `${resetLink}\n\n` +
        `Esse link expira em 1 hora.`;
      const whatsappDigits = String(payload.whatsapp || '').replace(/\D/g, '');
      const ownerEmail = String(payload.ownerEmail || restaurant.ownerEmail || '');

      setPasswordResetPayload({
        restaurantName: payload.restaurantName || restaurant.name,
        ownerEmail,
        whatsapp: payload.whatsapp || restaurant.whatsapp,
        expiresAt: payload.expiresAt,
        resetLink,
        whatsappShareLink: `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(shareMessage)}`,
        emailShareLink: `mailto:${ownerEmail}?subject=${encodeURIComponent('Redefinicao de senha do painel PedeZap')}&body=${encodeURIComponent(shareMessage)}`
      });
    } finally {
      setGeneratingResetSlug(null);
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm((prev) => ({ ...prev, password: pass }));
  };

  const getShareMessage = () => {
    if (!createdCredentials) return '';
    const origin = window.location.origin;
    return `Ola! Seu restaurante *${createdCredentials.name}* ja esta cadastrado no PedeZap!\n\n` +
      `Aqui estao seus dados de acesso:\n` +
      `[Painel] ${origin}/master/login\n` +
      `[Email] ${createdCredentials.email}\n` +
      `[Senha] ${createdCredentials.password}\n\n` +
      `[Link] ${origin}/r/${createdCredentials.slug}\n\n` +
      `Boas vendas!`;
  };

  const handleShareWhatsapp = () => {
    if (!createdCredentials) return;
    const text = getShareMessage();
    const url = `https://wa.me/${createdCredentials.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShareEmail = () => {
    if (!createdCredentials) return;
    const text = getShareMessage();
    const url = `mailto:${createdCredentials.email}?subject=Bem-vindo ao PedeZap&body=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleCopy = () => {
    const text = getShareMessage();
    navigator.clipboard.writeText(text);
    alert('Credenciais copiadas!');
  };

  async function handleSaveRestaurant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modalTab !== 'access') {
      setModalTab(modalTab === 'general' ? 'address' : 'access');
      return;
    }
    setSaving(true);
    const selectedPlan = plans.find((plan) => plan.id === form.subscribedPlanId) ?? null;
    const resolvedPlanName = selectedPlan?.name ?? form.plan;
    const resolvedPlanId = selectedPlan?.id ?? form.subscribedPlanId;

    if (!editingRestaurant) {
      // CREATE MODE
      const finalSlug = slugify(form.slug || form.name);
      if (form.password && form.password.length < 6) {
        alert('A senha deve ter no minimo 6 caracteres.');
        setSaving(false);
        return;
      }
    const response = await fetch('/api/admin/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        slug: finalSlug,
        whatsapp: form.whatsapp,
        plan: resolvedPlanName || undefined,
        subscribedPlanId: resolvedPlanId || undefined,
        document: form.document || undefined,
        ownerEmail: form.email || undefined,
        ownerPassword: form.password || undefined,
        mustChangePassword: true,
        address: form.address || undefined,
        city: form.city || undefined,
        state: form.state || undefined
      })
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => null);
      alert(errorPayload?.message || 'Nao foi possivel criar restaurante. Verifique slug e dados.');
      setSaving(false);
      return;
    }

    setShowModal(false);
      setEditingRestaurant(null);
    setCreatedCredentials({ ...form, slug: finalSlug });
    setShowSuccessModal(true);
    setForm(initialForm);
    setModalTab('general');
    setSaving(false);
    await loadData();
      const welcomeTemplate = findNotificationTemplate('tpl_welcome');
      if (settingsForm.integrations.twilio.connected && welcomeTemplate && form.whatsapp.trim()) {
        await sendTwilioMessage({
          to: form.whatsapp,
          message: welcomeTemplate.message,
          templateId: 'tpl_welcome',
          variables: buildWelcomeTemplateVariables({ ...form, slug: finalSlug }),
          targetType: 'restaurant_welcome',
          targetId: finalSlug
        });
        await loadTwilioHistory();
      }
    } else {
      // EDIT MODE
      if (form.password && form.password.length < 6) {
        alert('A senha deve ter no minimo 6 caracteres.');
        setSaving(false);
        return;
      }
      const response = await fetch(`/api/admin/restaurants/${editingRestaurant.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug, // Allow slug update if backend supports it, otherwise might need handling
          whatsapp: form.whatsapp,
          plan: resolvedPlanName,
          subscribedPlanId: resolvedPlanId || null,
          document: form.document || undefined,
          ownerEmail: form.email || undefined,
          ownerPassword: form.password || undefined, // Only send if changed
          address: form.address,
          city: form.city,
          state: form.state
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        alert(errorPayload?.message || 'Erro ao atualizar restaurante.');
        setSaving(false);
        return;
      }

      setShowModal(false);
      setEditingRestaurant(null);
      setForm(initialForm);
      setSaving(false);
      await loadData();
    }
  }

  function handleEdit(restaurant: AdminRestaurant) {
    const planIdFromName = plans.find((plan) => plan.name === restaurant.plan)?.id ?? '';
    setEditingRestaurant(restaurant);
    setForm({
      ...initialForm,
      name: restaurant.name,
      slug: restaurant.slug,
      whatsapp: restaurant.whatsapp,
      plan: restaurant.plan,
      subscribedPlanId: restaurant.subscribedPlanId ?? planIdFromName,
      document: restaurant.document || '',
      email: restaurant.ownerEmail || '',
      address: restaurant.address || '',
      city: restaurant.city || '',
      state: restaurant.state || '',
      password: '' // Reset password field for security
    });
    setModalTab('general');
    setShowModal(true);
  }

  async function handleDelete(slug: string) {
    if (!confirm('Tem certeza que deseja excluir este restaurante? Esta acao nao pode ser desfeita.')) return;
    await fetch(`/api/admin/restaurants/${slug}`, { method: 'DELETE' });
    await loadData();
  }

  const totalPlanCount = financeOverview?.planDistribution?.reduce((sum, item) => sum + item.value, 0) ?? 0;
  const financeKpis = financeOverview
    ? [
        {
          title: 'MRR (Recorrencia)',
          value: moneyFormatter.format(financeOverview.kpis.mrr),
          trend: 'Receita recorrente mensal',
          trendUp: true,
          icon: TrendingUp,
          iconBg: 'bg-emerald-50 text-emerald-600'
        },
        {
          title: 'Churn Rate (Cancelamento)',
          value: `${financeOverview.kpis.churnRate.toFixed(1)}%`,
          trend: 'Ultimos 30 dias',
          trendUp: false,
          icon: TrendingDown,
          iconBg: 'bg-red-50 text-red-600'
        },
        {
          title: 'ARPU (Ticket Medio)',
          value: moneyFormatter.format(financeOverview.kpis.arpu),
          trend: `Baseado em ${totalPlanCount} lojas`,
          trendUp: true,
          icon: DollarSign,
          iconBg: 'bg-indigo-50 text-indigo-600'
        },
        {
          title: 'Inadimplencia Bruta',
          value: moneyFormatter.format(financeOverview.kpis.delinquencyValue),
          trend: `${financeOverview.kpis.delinquencyCount} faturas em atraso`,
          trendUp: false,
          icon: AlertCircle,
          iconBg: 'bg-amber-50 text-amber-600'
        }
      ]
    : [];
  const formatPlanPrice = (value: number) => value.toFixed(2).replace('.', ',');
  const getPlanSubscribers = (plan: AdminPlan) => {
    const totalByOverview = financeOverview?.planDistribution?.find((item) => item.name === plan.name)?.value;
    return typeof totalByOverview === 'number' ? totalByOverview : plan.subscribers;
  };
  const activeSubscriptionsCount = restaurants.filter((restaurant) => {
    const status = restaurant.subscriptionStatus ?? 'expired';
    return status === 'active' || status === 'trial' || status === 'pending_payment';
  }).length;
  const filteredPlansOverviewRows = restaurants
    .filter((restaurant) => {
      const q = plansSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        restaurant.name.toLowerCase().includes(q) ||
        restaurant.slug.toLowerCase().includes(q) ||
        (restaurant.subscribedPlanId ?? restaurant.plan).toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const left = new Date(b.createdAt ?? 0).getTime();
      const right = new Date(a.createdAt ?? 0).getTime();
      return left - right;
    });
  const planOverviewCards = [
    {
      title: 'MRR (Receita Recorrente)',
      value: financeOverview ? moneyFormatter.format(financeOverview.kpis.mrr) : 'R$ 0,00',
      meta: '+8.2%',
      helper: 'vs. mes anterior',
      iconWrap: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      metaColor: 'text-emerald-600',
      icon: TrendingUp
    },
    {
      title: 'Assinaturas Ativas',
      value: String(activeSubscriptionsCount),
      meta: '+5',
      helper: 'novos este mes',
      iconWrap: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      metaColor: 'text-emerald-600',
      icon: Users
    },
    {
      title: 'Taxa de Inadimplencia',
      value: `${financeOverview?.kpis.churnRate?.toFixed(1) ?? '0.0'}%`,
      meta: '+0.5%',
      helper: 'vs. mes anterior',
      iconWrap: 'bg-red-50',
      iconColor: 'text-red-500',
      metaColor: 'text-red-500',
      icon: AlertCircle
    }
  ];

  const roleStyles: Record<string, string> = {
    'Admin Master': 'bg-violet-100 text-violet-700 border-violet-200',
    Financeiro: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    Suporte: 'bg-blue-100 text-blue-700 border-blue-200',
    Operacao: 'bg-amber-100 text-amber-700 border-amber-200'
  };
  const roleCardThemes: Record<
    string,
    {
      iconWrap: string;
      iconColor: string;
      badge: string;
      avatar: string;
      border: string;
    }
  > = {
    'Admin Master': {
      iconWrap: 'bg-violet-100',
      iconColor: 'text-violet-600',
      badge: 'bg-violet-50 text-violet-700 border-violet-200',
      avatar: 'bg-violet-600 text-white',
      border: 'border-violet-200'
    },
    Financeiro: {
      iconWrap: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      avatar: 'bg-emerald-600 text-white',
      border: 'border-emerald-200'
    },
    Suporte: {
      iconWrap: 'bg-blue-100',
      iconColor: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      avatar: 'bg-blue-600 text-white',
      border: 'border-blue-200'
    },
    Operacao: {
      iconWrap: 'bg-amber-100',
      iconColor: 'text-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      avatar: 'bg-slate-500 text-white',
      border: 'border-amber-200'
    }
  };
  const defaultSystemRoles = new Set(['Admin Master', 'Financeiro', 'Suporte', 'Operacao']);

  const statusStyles: Record<TeamUser['status'], string> = {
    Ativo: 'bg-emerald-100 text-emerald-700',
    Inativo: 'bg-slate-200 text-slate-600'
  };

  const formatLastAccess = (value?: string | null) => {
    if (!value) return 'Sem acesso';
    const date = new Date(value);
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const filteredTeamUsers = teamUsers.filter((user) => {
    const q = teamQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role.toLowerCase().includes(q)
    );
  });
  const teamRoleCards = teamRoles.map((role) => {
    const linkedUsers = teamUsers.filter((user) => user.role === role.name).length;
    return {
      ...role,
      linkedUsers
    };
  });
  const editingRoleDetails = editingRoleId ? teamRoleCards.find((role) => role.id === editingRoleId) ?? null : null;
  const selectedRolePermissionLabels = roleForm.permissions.map(
    (permissionId) => allPermissions.find((permission) => permission.id === permissionId)?.label ?? permissionId
  );

  const supportStatusStyles: Record<SupportTicket['status'], string> = {
    Aberto: 'bg-red-50 text-red-600 border-red-200',
    'Em andamento': 'bg-blue-50 text-blue-600 border-blue-200',
    Aguardando: 'bg-amber-50 text-amber-600 border-amber-200',
    Fechado: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  };

  const formatSupportTime = (value: string) => {
    const date = new Date(value);
    return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  };

  const selectedTicket = supportTickets.find((ticket) => ticket.id === selectedTicketId) ?? null;
  const selectedRestaurant =
    selectedTicket?.restaurantSlug
      ? restaurants.find((item) => item.slug === selectedTicket.restaurantSlug)
      : restaurants.find((item) => item.name === selectedTicket?.restaurantName);
  const applyQuickReply = async (reply: SupportQuickReply) => {
    const name = selectedTicket?.requesterName ?? 'cliente';
    const text = reply.body.replace('{nome}', name);
    await sendSupportMessage(text, false);
    await updateSupportStatus(reply.status);
  };

  const handleOpenRestaurantChat = () => {
    if (!selectedTicket || selectedTicket.requesterType !== 'Cliente') return;
    if (!selectedRestaurant?.whatsapp) {
      alert('Restaurante nao possui WhatsApp cadastrado.');
      return;
    }
    const phone = selectedRestaurant.whatsapp.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Carregando admin...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="w-72 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 shadow-xl z-10">
        <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-800/50">
          <BrandLogo
            src="/pedezappp.png"
            imageClassName="h-14 w-auto object-contain brightness-0 invert"
          />
          <div>
            <p className="text-[10px] font-bold text-emerald-500 tracking-widest uppercase">Admin Master</p>
          </div>
        </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-4">
          {menuGroups.map((group) => {
            const groupItems = allowedMenuItems.filter((item) => group.items.includes(item.id));
            if (!groupItems.length) return null;
            const isOpen = openGroups[group.id];
            return (
              <div key={group.id} className="space-y-2">
                <button
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [group.id]: !prev[group.id] }))}
                  className="w-full flex items-center justify-between px-2 text-xs font-bold text-slate-500 uppercase tracking-wider"
                >
                  <span>{group.label}</span>
                  <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
                {isOpen && (
                  <nav className="space-y-1.5">
                    {groupItems.map((item, idx) => (
                      <button
                        key={`${item.label}_${idx}`}
                        onClick={() => setActivePage(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                          activePage === item.id
                            ? 'bg-emerald-500/10 text-emerald-400 shadow-sm border border-emerald-500/10'
                            : 'hover:bg-slate-800 hover:text-white text-slate-400'
                        }`}
                      >
                        <item.icon
                          size={20}
                          className={`transition-colors ${
                            activePage === item.id ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'
                          }`}
                        />
                        {item.label}
                      </button>
                    ))}
                  </nav>
                )}
              </div>
            );
          })}
        </div>
<div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {session?.name?.charAt(0) ?? 'A'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">{session?.name ?? 'Admin Master'}</p>
              <p className="text-xs text-slate-500 truncate">{session?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              void performAdminLogout('manual');
            }}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
          >
            Sair do Sistema
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 relative">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm z-0">
          <div className="flex items-center gap-4 w-full max-w-xl">
            <h2 className="text-xl font-bold text-slate-800 hidden md:block">{menuItems.find((i) => i.id === activePage)?.label || 'Dashboard'}</h2>
            <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
            <div className="relative w-full">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (activePage !== 'restaurants') setActivePage('restaurants');
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                placeholder="Pesquisar restaurante por nome, slug ou email..."
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {activePage === 'dashboard' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Visao Geral</h1>
                  <p className="mt-1 text-slate-500">Acompanhe os principais indicadores reais da sua plataforma.</p>
                </div>
                <button
                  onClick={loadDashboard}
                  disabled={dashboardLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-white px-5 py-2.5 text-sm font-medium text-slate-600 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RefreshCw size={15} className={dashboardLoading ? 'animate-spin text-emerald-600' : 'text-slate-400'} />
                  Ultima atualizacao:
                  <span className="font-bold text-emerald-700">{dashboardUpdatedAt}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: 'Restaurantes Ativos',
                    value: (dashboardData?.kpis.activeRestaurants.value ?? stats?.activeRestaurants ?? 0).toLocaleString('pt-BR'),
                    trend: formatTrend(dashboardData?.kpis.activeRestaurants.change ?? 0),
                    helper: 'vs. mes passado',
                    icon: Store,
                    color: 'bg-indigo-600',
                    trendColor: (dashboardData?.kpis.activeRestaurants.change ?? 0) >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                  },
                  {
                    title: 'Receita do Mes',
                    value: moneyFormatter.format(dashboardData?.kpis.monthlyRevenue.value ?? stats?.grossRevenue ?? 0),
                    trend: formatTrend(dashboardData?.kpis.monthlyRevenue.change ?? 0),
                    helper: 'vs. mes passado',
                    icon: DollarSign,
                    color: 'bg-emerald-600',
                    trendColor: (dashboardData?.kpis.monthlyRevenue.change ?? 0) >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                  },
                  {
                    title: 'Pedidos (24h)',
                    value: (dashboardData?.kpis.orders24h.value ?? 0).toLocaleString('pt-BR'),
                    trend: formatTrend(dashboardData?.kpis.orders24h.change ?? 0),
                    helper: 'vs. 24h anteriores',
                    icon: ShoppingBag,
                    color: 'bg-blue-600',
                    trendColor: (dashboardData?.kpis.orders24h.change ?? 0) >= 0 ? 'text-emerald-600 bg-emerald-50' : 'text-red-600 bg-red-50'
                  },
                  {
                    title: 'Tickets Pendentes',
                    value: (dashboardData?.kpis.pendingTickets.value ?? 0).toLocaleString('pt-BR'),
                    trend: `${dashboardData?.kpis.pendingTickets.newThisMonth ?? 0} novos`,
                    helper: 'neste mes',
                    icon: FileText,
                    color: 'bg-amber-600',
                    trendColor: (dashboardData?.kpis.pendingTickets.newThisMonth ?? 0) > 0 ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50'
                  }
                ].map((card) => {
                  const CardIcon = card.icon;
                  return (
                    <div key={card.title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/60">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-500">{card.title}</p>
                          <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{card.value}</h3>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-lg ${card.color}`}>
                          <CardIcon size={19} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs">
                        <span className={`rounded-md px-2 py-1 font-bold ${card.trendColor}`}>{card.trend}</span>
                        <span className="text-slate-400">{card.helper}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.75fr_0.85fr]">
                <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-slate-200/60">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Crescimento da Plataforma</h2>
                      <p className="text-sm text-slate-500">Volume de pedidos x novos restaurantes</p>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
                      <CalendarClock size={15} />
                      {dashboardData?.growth.periodLabel ?? 'Ultimos 7 dias'}
                      <ChevronRight size={14} className="rotate-90 text-slate-400" />
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dashboardData?.growth.series ?? []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis yAxisId="orders" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                        <YAxis yAxisId="restaurants" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                        <Tooltip />
                        <Line yAxisId="orders" type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={false} name="Pedidos" />
                        <Line yAxisId="restaurants" type="monotone" dataKey="restaurants" stroke="#6366f1" strokeWidth={3} dot={false} name="Novos restaurantes" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-200/60">
                  <div className="mb-5 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <AlertCircle size={17} />
                    </div>
                    <h2 className="text-lg font-bold text-slate-900">Atencao Necessaria</h2>
                  </div>
                  <div className="space-y-3">
                    {(dashboardData?.alerts ?? []).map((alert) => (
                      <button
                        key={alert.id}
                        onClick={() => setActivePage(alert.href)}
                        className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 hover:shadow-sm ${dashboardAlertStyles[alert.tone]}`}
                      >
                        <span className="flex items-center gap-3">
                          <AlertCircle size={15} className={dashboardAlertIconStyles[alert.tone]} />
                          {alert.text}
                        </span>
                        <ChevronRight size={15} />
                      </button>
                    ))}
                    {!dashboardData?.alerts.length && (
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                        Nenhum alerta aberto com os dados atuais.
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setActivePage('security')}
                    className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Ver Central de Alertas
                  </button>
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm shadow-slate-200/60">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Restaurantes em Destaque</h2>
                    <p className="text-sm text-slate-500">Top performance real por volume de pedidos no mes</p>
                  </div>
                  <button onClick={() => setActivePage('stats')} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
                    Ver Ranking Completo
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                    <tr>
                      <th className="px-5 py-4 text-left">Ranking</th>
                      <th className="px-5 py-4 text-left">Restaurante</th>
                      <th className="px-5 py-4 text-left">Plano</th>
                      <th className="px-5 py-4 text-right">Pedidos (Mes)</th>
                      <th className="px-5 py-4 text-right">Receita</th>
                      <th className="px-5 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(dashboardData?.topRestaurants ?? []).map((restaurant, index) => (
                      <tr key={restaurant.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                            index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-slate-200 text-slate-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            #{index + 1}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{restaurant.name}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">{restaurant.plan}</span>
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-slate-900">{restaurant.ordersMonth.toLocaleString('pt-BR')}</td>
                        <td className="px-5 py-4 text-right font-semibold text-emerald-700">{moneyFormatter.format(restaurant.revenue)}</td>
                        <td className="px-5 py-4 text-right">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            restaurant.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {restaurant.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!dashboardData?.topRestaurants.length && (
                      <tr>
                        <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                          Ainda nao existem pedidos no mes para montar o ranking real.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activePage === 'restaurants' && (
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Restaurantes</h1>
                  <p className="text-slate-500 mt-1">Gerencie os parceiros cadastrados na plataforma.</p>
                </div>
                <button
                  onClick={() => {
                    const defaultPlan = plans.find((plan) => plan.active) ?? null;
                    setEditingRestaurant(null);
                    setForm({
                      ...initialForm,
                      plan: defaultPlan?.name ?? '',
                      subscribedPlanId: defaultPlan?.id ?? ''
                    });
                    setShowModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
                >
                  <Store size={18} />
                  Novo Restaurante
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
                  <div className="relative w-full max-w-md">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      placeholder="Buscar por nome, slug ou email..."
                    />
                  </div>
                  <div className="relative min-w-[200px]">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as 'all' | 'Ativo' | 'Inativo')}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="Ativo">Ativos</option>
                      <option value="Inativo">Inativos</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4">Restaurante</th>
                        <th className="px-6 py-4">Plano & Contato</th>
                        <th className="px-6 py-4">Acesso</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRestaurants.map((restaurant) => {
                        const status = restaurant.active ? 'Ativo' : 'Inativo';
                        const subscriptionStatus = restaurant.subscriptionStatus ?? 'expired';
                        const isSubscriptionBlocked =
                          subscriptionStatus === 'expired' || subscriptionStatus === 'canceled';
                        const subscriptionLabel =
                          subscriptionStatus === 'trial'
                            ? 'Periodo gratis'
                            : subscriptionStatus === 'active'
                            ? 'Assinatura ativa'
                            : subscriptionStatus === 'pending_payment'
                            ? 'Aguardando pagamento'
                            : subscriptionStatus === 'canceled'
                            ? 'Assinatura cancelada'
                            : 'Assinatura expirada';
                        const ownerName = restaurant.ownerEmail?.split('@')[0] || 'Proprietario';
                        return (
                          <tr key={restaurant.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-600 font-bold flex items-center justify-center text-lg shadow-sm">
                                  {restaurant.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-slate-900">{restaurant.name}</p>
                                  <p className="text-xs text-slate-500">{ownerName}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-slate-700">{restaurant.plan}</span>
                                <span className="text-slate-500 text-xs">{restaurant.whatsapp}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 group">
                                <code className="bg-slate-100 px-2 py-1 rounded text-xs text-slate-600 font-mono border border-slate-200">
                                  /r/{restaurant.slug}
                                </code>
                                <button
                                  onClick={() => copyLink(restaurant.slug)}
                                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                  title="Copiar Link"
                                >
                                  {copiedSlug === restaurant.slug ? <Check size={14} /> : <Copy size={14} />}
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                      subscriptionStatus === 'active'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : subscriptionStatus === 'trial'
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                                        : subscriptionStatus === 'pending_payment'
                                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                                        : 'bg-red-50 text-red-700 border-red-100'
                                    }`}
                                  >
                                    {subscriptionLabel}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                <span
                                  className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                    status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {status}
                                </span>
                                <span className="text-xs text-slate-400">({restaurant.ordersCount} pedidos)</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => handleEdit(restaurant)}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                                  title="Editar"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => handleGeneratePasswordResetLink(restaurant)}
                                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Gerar link de redefinicao de senha"
                                  disabled={generatingResetSlug === restaurant.slug}
                                >
                                  <Lock size={18} />
                                </button>
                                <button
                                  className={`p-2 rounded-lg transition-colors ${
                                    restaurant.active ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                                  }`}
                                  title={restaurant.active ? 'Bloquear' : 'Ativar'}
                                  onClick={() => toggleRestaurantStatus(restaurant.slug, restaurant.active)}
                                >
                                  {restaurant.active ? <ShieldOff size={18} /> : <ShieldAlert size={18} />}
                                </button>
                                {isSubscriptionBlocked && (
                                  <button
                                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
                                    title="Reativar para renovacao de plano"
                                    onClick={() => reactivateRestaurantForPlan(restaurant.slug)}
                                  >
                                    <RefreshCcw size={18} />
                                    Reativar
                                  </button>
                                )}
                                <button onClick={() => handleDelete(restaurant.slug)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir">
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activePage === 'financial' && (
            <div className="space-y-6 max-w-7xl mx-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Financeiro & Faturamento</h1>
                  <p className="text-sm text-slate-500">Gestao de receita, assinaturas e saude financeira da plataforma.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      loadFinanceOverview();
                      loadFinanceInvoices(1);
                    }}
                    disabled={financeLoading}
                    className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <RefreshCw size={16} />
                  </button>
                  <button
                    onClick={handleExportFinance}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 text-slate-700"
                  >
                    <Download size={16} />
                    Exportar CSV
                  </button>
                </div>
              </div>

              <div className="inline-flex rounded-lg bg-slate-100 p-1">
                {financeTabs.map((tab) => {
                  const isActive = tab.id === activeFinanceTab;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFinanceTab(tab.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {activeFinanceTab === 'overview' && (
                <>
                  {financeOverview ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {financeKpis.map((kpi) => {
                        const Icon = kpi.icon;
                        return (
                          <div key={kpi.title} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium text-slate-500">{kpi.title}</p>
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${kpi.iconBg}`}>
                                <Icon size={16} />
                              </div>
                            </div>
                            <div className="mt-3 text-2xl font-bold text-slate-900">{kpi.value}</div>
                            <p className={`mt-2 text-xs ${kpi.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                              {kpi.trend}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-slate-500 text-sm">
                      Carregando indicadores financeiros...
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-900">Crescimento de Receita (MRR)</h3>
                        <select className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-white">
                          <option>Ultimos 6 meses</option>
                        </select>
                      </div>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={financeOverview?.mrrData ?? []}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-4">
                        <PieChartIcon size={18} className="text-slate-600" />
                        <h3 className="text-lg font-bold text-slate-900">Distribuicao por Plano</h3>
                      </div>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={financeOverview?.planDistribution ?? []} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={4}>
                              {(financeOverview?.planDistribution ?? []).map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2 mt-4">
                        {(financeOverview?.planDistribution ?? []).map((plan) => (
                          <div key={plan.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: plan.color }} />
                              <span className="text-slate-600">{plan.name}</span>
                            </div>
                            <span className="font-medium text-slate-900">{plan.value} lojas</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeFinanceTab === 'invoices' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                  <div className="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200">
                    <div className="relative w-full md:w-72">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={financeQuery}
                        onChange={(event) => setFinanceQuery(event.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                        placeholder="Buscar fatura ou loja..."
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <SlidersHorizontal size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <select
                          value={financeStatus}
                          onChange={(event) => setFinanceStatus(event.target.value as typeof financeStatus)}
                          className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 bg-white"
                        >
                          <option value="all">Todos</option>
                          <option value="Pago">Pago</option>
                          <option value="Pendente">Pendente</option>
                          <option value="Vencido">Vencido</option>
                          <option value="Estornado">Estornado</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          const fallbackSlug = restaurants[0]?.slug ?? '';
                          setFinanceForm((prev) => ({
                            ...prev,
                            restaurantSlug: prev.restaurantSlug || fallbackSlug
                          }));
                          setShowFinanceModal(true);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                      >
                        <Plus size={16} />
                        Nova Cobranca
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                          <th className="px-6 py-3">ID / FATURA</th>
                          <th className="px-6 py-3">RESTAURANTE</th>
                          <th className="px-6 py-3">VALOR</th>
                          <th className="px-6 py-3">DATA</th>
                          <th className="px-6 py-3">STATUS</th>
                          <th className="px-6 py-3 text-right">ACOES</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {financeInvoices.map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900">{row.id}</td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-900">{row.restaurantName}</div>
                              <div className="text-xs text-slate-500">{row.method}</div>
                            </td>
                            <td className="px-6 py-4 font-semibold text-slate-900">{moneyFormatter.format(row.value)}</td>
                            <td className="px-6 py-4 text-slate-500">{row.dueDate}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${financeStatusStyles[row.status]}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="relative flex items-center justify-end gap-1 text-slate-500">
                                <button
                                  type="button"
                                  onClick={() => handleOpenInvoiceShare(row)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 hover:text-slate-700"
                                  title="Emitir / Enviar fatura"
                                >
                                  <FileText size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInvoiceAction(row.id, 'confirm')}
                                  disabled={row.status === 'Pago'}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-emerald-100 hover:text-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                  title="Confirmar pagamento"
                                >
                                  <CheckCircle2 size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenInvoiceMenuId((current) => (current === row.id ? null : row.id))
                                  }
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-slate-100 hover:text-slate-700"
                                  title="Mais opcoes"
                                >
                                  <MoreVertical size={16} />
                                </button>
                                {openInvoiceMenuId === row.id && (
                                  <div className="absolute right-0 top-9 z-10 min-w-[180px] rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                    <button
                                      type="button"
                                      onClick={() => handleInvoiceAction(row.id, 'refund')}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <ShieldOff size={14} />
                                      Estornar fatura
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const suggestedDate = new Date();
                                        suggestedDate.setDate(suggestedDate.getDate() + 7);
                                        const fallback = suggestedDate.toISOString().slice(0, 10);
                                        const nextDueDate = window.prompt(
                                          'Novo vencimento (YYYY-MM-DD):',
                                          row.dueDate || fallback
                                        );
                                        if (!nextDueDate) return;
                                        handleInvoiceAction(row.id, 'second_copy', { dueDate: nextDueDate });
                                      }}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <FileText size={14} />
                                      Gerar 2a via
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleInvoiceAction(row.id, 'mark_pending')}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <RefreshCw size={14} />
                                      Reabrir cobranca
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(row.id);
                                        setOpenInvoiceMenuId(null);
                                      }}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                                    >
                                      <Copy size={14} />
                                      Copiar ID
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const confirmed = window.confirm('Excluir esta fatura?');
                                        if (!confirmed) return;
                                        handleInvoiceAction(row.id, 'delete');
                                      }}
                                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                    >
                                      <Trash2 size={14} />
                                      Excluir fatura
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {!financeInvoices.length && (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                              Nenhuma fatura encontrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="p-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Mostrando {financeInvoices.length} de {financeTotal} faturas</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const next = Math.max(1, financePage - 1);
                          setFinancePage(next);
                          loadFinanceInvoices(next);
                        }}
                        disabled={financePage <= 1}
                        className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                      >
                        Anterior
                      </button>
                      <button
                        onClick={() => {
                          const maxPage = Math.max(1, Math.ceil(financeTotal / 5));
                          const next = Math.min(maxPage, financePage + 1);
                          setFinancePage(next);
                          loadFinanceInvoices(next);
                        }}
                        disabled={financePage >= Math.max(1, Math.ceil(financeTotal / 5))}
                        className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 disabled:opacity-50"
                      >
                        Proxima
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeFinanceTab === 'delinquency' && (
                <div className="bg-white rounded-xl border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="text-amber-500" size={20} />
                      <h3 className="text-lg font-bold text-slate-900">Inadimplencia</h3>
                    </div>
                    <span className="text-xs text-slate-500">Ultimas faturas vencidas</span>
                  </div>
                  <div className="space-y-3">
                    {delinquencyInvoices.map((invoice) => (
                      <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg border border-amber-100 bg-amber-50">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{invoice.restaurantName}</p>
                          <p className="text-xs text-amber-700">Vencimento: {invoice.dueDate}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900">{moneyFormatter.format(invoice.value)}</p>
                          <span className="text-xs text-amber-700">Vencido</span>
                        </div>
                      </div>
                    ))}
                    {!delinquencyInvoices.length && (
                      <div className="text-sm text-slate-500 text-center py-6">Nenhuma fatura vencida.</div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

          {activePage === 'plans' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Planos & Assinaturas</h1>
                  <p className="text-sm text-slate-500">Gerencie os planos SaaS cobrados dos restaurantes e faturamento recorrente.</p>
                </div>
                <button
                  onClick={openCreatePlanModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
                >
                  <Plus size={16} />
                  Novo Plano
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                {planOverviewCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-500">{card.title}</p>
                          <p className="mt-2 text-4xl font-black tracking-tight text-slate-900">{card.value}</p>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconWrap}`}>
                          <Icon size={18} className={card.iconColor} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-xs">
                        <span className={`font-semibold ${card.metaColor}`}>{card.meta}</span>
                        <span className="text-slate-400">{card.helper}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Planos Disponiveis</h2>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
                  {plans.map((plan) => {
                    const subscribers = getPlanSubscribers(plan);
                    return (
                      <div key={plan.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-start justify-between gap-3 px-5 py-5">
                          <div>
                            <h3 className="text-3xl font-bold tracking-tight text-slate-900">{plan.name}</h3>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              plan.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {plan.active ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                        <div className="border-b border-slate-100 px-5 pb-5">
                          <div className="flex items-baseline gap-1">
                            <span className="text-5xl font-black tracking-tight text-slate-900">R$ {formatPlanPrice(plan.price)}</span>
                            <span className="text-sm text-slate-500">/mes</span>
                          </div>
                          <p className="mt-3 text-sm text-slate-500">
                            + {plan.manualOrderLimitEnabled ? '3%' : plan.name === 'Premium' ? '1%' : plan.name === 'Profissional' ? '2%' : '3%'} de taxa por pedido
                          </p>
                        </div>
                        <div className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Users size={14} className="text-slate-400" />
                            <span>{subscribers} restaurantes assinantes</span>
                          </div>
                          <div className="mt-4 flex items-center gap-2">
                            <button
                              onClick={() => openEditPlanModal(plan)}
                              className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Editar Plano
                            </button>
                            <button
                              onClick={() => handleDeletePlan(plan.id)}
                              className="rounded-xl border border-slate-200 px-3 py-2.5 text-slate-400 transition hover:border-red-200 hover:text-red-600"
                              title="Excluir plano"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900">Assinaturas Recentes</h2>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
                    <div className="relative w-full max-w-md">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={plansSearch}
                        onChange={(event) => setPlansSearch(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                        placeholder="Buscar por restaurante ou ID..."
                      />
                    </div>
                    <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                      <Filter size={14} />
                      Filtros
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <tr>
                          <th className="px-4 py-4">ID</th>
                          <th className="px-4 py-4">Restaurante</th>
                          <th className="px-4 py-4">Plano</th>
                          <th className="px-4 py-4">Valor</th>
                          <th className="px-4 py-4">Data</th>
                          <th className="px-4 py-4">Status</th>
                          <th className="px-4 py-4 text-right">Acoes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredPlansOverviewRows.slice(0, 8).map((restaurant, index) => {
                          const relatedPlan =
                            plans.find((plan) => plan.id === restaurant.subscribedPlanId) ??
                            plans.find((plan) => plan.name === restaurant.plan) ??
                            null;
                          const subscriptionStatus = restaurant.subscriptionStatus ?? 'expired';
                          return (
                            <tr key={restaurant.id} className="hover:bg-slate-50/70">
                              <td className="px-4 py-4 font-semibold text-slate-900">SUB-{String(index + 1).padStart(3, '0')}</td>
                              <td className="px-4 py-4">
                                <p className="font-medium text-slate-900">{restaurant.name}</p>
                              </td>
                              <td className="px-4 py-4 text-slate-600">{relatedPlan?.name ?? restaurant.plan}</td>
                              <td className="px-4 py-4 font-semibold text-slate-900">
                                {moneyFormatter.format(relatedPlan?.price ?? 0)}
                              </td>
                              <td className="px-4 py-4 text-slate-500">
                                {restaurant.createdAt
                                  ? new Date(restaurant.createdAt).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })
                                  : '-'}
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                    subscriptionStatus === 'active' || subscriptionStatus === 'trial'
                                      ? 'bg-emerald-100 text-emerald-700'
                                      : subscriptionStatus === 'pending_payment'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {subscriptionStatus === 'active'
                                    ? 'Ativo'
                                    : subscriptionStatus === 'trial'
                                    ? 'Ativo'
                                    : subscriptionStatus === 'pending_payment'
                                    ? 'Pendente'
                                    : 'Inativo'}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                                  <MoreVertical size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {!filteredPlansOverviewRows.length && (
                          <tr>
                            <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                              Nenhuma assinatura encontrada.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activePage === 'team' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Equipe & Acessos</h1>
                  <p className="text-sm text-slate-500">Gerencie os usuarios e crie cargos personalizados com permissoes especificas.</p>
                </div>
                <div className="flex items-center gap-2">
                  {teamView === 'users' ? (
                    <button
                      onClick={() => {
                        setEditingTeamUser(null);
                        setTeamForm({
                          name: '',
                          email: '',
                          role: teamRoles[0]?.name ?? '',
                          status: 'Ativo',
                          password: ''
                        });
                        setShowTeamModal(true);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800"
                    >
                      <Plus size={16} />
                      Novo Usuario
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowRoleModal(true);
                        setEditingRoleId(null);
                        setRoleForm({ name: '', permissions: [] });
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700"
                    >
                      <Plus size={16} />
                      Novo Cargo
                    </button>
                  )}
                </div>
              </div>

              <div className="border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {[
                    { id: 'users' as const, label: 'Usuarios do Sistema' },
                    { id: 'roles' as const, label: 'Cargos e Permissoes' }
                  ].map((tab) => {
                    const active = teamView === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setTeamView(tab.id)}
                        className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
                          active
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {teamView === 'users' && (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-4 py-4">
                    <div className="relative w-full max-w-md">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={teamQuery}
                        onChange={(event) => setTeamQuery(event.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                        placeholder="Buscar por nome ou email..."
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <tr>
                          <th className="px-6 py-4">Usuario</th>
                          <th className="px-6 py-4">Cargo / Funcao</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Ultimo Acesso</th>
                          <th className="px-6 py-4 text-right">Acoes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTeamUsers.map((user) => {
                          const theme = roleCardThemes[user.role] ?? {
                            avatar: 'bg-indigo-600 text-white'
                          };
                          return (
                            <tr key={user.id} className="transition-colors hover:bg-slate-50/80">
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${theme.avatar}`}>
                                    {user.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900">{user.name}</p>
                                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                                      <Mail size={11} />
                                      <span>{user.email}</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <span
                                  className={`inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium ${
                                    roleStyles[user.role] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                                  }`}
                                >
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-5">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[user.status]}`}>
                                  <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80"></span>
                                  {user.status}
                                </span>
                              </td>
                              <td className="px-6 py-5 text-sm text-slate-500">{formatLastAccess(user.lastAccessAt)}</td>
                              <td className="px-6 py-5">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditTeamUser(user)}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-indigo-50 hover:text-indigo-600"
                                    title="Editar"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTeamUser(user.id)}
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                    title="Excluir"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {!filteredTeamUsers.length && (
                          <tr>
                            <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                              {teamLoading ? 'Carregando equipe...' : 'Nenhum usuario encontrado.'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {teamView === 'roles' && (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
                  {teamRoleCards.map((role) => {
                    const theme = roleCardThemes[role.name] ?? {
                      iconWrap: 'bg-indigo-100',
                      iconColor: 'text-indigo-600',
                      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                      border: 'border-slate-200'
                    };
                    const isSystemRole = defaultSystemRoles.has(role.name);
                    return (
                      <div
                        key={role.id}
                        className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${theme.border}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${theme.iconWrap}`}>
                              <ShieldAlert size={18} className={theme.iconColor} />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900">{role.name}</h3>
                              <p className="text-xs text-slate-500">
                                {isSystemRole ? 'Sistema (Padrao)' : 'Personalizado'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditRole(role)}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="Editar cargo"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteRole(role)}
                              disabled={roleBusyId === role.id}
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                              title={role.linkedUsers > 0 ? 'Cargo em uso nao pode ser excluido' : 'Excluir cargo'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-600">
                          {role.name === 'Admin Master'
                            ? 'Acesso total e irrestrito a todos os modulos, configuracoes e dados financeiros da plataforma.'
                            : role.name === 'Financeiro'
                            ? 'Acesso aos modulos de faturamento, planos, assinaturas, dashboard e estatisticas.'
                            : role.name === 'Suporte'
                            ? 'Acesso aos chamados, tickets, lista de restaurantes e consumidores para atendimento.'
                            : role.name === 'Operacao'
                            ? 'Cargo para operacao administrativa com foco em acompanhamento e suporte operacional.'
                            : 'Cargo com permissoes customizadas criado manualmente.'}
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {role.permissions.map((permissionId) => {
                            const permissionLabel =
                              allPermissions.find((permission) => permission.id === permissionId)?.label ?? permissionId;
                            return (
                              <span
                                key={`${role.id}_${permissionId}`}
                                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${theme.badge}`}
                              >
                                {permissionLabel}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activePage === 'marketing' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Aquisicao B2B & Growth</h1>
                  <p className="text-sm text-slate-500">Dados reais de visitas, leads, pedidos atribuidos, campanhas e banners cadastrados.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadMarketing}
                    disabled={marketingLoading}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <RefreshCw size={16} className={marketingLoading ? 'animate-spin' : ''} />
                    Atualizar Dados
                  </button>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
                    <Plus size={16} />
                    Nova Campanha
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: 'Visitas Registradas',
                    value: (marketingData?.summary.landingVisitors ?? 0).toLocaleString('pt-BR'),
                    meta: `${marketingData?.summary.totalCampaigns ?? 0} campanhas`,
                    helper: 'cadastradas',
                    icon: Eye,
                    iconWrap: 'bg-indigo-50',
                    iconColor: 'text-indigo-600'
                  },
                  {
                    title: 'Leads Captados',
                    value: (marketingData?.summary.leadsCaptured ?? stats?.totalLeads ?? 0).toLocaleString('pt-BR'),
                    meta: `${marketingData?.summary.activeCampaigns ?? 0} ativas`,
                    helper: 'agora',
                    icon: Target,
                    iconWrap: 'bg-emerald-50',
                    iconColor: 'text-emerald-600'
                  },
                  {
                    title: 'Pedidos Atribuidos',
                    value: (marketingData?.summary.attributedOrders ?? 0).toLocaleString('pt-BR'),
                    meta: `${marketingData?.summary.totalClicks ?? 0} cliques`,
                    helper: 'campanhas + banners',
                    icon: TrendingUp,
                    iconWrap: 'bg-amber-50',
                    iconColor: 'text-amber-600'
                  },
                  {
                    title: 'Investimento em Ads',
                    value:
                      marketingData && marketingData.summary.adInvestment > 0
                        ? moneyFormatter.format(marketingData.summary.adInvestment)
                        : 'Nao configurado',
                    meta: marketingData?.summary.cpl ? `CPL ${moneyFormatter.format(marketingData.summary.cpl)}` : 'Sem gasto real',
                    helper: 'registrado no sistema',
                    icon: Star,
                    iconWrap: 'bg-violet-50',
                    iconColor: 'text-violet-600'
                  }
                ].map((card) => {
                  const CardIcon = card.icon;
                  return (
                    <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-500">{card.title}</p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                        </div>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconWrap}`}>
                          <CardIcon size={16} className={card.iconColor} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="font-semibold text-emerald-600">{card.meta}</span>
                        <span className="text-slate-400">{card.helper}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.7fr_0.8fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">Pedidos por Origem Registrada</h2>
                    <span className="text-xs text-slate-500">Ultimos {marketingData?.periodDays ?? 14} dias</span>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={marketingData?.trafficSeries ?? []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="organico" stroke="#10b981" strokeWidth={3} dot={false} name="Organico / direto" />
                        <Line type="monotone" dataKey="pago" stroke="#6366f1" strokeWidth={3} dot={false} name="Pago / UTM" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    O grafico usa pedidos reais com UTM, banner ou campanha atribuida. Visitas historicas por dia dependem de tracking dedicado.
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-b from-indigo-900 to-slate-950 p-5 text-white shadow-xl">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                      <Target size={18} />
                    </div>
                    <h2 className="text-lg font-bold">Assistente de Otimizacao</h2>
                  </div>
                  <div className="space-y-3">
                    {(marketingData?.optimizations.length ? marketingData.optimizations : [
                      {
                        tag: 'OK',
                        impact: 'BAIXO' as const,
                        title: 'Nenhum alerta critico agora',
                        description: 'Os dados atuais nao apontam uma acao urgente. Continue acompanhando campanhas e UTMs.'
                      }
                    ]).map((item) => (
                      <div key={`${item.tag}_${item.title}`} className="rounded-xl border border-white/10 bg-white/10 p-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="rounded-md bg-emerald-400/20 px-2 py-1 text-[10px] font-bold text-emerald-200">{item.tag}</span>
                          <span className="text-[10px] font-bold text-amber-300">IMPACTO {item.impact}</span>
                        </div>
                        <h3 className="text-sm font-bold">{item.title}</h3>
                        <p className="mt-2 text-xs leading-5 text-slate-200">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.6fr]">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex items-center gap-2">
                    <Search size={16} className="text-emerald-600" />
                    <h2 className="text-lg font-bold text-slate-900">Saude do SEO (On-Page)</h2>
                  </div>
                  <div className="flex justify-center">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-[10px] border-emerald-500">
                      <div className="text-center">
                        <p className="text-3xl font-black text-slate-900">{marketingData?.seo.score ?? 0}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Score</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    {(marketingData?.seo.checks ?? []).map((check) => (
                      <div
                        key={check.label}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                          check.status === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                        }`}
                      >
                        <span>{check.label}</span>
                        <span className="font-semibold">{check.value}</span>
                      </div>
                    ))}
                    {!marketingData?.seo.checks.length && (
                      <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">Carregando metricas reais...</p>
                    )}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-indigo-600" />
                      <h2 className="text-lg font-bold text-slate-900">Ranking de Palavras-Chave</h2>
                    </div>
                    <button className="text-xs font-semibold text-slate-400" disabled>
                      Search Console nao conectado
                    </button>
                  </div>
                  {marketingData?.keywordsConnected && marketingData.keywords.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                        <tr>
                          <th className="px-4 py-4 text-left">Palavra-chave</th>
                          <th className="px-4 py-4 text-left">Posicao (Google)</th>
                          <th className="px-4 py-4 text-left">Volume Mensal</th>
                          <th className="px-4 py-4 text-left">Dificuldade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {marketingData.keywords.map((keyword) => (
                          <tr key={keyword.keyword} className="hover:bg-slate-50/70">
                            <td className="px-4 py-4 font-semibold text-slate-900">{keyword.keyword}</td>
                            <td className="px-4 py-4 font-bold text-slate-900">{keyword.position}</td>
                            <td className="px-4 py-4 text-slate-600">{keyword.volume}</td>
                            <td className="px-4 py-4">
                              <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{keyword.difficulty}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="flex min-h-[220px] flex-col items-center justify-center px-6 text-center">
                      <Search size={34} className="text-slate-300" />
                      <h3 className="mt-3 text-sm font-bold text-slate-900">Ranking real ainda nao conectado</h3>
                      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                        Para mostrar posicao no Google, volume e dificuldade sem inventar dados, conecte Search Console ou outra ferramenta SEO.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Campanhas Cadastradas nos Restaurantes</h2>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-4 py-4 text-left">Campanha</th>
                        <th className="px-4 py-4 text-left">Origem</th>
                        <th className="px-4 py-4 text-left">Cliques</th>
                        <th className="px-4 py-4 text-left">Pedidos Atribuidos</th>
                        <th className="px-4 py-4 text-left">Investimento</th>
                        <th className="px-4 py-4 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(marketingData?.campaigns ?? []).map((campaign) => (
                        <tr key={campaign.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-900">{campaign.name}</p>
                            <p className="text-xs text-slate-500">{campaign.restaurantName} - {campaign.period}</p>
                            {campaign.couponCodes.length > 0 && (
                              <p className="mt-1 text-xs text-indigo-600">Cupons: {campaign.couponCodes.join(', ')}</p>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">{campaign.platform}</span>
                          </td>
                          <td className="px-4 py-4 font-semibold text-slate-900">{campaign.clicks.toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-4 font-semibold text-emerald-700">{campaign.attributedOrders.toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-4 text-slate-500">
                            {campaign.investment !== null ? moneyFormatter.format(campaign.investment) : 'Nao configurado'}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`rounded-md px-2 py-1 text-xs font-semibold ${campaign.status === 'Ativa' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {campaign.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!marketingData?.campaigns.length && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                            Nenhuma campanha cadastrada ainda. Quando os restaurantes criarem campanhas no painel master, elas aparecem aqui com metricas reais.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activePage === 'customers' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Consumidores</h1>
                <p className="text-sm text-slate-500">Gestao de usuarios finais, historico de compras e controle de fraudes.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    title: 'Total de Usuarios',
                    value: (customersSummary?.total ?? 0).toLocaleString('pt-BR'),
                    meta: `+${customersSummary?.newThisMonth ?? 0}`,
                    helper: 'este mes',
                    icon: Users,
                    iconWrap: 'bg-indigo-50',
                    iconColor: 'text-indigo-600',
                    metaColor: 'text-emerald-600'
                  },
                  {
                    title: 'Usuarios Ativos (30d)',
                    value: (customersSummary?.active30d ?? 0).toLocaleString('pt-BR'),
                    meta: `${customersSummary?.activePercent ?? 0}%`,
                    helper: 'da base total',
                    icon: Users,
                    iconWrap: 'bg-emerald-50',
                    iconColor: 'text-emerald-600',
                    metaColor: 'text-emerald-600'
                  },
                  {
                    title: 'LTV Medio',
                    value: moneyFormatter.format(customersSummary?.avgLtv ?? 0),
                    meta: `${customersSummary?.total ?? 0} usuarios`,
                    helper: 'com gasto real',
                    icon: TrendingUp,
                    iconWrap: 'bg-indigo-50',
                    iconColor: 'text-indigo-600',
                    metaColor: 'text-emerald-600'
                  },
                  {
                    title: 'Clientes VIP',
                    value: (customersSummary?.vip ?? 0).toLocaleString('pt-BR'),
                    meta: 'Base real',
                    helper: 'por compras',
                    icon: Star,
                    iconWrap: 'bg-amber-50',
                    iconColor: 'text-amber-500',
                    metaColor: 'text-amber-600'
                  }
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-slate-500">{card.title}</p>
                          <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                        </div>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconWrap}`}>
                          <Icon size={16} className={card.iconColor} />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className={`font-semibold ${card.metaColor}`}>{card.meta}</span>
                        <span className="text-slate-400">{card.helper}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
                  <div className="relative w-full max-w-md">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={customersQuery}
                      onChange={(event) => setCustomersQuery(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                      placeholder="Buscar por nome, telefone, restaurante ou ID..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={customersStatusFilter}
                        onChange={(event) => setCustomersStatusFilter(event.target.value as typeof customersStatusFilter)}
                        className="rounded-xl border border-slate-200 bg-white py-2 pl-8 pr-8 text-sm text-slate-600 outline-none hover:bg-slate-50"
                      >
                        <option value="all">Filtros</option>
                        <option value="Ativo">Ativos</option>
                        <option value="VIP">VIP</option>
                      </select>
                    </div>
                    <button
                      disabled
                      className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-400"
                      title="Nenhum campo real de bloqueio/fraude existe no cadastro atual."
                    >
                      <ShieldAlert size={14} />
                      Fraude nao configurada
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <tr>
                        <th className="px-4 py-4">Usuario</th>
                        <th className="px-4 py-4">Contato</th>
                        <th className="px-4 py-4">Pedidos</th>
                        <th className="px-4 py-4">Total Gasto</th>
                        <th className="px-4 py-4">Cadastro</th>
                        <th className="px-4 py-4">Status</th>
                        <th className="px-4 py-4 text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">{customer.name}</p>
                                <p className="text-[11px] text-slate-500">{customer.id}</p>
                                <p className="text-[11px] text-slate-400">{customer.restaurantName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-medium text-slate-700">{customer.whatsapp || 'Sem telefone'}</p>
                            <p className="text-xs text-slate-500">E-mail nao coletado no cadastro atual</p>
                          </td>
                          <td className="px-4 py-4 text-slate-600">{customer.totalOrders}</td>
                          <td className="px-4 py-4 font-semibold text-emerald-700">{moneyFormatter.format(customer.totalSpent)}</td>
                          <td className="px-4 py-4 text-slate-500">
                            {new Date(customer.createdAt).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                                customer.status === 'VIP'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {customer.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!customers.length && (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                            {customersLoading ? 'Carregando consumidores...' : 'Nenhum consumidor encontrado.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activePage === 'leads' && (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-slate-500">Tela de leads em construcao.</div>
          )}

          {activePage === 'stats' && (
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Estatisticas & Performance</h1>
                  <p className="text-sm text-slate-500">Visao global da plataforma: trafego, vendas e restaurantes.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    <CalendarClock size={16} />
                    <span>{analyticsPeriod === '7' ? 'Ultimos 7 dias' : analyticsPeriod === '90' ? 'Ultimos 90 dias' : 'Ultimos 30 dias'}</span>
                    <select
                      value={analyticsPeriod}
                      onChange={(event) => setAnalyticsPeriod(event.target.value as '7' | '30' | '90')}
                      className="bg-transparent text-sm text-slate-600 focus:outline-none"
                    >
                      <option value="7">7 dias</option>
                      <option value="30">30 dias</option>
                      <option value="90">90 dias</option>
                    </select>
                  </div>
                  <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">
                    <Download size={16} />
                    Exportar Tudo
                  </button>
                </div>
              </div>

              {analyticsLoading && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                  Carregando dados de analytics...
                </div>
              )}

              {!analyticsLoading && analyticsData && (
                <>
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-slate-900">Trafego da Plataforma</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          title: 'Visitas Hoje',
                          value: analyticsData.traffic.visitsToday.toLocaleString('pt-BR'),
                          meta: '+15.2%',
                          helper: 'vs. ontem',
                          icon: Eye,
                          iconWrap: 'bg-indigo-50',
                          iconColor: 'text-indigo-600'
                        },
                        {
                          title: 'Visitas na Semana',
                          value: analyticsData.traffic.visitsWeek.toLocaleString('pt-BR'),
                          meta: '+8.4%',
                          helper: 'vs. semana anterior',
                          icon: TrendingUp,
                          iconWrap: 'bg-blue-50',
                          iconColor: 'text-blue-600'
                        },
                        {
                          title: 'Visitas no Mes',
                          value: analyticsData.traffic.visitsMonth.toLocaleString('pt-BR'),
                          meta: '+12.1%',
                          helper: 'vs. mes anterior',
                          icon: Star,
                          iconWrap: 'bg-purple-50',
                          iconColor: 'text-purple-600'
                        },
                        {
                          title: 'Taxa de Conversao',
                          value: `${analyticsData.traffic.conversionRate.toFixed(1)}%`,
                          meta: '+0.5%',
                          helper: 'vs. periodo anterior',
                          icon: TrendingUp,
                          iconWrap: 'bg-emerald-50',
                          iconColor: 'text-emerald-600'
                        }
                      ].map((card) => {
                        const Icon = card.icon;
                        return (
                          <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-slate-500">{card.title}</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                              </div>
                              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconWrap}`}>
                                <Icon size={16} className={card.iconColor} />
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs">
                              <span className="font-semibold text-emerald-600">{card.meta}</span>
                              <span className="text-slate-400">{card.helper}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold text-slate-900">Restaurantes & Vendas Globais</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {[
                        {
                          title: 'Restaurantes Cadastrados',
                          value: analyticsData.business.restaurantsCount.toLocaleString('pt-BR'),
                          meta: `+${stats?.totalLeads ?? 0} novos`,
                          helper: 'este mes',
                          icon: Store,
                          iconWrap: 'bg-amber-50',
                          iconColor: 'text-amber-600'
                        },
                        {
                          title: 'Total de Pedidos (Global)',
                          value: analyticsData.business.totalOrders.toLocaleString('pt-BR'),
                          meta: '+18.2%',
                          helper: 'vs. periodo anterior',
                          icon: ShoppingBag,
                          iconWrap: 'bg-emerald-50',
                          iconColor: 'text-emerald-600'
                        },
                        {
                          title: 'Receita Bruta (GMV)',
                          value: moneyFormatter.format(analyticsData.business.grossRevenue),
                          meta: '+22.5%',
                          helper: 'vs. periodo anterior',
                          icon: DollarSign,
                          iconWrap: 'bg-indigo-50',
                          iconColor: 'text-indigo-600'
                        },
                        {
                          title: 'Ticket Medio Global',
                          value: moneyFormatter.format(analyticsData.business.avgTicket),
                          meta: '+1.2%',
                          helper: 'vs. periodo anterior',
                          icon: Wallet,
                          iconWrap: 'bg-yellow-50',
                          iconColor: 'text-yellow-600'
                        }
                      ].map((card) => {
                        const Icon = card.icon;
                        return (
                          <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm text-slate-500">{card.title}</p>
                                <p className="mt-2 text-2xl font-bold text-slate-900">{card.value}</p>
                              </div>
                              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.iconWrap}`}>
                                <Icon size={16} className={card.iconColor} />
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs">
                              <span className="font-semibold text-emerald-600">{card.meta}</span>
                              <span className="text-slate-400">{card.helper}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Evolucao de Visitas vs Pedidos</h3>
                        <span className="text-xs text-slate-400">Ultimos 7 dias</span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analyticsData.visitsVsOrders}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="visits" stroke="#4f46e5" strokeWidth={3} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Status dos Restaurantes</h3>
                        <span className="text-xs text-slate-400">Total</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="h-52 w-52">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Ativos', value: analyticsData.restaurantStatus.active, color: '#10b981' },
                                  { name: 'Inativos', value: analyticsData.restaurantStatus.inactive, color: '#f43f5e' }
                                ]}
                                dataKey="value"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={4}
                              >
                                {[{ color: '#10b981' }, { color: '#f43f5e' }].map((entry) => (
                                  <Cell key={entry.color} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-3xl font-bold text-slate-900">{analyticsData.restaurantStatus.total}</p>
                        <p className="text-xs text-slate-500">Total</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Evolucao de Receita Bruta (GMV)</h3>
                        <span className="text-xs text-slate-400">Ultimos 30 dias</span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={analyticsData.revenueSeries}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Metodos de Pagamento</h3>
                        <span className="text-xs text-slate-400">Volume</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="h-48 w-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={analyticsData.paymentMethods} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={4}>
                                {analyticsData.paymentMethods.map((entry) => (
                                  <Cell key={entry.label} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        {analyticsData.paymentMethods.map((method) => (
                          <div key={method.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full" style={{ background: method.color }} />
                              <span>{method.label}</span>
                            </div>
                            <span className="font-semibold text-slate-900">{method.percent}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Horarios de Pico (Visitas e Pedidos)</h3>
                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                          Media por hora
                        </span>
                      </div>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analyticsData.peakHours}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <Tooltip />
                            <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-base font-semibold text-slate-900">Top Restaurantes (Faturamento)</h3>
                        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Ver todos</button>
                      </div>
                      <div className="space-y-4">
                        {analyticsData.topRestaurants.map((restaurant, index) => (
                          <div key={restaurant.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{restaurant.name}</p>
                                <p className="text-xs text-slate-500">{restaurant.orders} pedidos</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-slate-900">{moneyFormatter.format(restaurant.revenue)}</p>
                              <p className={`text-xs ${restaurant.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                {restaurant.growth >= 0 ? '+' : ''}
                                {restaurant.growth}%
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activePage === 'payments' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Pagamentos & Taxas</h1>
                  <p className="text-sm text-slate-500">Gerencie o fluxo de caixa, vencimentos e splits de pagamento.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Gateway Conectado: Stripe
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Wallet size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Vencem Hoje (Prioridade)</p>
                    <p className="text-xl font-semibold text-slate-900">{moneyFormatter.format(agendaTodayTotal)}</p>
                    <p className="text-xs text-emerald-600">{agendaToday.length} pagamentos liberados</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Clock3 size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Saldo Pendente Total</p>
                    <p className="text-xl font-semibold text-slate-900">{moneyFormatter.format(agendaPendingTotal)}</p>
                    <p className="text-xs text-amber-600">Proximos 30 dias</p>
                  </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <QrCode size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Stripe (Saldo Processado)</p>
                    <p className="text-xl font-semibold text-slate-900">{moneyFormatter.format(walletBalance)}</p>
                    <button className="text-xs text-indigo-600 font-medium">Gerenciar Carteira</button>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl">
                <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-5">
                  {[{ id: 'agenda', label: 'Agenda de Vencimentos', icon: CalendarClock },{ id: 'requests', label: 'Todas Solicitacoes', icon: ListChecks },{ id: 'history', label: 'Historico', icon: History },{ id: 'gateway', label: 'Configuracao Gateway', icon: SlidersHorizontal }].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = paymentsTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setPaymentsTab(tab.id as typeof paymentsTab)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                          isActive
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-5">
                  {paymentsTab === 'agenda' && (
                    <div className="space-y-6">
                      <div>
                        <p className="text-xs font-semibold text-amber-700 mb-3">VENCEM HOJE ({agendaToday.length})</p>
                        <div className="space-y-3">
                          {payoutsLoading && (
                            <div className="text-sm text-slate-500">Carregando repasses...</div>
                          )}
                          {agendaToday.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold">
                                  {item.restaurant.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{item.restaurant}</p>
                                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                                    <span>{item.id}</span>
                                    <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 font-semibold">
                                      {item.cycle}
                                    </span>
                                    <span>Vence: {item.dueDate}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-slate-900">{moneyFormatter.format(item.amount)}</p>
                                <button className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                                  Pagar Agora
                                </button>
                              </div>
                            </div>
                          ))}
                          {!payoutsLoading && !agendaToday.length && (
                            <div className="text-sm text-slate-500">Nenhum repasse para hoje.</div>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-rose-600 mb-3">EM ATRASO ({agendaLate.length})</p>
                        <div className="space-y-3">
                          {agendaLate.map((item) => (
                            <div
                              key={item.id}
                              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50/60 px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-semibold">
                                  {item.restaurant.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{item.restaurant}</p>
                                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
                                    <span>{item.id}</span>
                                    <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-purple-700 font-semibold">
                                      {item.cycle}
                                    </span>
                                    <span>Vence: {item.dueDate}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold text-slate-900">{moneyFormatter.format(item.amount)}</p>
                                <button className="mt-2 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                                  Pagar Agora
                                </button>
                              </div>
                            </div>
                          ))}
                          {!payoutsLoading && !agendaLate.length && (
                            <div className="text-sm text-slate-500">Nenhum repasse em atraso.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {(paymentsTab === 'requests' || paymentsTab === 'history') && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="relative flex-1 min-w-[240px]">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            value={paymentsQuery}
                            onChange={(event) => setPaymentsQuery(event.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            placeholder="Buscar restaurante ou ID..."
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                            <Filter size={14} />
                            Filtros
                          </button>
                          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                            <Download size={14} />
                            Exportar
                          </button>
                        </div>
                      </div>

                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="text-left px-4 py-3 font-semibold">Restaurante</th>
                              <th className="text-left px-4 py-3 font-semibold">Ciclo / Vencimento</th>
                              <th className="text-left px-4 py-3 font-semibold">Chave Pix</th>
                              <th className="text-right px-4 py-3 font-semibold">Valor</th>
                              <th className="text-left px-4 py-3 font-semibold">Status</th>
                              <th className="text-right px-4 py-3 font-semibold">Acoes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {payoutsLoading && (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                  Carregando repasses...
                                </td>
                              </tr>
                            )}
                            {(paymentsTab === 'requests' ? filteredPayoutRequests : filteredPayoutHistory).map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/60">
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-slate-900">{item.restaurant}</p>
                                  <p className="text-xs text-slate-500">{item.id}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                  <span className="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-emerald-700 font-semibold">
                                    {item.cycle}
                                  </span>
                                  <span className="ml-2">{item.dueDate}</span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-500">
                                  <p className="text-slate-700 font-medium">{item.pixKey}</p>
                                  <span className="uppercase text-[10px] text-slate-400">{item.pixType}</span>
                                </td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                  {moneyFormatter.format(item.amount)}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                                      item.status === 'Pendente'
                                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                                        : item.status === 'Pago'
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        : 'border-rose-200 bg-rose-50 text-rose-700'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    className="text-emerald-600 font-semibold text-xs hover:text-emerald-700"
                                    onClick={() => {
                                      if (paymentsTab === 'requests') {
                                        handleProcessPayout(item.id);
                                      }
                                    }}
                                  >
                                    {paymentsTab === 'requests' ? 'Processar' : 'Ver'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {paymentsTab === 'requests' && !payoutsLoading && !filteredPayoutRequests.length && (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                  Nenhuma solicitacao encontrada.
                                </td>
                              </tr>
                            )}
                            {paymentsTab === 'history' && !payoutsLoading && !filteredPayoutHistory.length && (
                              <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                                  Nenhum registro encontrado.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {paymentsTab === 'gateway' && (
                    <div className="space-y-6">
                      <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/60">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Wallet size={22} />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">Gateway de Pagamentos & Split</p>
                            <p className="text-sm text-slate-500">
                              O PedeZap utiliza a Stripe como gateway principal para assinaturas e pagamentos online.
                              e repasses para restaurantes.
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                              <span>
                                Ambiente: <strong className="text-slate-700">Producao</strong>
                              </span>
                              <span>
                                Webhooks: <strong className="text-emerald-600">Ativo</strong>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700">API Key (Production)</label>
                        <input
                          value={paymentsConfig.gatewayApiKey}
                          onChange={(event) =>
                            setPaymentsConfig((prev) => ({ ...prev, gatewayApiKey: event.target.value }))
                          }
                          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={paymentsConfig.autoPayoutD1}
                            onChange={(event) =>
                              setPaymentsConfig((prev) => ({ ...prev, autoPayoutD1: event.target.checked }))
                            }
                          />
                          Repasse Automatico (D+1)
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={paymentsConfig.autoPayoutD30}
                            onChange={(event) =>
                              setPaymentsConfig((prev) => ({ ...prev, autoPayoutD30: event.target.checked }))
                            }
                          />
                          Repasse Automatico (D+30)
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={paymentsConfig.notifyWhatsapp}
                            onChange={(event) =>
                              setPaymentsConfig((prev) => ({ ...prev, notifyWhatsapp: event.target.checked }))
                            }
                          />
                          Notificar restaurante via WhatsApp
                        </label>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                          <p className="font-semibold text-slate-900">Taxas por Metodo</p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-700">PIX</p>
                              <input
                                type="checkbox"
                                checked={paymentsConfig.methods.pix.enabled}
                                onChange={(event) =>
                                  setPaymentsConfig((prev) => ({
                                    ...prev,
                                    methods: { ...prev.methods, pix: { ...prev.methods.pix, enabled: event.target.checked } }
                                  }))
                                }
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-500">Taxa (%)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={paymentsConfig.methods.pix.percentFee}
                                  onChange={(event) =>
                                    setPaymentsConfig((prev) => ({
                                      ...prev,
                                      methods: {
                                        ...prev.methods,
                                        pix: { ...prev.methods.pix, percentFee: Number(event.target.value) }
                                      }
                                    }))
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500">Taxa fixa (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={paymentsConfig.methods.pix.fixedFee}
                                  onChange={(event) =>
                                    setPaymentsConfig((prev) => ({
                                      ...prev,
                                      methods: { ...prev.methods, pix: { ...prev.methods.pix, fixedFee: Number(event.target.value) } }
                                    }))
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-semibold text-slate-700">Cartao</p>
                              <input
                                type="checkbox"
                                checked={paymentsConfig.methods.card.enabled}
                                onChange={(event) =>
                                  setPaymentsConfig((prev) => ({
                                    ...prev,
                                    methods: { ...prev.methods, card: { ...prev.methods.card, enabled: event.target.checked } }
                                  }))
                                }
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-slate-500">Taxa (%)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={paymentsConfig.methods.card.percentFee}
                                  onChange={(event) =>
                                    setPaymentsConfig((prev) => ({
                                      ...prev,
                                      methods: {
                                        ...prev.methods,
                                        card: { ...prev.methods.card, percentFee: Number(event.target.value) }
                                      }
                                    }))
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-500">Taxa fixa (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={paymentsConfig.methods.card.fixedFee}
                                  onChange={(event) =>
                                    setPaymentsConfig((prev) => ({
                                      ...prev,
                                      methods: { ...prev.methods, card: { ...prev.methods.card, fixedFee: Number(event.target.value) } }
                                    }))
                                  }
                                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                          <p className="font-semibold text-slate-900">Prazos de Repasse</p>
                          <div className="flex items-center gap-3">
                            <label className="text-sm text-slate-600">Agenda</label>
                            <select
                              value={paymentsConfig.payoutSchedule}
                              onChange={(event) =>
                                setPaymentsConfig((prev) => ({
                                  ...prev,
                                  payoutSchedule: event.target.value as 'weekly' | 'daily'
                                }))
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                              <option value="weekly">Semanal</option>
                              <option value="daily">Diario</option>
                            </select>
                            <label className="text-sm text-slate-600 flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={paymentsConfig.dailyEnabled}
                                onChange={(event) =>
                                  setPaymentsConfig((prev) => ({ ...prev, dailyEnabled: event.target.checked }))
                                }
                              />
                              Diario habilitado
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="text-sm text-slate-600">Dia do repasse semanal</label>
                            <select
                              value={paymentsConfig.weeklyPayoutDay}
                              onChange={(event) =>
                                setPaymentsConfig((prev) => ({ ...prev, weeklyPayoutDay: Number(event.target.value) }))
                              }
                              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            >
                              <option value={1}>Segunda</option>
                              <option value={2}>Terca</option>
                              <option value={3}>Quarta</option>
                              <option value={4}>Quinta</option>
                              <option value={5}>Sexta</option>
                              <option value={6}>Sabado</option>
                              <option value={0}>Domingo</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-start">
                        <button
                          onClick={savePaymentsConfig}
                          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700"
                        >
                          Salvar Configuracoes
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activePage === 'support' && (
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 h-[calc(100vh-220px)]">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">Chamados</h2>
                    <div className="flex items-center gap-2 text-slate-400">
                      <Filter size={16} />
                      <select
                        value={supportStatus}
                        onChange={(event) => setSupportStatus(event.target.value as typeof supportStatus)}
                        className="text-xs border border-slate-200 rounded-full px-2 py-1 bg-white text-slate-500"
                      >
                        <option value="all">Todos</option>
                        <option value="Aberto">Aberto</option>
                        <option value="Em andamento">Em andamento</option>
                        <option value="Aguardando">Aguardando</option>
                        <option value="Fechado">Fechado</option>
                      </select>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={supportQuery}
                        onChange={(event) => setSupportQuery(event.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                        placeholder="Buscar..."
                      />
                    </div>
                    <div className="mt-4 inline-flex rounded-lg bg-slate-100 p-1 text-xs">
                      {(['all', 'Parceiro', 'Cliente'] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setSupportType(type)}
                          className={`px-3 py-1.5 rounded-md font-medium ${
                            supportType === type ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          {type === 'all' ? 'Todos' : type === 'Parceiro' ? 'Parceiros' : 'Clientes'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {supportTickets.map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className={`w-full text-left px-5 py-4 transition-colors ${
                          selectedTicketId === ticket.id ? 'bg-indigo-50/60 border-l-4 border-indigo-500' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-semibold">
                              {ticket.requesterName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{ticket.requesterName}</p>
                              <p className="text-xs text-slate-500">{ticket.id}</p>
                            </div>
                          </div>
                          <span className="text-xs text-slate-400">{formatSupportTime(ticket.lastMessageAt)}</span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-slate-800">{ticket.subject}</p>
                        <p className="mt-1 text-xs text-slate-500 line-clamp-2">{ticket.lastMessagePreview}</p>
                        <div className="mt-2 inline-flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${supportStatusStyles[ticket.status]}`}>
                            {ticket.status}
                          </span>
                          <span className="text-[10px] text-slate-400">{ticket.category}</span>
                        </div>
                      </button>
                    ))}
                    {!supportTickets.length && (
                      <div className="px-5 py-8 text-sm text-slate-500">
                        {supportLoading ? 'Carregando chamados...' : 'Nenhum chamado encontrado.'}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
                  {selectedTicket ? (
                    <>
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-slate-900">{selectedTicket.subject}</h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                            <span>{selectedTicket.requesterName}</span>
                            <span>{selectedTicket.requesterEmail}</span>
                            <span className="px-2 py-0.5 rounded-full border border-slate-200 text-slate-500">{selectedTicket.category}</span>
                          </div>
                        </div>
                        <select
                          value={selectedTicket.status}
                          onChange={(event) => updateSupportStatus(event.target.value as SupportTicket['status'])}
                          className="text-xs border border-slate-200 rounded-full px-3 py-1 bg-white text-slate-600"
                        >
                          <option value="Aberto">Aberto</option>
                          <option value="Em andamento">Em andamento</option>
                          <option value="Aguardando">Aguardando</option>
                          <option value="Fechado">Fechado</option>
                        </select>
                      </div>

                      <div
                        ref={supportMessagesRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:18px_18px]"
                      >
                        {supportMessages.map((msg) => (
                          <div key={msg.id} className={`flex ${msg.authorRole === 'agent' ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow ${
                                msg.authorRole === 'agent'
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-700'
                              } ${msg.internal ? 'border-dashed border-amber-300 bg-amber-50 text-amber-800' : ''}`}
                            >
                              <p className="whitespace-pre-wrap">{msg.body}</p>
                              {msg.attachments?.length ? (
                                <div className="mt-2 space-y-1">
                                  {msg.attachments.map((attachment, index) => (
                                    <a
                                      key={`${msg.id}-att-${index}`}
                                      href={attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      download={attachment.name}
                                      className={`block rounded-lg border px-2 py-1 text-xs ${
                                        msg.authorRole === 'agent'
                                          ? 'border-white/30 text-white/90 hover:bg-white/10'
                                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      Anexo: {attachment.name}
                                    </a>
                                  ))}
                                </div>
                              ) : null}
                              <span className="mt-2 block text-[10px] opacity-70">
                                {msg.authorName} • {formatSupportTime(msg.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                          <div className="flex items-center gap-4">
                          <button
                            onClick={() => setSupportTab('reply')}
                            className={`pb-2 border-b-2 ${
                              supportTab === 'reply' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
                            }`}
                          >
                            Responder Cliente
                          </button>
                          <button
                            onClick={() => setSupportTab('note')}
                            className={`pb-2 border-b-2 ${
                              supportTab === 'note' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
                            }`}
                          >
                            Nota Interna
                          </button>
                          <button
                            onClick={() => setSupportTab('quick')}
                            className={`pb-2 border-b-2 ${
                              supportTab === 'quick' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'
                            }`}
                          >
                            Respostas Rapidas
                          </button>
                          </div>
                          {selectedTicket.requesterType === 'Cliente' && (
                            <button
                              onClick={handleOpenRestaurantChat}
                              className="px-3 py-1.5 rounded-full border border-emerald-200 text-emerald-700 text-xs hover:bg-emerald-50"
                            >
                              Iniciar chat com a loja
                            </button>
                          )}
                        </div>
                        <div className="mt-3 border border-slate-200 rounded-xl p-3">
                          {supportTab !== 'quick' && (
                            <>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {supportQuickReplies.map((reply) => (
                                  <button
                                    key={reply.id}
                                    onClick={() => applyQuickReply(reply)}
                                    className="px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                                  >
                                    {reply.label}
                                  </button>
                                ))}
                              </div>
                              <textarea
                                value={supportReply}
                                onChange={(event) => setSupportReply(event.target.value)}
                                placeholder="Escreva sua resposta..."
                                className="w-full h-24 text-sm outline-none resize-none overflow-y-auto"
                              />
                              <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                                <span>Pressione Enter para enviar</span>
                                <button
                                  onClick={handleSendSupportMessage}
                                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                                >
                                  Enviar
                                </button>
                              </div>
                            </>
                          )}
                          {supportTab === 'quick' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-slate-500">Titulo</label>
                                  <input
                                    value={quickReplyForm.label}
                                    onChange={(event) => setQuickReplyForm((prev) => ({ ...prev, label: event.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                    placeholder="Ex: Saudacao"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-medium text-slate-500">Mensagem</label>
                                  <textarea
                                    value={quickReplyForm.body}
                                    onChange={(event) => setQuickReplyForm((prev) => ({ ...prev, body: event.target.value }))}
                                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none h-20"
                                    placeholder="Ola {nome}..."
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-medium text-slate-500">Atualizar status do ticket</label>
                                <select
                                  value={quickReplyForm.status}
                                  onChange={(event) => setQuickReplyForm((prev) => ({ ...prev, status: event.target.value as SupportTicket['status'] }))}
                                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                                >
                                  <option value="Aberto">Aberto</option>
                                  <option value="Em andamento">Em andamento</option>
                                  <option value="Aguardando">Aguardando</option>
                                  <option value="Fechado">Fechado</option>
                                </select>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">Use {`{nome}`} para personalizar</span>
                                <button
                                  onClick={handleCreateQuickReply}
                                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
                                >
                                  {editingQuickReplyId ? 'Salvar Alteracoes' : 'Salvar Mensagem Rapida'}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {supportQuickReplies.map((reply) => (
                                  <div key={reply.id} className="flex items-center gap-2">
                                    <button
                                      onClick={() => applyQuickReply(reply)}
                                      className="px-3 py-1.5 rounded-full border border-slate-200 text-xs text-slate-600 hover:bg-slate-50"
                                    >
                                      {reply.label}
                                    </button>
                                    <button
                                      onClick={() => handleEditQuickReply(reply)}
                                      className="text-xs text-slate-400 hover:text-indigo-600"
                                    >
                                      Editar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQuickReply(reply.id)}
                                      className="text-xs text-slate-400 hover:text-red-600"
                                    >
                                      Excluir
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-slate-500">
                      Selecione um chamado para visualizar.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

                    {activePage === 'settings' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Configuracoes Globais</h1>
                  <p className="text-sm text-slate-500">Ajustes gerais do painel e comunicacoes da plataforma.</p>
                </div>
                {settingsTab !== 'backup' ? (
                  <button
                    onClick={saveAdminSettings}
                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                  >
                    <Download size={16} />
                    {settingsSaving ? 'Salvando...' : 'Salvar Alteracoes'}
                  </button>
                ) : (
                  <button
                    onClick={exportSystemBackup}
                    disabled={backupBusyAction !== null}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download size={16} />
                    {backupBusyAction === 'export' ? 'Exportando...' : 'Exportar Backup'}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 h-fit">
                    {[
                      { id: 'general', label: 'General', icon: SlidersHorizontal },
                      { id: 'branding', label: 'Personalizacao', icon: Wand2 },
                      { id: 'notifications', label: 'Notificacoes', icon: Bell },
                      { id: 'integrations', label: 'Integracoes', icon: Activity },
                      { id: 'twilio', label: 'Twilio', icon: MessageCircle },
                      { id: 'security', label: 'Seguranca', icon: ShieldAlert },
                      { id: 'backup', label: 'Backup', icon: Download }
                    ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = settingsTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setSettingsTab(tab.id as typeof settingsTab)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Icon size={16} />
                        {tab.label}
                      </button>
                    );
                  })}
                  <div className="pt-4 mt-4 border-t border-slate-100 text-xs text-slate-500">
                    Versao do Sistema
                    <div className="text-slate-700 font-semibold">{settingsForm.versionLabel}</div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
                  {settingsTab === 'general' && (
                    <>
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">Informacoes do Sistema</h2>
                        <p className="text-sm text-slate-500">Dados basicos visiveis nos rodapes e emails.</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-600">Nome da Plataforma</label>
                          <input
                            value={settingsForm.platformName}
                            onChange={(event) => setSettingsForm((prev) => ({ ...prev, platformName: event.target.value }))}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-600">URL de Suporte / Ajuda</label>
                          <input
                            value={settingsForm.supportUrl}
                            onChange={(event) => setSettingsForm((prev) => ({ ...prev, supportUrl: event.target.value }))}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-600">Email de Contato Principal</label>
                          <input
                            value={settingsForm.contactEmail}
                            onChange={(event) => setSettingsForm((prev) => ({ ...prev, contactEmail: event.target.value }))}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-600">Fonte do autocomplete de enderecos (Lojas)</label>
                          <select
                            value={settingsForm.locationAutocompleteMode}
                            onChange={(event) =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                locationAutocompleteMode: event.target.value as 'hybrid' | 'json' | 'internet'
                              }))
                            }
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                          >
                            <option value="hybrid">Hibrido (JSON + API Internet)</option>
                            <option value="json">Base JSON</option>
                            <option value="internet">API Internet</option>
                          </select>
                          <p className="text-xs text-slate-500">
                            Hibrido usa sua base local primeiro e complementa com internet.
                          </p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-base font-semibold text-slate-900">Controle de Acesso</h3>
                        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-amber-700">Modo de Manutencao</p>
                            <p className="text-xs text-amber-600">
                              Quando ativo, apenas administradores poderao acessar o painel e o app dos restaurantes.
                            </p>
                          </div>
                          <button
                            onClick={() => setSettingsForm((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settingsForm.maintenanceMode ? 'bg-amber-500' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                settingsForm.maintenanceMode ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {settingsTab === 'branding' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">Identidade Visual</h2>
                        <p className="text-sm text-slate-500">Personalize o visual do aplicativo e do painel.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-slate-700">Logotipo (Admin & Login)</p>
                          <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center text-sm text-slate-500">
                            <div className="mx-auto mb-3 h-10 w-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <Upload size={18} />
                            </div>
                            <p>Clique para carregar (PNG, SVG)</p>
                          </div>
                          <input
                            value={settingsForm.logoUrl}
                            onChange={(event) => setSettingsForm((prev) => ({ ...prev, logoUrl: event.target.value }))}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="URL do logo"
                          />
                        </div>

                        <div className="space-y-3">
                          <p className="text-sm font-semibold text-slate-700">Icone do App (Favicon)</p>
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                              <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: settingsForm.colorPrimary }} />
                            </div>
                            <div>
                              <button className="text-sm font-semibold text-indigo-600">Alterar icone</button>
                              <p className="text-xs text-slate-400">Recomendado: 512x512px (PNG)</p>
                            </div>
                          </div>
                          <input
                            value={settingsForm.faviconUrl}
                            onChange={(event) => setSettingsForm((prev) => ({ ...prev, faviconUrl: event.target.value }))}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            placeholder="URL do favicon"
                          />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-6">
                        <h3 className="text-base font-semibold text-slate-900">Esquema de Cores</h3>
                        <p className="text-sm text-slate-500">Defina as cores principais da sua marca.</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-slate-500">COR PRIMARIA</p>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg border" style={{ backgroundColor: settingsForm.colorPrimary }} />
                              <input
                                value={settingsForm.colorPrimary}
                                onChange={(event) => setSettingsForm((prev) => ({ ...prev, colorPrimary: event.target.value }))}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              />
                            </div>
                            <p className="text-xs text-slate-400">Botoes, links</p>
                          </div>
                          <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-slate-500">COR SECUNDARIA</p>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg border" style={{ backgroundColor: settingsForm.colorSecondary }} />
                              <input
                                value={settingsForm.colorSecondary}
                                onChange={(event) => setSettingsForm((prev) => ({ ...prev, colorSecondary: event.target.value }))}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              />
                            </div>
                            <p className="text-xs text-slate-400">Menus, rodapes</p>
                          </div>
                          <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                            <p className="text-xs font-semibold text-slate-500">COR DESTAQUE</p>
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg border" style={{ backgroundColor: settingsForm.colorAccent }} />
                              <input
                                value={settingsForm.colorAccent}
                                onChange={(event) => setSettingsForm((prev) => ({ ...prev, colorAccent: event.target.value }))}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              />
                            </div>
                            <p className="text-xs text-slate-400">Badges, avisos</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'notifications' && (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-base font-semibold text-slate-900">Central de Notificacoes</h2>
                          <p className="text-sm text-slate-500">Configure as mensagens automaticas enviadas via WhatsApp API.</p>
                        </div>
                        <button
                          onClick={() => setShowTemplateModal(true)}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          <Plus size={16} />
                          Novo Template
                        </button>
                      </div>

                      <div className="inline-flex rounded-lg bg-slate-100 p-1 text-sm">
                        <button
                          onClick={() => setNotificationsView('templates')}
                          className={`px-3 py-1.5 rounded-md ${
                            notificationsView === 'templates' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Meus Templates
                        </button>
                        <button
                          onClick={() => setNotificationsView('dictionary')}
                          className={`px-3 py-1.5 rounded-md ${
                            notificationsView === 'dictionary' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          Dicionario de Variaveis
                        </button>
                      </div>

                      {notificationsView === 'templates' && (
                        <div className="space-y-3">
                          {settingsForm.notificationTemplates.map((template) => (
                            <div key={template.id} className="border border-slate-200 rounded-xl overflow-hidden">
                              <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
                                <p className="font-semibold text-slate-800">{template.title}</p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      template.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                    }`}
                                  >
                                    {template.active ? 'Ativo' : 'Inativo'}
                                  </span>
                                  <button
                                    onClick={() => deleteNotificationTemplate(template.id)}
                                    className="text-slate-400 hover:text-rose-600"
                                    title="Excluir template"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="p-4 space-y-3">
                                <textarea
                                  value={template.message}
                                  onChange={(event) =>
                                    setSettingsForm((prev) => ({
                                      ...prev,
                                      notificationTemplates: prev.notificationTemplates.map((item) =>
                                        item.id === template.id ? { ...item, message: event.target.value } : item
                                      )
                                    }))
                                  }
                                  className="w-full min-h-[84px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                />
                                <div className="flex flex-wrap gap-2">
                                  {template.variables.map((variable) => (
                                    <span key={`${template.id}_${variable}`} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                      {variable}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {notificationsView === 'dictionary' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 font-semibold text-slate-800">Dados do Restaurante</div>
                            <div className="p-4 space-y-3 text-sm">
                              <div><code className="text-emerald-700">{'{nome_restaurante}'}</code><p className="text-slate-500">Nome fantasia do estabelecimento</p></div>
                              <div><code className="text-emerald-700">{'{email_restaurante}'}</code><p className="text-slate-500">Email de login do proprietario</p></div>
                              <div><code className="text-emerald-700">{'{senha_provisoria}'}</code><p className="text-slate-500">Senha gerada automaticamente</p></div>
                              <div><code className="text-emerald-700">{'{link_painel}'}</code><p className="text-slate-500">URL de acesso ao painel administrativo</p></div>
                              <div><code className="text-emerald-700">{'{telefone_restaurante}'}</code><p className="text-slate-500">WhatsApp de contato da loja</p></div>
                            </div>
                          </div>
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 font-semibold text-slate-800">Dados do Pedido & Cliente</div>
                            <div className="p-4 space-y-3 text-sm">
                              <div><code className="text-emerald-700">{'{nome_cliente}'}</code><p className="text-slate-500">Nome do cliente final</p></div>
                              <div><code className="text-emerald-700">{'{numero_pedido}'}</code><p className="text-slate-500">ID unico do pedido</p></div>
                              <div><code className="text-emerald-700">{'{valor_total}'}</code><p className="text-slate-500">Valor total formatado</p></div>
                              <div><code className="text-emerald-700">{'{itens_pedido}'}</code><p className="text-slate-500">Lista resumida dos itens</p></div>
                              <div><code className="text-emerald-700">{'{endereco_entrega}'}</code><p className="text-slate-500">Endereco completo de entrega</p></div>
                              <div><code className="text-emerald-700">{'{tempo_estimado}'}</code><p className="text-slate-500">Previsao de entrega em minutos</p></div>
                            </div>
                          </div>
                          <div className="border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 bg-slate-50 font-semibold text-slate-800">Dados de Cobranca</div>
                            <div className="p-4 space-y-3 text-sm">
                              <div><code className="text-emerald-700">{'{numero_fatura}'}</code><p className="text-slate-500">Identificador da fatura</p></div>
                              <div><code className="text-emerald-700">{'{valor_fatura}'}</code><p className="text-slate-500">Valor formatado da cobranca</p></div>
                              <div><code className="text-emerald-700">{'{vencimento_fatura}'}</code><p className="text-slate-500">Data de vencimento</p></div>
                              <div><code className="text-emerald-700">{'{forma_pagamento}'}</code><p className="text-slate-500">Metodo usado para pagamento</p></div>
                              <div><code className="text-emerald-700">{'{link_painel}'}</code><p className="text-slate-500">Link do painel para regularizar a assinatura</p></div>
                              <div><code className="text-emerald-700">{'{telefone_restaurante}'}</code><p className="text-slate-500">WhatsApp do restaurante</p></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {settingsTab === 'integrations' && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">Chaves de API & Webhooks</h2>
                        <p className="text-sm text-slate-500">Gerencie a conexao com servicos externos.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="border border-slate-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                                <CreditCard size={16} />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">Stripe (Pagamentos)</p>
                                <p className="text-xs text-slate-500">{settingsForm.integrations.stripe.connected ? 'Conectado' : 'Desconectado'}</p>
                              </div>
                            </div>
                            <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">Configurar</button>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-1">WEBHOOK URL</p>
                            <div className="flex items-center gap-2">
                              <input
                                value={settingsForm.integrations.stripe.webhookUrl}
                                onChange={(event) =>
                                  setSettingsForm((prev) => ({
                                    ...prev,
                                    integrations: {
                                      ...prev.integrations,
                                      stripe: { ...prev.integrations.stripe, webhookUrl: event.target.value }
                                    }
                                  }))
                                }
                                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              />
                              <button onClick={() => copyWebhookUrl(settingsForm.integrations.stripe.webhookUrl)} className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700">
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="border border-slate-200 rounded-2xl p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                                <MessageCircle size={16} />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">WhatsApp Evolution API</p>
                                <p className="text-xs text-slate-500">{settingsForm.integrations.whatsappEvolution.connected ? 'Conectado' : 'Desconectado'}</p>
                              </div>
                            </div>
                            <button className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-500">Configurar</button>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                              <MessageCircle size={18} />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-base font-semibold text-slate-900">Twilio agora tem uma aba dedicada</h3>
                              <p className="text-sm text-slate-500">
                                Configuracao, historico de envios, automacoes de cobranca e indicadores de entrega foram movidos para a aba <strong>Twilio</strong>.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'twilio' && (
                    <div className="space-y-5">
                      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                              <MessageCircle size={14} />
                              Operacao WhatsApp
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-slate-900">Central Twilio</h2>
                              <p className="text-sm text-slate-500">
                                Gerencie configuracao, cobrancas, callback de status e entregabilidade do WhatsApp em um fluxo unico.
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                              <p className="text-xs font-semibold text-slate-500">Status</p>
                              <p className={`mt-1 text-sm font-bold ${settingsForm.integrations.twilio.connected ? 'text-emerald-700' : 'text-slate-700'}`}>
                                {settingsForm.integrations.twilio.connected ? 'Ativo para envio' : 'Desativado'}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                              <p className="text-xs font-semibold text-slate-500">Mensagens</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">{twilioHistorySummary.total}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                              <p className="text-xs font-semibold text-slate-500">Entrega 7 dias</p>
                              <p className="mt-1 text-sm font-bold text-emerald-700">{twilioPerformance.last7Days.deliveryRate}%</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
                        <div className="space-y-5">
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                                  <MessageCircle size={18} />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">Conexao Twilio</p>
                                  <p className="text-xs text-slate-500">Conta, callback e numero remetente</p>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  setSettingsForm((prev) => ({
                                    ...prev,
                                    integrations: {
                                      ...prev.integrations,
                                      twilio: {
                                        ...prev.integrations.twilio,
                                        connected: !prev.integrations.twilio.connected
                                      }
                                    }
                                  }))
                                }
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  settingsForm.integrations.twilio.connected ? 'bg-emerald-600' : 'bg-slate-300'
                                }`}
                              >
                                <span
                                  className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                    settingsForm.integrations.twilio.connected ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-500">REMETENTE WHATSAPP</label>
                              <input
                                value={settingsForm.integrations.twilio.whatsappFrom}
                                onChange={(event) =>
                                  setSettingsForm((prev) => ({
                                    ...prev,
                                    integrations: {
                                      ...prev.integrations,
                                      twilio: {
                                        ...prev.integrations.twilio,
                                        whatsappFrom: event.target.value
                                      }
                                    }
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                placeholder="whatsapp:+14155238886"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-slate-500">STATUS CALLBACK URL</label>
                              <input
                                value={settingsForm.integrations.twilio.statusCallbackUrl}
                                onChange={(event) =>
                                  setSettingsForm((prev) => ({
                                    ...prev,
                                    integrations: {
                                      ...prev.integrations,
                                      twilio: {
                                        ...prev.integrations.twilio,
                                        statusCallbackUrl: event.target.value
                                      }
                                    }
                                  }))
                                }
                                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                placeholder="https://pedezap.site/api/webhooks/twilio/status"
                              />
                              <p className="text-xs text-slate-400">Use o endpoint publico do seu sistema para atualizar entregue, falha e leitura.</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <p className="text-sm font-semibold text-slate-900">Teste de envio</p>
                              <p className="mt-1 text-xs text-slate-500">
                                Credenciais sensiveis ficam em <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code> e <code>TWILIO_WHATSAPP_FROM</code>.
                              </p>
                              <div className="mt-3 space-y-3">
                                <input
                                  value={twilioTestPhone}
                                  onChange={(event) => setTwilioTestPhone(event.target.value)}
                                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                  placeholder="5511999999999"
                                />
                                <textarea
                                  value={twilioTestMessage}
                                  onChange={(event) => setTwilioTestMessage(event.target.value)}
                                  className="min-h-[88px] w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                  placeholder="Mensagem de teste"
                                />
                                <button
                                  onClick={handleSendTwilioTest}
                                  disabled={twilioSending || !settingsForm.integrations.twilio.connected}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <MessageCircle size={15} />
                                  {twilioSending ? 'Enviando...' : 'Enviar teste'}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                            <div>
                              <p className="font-semibold text-slate-900">Automacao de cobranca</p>
                              <p className="text-xs text-slate-500">Execute disparos em lote para faturas pendentes ou vencidas.</p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                              <button
                                onClick={() => runTwilioAutomation('due')}
                                disabled={twilioAutomationRunning || !settingsForm.integrations.twilio.connected}
                                className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Pendentes
                              </button>
                              <button
                                onClick={() => runTwilioAutomation('overdue')}
                                disabled={twilioAutomationRunning || !settingsForm.integrations.twilio.connected}
                                className="rounded-xl border border-rose-200 px-3 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Vencidas
                              </button>
                              <button
                                onClick={() => runTwilioAutomation('all')}
                                disabled={twilioAutomationRunning || !settingsForm.integrations.twilio.connected}
                                className="rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {twilioAutomationRunning ? 'Processando...' : 'Todas abertas'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                              <p className="text-xs text-slate-500">Total</p>
                              <p className="mt-1 text-xl font-bold text-slate-900">{twilioHistorySummary.total}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm">
                              <p className="text-xs text-emerald-700">Enviadas</p>
                              <p className="mt-1 text-xl font-bold text-emerald-700">{twilioHistorySummary.sent}</p>
                            </div>
                            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 shadow-sm">
                              <p className="text-xs text-sky-700">Entregues</p>
                              <p className="mt-1 text-xl font-bold text-sky-700">{twilioHistorySummary.delivered}</p>
                            </div>
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
                              <p className="text-xs text-rose-700">Falhas</p>
                              <p className="mt-1 text-xl font-bold text-rose-700">{twilioHistorySummary.failed}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                              <p className="text-xs text-slate-500">7 dias - enviadas</p>
                              <p className="mt-1 text-lg font-bold text-slate-900">{twilioPerformance.last7Days.sent}</p>
                            </div>
                            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-4 shadow-sm">
                              <p className="text-xs text-sky-700">7 dias - entregues</p>
                              <p className="mt-1 text-lg font-bold text-sky-700">{twilioPerformance.last7Days.delivered}</p>
                            </div>
                            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 shadow-sm">
                              <p className="text-xs text-rose-700">7 dias - falhas</p>
                              <p className="mt-1 text-lg font-bold text-rose-700">{twilioPerformance.last7Days.failed}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 shadow-sm">
                              <p className="text-xs text-emerald-700">Taxa entrega</p>
                              <p className="mt-1 text-lg font-bold text-emerald-700">{twilioPerformance.last7Days.deliveryRate}%</p>
                            </div>
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 shadow-sm">
                              <p className="text-xs text-amber-700">Taxa falha</p>
                              <p className="mt-1 text-lg font-bold text-amber-700">{twilioPerformance.last7Days.failureRate}%</p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">Painel Twilio - ultimos 7 dias</p>
                                <p className="text-xs text-slate-500">Resumo diario de envios, entrega e falha.</p>
                              </div>
                              <button
                                onClick={() => loadTwilioHistory()}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Atualizar
                              </button>
                            </div>
                            <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-7">
                              {twilioPerformance.byDay.map((day) => (
                                <div key={day.date} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs">
                                  <p className="font-semibold text-slate-900">
                                    {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </p>
                                  <p className="mt-2 text-slate-500">Envios: {day.sent}</p>
                                  <p className="text-sky-600">Entregues: {day.delivered}</p>
                                  <p className="text-rose-600">Falhas: {day.failed}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900">Historico recente</p>
                                <p className="text-xs text-slate-500">Acompanhe cada mensagem enviada, status e reenvio.</p>
                              </div>
                              <button
                                onClick={() => loadTwilioHistory()}
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              >
                                Atualizar
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 xl:grid-cols-[1fr_180px_220px]">
                              <input
                                value={twilioHistoryQuery}
                                onChange={(event) => setTwilioHistoryQuery(event.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                                placeholder="Buscar por numero, alvo ou conteudo"
                              />
                              <select
                                value={twilioHistoryStatusFilter}
                                onChange={(event) => setTwilioHistoryStatusFilter(event.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              >
                                <option value="all">Todos status</option>
                                <option value="queued">Queued</option>
                                <option value="accepted">Accepted</option>
                                <option value="sent">Sent</option>
                                <option value="delivered">Delivered</option>
                                <option value="failed">Failed</option>
                              </select>
                              <select
                                value={twilioHistoryTemplateFilter}
                                onChange={(event) => setTwilioHistoryTemplateFilter(event.target.value)}
                                className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                              >
                                <option value="all">Todos templates</option>
                                {twilioHistoryTemplates.map((templateId) => (
                                  <option key={templateId} value={templateId}>
                                    {templateId}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="max-h-96 overflow-auto rounded-2xl border border-slate-200">
                              {twilioHistory.length === 0 ? (
                                <div className="px-4 py-8 text-sm text-slate-500">
                                  Nenhuma mensagem Twilio registrada ainda.
                                </div>
                              ) : (
                                <div className="divide-y divide-slate-100">
                                  {twilioHistory.map((item) => (
                                    <div key={item.id} className="px-4 py-4 text-sm">
                                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                        <div className="min-w-0">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="font-semibold text-slate-900">{item.targetType}</span>
                                            <span className="text-slate-400">#{item.targetId}</span>
                                            <span
                                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                                item.status === 'failed'
                                                  ? 'bg-rose-100 text-rose-700'
                                                  : item.status === 'delivered'
                                                  ? 'bg-sky-100 text-sky-700'
                                                  : 'bg-emerald-100 text-emerald-700'
                                              }`}
                                            >
                                              {item.status}
                                            </span>
                                          </div>
                                          <p className="mt-1 truncate text-slate-700">
                                            Para {item.to} {item.templateId ? `• ${item.templateId}` : ''}
                                          </p>
                                          <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.body}</p>
                                          {item.errorMessage ? (
                                            <p className="mt-1 text-xs text-rose-600">{item.errorMessage}</p>
                                          ) : null}
                                        </div>
                                        <div className="shrink-0 space-y-2 text-right">
                                          <div className="text-xs text-slate-400">
                                            {new Date(item.createdAt).toLocaleString('pt-BR')}
                                          </div>
                                          <button
                                            onClick={() => resendTwilioMessage(item.id)}
                                            disabled={twilioResendingId === item.id}
                                            className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                                          >
                                            {twilioResendingId === item.id ? 'Reenviando...' : 'Reenviar'}
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'backup' && (
                    <div className="space-y-6">
                      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-slate-50 p-6">
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-sm ring-1 ring-sky-100">
                              <Download size={14} />
                              Continuidade operacional
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-slate-900">Backup completo do sistema</h2>
                              <p className="text-sm text-slate-500">
                                Exporte e restaure todo o estado do PedeZap, incluindo painel admin, painel master, cardapios, pedidos, clientes, planos e configuracoes globais.
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                              { label: 'Lojas', value: backupPreview?.summary.restaurants ?? restaurants.length },
                              { label: 'Pedidos', value: backupPreview?.summary.orders ?? stats?.totalOrders ?? 0 },
                              { label: 'Clientes', value: backupPreview?.summary.customers ?? 0 },
                              { label: 'Admins', value: backupPreview?.summary.adminUsers ?? 0 }
                            ].map((item) => (
                              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                                <p className="mt-1 text-lg font-bold text-slate-900">{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold text-slate-900">Exportar backup agora</h3>
                              <p className="text-sm text-slate-500">Gera um arquivo JSON com o estado completo atual do sistema.</p>
                            </div>
                            <div className="h-11 w-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
                              <Download size={18} />
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                            <p className="text-sm text-slate-700">
                              O backup inclui dados do admin, lojas, acessos master, categorias, produtos, banners, pedidos, clientes, financeiro e configuracoes.
                            </p>
                            <button
                              onClick={exportSystemBackup}
                              disabled={backupBusyAction !== null}
                              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Download size={16} />
                              {backupBusyAction === 'export' ? 'Exportando backup...' : 'Baixar backup completo'}
                            </button>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold text-slate-900">Importar backup</h3>
                              <p className="text-sm text-slate-500">Restaure os dados usando um arquivo de backup exportado pelo sistema.</p>
                            </div>
                            <div className="h-11 w-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                              <Upload size={18} />
                            </div>
                          </div>
                          <input
                            ref={backupFileInputRef}
                            type="file"
                            accept="application/json"
                            className="hidden"
                            onChange={handleBackupFileSelected}
                          />
                          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
                            <p className="text-sm font-medium text-slate-700">Selecione um arquivo `.json` de backup</p>
                            <p className="mt-1 text-xs text-slate-500">Recomendado usar apenas backups exportados por esta plataforma.</p>
                            <button
                              onClick={() => backupFileInputRef.current?.click()}
                              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              <Upload size={16} />
                              Escolher arquivo
                            </button>
                            {backupFileName ? <p className="mt-3 text-xs text-slate-500">Arquivo selecionado: {backupFileName}</p> : null}
                          </div>
                          <button
                            onClick={importSystemBackup}
                            disabled={backupBusyAction !== null || !backupImportPayloadRef.current}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <RefreshCcw size={16} />
                            {backupBusyAction === 'import' ? 'Importando backup...' : 'Importar e restaurar sistema'}
                          </button>
                        </div>
                      </div>

                      {backupError ? (
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                          {backupError}
                        </div>
                      ) : null}
                      {backupMessage ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                          {backupMessage}
                        </div>
                      ) : null}

                      {backupPreview ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-base font-semibold text-slate-900">Resumo do backup</h3>
                              <p className="text-sm text-slate-500">
                                {backupPreview.generatedAt
                                  ? `Gerado em ${new Date(backupPreview.generatedAt).toLocaleString('pt-BR')}`
                                  : 'Arquivo carregado pronto para restauracao'}
                              </p>
                            </div>
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              Restauracao total
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
                            {[
                              ['Lojas', backupPreview.summary.restaurants],
                              ['Categorias', backupPreview.summary.categories],
                              ['Produtos', backupPreview.summary.products],
                              ['Usuarios master', backupPreview.summary.masterUsers],
                              ['Pedidos', backupPreview.summary.orders],
                              ['Clientes', backupPreview.summary.customers],
                              ['Leads', backupPreview.summary.leads],
                              ['Admins', backupPreview.summary.adminUsers],
                              ['Perfis', backupPreview.summary.adminRoles],
                              ['Chamados', backupPreview.summary.supportTickets],
                              ['Mensagens', backupPreview.summary.supportMessages],
                              ['Auditoria', backupPreview.summary.auditLogs]
                            ].map(([label, value]) => (
                              <div key={String(label)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
                                <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <h3 className="text-base font-semibold text-slate-900">Proxima etapa: backup automatico em nuvem</h3>
                            <p className="text-sm text-slate-500">
                              Podemos conectar esta rotina a Google Drive, Dropbox, S3 ou outro servidor para criar backups automaticos diarios e manter historico de versoes.
                            </p>
                          </div>
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                            Planejado
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab === 'security' && (
                    <div className="space-y-5">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">Politicas de Seguranca</h2>
                        <p className="text-sm text-slate-500">Defina regras de protecao para administradores e usuarios.</p>
                      </div>

                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="px-4 py-4 flex items-center justify-between gap-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                              <Lock size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">Autenticacao em 2 Fatores (2FA)</p>
                              <p className="text-xs text-slate-500">Forcar 2FA para todos os usuarios com perfil Admin Master.</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSettingsForm((prev) => ({ ...prev, securityPolicies: { ...prev.securityPolicies, enforce2FA: !prev.securityPolicies.enforce2FA } }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settingsForm.securityPolicies.enforce2FA ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                settingsForm.securityPolicies.enforce2FA ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="px-4 py-4 flex items-center justify-between gap-3 border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                              <ShieldAlert size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">Logs de Auditoria</p>
                              <p className="text-xs text-slate-500">Registrar todas as acoes sensiveis (exclusao, reembolso).</p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSettingsForm((prev) => ({ ...prev, securityPolicies: { ...prev.securityPolicies, auditLogs: !prev.securityPolicies.auditLogs } }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settingsForm.securityPolicies.auditLogs ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                settingsForm.securityPolicies.auditLogs ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>

                        <div className="px-4 py-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                              <Bell size={16} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">Alerta de Login Suspeito</p>
                              <p className="text-xs text-slate-500">Notificar admins por email ao detectar acesso de novo IP.</p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setSettingsForm((prev) => ({
                                ...prev,
                                securityPolicies: {
                                  ...prev.securityPolicies,
                                  suspiciousLoginAlert: !prev.securityPolicies.suspiciousLoginAlert
                                }
                              }))
                            }
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              settingsForm.securityPolicies.suspiciousLoginAlert ? 'bg-indigo-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                                settingsForm.securityPolicies.suspiciousLoginAlert ? 'translate-x-5' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsTab !== 'general' && settingsTab !== 'branding' && settingsTab !== 'notifications' && settingsTab !== 'integrations' && settingsTab !== 'twilio' && settingsTab !== 'security' && (
                    <div className="text-sm text-slate-500">Em construcao.</div>
                  )}
                </div>
              </div>
            </div>
          )}
{activePage === 'security' && (
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-slate-900">Autenticacao em Dois Fatores (2FA)</h3>
                  <p className="text-xs text-slate-500 mt-1">Proteja o acesso do painel admin com codigo do app autenticador.</p>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900">
                        Status: {twoFactorState.enabled ? 'Ativo' : twoFactorState.pending ? 'Pendente de confirmacao' : 'Desativado'}
                      </div>
                      <div className="text-xs text-slate-500">
                        Conta atual: {session?.email}
                      </div>
                    </div>
                    {!twoFactorState.enabled && (
                      <button
                        onClick={startTwoFactorSetup}
                        disabled={twoFactorLoading}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-black disabled:opacity-60"
                      >
                        <ShieldAlert size={15} />
                        {twoFactorState.pending ? 'Gerar nova chave' : 'Ativar 2FA'}
                      </button>
                    )}
                  </div>

                  {twoFactorState.pending && (
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                      <p className="text-sm text-slate-700">
                        1. Adicione a conta no app autenticador usando a chave abaixo (ou URI). 2. Digite o codigo gerado para confirmar.
                      </p>
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-semibold text-slate-500">Chave secreta</label>
                          <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-mono break-all">
                            {twoFactorState.secretPreview}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-500">URI (manual / QR em outro app)</label>
                          <div className="mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs break-all max-h-24 overflow-auto">
                            {twoFactorState.otpauthUri}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[180px]">
                          <label className="text-xs font-semibold text-slate-500">Codigo 2FA</label>
                          <input
                            value={twoFactorCode}
                            onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm tracking-[0.2em]"
                            placeholder="000000"
                          />
                        </div>
                        <button
                          onClick={confirmTwoFactorSetup}
                          disabled={twoFactorLoading}
                          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Confirmar e ativar
                        </button>
                      </div>
                    </div>
                  )}

                  {twoFactorState.enabled && (
                    <div className="rounded-xl border border-red-200 bg-red-50/40 p-4 space-y-3">
                      <p className="text-sm text-slate-700">
                        Para desativar o 2FA, confirme com um codigo valido do app autenticador.
                      </p>
                      <div className="flex flex-wrap items-end gap-2">
                        <div className="flex-1 min-w-[180px]">
                          <label className="text-xs font-semibold text-slate-500">Codigo atual</label>
                          <input
                            value={twoFactorCode}
                            onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="mt-1 w-full px-3 py-2 border border-slate-200 rounded-lg text-sm tracking-[0.2em]"
                            placeholder="000000"
                          />
                        </div>
                        <button
                          onClick={disableTwoFactor}
                          disabled={twoFactorLoading}
                          className="px-3 py-2 rounded-lg border border-red-200 text-red-600 bg-white hover:bg-red-50 text-sm disabled:opacity-60"
                        >
                          Desativar 2FA
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Sessoes Ativas</h3>
                    <p className="text-xs text-slate-500">Admin e painel master conectados. Voce pode encerrar acessos remotamente.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={sessionsScopeFilter}
                      onChange={(event) => setSessionsScopeFilter(event.target.value as 'all' | 'admin' | 'master')}
                      className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
                    >
                      <option value="all">Todas</option>
                      <option value="admin">Apenas Admin</option>
                      <option value="master">Apenas Master</option>
                    </select>
                    <button
                      onClick={() => loadActiveSessions()}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <RefreshCw size={15} />
                      Atualizar
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">TIPO</th>
                        <th className="px-4 py-3">USUARIO / LOJA</th>
                        <th className="px-4 py-3">ULTIMA ATIVIDADE</th>
                        <th className="px-4 py-3">IP</th>
                        <th className="px-4 py-3">ACAO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSessionsRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${row.kind === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {row.kind === 'admin' ? 'Admin' : 'Master'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{row.subjectName}</div>
                            <div className="text-xs text-slate-500">{row.actorEmail ?? row.subjectId}</div>
                            {row.isCurrent && <div className="text-[11px] text-indigo-600 mt-1">Sessao atual</div>}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {new Date(row.lastSeenAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{row.ip}</td>
                          <td className="px-4 py-3">
                            <button
                              disabled={!!row.isCurrent}
                              onClick={() => handleRevokeSession(row.id)}
                              className="px-3 py-1.5 border border-red-200 text-red-600 rounded-md hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              Encerrar
                            </button>
                          </td>
                        </tr>
                      ))}
                      {!activeSessionsRows.length && !activeSessionsLoading && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            Nenhuma sessao ativa encontrada.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={auditQuery}
                    onChange={(event) => setAuditQuery(event.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm"
                    placeholder="Buscar por acao, usuario, recurso ou IP..."
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={auditTargetTypeFilter}
                    onChange={(event) => setAuditTargetTypeFilter(event.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
                  >
                    <option value="all">Todas entidades</option>
                    {auditTargetTypes.map((targetType) => (
                      <option key={targetType} value={targetType}>
                        {targetType}
                      </option>
                    ))}
                  </select>
                  <input
                    value={auditTargetIdFilter}
                    onChange={(event) => setAuditTargetIdFilter(event.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-44"
                    placeholder="ID da entidade"
                  />
                  <select
                    value={auditActionFilter}
                    onChange={(event) => setAuditActionFilter(event.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white text-slate-600"
                  >
                    <option value="all">Todas as acoes</option>
                    {auditActions.map((action) => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => loadAuditLogs(auditPage)}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <RefreshCw size={15} />
                    Atualizar
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                      <tr>
                        <th className="px-4 py-3">DATA/HORA</th>
                        <th className="px-4 py-3">ACAO</th>
                        <th className="px-4 py-3">ATOR</th>
                        <th className="px-4 py-3">ALVO</th>
                        <th className="px-4 py-3">IP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {new Date(row.createdAt).toLocaleString('pt-BR')}
                          </td>
                          <td className="px-4 py-3">
                            <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{row.action}</code>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{row.actorName}</div>
                            <div className="text-xs text-slate-500">{row.actorType}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900">{row.targetType}</div>
                            <div className="text-xs text-slate-500">{row.targetId}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{row.ip}</td>
                        </tr>
                      ))}
                      {!auditLogs.length && !auditLoading && (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                            Nenhum log de auditoria encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>Mostrando {auditLogs.length} de {auditTotal} eventos</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const next = Math.max(1, auditPage - 1);
                        setAuditPage(next);
                        loadAuditLogs(next);
                      }}
                      disabled={auditPage <= 1}
                      className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => {
                        const maxPage = Math.max(1, Math.ceil(auditTotal / 20));
                        const next = Math.min(maxPage, auditPage + 1);
                        setAuditPage(next);
                        loadAuditLogs(next);
                      }}
                      disabled={auditPage >= Math.max(1, Math.ceil(auditTotal / 20))}
                      className="px-3 py-1.5 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
                    >
                      Proxima
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">Novo Template</h3>
              <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Titulo / Gatilho</label>
                <input
                  value={templateForm.title}
                  onChange={(event) => setTemplateForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Ex: Pagamento Aprovado"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Mensagem</label>
                <textarea
                  value={templateForm.message}
                  onChange={(event) => setTemplateForm((prev) => ({ ...prev, message: event.target.value }))}
                  className="w-full min-h-[120px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Ola {nome}, seu pagamento de {valor} foi confirmado!"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Variaveis Disponiveis</label>
                <input
                  value={templateForm.variables}
                  onChange={(event) => setTemplateForm((prev) => ({ ...prev, variables: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Ex: {nome}, {valor}"
                />
                <p className="text-xs text-slate-500">Separar por virgula.</p>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={createNotificationTemplate}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Criar Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFinanceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Nova Cobranca</h2>
                <p className="text-sm text-slate-500 mt-1">Gere uma nova fatura para o restaurante.</p>
              </div>
              <button onClick={() => setShowFinanceModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Restaurante</label>
                <select
                  value={financeForm.restaurantSlug}
                  onChange={(event) => setFinanceForm((prev) => ({ ...prev, restaurantSlug: event.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Selecione...</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant.slug} value={restaurant.slug}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Valor</label>
                  <input
                    value={financeForm.value}
                    onChange={(event) => setFinanceForm((prev) => ({ ...prev, value: event.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="149,90"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Vencimento</label>
                  <input
                    type="date"
                    value={financeForm.dueDate}
                    onChange={(event) => setFinanceForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Metodo</label>
                <select
                  value={financeForm.method}
                  onChange={(event) => setFinanceForm((prev) => ({ ...prev, method: event.target.value as FinanceInvoice['method'] }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="Cartao de Credito">Cartao de Credito</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Pix">Pix</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowFinanceModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
                  Cancelar
                </button>
                <button onClick={handleCreateInvoice} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
                  Criar Cobranca
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {invoiceSharePayload && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-6">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Enviar Fatura</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {invoiceSharePayload.restaurantName} - {invoiceSharePayload.invoiceId}
                </p>
              </div>
              <button
                onClick={() => setInvoiceSharePayload(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Mensagem da Fatura</label>
                <textarea
                  value={invoiceSharePayload.message}
                  onChange={(event) =>
                    setInvoiceSharePayload((prev) =>
                      prev ? { ...prev, message: event.target.value } : prev
                    )
                  }
                  className="w-full min-h-[180px] rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(invoiceSharePayload.message);
                    alert('Mensagem copiada.');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Copy size={15} />
                  Copiar
                </button>
                <button
                  onClick={handleSendInvoiceViaTwilio}
                  disabled={twilioSending || !settingsForm.integrations.twilio.connected}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-700 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MessageCircle size={15} />
                  {twilioSending ? 'Enviando...' : 'Twilio'}
                </button>
                <button
                  onClick={() => {
                    if (!invoiceSharePayload.phoneDigits) {
                      alert('Restaurante sem WhatsApp cadastrado.');
                      return;
                    }
                    const link = `https://wa.me/${invoiceSharePayload.phoneDigits}?text=${encodeURIComponent(invoiceSharePayload.message)}`;
                    window.open(link, '_blank');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <MessageCircle size={15} />
                  Abrir WhatsApp
                </button>
                <button
                  onClick={() => {
                    if (!invoiceSharePayload.ownerEmail) {
                      alert('Restaurante sem email cadastrado.');
                      return;
                    }
                    const link = `mailto:${invoiceSharePayload.ownerEmail}?subject=${encodeURIComponent(`Fatura ${invoiceSharePayload.invoiceId} - PedeZap`)}&body=${encodeURIComponent(invoiceSharePayload.message)}`;
                    window.open(link, '_blank');
                  }}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Mail size={15} />
                  Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-900">{editingPlanId ? 'Editar Plano' : 'Novo Plano'}</h2>
              <button onClick={() => setShowPlanModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nome do Plano</label>
                  <input
                    value={planForm.name}
                    onChange={(event) => setPlanForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Ex: Plano Enterprise"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Preco Mensal (R$)</label>
                  <input
                    value={planForm.price}
                    onChange={(event) => setPlanForm((prev) => ({ ...prev, price: event.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Cor de Identificacao</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={planForm.color}
                    onChange={(event) => setPlanForm((prev) => ({ ...prev, color: event.target.value }))}
                    className="h-10 w-12 rounded-md border border-slate-300 bg-white p-1"
                  />
                  <input
                    value={planForm.color}
                    onChange={(event) => setPlanForm((prev) => ({ ...prev, color: event.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Descricao Curta</label>
                <textarea
                  value={planForm.description}
                  onChange={(event) => setPlanForm((prev) => ({ ...prev, description: event.target.value }))}
                  className="w-full min-h-[72px] border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Uma breve descricao do publico alvo..."
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Lista de Beneficios (Features)</label>
                  <button
                    type="button"
                    onClick={handleAddPlanFeature}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    + Adicionar Item
                  </button>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  {planForm.features.map((feature, index) => (
                    <div key={`feature_${index}`} className="flex items-center gap-2">
                      <Check size={14} className="text-emerald-500" />
                      <input
                        value={feature}
                        onChange={(event) => handleUpdatePlanFeature(index, event.target.value)}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        placeholder={`Beneficio #${index + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemovePlanFeature(index)}
                        className="p-2 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Abas permitidas no Painel Master</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {masterTabOptions.map((tab) => (
                    <label key={tab.value} className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={planForm.allowedTabs.includes(tab.value)}
                        onChange={() => handleTogglePlanTab(tab.value)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      {tab.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={planForm.manualOrderLimitEnabled}
                    onChange={(event) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        manualOrderLimitEnabled: event.target.checked,
                        manualOrderLimitPerMonth: event.target.checked ? prev.manualOrderLimitPerMonth : ''
                      }))
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Limitar pedidos manuais por mes (aba Pedidos)
                </label>
                <input
                  value={planForm.manualOrderLimitPerMonth}
                  onChange={(event) =>
                    setPlanForm((prev) => ({
                      ...prev,
                      manualOrderLimitPerMonth: event.target.value.replace(/[^\d]/g, '')
                    }))
                  }
                  disabled={!planForm.manualOrderLimitEnabled}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
                  placeholder="Ex: 500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowPlanModal(false)}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSavePlan}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {editingPlanId ? 'Salvar Alteracoes' : 'Criar Plano'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showTeamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{editingTeamUser ? 'Editar Usuario' : 'Novo Usuario'}</h2>
                <p className="text-sm text-slate-500 mt-1">Defina o cargo e o acesso do funcionario.</p>
              </div>
              <button onClick={() => setShowTeamModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Nome Completo</label>
                <input
                  value={teamForm.name}
                  onChange={(event) => setTeamForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Email Profissional</label>
                <input
                  type="email"
                  value={teamForm.email}
                  onChange={(event) => setTeamForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Cargo / Permissao</label>
                <select
                  value={teamForm.role}
                  onChange={(event) => setTeamForm((prev) => ({ ...prev, role: event.target.value as TeamUser['role'] }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="">Selecione...</option>
                  {teamRoles.map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  value={teamForm.status}
                  onChange={(event) => setTeamForm((prev) => ({ ...prev, status: event.target.value as TeamUser['status'] }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white"
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Inativo">Inativo</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Senha Inicial</label>
                <input
                  type="password"
                  value={teamForm.password}
                  onChange={(event) => setTeamForm((prev) => ({ ...prev, password: event.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder={editingTeamUser ? 'Deixe em branco para manter' : 'Senha inicial'}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={() => setShowTeamModal(false)} className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100">
                  Cancelar
                </button>
                <button onClick={handleSaveTeamUser} className="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700">
                  {editingTeamUser ? 'Salvar' : 'Criar Acesso'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-3xl rounded-[28px] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-6 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-100">
                    <ShieldAlert size={13} />
                    {editingRoleId ? 'Edicao de cargo' : 'Novo perfil de acesso'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{editingRoleId ? 'Editar Cargo' : 'Novo Cargo'}</h2>
                    <p className="mt-1 text-sm text-slate-300">
                      {editingRoleId
                        ? 'Atualize nome, escopo e permissoes com uma visualizacao mais clara do impacto desse perfil.'
                        : 'Monte um perfil de acesso elegante e reutilizavel para sua equipe administrativa.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetRoleForm}
                  className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Nome do Cargo</label>
                  <input
                    value={roleForm.name}
                    onChange={(event) => setRoleForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                    placeholder="Ex: Financeiro senior"
                  />
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Permissoes do cargo</p>
                      <p className="text-xs text-slate-500">Selecione o que esse perfil pode acessar no painel admin.</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {roleForm.permissions.length} selecionada(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {allPermissions.map((permission) => {
                      const selected = roleForm.permissions.includes(permission.id);
                      return (
                        <button
                          key={permission.id}
                          type="button"
                          onClick={() => toggleRolePermission(permission.id)}
                          className={`group rounded-2xl border px-4 py-3 text-left transition-all ${
                            selected
                              ? 'border-emerald-300 bg-emerald-50 shadow-sm shadow-emerald-100'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-sm font-semibold ${selected ? 'text-emerald-800' : 'text-slate-800'}`}>
                                {permission.label}
                              </p>
                              <p className={`mt-1 text-xs ${selected ? 'text-emerald-700/80' : 'text-slate-500'}`}>
                                Libera acesso a esta area do painel.
                              </p>
                            </div>
                            <div
                              className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border transition ${
                                selected
                                  ? 'border-emerald-300 bg-emerald-600 text-white'
                                  : 'border-slate-200 bg-white text-transparent group-hover:text-slate-300'
                              }`}
                            >
                              <Check size={14} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 bg-slate-50/80 p-6 lg:border-l lg:border-t-0">
                <div className="space-y-5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Resumo rapido</p>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Nome</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{roleForm.name.trim() || 'Sem nome'}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Usuarios</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">{editingRoleDetails?.linkedUsers ?? 0}</p>
                      </div>
                    </div>
                    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-3">
                      <p className="text-xs font-semibold text-indigo-700">Impacto do cargo</p>
                      <p className="mt-1 text-sm text-indigo-900">
                        {editingRoleDetails
                          ? 'Alteracoes nas permissoes afetam os usuarios que ja usam este cargo.'
                          : 'Depois de criado, este cargo pode ser reutilizado em novos usuarios da equipe.'}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">Acessos selecionados</p>
                      <span className="text-xs text-slate-400">{selectedRolePermissionLabels.length} item(ns)</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedRolePermissionLabels.length > 0 ? (
                        selectedRolePermissionLabels.map((label) => (
                          <span
                            key={label}
                            className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                          >
                            {label}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-slate-500">Selecione pelo menos uma permissao para liberar acesso.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button onClick={resetRoleForm} className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-200/70">
                      Cancelar
                    </button>
                    <button onClick={handleSaveRole} className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-700">
                      {editingRoleId ? 'Salvar Alteracoes' : 'Criar Cargo'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {passwordResetPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Link de redefinicao de senha</h3>
                <p className="text-xs text-slate-500 mt-1">{passwordResetPayload.restaurantName}</p>
              </div>
              <button
                onClick={() => setPasswordResetPayload(null)}
                className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                aria-label="Fechar"
              >
                <X size={16} className="mx-auto" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Link gerado (expira em 1 hora)</p>
                <p className="mt-1 text-xs text-slate-700 break-all">{passwordResetPayload.resetLink}</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Expira em: {new Date(passwordResetPayload.expiresAt).toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(passwordResetPayload.resetLink);
                    alert('Link copiado.');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Copy size={14} />
                  Copiar Link
                </button>
                <button
                  onClick={() => window.open(passwordResetPayload.whatsappShareLink, '_blank')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                  <MessageCircle size={14} />
                  Enviar WhatsApp
                </button>
                <button
                  onClick={() => window.open(passwordResetPayload.emailShareLink, '_blank')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Mail size={14} />
                  Enviar Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-2xl rounded-2xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{editingRestaurant ? 'Editar Restaurante' : 'Novo Restaurante'}</h2>
                <p className="text-sm text-slate-500 mt-1">{editingRestaurant ? 'Atualize os dados do parceiro.' : 'Preencha os dados para cadastrar um novo parceiro.'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex border-b border-slate-100 px-8">
              <button
                type="button"
                onClick={() => setModalTab('general')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  modalTab === 'general' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Store size={16} />
                Dados Gerais
              </button>
              <button
                type="button"
                onClick={() => setModalTab('address')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  modalTab === 'address' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <MapPin size={16} />
                Endereco
              </button>
              <button
                type="button"
                onClick={() => setModalTab('access')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  modalTab === 'access' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Lock size={16} />
                Acesso & Plano
              </button>
            </div>

            <form onSubmit={handleSaveRestaurant} className="flex-1 overflow-y-auto p-8">
              {modalTab === 'general' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-left-4 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Nome Fantasia <span className="text-red-500">*</span></label>
                    <input className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: Pizzaria do Joao" value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Razao Social</label>
                      <input className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Ex: Joao Silva ME" value={form.legalName} onChange={(event) => setForm((prev) => ({ ...prev, legalName: event.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Documento (CPF/CNPJ)</label>
                      <input className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="00.000.000/0000-00" value={form.document} onChange={(event) => setForm((prev) => ({ ...prev, document: event.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">WhatsApp <span className="text-red-500">*</span></label>
                    <input className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="5511999999999" value={form.whatsapp} onChange={(event) => setForm((prev) => ({ ...prev, whatsapp: event.target.value }))} required />
                    <p className="text-xs text-slate-500">Utilizado para receber os pedidos.</p>
                  </div>
                </div>
              )}

              {modalTab === 'address' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Endereco Completo</label>
                    <input className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Rua das Flores, 123" value={form.address} onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Cidade</label>
                      <input className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="Sao Paulo" value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Estado</label>
                      <input className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="SP" value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} />
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'access' && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Email de Login</label>
                      <input type="email" className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="joao@email.com" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">Senha Provisoria</label>
                      <div className="relative">
                        <input className="w-full border border-slate-300 rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder={editingRestaurant ? "Deixe em branco para manter" : "******"} value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
                        <button
                          type="button"
                          onClick={generatePassword}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                          title="Gerar senha aleatoria"
                        >
                          <Wand2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Slug (URL) <span className="text-xs text-slate-400 font-normal">(opcional)</span></label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">/r/</span>
                      <input className="w-full border border-slate-300 rounded-r-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" placeholder="pizzaria-do-joao" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Plano Contratado</label>
                    <select className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-white" value={form.subscribedPlanId} onChange={(event) => { const selected = plans.find((plan) => plan.id === event.target.value) ?? null; setForm((prev) => ({ ...prev, subscribedPlanId: event.target.value, plan: selected?.name ?? prev.plan })); }}>
                      <option value="">Selecione um plano</option>
                      {plans.filter((plan) => plan.active).map((plan) => (
                        <option key={plan.id} value={plan.id}>
                          {plan.name} ({moneyFormatter.format(plan.price)}/mes)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-between items-center">
                <div className="text-xs text-slate-400">
                  Passo {modalTab === 'general' ? 1 : modalTab === 'address' ? 2 : 3} de 3
                </div>
                <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-100 transition-colors">
                  Cancelar
                </button>
                {modalTab !== 'access' ? (
                  <button
                    type="button"
                    onClick={() => setModalTab(modalTab === 'general' ? 'address' : 'access')}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                  >
                    Proximo <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? 'Salvando...' : (editingRestaurant ? 'Salvar Alteracoes' : 'Finalizar Cadastro')}
                    {!saving && <Check size={16} />}
                  </button>
                )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && createdCredentials && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-600 p-8 text-center">
              <div className="mx-auto h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <Check className="text-white h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">Cadastro Realizado!</h2>
              <p className="text-emerald-100 text-sm mt-1">Envie as credenciais para o parceiro.</p>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-5 space-y-4">
                <div className="text-center border-b border-slate-200 pb-4">
                  <p className="font-bold text-slate-900 text-lg">{createdCredentials.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Credenciais de Acesso</p>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Login:</span>
                    <span className="font-medium text-slate-900">{createdCredentials.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Senha:</span>
                    <code className="font-mono font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">{createdCredentials.password}</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Link:</span>
                    <span className="font-medium text-emerald-600 truncate max-w-[200px]">/r/{createdCredentials.slug}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button onClick={handleShareWhatsapp} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-green-50 text-slate-600 hover:text-green-600 transition-colors border border-slate-100 hover:border-green-200">
                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <MessageCircle size={20} />
                  </div>
                  <span className="text-xs font-bold">WhatsApp</span>
                </button>
                <button onClick={handleShareEmail} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors border border-slate-100 hover:border-blue-200">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <Mail size={20} />
                  </div>
                  <span className="text-xs font-bold">Email</span>
                </button>
                <button onClick={handleCopy} className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-100 hover:border-slate-200">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                    <Copy size={20} />
                  </div>
                  <span className="text-xs font-bold">Copiar</span>
                </button>
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => setShowSuccessModal(false)} className="w-full py-3 rounded-xl font-bold text-slate-700 hover:bg-slate-200 transition-colors">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


