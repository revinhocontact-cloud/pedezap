export type Lead = {
  id: string;
  responsibleName: string;
  restaurantName: string;
  whatsapp: string;
  cityState: string;
  plan: string;
  message?: string;
  createdAt: string;
};

export type RestaurantCategory = {
  id: string;
  name: string;
  active: boolean;
};

export type RestaurantProduct = {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  offerEnabled?: boolean;
  offerPrice?: number;
  active: boolean;
  imageUrl?: string;
  kind?: "padrao" | "pizza" | "bebida" | "acai";
  pizzaFlavors?: Array<{
    name: string;
    ingredients: string;
    price: number;
  }>;
  crusts?: Array<{
    name: string;
    ingredients?: string;
    price: number;
  }>;
  complements?: Array<{
    name: string;
    price: number;
  }>;
  acaiComplementGroups?: Array<{
    id: string;
    name: string;
    minSelect: number;
    maxSelect: number;
    items: Array<{
      id: string;
      name: string;
      price: number;
      maxQty: number;
    }>;
  }>;
};

export type RestaurantBanner = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
  productIds: string[];
  abGroup?: "A" | "B" | "";
  clicks?: number;
  impressions?: number;
  attributedOrders?: number;
  lastClickedAt?: string | null;
};

export type RestaurantMarketingCampaign = {
  id: string;
  name: string;
  couponCode?: string;
  couponCodes?: string[];
  bannerIds?: string[];
  period?: string;
  startDate?: string;
  endDate?: string;
  autoActivateByCalendar?: boolean;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  targetCouponCode?: string;
  clicks?: number;
  attributedOrders?: number;
  lastClickedAt?: string | null;
  active: boolean;
  createdAt: string;
};

export type RestaurantCoupon = {
  id: string;
  code: string;
  uses: number;
  active: boolean;
  discountType: "percent" | "fixed";
  discountValue: number;
  minOrderValue: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
};

export type RestaurantDeliveryDistanceBand = {
  id: string;
  upToKm: number;
  fee: number;
};

export type RestaurantDeliveryNeighborhoodRate = {
  id: string;
  name: string;
  fee: number;
  active: boolean;
};

export type RestaurantDeliveryConfig = {
  radiusKm: number;
  feeMode: "flat" | "distance_bands" | "neighborhood_fixed" | "hybrid";
  distanceBands: RestaurantDeliveryDistanceBand[];
  neighborhoodRates: RestaurantDeliveryNeighborhoodRate[];
  pickupEnabled: boolean;
  pickupInstructions?: string;
  dispatchMode: "manual" | "auto";
  autoDispatchEnabled: boolean;
};

export type RestaurantBioLink = {
  appearance: "dark" | "light" | "brand";
  headline: string;
  whatsappEnabled: boolean;
  whatsappValue: string;
  instagramEnabled: boolean;
  instagramValue: string;
  customEnabled: boolean;
  customLabel: string;
  customUrl: string;
};

export type RestaurantAdsAiPlanHistoryItem = {
  id: string;
  createdAt: string;
  campaignName: string;
  campaignObjective: string;
  suggestedPeriod: string;
  targetAudience: string;
  recommendedRadiusKm: number;
  dailyBudgetSuggestion: string;
  channels: string[];
  couponSuggestion: string;
  couponDiscountHint: string;
  bannerHeadline: string;
  bannerDescription: string;
  adCopyPrimary: string;
  adCopyVariants: string[];
  headline: string;
  cta: string;
  implementationChecklist: string[];
  trackingSuggestion: string;
  reason: string;
};

export type RestaurantPanelRole = "owner" | "gerente" | "atendente" | "cozinha";

export type RestaurantPanelUser = {
  id: string;
  name: string;
  email: string;
  role: RestaurantPanelRole;
  status: "Ativo" | "Inativo";
  password: string;
  permissions: PlanMasterTab[];
  createdAt: string;
  lastAccessAt?: string | null;
};

export type Restaurant = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string;
  plan: string;
  active: boolean;
  openForOrders?: boolean;
  createdAt: string;
  canceledAt?: string | null;
  openingHours: string;
  address: string;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  minOrderValue: number;
  deliveryFee: number;
  deliveryConfig?: RestaurantDeliveryConfig;
  logoUrl: string;
  coverUrl: string;
  ownerEmail: string;
  ownerPassword: string;
  panelUsers?: RestaurantPanelUser[];
  passwordResetToken?: string | null;
  passwordResetExpiresAt?: string | null;
  taxId?: string | null;
  mustChangePassword?: boolean;
  subscribedPlanId?: string | null;
  subscriptionStatus?: "trial" | "active" | "pending_payment" | "expired" | "canceled";
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  nextBillingAt?: string | null;
  subscriptionStartedAt?: string | null;
  subscriptionEndsAt?: string | null;
  pendingPlanId?: string | null;
  pendingCheckoutExternalId?: string | null;
  lastCheckoutUrl?: string | null;
  bannerFeatureEnabled?: boolean;
  viewCount?: number;
  lastViewAt?: string | null;
  banners?: RestaurantBanner[];
  marketingCampaigns?: RestaurantMarketingCampaign[];
  coupons?: RestaurantCoupon[];
  bioLink?: RestaurantBioLink;
  adsAiPlansHistory?: RestaurantAdsAiPlanHistoryItem[];
  categories: RestaurantCategory[];
  products: RestaurantProduct[];
};

export type BillingPlan = {
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
  createdAt: string;
  updatedAt: string;
};

export type PlanMasterTab =
  | "dashboard"
  | "orders"
  | "menu"
  | "highlights"
  | "clients"
  | "billing"
  | "promotions"
  | "banners"
  | "marketing"
  | "settings"
  | "plans"
  | "support";

export type OrderPaymentMethod = "money" | "card" | "pix";
export type OrderStatus = "Recebido" | "Em preparo" | "Concluido";

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
};

export type Order = {
  id: string;
  restaurantSlug: string;
  source?: "catalog" | "panel";
  fulfillmentType?: "delivery" | "pickup";
  customerName: string;
  customerWhatsapp: string;
  customerAddress: string;
  customerLatitude?: number | null;
  customerLongitude?: number | null;
  deliveryDistanceKm?: number | null;
  deliveryZoneName?: string | null;
  deliveryFeeSource?: "flat" | "distance_band" | "neighborhood_fixed" | "hybrid" | "fallback";
  dispatchStatus?: "pending" | "assigned" | "out_for_delivery" | "delivered";
  dispatchMode?: "manual" | "auto";
  trafficSource?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  attributionBannerId?: string;
  attributionCampaignId?: string;
  paymentMethod: OrderPaymentMethod;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discountValue?: number;
  couponCode?: string;
  total: number;
  generalNotes?: string;
  status: OrderStatus;
  createdAt: string;
};

export type Customer = {
  id: string;
  restaurantSlug: string;
  name: string;
  whatsapp: string;
  totalOrders: number;
  totalSpent: number;
  usedCouponCodes?: string[];
  lastOrderAt?: string | null;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  createdAt: string;
  action: string;
  ip: string;
  actorType: "admin" | "master" | "system" | "anonymous";
  actorId: string;
  actorName: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type ActiveSession = {
  id: string;
  kind: "admin" | "master";
  sessionId: string;
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
};

export type AppStore = {
  leads: Lead[];
  restaurants: Restaurant[];
  orders: Order[];
  customers: Customer[];
  auditLogs: AuditLog[];
  activeSessions: ActiveSession[];
  invoices: Invoice[];
  twilioMessages: TwilioMessageLog[];
  adminUsers: AdminUser[];
  adminRoles: AdminRole[];
  supportTickets: SupportTicket[];
  supportMessages: SupportMessage[];
  supportQuickReplies: SupportQuickReply[];
  plans: BillingPlan[];
  paymentsConfig: PaymentsConfig;
  payouts: Payout[];
  adminSettings: AdminSettings;
};

export type InvoiceStatus = "Pago" | "Pendente" | "Vencido" | "Estornado";
export type InvoiceMethod = "Cartao de Credito" | "Boleto" | "Pix";

export type Invoice = {
  id: string;
  restaurantSlug: string;
  restaurantName: string;
  plan: string;
  value: number;
  dueDate: string;
  status: InvoiceStatus;
  method: InvoiceMethod;
  createdAt: string;
  paidAt?: string | null;
  externalId?: string | null;
  lastTwilioSentAt?: string | null;
  lastTwilioMessageSid?: string | null;
  lastTwilioStatus?: string | null;
};

export type TwilioMessageLog = {
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

export type AdminStatus = "Ativo" | "Inativo";

export type AdminRole = {
  id: string;
  name: string;
  permissions: string[];
  createdAt: string;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string | null;
  document?: string | null;
  jobTitle?: string | null;
  bio?: string | null;
  role: string;
  status: AdminStatus;
  password: string;
  permissions: string[];
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  twoFactorPendingSecret?: string | null;
  createdAt: string;
  lastAccessAt?: string | null;
};

export type SupportTicketStatus = "Aberto" | "Em andamento" | "Aguardando" | "Fechado";
export type SupportRequesterType = "Parceiro" | "Cliente";

export type SupportTicket = {
  id: string;
  subject: string;
  requesterName: string;
  requesterEmail: string;
  requesterType: SupportRequesterType;
  restaurantName?: string;
  restaurantSlug?: string;
  status: SupportTicketStatus;
  category: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  assigneeName?: string | null;
};

export type SupportMessage = {
  id: string;
  ticketId: string;
  authorName: string;
  authorRole: "customer" | "agent";
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

export type SupportQuickReply = {
  id: string;
  label: string;
  body: string;
  status: SupportTicketStatus;
  createdAt: string;
};

export type PaymentMethodType = "pix" | "card";
export type PayoutSchedule = "weekly" | "daily";

export type PaymentMethodConfig = {
  enabled: boolean;
  percentFee: number;
  fixedFee: number;
};

export type PaymentsConfig = {
  provider: "stripe";
  methods: Record<PaymentMethodType, PaymentMethodConfig>;
  payoutSchedule: PayoutSchedule;
  weeklyPayoutDay: number;
  dailyEnabled: boolean;
  gatewayApiKey: string;
  autoPayoutD1: boolean;
  autoPayoutD30: boolean;
  notifyWhatsapp: boolean;
};

export type AdminSettings = {
  platformName: string;
  supportUrl: string;
  contactEmail: string;
  maintenanceMode: boolean;
  versionLabel: string;
  logoUrl: string;
  faviconUrl: string;
  colorPrimary: string;
  colorSecondary: string;
  colorAccent: string;
  locationAutocompleteMode?: "hybrid" | "json" | "internet";
  notificationTemplates: NotificationTemplate[];
  integrations: {
    abacatepay: { connected: boolean; environment: "Producao" | "Teste"; webhookUrl: string };
    stripe: { connected: boolean; webhookUrl: string };
    whatsappEvolution: { connected: boolean; webhookUrl: string };
    twilio: { connected: boolean; whatsappFrom: string; statusCallbackUrl: string };
  };
  securityPolicies: {
    enforce2FA: boolean;
    auditLogs: boolean;
    suspiciousLoginAlert: boolean;
  };
};

export type NotificationTemplate = {
  id: string;
  title: string;
  message: string;
  variables: string[];
  active: boolean;
};

export type PixKeyType = "CNPJ" | "CPF" | "EMAIL" | "RANDOM";
export type PayoutStatus = "Pendente" | "Pago" | "Falha";
export type PayoutGroup = "today" | "late" | "upcoming";

export type Payout = {
  id: string;
  restaurant: string;
  restaurantSlug?: string;
  cycle: string;
  dueDate: string;
  pixKey: string;
  pixType: PixKeyType;
  amount: number;
  status: PayoutStatus;
  group: PayoutGroup;
  withdrawId?: string | null;
  receiptUrl?: string | null;
  updatedAt?: string | null;
};

export const defaultStore: AppStore = {
  leads: [],
  orders: [],
  customers: [],
  auditLogs: [],
  activeSessions: [],
  restaurants: [
    {
      id: "r_pizzadomario",
      name: "Pizza do Mario",
      slug: "pizzadomario",
      whatsapp: "5511991112233",
      plan: "Local + Online",
      active: true,
      createdAt: "2025-10-10T12:00:00.000Z",
      canceledAt: null,
      openingHours: "Ter a Dom - 18h as 23h30",
      address: "Rua das Flores, 123",
      city: "Sao Paulo",
      state: "SP",
      latitude: -23.5505,
      longitude: -46.6333,
      minOrderValue: 20,
      deliveryFee: 6,
      logoUrl: "https://picsum.photos/200/200?random=21",
      coverUrl: "https://picsum.photos/1200/500?random=22",
      ownerEmail: "mario@pedezap.app",
      ownerPassword: "123456",
      categories: [
        { id: "cat_pizza_trad", name: "Pizzas Tradicionais", active: true },
        { id: "cat_pizza_esp", name: "Pizzas Especiais", active: true },
        { id: "cat_bebidas", name: "Bebidas", active: true }
      ],
      products: [
        {
          id: "prod_marguerita",
          categoryId: "cat_pizza_trad",
          name: "Pizza Marguerita",
          description: "Molho de tomate, mussarela, tomate e manjericao.",
          price: 49.9,
          active: true,
          imageUrl: "https://picsum.photos/400/300?random=23"
        },
        {
          id: "prod_calabresa",
          categoryId: "cat_pizza_trad",
          name: "Pizza Calabresa",
          description: "Mussarela, calabresa fatiada e cebola.",
          price: 52.9,
          active: true,
          imageUrl: "https://picsum.photos/400/300?random=24"
        },
        {
          id: "prod_portuguesa",
          categoryId: "cat_pizza_esp",
          name: "Pizza Portuguesa",
          description: "Presunto, ovos, cebola, ervilha e queijo.",
          price: 58.9,
          active: true,
          imageUrl: "https://picsum.photos/400/300?random=25"
        },
        {
          id: "prod_coca_2l",
          categoryId: "cat_bebidas",
          name: "Coca-Cola 2L",
          description: "Refrigerante gelado 2 litros.",
          price: 14,
          active: true,
          imageUrl: "https://picsum.photos/400/300?random=26"
        }
      ]
    },
    {
      id: "r_burguercentral",
      name: "Burguer Central",
      slug: "burguercentral",
      whatsapp: "5511987776655",
      plan: "Local",
      active: true,
      createdAt: "2025-11-05T12:00:00.000Z",
      canceledAt: null,
      openingHours: "Seg a Sab - 17h as 23h",
      address: "Avenida Central, 500",
      city: "Campinas",
      state: "SP",
      latitude: -22.9056,
      longitude: -47.0608,
      minOrderValue: 18,
      deliveryFee: 5,
      logoUrl: "https://picsum.photos/200/200?random=31",
      coverUrl: "https://picsum.photos/1200/500?random=32",
      ownerEmail: "central@pedezap.app",
      ownerPassword: "123456",
      categories: [
        { id: "cat_burger", name: "Hamburgueres", active: true },
        { id: "cat_combo", name: "Combos", active: true },
        { id: "cat_acomp", name: "Acompanhamentos", active: true },
        { id: "cat_refri", name: "Bebidas", active: true }
      ],
      products: [
        {
          id: "prod_xbacon",
          categoryId: "cat_burger",
          name: "X-Bacon",
          description: "Pao, burger 150g, queijo, bacon e molho da casa.",
          price: 27.5,
          active: true,
          imageUrl: "https://picsum.photos/400/300?random=33"
        },
        {
          id: "prod_smash",
          categoryId: "cat_burger",
          name: "Smash Duplo",
          description: "Dois smash 90g, queijo cheddar e picles.",
          price: 29.9,
          active: true,
          imageUrl: "https://picsum.photos/400/300?random=34"
        },
        {
          id: "prod_combo_casal",
          categoryId: "cat_combo",
          name: "Combo Casal",
          description: "2 lanches, 1 batata media e 2 refrigerantes.",
          price: 74.9,
          active: true,
          imageUrl: "https://picsum.photos/400/300?random=35"
        },
        {
          id: "prod_batata",
          categoryId: "cat_acomp",
          name: "Batata Frita",
          description: "Porcao media de batata crocante.",
          price: 13,
          active: true,
          imageUrl: "https://picsum.photos/400/300?random=36"
        },
        {
          id: "prod_guarana",
          categoryId: "cat_refri",
          name: "Guarana Lata",
          description: "Lata 350ml gelada.",
          price: 6,
          active: true,
          imageUrl: "https://picsum.photos/400/300?random=37"
        }
      ]
    }
  ],
  invoices: [
    {
      id: "INV-001",
      restaurantSlug: "pizzadomario",
      restaurantName: "Pizza do Mario",
      plan: "Local + Online",
      value: 299.9,
      dueDate: "2026-01-10",
      status: "Pago",
      method: "Cartao de Credito",
      createdAt: "2026-01-01T12:00:00.000Z",
      paidAt: "2026-01-10T12:00:00.000Z",
      lastTwilioSentAt: null,
      lastTwilioMessageSid: null,
      lastTwilioStatus: null
    },
    {
      id: "INV-002",
      restaurantSlug: "burguercentral",
      restaurantName: "Burguer Central",
      plan: "Local",
      value: 149.9,
      dueDate: "2026-01-10",
      status: "Pendente",
      method: "Boleto",
      createdAt: "2026-01-01T12:00:00.000Z",
      paidAt: null,
      lastTwilioSentAt: null,
      lastTwilioMessageSid: null,
      lastTwilioStatus: null
    }
  ],
  twilioMessages: [],
  adminUsers: [
    {
      id: "adm_master",
      name: "Admin Master",
      email: "admin@pedezap.app",
      role: "Admin Master",
      status: "Ativo",
      password: "123456",
      permissions: [
        "dashboard",
        "restaurants",
        "leads",
        "financial",
        "payments",
        "stats",
        "team",
        "support",
        "settings",
        "security"
      ],
      createdAt: "2025-10-01T12:00:00.000Z",
      lastAccessAt: null
    },
    {
      id: "adm_fin",
      name: "Carlos Financeiro",
      email: "carlos@pedezap.ai",
      role: "Financeiro",
      status: "Ativo",
      password: "123456",
      permissions: ["financial"],
      createdAt: "2025-11-10T12:00:00.000Z",
      lastAccessAt: "2026-02-04T18:00:00.000Z"
    },
    {
      id: "adm_sup",
      name: "Julia Suporte",
      email: "julia@pedezap.ai",
      role: "Suporte",
      status: "Ativo",
      password: "123456",
      permissions: ["support"],
      createdAt: "2025-12-01T12:00:00.000Z",
      lastAccessAt: "2026-02-05T12:15:00.000Z"
    },
    {
      id: "adm_ops",
      name: "Roberto Operacoes",
      email: "beto@pedezap.ai",
      role: "Operacao",
      status: "Inativo",
      password: "123456",
      permissions: ["restaurants", "leads"],
      createdAt: "2025-09-20T12:00:00.000Z",
      lastAccessAt: "2025-10-20T12:00:00.000Z"
    }
  ],
  adminRoles: [
    {
      id: "role_master",
      name: "Admin Master",
      permissions: [
        "dashboard",
        "restaurants",
        "leads",
        "financial",
        "stats",
        "team",
        "support",
        "settings",
        "security"
      ],
      createdAt: "2025-10-01T12:00:00.000Z"
    },
    {
      id: "role_fin",
      name: "Financeiro",
      permissions: ["financial", "payments"],
      createdAt: "2025-11-10T12:00:00.000Z"
    },
    {
      id: "role_sup",
      name: "Suporte",
      permissions: ["support"],
      createdAt: "2025-12-01T12:00:00.000Z"
    },
    {
      id: "role_ops",
      name: "Operacao",
      permissions: ["restaurants", "leads"],
      createdAt: "2025-09-20T12:00:00.000Z"
    }
  ],
  supportTickets: [
    {
      id: "TCK-2024-001",
      subject: "Erro ao cadastrar novo item no cardapio",
      requesterName: "Pizzaria do Joao",
      requesterEmail: "joao@pedezap.ai",
      requesterType: "Parceiro",
      restaurantName: "Pizzaria do Joao",
      restaurantSlug: "pizzariadojoao",
      status: "Aberto",
      category: "Operacao",
      createdAt: "2026-02-06T12:00:00.000Z",
      updatedAt: "2026-02-06T12:10:00.000Z",
      lastMessageAt: "2026-02-06T12:10:00.000Z",
      assigneeName: "Usuario Suporte"
    },
    {
      id: "TCK-2024-002",
      subject: "Pedido veio errado e restaurante nao atende",
      requesterName: "Ana Maria Braga",
      requesterEmail: "ana@example.com",
      requesterType: "Cliente",
      status: "Em andamento",
      category: "Suporte",
      createdAt: "2026-02-05T14:30:00.000Z",
      updatedAt: "2026-02-05T15:00:00.000Z",
      lastMessageAt: "2026-02-05T15:00:00.000Z",
      assigneeName: "Usuario Suporte"
    },
    {
      id: "TCK-2024-003",
      subject: "Duvida sobre repasse financeiro",
      requesterName: "Burger King Local",
      requesterEmail: "gerencia@bklocal.com.br",
      requesterType: "Parceiro",
      restaurantName: "Burger King Local",
      restaurantSlug: "bk-local",
      status: "Aguardando",
      category: "Financeiro",
      createdAt: "2026-02-04T14:00:00.000Z",
      updatedAt: "2026-02-05T09:10:00.000Z",
      lastMessageAt: "2026-02-05T09:10:00.000Z",
      assigneeName: "Carlos Financeiro"
    },
    {
      id: "TCK-2024-004",
      subject: "Cancelamento de assinatura",
      requesterName: "Carlos Silva",
      requesterEmail: "carlos@email.com",
      requesterType: "Cliente",
      status: "Fechado",
      category: "Financeiro",
      createdAt: "2025-11-20T10:00:00.000Z",
      updatedAt: "2025-11-20T11:15:00.000Z",
      lastMessageAt: "2025-11-20T11:15:00.000Z",
      assigneeName: "Admin Master"
    }
  ],
  supportMessages: [
    {
      id: "MSG-001",
      ticketId: "TCK-2024-003",
      authorName: "Burger King Local",
      authorRole: "customer",
      body: "O valor do dia 23 nao caiu na conta ainda.",
      createdAt: "2026-02-04T14:00:00.000Z"
    },
    {
      id: "MSG-002",
      ticketId: "TCK-2024-003",
      authorName: "Usuario Suporte",
      authorRole: "agent",
      body: "Ola, verificamos que houve um feriado bancario. O prazo estendeu para hoje.",
      createdAt: "2026-02-04T14:20:00.000Z"
    },
    {
      id: "MSG-003",
      ticketId: "TCK-2024-001",
      authorName: "Pizzaria do Joao",
      authorRole: "customer",
      body: "Nao consigo subir a foto da nova pizza, da erro 500.",
      createdAt: "2026-02-06T12:00:00.000Z"
    },
    {
      id: "MSG-004",
      ticketId: "TCK-2024-002",
      authorName: "Ana Maria Braga",
      authorRole: "customer",
      body: "Pedido veio errado e restaurante nao atende.",
      createdAt: "2026-02-05T14:30:00.000Z"
    }
  ],
  supportQuickReplies: [
    {
      id: "qr_greeting",
      label: "Saudacao",
      body: "Ola {nome}, boa noite! Como posso ajudar?",
      status: "Aberto",
      createdAt: "2026-02-01T12:00:00.000Z"
    },
    {
      id: "qr_status",
      label: "Atualizacao",
      body: "Ola {nome}, estou verificando sua solicitacao e retorno em instantes.",
      status: "Em andamento",
      createdAt: "2026-02-01T12:00:00.000Z"
    },
    {
      id: "qr_close",
      label: "Encerrar",
      body: "Obrigado {nome}! Chamado encerrado. Avalie nosso atendimento quando puder.",
      status: "Fechado",
      createdAt: "2026-02-01T12:00:00.000Z"
    }
  ],
  plans: [
    {
      id: "plan_local",
      name: "Plano Local",
      price: 149.9,
      color: "#6366f1",
      description: "Ideal para pequenos comercios que vendem apenas no bairro.",
      features: ["Cardapio Digital", "Recebimento via WhatsApp", "Ate 500 pedidos/mes", "Suporte por Email"],
      allowedTabs: ["dashboard", "orders", "menu", "clients", "settings", "plans", "support"],
      manualOrderLimitEnabled: true,
      manualOrderLimitPerMonth: 500,
      active: true,
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z"
    },
    {
      id: "plan_local_online",
      name: "Plano Local + Online",
      price: 299.9,
      color: "#10b981",
      description: "Para quem quer escalar e vender online com pagamento automatico.",
      features: [
        "Tudo do Plano Local",
        "Pagamento Online (Pix/Cartao)",
        "Pedidos Ilimitados",
        "Gestor de Entregas",
        "Ferramenta de Cupons"
      ],
      allowedTabs: [
        "dashboard",
        "orders",
        "menu",
        "highlights",
        "clients",
        "billing",
        "promotions",
        "banners",
        "marketing",
        "settings",
        "plans",
        "support"
      ],
      manualOrderLimitEnabled: false,
      manualOrderLimitPerMonth: null,
      active: true,
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-02-01T00:00:00.000Z"
    }
  ],
  paymentsConfig: {
    provider: "stripe",
    methods: {
      pix: { enabled: true, percentFee: 1.0, fixedFee: 0 },
      card: { enabled: true, percentFee: 3.2, fixedFee: 0.39 }
    },
    payoutSchedule: "weekly",
    weeklyPayoutDay: 5,
    dailyEnabled: true,
    gatewayApiKey: "abacae_live_****************",
    autoPayoutD1: true,
    autoPayoutD30: true,
    notifyWhatsapp: true
  },
  payouts: [
    {
      id: "PAY-9001",
      restaurant: "Pizzaria do Joao",
      restaurantSlug: "pizzariadojoao",
      cycle: "D+1",
      dueDate: "06/02/2026",
      pixKey: "12.345.678/0001-90",
      pixType: "CNPJ",
      amount: 2450.0,
      status: "Pendente",
      group: "today"
    },
    {
      id: "PAY-9005",
      restaurant: "Cantina Italiana",
      restaurantSlug: "cantinaitaliana",
      cycle: "D+1",
      dueDate: "06/02/2026",
      pixKey: "aleatoria-uuid-key",
      pixType: "RANDOM",
      amount: 1890.2,
      status: "Pendente",
      group: "today"
    },
    {
      id: "PAY-9007",
      restaurant: "Acai Power",
      restaurantSlug: "acaipower",
      cycle: "D+30",
      dueDate: "01/12/2023",
      pixKey: "123.456.789-00",
      pixType: "CPF",
      amount: 8900.5,
      status: "Pendente",
      group: "late"
    },
    {
      id: "PAY-9002",
      restaurant: "Sushi Express",
      restaurantSlug: "sushiexpress",
      cycle: "D+1",
      dueDate: "25/11/2023",
      pixKey: "sushi@email.com",
      pixType: "EMAIL",
      amount: 1200.5,
      status: "Pago",
      group: "upcoming"
    },
    {
      id: "PAY-9004",
      restaurant: "Pastelaria Central",
      restaurantSlug: "pastelariacentral",
      cycle: "D+1",
      dueDate: "24/11/2023",
      pixKey: "123.456.789-00",
      pixType: "CPF",
      amount: 350.0,
      status: "Falha",
      group: "upcoming"
    }
  ],
  adminSettings: {
    platformName: "PedeZap",
    supportUrl: "https://ajuda.pedezap.ai",
    contactEmail: "contato@pedezap.ai",
    maintenanceMode: false,
    versionLabel: "v2.4.0 (Build 9021)",
    logoUrl: "",
    faviconUrl: "",
    colorPrimary: "#10B981",
    colorSecondary: "#0F172A",
    colorAccent: "#FBBF24",
    locationAutocompleteMode: "internet",
    notificationTemplates: [
      {
        id: "tpl_welcome",
        title: "Boas-vindas (Novo Restaurante)",
        message:
          "Ola {nome_restaurante}! Sua conta no PedeZap foi ativada com sucesso. Acesse seu painel em: {link_painel}",
        variables: ["{nome_restaurante}", "{link_painel}", "{senha_provisoria}"],
        active: true
      },
      {
        id: "tpl_new_order",
        title: "Novo Pedido (Para o Cliente)",
        message:
          "Oi {nome_cliente}! Recebemos seu pedido #{numero_pedido} no valor de {valor_total}. Previsao: {tempo_estimado}.",
        variables: ["{nome_cliente}", "{numero_pedido}", "{valor_total}", "{tempo_estimado}"],
        active: true
      },
      {
        id: "tpl_invoice_due",
        title: "Cobranca de Fatura",
        message:
          "Ola {nome_restaurante}! Segue a cobranca da fatura {numero_fatura} do PedeZap.\nValor: {valor_fatura}\nVencimento: {vencimento_fatura}\nForma de pagamento: {forma_pagamento}\nAcesse seu painel: {link_painel}",
        variables: [
          "{nome_restaurante}",
          "{numero_fatura}",
          "{valor_fatura}",
          "{vencimento_fatura}",
          "{forma_pagamento}",
          "{link_painel}"
        ],
        active: true
      },
      {
        id: "tpl_invoice_overdue",
        title: "Cobranca Vencida",
        message:
          "Ola {nome_restaurante}! Sua fatura {numero_fatura} esta vencida.\nValor: {valor_fatura}\nRegularize o pagamento para evitar suspensao.\nPainel: {link_painel}",
        variables: ["{nome_restaurante}", "{numero_fatura}", "{valor_fatura}", "{link_painel}"],
        active: true
      },
      {
        id: "tpl_invoice_paid",
        title: "Pagamento Confirmado",
        message:
          "Ola {nome_restaurante}! Confirmamos o pagamento da fatura {numero_fatura} no valor de {valor_fatura}. Obrigado por continuar com o PedeZap.",
        variables: ["{nome_restaurante}", "{numero_fatura}", "{valor_fatura}"],
        active: true
      }
    ],
    integrations: {
      abacatepay: {
        connected: false,
        environment: "Producao",
        webhookUrl: "https://api.pedezap.ai/v1/webhooks/abacatepay"
      },
      stripe: {
        connected: true,
        webhookUrl: "https://api.pedezap.ai/v1/webhooks/stripe"
      },
      whatsappEvolution: {
        connected: false,
        webhookUrl: "https://api.pedezap.ai/v1/webhooks/whatsapp-evolution"
      },
      twilio: {
        connected: false,
        whatsappFrom: "whatsapp:+14155238886",
        statusCallbackUrl: ""
      }
    },
    securityPolicies: {
      enforce2FA: false,
      auditLogs: true,
      suspiciousLoginAlert: true
    }
  }
};
