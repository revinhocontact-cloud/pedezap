'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  Clock3,
  Copy,
  Check,
  ChevronRight,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  LayoutDashboard,
  List,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquare,
  MapPin,
  Megaphone,
  Menu as MenuIcon,
  Pencil,
  PlayCircle,
  Printer,
  QrCode,
  Search,
  Share2,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  Store,
  TicketPercent,
  UtensilsCrossed,
  Users,
  Plus,
  Power,
  Trash2,
  ChevronDown,
  Bike,
  Wallet,
  Save,
  X,
  Paperclip,
  Instagram,
  Facebook,
  Youtube,
  Music2,
  Twitter
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Customer,
  Order,
  OrderStatus,
  Restaurant,
  RestaurantBanner,
  RestaurantCategory,
  RestaurantDeliveryConfig,
  RestaurantMarketingCampaign,
  RestaurantProduct,
  RestaurantAdsAiPlanHistoryItem,
  SupportMessage,
  SupportTicket
} from '@/lib/store-data';
import { BrandLogo } from '@/components/brand-logo';
import { MasterOrdersTab } from '@/components/master/orders/orders-tab';
import { ManualOrderModal } from '@/components/master/orders/manual-order-modal';

type MasterSession = {
  restaurantSlug: string;
  restaurantName: string;
  email: string;
  userId?: string;
  userName?: string;
  role?: 'owner' | 'gerente' | 'atendente' | 'cozinha';
  permissions?: TabKey[];
  isOwner?: boolean;
};

type MasterPanelUserRow = {
  id: string;
  name: string;
  email: string;
  role: 'gerente' | 'atendente' | 'cozinha';
  status: 'Ativo' | 'Inativo';
  permissions: TabKey[];
  createdAt: string;
  lastAccessAt?: string | null;
};

type MasterActiveSessionRow = {
  id: string;
  kind: 'master';
  subjectName: string;
  actorEmail?: string;
  role?: string | null;
  ip: string;
  lastSeenAt: string;
  expiresAt: string;
  isCurrent?: boolean;
};

type AiCampaignSuggestion = {
  campaignName: string;
  period: string;
  couponSuggestion: string;
  bannerHeadline: string;
  bannerDescription: string;
  whatsappMessage: string;
  strategyReason: string;
};

type AiSalesAnalysis = {
  executiveSummary: string;
  alerts: string[];
  recommendations: string[];
  implementationIdeas: string[];
};

type AiAdsAssistantPlan = {
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

type AdsAiHistoryItem = RestaurantAdsAiPlanHistoryItem;

type RestaurantForm = Pick<
  Restaurant,
  'name' | 'whatsapp' | 'openingHours' | 'address' | 'city' | 'state' | 'minOrderValue' | 'deliveryFee' | 'deliveryConfig' | 'openForOrders' | 'logoUrl' | 'coverUrl'
>;

type TabKey =
  | 'dashboard'
  | 'menu'
  | 'highlights'
  | 'clients'
  | 'orders'
  | 'billing'
  | 'promotions'
  | 'banners'
  | 'marketing'
  | 'settings'
  | 'plans'
  | 'support';

const DEFAULT_PLAN_TABS: TabKey[] = [
  'dashboard',
  'orders',
  'menu',
  'highlights',
  'clients',
  'billing',
  'promotions',
  'banners',
  'marketing',
  'settings',
  'plans',
  'support'
];

const MASTER_ROLE_DEFAULT_PERMISSIONS: Record<'owner' | 'gerente' | 'atendente' | 'cozinha', TabKey[]> = {
  owner: [...DEFAULT_PLAN_TABS],
  gerente: ['dashboard', 'orders', 'menu', 'highlights', 'clients', 'billing', 'promotions', 'banners', 'marketing', 'settings', 'support'],
  atendente: ['dashboard', 'orders', 'clients', 'promotions', 'support'],
  cozinha: ['orders']
};

const TAB_LABELS: Record<TabKey, string> = {
  dashboard: 'Dashboard',
  orders: 'Pedidos',
  menu: 'Cardapio',
  highlights: 'Destaques',
  clients: 'Clientes',
  billing: 'Faturamento',
  promotions: 'Promocoes',
  banners: 'Banners',
  marketing: 'Marketing',
  settings: 'Configuracoes',
  plans: 'Plano',
  support: 'Suporte'
};

type ProductKind = 'padrao' | 'pizza' | 'bebida' | 'acai';

type PizzaItemDraft = {
  name: string;
  ingredients: string;
  price: number;
};

type ProductComplementDraft = {
  name: string;
  price: number;
};

type AcaiComplementItemDraft = {
  id: string;
  name: string;
  price: number;
  maxQty: number;
};

type AcaiComplementGroupDraft = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  items: AcaiComplementItemDraft[];
};

type MenuProductForm = Omit<Partial<RestaurantProduct>, 'kind' | 'pizzaFlavors' | 'crusts'> & {
  kind: ProductKind;
  featured: boolean;
  alcoholic: boolean;
  draftBasePrice: string;
  pizzaFlavors: PizzaItemDraft[];
  crusts: PizzaItemDraft[];
  complements: ProductComplementDraft[];
  acaiComplementGroups: AcaiComplementGroupDraft[];
  draftFlavorName: string;
  draftFlavorIngredients: string;
  draftFlavorPrice: string;
  hasStuffedCrust: boolean;
  draftCrustName: string;
  draftCrustPrice: string;
  draftComplementName: string;
  draftComplementPrice: string;
  draftAcaiGroupName: string;
  draftAcaiGroupMinSelect: string;
  draftAcaiGroupMaxSelect: string;
};

type CouponDiscountType = 'percent' | 'fixed';

type Coupon = {
  id: string;
  code: string;
  uses: number;
  active: boolean;
  discountType: CouponDiscountType;
  discountValue: number;
  minOrderValue: number;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
};

type CouponForm = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: string;
  minOrderValue: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

type WeeklyHours = {
  id: string;
  label: string;
  enabled: boolean;
  open: string;
  close: string;
};

type SettingsPaymentMethods = {
  money: boolean;
  card: boolean;
  pix: boolean;
};

type AvailablePlan = {
  id: string;
  name: string;
  price: number;
  color: string;
  description: string;
  features: string[];
  allowedTabs?: TabKey[];
  manualOrderLimitEnabled?: boolean;
  manualOrderLimitPerMonth?: number | null;
  active: boolean;
  subscribers: number;
};

type SubscriptionSummary = {
  status: 'trial' | 'active' | 'pending_payment' | 'expired' | 'canceled';
  subscribedPlanId: string | null;
  trialEndsAt: string | null;
  trialDaysLeft: number;
  nextBillingAt: string | null;
  lastCheckoutUrl: string | null;
};

type ManualOrderPaymentMethod = 'money' | 'card' | 'pix';

type ManualOrderItem = {
  productId: string;
  quantity: number;
};

type ManualOrderForm = {
  customerName: string;
  customerWhatsapp: string;
  customerAddress: string;
  fulfillmentType: 'delivery' | 'pickup';
  paymentMethod: ManualOrderPaymentMethod;
  items: ManualOrderItem[];
};

type BannerForm = {
  title: string;
  description: string;
  imageUrl: string;
  active: boolean;
  productIds: string[];
  abGroup?: 'A' | 'B' | '';
};

type CampaignForm = {
  name: string;
  couponCode: string;
  couponCodes: string[];
  bannerIds: string[];
  period: string;
  startDate: string;
  endDate: string;
  autoActivateByCalendar: boolean;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  active: boolean;
};

type FlyerTheme = {
  key: string;
  dotClass: string;
  swatchClass: string;
  previewClass: string;
  titleRibbonClass: string;
  ctaClass: string;
};

type BioLinkAppearance = 'dark' | 'light' | 'brand';

type BioLinkSettings = {
  appearance: BioLinkAppearance;
  headline: string;
  whatsappEnabled: boolean;
  whatsappValue: string;
  instagramEnabled: boolean;
  instagramValue: string;
  customEnabled: boolean;
  customLabel: string;
  customUrl: string;
};

type SupportAttachmentDraft = {
  name: string;
  url: string;
  type?: string;
  size?: number;
};

function createDefaultBannerForm(): BannerForm {
  return {
    title: '',
    description: '',
    imageUrl: '',
    active: true,
    productIds: [],
    abGroup: ''
  };
}

function createDefaultCampaignForm(campaign?: RestaurantMarketingCampaign): CampaignForm {
  if (!campaign) {
    return {
      name: '',
      couponCode: '',
      couponCodes: [],
        bannerIds: [],
        period: '',
        startDate: '',
        endDate: '',
        autoActivateByCalendar: false,
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        utmContent: '',
        active: true
      };
  }
  return {
    name: campaign.name,
    couponCode: campaign.couponCode ?? campaign.couponCodes?.[0] ?? '',
    couponCodes: campaign.couponCodes ?? (campaign.couponCode ? [campaign.couponCode] : []),
    bannerIds: campaign.bannerIds ?? [],
    period: campaign.period ?? '',
    startDate: campaign.startDate ?? '',
    endDate: campaign.endDate ?? '',
    autoActivateByCalendar: campaign.autoActivateByCalendar ?? false,
    utmSource: campaign.utmSource ?? '',
    utmMedium: campaign.utmMedium ?? '',
    utmCampaign: campaign.utmCampaign ?? '',
    utmContent: campaign.utmContent ?? '',
    active: campaign.active
  };
}

function applyImageFile(event: ChangeEvent<HTMLInputElement>, onReady: (dataUrl: string) => void) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = () => {
    const result = reader.result;
    if (typeof result === 'string') {
      onReady(result);
    }
  };
  reader.readAsDataURL(file);
}

const FEATURED_TAG = '[destaque]';

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coupon_1',
    code: 'BEMVINDO10',
    uses: 45,
    active: true,
    discountType: 'percent',
    discountValue: 10,
    minOrderValue: 50,
    startDate: '2026-01-09',
    endDate: '2026-03-10',
    startTime: '',
    endTime: ''
  },
  {
    id: 'coupon_2',
    code: 'ENTREGAFREE',
    uses: 12,
    active: true,
    discountType: 'fixed',
    discountValue: 8,
    minOrderValue: 80,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  },
  {
    id: 'coupon_3',
    code: 'PIZZA20',
    uses: 89,
    active: false,
    discountType: 'percent',
    discountValue: 20,
    minOrderValue: 100,
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  }
];

function stripFeaturedTag(description: string) {
  return description.replace(FEATURED_TAG, '').trim();
}

function hasFeaturedTag(description: string) {
  return description.toLowerCase().includes(FEATURED_TAG);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitPriceParts(value: number) {
  const normalized = value.toFixed(2).replace('.', ',');
  const [intPart, decimalPart] = normalized.split(',');
  return { intPart, decimalPart: decimalPart ?? '00' };
}

function parsePriceInput(value: string | number | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const normalized = String(value)
    .trim()
    .replace(/\s/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.')
    .replace(/[^\d.-]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeExternalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function createDefaultProductForm(categoryId = ''): MenuProductForm {
  return {
    categoryId,
    name: '',
    description: '',
    price: 0,
    offerEnabled: false,
    offerPrice: 0,
    draftBasePrice: '',
    imageUrl: '',
    active: true,
    kind: 'padrao',
    featured: false,
    alcoholic: false,
    pizzaFlavors: [],
    crusts: [],
    complements: [],
    acaiComplementGroups: [],
    draftFlavorName: '',
    draftFlavorIngredients: '',
    draftFlavorPrice: '',
    hasStuffedCrust: false,
    draftCrustName: '',
    draftCrustPrice: '',
    draftComplementName: '',
    draftComplementPrice: '',
    draftAcaiGroupName: '',
    draftAcaiGroupMinSelect: '0',
    draftAcaiGroupMaxSelect: '1'
  };
}

function createDefaultCouponForm(coupon?: Coupon): CouponForm {
  if (!coupon) {
    return {
      code: '',
      discountType: 'percent',
      discountValue: '',
      minOrderValue: '0',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      active: true
    };
  }

  return {
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue.toString(),
    minOrderValue: coupon.minOrderValue.toString(),
    startDate: coupon.startDate,
    endDate: coupon.endDate,
    startTime: coupon.startTime,
    endTime: coupon.endTime,
    active: coupon.active
  };
}

function createDefaultManualOrderForm(): ManualOrderForm {
  return {
    customerName: '',
    customerWhatsapp: '',
    customerAddress: '',
    fulfillmentType: 'delivery',
    paymentMethod: 'money',
    items: []
  };
}

function createDefaultBioLinkSettings(): BioLinkSettings {
  return {
    appearance: 'dark',
    headline: 'Nossos Links Oficiais',
    whatsappEnabled: true,
    whatsappValue: '',
    instagramEnabled: true,
    instagramValue: '',
    customEnabled: false,
    customLabel: 'Meu Site',
    customUrl: ''
  };
}

function createDefaultDeliveryConfig(): RestaurantDeliveryConfig {
  return {
    radiusKm: 10,
    feeMode: 'flat',
    distanceBands: [
      { id: `band_${Date.now()}_1`, upToKm: 3, fee: 5 },
      { id: `band_${Date.now()}_2`, upToKm: 6, fee: 8 }
    ],
    neighborhoodRates: [],
    pickupEnabled: false,
    pickupInstructions: '',
    dispatchMode: 'manual',
    autoDispatchEnabled: false
  };
}

function normalizeDeliveryConfig(config?: RestaurantDeliveryConfig | null): RestaurantDeliveryConfig {
  const fallback = createDefaultDeliveryConfig();
  if (!config) return fallback;
  return {
    radiusKm: Number.isFinite(config.radiusKm) && config.radiusKm > 0 ? config.radiusKm : fallback.radiusKm,
    feeMode: config.feeMode ?? fallback.feeMode,
    distanceBands: (config.distanceBands ?? []).map((band, index) => ({
      id: band.id || `band_${index + 1}`,
      upToKm: Number(band.upToKm) || 1,
      fee: Number(band.fee) || 0
    })),
    neighborhoodRates: (config.neighborhoodRates ?? []).map((zone, index) => ({
      id: zone.id || `zone_${index + 1}`,
      name: zone.name ?? '',
      fee: Number(zone.fee) || 0,
      active: zone.active ?? true
    })),
    pickupEnabled: config.pickupEnabled ?? fallback.pickupEnabled,
    pickupInstructions: config.pickupInstructions ?? fallback.pickupInstructions,
    dispatchMode: config.dispatchMode ?? fallback.dispatchMode,
    autoDispatchEnabled: config.autoDispatchEnabled ?? fallback.autoDispatchEnabled
  };
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function MasterPage() {
  const router = useRouter();
  const [session, setSession] = useState<MasterSession | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [ordersView, setOrdersView] = useState<'board' | 'table'>('board');
  const [ordersQuery, setOrdersQuery] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [newOrdersAlertCount, setNewOrdersAlertCount] = useState(0);
  const [lastOrdersRefreshAt, setLastOrdersRefreshAt] = useState<string | null>(null);
  const [showManualOrderModal, setShowManualOrderModal] = useState(false);
  const [manualOrderForm, setManualOrderForm] = useState<ManualOrderForm>(createDefaultManualOrderForm());
  const [manualSelectedProductId, setManualSelectedProductId] = useState('');
  const [manualSelectedQuantity, setManualSelectedQuantity] = useState(1);
  const [creatingManualOrder, setCreatingManualOrder] = useState(false);
  const [clientsQuery, setClientsQuery] = useState('');
  const [highlightsQuery, setHighlightsQuery] = useState('');
  const [billingRange, setBillingRange] = useState<'today' | '7d' | '30d'>('7d');
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState<CouponForm>(createDefaultCouponForm());
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [supportOpening, setSupportOpening] = useState(false);
  const [supportSending, setSupportSending] = useState(false);
  const [supportError, setSupportError] = useState<string | null>(null);
  const [supportTicket, setSupportTicket] = useState<SupportTicket | null>(null);
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [supportDraft, setSupportDraft] = useState('');
  const [supportAttachment, setSupportAttachment] = useState<SupportAttachmentDraft | null>(null);
  const [settingsSection, setSettingsSection] = useState<'store' | 'hours' | 'address' | 'delivery' | 'messages' | 'orderMessages' | 'payments' | 'access' | 'sessions'>('store');
  const [marketingSection, setMarketingSection] = useState<'overview' | 'performance' | 'tools' | 'offers' | 'campaigns'>('overview');
  const [marketingReportRange, setMarketingReportRange] = useState<'7d' | '30d' | 'month'>('30d');
  const [marketingQrColor, setMarketingQrColor] = useState('000000');
  const [marketingOfferQuery, setMarketingOfferQuery] = useState('');
  const [marketingOfferDrafts, setMarketingOfferDrafts] = useState<Record<string, { enabled: boolean; offerPrice: string }>>({});
  const [marketingOffersSaving, setMarketingOffersSaving] = useState(false);
  const [showFlyerModal, setShowFlyerModal] = useState(false);
  const [showBioLinkModal, setShowBioLinkModal] = useState(false);
  const [showDeliveryPamphletModal, setShowDeliveryPamphletModal] = useState(false);
  const [deliveryPamphletCouponId, setDeliveryPamphletCouponId] = useState('');
  const [bioLinkMobileTab, setBioLinkMobileTab] = useState<'edit' | 'preview'>('edit');
  const [flyerMobileTab, setFlyerMobileTab] = useState<'edit' | 'preview'>('edit');
  const [flyerHeadline, setFlyerHeadline] = useState('CONFIRA OS PREÃƒâ€¡OS');
  const [flyerThemeKey, setFlyerThemeKey] = useState('dark');
  const [flyerProductQuery, setFlyerProductQuery] = useState('');
  const [flyerSelectedProductIds, setFlyerSelectedProductIds] = useState<string[]>([]);
  const [bioLinkSettings, setBioLinkSettings] = useState<BioLinkSettings>(createDefaultBioLinkSettings());
  const [settingsDraft, setSettingsDraft] = useState<RestaurantForm | null>(null);
  const [settingsDeliveryEta, setSettingsDeliveryEta] = useState('45-60 min');
  const [settingsMessageTemplate, setSettingsMessageTemplate] = useState('Ola, gostaria de fazer um pedido pelo catalogo!');
  const [settingsMessageAiLoading, setSettingsMessageAiLoading] = useState<null | 'generate' | 'improve' | 'config'>(null);
  const [settingsMessageAiTips, setSettingsMessageAiTips] = useState<string[]>([]);
  const [settingsMessageAiTone, setSettingsMessageAiTone] = useState('');
  const [settingsOrderPreparingMessage, setSettingsOrderPreparingMessage] = useState(
    'Ola, {nome} Seu pedido Nº {id}, esta sendo Preparado\n\nItems:\n {itens}\nObs. {obs}\n\nTotal: {total}\nForma Pag: {pagamento}\nEndereco: {endereco}'
  );
  const [settingsOrderOutForDeliveryMessage, setSettingsOrderOutForDeliveryMessage] = useState(
    'Ola, {nome} Seu pedido Nº {id}, Saiu para a Entrega!\n\nItems:\n {itens}\nObs. {obs}\n\nTotal: {total}\nForma Pag: {pagamento}\nEndereco: {endereco}'
  );
  const [orderMessagesAiLoading, setOrderMessagesAiLoading] = useState<null | 'preparing-generate' | 'preparing-improve' | 'delivery-generate' | 'delivery-improve' | 'config'>(null);
  const [orderMessagesAiTips, setOrderMessagesAiTips] = useState<string[]>([]);
  const [orderMessagesAiTone, setOrderMessagesAiTone] = useState('');
  const [settingsPaymentMethods, setSettingsPaymentMethods] = useState<SettingsPaymentMethods>({
    money: true,
    card: true,
    pix: true
  });
  const [settingsPixInstructions, setSettingsPixInstructions] = useState(
    'Chave PIX: 12.345.678/0001-90 (CNPJ). Envie o comprovante no WhatsApp.'
  );
  const [banners, setBanners] = useState<RestaurantBanner[]>([]);
  const [masterPanelUsers, setMasterPanelUsers] = useState<MasterPanelUserRow[]>([]);
  const [masterSessions, setMasterSessions] = useState<MasterActiveSessionRow[]>([]);
  const [masterSecurityLoading, setMasterSecurityLoading] = useState(false);
  const [masterSecurityError, setMasterSecurityError] = useState<string | null>(null);
  const [masterUserForm, setMasterUserForm] = useState<{
    id: string | null;
    name: string;
    email: string;
    role: 'gerente' | 'atendente' | 'cozinha';
    status: 'Ativo' | 'Inativo';
    password: string;
    permissions: TabKey[];
  }>({
    id: null,
    name: '',
    email: '',
    role: 'atendente',
    status: 'Ativo',
    password: '',
    permissions: ['dashboard', 'orders', 'clients', 'promotions', 'support']
  });
  const [masterUserSaving, setMasterUserSaving] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<BannerForm>(createDefaultBannerForm());
  const [bannerProductQuery, setBannerProductQuery] = useState('');
  const [marketingCampaigns, setMarketingCampaigns] = useState<RestaurantMarketingCampaign[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignForm>(createDefaultCampaignForm());
  const [campaignAiLoading, setCampaignAiLoading] = useState(false);
  const [campaignAiSuggestion, setCampaignAiSuggestion] = useState<AiCampaignSuggestion | null>(null);
  const [salesAiLoading, setSalesAiLoading] = useState(false);
  const [salesAiAnalysis, setSalesAiAnalysis] = useState<AiSalesAnalysis | null>(null);
  const [adsAiLoading, setAdsAiLoading] = useState(false);
  const [adsAiPlan, setAdsAiPlan] = useState<AiAdsAssistantPlan | null>(null);
  const [adsAiHistory, setAdsAiHistory] = useState<AdsAiHistoryItem[]>([]);
  const [settingsHours, setSettingsHours] = useState<WeeklyHours[]>([
    { id: 'mon', label: 'Segunda', enabled: true, open: '18:00', close: '23:00' },
    { id: 'tue', label: 'Terca', enabled: true, open: '18:00', close: '23:00' },
    { id: 'wed', label: 'Quarta', enabled: true, open: '18:00', close: '23:00' },
    { id: 'thu', label: 'Quinta', enabled: true, open: '18:00', close: '23:00' },
    { id: 'fri', label: 'Sexta', enabled: true, open: '18:00', close: '00:00' },
    { id: 'sat', label: 'Sabado', enabled: true, open: '18:00', close: '00:00' },
    { id: 'sun', label: 'Domingo', enabled: true, open: '18:00', close: '23:00' }
  ]);
  const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([]);
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary | null>(null);
  const [plansLoading, setPlansLoading] = useState(false);
  const [planCheckoutLoadingId, setPlanCheckoutLoadingId] = useState<string | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const ordersHydratedRef = useRef(false);

  const [newCategory, setNewCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryFormActive, setCategoryFormActive] = useState(true);
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryDeletingId, setCategoryDeletingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<MenuProductForm>(createDefaultProductForm());
  const [productAiLoadingMode, setProductAiLoadingMode] = useState<null | 'generate' | 'improve'>(null);
  const [acaiDraftItemByGroup, setAcaiDraftItemByGroup] = useState<
    Record<string, { name: string; price: string; maxQty: string }>
  >({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const weekDayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  const weekSalesData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      const dayKey = getLocalDateKey(day);

      const totalDaySales = orders.reduce((sum, order) => {
        const createdAt = new Date(order.createdAt);
        if (Number.isNaN(createdAt.getTime())) return sum;
        return getLocalDateKey(createdAt) === dayKey ? sum + (Number(order.total) || 0) : sum;
      }, 0);

      return {
        name: weekDayLabels[day.getDay()],
        vendas: Number(totalDaySales.toFixed(2))
      };
    });
  }, [orders]);

  const restaurantForm = useMemo<RestaurantForm | null>(() => {
    if (!restaurant) return null;
    return {
      name: restaurant.name,
      whatsapp: restaurant.whatsapp,
      openingHours: restaurant.openingHours,
      address: restaurant.address,
      city: restaurant.city,
      state: restaurant.state,
      minOrderValue: restaurant.minOrderValue,
      deliveryFee: restaurant.deliveryFee,
      deliveryConfig: normalizeDeliveryConfig(restaurant.deliveryConfig),
      openForOrders: restaurant.openForOrders ?? true,
      logoUrl: restaurant.logoUrl,
      coverUrl: restaurant.coverUrl
    };
  }, [restaurant]);

  useEffect(() => {
    if (!restaurantForm) return;
    setSettingsDraft(restaurantForm);
  }, [restaurantForm]);

  useEffect(() => {
    setAdsAiHistory((restaurant?.adsAiPlansHistory ?? []) as AdsAiHistoryItem[]);
  }, [restaurant?.adsAiPlansHistory]);

  useEffect(() => {
    if (!session) return;
    const key = `pedezap_message_template_${session.restaurantSlug}`;
    const saved = localStorage.getItem(key);
    if (saved) setSettingsMessageTemplate(saved);
    const preparingMessageRaw = localStorage.getItem(`pedezap_order_msg_preparing_${session.restaurantSlug}`);
    const outForDeliveryMessageRaw = localStorage.getItem(`pedezap_order_msg_out_for_delivery_${session.restaurantSlug}`);
    const paymentMethodsRaw = localStorage.getItem(`pedezap_payment_methods_${session.restaurantSlug}`);
    const pixInstructionsRaw = localStorage.getItem(`pedezap_pix_instructions_${session.restaurantSlug}`);
    if (paymentMethodsRaw) {
      try {
        setSettingsPaymentMethods(JSON.parse(paymentMethodsRaw) as SettingsPaymentMethods);
      } catch {}
    }
    if (preparingMessageRaw) setSettingsOrderPreparingMessage(preparingMessageRaw);
    if (outForDeliveryMessageRaw) setSettingsOrderOutForDeliveryMessage(outForDeliveryMessageRaw);
    if (pixInstructionsRaw) setSettingsPixInstructions(pixInstructionsRaw);
  }, [session]);

  useEffect(() => {
    const bootstrap = async () => {
      const response = await fetch('/api/master/session');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success || !payload?.user?.restaurantSlug || !payload?.user?.email) {
        localStorage.removeItem('pedezap_master_session');
        const blockedByAdmin =
          response.status === 403 ||
          String(payload?.message ?? '').toLowerCase().includes('bloqueado');
        router.replace(blockedByAdmin ? '/master/login?blocked=1' : '/master/login');
        return;
      }

      const restoredSession: MasterSession = {
        restaurantSlug: payload.user.restaurantSlug,
        restaurantName: payload.user.restaurantName ?? 'Painel',
        email: payload.user.email,
        userId: payload.user.userId,
        userName: payload.user.userName,
        role: payload.user.role,
        permissions: Array.isArray(payload.user.permissions) ? payload.user.permissions : undefined,
        isOwner: payload.user.isOwner === true
      };
      localStorage.setItem('pedezap_master_session', JSON.stringify(restoredSession));
      setSession(restoredSession);
    };

    bootstrap().finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!session) return;
    setLoadError(null);
    setLoading(true);
    const createTimedFetch = async (url: string) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(url, { signal: controller.signal });
        return await response.json();
      } finally {
        clearTimeout(timer);
      }
    };

    Promise.all([
      createTimedFetch(`/api/master/restaurant/${session.restaurantSlug}`),
      createTimedFetch(`/api/orders?slug=${session.restaurantSlug}`),
      createTimedFetch(`/api/master/customers/${session.restaurantSlug}`),
      createTimedFetch(`/api/master/plans/${session.restaurantSlug}`)
    ])
      .then(([restaurantPayload, ordersPayload, customersPayload, plansPayload]) => {
        if (restaurantPayload?.restaurant) {
          setRestaurant(restaurantPayload.restaurant);
        } else {
          setRestaurant(null);
          setLoadError(restaurantPayload?.message ?? 'Restaurante nao encontrado para esta sessao.');
        }
        if (ordersPayload?.orders) {
          setOrders(ordersPayload.orders);
          knownOrderIdsRef.current = new Set(
            (ordersPayload.orders as Order[]).map((order) => order.id)
          );
          ordersHydratedRef.current = true;
          setLastOrdersRefreshAt(new Date().toISOString());
        }
        if (customersPayload?.customers) setCustomers(customersPayload.customers);
        if (plansPayload?.plans) setAvailablePlans(plansPayload.plans);
        if (plansPayload?.subscription) setSubscriptionSummary(plansPayload.subscription);
      })
      .catch(() => {
        setRestaurant(null);
        setLoadError('Nao foi possivel carregar os dados do painel.');
      })
      .finally(() => setLoading(false));
  }, [session]);

  const refreshOrdersFeed = async (options?: { notifyOnNew?: boolean }) => {
    if (!session) return;
    const response = await fetch(`/api/orders?slug=${session.restaurantSlug}`, {
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.orders) return;

    const incomingOrders = payload.orders as Order[];
    const incomingIds = new Set(incomingOrders.map((order) => order.id));

    if (ordersHydratedRef.current && options?.notifyOnNew) {
      const newReceivedOrders = incomingOrders.filter(
        (order) => !knownOrderIdsRef.current.has(order.id) && order.status === 'Recebido'
      );
      if (newReceivedOrders.length > 0) {
        setNewOrdersAlertCount((prev) => prev + newReceivedOrders.length);
        setMessage(
          `${newReceivedOrders.length} novo(s) pedido(s) recebido(s).`
        );
        playNewOrderAlert();
      }
    }

    knownOrderIdsRef.current = incomingIds;
    ordersHydratedRef.current = true;
    setOrders(incomingOrders);
    setLastOrdersRefreshAt(new Date().toISOString());
  };

  useEffect(() => {
    if (!session || activeTab !== 'orders') return;

    void refreshOrdersFeed({ notifyOnNew: false });
    const interval = setInterval(() => {
      void refreshOrdersFeed({ notifyOnNew: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [session, activeTab]);

  const loadSubscriptionPlans = async (silent = false) => {
    if (!session) return;
    if (!silent) setPlansLoading(true);
    const response = await fetch(`/api/master/plans/${session.restaurantSlug}`);
    const payload = await response.json().catch(() => null);
    if (payload?.plans) setAvailablePlans(payload.plans);
    if (payload?.subscription) setSubscriptionSummary(payload.subscription);
    if (!silent) setPlansLoading(false);
  };

  useEffect(() => {
    if (activeTab !== 'plans') return;
    loadSubscriptionPlans();
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const checkoutStatus = params.get('checkout');
    const externalId = params.get('externalId');
    if (!session || !checkoutStatus) return;

    if (checkoutStatus === 'cancel') {
      setActiveTab('plans');
      setMessage('Contratacao cancelada. Escolha um plano para tentar novamente.');
      router.replace('/master');
      return;
    }

    if (checkoutStatus !== 'success') return;
    setActiveTab('plans');

    fetch(`/api/master/plans/${session.restaurantSlug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ externalId: externalId || undefined })
    })
      .then((response) => response.json().catch(() => null))
      .then((payload) => {
        if (payload?.success) {
          setMessage('Pagamento confirmado e assinatura ativada.');
          loadSubscriptionPlans(true);
        }
      })
      .finally(() => {
        router.replace('/master');
      });
  }, [session, router]);

  useEffect(() => {
    if (!session || subscriptionSummary?.status !== 'pending_payment') return;
    const interval = setInterval(() => {
      loadSubscriptionPlans(true);
    }, 7000);
    return () => clearInterval(interval);
  }, [session, subscriptionSummary?.status]);

  useEffect(() => {
    if (!restaurant || selectedCategoryId) return;
    setSelectedCategoryId(restaurant.categories[0]?.id ?? null);
  }, [restaurant, selectedCategoryId]);

  useEffect(() => {
    setBanners(restaurant?.banners ?? []);
  }, [restaurant?.banners]);

  useEffect(() => {
    setMarketingCampaigns(restaurant?.marketingCampaigns ?? []);
  }, [restaurant?.marketingCampaigns]);

  useEffect(() => {
    const nextDrafts: Record<string, { enabled: boolean; offerPrice: string }> = {};
    (restaurant?.products ?? []).forEach((product) => {
      nextDrafts[product.id] = {
        enabled: Boolean(product.offerEnabled),
        offerPrice: product.offerPrice && product.offerPrice > 0 ? String(product.offerPrice) : ''
      };
    });
    setMarketingOfferDrafts(nextDrafts);
  }, [restaurant?.products]);

  useEffect(() => {
    const nextCoupons =
      restaurant?.coupons?.map((coupon) => ({
        id: coupon.id,
        code: coupon.code,
        uses: coupon.uses ?? 0,
        active: coupon.active,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        minOrderValue: coupon.minOrderValue,
        startDate: coupon.startDate ?? '',
        endDate: coupon.endDate ?? '',
        startTime: coupon.startTime ?? '',
        endTime: coupon.endTime ?? ''
      })) ?? [];
    setCoupons(nextCoupons);
  }, [restaurant?.coupons]);

  useEffect(() => {
    if (!restaurant) return;
    setBioLinkSettings({
      ...createDefaultBioLinkSettings(),
      ...(restaurant.bioLink ?? {})
    });
  }, [restaurant]);

  const canManageMasterAccess = useMemo(
    () =>
      session?.isOwner === true ||
      session?.role === 'owner' ||
      session?.role === 'gerente' ||
      (!!session?.email && !!restaurant?.ownerEmail && session.email.toLowerCase() === restaurant.ownerEmail.toLowerCase()),
    [session?.isOwner, session?.role, session?.email, restaurant?.ownerEmail]
  );

  const resetMasterUserForm = () => {
    setMasterUserForm({
      id: null,
      name: '',
      email: '',
      role: 'atendente',
      status: 'Ativo',
      password: '',
      permissions: [...MASTER_ROLE_DEFAULT_PERMISSIONS.atendente]
    });
  };

  const loadMasterPanelUsers = async () => {
    if (!session || !canManageMasterAccess) return;
    setMasterSecurityLoading(true);
    setMasterSecurityError(null);
    const response = await fetch(`/api/master/security/${session.restaurantSlug}/users`, {
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      setMasterSecurityError(payload?.message ?? 'Nao foi possivel carregar acessos do painel.');
      setMasterSecurityLoading(false);
      return;
    }
    setMasterPanelUsers(Array.isArray(payload.users) ? payload.users : []);
    setMasterSecurityLoading(false);
  };

  const loadMasterSessions = async () => {
    if (!session || !canManageMasterAccess) return;
    setMasterSecurityLoading(true);
    setMasterSecurityError(null);
    const response = await fetch(`/api/master/security/${session.restaurantSlug}/sessions`, {
      cache: 'no-store'
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      setMasterSecurityError(payload?.message ?? 'Nao foi possivel carregar sessoes ativas.');
      setMasterSecurityLoading(false);
      return;
    }
    setMasterSessions(Array.isArray(payload.sessions) ? payload.sessions : []);
    setMasterSecurityLoading(false);
  };

  useEffect(() => {
    if (activeTab !== 'settings' || !canManageMasterAccess) return;
    if (settingsSection === 'access') void loadMasterPanelUsers();
    if (settingsSection === 'sessions') void loadMasterSessions();
  }, [activeTab, settingsSection, canManageMasterAccess, session?.restaurantSlug]);

  const applyMasterRolePermissions = (role: 'gerente' | 'atendente' | 'cozinha') => {
    setMasterUserForm((prev) => ({
      ...prev,
      role,
      permissions: [...MASTER_ROLE_DEFAULT_PERMISSIONS[role]]
    }));
  };

  const handleSaveMasterPanelUser = async () => {
    if (!session || !canManageMasterAccess) return;
    if (!masterUserForm.name.trim() || !masterUserForm.email.trim()) {
      setMasterSecurityError('Informe nome e email do usuario.');
      return;
    }
    if (!masterUserForm.id && masterUserForm.password.trim().length < 6) {
      setMasterSecurityError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setMasterUserSaving(true);
    setMasterSecurityError(null);
    const isEdit = Boolean(masterUserForm.id);
    const url = isEdit
      ? `/api/master/security/${session.restaurantSlug}/users/${masterUserForm.id}`
      : `/api/master/security/${session.restaurantSlug}/users`;
    const method = isEdit ? 'PUT' : 'POST';
    const body = {
      name: masterUserForm.name.trim(),
      email: masterUserForm.email.trim(),
      role: masterUserForm.role,
      status: masterUserForm.status,
      password: masterUserForm.password.trim(),
      permissions: masterUserForm.permissions
    };
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    setMasterUserSaving(false);
    if (!response.ok || !payload?.success) {
      setMasterSecurityError(payload?.message ?? 'Nao foi possivel salvar usuario.');
      return;
    }
    setMessage(isEdit ? 'Usuario do painel atualizado.' : 'Usuario do painel criado.');
    resetMasterUserForm();
    void loadMasterPanelUsers();
  };

  const handleEditMasterPanelUser = (user: MasterPanelUserRow) => {
    setMasterSecurityError(null);
    setMasterUserForm({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      password: '',
      permissions: [...user.permissions]
    });
  };

  const handleDeleteMasterPanelUser = async (user: MasterPanelUserRow) => {
    if (!session || !canManageMasterAccess) return;
    if (!confirm(`Remover acesso de ${user.name}?`)) return;
    setMasterSecurityLoading(true);
    setMasterSecurityError(null);
    const response = await fetch(`/api/master/security/${session.restaurantSlug}/users/${user.id}`, {
      method: 'DELETE'
    });
    const payload = await response.json().catch(() => null);
    setMasterSecurityLoading(false);
    if (!response.ok || !payload?.success) {
      setMasterSecurityError(payload?.message ?? 'Nao foi possivel remover usuario.');
      return;
    }
    if (masterUserForm.id === user.id) resetMasterUserForm();
    setMessage('Usuario removido do painel.');
    void loadMasterPanelUsers();
  };

  const handleRevokeMasterSession = async (sessionId: string) => {
    if (!session || !canManageMasterAccess) return;
    const response = await fetch(`/api/master/security/${session.restaurantSlug}/sessions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      setMasterSecurityError(payload?.message ?? 'Nao foi possivel encerrar a sessao.');
      return;
    }
    setMessage('Sessao encerrada com sucesso.');
    void loadMasterSessions();
  };

  async function saveRestaurant(data: RestaurantForm) {
    if (!session) return;
    setSaving(true);
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const payload = await response.json();
    if (payload?.restaurant) {
      setRestaurant(payload.restaurant);
      setMessage('Dados do restaurante atualizados.');
    }
    setSaving(false);
  }

  async function handleStartPlanCheckout(planId: string) {
    if (!session) return;
    setPlanCheckoutLoadingId(planId);
    const response = await fetch(`/api/master/plans/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId })
    });
    const payload = await response.json().catch(() => null);
    setPlanCheckoutLoadingId(null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel iniciar a contratacao.');
      return;
    }
    if (payload?.checkoutUrl) {
      navigateToExternalLink(payload.checkoutUrl);
      return;
    } else {
      alert('Cobranca criada, mas sem URL de checkout retornada pela API.');
    }
    await loadSubscriptionPlans();
  }

  async function saveCategory(category: Partial<RestaurantCategory>) {
    if (!session) return;
    const trimmedName = (category.name ?? '').trim();
    if (trimmedName.length < 2) {
      setCategoryFormError('Digite pelo menos 2 caracteres para o nome da categoria.');
      return;
    }
    const normalizedName = trimmedName.toLowerCase();
    const duplicateCategory = restaurant?.categories.find(
      (item) => item.id !== category.id && item.name.trim().toLowerCase() === normalizedName
    );
    if (duplicateCategory) {
      setCategoryFormError('Ja existe uma categoria com esse nome.');
      return;
    }

    setCategorySaving(true);
    setCategoryFormError(null);
    const previousCategoryIds = new Set(restaurant?.categories.map((item) => item.id) ?? []);
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveCategory',
        data: {
          id: category.id,
          name: trimmedName,
          active: category.active ?? true
        }
      })
    });
    const payload = await response.json().catch(() => null);
    setCategorySaving(false);
    if (!response.ok || !payload?.categories) {
      setCategoryFormError(payload?.message ?? 'Nao foi possivel salvar a categoria.');
      return;
    }
    if (payload?.categories && restaurant) {
      const savedCategory =
        payload.categories.find((item: RestaurantCategory) => item.id === category.id) ??
        payload.categories.find(
          (item: RestaurantCategory) => !previousCategoryIds.has(item.id) && item.name.trim().toLowerCase() === normalizedName
        ) ??
        payload.categories.find((item: RestaurantCategory) => item.name.trim().toLowerCase() === normalizedName) ??
        null;
      setRestaurant({ ...restaurant, categories: payload.categories });
      if (savedCategory?.id) {
        setSelectedCategoryId(savedCategory.id);
        setProductForm((prev) =>
          prev.categoryId
            ? prev
            : {
                ...prev,
                categoryId: savedCategory.id
              }
        );
      }
      setNewCategory('');
      setCategoryFormActive(true);
      setEditingCategoryId(null);
      setShowCategoryForm(false);
      setCategoryFormError(null);
    }
  }

  async function deleteCategory(categoryId: string) {
    if (!session) return;
    if (!restaurant) return;
    if (restaurant.categories.length <= 1) {
      alert('Voce precisa manter pelo menos uma categoria cadastrada.');
      return;
    }
    const category = restaurant.categories.find((item) => item.id === categoryId);
    const relatedProductsCount = restaurant.products.filter((item) => item.categoryId === categoryId).length;
    const confirmMessage =
      relatedProductsCount > 0
        ? `Excluir a categoria "${category?.name ?? 'selecionada'}" tambem vai remover ${relatedProductsCount} produto(s). Deseja continuar?`
        : `Deseja excluir a categoria "${category?.name ?? 'selecionada'}"?`;
    if (!confirm(confirmMessage)) return;

    setCategoryDeletingId(categoryId);
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteCategory', categoryId })
    });
    const payload = await response.json().catch(() => null);
    setCategoryDeletingId(null);
    if (!response.ok || !payload?.categories || !payload?.products) {
      alert(payload?.message ?? 'Nao foi possivel excluir a categoria.');
      return;
    }
    if (payload?.categories && payload?.products && restaurant) {
      const fallbackCategoryId =
        payload.categories.find((item: RestaurantCategory) => item.id === selectedCategoryId)?.id ??
        payload.categories[0]?.id ??
        null;
      setRestaurant({
        ...restaurant,
        categories: payload.categories,
        products: payload.products
      });
      setSelectedCategoryId(fallbackCategoryId);
      setProductForm((prev) => ({
        ...prev,
        categoryId: prev.categoryId === categoryId ? fallbackCategoryId ?? '' : prev.categoryId
      }));
    }
  }

  const editCategory = (category: RestaurantCategory) => {
    setEditingCategoryId(category.id);
    setNewCategory(category.name);
    setCategoryFormActive(category.active);
    setCategoryFormError(null);
    setShowCategoryForm(true);
  };

  const resetCategoryForm = () => {
    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setNewCategory('');
    setCategoryFormActive(true);
    setCategoryFormError(null);
  };

  const openCreateCategoryForm = () => {
    setShowCategoryForm(true);
    setEditingCategoryId(null);
    setNewCategory('');
    setCategoryFormActive(true);
    setCategoryFormError(null);
  };

  async function saveProduct() {
    const isPizzaProduct = productForm.kind === 'pizza';
    const hasPizzaFlavors = productForm.pizzaFlavors.length > 0;
    const parsedFormPrice = parsePriceInput(productForm.draftBasePrice || productForm.price);
    const basePriceForSave = isPizzaProduct
      ? (hasPizzaFlavors
          ? Math.min(...productForm.pizzaFlavors.map((flavor) => parsePriceInput(flavor.price)))
          : 0)
      : parsedFormPrice;

    if (!session) return;
    if (!productForm.name?.trim()) {
      alert('Informe o nome do produto.');
      return;
    }
    if (!productForm.categoryId) {
      alert('Selecione a categoria do produto.');
      return;
    }
    if (!productForm.description?.trim()) {
      alert('Informe a descricao/ingredientes do produto.');
      return;
    }
    if (isPizzaProduct && !hasPizzaFlavors) {
      alert('Adicione pelo menos um sabor para salvar a pizza.');
      return;
    }
    if (!isPizzaProduct && basePriceForSave <= 0) {
      alert('Informe um preco maior que zero para salvar o produto.');
      return;
    }

    const cleanDescription = stripFeaturedTag(productForm.description);
    const normalizedDescription = productForm.featured
      ? `${FEATURED_TAG} ${cleanDescription}`.trim()
      : cleanDescription;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveProduct',
        data: {
          ...productForm,
          description: normalizedDescription,
          price: basePriceForSave,
          active: productForm.active ?? true,
          kind: productForm.kind,
          pizzaFlavors:
            productForm.kind === 'pizza'
              ? productForm.pizzaFlavors.map((flavor) => ({
                  name: flavor.name,
                  ingredients: flavor.ingredients,
                  price: parsePriceInput(flavor.price)
                }))
              : undefined,
          crusts:
            productForm.kind === 'pizza' && productForm.hasStuffedCrust
              ? productForm.crusts.map((crust) => ({
                  name: crust.name,
                  ingredients: crust.ingredients ?? '',
                  price: parsePriceInput(crust.price)
                }))
              : [],
          complements: productForm.complements.map((complement) => ({
            name: complement.name,
            price: parsePriceInput(complement.price)
          })),
          acaiComplementGroups:
            productForm.kind === 'acai'
              ? productForm.acaiComplementGroups.map((group) => ({
                  id: group.id,
                  name: group.name,
                  minSelect: Number(group.minSelect) || 0,
                  maxSelect: Number(group.maxSelect) || 0,
                  items: group.items.map((item) => ({
                    id: item.id,
                    name: item.name,
                    price: parsePriceInput(item.price),
                    maxQty: Number(item.maxQty) || 1
                  }))
                }))
              : []
        }
      })
    });
    const payload = await response.json();
    if (payload?.products && restaurant) {
      setRestaurant({ ...restaurant, products: payload.products });
      setProductForm(createDefaultProductForm(selectedCategoryId ?? ''));
      setShowProductForm(false);
    }
  }

  async function handleProductDescriptionAi(mode: 'generate' | 'improve') {
    if (!session) return;
    if (!productForm.name?.trim()) {
      alert('Informe o nome do produto antes de usar a IA.');
      return;
    }
    setProductAiLoadingMode(mode);
    const categoryName =
      restaurant?.categories.find((category) => category.id === productForm.categoryId)?.name ?? '';
    const ingredients =
      productForm.kind === 'pizza'
        ? []
        : stripFeaturedTag(productForm.description || '')
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean);
    const complements = (productForm.complements ?? [])
      .map((item) => item.name?.trim())
      .filter(Boolean) as string[];
    const flavors = (productForm.pizzaFlavors ?? []).map((flavor) => ({
      name: flavor.name,
      ingredients: flavor.ingredients
    }));
    const response = await fetch('/api/master/ai/product-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: session.restaurantSlug,
        mode,
        product: {
          name: productForm.name,
          kind: productForm.kind,
          categoryName,
          currentDescription: stripFeaturedTag(productForm.description || ''),
          ingredients,
          complements,
          flavors
        }
      })
    });
    const payload = await response.json().catch(() => null);
    setProductAiLoadingMode(null);
    if (!response.ok || !payload?.success || !payload?.text) {
      alert(payload?.message ?? 'Nao foi possivel gerar descricao com IA.');
      return;
    }
    setProductForm((prev) => ({ ...prev, description: String(payload.text).trim() }));
  }

  async function deleteProduct(productId: string) {
    if (!session) return;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'deleteProduct', productId })
    });
    const payload = await response.json();
    if (payload?.products && restaurant) {
      setRestaurant({ ...restaurant, products: payload.products });
    }
  }

  const editProduct = (product: RestaurantProduct) => {
    const pizzaFlavors = Array.isArray(product.pizzaFlavors)
      ? product.pizzaFlavors.map((flavor) => ({
          name: flavor.name,
          ingredients: flavor.ingredients ?? '',
          price: Number(flavor.price) || 0
        }))
      : [];
    const crusts = Array.isArray(product.crusts)
      ? product.crusts.map((crust) => ({
          name: crust.name,
          ingredients: crust.ingredients ?? '',
          price: Number(crust.price) || 0
        }))
      : [];
    const complements = Array.isArray(product.complements)
      ? product.complements.map((complement) => ({
          name: complement.name,
          price: Number(complement.price) || 0
        }))
      : [];
    const acaiComplementGroups = Array.isArray(product.acaiComplementGroups)
      ? product.acaiComplementGroups.map((group) => ({
          id: group.id,
          name: group.name,
          minSelect: Number(group.minSelect) || 0,
          maxSelect: Number(group.maxSelect) || 0,
          items: (group.items ?? []).map((item) => ({
            id: item.id,
            name: item.name,
            price: Number(item.price) || 0,
            maxQty: Number(item.maxQty) || 1
          }))
        }))
      : [];

    setProductForm({
      ...createDefaultProductForm(product.categoryId),
      ...product,
      draftBasePrice: Number(product.price) > 0 ? Number(product.price).toFixed(2).replace('.', ',') : '',
      kind: product.kind ?? 'padrao',
      featured: hasFeaturedTag(product.description),
      description: stripFeaturedTag(product.description),
      pizzaFlavors,
      crusts,
      complements,
      acaiComplementGroups,
      hasStuffedCrust: crusts.length > 0
    });
    setShowProductForm(true);
  };

  const duplicateProduct = async (product: RestaurantProduct) => {
    if (!session) return;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveProduct',
        data: {
          categoryId: product.categoryId,
          name: `${product.name} (Copia)`,
          description: product.description,
          price: product.price,
          offerEnabled: product.offerEnabled ?? false,
          offerPrice: product.offerPrice ?? 0,
          active: product.active,
          imageUrl: product.imageUrl ?? '',
          kind: product.kind ?? 'padrao',
          pizzaFlavors: product.pizzaFlavors ?? [],
          crusts: product.crusts ?? [],
          complements: product.complements ?? [],
          acaiComplementGroups: product.acaiComplementGroups ?? []
        }
      })
    });
    const payload = await response.json();
    if (payload?.products && restaurant) {
      setRestaurant({ ...restaurant, products: payload.products });
    }
  };

  const setProductFeatured = async (product: RestaurantProduct, featured: boolean) => {
    if (!session || !restaurant) return;
    const cleanDescription = stripFeaturedTag(product.description);
    const nextDescription = featured ? `${FEATURED_TAG} ${cleanDescription}`.trim() : cleanDescription;

    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveProduct',
        data: {
          id: product.id,
          categoryId: product.categoryId,
          name: product.name,
          description: nextDescription,
          price: product.price,
          offerEnabled: product.offerEnabled ?? false,
          offerPrice: product.offerPrice ?? 0,
          active: product.active,
          imageUrl: product.imageUrl ?? '',
          kind: product.kind ?? 'padrao',
          pizzaFlavors: product.pizzaFlavors ?? [],
          crusts: product.crusts ?? [],
          complements: product.complements ?? [],
          acaiComplementGroups: product.acaiComplementGroups ?? []
        }
      })
    });
    const payload = await response.json();
    if (payload?.products) {
      setRestaurant({ ...restaurant, products: payload.products });
    }
  };

  const copyLink = () => {
    if (!restaurant) return;
    const link = `pedezap.site/${restaurant.slug}`;
    navigator.clipboard.writeText(link);
    alert('Link copiado!');
  };

  const selectedCategory = restaurant?.categories.find((cat) => cat.id === selectedCategoryId) ?? null;
  const categorySummaries = useMemo(() => {
    if (!restaurant) return [] as Array<RestaurantCategory & { productCount: number }>;
    return restaurant.categories.map((category) => ({
      ...category,
      productCount: restaurant.products.filter((product) => product.categoryId === category.id).length
    }));
  }, [restaurant]);
  const filteredCategorySummaries = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categorySummaries;
    return categorySummaries.filter((category) => category.name.toLowerCase().includes(query));
  }, [categorySearch, categorySummaries]);
  const activeCategoryCount = categorySummaries.filter((category) => category.active).length;
  const availableProductCategories = useMemo(() => {
    if (!restaurant) return [] as RestaurantCategory[];
    const activeCategories = restaurant.categories.filter((category) => category.active);
    if (!productForm.categoryId) return activeCategories;
    const selected = restaurant.categories.find((category) => category.id === productForm.categoryId);
    if (!selected || selected.active || activeCategories.some((category) => category.id === selected.id)) {
      return activeCategories;
    }
    return [...activeCategories, selected];
  }, [restaurant, productForm.categoryId]);
  const filteredProducts = restaurant
    ? restaurant.products.filter((product) => product.categoryId === (selectedCategoryId ?? product.categoryId))
    : [];
  const marketingOfferProducts = useMemo(() => {
    if (!restaurant) return [] as RestaurantProduct[];
    const q = marketingOfferQuery.trim().toLowerCase();
    const base = restaurant.products.filter((product) => product.active);
    if (!q) return base;
    return base.filter((product) => product.name.toLowerCase().includes(q));
  }, [restaurant, marketingOfferQuery]);
  const highlightedProducts = restaurant ? restaurant.products.filter((product) => hasFeaturedTag(product.description)) : [];
  const highlightSearch = highlightsQuery.trim().toLowerCase();
  const availableHighlights = restaurant
    ? restaurant.products.filter(
        (product) =>
          !hasFeaturedTag(product.description) &&
          (!highlightSearch ||
            product.name.toLowerCase().includes(highlightSearch) ||
            stripFeaturedTag(product.description).toLowerCase().includes(highlightSearch))
      )
    : [];
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'orders', label: 'Pedidos', icon: ShoppingBag },
    { id: 'menu', label: 'Cardapio', icon: UtensilsCrossed },
    { id: 'highlights', label: 'Destaques', icon: Star },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'billing', label: 'Faturamento', icon: CreditCard },
    { id: 'promotions', label: 'Promocoes', icon: List },
    { id: 'banners', label: 'Banners', icon: LayoutDashboard },
    { id: 'marketing', label: 'Marketing', icon: MessageSquare },
    { id: 'settings', label: 'Configuracoes', icon: Settings },
    { id: 'plans', label: 'Plano', icon: CreditCard },
    { id: 'support', label: 'Suporte', icon: AlertCircle }
  ] as const;
  const moneyFormatter = useMemo(
    () => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
    []
  );
  const currentSubscribedPlan = useMemo(
    () => availablePlans.find((item) => item.id === subscriptionSummary?.subscribedPlanId) ?? null,
    [availablePlans, subscriptionSummary?.subscribedPlanId]
  );
  const allowedTabsByPlan = useMemo<TabKey[]>(
    () =>
      currentSubscribedPlan?.allowedTabs?.length
        ? currentSubscribedPlan.allowedTabs
        : DEFAULT_PLAN_TABS,
    [currentSubscribedPlan]
  );
  const allowedTabsByRole = useMemo<TabKey[]>(
    () =>
      session?.permissions?.length
        ? session.permissions
        : MASTER_ROLE_DEFAULT_PERMISSIONS[session?.role ?? 'owner'],
    [session?.permissions, session?.role]
  );
  const effectiveAllowedTabs = useMemo<TabKey[]>(
    () => allowedTabsByPlan.filter((tab) => allowedTabsByRole.includes(tab)),
    [allowedTabsByPlan, allowedTabsByRole]
  );
  const navItems = allNavItems.filter((item) => effectiveAllowedTabs.includes(item.id));
  const pageTitle = {
    dashboard: 'Visao Geral',
    menu: 'Gestao de Cardapio',
    highlights: 'Destaques',
    clients: 'Clientes',
    orders: 'Pedidos',
    billing: 'Financeiro',
    promotions: 'Promocoes',
    banners: 'Banners',
    marketing: 'Marketing',
    settings: 'Configuracoes',
    plans: 'Meu Plano',
    support: 'Central de Ajuda'
  }[activeTab];
  const subscriptionStatusLabel = {
    trial: 'Periodo Gratis',
    active: 'Ativo',
    pending_payment: 'Aguardando Pagamento',
    expired: 'Expirado',
    canceled: 'Cancelado'
  }[subscriptionSummary?.status ?? 'expired'];
  const subscriptionStatusTone = {
    trial: 'bg-slate-100 text-slate-800',
    active: 'bg-slate-100 text-slate-900',
    pending_payment: 'bg-slate-100 text-slate-800',
    expired: 'bg-red-100 text-red-700',
    canceled: 'bg-slate-200 text-slate-700'
  }[subscriptionSummary?.status ?? 'expired'];
  useEffect(() => {
    if (!effectiveAllowedTabs.includes(activeTab)) {
      setActiveTab(effectiveAllowedTabs[0] ?? 'dashboard');
    }
  }, [activeTab, effectiveAllowedTabs]);

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const ordersThisMonth = orders.filter((order) => new Date(order.createdAt) >= monthStart);
  const manualOrdersThisMonth = ordersThisMonth.filter((order) => order.source === 'panel');
  const manualOrderMonthlyLimit =
    currentSubscribedPlan?.manualOrderLimitEnabled && currentSubscribedPlan.manualOrderLimitPerMonth
      ? currentSubscribedPlan.manualOrderLimitPerMonth
      : null;
  const hasReachedManualOrderLimit =
    manualOrderMonthlyLimit !== null && manualOrdersThisMonth.length >= manualOrderMonthlyLimit;
  const totalSalesThisMonth = ordersThisMonth.reduce((sum, order) => sum + order.total, 0);
  const totalViews = restaurant?.viewCount ?? 0;
  const conversionRate = totalViews
    ? (ordersThisMonth.length / totalViews) * 100
    : 0;
  const linkDirectPercent = 65;
  const instagramPercent = 25;
  const othersPercent = 10;
  const funnelBars = [
    { label: 'Visualizacoes', value: totalViews, color: 'bg-slate-700' },
    { label: 'Acoes no Carrinho', value: Math.max(0, Math.round(totalViews * 0.35)), color: 'bg-violet-500' },
    { label: 'Pedidos', value: ordersThisMonth.length, color: 'bg-slate-1000' }
  ];
  const productSalesMap = new Map<string, { quantity: number; revenue: number }>();
  ordersThisMonth.forEach((order) => {
    order.items.forEach((item) => {
      const current = productSalesMap.get(item.productId) ?? { quantity: 0, revenue: 0 };
      productSalesMap.set(item.productId, {
        quantity: current.quantity + item.quantity,
        revenue: current.revenue + item.quantity * item.price
      });
    });
  });
  const topProducts = (restaurant?.products ?? [])
    .map((product) => {
      const sales = productSalesMap.get(product.id) ?? { quantity: 0, revenue: 0 };
      return {
        ...product,
        soldQuantity: sales.quantity,
        revenue: sales.revenue
      };
    })
    .sort((a, b) => {
      if (b.soldQuantity !== a.soldQuantity) return b.soldQuantity - a.soldQuantity;
      return b.revenue - a.revenue;
    });
  const leastSoldProducts = [...topProducts].sort((a, b) => a.soldQuantity - b.soldQuantity).slice(0, 4);
  const benchmarkOrdersBase = ordersThisMonth.length > 0 ? ordersThisMonth : orders;
  const benchmarkInsights = useMemo(() => {
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      orders: 0,
      sales: 0,
      avgTicket: 0
    }));
    const weekdays = [
      { key: 0, label: 'Dom', orders: 0, sales: 0 },
      { key: 1, label: 'Seg', orders: 0, sales: 0 },
      { key: 2, label: 'Ter', orders: 0, sales: 0 },
      { key: 3, label: 'Qua', orders: 0, sales: 0 },
      { key: 4, label: 'Qui', orders: 0, sales: 0 },
      { key: 5, label: 'Sex', orders: 0, sales: 0 },
      { key: 6, label: 'Sab', orders: 0, sales: 0 }
    ];

    for (const order of benchmarkOrdersBase) {
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) continue;
      const hour = date.getHours();
      hourly[hour].orders += 1;
      hourly[hour].sales += Number(order.total) || 0;
      const weekday = weekdays[date.getDay()];
      weekday.orders += 1;
      weekday.sales += Number(order.total) || 0;
    }

    const hourlyWithAvg = hourly.map((item) => ({
      ...item,
      avgTicket: item.orders > 0 ? item.sales / item.orders : 0
    }));
    const peakHour = [...hourlyWithAvg].sort((a, b) => {
      if (b.orders !== a.orders) return b.orders - a.orders;
      return b.sales - a.sales;
    })[0];
    const peakHours = [...hourlyWithAvg]
      .filter((item) => item.orders > 0)
      .sort((a, b) => {
        if (b.orders !== a.orders) return b.orders - a.orders;
        return b.sales - a.sales;
      })
      .slice(0, 3);
    const bestWeekday = [...weekdays].sort((a, b) => {
      if (b.orders !== a.orders) return b.orders - a.orders;
      return b.sales - a.sales;
    })[0];
    const weakWindows = hourlyWithAvg
      .filter((item) => item.hour >= 10 && item.hour <= 23)
      .sort((a, b) => {
        if (a.orders !== b.orders) return a.orders - b.orders;
        return a.sales - b.sales;
      })
      .slice(0, 3);

    const dayParts = [
      { label: 'Almoco (11h-14h)', from: 11, to: 14 },
      { label: 'Tarde (15h-17h)', from: 15, to: 17 },
      { label: 'Jantar (18h-22h)', from: 18, to: 22 },
      { label: 'Noite (23h+)', from: 23, to: 23 }
    ].map((part) => {
      const slice = hourlyWithAvg.filter((h) => h.hour >= part.from && h.hour <= part.to);
      const ordersCount = slice.reduce((sum, item) => sum + item.orders, 0);
      const sales = slice.reduce((sum, item) => sum + item.sales, 0);
      return {
        label: part.label,
        orders: ordersCount,
        sales,
        avgTicket: ordersCount > 0 ? sales / ordersCount : 0
      };
    });

    return {
      peakHour,
      peakHours,
      bestWeekday,
      weakWindows,
      dayParts,
      sourceLabel: ordersThisMonth.length > 0 ? 'mes atual' : 'historico'
    };
  }, [benchmarkOrdersBase, ordersThisMonth.length]);
  const marketingReportOrders = useMemo(() => {
    const now = new Date();
    const threshold =
      marketingReportRange === '7d'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : marketingReportRange === '30d'
          ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          : new Date(now.getFullYear(), now.getMonth(), 1);
    return orders.filter((order) => {
      const createdAt = new Date(order.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;
      return createdAt >= threshold;
    });
  }, [orders, marketingReportRange]);
  const marketingReportSummary = useMemo(() => {
    const totalOrders = marketingReportOrders.length;
    const totalSales = marketingReportOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const totalDiscount = marketingReportOrders.reduce((sum, order) => sum + (Number(order.discountValue) || 0), 0);
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    const ordersByPayment = marketingReportOrders.reduce(
      (acc, order) => {
        const key = order.paymentMethod;
        acc[key] = (acc[key] ?? 0) + 1;
        return acc;
      },
      { money: 0, card: 0, pix: 0 } as Record<'money' | 'card' | 'pix', number>
    );
    const productMap = new Map<string, { name: string; qty: number; revenue: number }>();
    marketingReportOrders.forEach((order) => {
      order.items.forEach((item) => {
        const current = productMap.get(item.productId) ?? { name: item.name, qty: 0, revenue: 0 };
        current.qty += item.quantity;
        current.revenue += item.quantity * item.price;
        productMap.set(item.productId, current);
      });
    });
    const topProducts = Array.from(productMap.entries())
      .map(([productId, item]) => ({ productId, ...item }))
      .sort((a, b) => {
        if (b.qty !== a.qty) return b.qty - a.qty;
        return b.revenue - a.revenue;
      })
      .slice(0, 10);
    const dailyMap = new Map<string, { orders: number; sales: number }>();
    marketingReportOrders.forEach((order) => {
      const key = getLocalDateKey(new Date(order.createdAt));
      const current = dailyMap.get(key) ?? { orders: 0, sales: 0 };
      current.orders += 1;
      current.sales += Number(order.total) || 0;
      dailyMap.set(key, current);
    });
    const dailyRows = Array.from(dailyMap.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalOrders,
      totalSales,
      totalDiscount,
      avgTicket,
      ordersByPayment,
      topProducts,
      dailyRows
    };
  }, [marketingReportOrders]);

  const downloadCsvFile = (filename: string, rows: string[][]) => {
    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const exportMarketingOrdersReportCsv = () => {
    const rows: string[][] = [
      ['Pedido', 'Data', 'Cliente', 'Pagamento', 'Status', 'Subtotal', 'Taxa', 'Desconto', 'Total', 'Cupom', 'Origem']
    ];
    marketingReportOrders.forEach((order) => {
      rows.push([
        order.id,
        new Date(order.createdAt).toLocaleString('pt-BR'),
        order.customerName,
        order.paymentMethod,
        order.status,
        order.subtotal.toFixed(2),
        order.deliveryFee.toFixed(2),
        String(order.discountValue ?? 0),
        order.total.toFixed(2),
        order.couponCode ?? '',
        order.source ?? 'catalog'
      ]);
    });
    downloadCsvFile(`relatorio-pedidos-${marketingReportRange}.csv`, rows);
  };

  const exportMarketingProductsReportCsv = () => {
    const rows: string[][] = [['Produto', 'Qtd Vendida', 'Receita']];
    marketingReportSummary.topProducts.forEach((item) => {
      rows.push([item.name, String(item.qty), item.revenue.toFixed(2)]);
    });
    downloadCsvFile(`relatorio-produtos-${marketingReportRange}.csv`, rows);
  };

  const escapeVcardValue = (value: string) =>
    value
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/,/g, '\\,')
      .replace(/;/g, '\\;');

  const normalizePhoneForContacts = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('55')) return `+${digits}`;
    if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
    return `+${digits}`;
  };

  const exportCustomersVcf = () => {
    if (!allCustomers.length) return;
    const contacts = allCustomers
      .map((customer) => {
        const phone = normalizePhoneForContacts(customer.whatsapp);
        if (!phone) return null;
        const safeName = customer.name.trim() || 'Cliente';
        const note = `Total de pedidos: ${customer.totalOrders}`;
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${escapeVcardValue(safeName)}`,
          `TEL;TYPE=CELL:${phone}`,
          `NOTE:${escapeVcardValue(note)}`,
          'END:VCARD'
        ].join('\n');
      })
      .filter((item): item is string => Boolean(item));

    if (!contacts.length) return;

    const fileName = `clientes-${session?.restaurantSlug ?? 'base'}-${new Date().toISOString().slice(0, 10)}.vcf`;
    const blob = new Blob([contacts.join('\n')], { type: 'text/vcard;charset=utf-8;' });
    triggerDownloadFromBlob(blob, fileName);
  };
  const marketingLink = restaurant ? `https://pedezap.site/${restaurant.slug}` : '';
  const bioLinkPublicUrl = restaurant ? `https://pedezap.site/r/${restaurant.slug}/bio` : '';
  const flyerLogoUrl = settingsDraft?.logoUrl || restaurant?.logoUrl || '';
  const bioPreviewCoverUrl = restaurant?.coverUrl || 'https://picsum.photos/seed/pedezap-bio-cover/900/500';
  const bioPreviewLogoUrl = restaurant?.logoUrl || '';
  const bioPreviewCardClass =
    bioLinkSettings.appearance === 'light'
      ? 'bg-white text-slate-900'
      : bioLinkSettings.appearance === 'brand'
        ? 'bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white'
        : 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white';
  const bioPreviewMutedClass = bioLinkSettings.appearance === 'light' ? 'text-slate-500' : 'text-white/75';
  const bioPreviewLinkBaseClass =
    bioLinkSettings.appearance === 'light'
      ? 'border border-slate-200 bg-slate-50 text-slate-900'
      : 'border border-white/20 bg-white/10 text-white';
  const bioWhatsAppHref = bioLinkSettings.whatsappValue.includes('http')
    ? bioLinkSettings.whatsappValue
    : `https://wa.me/${bioLinkSettings.whatsappValue.replace(/\D/g, '')}`;
  const bioInstagramHref = bioLinkSettings.instagramValue.includes('http')
    ? bioLinkSettings.instagramValue
    : `https://instagram.com/${bioLinkSettings.instagramValue.replace('@', '')}`;
  const bioCustomHref = normalizeExternalUrl(bioLinkSettings.customUrl);
  const canUseWhatsApp = bioLinkSettings.whatsappEnabled && bioLinkSettings.whatsappValue.replace(/\D/g, '').length >= 10;
  const canUseInstagram = bioLinkSettings.instagramEnabled && bioLinkSettings.instagramValue.trim().length > 0;
  const canUseCustomLink = bioLinkSettings.customEnabled && bioCustomHref.length > 0;
  const marketingTopProductsForFlyer = useMemo(() => {
    const withSales = topProducts.filter((item) => item.soldQuantity > 0).slice(0, 6);
    if (withSales.length > 0) return withSales;
    return topProducts.slice(0, 6);
  }, [topProducts]);
  const flyerThemes: FlyerTheme[] = [
    {
      key: 'dark',
      dotClass: 'bg-yellow-400',
      swatchClass: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800',
      previewClass: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white',
      titleRibbonClass: 'bg-yellow-400 text-slate-900',
      ctaClass: 'bg-white/15 text-white'
    },
    {
      key: 'red',
      dotClass: 'bg-yellow-300',
      swatchClass: 'bg-gradient-to-br from-red-700 to-red-500',
      previewClass: 'bg-gradient-to-br from-red-700 to-red-500 text-white',
      titleRibbonClass: 'bg-yellow-300 text-red-900',
      ctaClass: 'bg-white/15 text-white'
    },
    {
      key: 'green',
      dotClass: 'bg-gray-100',
      swatchClass: 'bg-gradient-to-br from-emerald-600 to-teal-500',
      previewClass: 'bg-gradient-to-br from-emerald-600 to-teal-500 text-white',
      titleRibbonClass: 'bg-white text-emerald-700',
      ctaClass: 'bg-white/15 text-white'
    },
    {
      key: 'orange',
      dotClass: 'bg-gray-100',
      swatchClass: 'bg-gradient-to-br from-orange-500 to-amber-400',
      previewClass: 'bg-gradient-to-br from-orange-500 to-amber-400 text-white',
      titleRibbonClass: 'bg-white text-orange-700',
      ctaClass: 'bg-white/15 text-white'
    }
  ];
  const activeFlyerTheme = flyerThemes.find((theme) => theme.key === flyerThemeKey) ?? flyerThemes[0];
  const flyerProductsSource = useMemo(() => {
    if (!restaurant) return [];
    return restaurant.products.filter((item) => item.active).map((item) => ({
      ...item,
      imageUrl: item.imageUrl || 'https://picsum.photos/seed/pedezap-produto/240/240'
    }));
  }, [restaurant]);
  const flyerFilteredProducts = useMemo(() => {
    const query = flyerProductQuery.trim().toLowerCase();
    if (!query) return flyerProductsSource;
    return flyerProductsSource.filter((item) => item.name.toLowerCase().includes(query));
  }, [flyerProductQuery, flyerProductsSource]);
  const flyerSelectedProducts = useMemo(() => {
    return flyerSelectedProductIds
      .map((id) => flyerProductsSource.find((item) => item.id === id))
      .filter(Boolean)
      .slice(0, 4) as RestaurantProduct[];
  }, [flyerProductsSource, flyerSelectedProductIds]);

  const getOrderAgeMinutes = (createdAt: string) => {
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.round(diffMs / 60000));
  };

  const getOrderStatus = (order: Order): OrderStatus => {
    return order.status ?? 'Recebido';
  };

  const paymentMethodLabel = (method: Order['paymentMethod']) => {
    if (method === 'pix') return 'PIX';
    if (method === 'card') return 'Cartao';
    return 'Dinheiro';
  };

  const openMarketingPrintWindow = (content: string, title: string) => {
    if (typeof window === 'undefined') return;
    const win = window.open('', '_blank', 'width=1024,height=768');
    if (!win) {
      alert('Nao foi possivel abrir a janela. Verifique o bloqueador de pop-up.');
      return;
    }

    win.document.open();
    win.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; background: #f4f6f8; color: #0f172a; }
    .toolbar { position: sticky; top: 0; z-index: 30; background: #ffffff; border-bottom: 1px solid #e2e8f0; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
    .toolbar h1 { margin: 0; font-size: 16px; }
    .toolbar .actions { display: flex; gap: 8px; }
    .btn { border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; color: #334155; padding: 8px 12px; font-size: 13px; cursor: pointer; }
    .btn-primary { border-color: #059669; background: #059669; color: #fff; }
    .page { max-width: 980px; margin: 20px auto; padding: 0 16px 24px; }
    .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
    .hero { background: linear-gradient(135deg, #047857, #10b981); color: #fff; padding: 22px; }
    .hero h2 { margin: 0 0 4px; font-size: 28px; }
    .hero p { margin: 0; opacity: 0.95; }
    .grid { display: grid; gap: 14px; }
    .grid-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .banner { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
    .banner img { width: 100%; height: 150px; object-fit: cover; display: block; }
    .banner .meta { padding: 10px; }
    .banner .meta h4 { margin: 0 0 4px; font-size: 15px; }
    .banner .meta p { margin: 0; color: #475569; font-size: 13px; }
    .section { padding: 18px; }
    .section h3 { margin: 0 0 10px; font-size: 18px; }
    .products { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .product { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; display: flex; gap: 10px; align-items: center; }
    .product img { width: 54px; height: 54px; border-radius: 8px; object-fit: cover; }
    .product .name { margin: 0; font-weight: 700; font-size: 14px; }
    .product .price { margin: 2px 0 0; color: #047857; font-weight: 700; font-size: 14px; }
    .footer { padding: 14px 18px; border-top: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 14px; }
    .qrcode { width: 110px; height: 110px; border: 1px solid #e2e8f0; border-radius: 10px; padding: 6px; background: #fff; }
    .muted { color: #64748b; font-size: 12px; }
    @media print {
      body { background: #fff; }
      .toolbar { display: none; }
      .page { margin: 0; max-width: 100%; padding: 0; display: block; }
      .card { border: none; border-radius: 0; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <h1>${escapeHtml(title)}</h1>
    <div class="actions">
      <button class="btn" onclick="window.close()">Fechar</button>
      <button class="btn btn-primary" onclick="window.print()">Baixar Imagem / PDF</button>
    </div>
  </div>
  ${content}
</body>
</html>`);
    win.document.close();
    win.focus();
  };

  const sanitizeDownloadName = (value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'arquivo';
  };

  const createSvgFromMarkup = (content: string, width: number, height: number) => {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <foreignObject x="0" y="0" width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#ffffff;">
            ${content}
          </div>
        </foreignObject>
      </svg>
    `;
  };

  const toDataUrl = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Falha ao ler arquivo.'));
      };
      reader.onerror = () => reject(new Error('Falha ao converter imagem.'));
      reader.readAsDataURL(blob);
    });

  const fallbackImageDataUrl = 'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
        <rect width="100%" height="100%" fill="#0f172a"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="56" font-family="Arial">Imagem</text>
      </svg>`
    );

  const inlineMarkupImages = async (content: string) => {
    const srcMatches = Array.from(content.matchAll(/src="([^"]+)"/g));
    const uniqueSrc = Array.from(new Set(srcMatches.map((match) => match[1]).filter(Boolean)));
    if (!uniqueSrc.length) return content;

    const replacements = await Promise.all(
      uniqueSrc.map(async (src) => {
        if (src.startsWith('data:')) return { src, dataUrl: src };
        try {
          const response = await fetch(src, { mode: 'cors', credentials: 'omit' });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          const dataUrl = await toDataUrl(blob);
          return { src, dataUrl };
        } catch {
          return { src, dataUrl: fallbackImageDataUrl };
        }
      })
    );

    let next = content;
    replacements.forEach(({ src, dataUrl }) => {
      next = next.replaceAll(`src="${src}"`, `src="${dataUrl}"`);
    });
    return next;
  };

  const triggerDownloadFromBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };

  const roundedRectPath = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  };

  const loadImageForCanvas = async (src: string) => {
    const fallbackSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
        <rect width="100%" height="100%" fill="#0f172a"/>
        <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#94a3b8" font-size="56" font-family="Arial">Imagem</text>
      </svg>`
    )}`;

    const createImage = (url: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.decoding = 'sync';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Falha ao carregar imagem.'));
        img.src = url;
      });

    try {
      if (!src) return await createImage(fallbackSvg);
      const response = await fetch(src, { mode: 'cors', credentials: 'omit' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        const image = await createImage(objectUrl);
        return image;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      return await createImage(fallbackSvg);
    }
  };

  const drawImageRounded = (
    context: CanvasRenderingContext2D,
    image: CanvasImageSource,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    context.save();
    roundedRectPath(context, x, y, width, height, radius);
    context.clip();
    context.drawImage(image, x, y, width, height);
    context.restore();
  };

  const buildHeadlineLayout = (
    context: CanvasRenderingContext2D,
    headline: string,
    maxWidth: number
  ) => {
    const words = headline.trim().split(/\s+/).filter(Boolean);
    let fontSize = 74;
    let lines: string[] = [headline];
    let longestLine = 0;

    const buildLines = (size: number) => {
      context.font = `900 ${size}px Arial`;
      const built: string[] = [];
      let current = '';
      const splitWordByWidth = (word: string) => {
        const chunks: string[] = [];
        let chunk = '';
        for (const char of word) {
          const nextChunk = `${chunk}${char}`;
          if (context.measureText(nextChunk).width <= maxWidth) {
            chunk = nextChunk;
          } else {
            if (chunk) chunks.push(chunk);
            chunk = char;
          }
        }
        if (chunk) chunks.push(chunk);
        return chunks.length ? chunks : [word];
      };
      for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (context.measureText(next).width <= maxWidth) {
          current = next;
        } else if (!current) {
          const chunks = splitWordByWidth(word);
          chunks.forEach((chunk) => built.push(chunk));
        } else {
          built.push(current);
          current = word;
        }
      }
      if (current) built.push(current);
      return built;
    };

    while (fontSize >= 40) {
      lines = buildLines(fontSize);
      longestLine = Math.max(...lines.map((line) => context.measureText(line).width));
      if (lines.length <= 2 && longestLine <= maxWidth) break;
      fontSize -= 4;
    }
    if (lines.length > 2) {
      lines = [lines[0], lines[1]];
    }

    const lineHeight = Math.round(fontSize * 1.05);
    longestLine = Math.max(...lines.map((line) => context.measureText(line).width));
    const paddingX = 34;
    const paddingY = 20;
    const boxWidth = Math.min(maxWidth + paddingX * 2, Math.max(longestLine + paddingX * 2, 360));
    const boxHeight = lineHeight * lines.length + paddingY * 2;

    return { lines, fontSize, lineHeight, boxWidth, boxHeight };
  };

  const drawHeadlineInRibbon = (
    context: CanvasRenderingContext2D,
    headline: string,
    centerX: number,
    topY: number,
    maxWidth: number,
    backgroundColor: string,
    textColor: string
  ) => {
    const layout = buildHeadlineLayout(context, headline, maxWidth);
    const ribbonX = centerX - layout.boxWidth / 2;
    const ribbonY = topY;

    roundedRectPath(context, ribbonX, ribbonY, layout.boxWidth, layout.boxHeight, 26);
    context.fillStyle = backgroundColor;
    context.fill();

    const totalHeight = layout.lineHeight * layout.lines.length;
    let textY = ribbonY + (layout.boxHeight - totalHeight) / 2 + layout.fontSize * 0.82;

    context.textAlign = 'center';
    context.fillStyle = textColor;
    context.font = `900 ${layout.fontSize}px Arial`;
    for (const line of layout.lines) {
      context.fillText(line, centerX, textY);
      textY += layout.lineHeight;
    }
  };

  const downloadMarketingMarkup = async (
    content: string,
    title: string,
    options?: { width?: number; height?: number; allowSvgFallback?: boolean; preferredFormat?: 'png' | 'jpg' }
  ) => {
    if (typeof window === 'undefined') return;
    const width = options?.width ?? 1080;
    const height = options?.height ?? 1920;
    const allowSvgFallback = options?.allowSvgFallback ?? true;
    const preferredFormat = options?.preferredFormat ?? 'png';
    const safeName = sanitizeDownloadName(title);
    const contentWithInlineImages = await inlineMarkupImages(content);
    const svgMarkup = createSvgFromMarkup(contentWithInlineImages, width, height);
    const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });

    try {
      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();
      image.decoding = 'sync';

      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        image.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            if (!context) {
              reject(new Error('Nao foi possivel criar contexto do canvas.'));
              return;
            }
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);
            canvas.toBlob((blob) => {
              if (!blob) {
                reject(new Error('Nao foi possivel gerar imagem.'));
                return;
              }
              resolve(blob);
            }, preferredFormat === 'jpg' ? 'image/jpeg' : 'image/png', preferredFormat === 'jpg' ? 0.95 : undefined);
          } catch (error) {
            reject(error instanceof Error ? error : new Error('Falha ao renderizar imagem.'));
          } finally {
            URL.revokeObjectURL(svgUrl);
          }
        };
        image.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          reject(new Error('Nao foi possivel carregar o SVG para converter em PNG.'));
        };
        image.src = svgUrl;
      });

      triggerDownloadFromBlob(imageBlob, `${safeName}.${preferredFormat}`);
      return;
    } catch {
      if (allowSvgFallback) {
        triggerDownloadFromBlob(svgBlob, `${safeName}.svg`);
      } else {
        alert('Nao foi possivel gerar PNG/JPG para este conteudo. Verifique se as imagens do flyer sao locais ou upload da plataforma.');
      }
    }
  };

  const openFlyerOffers = () => {
    if (!restaurant) return;
    const defaults = marketingTopProductsForFlyer.slice(0, 4).map((item) => item.id);
    setFlyerSelectedProductIds(defaults);
    setFlyerProductQuery('');
    setFlyerHeadline('CONFIRA OS PRECOS');
    setFlyerThemeKey('dark');
    setFlyerMobileTab('edit');
    setShowFlyerModal(true);
  };

  const toggleFlyerProduct = (productId: string) => {
    setFlyerSelectedProductIds((prev) => {
      if (prev.includes(productId)) return prev.filter((id) => id !== productId);
      if (prev.length >= 4) return prev;
      return [...prev, productId];
    });
  };

  const buildFlyerPreviewMarkup = () => {
    if (!restaurant) return '';
    const singleProduct = flyerSelectedProducts.length === 1 ? flyerSelectedProducts[0] : null;
    const logoMarkup = flyerLogoUrl
      ? `<img src="${escapeHtml(flyerLogoUrl)}" alt="${escapeHtml(`Logo ${restaurant.name}`)}" style="width:100%;height:100%;object-fit:cover;" />`
      : `<span style="font-size:22px;font-weight:700;color:#fff;">${escapeHtml(restaurant.name.charAt(0).toUpperCase())}</span>`;
    const cardRows =
      flyerSelectedProducts.length > 0
        ? flyerSelectedProducts
            .slice(0, 3)
            .map(
              (product) => `
      <div style="display:flex;align-items:center;gap:10px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.12);border-radius:12px;padding:8px 10px;">
        <img src="${escapeHtml(product.imageUrl || 'https://picsum.photos/seed/pedezap-produto/240/240')}" alt="${escapeHtml(product.name)}" style="width:52px;height:52px;border-radius:10px;object-fit:cover;" />
        <div style="min-width:0;">
          <p style="margin:0;font-size:13px;font-weight:800;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(product.name)}</p>
          <p style="margin:4px 0 0;font-size:13px;font-weight:800;color:#e2e8f0;">${moneyFormatter.format(product.price)}</p>
        </div>
      </div>`
            )
            .join('')
        : `<div style="display:flex;align-items:center;justify-content:center;min-height:150px;border:1px dashed rgba(255,255,255,.35);border-radius:12px;color:#cbd5e1;font-size:12px;font-weight:700;">Selecione produtos no painel ao lado</div>`;

    const previewClass =
      flyerThemeKey === 'red'
        ? 'linear-gradient(140deg, #b91c1c, #ef4444)'
        : flyerThemeKey === 'green'
          ? 'linear-gradient(140deg, #059669, #14b8a6)'
          : flyerThemeKey === 'orange'
            ? 'linear-gradient(140deg, #f97316, #f59e0b)'
            : 'linear-gradient(140deg, #020617, #0f172a)';

    const ribbonBg = flyerThemeKey === 'dark' ? '#facc15' : flyerThemeKey === 'red' ? '#fde047' : '#ffffff';
    const ribbonColor = flyerThemeKey === 'dark' ? '#0f172a' : flyerThemeKey === 'red' ? '#7f1d1d' : '#065f46';
    const singleProductMarkup = singleProduct
      ? (() => {
          const parts = splitPriceParts(singleProduct.price);
          return `
            <div style="margin-top:12px;display:flex;flex-direction:column;align-items:center;gap:10px;">
              <div style="padding:4px;border-radius:14px;background:#ffffff;transform:rotate(-2deg);box-shadow:0 14px 28px rgba(2,6,23,.4);">
                <img src="${escapeHtml(singleProduct.imageUrl || 'https://picsum.photos/seed/pedezap-produto/480/480')}" alt="${escapeHtml(singleProduct.name)}" style="width:170px;height:170px;border-radius:12px;object-fit:cover;" />
              </div>
              <p style="margin:0;text-align:center;font-size:24px;line-height:1.05;font-weight:900;text-transform:uppercase;">${escapeHtml(singleProduct.name)}</p>
              <div style="display:inline-flex;align-items:flex-end;gap:3px;border-radius:14px;background:#facc15;color:#0f172a;padding:8px 12px;font-weight:900;box-shadow:0 8px 20px rgba(250,204,21,.35);">
                <span style="font-size:13px;line-height:1.1;">R$</span>
                <span style="font-size:34px;line-height:.95;">${parts.intPart}</span>
                <span style="font-size:15px;line-height:1.1;">,${parts.decimalPart}</span>
              </div>
            </div>
          `;
        })()
      : '';

    return `
      <main class="page" style="max-width:780px;">
        <section style="position:relative;overflow:hidden;margin:24px auto;max-width:520px;border-radius:18px;padding:22px;background:#eceff4;border:1px solid #d8dee7;">
          <div style="margin:0 auto;width:270px;max-width:100%;border-radius:34px;background:#0f172a;border:2px solid #111827;padding:10px;">
            <div style="overflow:hidden;border-radius:28px;padding:14px 12px;background:${previewClass};color:#fff;min-height:520px;">
              <div style="display:flex;justify-content:center;gap:6px;padding-bottom:8px;">
                <span style="width:6px;height:6px;border-radius:999px;background:rgba(255,255,255,.85);"></span>
                <span style="width:22px;height:6px;border-radius:999px;background:rgba(255,255,255,.7);"></span>
                <span style="width:6px;height:6px;border-radius:999px;background:rgba(255,255,255,.85);"></span>
              </div>
              <div style="text-align:center;margin:4px 0 12px;">
                <div style="margin:0 auto 8px;width:54px;height:54px;border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;">
                  ${logoMarkup}
                </div>
                <p style="margin:0;font-size:10px;font-weight:800;letter-spacing:.15em;opacity:.95;">${escapeHtml(restaurant.name.toUpperCase())}</p>
              </div>
              <div style="margin:0 auto 14px;max-width:220px;background:${ribbonBg};color:${ribbonColor};padding:10px 10px;border-radius:10px;text-align:center;font-size:17px;font-weight:900;line-height:1.1;">
                ${escapeHtml((flyerHeadline || 'CONFIRA NOSSAS OFERTAS').toUpperCase())}
              </div>
              ${singleProduct ? singleProductMarkup : `<div style="display:grid;gap:8px;">${cardRows}</div>`}
              <div style="margin-top:14px;text-align:center;">
                <p style="margin:0 auto 6px;display:inline-flex;padding:5px 12px;border-radius:999px;background:rgba(15,23,42,.8);font-size:10px;font-weight:700;">PECA AGORA PELO LINK</p>
                <p style="margin:0;font-size:10px;opacity:.95;">${escapeHtml(marketingLink.replace('https://', ''))}</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    `;
  };

  const buildFlyerStoryExportMarkup = () => {
    if (!restaurant) return '';
    const singleProduct = flyerSelectedProducts.length === 1 ? flyerSelectedProducts[0] : null;
    const logoMarkup = flyerLogoUrl
      ? `<img src="${escapeHtml(flyerLogoUrl)}" alt="${escapeHtml(`Logo ${restaurant.name}`)}" style="width:100%;height:100%;object-fit:cover;" />`
      : `<span style="font-size:30px;font-weight:900;color:#fff;">${escapeHtml(restaurant.name.charAt(0).toUpperCase())}</span>`;

    const previewClass =
      flyerThemeKey === 'red'
        ? 'linear-gradient(140deg, #b91c1c, #ef4444)'
        : flyerThemeKey === 'green'
          ? 'linear-gradient(140deg, #059669, #14b8a6)'
          : flyerThemeKey === 'orange'
            ? 'linear-gradient(140deg, #f97316, #f59e0b)'
            : 'linear-gradient(140deg, #020617, #0f172a)';

    const ribbonBg = flyerThemeKey === 'dark' ? '#facc15' : flyerThemeKey === 'red' ? '#fde047' : '#ffffff';
    const ribbonColor = flyerThemeKey === 'dark' ? '#0f172a' : flyerThemeKey === 'red' ? '#7f1d1d' : '#065f46';

    const productRows =
      flyerSelectedProducts.length > 0
        ? flyerSelectedProducts
            .slice(0, 3)
            .map(
              (product) => `
                <div style="display:flex;align-items:center;gap:14px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.12);border-radius:20px;padding:14px;">
                  <img src="${escapeHtml(product.imageUrl || '')}" alt="${escapeHtml(product.name)}" style="width:94px;height:94px;border-radius:16px;object-fit:cover;" />
                  <div style="min-width:0;">
                    <p style="margin:0;font-size:34px;font-weight:900;line-height:1.02;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(product.name)}</p>
                    <p style="margin:8px 0 0;font-size:30px;font-weight:900;color:#f8fafc;">${moneyFormatter.format(product.price)}</p>
                  </div>
                </div>
              `
            )
            .join('')
        : `<div style="display:flex;align-items:center;justify-content:center;min-height:360px;border:2px dashed rgba(255,255,255,.35);border-radius:20px;color:#cbd5e1;font-size:30px;font-weight:700;">Selecione produtos</div>`;

    const singleProductMarkup = singleProduct
      ? (() => {
          const parts = splitPriceParts(singleProduct.price);
          return `
            <div style="margin-top:26px;display:flex;flex-direction:column;align-items:center;gap:20px;">
              <div style="padding:7px;border-radius:22px;background:#ffffff;transform:rotate(-2deg);box-shadow:0 20px 35px rgba(2,6,23,.4);">
                <img src="${escapeHtml(singleProduct.imageUrl || '')}" alt="${escapeHtml(singleProduct.name)}" style="width:470px;height:470px;border-radius:18px;object-fit:cover;" />
              </div>
              <p style="margin:0;text-align:center;font-size:66px;line-height:1.02;font-weight:900;text-transform:uppercase;">${escapeHtml(singleProduct.name)}</p>
              <div style="display:inline-flex;align-items:flex-end;gap:5px;border-radius:22px;background:#facc15;color:#0f172a;padding:14px 20px;font-weight:900;box-shadow:0 10px 25px rgba(250,204,21,.35);">
                <span style="font-size:24px;line-height:1.1;">R$</span>
                <span style="font-size:80px;line-height:.95;">${parts.intPart}</span>
                <span style="font-size:36px;line-height:1.1;">,${parts.decimalPart}</span>
              </div>
            </div>
          `;
        })()
      : '';

    return `
      <main style="width:1080px;height:1920px;overflow:hidden;position:relative;background:${previewClass};color:#ffffff;font-family:Arial,sans-serif;">
        <div style="position:absolute;inset:0;opacity:.2;background-image:radial-gradient(rgba(255,255,255,.4) 1px, transparent 1px);background-size:24px 24px;"></div>
        <section style="position:relative;height:100%;display:flex;flex-direction:column;padding:74px 62px 68px;">
          <div style="display:flex;justify-content:center;gap:12px;padding-bottom:16px;">
            <span style="width:10px;height:10px;border-radius:999px;background:rgba(255,255,255,.85);"></span>
            <span style="width:44px;height:10px;border-radius:999px;background:rgba(255,255,255,.7);"></span>
            <span style="width:10px;height:10px;border-radius:999px;background:rgba(255,255,255,.85);"></span>
          </div>
          <div style="text-align:center;margin:8px 0 22px;">
            <div style="margin:0 auto 12px;width:110px;height:110px;border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;">
              ${logoMarkup}
            </div>
            <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:.18em;opacity:.95;">${escapeHtml(restaurant.name.toUpperCase())}</p>
          </div>
          <div style="margin:0 auto 24px;max-width:870px;background:${ribbonBg};color:${ribbonColor};padding:18px;border-radius:16px;text-align:center;font-size:72px;font-weight:900;line-height:1.03;">
            ${escapeHtml((flyerHeadline || 'CONFIRA NOSSAS OFERTAS').toUpperCase())}
          </div>
          ${singleProduct ? singleProductMarkup : `<div style="display:grid;gap:16px;">${productRows}</div>`}
          <div style="margin-top:auto;text-align:center;">
            <p style="margin:0 auto 10px;display:inline-flex;padding:8px 16px;border-radius:999px;background:rgba(15,23,42,.8);font-size:15px;font-weight:700;">PECA AGORA PELO LINK</p>
            <p style="margin:0;font-size:18px;opacity:.95;">${escapeHtml(marketingLink.replace('https://', ''))}</p>
          </div>
        </section>
      </main>
    `;
  };
  const downloadFlyerFromModal = () => {
    if (!restaurant) return;
    const exportFlyerAsCanvas = async () => {
      const width = 1080;
      const height = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) {
        alert('Nao foi possivel gerar imagem do flyer.');
        return;
      }

      const gradients: Record<string, [string, string]> = {
        dark: ['#020617', '#0f172a'],
        red: ['#b91c1c', '#ef4444'],
        green: ['#059669', '#14b8a6'],
        orange: ['#f97316', '#f59e0b']
      };
      const [from, to] = gradients[flyerThemeKey] ?? gradients.dark;
      const bg = context.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, from);
      bg.addColorStop(1, to);
      context.fillStyle = bg;
      context.fillRect(0, 0, width, height);

      context.fillStyle = 'rgba(255,255,255,.08)';
      for (let y = 0; y < height; y += 28) {
        for (let x = 0; x < width; x += 28) {
          context.fillRect(x, y, 2, 2);
        }
      }

      const logoSize = 118;
      const logoX = width / 2 - logoSize / 2;
      const logoY = 106;
      context.save();
      context.beginPath();
      context.arc(width / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      context.fillStyle = 'rgba(255,255,255,.1)';
      context.fill();
      context.clip();
      const logoImg = await loadImageForCanvas(flyerLogoUrl || '');
      context.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
      context.restore();

      context.fillStyle = '#ffffff';
      context.font = '700 26px Arial';
      context.textAlign = 'center';
      context.fillText((restaurant.name || '').toUpperCase(), width / 2, 270);

      const ribbonBg = flyerThemeKey === 'dark' ? '#facc15' : flyerThemeKey === 'red' ? '#fde047' : '#ffffff';
      const ribbonColor = flyerThemeKey === 'dark' ? '#0f172a' : flyerThemeKey === 'red' ? '#7f1d1d' : '#065f46';
      drawHeadlineInRibbon(
        context,
        (flyerHeadline || 'CONFIRA NOSSAS OFERTAS').toUpperCase(),
        width / 2,
        310,
        900,
        ribbonBg,
        ribbonColor
      );

      if (flyerSelectedProducts.length === 1) {
        const product = flyerSelectedProducts[0];
        const image = await loadImageForCanvas(product.imageUrl || '');
        drawImageRounded(context, image, 252, 500, 576, 576, 28);

        context.fillStyle = '#ffffff';
        context.font = '900 72px Arial';
        context.fillText(product.name.toUpperCase(), width / 2, 1160);

        const parts = splitPriceParts(product.price);
        roundedRectPath(context, 340, 1220, 400, 146, 26);
        context.fillStyle = '#facc15';
        context.fill();
        context.fillStyle = '#0f172a';
        context.font = '800 34px Arial';
        context.fillText('R$', 396, 1302);
        context.font = '900 92px Arial';
        context.fillText(parts.intPart, 520, 1312);
        context.font = '900 44px Arial';
        context.fillText(`,${parts.decimalPart}`, 646, 1306);
      } else {
        const products = flyerSelectedProducts.slice(0, 3);
        let y = 500;
        for (const product of products) {
          roundedRectPath(context, 110, y, 860, 184, 22);
          context.fillStyle = 'rgba(255,255,255,.14)';
          context.fill();
          context.strokeStyle = 'rgba(255,255,255,.2)';
          context.stroke();

          const image = await loadImageForCanvas(product.imageUrl || '');
          drawImageRounded(context, image, 138, y + 18, 148, 148, 18);

          context.fillStyle = '#ffffff';
          context.textAlign = 'left';
          context.font = '800 52px Arial';
          context.fillText(product.name, 314, y + 86);
          context.font = '900 46px Arial';
          context.fillStyle = '#f8fafc';
          context.fillText(moneyFormatter.format(product.price), 314, y + 146);
          y += 206;
        }
        context.textAlign = 'center';
      }

      roundedRectPath(context, 315, 1710, 450, 58, 999);
      context.fillStyle = 'rgba(15,23,42,.82)';
      context.fill();
      context.fillStyle = '#ffffff';
      context.font = '700 24px Arial';
      context.fillText('PECA AGORA PELO LINK', width / 2, 1748);
      context.font = '500 24px Arial';
      context.fillText(marketingLink.replace('https://', ''), width / 2, 1800);

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('Nao foi possivel gerar PNG/JPG para este conteudo.');
          return;
        }
        triggerDownloadFromBlob(blob, `${sanitizeDownloadName(`Flyer de Ofertas - ${restaurant.name}`)}.png`);
      }, 'image/png');
    };

    void exportFlyerAsCanvas();
  };

  const openBioLinkBuilder = () => {
    if (!restaurant) return;
    setBioLinkSettings((prev) => ({
      ...createDefaultBioLinkSettings(),
      ...prev,
      whatsappValue: prev.whatsappValue || restaurant.whatsapp
    }));
    setBioLinkMobileTab('edit');
    setShowBioLinkModal(true);
  };

  const saveBioLinkAndPublish = async () => {
    if (!session || !restaurant) return;
    if (bioLinkSettings.whatsappEnabled && bioLinkSettings.whatsappValue.replace(/\D/g, '').length < 10) {
      alert('Preencha um WhatsApp valido para o botao funcionar.');
      return;
    }
    if (bioLinkSettings.instagramEnabled && !bioLinkSettings.instagramValue.trim()) {
      alert('Preencha o Instagram ou desative o botao Instagram.');
      return;
    }
    if (bioLinkSettings.customEnabled && !normalizeExternalUrl(bioLinkSettings.customUrl)) {
      alert('Preencha uma URL valida no link personalizado ou desative esta opcao.');
      return;
    }

    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'saveBioLink',
        data: bioLinkSettings
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel salvar o bio link.');
      return;
    }
    if (payload?.bioLink && restaurant) {
      setRestaurant({ ...restaurant, bioLink: payload.bioLink });
    }
    await fetch(`/api/master/restaurant/${session.restaurantSlug}`, { cache: 'no-store' }).catch(() => null);
    setShowBioLinkModal(false);
    setMessage('Bio link salvo e publicado.');
    const nextUrl = `${bioLinkPublicUrl || marketingLink}?v=${Date.now()}`;
    navigateToExternalLink(nextUrl);
  };

  const openReviewRequestCard = () => {
    if (!restaurant) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(marketingLink)}&color=${marketingQrColor}&bgcolor=ffffff`;
    const content = `
      <main class="page" style="max-width:680px;">
        <section class="card">
          <header class="hero" style="background:linear-gradient(135deg,#0f172a,#1e293b);">
            <h2>${escapeHtml(restaurant.name)}</h2>
            <p>Avalie nossa loja e ajude outros clientes.</p>
          </header>
          <div class="section" style="text-align:center;">
            <p style="margin:0 0 10px;font-size:18px;font-weight:700;">Gostou do atendimento? Deixe 5 estrelas.</p>
            <img class="qrcode" style="width:220px;height:220px;" src="${qrUrl}" alt="QR Code de avaliacao" />
            <p style="margin:10px 0 0;font-size:14px;color:#475569;">Escaneie o QR Code para abrir nosso cardapio e fazer sua avaliacao.</p>
          </div>
        </section>
      </main>
    `;
    void downloadMarketingMarkup(content, `Card de Avaliacao - ${restaurant.name}`, {
      width: 1080,
      height: 1350
    });
  };

  const openDeliveryPamphlet = () => {
    if (!restaurant) return;
    const firstActiveCouponId = activeCoupons[0]?.id ?? '';
    setDeliveryPamphletCouponId(firstActiveCouponId);
    setShowDeliveryPamphletModal(true);
  };

  const downloadDeliveryPamphlet = () => {
    if (!restaurant) return;
    const coupon = selectedDeliveryPamphletCoupon;
    const couponLabel = coupon ? formatCouponDiscount(coupon) : 'SELECIONE UM CUPOM';
    const couponHint = coupon
      ? coupon.minOrderValue > 0
        ? `Em pedidos acima de ${formatMoney(coupon.minOrderValue)}`
        : 'Valido em qualquer pedido'
      : 'Ative um cupom para gerar o panfleto';

    const content = `
      <main class="page" style="max-width:760px;">
        <section style="display:flex;justify-content:center;padding:22px 0;">
          <div style="width:380px;max-width:100%;border:1px dashed #d1d5db;background:#ffffff;border-radius:8px;padding:22px 20px;">
            <div style="text-align:center;color:#ef4444;font-size:36px;line-height:1;">&#10084;</div>
            <h2 style="margin:8px 0 0;text-align:center;font-size:38px;line-height:1.05;font-weight:900;color:#0f172a;">OBRIGADO!</h2>
            <p style="margin:8px 0 14px;text-align:center;font-size:14px;color:#475569;">Esperamos que ame seu pedido.</p>
            <div style="height:1px;background:#e2e8f0;margin:12px 0;"></div>
            <p style="margin:0 0 8px;text-align:center;font-size:11px;font-weight:700;letter-spacing:.08em;color:#64748b;">PARA A SUA PROXIMA COMPRA</p>
            <div style="border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:10px 8px;">
              <p style="margin:0;text-align:center;font-size:28px;font-weight:900;color:#0f172a;line-height:1.1;">${escapeHtml(couponLabel.toUpperCase())}</p>
            </div>
            <p style="margin:10px 0 0;text-align:center;font-size:12px;color:#64748b;">${escapeHtml(couponHint)}</p>
            <p style="margin:20px 0 0;text-align:center;font-size:20px;font-weight:800;color:#0f172a;">${escapeHtml(restaurant.name)}</p>
            <p style="margin:4px 0 0;text-align:center;font-size:11px;color:#94a3b8;">Peca pelo nosso site: ${escapeHtml(marketingLink.replace('https://', ''))}</p>
          </div>
        </section>
      </main>
    `;
    void downloadMarketingMarkup(content, `Panfleto de Entrega - ${restaurant.name}`, {
      width: 1080,
      height: 1350
    });
  };

  const normalizeWhatsapp = (value: string) => value.replace(/\D/g, '');

  const navigateToExternalLink = (url: string) => {
    if (typeof window === 'undefined') return;
    try {
      window.location.assign(url);
    } catch {
      window.location.href = url;
    }
  };

  const playNewOrderAlert = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx =
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).AudioContext ||
        (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.24);
      oscillator.onended = () => {
        void ctx.close().catch(() => undefined);
      };
    } catch {
      // Safari may block audio without interaction; visual alert still appears.
    }
  };

  const buildOrderTemplateMessage = (template: string, order: Order) => {
    const items = order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ');
    const notes = order.items
      .map((item) => item.notes?.trim())
      .filter(Boolean)
      .join(' | ');
    const replacements: Record<string, string> = {
      '{id}': order.id,
      '{nome}': order.customerName,
      '{itens}': items || 'Itens do pedido',
      '{total}': moneyFormatter.format(order.total),
      '{pagamento}': paymentMethodLabel(order.paymentMethod),
      '{endereco}':
        order.fulfillmentType === 'pickup'
          ? restaurant?.address || 'Retirada na loja'
          : order.customerAddress,
      '{obs}': notes || '-'
    };

    return Object.entries(replacements).reduce((text, [key, value]) => {
      return text.replace(new RegExp(key.replace('{', '\\{').replace('}', '\\}'), 'g'), value);
    }, template);
  };

  const openCustomerStatusMessage = (order: Order, nextStatus: 'Em preparo' | 'Concluido') => {
    const phone = normalizeWhatsapp(order.customerWhatsapp);
    if (!phone) return;

    const baseText =
      nextStatus === 'Em preparo'
        ? buildOrderTemplateMessage(settingsOrderPreparingMessage, order)
        : order.fulfillmentType === 'pickup'
          ? `Ola, ${order.customerName} Seu pedido No ${order.id}, esta pronto para Retirada!\n\nItems:\n ${order.items
              .map((item) => `${item.quantity}x ${item.name}`)
              .join(', ')}\nObs. ${order.items
              .map((item) => item.notes?.trim())
              .filter(Boolean)
              .join(' | ') || '-'}\n\nTotal: ${moneyFormatter.format(order.total)}\nForma Pag: ${paymentMethodLabel(order.paymentMethod)}\nRetirada: ${restaurant?.address || 'No balcao da loja'}`
          : buildOrderTemplateMessage(settingsOrderOutForDeliveryMessage, order);
    const pixInstructions =
      order.paymentMethod === 'pix' && settingsPixInstructions.trim()
        ? `\n\nPagamento PIX:\n${settingsPixInstructions.trim()}`
        : '';
    const text = `${baseText}${pixInstructions}`;

    navigateToExternalLink(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`);
  };

  const manualOrderProducts = useMemo(
    () => (restaurant?.products ?? []).filter((product) => product.active),
    [restaurant?.products]
  );

  const manualOrderTotal = useMemo(
    () =>
      manualOrderForm.items.reduce((sum, item) => {
        const product = manualOrderProducts.find((entry) => entry.id === item.productId);
        if (!product) return sum;
        return sum + product.price * item.quantity;
      }, 0),
    [manualOrderForm.items, manualOrderProducts]
  );

  const addItemToManualOrder = () => {
    if (!manualSelectedProductId) return;
    const quantity = Math.max(1, manualSelectedQuantity);
    setManualOrderForm((prev) => {
      const existingIndex = prev.items.findIndex((item) => item.productId === manualSelectedProductId);
      if (existingIndex >= 0) {
        const nextItems = [...prev.items];
        nextItems[existingIndex] = {
          ...nextItems[existingIndex],
          quantity: nextItems[existingIndex].quantity + quantity
        };
        return { ...prev, items: nextItems };
      }
      return {
        ...prev,
        items: [...prev.items, { productId: manualSelectedProductId, quantity }]
      };
    });
  };

  const removeItemFromManualOrder = (productId: string) => {
    setManualOrderForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId)
    }));
  };

  const createManualOrder = async () => {
    if (!session || !restaurant) return;
    if (hasReachedManualOrderLimit) {
      alert('Limite mensal de pedidos manuais atingido para o seu plano.');
      return;
    }
    if (!manualOrderForm.customerName.trim() || !manualOrderForm.customerWhatsapp.trim()) {
      alert('Preencha os dados do cliente.');
      return;
    }
    if (manualOrderForm.fulfillmentType === 'delivery' && !manualOrderForm.customerAddress.trim()) {
      alert('Preencha o endereco para pedidos de entrega.');
      return;
    }
    if (!manualOrderForm.items.length) {
      alert('Adicione pelo menos um item no pedido.');
      return;
    }

    const itemsPayload = manualOrderForm.items
      .map((item) => {
        const product = manualOrderProducts.find((entry) => entry.id === item.productId);
        if (!product) return null;
        return {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: item.quantity
        };
      })
      .filter(Boolean) as Array<{ productId: string; name: string; price: number; quantity: number }>;

    if (!itemsPayload.length) {
      alert('Nao foi possivel montar os itens do pedido.');
      return;
    }

    setCreatingManualOrder(true);
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug: session.restaurantSlug,
        customerName: manualOrderForm.customerName.trim(),
        customerWhatsapp: manualOrderForm.customerWhatsapp.trim(),
        customerAddress:
          manualOrderForm.fulfillmentType === 'pickup'
            ? restaurant.address || 'Retirada na loja'
            : manualOrderForm.customerAddress.trim(),
        fulfillmentType: manualOrderForm.fulfillmentType,
        paymentMethod: manualOrderForm.paymentMethod,
        source: 'panel',
        items: itemsPayload
      })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel criar o pedido manual.');
      setCreatingManualOrder(false);
      return;
    }

    if (payload?.order) {
      setOrders((prev) => [payload.order, ...prev]);
    }
    setShowManualOrderModal(false);
    setManualOrderForm(createDefaultManualOrderForm());
    setManualSelectedProductId('');
    setManualSelectedQuantity(1);
    setCreatingManualOrder(false);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    if (!session) return;
    setUpdatingOrderId(orderId);
    const currentOrder = orders.find((order) => order.id === orderId) ?? null;
    const response = await fetch(`/api/master/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        restaurantSlug: session.restaurantSlug,
        status
      })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.order) {
      setOrders((prev) => prev.map((order) => (order.id === orderId ? payload.order : order)));
      if (currentOrder && (status === 'Em preparo' || status === 'Concluido')) {
        const shouldSend = window.confirm(
          status === 'Em preparo'
            ? 'Enviar mensagem para o cliente informando que o pedido esta em preparo?'
            : payload.order.fulfillmentType === 'pickup'
              ? 'Enviar mensagem para o cliente informando que o pedido esta pronto para retirada?'
              : 'Enviar mensagem para o cliente informando que o pedido saiu para entrega?'
        );
        if (shouldSend) {
          openCustomerStatusMessage(payload.order, status);
        }
      }
    }
    setUpdatingOrderId(null);
  };

  const printOrderTicket = (order: Order) => {
    const itemsHtml = order.items
      .map((item) => {
        const totalItem = item.price * item.quantity;
        const notes = item.notes ? `<div class="item-notes">Obs: ${escapeHtml(item.notes)}</div>` : '';
        return `
          <div class="item-row">
            <div class="item-main">
              <span>${item.quantity}x ${escapeHtml(item.name)}</span>
              <span>R$ ${totalItem.toFixed(2)}</span>
            </div>
            ${notes}
          </div>
        `;
      })
      .join('');

    const paymentLabel =
      order.paymentMethod === 'pix' ? 'PIX' : order.paymentMethod === 'card' ? 'Cartao' : 'Dinheiro';
    const restaurantName = restaurant?.name ?? 'PedeZap';
    const createdAtLabel = new Date(order.createdAt).toLocaleString('pt-BR');

    const printWindow = window.open('', '_blank', 'width=420,height=760');
    if (!printWindow) return;

    printWindow.document.write(`
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8" />
          <title>Comanda #${escapeHtml(order.id)}</title>
          <style>
            body {
              margin: 0;
              font-family: Arial, sans-serif;
              color: #111827;
              padding: 18px;
              font-size: 13px;
            }
            .header {
              text-align: center;
              border-bottom: 1px dashed #9ca3af;
              padding-bottom: 10px;
              margin-bottom: 12px;
            }
            .title {
              font-size: 18px;
              font-weight: 700;
              margin: 0;
            }
            .muted {
              color: #6b7280;
              font-size: 12px;
              margin-top: 4px;
            }
            .section {
              margin-top: 10px;
            }
            .line {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              margin: 4px 0;
            }
            .item-row {
              margin: 8px 0;
              border-bottom: 1px dashed #e5e7eb;
              padding-bottom: 6px;
            }
            .item-main {
              display: flex;
              justify-content: space-between;
              gap: 8px;
              font-weight: 600;
            }
            .item-notes {
              margin-top: 4px;
              font-size: 12px;
              color: #4b5563;
            }
            .totals {
              margin-top: 12px;
              border-top: 1px dashed #9ca3af;
              padding-top: 8px;
            }
            .grand-total {
              font-size: 15px;
              font-weight: 700;
            }
            .footer {
              margin-top: 14px;
              text-align: center;
              color: #6b7280;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">${escapeHtml(restaurantName)}</p>
            <div class="muted">Comanda de Pedido</div>
            <div class="muted">#${escapeHtml(order.id)} - ${escapeHtml(createdAtLabel)}</div>
          </div>

          <div class="section">
            <div class="line"><span><strong>Cliente</strong></span><span>${escapeHtml(order.customerName)}</span></div>
            <div class="line"><span><strong>WhatsApp</strong></span><span>${escapeHtml(order.customerWhatsapp)}</span></div>
            <div class="line"><span><strong>Tipo</strong></span><span>${order.fulfillmentType === 'pickup' ? 'Retirada' : 'Entrega'}</span></div>
            <div class="line"><span><strong>${order.fulfillmentType === 'pickup' ? 'Retirada' : 'Endereco'}</strong></span><span>${escapeHtml(order.customerAddress)}</span></div>
            <div class="line"><span><strong>Pagamento</strong></span><span>${paymentLabel}</span></div>
          </div>

          <div class="section">
            <strong>Itens</strong>
            ${itemsHtml}
          </div>

          <div class="totals">
            <div class="line"><span>Subtotal</span><span>R$ ${order.subtotal.toFixed(2)}</span></div>
            <div class="line"><span>${order.fulfillmentType === 'pickup' ? 'Retirada' : 'Entrega'}</span><span>R$ ${order.deliveryFee.toFixed(2)}</span></div>
            <div class="line grand-total"><span>Total</span><span>R$ ${order.total.toFixed(2)}</span></div>
          </div>

          ${
            order.generalNotes
              ? `<div class="section"><strong>Observacoes</strong><div>${escapeHtml(order.generalNotes)}</div></div>`
              : ''
          }

          <div class="footer">Impresso via Painel PedeZap</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredOrders = orders.filter((order) => {
    const q = ordersQuery.toLowerCase();
    return (
      order.id.toLowerCase().includes(q) ||
      order.customerName.toLowerCase().includes(q) ||
      order.customerWhatsapp.toLowerCase().includes(q)
    );
  });

  const customersByPhone = new Map<string, Customer>();
  customers.forEach((customer) => {
    customersByPhone.set(customer.whatsapp.replace(/\D/g, ''), customer);
  });
  orders.forEach((order) => {
    const phone = order.customerWhatsapp.replace(/\D/g, '');
    if (!phone) return;
    const existing = customersByPhone.get(phone);
    if (existing) return;
    customersByPhone.set(phone, {
      id: `legacy_${phone}`,
      restaurantSlug: order.restaurantSlug,
      name: order.customerName,
      whatsapp: order.customerWhatsapp,
      totalOrders: 1,
      totalSpent: order.total,
      lastOrderAt: order.createdAt,
      createdAt: order.createdAt
    });
  });
  const allCustomers = Array.from(customersByPhone.values()).sort((a, b) =>
    (a.lastOrderAt ?? a.createdAt) < (b.lastOrderAt ?? b.createdAt) ? 1 : -1
  );

  const filteredCustomers = allCustomers.filter((customer) => {
    const q = clientsQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      customer.name.toLowerCase().includes(q) ||
      customer.whatsapp.toLowerCase().includes(q)
    );
  });

  const ordersByStatus = {
    Recebido: filteredOrders.filter((order) => getOrderStatus(order) === 'Recebido'),
    'Em preparo': filteredOrders.filter((order) => getOrderStatus(order) === 'Em preparo'),
    Concluido: filteredOrders.filter((order) => getOrderStatus(order) === 'Concluido')
  } as const;
  const activeDeliveryOrders = filteredOrders.filter(
    (order) => getOrderStatus(order) !== 'Concluido' && (order.fulfillmentType ?? 'delivery') !== 'pickup'
  );
  const faqItems = [
    'Como altero o horario de funcionamento?',
    'Posso pausar a loja temporariamente?',
    'Como crio um cupom de desconto?',
    'Meu cliente pediu reembolso, o que faco?'
  ];
  const tutorialItems = ['Como cadastrar produtos', 'Configurando a impressora', 'Gerenciando entregadores'];

  const formatMoney = (value: number) => {
    return `R$ ${value.toFixed(2)}`;
  };

  const formatShortDate = (value: string) => {
    if (!value) return '';
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  const formatCouponDiscount = (coupon: Coupon) => {
    if (coupon.discountType === 'percent') return `${coupon.discountValue}%`;
    const fixedValue = Number.isInteger(coupon.discountValue) ? coupon.discountValue.toString() : coupon.discountValue.toFixed(2);
    return `R$ ${fixedValue}`;
  };

  const formatCouponValidity = (coupon: Coupon) => {
    if (coupon.startDate && coupon.endDate) {
      return `${formatShortDate(coupon.startDate)} ate ${formatShortDate(coupon.endDate)}`;
    }
    return 'Valido sempre';
  };

  const activeCoupons = useMemo(() => coupons.filter((coupon) => coupon.active), [coupons]);
  const selectedDeliveryPamphletCoupon = useMemo(() => {
    if (!activeCoupons.length) return null;
    return activeCoupons.find((coupon) => coupon.id === deliveryPamphletCouponId) ?? activeCoupons[0];
  }, [activeCoupons, deliveryPamphletCouponId]);

  const openCreateCouponModal = () => {
    setEditingCouponId(null);
    setCouponForm(createDefaultCouponForm());
    setShowCouponForm(true);
  };

  const openEditCouponModal = (coupon: Coupon) => {
    setEditingCouponId(coupon.id);
    setCouponForm(createDefaultCouponForm(coupon));
    setShowCouponForm(true);
  };

  const closeCouponModal = () => {
    setEditingCouponId(null);
    setCouponForm(createDefaultCouponForm());
    setShowCouponForm(false);
  };

  const persistCoupons = async (nextCoupons: Coupon[]) => {
    if (!session) return;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveCoupons', data: nextCoupons })
    });
    const payload = await response.json().catch(() => null);
    if (payload?.coupons) {
      const persistedCoupons = (payload.coupons as Coupon[]).map((coupon) => ({
        ...coupon,
        startDate: coupon.startDate ?? '',
        endDate: coupon.endDate ?? '',
        startTime: coupon.startTime ?? '',
        endTime: coupon.endTime ?? ''
      }));
      setCoupons(persistedCoupons);
      if (restaurant) {
        setRestaurant({ ...restaurant, coupons: persistedCoupons });
      }
    }
  };

  const saveCoupon = async () => {
    const code = couponForm.code.trim().toUpperCase();
    if (!code) return;

    const nextCoupon: Coupon = {
      id: editingCouponId ?? `coupon_${Date.now()}`,
      code,
      uses: editingCouponId ? coupons.find((item) => item.id === editingCouponId)?.uses ?? 0 : 0,
      active: couponForm.active,
      discountType: couponForm.discountType,
      discountValue: Number(couponForm.discountValue) || 0,
      minOrderValue: Number(couponForm.minOrderValue) || 0,
      startDate: couponForm.startDate,
      endDate: couponForm.endDate,
      startTime: couponForm.startTime,
      endTime: couponForm.endTime
    };

    const nextCoupons = editingCouponId
      ? coupons.map((coupon) => (coupon.id === editingCouponId ? nextCoupon : coupon))
      : [nextCoupon, ...coupons];

    setCoupons(nextCoupons);
    await persistCoupons(nextCoupons);

    closeCouponModal();
  };

  const toggleCouponStatus = async (couponId: string) => {
    const nextCoupons = coupons.map((coupon) =>
      coupon.id === couponId ? { ...coupon, active: !coupon.active } : coupon
    );
    setCoupons(nextCoupons);
    await persistCoupons(nextCoupons);
  };

  const removeCoupon = async (couponId: string) => {
    const nextCoupons = coupons.filter((coupon) => coupon.id !== couponId);
    setCoupons(nextCoupons);
    await persistCoupons(nextCoupons);
  };

  const buildOpeningHoursSummary = (hours: WeeklyHours[]) => {
    return hours
      .filter((day) => day.enabled)
      .map((day) => `${day.label} ${day.open}-${day.close}`)
      .join(' | ');
  };

  const updateSettingsHour = (dayId: string, key: 'enabled' | 'open' | 'close', value: boolean | string) => {
    setSettingsHours((prev) =>
      prev.map((day) => (day.id === dayId ? { ...day, [key]: value } : day))
    );
  };

  const availableMessageVars = ['{id}', '{nome}', '{itens}', '{total}', '{pagamento}', '{endereco}', '{obs}'];

  const insertMessageVariable = (variable: string) => {
    setSettingsMessageTemplate((prev) => `${prev} ${variable}`.trim());
  };

  const insertOrderMessageVariable = (
    field: 'preparing' | 'outForDelivery',
    variable: string
  ) => {
    if (field === 'preparing') {
      setSettingsOrderPreparingMessage((prev) => `${prev} ${variable}`.trim());
      return;
    }
    setSettingsOrderOutForDeliveryMessage((prev) => `${prev} ${variable}`.trim());
  };

  const persistMessageTemplate = () => {
    if (!session) return;
    const key = `pedezap_message_template_${session.restaurantSlug}`;
    localStorage.setItem(key, settingsMessageTemplate);
  };

  const persistOrderMessageTemplates = () => {
    if (!session) return;
    localStorage.setItem(`pedezap_order_msg_preparing_${session.restaurantSlug}`, settingsOrderPreparingMessage);
    localStorage.setItem(`pedezap_order_msg_out_for_delivery_${session.restaurantSlug}`, settingsOrderOutForDeliveryMessage);
  };

  const requestMessageTemplateAi = async (payload: {
    kind: 'catalog_opening' | 'order_preparing' | 'order_out_for_delivery' | 'catalog_config' | 'order_flow_config';
    mode: 'generate' | 'improve' | 'config';
    currentText?: string;
  }) => {
    if (!session || !restaurant) return null;
    const response = await fetch('/api/master/ai/message-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: session.restaurantSlug,
        restaurantName: restaurant.name,
        kind: payload.kind,
        mode: payload.mode,
        currentText: payload.currentText ?? '',
        variables: availableMessageVars
      })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message ?? 'Nao foi possivel gerar mensagem com IA.');
    }
    return data as {
      success: true;
      text?: string;
      configTips?: string[];
      recommendedTone?: string;
      recommendedVariables?: string[];
    };
  };

  const handleCatalogMessageAi = async (mode: 'generate' | 'improve' | 'config') => {
    try {
      setSettingsMessageAiLoading(mode);
      const result = await requestMessageTemplateAi({
        kind: mode === 'config' ? 'catalog_config' : 'catalog_opening',
        mode,
        currentText: settingsMessageTemplate
      });
      if (!result) return;
      if (mode !== 'config' && result.text?.trim()) {
        setSettingsMessageTemplate(result.text.trim());
      }
      setSettingsMessageAiTips(result.configTips ?? []);
      setSettingsMessageAiTone(result.recommendedTone ?? '');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao usar IA.');
    } finally {
      setSettingsMessageAiLoading(null);
    }
  };

  const handleOrderMessageAi = async (
    field: 'preparing' | 'outForDelivery',
    mode: 'generate' | 'improve'
  ) => {
    try {
      setOrderMessagesAiLoading(`${field === 'preparing' ? 'preparing' : 'delivery'}-${mode}` as typeof orderMessagesAiLoading);
      const currentText = field === 'preparing' ? settingsOrderPreparingMessage : settingsOrderOutForDeliveryMessage;
      const result = await requestMessageTemplateAi({
        kind: field === 'preparing' ? 'order_preparing' : 'order_out_for_delivery',
        mode,
        currentText
      });
      if (!result) return;
      if (result.text?.trim()) {
        if (field === 'preparing') setSettingsOrderPreparingMessage(result.text.trim());
        else setSettingsOrderOutForDeliveryMessage(result.text.trim());
      }
      setOrderMessagesAiTips(result.configTips ?? []);
      setOrderMessagesAiTone(result.recommendedTone ?? '');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao usar IA.');
    } finally {
      setOrderMessagesAiLoading(null);
    }
  };

  const handleOrderMessagesConfigAi = async () => {
    try {
      setOrderMessagesAiLoading('config');
      const result = await requestMessageTemplateAi({
        kind: 'order_flow_config',
        mode: 'config',
        currentText: `${settingsOrderPreparingMessage}\n${settingsOrderOutForDeliveryMessage}`
      });
      if (!result) return;
      setOrderMessagesAiTips(result.configTips ?? []);
      setOrderMessagesAiTone(result.recommendedTone ?? '');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Falha ao usar IA.');
    } finally {
      setOrderMessagesAiLoading(null);
    }
  };

  const persistPaymentSettings = () => {
    if (!session) return;
    localStorage.setItem(
      `pedezap_payment_methods_${session.restaurantSlug}`,
      JSON.stringify(settingsPaymentMethods)
    );
    localStorage.setItem(`pedezap_pix_instructions_${session.restaurantSlug}`, settingsPixInstructions);
  };

  const previewMessage = availableMessageVars.reduce(
    (text, variable) =>
      text.replace(
        new RegExp(variable.replace('{', '\\{').replace('}', '\\}'), 'g'),
        {
          '{id}': '#A12B',
          '{nome}': 'Joao',
          '{itens}': '2x X-Burger',
          '{total}': 'R$ 48,00',
          '{pagamento}': 'Pix',
          '{endereco}': 'Rua Central, 123',
          '{obs}': 'Sem cebola'
        }[variable] ?? variable
      ),
    settingsMessageTemplate
  );
  const previewPreparingMessage = buildOrderTemplateMessage(settingsOrderPreparingMessage, {
    id: 'A12B',
    restaurantSlug: session?.restaurantSlug ?? 'rest_demo',
    customerName: 'Joao',
    customerWhatsapp: '11999999999',
    customerAddress: 'Rua Central, 123',
    paymentMethod: 'pix',
    subtotal: 48,
    deliveryFee: 0,
    total: 48,
    createdAt: new Date().toISOString(),
    status: 'Recebido',
    items: [
      {
        productId: 'item_1',
        name: 'X-Burger',
        quantity: 2,
        price: 24,
        notes: 'Sem cebola'
      }
    ]
  });
  const previewOutForDeliveryMessage = buildOrderTemplateMessage(settingsOrderOutForDeliveryMessage, {
    id: 'A12B',
    restaurantSlug: session?.restaurantSlug ?? 'rest_demo',
    customerName: 'Joao',
    customerWhatsapp: '11999999999',
    customerAddress: 'Rua Central, 123',
    paymentMethod: 'pix',
    subtotal: 48,
    deliveryFee: 0,
    total: 48,
    createdAt: new Date().toISOString(),
    status: 'Em preparo',
    items: [
      {
        productId: 'item_1',
        name: 'X-Burger',
        quantity: 2,
        price: 24,
        notes: 'Sem cebola'
      }
    ]
  });

  const loadSupportTicketDetails = async (ticketId: string) => {
    const response = await fetch(`/api/admin/support/tickets/${ticketId}`);
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) return;
    setSupportTicket(payload.ticket);
    setSupportMessages(payload.messages ?? []);
  };

  const ensureSupportTicket = async () => {
    if (!session || !restaurant) return null;
    const sessionEmail = (session.email ?? '').trim().toLowerCase();
    const ownerEmail = (restaurant.ownerEmail ?? '').trim().toLowerCase();
    const requesterEmail = (sessionEmail.includes('@') ? sessionEmail : ownerEmail.includes('@') ? ownerEmail : `${session.restaurantSlug}@pedezap.local`);

    const params = new URLSearchParams();
    params.set('type', 'Parceiro');
    params.set('q', requesterEmail);

    const listResponse = await fetch(`/api/admin/support/tickets?${params.toString()}`);
    const listPayload = await listResponse.json().catch(() => null);
    const existingTickets = (listPayload?.tickets ?? []) as (SupportTicket & { restaurantSlug?: string })[];
    const openTicket =
      existingTickets.find((ticket) => ticket.restaurantSlug === session.restaurantSlug && ticket.status !== 'Fechado') ??
      existingTickets.find((ticket) => ticket.status !== 'Fechado');

    if (openTicket) {
      await loadSupportTicketDetails(openTicket.id);
      return openTicket.id;
    }

    const createResponse = await fetch('/api/admin/support/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: `Atendimento ${restaurant.name}`,
        requesterName: restaurant.name,
        requesterEmail,
        requesterType: 'Parceiro',
        restaurantName: restaurant.name,
        restaurantSlug: session.restaurantSlug,
        category: 'Suporte'
      })
    });
    const createPayload = await createResponse.json().catch(() => null);
    if (!createResponse.ok || !createPayload?.ticket?.id) {
      setSupportError(createPayload?.message ?? 'Nao foi possivel abrir chamado agora. Tente novamente.');
      return null;
    }

    const newTicketId = createPayload.ticket.id as string;
    await loadSupportTicketDetails(newTicketId);
    return newTicketId;
  };

  const openSupportChat = async () => {
    setShowSupportChat(true);
    setSupportOpening(true);
    setSupportError(null);
    const ticketId = await ensureSupportTicket();
    if (!ticketId) {
      setSupportError('Nao foi possivel abrir chamado agora. Tente novamente.');
    }
    setSupportOpening(false);
  };

  const sendSupportMessage = async () => {
    if (!supportTicket || (!supportDraft.trim() && !supportAttachment) || !restaurant) return;
    setSupportSending(true);
    const response = await fetch(`/api/admin/support/tickets/${supportTicket.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: supportDraft.trim(),
        authorName: restaurant.name,
        authorRole: 'customer',
        internal: false,
        attachments: supportAttachment ? [supportAttachment] : []
      })
    });
    const payload = await response.json().catch(() => null);
    if (response.ok && payload?.success) {
      setSupportDraft('');
      setSupportAttachment(null);
      setSupportError(null);
      await loadSupportTicketDetails(supportTicket.id);
    } else {
      setSupportError(payload?.message ?? 'Nao foi possivel enviar sua mensagem.');
    }
    setSupportSending(false);
  };

  const handleSupportAttachmentUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSupportError('Arquivo muito grande. Limite de 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') return;
      setSupportAttachment({
        name: file.name,
        url: result,
        type: file.type || 'application/octet-stream',
        size: file.size
      });
      setSupportError(null);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!showSupportChat || !supportTicket?.id) return;
    const intervalId = setInterval(() => {
      loadSupportTicketDetails(supportTicket.id);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [showSupportChat, supportTicket?.id]);

  const now = new Date();
  const rangeStart = new Date(now);
  if (billingRange === 'today') {
    rangeStart.setHours(0, 0, 0, 0);
  } else if (billingRange === '7d') {
    rangeStart.setDate(rangeStart.getDate() - 6);
    rangeStart.setHours(0, 0, 0, 0);
  } else {
    rangeStart.setDate(rangeStart.getDate() - 29);
    rangeStart.setHours(0, 0, 0, 0);
  }

  const billingOrders = orders.filter((order) => new Date(order.createdAt) >= rangeStart);
  const billingRevenue = billingOrders.reduce((sum, order) => sum + order.total, 0);
  const billingCount = billingOrders.length;
  const ticketMedio = billingCount ? billingRevenue / billingCount : 0;

  const buildDailySeries = () => {
    const days = billingRange === 'today' ? 7 : billingRange === '7d' ? 7 : 30;
    const start = new Date(rangeStart);
    const series = Array.from({ length: days }, (_, idx) => {
      const date = new Date(start);
      date.setDate(start.getDate() + idx);
      const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return { label, value: 0 };
    });
    billingOrders.forEach((order) => {
      const orderDate = new Date(order.createdAt);
      const label = orderDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      const item = series.find((s) => s.label === label);
      if (item) item.value += order.total;
    });
    return series;
  };

  const paymentTotals = billingOrders.reduce(
    (acc, order) => {
      acc[order.paymentMethod] = (acc[order.paymentMethod] ?? 0) + order.total;
      return acc;
    },
    {} as Record<string, number>
  );

  const paymentChart = [
    { name: 'Cartao', value: paymentTotals.card ?? 0, color: '#3b82f6' },
    { name: 'Dinheiro', value: paymentTotals.money ?? 0, color: '#f59e0b' },
    { name: 'Pix', value: paymentTotals.pix ?? 0, color: '#10b981' }
  ];

  const addPizzaFlavor = () => {
    if (!productForm.draftFlavorName || !productForm.draftFlavorPrice) return;
    setProductForm((prev) => ({
      ...(function () {
        const nextFlavors = [
          ...prev.pizzaFlavors,
          {
            name: prev.draftFlavorName.trim(),
            ingredients: (prev.draftFlavorIngredients ?? '').trim(),
            price: parsePriceInput(prev.draftFlavorPrice)
          }
        ];
        const nextBasePrice = nextFlavors.length
          ? Math.min(...nextFlavors.map((flavor) => Number(flavor.price) || 0))
          : 0;
        return {
          ...prev,
          pizzaFlavors: nextFlavors,
          price: nextBasePrice,
          draftFlavorName: '',
          draftFlavorIngredients: '',
          draftFlavorPrice: ''
        };
      })()
    }));
  };

  const removePizzaFlavor = (index: number) => {
    setProductForm((prev) => ({
      ...(function () {
        const nextFlavors = prev.pizzaFlavors.filter((_, idx) => idx !== index);
        const nextBasePrice = nextFlavors.length
          ? Math.min(...nextFlavors.map((flavor) => Number(flavor.price) || 0))
          : 0;
        return {
          ...prev,
          pizzaFlavors: nextFlavors,
          price: nextBasePrice
        };
      })()
    }));
  };

  const addPizzaCrust = () => {
    if (!productForm.draftCrustName) return;
    setProductForm((prev) => ({
      ...prev,
      crusts: [
        ...prev.crusts,
        {
          name: prev.draftCrustName.trim(),
          ingredients: '',
          price: parsePriceInput(prev.draftCrustPrice)
        }
      ],
      draftCrustName: '',
      draftCrustPrice: ''
    }));
  };

  const removePizzaCrust = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      crusts: prev.crusts.filter((_, idx) => idx !== index)
    }));
  };

  const addProductComplement = () => {
    if (!productForm.draftComplementName) return;
    setProductForm((prev) => ({
      ...prev,
      complements: [
        ...prev.complements,
        {
          name: prev.draftComplementName.trim(),
          price: parsePriceInput(prev.draftComplementPrice)
        }
      ],
      draftComplementName: '',
      draftComplementPrice: ''
    }));
  };

  const removeProductComplement = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      complements: prev.complements.filter((_, idx) => idx !== index)
    }));
  };

  const addAcaiComplementGroup = () => {
    const groupName = productForm.draftAcaiGroupName.trim();
    if (!groupName) return;
    const minSelect = Math.max(0, Number(productForm.draftAcaiGroupMinSelect) || 0);
    const maxSelect = Math.max(minSelect, Number(productForm.draftAcaiGroupMaxSelect) || minSelect || 1);
    const groupId = `acai-group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setProductForm((prev) => ({
      ...prev,
      acaiComplementGroups: [
        ...prev.acaiComplementGroups,
        { id: groupId, name: groupName, minSelect, maxSelect, items: [] }
      ],
      draftAcaiGroupName: '',
      draftAcaiGroupMinSelect: '0',
      draftAcaiGroupMaxSelect: '1'
    }));
  };

  const removeAcaiComplementGroup = (groupId: string) => {
    setAcaiDraftItemByGroup((prev) => {
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    setProductForm((prev) => ({
      ...prev,
      acaiComplementGroups: prev.acaiComplementGroups.filter((group) => group.id !== groupId)
    }));
  };

  const addAcaiComplementItem = (groupId: string) => {
    const draft = acaiDraftItemByGroup[groupId];
    const itemName = draft?.name?.trim() ?? '';
    if (!groupId || !itemName) return;
    const itemPrice = Math.max(0, parsePriceInput(draft?.price));
    const itemMaxQty = Math.max(1, Number(draft?.maxQty) || 1);
    const itemId = `acai-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    setProductForm((prev) => ({
      ...prev,
      acaiComplementGroups: prev.acaiComplementGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              items: [...group.items, { id: itemId, name: itemName, price: itemPrice, maxQty: itemMaxQty }]
            }
          : group
      ),
    }));
    setAcaiDraftItemByGroup((prev) => ({
      ...prev,
      [groupId]: { name: '', price: '0', maxQty: '1' }
    }));
  };

  const removeAcaiComplementItem = (groupId: string, itemId: string) => {
    setProductForm((prev) => ({
      ...prev,
      acaiComplementGroups: prev.acaiComplementGroups.map((group) =>
        group.id === groupId ? { ...group, items: group.items.filter((item) => item.id !== itemId) } : group
      )
    }));
  };

  const addAcaiPresetGroup = (name: string, minSelect: number, maxSelect: number) => {
    const groupName = name.trim();
    if (!groupName) return;
    setProductForm((prev) => {
      const alreadyExists = prev.acaiComplementGroups.some(
        (group) => group.name.trim().toLowerCase() === groupName.toLowerCase()
      );
      if (alreadyExists) return prev;
      const groupId = `acai-group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      return {
        ...prev,
        acaiComplementGroups: [
          ...prev.acaiComplementGroups,
          { id: groupId, name: groupName, minSelect: Math.max(0, minSelect), maxSelect: Math.max(minSelect, maxSelect), items: [] }
        ]
      };
    });
  };

  const handleProductImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Selecione um arquivo de imagem valido.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      if (!dataUrl) return;
      setProductForm((prev) => ({ ...prev, imageUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = '';
  };

  const persistBanners = async (nextBanners: RestaurantBanner[]) => {
    if (!session || !restaurant) return false;
    const currentRestaurant = restaurant;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveBanners', data: nextBanners })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel salvar os banners.');
      return false;
    }
    setBanners(payload.banners ?? nextBanners);
    setRestaurant({ ...currentRestaurant, banners: payload.banners ?? nextBanners });
    return true;
  };

  const persistMarketingCampaigns = async (nextCampaigns: RestaurantMarketingCampaign[]) => {
    if (!session || !restaurant) return false;
    const currentRestaurant = restaurant;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveMarketingCampaigns', data: nextCampaigns })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel salvar as campanhas.');
      return false;
    }
    setMarketingCampaigns(payload.marketingCampaigns ?? nextCampaigns);
    setRestaurant({
      ...currentRestaurant,
      marketingCampaigns: payload.marketingCampaigns ?? nextCampaigns
    });
    return true;
  };

  const persistMarketingOffers = async () => {
    if (!session || !restaurant) return false;
    setMarketingOffersSaving(true);
    const payloadItems = restaurant.products.map((product) => {
      const draft = marketingOfferDrafts[product.id];
      const enabled = Boolean(draft?.enabled);
      const offerPrice = parsePriceInput(draft?.offerPrice ?? '0');
      return {
        id: product.id,
        offerEnabled: enabled,
        offerPrice: enabled ? offerPrice : 0
      };
    });

    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveProductOffers', data: payloadItems })
    });
    const payload = await response.json().catch(() => null);
    setMarketingOffersSaving(false);
    if (!response.ok || !payload?.success || !Array.isArray(payload.products)) {
      alert(payload?.message ?? 'Nao foi possivel salvar as ofertas.');
      return false;
    }
    setRestaurant({ ...restaurant, products: payload.products });
    setMessage('Ofertas atualizadas com sucesso.');
    return true;
  };

  const ensureSettingsDeliveryConfig = () => {
    setSettingsDraft((prev) => (prev ? { ...prev, deliveryConfig: normalizeDeliveryConfig(prev.deliveryConfig) } : prev));
  };

  const updateDeliveryConfig = (updater: (current: RestaurantDeliveryConfig) => RestaurantDeliveryConfig) => {
    setSettingsDraft((prev) => {
      if (!prev) return prev;
      const current = normalizeDeliveryConfig(prev.deliveryConfig);
      return { ...prev, deliveryConfig: updater(current) };
    });
  };

  const addDeliveryBand = () => {
    updateDeliveryConfig((current) => ({
      ...current,
      distanceBands: [
        ...current.distanceBands,
        {
          id: `band_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          upToKm: (current.distanceBands.at(-1)?.upToKm ?? 0) + 3,
          fee: current.distanceBands.at(-1)?.fee ?? 0
        }
      ]
    }));
  };

  const updateDeliveryBand = (bandId: string, key: 'upToKm' | 'fee', value: number) => {
    updateDeliveryConfig((current) => ({
      ...current,
      distanceBands: current.distanceBands.map((band) => (band.id === bandId ? { ...band, [key]: value } : band))
    }));
  };

  const removeDeliveryBand = (bandId: string) => {
    updateDeliveryConfig((current) => ({
      ...current,
      distanceBands: current.distanceBands.filter((band) => band.id !== bandId)
    }));
  };

  const addNeighborhoodRate = () => {
    updateDeliveryConfig((current) => ({
      ...current,
      neighborhoodRates: [
        ...current.neighborhoodRates,
        {
          id: `zone_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          name: '',
          fee: current.feeMode === 'neighborhood_fixed' ? current.distanceBands[0]?.fee ?? 0 : 0,
          active: true
        }
      ]
    }));
  };

  const updateNeighborhoodRate = (
    zoneId: string,
    key: 'name' | 'fee' | 'active',
    value: string | number | boolean
  ) => {
    updateDeliveryConfig((current) => ({
      ...current,
      neighborhoodRates: current.neighborhoodRates.map((zone) =>
        zone.id === zoneId ? { ...zone, [key]: value } : zone
      )
    }));
  };

  const removeNeighborhoodRate = (zoneId: string) => {
    updateDeliveryConfig((current) => ({
      ...current,
      neighborhoodRates: current.neighborhoodRates.filter((zone) => zone.id !== zoneId)
    }));
  };

  const persistAdsAiHistory = async (nextHistory: AdsAiHistoryItem[]) => {
    if (!session || !restaurant) return false;
    const response = await fetch(`/api/master/restaurant/${session.restaurantSlug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'saveAdsAiPlansHistory', data: nextHistory })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      alert(payload?.message ?? 'Nao foi possivel salvar historico de ADS IA.');
      return false;
    }
    const persisted = (payload.adsAiPlansHistory ?? nextHistory) as AdsAiHistoryItem[];
    setAdsAiHistory(persisted);
    setRestaurant((prev) => (prev ? { ...prev, adsAiPlansHistory: persisted } : prev));
    return true;
  };

  const applyCampaignAutomation = async (
    campaign: RestaurantMarketingCampaign,
    activate: boolean
  ) => {
    const linkedCouponCodes = new Set(
      (campaign.couponCodes?.length ? campaign.couponCodes : campaign.couponCode ? [campaign.couponCode] : [])
        .map((item) => item.trim().toUpperCase())
        .filter(Boolean)
    );
    if (linkedCouponCodes.size) {
      setCoupons((prev) =>
        prev.map((coupon) =>
          linkedCouponCodes.has(coupon.code.toUpperCase()) ? { ...coupon, active: activate } : coupon
        )
      );
    }

    const linkedBannerIds = new Set((campaign.bannerIds ?? []).filter(Boolean));
    if (!linkedBannerIds.size) return true;

    const nextBanners = banners.map((item) =>
      linkedBannerIds.has(item.id) ? { ...item, active: activate } : item
    );
    return persistBanners(nextBanners);
  };

  const toggleCampaignCouponCode = (couponCode: string) => {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) return;
    setCampaignForm((prev) => {
      const exists = prev.couponCodes.includes(normalized);
      const nextCodes = exists
        ? prev.couponCodes.filter((code) => code !== normalized)
        : [...prev.couponCodes, normalized];
      return {
        ...prev,
        couponCodes: nextCodes,
        couponCode: nextCodes[0] ?? ''
      };
    });
  };

  const toggleCampaignBanner = (bannerId: string) => {
    setCampaignForm((prev) => {
      const exists = prev.bannerIds.includes(bannerId);
      return {
        ...prev,
        bannerIds: exists ? prev.bannerIds.filter((id) => id !== bannerId) : [...prev.bannerIds, bannerId]
      };
    });
  };

  const openCreateCampaignModal = () => {
    setEditingCampaignId(null);
    setCampaignForm(createDefaultCampaignForm());
    setShowCampaignModal(true);
  };

  const openEditCampaignModal = (campaign: RestaurantMarketingCampaign) => {
    setEditingCampaignId(campaign.id);
    setCampaignForm(createDefaultCampaignForm(campaign));
    setShowCampaignModal(true);
  };

  const closeCampaignModal = () => {
    setShowCampaignModal(false);
    setEditingCampaignId(null);
    setCampaignForm(createDefaultCampaignForm());
  };

  const requestAiCampaignSuggestion = async () => {
    if (!session || !restaurant) return;
    setCampaignAiLoading(true);
    const response = await fetch('/api/master/ai/campaign-suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: session.restaurantSlug,
        restaurantName: restaurant.name,
        lessSoldItems: leastSoldProducts.slice(0, 5).map((item) => ({
          name: item.name,
          soldQuantity: item.soldQuantity,
          revenue: item.revenue
        })),
        benchmark: {
          sourceLabel: benchmarkInsights.sourceLabel,
          peakHour: benchmarkInsights.peakHour
            ? { hour: benchmarkInsights.peakHour.hour, orders: benchmarkInsights.peakHour.orders }
            : null,
          bestWeekday: benchmarkInsights.bestWeekday
            ? { label: benchmarkInsights.bestWeekday.label, orders: benchmarkInsights.bestWeekday.orders }
            : null,
          weakWindows: benchmarkInsights.weakWindows.map((w) => ({
            hour: w.hour,
            orders: w.orders,
            sales: w.sales,
            avgTicket: w.avgTicket
          }))
        },
        availableCoupons: coupons.map((coupon) => coupon.code),
        availableBanners: banners.map((banner) => banner.title)
      })
    });
    const payload = await response.json().catch(() => null);
    setCampaignAiLoading(false);
    if (!response.ok || !payload?.success || !payload?.suggestion) {
      alert(payload?.message ?? 'Nao foi possivel gerar sugestao de campanha com IA.');
      return;
    }
    setCampaignAiSuggestion(payload.suggestion as AiCampaignSuggestion);
  };

  const applyAiSuggestionToCampaignForm = () => {
    if (!campaignAiSuggestion) return;
    const couponMatch = coupons.find(
      (coupon) => coupon.code.toUpperCase() === campaignAiSuggestion.couponSuggestion.trim().toUpperCase()
    );
    setEditingCampaignId(null);
    setCampaignForm({
      ...createDefaultCampaignForm(),
      name: campaignAiSuggestion.campaignName,
      period: campaignAiSuggestion.period,
      couponCode: couponMatch?.code ?? '',
      couponCodes: couponMatch?.code ? [couponMatch.code] : []
    });
    setShowCampaignModal(true);
  };

  const requestAiSalesAnalysis = async () => {
    if (!session || !restaurant) return;
    setSalesAiLoading(true);
    const totalOrdersForBenchmark = benchmarkOrdersBase.length;
    const totalSalesForBenchmark = benchmarkOrdersBase.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const avgTicket = totalOrdersForBenchmark > 0 ? totalSalesForBenchmark / totalOrdersForBenchmark : 0;
    const response = await fetch('/api/master/ai/sales-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: session.restaurantSlug,
        restaurantName: restaurant.name,
        metrics: {
          totalOrders: totalOrdersForBenchmark,
          totalSales: totalSalesForBenchmark,
          totalViews,
          conversionRate,
          avgTicket,
          manualOrders: manualOrdersThisMonth.length
        },
        benchmark: {
          sourceLabel: benchmarkInsights.sourceLabel,
          peakHour: benchmarkInsights.peakHour
            ? {
                hour: benchmarkInsights.peakHour.hour,
                orders: benchmarkInsights.peakHour.orders,
                sales: benchmarkInsights.peakHour.sales
              }
            : null,
          bestWeekday: benchmarkInsights.bestWeekday
            ? {
                label: benchmarkInsights.bestWeekday.label,
                orders: benchmarkInsights.bestWeekday.orders,
                sales: benchmarkInsights.bestWeekday.sales
              }
            : null,
          weakWindows: benchmarkInsights.weakWindows
        },
        topProducts: topProducts.slice(0, 5).map((item) => ({
          name: item.name,
          soldQuantity: item.soldQuantity,
          revenue: item.revenue
        })),
        leastSoldProducts: leastSoldProducts.slice(0, 5).map((item) => ({
          name: item.name,
          soldQuantity: item.soldQuantity,
          revenue: item.revenue
        })),
        activeCoupons: coupons.filter((c) => c.active).map((c) => c.code),
        activeCampaigns: marketingCampaigns.filter((c) => c.active).map((c) => c.name)
      })
    });
    const payload = await response.json().catch(() => null);
    setSalesAiLoading(false);
    if (!response.ok || !payload?.success || !payload?.analysis) {
      alert(payload?.message ?? 'Nao foi possivel gerar analise de vendas com IA.');
      return;
    }
    setSalesAiAnalysis(payload.analysis as AiSalesAnalysis);
  };

  const requestAiAdsAssistantPlan = async () => {
    if (!session || !restaurant) return;
    setAdsAiLoading(true);
    const totalOrdersForBenchmark = benchmarkOrdersBase.length;
    const totalSalesForBenchmark = benchmarkOrdersBase.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const avgTicket = totalOrdersForBenchmark > 0 ? totalSalesForBenchmark / totalOrdersForBenchmark : 0;
    const response = await fetch('/api/master/ai/ads-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: session.restaurantSlug,
        restaurantName: restaurant.name,
        city: restaurant.city ?? '',
        state: restaurant.state ?? '',
        marketingLink,
        metrics: {
          totalOrders: totalOrdersForBenchmark,
          totalSales: totalSalesForBenchmark,
          avgTicket,
          conversionRate
        },
        benchmark: {
          sourceLabel: benchmarkInsights.sourceLabel,
          peakHour: benchmarkInsights.peakHour
            ? { hour: benchmarkInsights.peakHour.hour, orders: benchmarkInsights.peakHour.orders }
            : null,
          bestWeekday: benchmarkInsights.bestWeekday
            ? { label: benchmarkInsights.bestWeekday.label, orders: benchmarkInsights.bestWeekday.orders }
            : null,
          weakWindows: benchmarkInsights.weakWindows
        },
        topProducts: topProducts.slice(0, 5).map((item) => ({
          name: item.name,
          soldQuantity: item.soldQuantity,
          revenue: item.revenue
        })),
        leastSoldProducts: leastSoldProducts.slice(0, 5).map((item) => ({
          name: item.name,
          soldQuantity: item.soldQuantity,
          revenue: item.revenue
        })),
        activeCampaigns: marketingCampaigns.filter((c) => c.active).map((c) => c.name)
      })
    });
    const payload = await response.json().catch(() => null);
    setAdsAiLoading(false);
    if (!response.ok || !payload?.success || !payload?.plan) {
      alert(payload?.message ?? 'Nao foi possivel gerar plano de ADS com IA.');
      return;
    }
    const nextPlan = payload.plan as AiAdsAssistantPlan;
    setAdsAiPlan(nextPlan);
    const historyItem: AdsAiHistoryItem = {
      id: `ads_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      ...nextPlan
    };
    const nextHistory = [historyItem, ...adsAiHistory].slice(0, 20);
    setAdsAiHistory(nextHistory);
    void persistAdsAiHistory(nextHistory);
  };

  const applyAdsAiPlanToCampaignForm = () => {
    if (!adsAiPlan) return;
    setEditingCampaignId(null);
    setCampaignForm({
      ...createDefaultCampaignForm(),
      name: adsAiPlan.campaignName?.trim() || `ADS IA - ${adsAiPlan.campaignObjective}`.slice(0, 70),
      period: adsAiPlan.suggestedPeriod?.trim() || '',
      active: false
    });
    setMarketingSection('campaigns');
    setShowCampaignModal(true);
  };

  const applyAdsAiPlanToBannerForm = () => {
    if (!adsAiPlan) return;
    setEditingBannerId(null);
    setBannerForm({
      ...createDefaultBannerForm(),
      title: adsAiPlan.bannerHeadline || adsAiPlan.campaignName,
      description: adsAiPlan.bannerDescription || adsAiPlan.campaignObjective,
      active: false,
      productIds: leastSoldProducts
        .slice(0, 4)
        .map((item) => item.id)
        .filter((id): id is string => Boolean(id))
    });
    setActiveTab('banners');
    setShowBannerModal(true);
  };

  const applyAdsAiPlanToCouponForm = () => {
    if (!adsAiPlan) return;
    const suggestedCode = adsAiPlan.couponSuggestion.trim().toUpperCase();
    const existing = coupons.find((coupon) => coupon.code.toUpperCase() === suggestedCode);

    if (existing) {
      setEditingCouponId(existing.id);
      setCouponForm(createDefaultCouponForm(existing));
      setShowCouponForm(true);
      return;
    }

    const hint = adsAiPlan.couponDiscountHint.toLowerCase();
    const percentMatch = hint.match(/(\d+)\s*%/);
    const moneyMatch = hint.match(/r\$\s*(\d+(?:[.,]\d+)?)/i);
    const minOrderMatch = hint.match(/acima de\s*r\$\s*(\d+(?:[.,]\d+)?)/i);
    const discountType: CouponDiscountType = percentMatch ? 'percent' : 'fixed';
    const discountValue = percentMatch
      ? percentMatch[1]
      : moneyMatch?.[1]?.replace(',', '.') ?? '';
    const minOrderValue = minOrderMatch?.[1]?.replace(',', '.') ?? '0';

    setEditingCouponId(null);
    setCouponForm({
      ...createDefaultCouponForm(),
      code: suggestedCode || `ADS${Math.floor(Math.random() * 90 + 10)}`,
      discountType,
      discountValue,
      minOrderValue,
      active: false
    });
    setShowCouponForm(true);
  };

  const restoreAdsAiPlanFromHistory = (item: AdsAiHistoryItem) => {
    const { id: _id, createdAt: _createdAt, ...plan } = item;
    setAdsAiPlan(plan);
    setMarketingSection('tools');
  };

  const removeAdsAiHistoryItem = async (historyId: string) => {
    const nextHistory = adsAiHistory.filter((item) => item.id !== historyId);
    setAdsAiHistory(nextHistory);
    await persistAdsAiHistory(nextHistory);
  };

  const saveCampaign = async () => {
    if (!campaignForm.name.trim()) {
      alert('Informe o nome da campanha.');
      return;
    }

    const normalizedCouponCodes = Array.from(
      new Set(
        [...campaignForm.couponCodes, campaignForm.couponCode]
          .map((item) => item.trim().toUpperCase())
          .filter(Boolean)
      )
    );
    const normalizedCampaign: RestaurantMarketingCampaign = {
      id: editingCampaignId ?? `mkc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: campaignForm.name.trim(),
      couponCode: normalizedCouponCodes[0] ?? campaignForm.couponCode.trim().toUpperCase(),
      couponCodes: normalizedCouponCodes,
      bannerIds: campaignForm.bannerIds,
      period: campaignForm.period.trim(),
      startDate: campaignForm.startDate,
      endDate: campaignForm.endDate,
      autoActivateByCalendar: campaignForm.autoActivateByCalendar,
      utmSource: campaignForm.utmSource.trim(),
      utmMedium: campaignForm.utmMedium.trim(),
      utmCampaign:
        campaignForm.utmCampaign.trim() ||
        campaignForm.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      utmContent: campaignForm.utmContent.trim(),
      targetCouponCode: normalizedCouponCodes[0] ?? '',
      clicks: marketingCampaigns.find((item) => item.id === editingCampaignId)?.clicks ?? 0,
      attributedOrders:
        marketingCampaigns.find((item) => item.id === editingCampaignId)?.attributedOrders ?? 0,
      lastClickedAt: marketingCampaigns.find((item) => item.id === editingCampaignId)?.lastClickedAt ?? null,
      active: campaignForm.active,
      createdAt:
        marketingCampaigns.find((item) => item.id === editingCampaignId)?.createdAt ?? new Date().toISOString()
    };

    const nextCampaigns = editingCampaignId
      ? marketingCampaigns.map((item) => (item.id === editingCampaignId ? normalizedCampaign : item))
      : [normalizedCampaign, ...marketingCampaigns];

    const ok = await persistMarketingCampaigns(nextCampaigns);
    if (!ok) return;
    if (normalizedCampaign.active) {
      await applyCampaignAutomation(normalizedCampaign, true);
    }
    closeCampaignModal();
    setMessage('Campanhas atualizadas.');
  };

  const toggleCampaignActive = async (campaignId: string) => {
    const current = marketingCampaigns.find((item) => item.id === campaignId);
    if (!current) return;
    const nextActive = !current.active;
    const nextCampaigns = marketingCampaigns.map((item) =>
      item.id === campaignId ? { ...item, active: nextActive } : item
    );
    const ok = await persistMarketingCampaigns(nextCampaigns);
    if (!ok) return;
    await applyCampaignAutomation({ ...current, active: nextActive }, nextActive);
    setMessage('Status da campanha atualizado.');
  };

  const removeCampaign = async (campaignId: string) => {
    const nextCampaigns = marketingCampaigns.filter((item) => item.id !== campaignId);
    const ok = await persistMarketingCampaigns(nextCampaigns);
    if (ok) setMessage('Campanha removida.');
  };

  const openCreateBannerModal = () => {
    setEditingBannerId(null);
    setBannerForm(createDefaultBannerForm());
    setBannerProductQuery('');
    setShowBannerModal(true);
  };

  const openEditBannerModal = (banner: RestaurantBanner) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      title: banner.title,
      description: banner.description,
      imageUrl: banner.imageUrl,
      active: banner.active,
      productIds: banner.productIds ?? [],
      abGroup: banner.abGroup ?? ''
    });
    setBannerProductQuery('');
    setShowBannerModal(true);
  };

  const closeBannerModal = () => {
    setShowBannerModal(false);
    setEditingBannerId(null);
    setBannerForm(createDefaultBannerForm());
    setBannerProductQuery('');
  };

  const toggleBannerProduct = (productId: string) => {
    setBannerForm((prev) => {
      const exists = prev.productIds.includes(productId);
      return {
        ...prev,
        productIds: exists ? prev.productIds.filter((id) => id !== productId) : [...prev.productIds, productId]
      };
    });
  };

  const saveBanner = async () => {
    if (!bannerForm.title.trim() || !bannerForm.imageUrl.trim()) {
      alert('Preencha titulo e imagem do banner.');
      return;
    }

    const normalizedBanner: RestaurantBanner = {
      id: editingBannerId ?? `bnr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title: bannerForm.title.trim(),
      description: bannerForm.description.trim(),
      imageUrl: bannerForm.imageUrl.trim(),
      active: bannerForm.active,
      productIds: bannerForm.productIds,
      abGroup: bannerForm.abGroup ?? '',
      clicks: banners.find((item) => item.id === editingBannerId)?.clicks ?? 0,
      impressions: banners.find((item) => item.id === editingBannerId)?.impressions ?? 0,
      attributedOrders: banners.find((item) => item.id === editingBannerId)?.attributedOrders ?? 0,
      lastClickedAt: banners.find((item) => item.id === editingBannerId)?.lastClickedAt ?? null
    };

    const nextBanners = editingBannerId
      ? banners.map((item) => (item.id === editingBannerId ? normalizedBanner : item))
      : [normalizedBanner, ...banners];

    const ok = await persistBanners(nextBanners);
    if (!ok) return;
    closeBannerModal();
    setMessage('Banners atualizados.');
  };

  const toggleBannerActive = async (bannerId: string) => {
    const nextBanners = banners.map((item) =>
      item.id === bannerId ? { ...item, active: !item.active } : item
    );
    const ok = await persistBanners(nextBanners);
    if (ok) setMessage('Status do banner atualizado.');
  };

  const removeBanner = async (bannerId: string) => {
    const nextBanners = banners.filter((item) => item.id !== bannerId);
    const ok = await persistBanners(nextBanners);
    if (ok) setMessage('Banner removido.');
  };

  const bannerAvailableProducts = (restaurant?.products ?? []).filter((product) => product.active);
  const filteredBannerProducts = bannerAvailableProducts.filter((product) => {
    const q = bannerProductQuery.trim().toLowerCase();
    if (!q) return true;
    return product.name.toLowerCase().includes(q) || product.description.toLowerCase().includes(q);
  });

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Carregando painel...</div>;
  }

  if (!restaurant || !restaurantForm) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl p-6 text-center space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Painel indisponivel</h2>
          <p className="text-sm text-gray-600">{loadError ?? 'Sessao invalida para este restaurante.'}</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={async () => {
                await fetch('/api/master/logout', { method: 'POST' }).catch(() => null);
                localStorage.removeItem('pedezap_master_session');
                router.push('/master/login');
              }}
              className="px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-slate-900"
            >
              Ir para login
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSelectTab = (tabId: TabKey) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen lg:h-screen bg-gray-50 flex overflow-hidden">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-30 bg-black/35 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-gray-100">
          <BrandLogo src="/pedezappp.png" imageClassName="h-10 w-auto object-contain" />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id ? 'bg-slate-100 text-slate-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={async () => {
              await fetch('/api/master/logout', { method: 'POST' }).catch(() => null);
              localStorage.removeItem('pedezap_master_session');
              setMobileMenuOpen(false);
              router.push('/master/login');
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <aside className="w-64 h-screen bg-white border-r border-gray-200 hidden lg:flex flex-col">
        <div className="h-16 px-6 flex items-center gap-3 border-b border-gray-100">
          <BrandLogo src="/pedezappp.png" imageClassName="h-14 w-auto object-contain" />
          <div>
            <p className="text-xs text-gray-500">Painel</p>
          </div>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === item.id ? 'bg-slate-100 text-slate-900' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={async () => {
              await fetch('/api/master/logout', { method: 'POST' }).catch(() => null);
              localStorage.removeItem('pedezap_master_session');
              router.push('/master/login');
            }}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 min-h-0 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden h-9 w-9 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 flex items-center justify-center"
              aria-label="Abrir menu"
            >
              <MenuIcon size={18} />
            </button>
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">{pageTitle}</h1>
          </div>
          <div className="hidden md:flex flex-1 px-6">
            <div className="relative w-full max-w-xl">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 transition-all"
                placeholder="Buscar global (cardapio, pedidos, config)..."
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">{session?.restaurantName}</span>
              <span className="text-xs text-gray-500">Restaurante</span>
            </div>
            <div className="h-9 w-9 rounded-full bg-black text-white flex items-center justify-center text-sm font-bold">
              {session?.restaurantName?.charAt(0).toUpperCase() ?? 'R'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {message && (
              <p className="text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-lg px-3 py-2">
                {message}
              </p>
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <section className="lg:col-span-2 bg-black text-white rounded-xl p-6">
                    <h3 className="text-lg font-semibold">Seu Link de Pedidos</h3>
                    <p className="text-slate-300 text-sm mt-1">Compartilhe com seus clientes</p>
                    <div className="mt-6 flex gap-2">
                      <div className="flex-1 bg-white/20 rounded-lg px-3 py-2 text-sm font-mono truncate">
                        pedezap.site/{restaurant.slug}
                      </div>
                      <button onClick={copyLink} className="bg-white text-slate-800 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                        <Copy size={18} />
                      </button>
                      <button
                        onClick={() => navigateToExternalLink(`https://pedezap.site/${restaurant.slug}`)}
                        className="bg-white/15 border border-white/20 text-white p-2 rounded-lg hover:bg-white/20 transition-colors"
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </section>

                  <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col items-center text-center">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Status da Loja</span>
                    <div className={`mt-2 px-4 py-1 rounded-full text-xs font-bold ${(restaurant.openForOrders ?? true) ? 'bg-slate-100 text-slate-900' : 'bg-red-100 text-red-700'}`}>
                      {(restaurant.openForOrders ?? true) ? 'ABERTA' : 'FECHADA'}
                    </div>
                    <div className="mt-4 w-full">
                      <button
                        onClick={() =>
                          saveRestaurant({
                            ...restaurantForm,
                            openForOrders: !(restaurant.openForOrders ?? true)
                          })
                        }
                        className={`w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          (restaurant.openForOrders ?? true) ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-black text-white hover:bg-slate-900'
                        }`}
                      >
                        {(restaurant.openForOrders ?? true) ? 'Fechar Loja' : 'Abrir Loja'}
                      </button>
                    </div>
                  </section>

                  <section className="bg-white rounded-xl border border-gray-100 p-6 flex flex-col justify-between">
                    <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Plano Atual</span>
                    <h3 className="text-xl font-bold text-gray-900 mt-1">{restaurant.plan}</h3>
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="mt-4 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Ver Detalhes
                    </button>
                  </section>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <List size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Categorias</p>
                      <p className="text-xl font-bold text-gray-900">{restaurant.categories.length}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
                      <ShoppingBag size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Produtos</p>
                      <p className="text-xl font-bold text-gray-900">{restaurant.products.length}</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                      <Eye size={22} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Visualizacoes</p>
                      <p className="text-xl font-bold text-gray-900">{totalViews.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2 h-80">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas da Semana</h3>
                    <div className="h-60">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={weekSalesData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [
                              `R$ ${Number(value ?? 0).toFixed(2).replace('.', ',')}`,
                              'Vendas'
                            ]}
                          />
                          <Bar dataKey="vendas" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Dicas de Sucesso</h3>
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1 text-slate-800">
                          <AlertCircle size={18} />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium text-gray-900 mb-1">Fotos vendem mais!</p>
                          Adicione fotos reais e atraentes aos seus produtos para aumentar a conversao.
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1 text-slate-800">
                          <AlertCircle size={18} />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="font-medium text-gray-900 mb-1">Descricao detalhada</p>
                          Liste todos os ingredientes para evitar duvidas e agilizar o pedido.
                        </div>
                      </div>
                    </div>
                    <button className="mt-6 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      Ver todas as dicas
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Benchmark Interno (Pedidos)</h3>
                      <p className="text-sm text-gray-500">Baseado no {benchmarkInsights.sourceLabel} da sua loja.</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {benchmarkOrdersBase.length} pedidos analisados
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Horario de pico</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">
                        {benchmarkInsights.peakHour ? `${String(benchmarkInsights.peakHour.hour).padStart(2, '0')}:00` : '-'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {benchmarkInsights.peakHour?.orders ?? 0} pedidos • {moneyFormatter.format(benchmarkInsights.peakHour?.sales ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Melhor dia</p>
                      <p className="mt-1 text-xl font-bold text-gray-900">{benchmarkInsights.bestWeekday?.label ?? '-'}</p>
                      <p className="text-sm text-gray-600">
                        {benchmarkInsights.bestWeekday?.orders ?? 0} pedidos • {moneyFormatter.format(benchmarkInsights.bestWeekday?.sales ?? 0)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs uppercase tracking-wide text-amber-700">Janela fraca (oportunidade)</p>
                      <p className="mt-1 text-xl font-bold text-amber-900">
                        {benchmarkInsights.weakWindows[0]
                          ? `${String(benchmarkInsights.weakWindows[0].hour).padStart(2, '0')}:00`
                          : '-'}
                      </p>
                      <p className="text-sm text-amber-800">
                        {benchmarkInsights.weakWindows[0]?.orders ?? 0} pedidos • Considere cupom/banner
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <section className="mx-auto max-w-5xl space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-semibold text-gray-900">Configuracoes</h2>
                    <p className="text-sm text-gray-500">Gerencie as informacoes principais do seu negocio</p>
                  </div>
                  <button
                    disabled={saving || !settingsDraft}
                    onClick={() => {
                      if (!settingsDraft) return;
                      persistMessageTemplate();
                      persistOrderMessageTemplates();
                      persistPaymentSettings();
                      saveRestaurant({
                        ...settingsDraft,
                        openingHours: buildOpeningHoursSummary(settingsHours)
                      });
                    }}
                    className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-900 disabled:opacity-60"
                  >
                    <Save size={14} />
                    {saving ? 'Salvando...' : 'Salvar Alteracoes'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                  <div className="rounded-xl border border-gray-200 bg-white p-3 h-fit">
                    {[
                      { id: 'store' as const, label: 'Identidade Visual', icon: Store },
                      { id: 'hours' as const, label: 'Horarios', icon: Clock3 },
                      { id: 'address' as const, label: 'Endereco', icon: MapPin },
                      { id: 'delivery' as const, label: 'Pedidos & Delivery', icon: Bike },
                      { id: 'messages' as const, label: 'Mensagens', icon: MessageSquare },
                      { id: 'orderMessages' as const, label: 'Mensagens de Pedido', icon: MessageSquare },
                      { id: 'payments' as const, label: 'Pagamentos', icon: Wallet },
                      ...(canManageMasterAccess
                        ? [
                            { id: 'access' as const, label: 'Acessos do Painel', icon: Users },
                            { id: 'sessions' as const, label: 'Sessoes Ativas', icon: ShieldCheck }
                          ]
                        : [])
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSettingsSection(item.id)}
                        className={`w-full rounded-lg px-3 py-2.5 text-sm flex items-center gap-2 ${
                          settingsSection === item.id
                            ? 'bg-slate-100 text-slate-900 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon size={16} />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {settingsSection === 'hours' && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Horarios de Funcionamento</h3>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800">
                            <p className="font-medium">Defina sua grade de horarios</p>
                            <p className="text-xs mt-1">Desmarque os dias que o estabelecimento nao abre. Fora destes horarios, sua loja aparecera como "Fechada".</p>
                          </div>

                          <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                              <span>Dia da Semana</span>
                              <span>Abertura</span>
                              <span>Fechamento</span>
                            </div>
                            {settingsHours.map((day) => (
                              <div key={day.id} className="grid grid-cols-[1.2fr_1fr_1fr] gap-2 px-4 py-2 border-t border-gray-100 items-center">
                                <label className="text-sm text-gray-800 inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={day.enabled}
                                    onChange={(event) => updateSettingsHour(day.id, 'enabled', event.target.checked)}
                                  />
                                  {day.label}
                                </label>
                                <input
                                  type="time"
                                  value={day.open}
                                  disabled={!day.enabled}
                                  onChange={(event) => updateSettingsHour(day.id, 'open', event.target.value)}
                                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                />
                                <input
                                  type="time"
                                  value={day.close}
                                  disabled={!day.enabled}
                                  onChange={(event) => updateSettingsHour(day.id, 'close', event.target.value)}
                                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-400"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'address' && settingsDraft && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Localizacao</h3>
                        </div>
                        <div className="p-4 space-y-4">
                          <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800 inline-flex items-start gap-3 w-full">
                            <AlertCircle size={16} className="mt-0.5" />
                            <p>
                              Este endereco sera exibido para seus clientes e usado para calcular rotas de entrega se voce usar entregadores parceiros.
                            </p>
                          </div>

                          <div>
                            <label className="text-sm text-gray-700">Endereco Completo (Rua, Numero, Bairro)</label>
                            <input
                              value={settingsDraft.address}
                              onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, address: event.target.value } : prev))}
                              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="text-sm text-gray-700">Cidade</label>
                              <input
                                value={settingsDraft.city}
                                onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, city: event.target.value } : prev))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-700">Estado (UF)</label>
                              <input
                                value={settingsDraft.state}
                                onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, state: event.target.value } : prev))}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                            </div>
                          </div>

                          <div className="h-36 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                              <MapPin size={26} className="mx-auto" />
                              <p className="mt-2 text-xs">Mapa indisponivel na visualizacao</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'delivery' && settingsDraft && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="text-2xl font-semibold text-gray-900">Configuracao de Pedidos</h3>
                          </div>
                          <div className="p-4 space-y-4">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-base font-semibold text-gray-900">Aceitar Novos Pedidos</p>
                                <p className="text-sm text-gray-500">Controle global de recebimento de pedidos.</p>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setSettingsDraft((prev) =>
                                    prev ? { ...prev, openForOrders: !prev.openForOrders } : prev
                                  )
                                }
                                className={`h-6 w-11 rounded-full p-1 transition-colors ${settingsDraft.openForOrders ? 'bg-slate-1000' : 'bg-gray-300'}`}
                                aria-label="Alternar recebimento de pedidos"
                              >
                                <span
                                  className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                                    settingsDraft.openForOrders ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                ></span>
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="text-sm text-gray-700">Pedido Minimo</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={settingsDraft.minOrderValue}
                                  onChange={(event) =>
                                    setSettingsDraft((prev) =>
                                      prev ? { ...prev, minOrderValue: Number(event.target.value || 0) } : prev
                                    )
                                  }
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-700">Taxa de Entrega Padrao</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={settingsDraft.deliveryFee}
                                  onChange={(event) =>
                                    setSettingsDraft((prev) =>
                                      prev ? { ...prev, deliveryFee: Number(event.target.value || 0) } : prev
                                    )
                                  }
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-700">Tempo Estimado</label>
                                <input
                                  value={settingsDeliveryEta}
                                  onChange={(event) => setSettingsDeliveryEta(event.target.value)}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-base font-semibold text-gray-900">Raio e Logistica de Entrega</p>
                              <p className="text-sm text-gray-500">
                                Configure taxa por distancia/faixa, bairros com taxa fixa e despacho manual/automatico.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={ensureSettingsDeliveryConfig}
                              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Inicializar configuracao
                            </button>
                          </div>

                          {settingsDraft?.deliveryConfig && (
                            <div className="mt-4 space-y-4">
                              {(() => {
                                const deliveryCfg = settingsDraft!.deliveryConfig!;
                                return (
                                  <>
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                      <div>
                                        <label className="text-sm text-gray-700">Raio maximo de entrega (km)</label>
                                        <input
                                          type="number"
                                          min={1}
                                          max={100}
                                          step="0.5"
                                          value={deliveryCfg.radiusKm}
                                          onChange={(event) =>
                                            updateDeliveryConfig((current) => ({
                                              ...current,
                                              radiusKm: Number(event.target.value || 1)
                                            }))
                                          }
                                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-sm text-gray-700">Regra de taxa</label>
                                        <select
                                          value={deliveryCfg.feeMode}
                                          onChange={(event) =>
                                            updateDeliveryConfig((current) => ({
                                              ...current,
                                              feeMode: event.target.value as RestaurantDeliveryConfig['feeMode']
                                            }))
                                          }
                                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        >
                                          <option value="flat">Taxa padrao</option>
                                          <option value="distance_bands">Por faixa de distancia</option>
                                          <option value="neighborhood_fixed">Por bairro (taxa fixa)</option>
                                          <option value="hybrid">Hibrido (bairro &gt; faixa &gt; padrao)</option>
                                        </select>
                                      </div>
                                      <div>
                                        <label className="text-sm text-gray-700">Despacho</label>
                                        <select
                                          value={deliveryCfg.dispatchMode}
                                          onChange={(event) =>
                                            updateDeliveryConfig((current) => ({
                                              ...current,
                                              dispatchMode: event.target.value as 'manual' | 'auto'
                                            }))
                                          }
                                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                        >
                                          <option value="manual">Manual</option>
                                          <option value="auto">Automatico</option>
                                        </select>
                                      </div>
                                    </div>

                                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                      <input
                                        type="checkbox"
                                        checked={deliveryCfg.autoDispatchEnabled}
                                        onChange={(event) =>
                                          updateDeliveryConfig((current) => ({
                                            ...current,
                                            autoDispatchEnabled: event.target.checked
                                          }))
                                        }
                                        className="h-4 w-4 rounded border-gray-300 text-slate-800"
                                      />
                                      Habilitar auto despacho (modo inicial - sem integracao de entregadores)
                                    </label>

                                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                                      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={deliveryCfg.pickupEnabled}
                                          onChange={(event) =>
                                            updateDeliveryConfig((current) => ({
                                              ...current,
                                              pickupEnabled: event.target.checked
                                            }))
                                          }
                                          className="h-4 w-4 rounded border-gray-300 text-slate-800"
                                        />
                                        Permitir retirada no local
                                      </label>
                                      <div className="mt-3">
                                        <label className="text-sm text-gray-700">Instrucoes de retirada (opcional)</label>
                                        <textarea
                                          value={deliveryCfg.pickupInstructions ?? ''}
                                          onChange={(event) =>
                                            updateDeliveryConfig((current) => ({
                                              ...current,
                                              pickupInstructions: event.target.value
                                            }))
                                          }
                                          rows={3}
                                          placeholder="Ex.: Retire no balcao e informe o numero do pedido."
                                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
                                        />
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                      <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-gray-900">Taxa por distancia / faixa</p>
                                        <button
                                          type="button"
                                          onClick={addDeliveryBand}
                                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                          <Plus size={12} /> Nova faixa
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {deliveryCfg.distanceBands.length ? (
                                          deliveryCfg.distanceBands.map((band) => (
                                            <div key={band.id} className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-white p-2 md:grid-cols-[1fr_1fr_auto]">
                                              <div>
                                                <label className="text-xs text-gray-500">Ate (km)</label>
                                                <input
                                                  type="number"
                                                  min={0.5}
                                                  step="0.5"
                                                  value={band.upToKm}
                                                  onChange={(event) => updateDeliveryBand(band.id, 'upToKm', Number(event.target.value || 1))}
                                                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-500">Taxa (R$)</label>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  step="0.01"
                                                  value={band.fee}
                                                  onChange={(event) => updateDeliveryBand(band.id, 'fee', Number(event.target.value || 0))}
                                                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                                                />
                                              </div>
                                              <div className="flex items-end">
                                                <button
                                                  type="button"
                                                  onClick={() => removeDeliveryBand(band.id)}
                                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50"
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-xs text-gray-500">Nenhuma faixa cadastrada.</p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                      <div className="mb-2 flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-gray-900">Bairros atendidos com taxa fixa</p>
                                        <button
                                          type="button"
                                          onClick={addNeighborhoodRate}
                                          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                          <Plus size={12} /> Novo bairro
                                        </button>
                                      </div>
                                      <div className="space-y-2">
                                        {deliveryCfg.neighborhoodRates.length ? (
                                          deliveryCfg.neighborhoodRates.map((zone) => (
                                            <div
                                              key={zone.id}
                                              className="grid grid-cols-1 gap-2 rounded-lg border border-gray-200 bg-white p-2 md:grid-cols-[1.4fr_0.8fr_auto_auto]"
                                            >
                                              <div>
                                                <label className="text-xs text-gray-500">Bairro / regiao</label>
                                                <input
                                                  value={zone.name}
                                                  onChange={(event) => updateNeighborhoodRate(zone.id, 'name', event.target.value)}
                                                  placeholder="Ex: Centro, Cambui, Vila Nova"
                                                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                                                />
                                              </div>
                                              <div>
                                                <label className="text-xs text-gray-500">Taxa (R$)</label>
                                                <input
                                                  type="number"
                                                  min={0}
                                                  step="0.01"
                                                  value={zone.fee}
                                                  onChange={(event) => updateNeighborhoodRate(zone.id, 'fee', Number(event.target.value || 0))}
                                                  className="mt-1 w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                                                />
                                              </div>
                                              <label className="flex items-end gap-2 text-xs text-gray-600">
                                                <input
                                                  type="checkbox"
                                                  checked={zone.active}
                                                  onChange={(event) => updateNeighborhoodRate(zone.id, 'active', event.target.checked)}
                                                  className="mb-2 h-4 w-4 rounded border-gray-300 text-slate-800"
                                                />
                                                Ativo
                                              </label>
                                              <div className="flex items-end">
                                                <button
                                                  type="button"
                                                  onClick={() => removeNeighborhoodRate(zone.id)}
                                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50"
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                              </div>
                                            </div>
                                          ))
                                        ) : (
                                          <p className="text-xs text-gray-500">Nenhum bairro com taxa fixa cadastrado.</p>
                                        )}
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {settingsSection === 'messages' && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Personalizacao da Mensagem</h3>
                        </div>
                        <div className="p-4 grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4">
                          <div>
                            <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800">
                              Esta e a mensagem que o seu cliente enviara automaticamente para o seu WhatsApp ao finalizar um pedido no catalogo.
                              Personalize-a para facilitar o seu atendimento.
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center justify-between gap-2">
                                <label className="text-sm text-gray-700">Template da Mensagem</label>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => void handleCatalogMessageAi('generate')}
                                    disabled={settingsMessageAiLoading !== null}
                                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                  >
                                    {settingsMessageAiLoading === 'generate' ? 'Gerando...' : 'Gerar com IA'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleCatalogMessageAi('improve')}
                                    disabled={settingsMessageAiLoading !== null || !settingsMessageTemplate.trim()}
                                    className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                  >
                                    {settingsMessageAiLoading === 'improve' ? 'Melhorando...' : 'Melhorar texto'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleCatalogMessageAi('config')}
                                    disabled={settingsMessageAiLoading !== null}
                                    className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                  >
                                    {settingsMessageAiLoading === 'config' ? 'Analisando...' : 'Sugerir configuracao'}
                                  </button>
                                </div>
                              </div>
                              <textarea
                                value={settingsMessageTemplate}
                                onChange={(event) => setSettingsMessageTemplate(event.target.value)}
                                className="mt-1 h-44 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              />
                              <p className="mt-1 text-right text-xs text-gray-400">{settingsMessageTemplate.length} caracteres</p>
                              {(settingsMessageAiTips.length > 0 || settingsMessageAiTone) && (
                                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Sugestao de configuracao da IA</p>
                                  {settingsMessageAiTone ? (
                                    <p className="mt-1 text-xs text-blue-900">
                                      <span className="font-semibold">Tom recomendado:</span> {settingsMessageAiTone}
                                    </p>
                                  ) : null}
                                  {settingsMessageAiTips.length > 0 ? (
                                    <ul className="mt-2 space-y-1 text-xs text-blue-900">
                                      {settingsMessageAiTips.slice(0, 5).map((tip, index) => (
                                        <li key={`${tip}-${index}`}>- {tip}</li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </div>
                              )}
                            </div>

                            <div className="mt-4">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variaveis disponiveis</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {availableMessageVars.map((variable) => (
                                  <button
                                    key={variable}
                                    type="button"
                                    onClick={() => insertMessageVariable(variable)}
                                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                  >
                                    + {variable}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-[#ece5dd] overflow-hidden h-[370px] flex flex-col">
                            <div className="bg-slate-900 text-white px-4 py-3">
                              <p className="text-sm font-semibold">{restaurant.name}</p>
                              <p className="text-[11px] text-slate-300">Online</p>
                            </div>
                            <div className="p-4">
                              <div className="ml-auto w-[88%] rounded-xl bg-[#dcf8c6] px-3 py-2 text-sm text-gray-800 shadow-sm">
                                <p>{previewMessage || 'Digite a mensagem...'}</p>
                                <p className="mt-1 text-[10px] text-right text-gray-500">14:47</p>
                              </div>
                            </div>
                            <div className="mt-auto p-3">
                              <div className="rounded-full bg-white/90 px-4 py-2 text-xs text-gray-400">Mensagem</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'payments' && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Metodos de Pagamento</h3>
                        </div>
                        <div className="p-4 space-y-4">
                          <div>
                            <p className="text-sm text-gray-700">Formas aceitas na entrega/retirada</p>
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                              {[
                                { key: 'money' as const, label: 'Dinheiro' },
                                { key: 'card' as const, label: 'Cartao' },
                                { key: 'pix' as const, label: 'PIX' }
                              ].map((item) => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() =>
                                    setSettingsPaymentMethods((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                                  }
                                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                                    settingsPaymentMethods[item.key]
                                      ? 'border-slate-900 bg-slate-100 text-slate-900'
                                      : 'border-gray-300 bg-white text-gray-500'
                                  }`}
                                >
                                  {settingsPaymentMethods[item.key] ? 'OK - ' : ''}
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                            <p className="text-base font-semibold text-slate-900">Configuracao do PIX</p>
                            <div className="mt-2">
                              <label className="text-sm text-slate-900">Chave PIX ou Instrucoes</label>
                              <input
                                value={settingsPixInstructions}
                                onChange={(event) => setSettingsPixInstructions(event.target.value)}
                                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                              />
                            </div>
                            <p className="mt-2 text-xs text-slate-700">
                              Essa informacao sera exibida para o cliente na etapa de pagamento.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'orderMessages' && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <h3 className="text-2xl font-semibold text-gray-900">Mensagens de Pedido</h3>
                        </div>
                        <div className="p-4 space-y-5">
                          <div className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800">
                            Personalize os textos enviados ao cliente durante o fluxo do pedido.
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-sm font-semibold text-gray-700">Quando iniciar preparo</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleOrderMessageAi('preparing', 'generate')}
                                  disabled={orderMessagesAiLoading !== null}
                                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                  {orderMessagesAiLoading === 'preparing-generate' ? 'Gerando...' : 'Gerar com IA'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleOrderMessageAi('preparing', 'improve')}
                                  disabled={orderMessagesAiLoading !== null || !settingsOrderPreparingMessage.trim()}
                                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                  {orderMessagesAiLoading === 'preparing-improve' ? 'Melhorando...' : 'Melhorar'}
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={settingsOrderPreparingMessage}
                              onChange={(event) => setSettingsOrderPreparingMessage(event.target.value)}
                              className="h-28 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                            <p className="text-xs text-gray-500">Preview: {previewPreparingMessage}</p>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-sm font-semibold text-gray-700">Quando sair para entrega</label>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handleOrderMessageAi('outForDelivery', 'generate')}
                                  disabled={orderMessagesAiLoading !== null}
                                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                  {orderMessagesAiLoading === 'delivery-generate' ? 'Gerando...' : 'Gerar com IA'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleOrderMessageAi('outForDelivery', 'improve')}
                                  disabled={orderMessagesAiLoading !== null || !settingsOrderOutForDeliveryMessage.trim()}
                                  className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                                >
                                  {orderMessagesAiLoading === 'delivery-improve' ? 'Melhorando...' : 'Melhorar'}
                                </button>
                              </div>
                            </div>
                            <textarea
                              value={settingsOrderOutForDeliveryMessage}
                              onChange={(event) => setSettingsOrderOutForDeliveryMessage(event.target.value)}
                              className="h-28 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                            <p className="text-xs text-gray-500">Preview: {previewOutForDeliveryMessage}</p>
                          </div>

                          <div>
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variaveis disponiveis</p>
                              <button
                                type="button"
                                onClick={() => void handleOrderMessagesConfigAi()}
                                disabled={orderMessagesAiLoading !== null}
                                className="rounded-lg border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                              >
                                {orderMessagesAiLoading === 'config' ? 'Analisando...' : 'Sugerir configuracao da IA'}
                              </button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {availableMessageVars.map((variable) => (
                                <button
                                  key={variable}
                                  type="button"
                                  onClick={() => insertOrderMessageVariable('preparing', variable)}
                                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                >
                                  Preparo + {variable}
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {availableMessageVars.map((variable) => (
                                <button
                                  key={`out_${variable}`}
                                  type="button"
                                  onClick={() => insertOrderMessageVariable('outForDelivery', variable)}
                                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                                >
                                  Entrega + {variable}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {settingsSection === 'access' && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="text-2xl font-semibold text-gray-900">Acessos do Painel</h3>
                            <p className="text-sm text-gray-500 mt-1">Crie acessos com permissoes por perfil para gerente, atendente e cozinha.</p>
                          </div>
                          <div className="p-4 space-y-4">
                            {masterSecurityError && (
                              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {masterSecurityError}
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-sm text-gray-700">Nome</label>
                                <input
                                  value={masterUserForm.name}
                                  onChange={(event) => setMasterUserForm((prev) => ({ ...prev, name: event.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-sm text-gray-700">Email</label>
                                <input
                                  type="email"
                                  value={masterUserForm.email}
                                  disabled={Boolean(masterUserForm.id)}
                                  onChange={(event) => setMasterUserForm((prev) => ({ ...prev, email: event.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <label className="text-sm text-gray-700">Perfil</label>
                                <select
                                  value={masterUserForm.role}
                                  onChange={(event) =>
                                    applyMasterRolePermissions(event.target.value as 'gerente' | 'atendente' | 'cozinha')
                                  }
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                >
                                  <option value="gerente">Gerente</option>
                                  <option value="atendente">Atendente</option>
                                  <option value="cozinha">Cozinha</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-sm text-gray-700">Status</label>
                                <select
                                  value={masterUserForm.status}
                                  onChange={(event) =>
                                    setMasterUserForm((prev) => ({ ...prev, status: event.target.value as 'Ativo' | 'Inativo' }))
                                  }
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                >
                                  <option value="Ativo">Ativo</option>
                                  <option value="Inativo">Inativo</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-sm text-gray-700">
                                  {masterUserForm.id ? 'Nova Senha (opcional)' : 'Senha'}
                                </label>
                                <input
                                  type="password"
                                  value={masterUserForm.password}
                                  onChange={(event) => setMasterUserForm((prev) => ({ ...prev, password: event.target.value }))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                  placeholder={masterUserForm.id ? 'Manter senha atual' : 'Minimo 6 caracteres'}
                                />
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">Permissoes (abas)</p>
                              <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                {DEFAULT_PLAN_TABS.filter((tab) => tab !== 'plans').map((tab) => {
                                  const checked = masterUserForm.permissions.includes(tab);
                                  return (
                                    <label
                                      key={tab}
                                      className={`rounded-lg border px-3 py-2 text-sm flex items-center gap-2 cursor-pointer ${
                                        checked ? 'border-slate-900 bg-slate-100' : 'border-gray-200 bg-white'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(event) =>
                                          setMasterUserForm((prev) => ({
                                            ...prev,
                                            permissions: event.target.checked
                                              ? Array.from(new Set([...prev.permissions, tab]))
                                              : prev.permissions.filter((item) => item !== tab)
                                          }))
                                        }
                                      />
                                      {TAB_LABELS[tab]}
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {masterUserForm.id && (
                                <button
                                  type="button"
                                  onClick={resetMasterUserForm}
                                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Cancelar edicao
                                </button>
                              )}
                              <button
                                type="button"
                                disabled={masterUserSaving}
                                onClick={handleSaveMasterPanelUser}
                                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                              >
                                {masterUserSaving ? 'Salvando...' : masterUserForm.id ? 'Salvar usuario' : 'Criar usuario'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                            <h4 className="text-lg font-semibold text-gray-900">Usuarios cadastrados</h4>
                            <button
                              type="button"
                              onClick={() => void loadMasterPanelUsers()}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              Atualizar
                            </button>
                          </div>
                          <div className="p-4">
                            {masterSecurityLoading && masterPanelUsers.length === 0 ? (
                              <p className="text-sm text-gray-500">Carregando acessos...</p>
                            ) : masterPanelUsers.length === 0 ? (
                              <p className="text-sm text-gray-500">Nenhum usuario adicional criado.</p>
                            ) : (
                              <div className="space-y-3">
                                {masterPanelUsers.map((user) => (
                                  <div key={user.id} className="rounded-xl border border-gray-200 p-3">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <div>
                                        <p className="font-semibold text-gray-900">{user.name}</p>
                                        <p className="text-sm text-gray-500">{user.email}</p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">{user.role}</span>
                                          <span className={`rounded-full px-2 py-1 ${user.status === 'Ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                            {user.status}
                                          </span>
                                          {user.lastAccessAt && (
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-gray-600">
                                              Ultimo acesso: {new Date(user.lastAccessAt).toLocaleString('pt-BR')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => handleEditMasterPanelUser(user)}
                                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1"
                                        >
                                          <Pencil size={14} />
                                          Editar
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => void handleDeleteMasterPanelUser(user)}
                                          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 inline-flex items-center gap-1"
                                        >
                                          <Trash2 size={14} />
                                          Remover
                                        </button>
                                      </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {user.permissions.map((permission) => (
                                        <span key={`${user.id}_${permission}`} className="rounded-full border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                                          {TAB_LABELS[permission]}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                        </div>
                      </div>
                    )}

                    {settingsSection === 'sessions' && (
                      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-2xl font-semibold text-gray-900">Sessoes Ativas</h3>
                            <p className="text-sm text-gray-500">Encerre acessos remotos do painel da sua equipe.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void loadMasterSessions()}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Atualizar
                          </button>
                        </div>
                        <div className="p-4 space-y-3">
                          {masterSecurityError && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                              {masterSecurityError}
                            </div>
                          )}
                          {masterSecurityLoading && masterSessions.length === 0 ? (
                            <p className="text-sm text-gray-500">Carregando sessoes...</p>
                          ) : masterSessions.length === 0 ? (
                            <p className="text-sm text-gray-500">Nenhuma sessao ativa encontrada.</p>
                          ) : (
                            masterSessions.map((item) => (
                              <div key={item.id} className="rounded-xl border border-gray-200 p-3 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {item.subjectName}
                                    {item.isCurrent && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">Sessao atual</span>}
                                  </p>
                                  <p className="text-sm text-gray-500">{item.actorEmail || '-'}</p>
                                  <p className="mt-1 text-xs text-gray-500">
                                    Role: {item.role || '-'} • IP: {item.ip || '-'} • Ultima atividade: {new Date(item.lastSeenAt).toLocaleString('pt-BR')}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  disabled={Boolean(item.isCurrent)}
                                  onClick={() => void handleRevokeMasterSession(item.id)}
                                  className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Encerrar sessao
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {settingsSection !== 'hours' && settingsSection !== 'address' && settingsSection !== 'delivery' && settingsSection !== 'messages' && settingsSection !== 'orderMessages' && settingsSection !== 'payments' && settingsSection !== 'access' && settingsSection !== 'sessions' && (
                      <>
                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="text-2xl font-semibold text-gray-900">Identidade Visual</h3>
                          </div>
                          <div className="p-4">
                            <div className="relative overflow-hidden rounded-xl border border-gray-200">
                              <img
                                src={settingsDraft?.coverUrl || restaurant.coverUrl || 'https://picsum.photos/seed/pedezap-cover/1200/300'}
                                alt="Capa da loja"
                                className="h-44 w-full object-cover"
                              />
                              <input
                                id="settings-cover-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                  applyImageFile(event, (imageUrl) =>
                                    setSettingsDraft((prev) => (prev ? { ...prev, coverUrl: imageUrl } : prev))
                                  )
                                }
                              />
                              <label
                                htmlFor="settings-cover-upload"
                                className="absolute right-3 bottom-3 cursor-pointer rounded-lg bg-black/70 text-white px-3 py-1.5 text-xs font-medium"
                              >
                                Alterar Capa
                              </label>
                            </div>
                            <div className="mt-4 flex items-end gap-3">
                              <div className="h-16 w-16 overflow-hidden rounded-full border-2 border-gray-200 bg-black text-white flex items-center justify-center font-bold text-lg shadow-sm">
                                {settingsDraft?.logoUrl ? (
                                  <img src={settingsDraft.logoUrl} alt="Logo da loja" className="h-full w-full object-cover" />
                                ) : (
                                  restaurant.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <input
                                id="settings-logo-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(event) =>
                                  applyImageFile(event, (imageUrl) =>
                                    setSettingsDraft((prev) => (prev ? { ...prev, logoUrl: imageUrl } : prev))
                                  )
                                }
                              />
                              <label
                                htmlFor="settings-logo-upload"
                                className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Alterar Logo
                              </label>
                            </div>
                            <p className="mt-3 text-xs text-gray-400">
                              Tamanho recomendado para capa: 1200x300px. Para logo: 500x500 px.
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <h3 className="text-2xl font-semibold text-gray-900">Informacoes Basicas</h3>
                          </div>
                          {settingsDraft && (
                            <div className="p-4 space-y-4">
                              <div>
                                <label className="text-sm text-gray-700">Nome do Restaurante</label>
                                <input
                                  value={settingsDraft.name}
                                  onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>

                              <div>
                                <label className="text-sm text-gray-700">WhatsApp (com DDD)</label>
                                <input
                                  value={settingsDraft.whatsapp}
                                  onChange={(event) => setSettingsDraft((prev) => (prev ? { ...prev, whatsapp: event.target.value } : prev))}
                                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'menu' && (
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-gray-900">Categorias</h2>
                    <button
                      onClick={openCreateCategoryForm}
                      className="inline-flex items-center gap-1 rounded-lg bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-slate-900"
                    >
                      <Plus size={14} />
                      Nova
                    </button>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">{categorySummaries.length}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Ativas</p>
                      <p className="mt-1 text-lg font-bold text-emerald-900">{activeCategoryCount}</p>
                    </div>
                  </div>

                  <div className="relative mb-4">
                    <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={categorySearch}
                      onChange={(event) => setCategorySearch(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:bg-white"
                      placeholder="Buscar categoria"
                    />
                  </div>

                  {showCategoryForm && (
                    <div className="mb-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                            {editingCategoryId ? 'Editando categoria' : 'Nova categoria'}
                          </p>
                          <h3 className="mt-1 text-sm font-semibold text-slate-900">
                            {editingCategoryId ? 'Ajuste nome e status' : 'Crie uma categoria para organizar o cardapio'}
                          </h3>
                        </div>
                        <button
                          onClick={resetCategoryForm}
                          className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
                          aria-label="Fechar formulario de categoria"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-slate-500">Nome da categoria</label>
                          <input
                            value={newCategory}
                            onChange={(event) => {
                              setNewCategory(event.target.value);
                              if (categoryFormError) setCategoryFormError(null);
                            }}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                            placeholder="Ex: Pizzas tradicionais"
                          />
                        </div>
                        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                          <div>
                            <p className="text-sm font-medium text-slate-900">Categoria ativa</p>
                            <p className="text-xs text-slate-500">Categorias inativas continuam visiveis para edicao.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCategoryFormActive((prev) => !prev)}
                            className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                              categoryFormActive ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            aria-label={categoryFormActive ? 'Desativar categoria' : 'Ativar categoria'}
                          >
                            <span
                              className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                                categoryFormActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                        {categoryFormError ? (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            {categoryFormError}
                          </div>
                        ) : null}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              saveCategory({
                                id: editingCategoryId ?? undefined,
                                name: newCategory,
                                active: categoryFormActive
                              })
                            }
                            disabled={categorySaving}
                            className="inline-flex items-center justify-center rounded-xl bg-black px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {categorySaving ? 'Salvando...' : editingCategoryId ? 'Salvar alteracoes' : 'Criar categoria'}
                          </button>
                          <button
                            onClick={resetCategoryForm}
                            className="inline-flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {filteredCategorySummaries.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                        <p className="text-sm font-medium text-slate-700">Nenhuma categoria encontrada</p>
                        <p className="mt-1 text-xs text-slate-500">Tente outro nome na busca ou crie uma nova categoria.</p>
                      </div>
                    ) : (
                      filteredCategorySummaries.map((category) => (
                      <div
                        key={category.id}
                        className={`rounded-2xl border px-3 py-3 transition ${
                          selectedCategoryId === category.id
                            ? category.active
                              ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                              : 'border-red-300 bg-red-50 shadow-sm'
                            : category.active
                            ? 'border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40'
                            : 'border-slate-200 bg-white hover:border-red-200 hover:bg-red-50/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <button
                            onClick={() => setSelectedCategoryId(category.id)}
                            className="flex flex-1 items-start gap-3 text-left"
                          >
                            <span
                              className={`mt-1 h-2.5 w-2.5 rounded-full ${
                                category.active ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-semibold text-slate-900">{category.name}</span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                    category.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {category.active ? 'Ativa' : 'Inativa'}
                                </span>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span>{category.productCount} produto(s)</span>
                                {selectedCategoryId === category.id ? (
                                  <span className="rounded-full bg-slate-900 px-2 py-0.5 font-medium text-white">Selecionada</span>
                                ) : null}
                              </div>
                            </div>
                          </button>
                          <div className="flex items-center gap-1.5 text-gray-400">
                            <button
                              onClick={() => saveCategory({ id: category.id, name: category.name, active: !category.active })}
                              className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                                category.active ? 'bg-emerald-500' : 'bg-slate-300'
                              }`}
                              title={category.active ? 'Desativar categoria' : 'Ativar categoria'}
                              aria-label={category.active ? 'Desativar categoria' : 'Ativar categoria'}
                            >
                              <span
                                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                                  category.active ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                            <button
                              onClick={() => editCategory(category)}
                              className="rounded-lg border border-slate-200 bg-white p-2 transition hover:border-slate-300 hover:text-slate-900"
                              title="Editar categoria"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => deleteCategory(category.id)}
                              disabled={categoryDeletingId === category.id}
                              className="rounded-lg border border-slate-200 bg-white p-2 transition hover:border-red-200 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Excluir categoria"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                </section>

                <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-base font-semibold text-gray-900">{selectedCategory?.name ?? 'Produtos'}</h2>
                      <p className="text-xs text-gray-500">{filteredProducts.length} produtos cadastrados</p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProductForm(true);
                        setProductForm(createDefaultProductForm(selectedCategoryId ?? ''));
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-black text-white px-3 py-1.5 text-xs font-medium hover:bg-slate-900"
                    >
                      <Plus size={14} />
                      Novo Produto
                    </button>
                  </div>

                  <div className="space-y-3">
                    {filteredProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-xl p-4 flex gap-4">
                        <img
                          src={product.imageUrl || `https://picsum.photos/seed/${product.id}/80/80`}
                          alt={product.name}
                          className="h-16 w-16 rounded-lg object-cover bg-gray-100"
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-semibold text-gray-900">{product.name}</p>
                              <p className="text-xs text-gray-500">{stripFeaturedTag(product.description)}</p>
                              {hasFeaturedTag(product.description) && (
                                <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-800">
                                  Destaque
                                </span>
                              )}
                            </div>
                            <span className="text-slate-800 font-semibold text-sm">R$ {product.price.toFixed(2)}</span>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                            <button onClick={() => editProduct(product)} className="hover:text-slate-900">
                              Editar
                            </button>
                            <button onClick={() => duplicateProduct(product)} className="hover:text-slate-900">
                              Duplicar
                            </button>
                            <button onClick={() => deleteProduct(product.id)} className="hover:text-red-600">
                              Excluir
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {!filteredProducts.length && (
                      <div className="text-sm text-gray-500">Nenhum produto nesta categoria.</div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'orders' && (
              <MasterOrdersTab
                ordersView={ordersView}
                setOrdersView={setOrdersView}
                ordersQuery={ordersQuery}
                setOrdersQuery={setOrdersQuery}
                onOpenManualOrder={() => setShowManualOrderModal(true)}
                hasReachedManualOrderLimit={hasReachedManualOrderLimit}
                lastOrdersRefreshAt={lastOrdersRefreshAt}
                newOrdersAlertCount={newOrdersAlertCount}
                clearNewOrdersAlert={() => setNewOrdersAlertCount(0)}
                manualOrderMonthlyLimit={manualOrderMonthlyLimit}
                manualOrdersThisMonthCount={manualOrdersThisMonth.length}
                filteredOrders={filteredOrders}
                ordersByStatus={ordersByStatus}
                updatingOrderId={updatingOrderId}
                onUpdateOrderStatus={updateOrderStatus}
                onPrintOrderTicket={printOrderTicket}
                getOrderAgeMinutes={getOrderAgeMinutes}
                paymentMethodLabel={paymentMethodLabel}
                getOrderStatus={getOrderStatus}
                activeDeliveryOrders={activeDeliveryOrders}
              />
            )}

            {activeTab === 'billing' && (
              <section className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Financeiro</h2>
                    <p className="text-sm text-gray-500">Acompanhe o desempenho do seu negocio</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1">
                    {[
                      { key: 'today', label: 'Hoje' },
                      { key: '7d', label: '7 Dias' },
                      { key: '30d', label: '30 Dias' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setBillingRange(item.key as typeof billingRange)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          billingRange === item.key ? 'bg-white text-slate-900 shadow' : 'text-gray-500'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Faturamento no Periodo</p>
                      <p className="text-xl font-bold text-gray-900">R$ {billingRevenue.toFixed(2)}</p>
                      <span className="text-[10px] text-slate-800 bg-slate-100 px-2 py-1 rounded-full">+12.5% vs. anterior</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center">
                      <CreditCard size={18} />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Pedidos no Periodo</p>
                      <p className="text-xl font-bold text-gray-900">{billingCount}</p>
                      <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-1 rounded-full">+5% vs. anterior</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                      <ShoppingBag size={18} />
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Ticket Medio</p>
                      <p className="text-xl font-bold text-gray-900">R$ {ticketMedio.toFixed(2)}</p>
                      <span className="text-[10px] text-slate-700 bg-slate-100 px-2 py-1 rounded-full">-2.1% vs. anterior</span>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center">
                      <AlertCircle size={18} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-100 p-6 lg:col-span-2">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Evolucao de Vendas (Por Dia)</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={buildDailySeries()}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="label" tickLine={false} axisLine={false} />
                          <YAxis tickLine={false} axisLine={false} />
                          <Tooltip
                            cursor={{ fill: '#f3f4f6' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4">Metodos de Pagamento</h3>
                    <div className="h-56 flex items-center justify-center">
                      <div className="relative h-40 w-40 rounded-full border-[14px] border-slate-900 border-l-slate-600 border-r-slate-500"></div>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-700"></span>Cartao</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-1000"></span>Dinheiro</span>
                      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-1000"></span>Pix</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Ultimas Transacoes</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                        <tr>
                          <th className="px-2 py-2">Data</th>
                          <th className="px-2 py-2">Pedido</th>
                          <th className="px-2 py-2">Metodo</th>
                          <th className="px-2 py-2 text-right">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {billingOrders.slice(0, 5).map((order) => (
                          <tr key={order.id}>
                            <td className="px-2 py-3 text-xs text-gray-500">{new Date(order.createdAt).toLocaleString('pt-BR')}</td>
                            <td className="px-2 py-3 font-semibold text-gray-900">#{order.id}</td>
                            <td className="px-2 py-3 text-xs text-gray-500">{paymentMethodLabel(order.paymentMethod)}</td>
                            <td className="px-2 py-3 text-right font-semibold text-gray-900">R$ {order.total.toFixed(2)}</td>
                          </tr>
                        ))}
                        {!billingOrders.length && (
                          <tr>
                            <td colSpan={4} className="px-2 py-6 text-center text-sm text-gray-500">
                              Nenhuma transacao no periodo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'highlights' && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Destaques do Cardapio</h2>
                  <p className="text-sm text-gray-500">
                    Selecione os produtos que aparecerao no topo do seu cardapio digital para impulsionar as vendas.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos em Destaque ({highlightedProducts.length})</h3>
                  {highlightedProducts.length ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {highlightedProducts.map((product) => (
                        <div key={product.id} className="rounded-xl border border-slate-200 bg-white p-3">
                          <div className="relative">
                            <img
                              src={product.imageUrl || `https://picsum.photos/seed/${product.id}/320/180`}
                              alt={product.name}
                              className="h-40 w-full rounded-lg object-cover bg-gray-100"
                            />
                            <button
                              onClick={() => setProductFeatured(product, false)}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-red-200 text-red-500 text-xs"
                              title="Remover destaque"
                            >
                              -
                            </button>
                          </div>
                          <p className="mt-3 font-semibold text-gray-900">{product.name}</p>
                          <p className="text-sm font-semibold text-slate-800">R$ {product.price.toFixed(2)}</p>
                          <span className="mt-2 inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-900">
                            Em Destaque
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6 text-sm text-gray-500">
                      Nenhum produto em destaque.
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar aos Destaques</h3>
                  <div className="mb-3">
                    <input
                      value={highlightsQuery}
                      onChange={(event) => setHighlightsQuery(event.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Buscar produtos para destacar..."
                    />
                  </div>
                  <div className="space-y-2">
                    {availableHighlights.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={product.imageUrl || `https://picsum.photos/seed/${product.id}/64/64`}
                            alt={product.name}
                            className="h-10 w-10 rounded-lg object-cover bg-gray-100"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{product.name}</p>
                            <p className="text-xs text-gray-500">R$ {product.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setProductFeatured(product, true)}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Destacar
                        </button>
                      </div>
                    ))}
                    {!availableHighlights.length && (
                      <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                        Nenhum produto disponivel para destaque.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'clients' && (
              <section className="space-y-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">Base de Clientes</h2>
                    <p className="text-sm text-gray-500">{allCustomers.length} clientes cadastrados</p>
                  </div>
                  <div className="flex w-full max-w-xl items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={exportCustomersVcf}
                      disabled={!allCustomers.length}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Smartphone size={16} />
                      Exportar contatos (.vcf)
                    </button>
                    <div className="relative w-full max-w-sm">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={clientsQuery}
                        onChange={(event) => setClientsQuery(event.target.value)}
                        className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm"
                        placeholder="Buscar por nome ou telefone..."
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[760px]">
                    <thead className="text-xs uppercase text-gray-400 border-b border-gray-100">
                      <tr>
                        <th className="px-3 py-3">Cliente</th>
                        <th className="px-3 py-3">Pedidos</th>
                        <th className="px-3 py-3">Total Gasto</th>
                        <th className="px-3 py-3">Ultimo Pedido</th>
                        <th className="px-3 py-3 text-right">Acoes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id}>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-100 text-slate-900 flex items-center justify-center font-semibold">
                                {customer.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {customer.name} {customer.totalOrders >= 10 ? 'ÃƒÂ¢Ã‚Â­Ã‚Â' : ''}
                                </p>
                                <p className="text-xs text-gray-500">{customer.whatsapp}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-gray-700">{customer.totalOrders}</td>
                          <td className="px-3 py-3">
                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-900">
                              R$ {customer.totalSpent.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-gray-700">
                            {customer.lastOrderAt ? new Date(customer.lastOrderAt).toLocaleDateString('pt-BR') : 'Sem pedidos'}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <a
                              href={`https://wa.me/${customer.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-800 font-medium hover:text-slate-900"
                            >
                              WhatsApp
                            </a>
                          </td>
                        </tr>
                      ))}
                      {!filteredCustomers.length && (
                        <tr>
                          <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                            Nenhum cliente encontrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'promotions' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-semibold text-gray-900">Meus Cupons</h2>
                    <p className="text-sm text-gray-500">Crie codigos de desconto para atrair mais clientes.</p>
                  </div>
                  <button
                    onClick={openCreateCouponModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-900"
                  >
                    <Plus size={14} />
                    Novo Cupom
                  </button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                  {coupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className={`rounded-xl border bg-white p-5 shadow-sm ${
                        coupon.active ? 'border-slate-200 border-b-4 border-b-slate-900' : 'border-gray-200 border-b-4 border-b-gray-300 opacity-80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`h-7 w-7 rounded-md flex items-center justify-center ${coupon.active ? 'bg-slate-100 text-slate-900' : 'bg-gray-100 text-gray-400'}`}>
                            <TicketPercent size={14} />
                          </div>
                          <div>
                            <p className="text-lg font-bold tracking-wide text-gray-900">{coupon.code}</p>
                            <p className="text-xs text-gray-500">{coupon.uses} usos</p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            coupon.active ? 'bg-slate-100 text-slate-900' : 'bg-gray-200 text-gray-500'
                          }`}
                        >
                          {coupon.active ? 'ATIVO' : 'INATIVO'}
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-3xl font-bold leading-none text-slate-900">{formatCouponDiscount(coupon)} <span className="text-lg font-medium text-gray-500">OFF</span></p>
                        <p className="mt-1 text-sm text-gray-500">
                          Pedido minimo: <span className="font-semibold text-gray-700">{formatMoney(coupon.minOrderValue)}</span>
                        </p>
                      </div>

                      <div className="mt-3 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-500 flex items-center gap-2">
                        <Calendar size={12} />
                        {formatCouponValidity(coupon)}
                      </div>

                      <div className="mt-4 border-t border-gray-100 pt-4 flex items-center justify-between">
                        <button
                          onClick={() => toggleCouponStatus(coupon.id)}
                          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                        >
                          <Power size={14} />
                          {coupon.active ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          onClick={() => openEditCouponModal(coupon)}
                          className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-900"
                        >
                          <Pencil size={14} />
                          Editar
                        </button>
                        <button
                          onClick={() => removeCoupon(coupon.id)}
                          className="text-red-500 hover:text-red-600"
                          aria-label={`Excluir cupom ${coupon.code}`}
                          title={`Excluir cupom ${coupon.code}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {!coupons.length && (
                  <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                    Nenhum cupom criado.
                  </div>
                )}
              </section>
            )}

            {showCouponForm && (
              <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
                <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="text-2xl font-semibold text-gray-900">{editingCouponId ? 'Editar Cupom' : 'Novo Cupom'}</h3>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <label className="text-sm text-gray-700">Codigo do Cupom</label>
                      <input
                        value={couponForm.code}
                        onChange={(event) => setCouponForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))}
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                        placeholder="EX: PROMO10"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-700">Tipo de Desconto</label>
                        <select
                          value={couponForm.discountType}
                          onChange={(event) =>
                            setCouponForm((prev) => ({ ...prev, discountType: event.target.value as CouponDiscountType }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="percent">Porcentagem (%)</option>
                          <option value="fixed">Valor Fixo (R$)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-gray-700">
                          {couponForm.discountType === 'percent' ? 'Valor (%)' : 'Valor (R$)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={couponForm.discountValue}
                          onChange={(event) => setCouponForm((prev) => ({ ...prev, discountValue: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Pedido Minimo (R$)</label>
                      <input
                        type="number"
                        min="0"
                        value={couponForm.minOrderValue}
                        onChange={(event) => setCouponForm((prev) => ({ ...prev, minOrderValue: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Calendar size={14} />
                        Validade (Opcional)
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-700">Data Inicio</label>
                          <input
                            type="date"
                            value={couponForm.startDate}
                            onChange={(event) => setCouponForm((prev) => ({ ...prev, startDate: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700">Data Termino</label>
                          <input
                            type="date"
                            value={couponForm.endDate}
                            onChange={(event) => setCouponForm((prev) => ({ ...prev, endDate: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-3">
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Clock3 size={14} />
                        Horario Diario (Opcional)
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-sm text-gray-700">Hora Inicio</label>
                          <input
                            type="time"
                            value={couponForm.startTime}
                            onChange={(event) => setCouponForm((prev) => ({ ...prev, startTime: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700">Hora Fim</label>
                          <input
                            type="time"
                            value={couponForm.endTime}
                            onChange={(event) => setCouponForm((prev) => ({ ...prev, endTime: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={couponForm.active}
                        onChange={(event) => setCouponForm((prev) => ({ ...prev, active: event.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-slate-800"
                      />
                      Cupom Ativo
                    </label>
                  </div>

                  <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-end gap-2">
                    <button
                      onClick={closeCouponModal}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveCoupon}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Salvar Cupom
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'banners' && (
              <section className="space-y-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-3xl font-semibold text-gray-900">Banners Promocionais</h2>
                    <p className="text-sm text-gray-500">Gerencie os destaques visuais e vincule produtos as promocoes.</p>
                  </div>
                  <button
                    onClick={openCreateBannerModal}
                    className="inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-900"
                  >
                    <Plus size={14} />
                    Novo Banner
                  </button>
                </div>

                {banners.length > 0 ? (
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {banners.map((banner) => (
                      <div key={banner.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                        <div className="relative">
                          <img src={banner.imageUrl} alt={banner.title} className="h-40 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeBanner(banner.id)}
                            className="absolute right-3 top-3 h-8 w-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center hover:bg-white"
                            title="Excluir banner"
                          >
                            <Trash2 size={14} />
                          </button>
                          <span className="absolute bottom-3 left-3 rounded-full bg-black px-2.5 py-1 text-xs font-semibold text-white">
                            {banner.productIds.length} produto{banner.productIds.length === 1 ? '' : 's'}
                          </span>
                          {banner.abGroup ? (
                            <span className="absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-900">
                              Grupo {banner.abGroup}
                            </span>
                          ) : null}
                        </div>
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{banner.title}</h3>
                              <p className="mt-1 text-sm text-gray-500 line-clamp-1">{banner.description || 'Sem descricao'}</p>
                              <p className="mt-2 text-xs text-gray-500">
                                Cliques: <span className="font-semibold text-gray-800">{banner.clicks ?? 0}</span>
                                {' • '}
                                Pedidos atrib.: <span className="font-semibold text-gray-800">{banner.attributedOrders ?? 0}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleBannerActive(banner.id)}
                              className={`h-6 w-11 rounded-full p-1 transition-colors ${banner.active ? 'bg-slate-1000' : 'bg-gray-300'}`}
                            >
                              <span
                                className={`block h-4 w-4 rounded-full bg-white transition-transform ${
                                  banner.active ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </button>
                          </div>
                          <button
                            onClick={() => openEditBannerModal(banner)}
                            className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Editar Detalhes
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                    <p className="text-lg font-semibold text-gray-900">Nenhum banner criado</p>
                    <p className="mt-1 text-sm text-gray-500">Crie banners para substituir os destaques padrao do catalogo.</p>
                    <button
                      onClick={openCreateBannerModal}
                      className="mt-4 inline-flex items-center gap-2 rounded-lg bg-black text-white px-4 py-2 text-sm font-semibold hover:bg-slate-900"
                    >
                      <Plus size={14} />
                      Criar primeiro banner
                    </button>
                  </div>
                )}
              </section>
            )}

            {showBannerModal && (
              <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
                <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl">
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
                    <h3 className="text-2xl font-semibold text-gray-900">{editingBannerId ? 'Editar Banner' : 'Novo Banner'}</h3>
                    <button onClick={closeBannerModal} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.1fr]">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Imagem Promocional</p>
                        <input
                          id="banner-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) =>
                            applyImageFile(event, (imageUrl) => setBannerForm((prev) => ({ ...prev, imageUrl })))
                          }
                        />
                        <label
                          htmlFor="banner-image-upload"
                          className="mt-2 flex h-44 w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100"
                        >
                          <span className="text-sm font-medium">{bannerForm.imageUrl ? 'Alterar imagem' : 'Clique para enviar'}</span>
                          <span className="text-xs">1200x400px (Recomendado)</span>
                        </label>
                        {bannerForm.imageUrl && (
                          <img src={bannerForm.imageUrl} alt="Preview do banner" className="mt-3 h-36 w-full rounded-lg object-cover" />
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-700">Titulo do Banner</label>
                          <input
                            value={bannerForm.title}
                            onChange={(event) => setBannerForm((prev) => ({ ...prev, title: event.target.value }))}
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Ex: Terca Maluca"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-700">Descricao</label>
                          <textarea
                            value={bannerForm.description}
                            onChange={(event) => setBannerForm((prev) => ({ ...prev, description: event.target.value }))}
                            className="mt-1 h-20 w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Ex: Todos os lanches com 20% de desconto. Aproveite!"
                          />
                        </div>
                        <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                          <input
                            type="checkbox"
                            checked={bannerForm.active}
                            onChange={(event) => setBannerForm((prev) => ({ ...prev, active: event.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300 text-slate-800"
                          />
                          Banner ativo no cardapio
                        </label>
                        <div>
                          <label className="text-sm text-gray-700">Grupo A/B (Opcional)</label>
                          <select
                            value={bannerForm.abGroup ?? ''}
                            onChange={(event) =>
                              setBannerForm((prev) => ({ ...prev, abGroup: event.target.value as 'A' | 'B' | '' }))
                            }
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="">Sem grupo</option>
                            <option value="A">Grupo A</option>
                            <option value="B">Grupo B</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-semibold text-gray-900">Produtos da Promocao</h4>
                          <p className="text-sm text-gray-500">Selecione os produtos que fazem parte deste banner.</p>
                        </div>
                        <div className="relative w-full max-w-xs">
                          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            value={bannerProductQuery}
                            onChange={(event) => setBannerProductQuery(event.target.value)}
                            className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm"
                            placeholder="Buscar produto..."
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                        {filteredBannerProducts.map((product) => {
                          const selected = bannerForm.productIds.includes(product.id);
                          return (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => toggleBannerProduct(product.id)}
                              className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left ${
                                selected ? 'border-slate-400 bg-slate-100' : 'border-gray-200 bg-white'
                              }`}
                            >
                              <img
                                src={product.imageUrl || 'https://picsum.photos/seed/product/80/80'}
                                alt={product.name}
                                className="h-11 w-11 rounded-md object-cover"
                              />
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-500">{moneyFormatter.format(product.price)}</p>
                              </div>
                            </button>
                          );
                        })}
                        {!filteredBannerProducts.length && (
                          <div className="col-span-full rounded-lg border border-dashed border-gray-300 p-5 text-center text-sm text-gray-500">
                            Nenhum produto encontrado.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-gray-100 bg-white px-5 py-4">
                    <button
                      onClick={closeBannerModal}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveBanner}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Salvar Banner
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showCampaignModal && (
              <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h3 className="text-2xl font-semibold text-gray-900">
                      {editingCampaignId ? 'Editar Campanha' : 'Nova Campanha'}
                    </h3>
                    <button onClick={closeCampaignModal} className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <label className="text-sm text-gray-700">Nome da Campanha</label>
                      <input
                        value={campaignForm.name}
                        onChange={(event) => setCampaignForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Ex: Semana do Burger"
                      />
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className="text-sm text-gray-700">Periodo (Opcional)</label>
                        <input
                          value={campaignForm.period}
                          onChange={(event) => setCampaignForm((prev) => ({ ...prev, period: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Ex: 01/03 ate 10/03"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700">Cupom Manual (Opcional)</label>
                        <input
                          value={campaignForm.couponCode}
                          onChange={(event) =>
                            setCampaignForm((prev) => ({
                              ...prev,
                              couponCode: event.target.value.toUpperCase()
                            }))
                          }
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Ex: BURGER10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Vincular Cupons</label>
                      <div className="mt-1 max-h-28 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                        {coupons.length ? (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {coupons.map((coupon) => {
                              const selected = campaignForm.couponCodes.includes(coupon.code.toUpperCase());
                              return (
                                <label
                                  key={coupon.id}
                                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
                                    selected ? 'border-slate-300 bg-slate-100 text-slate-900' : 'border-gray-200 bg-white text-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleCampaignCouponCode(coupon.code)}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-slate-800"
                                  />
                                  <span className="font-medium">{coupon.code}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Sem cupons cadastrados na aba Promocoes.</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-700">Vincular Banners</label>
                      <div className="mt-1 max-h-36 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                        {banners.length ? (
                          <div className="grid grid-cols-1 gap-2">
                            {banners.map((banner) => {
                              const selected = campaignForm.bannerIds.includes(banner.id);
                              return (
                                <label
                                  key={banner.id}
                                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
                                    selected ? 'border-slate-300 bg-slate-100 text-slate-900' : 'border-gray-200 bg-white text-gray-700'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleCampaignBanner(banner.id)}
                                    className="h-3.5 w-3.5 rounded border-gray-300 text-slate-800"
                                  />
                                  <span className="font-medium">{banner.title}</span>
                                </label>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">Sem banners cadastrados na aba Banners.</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div>
                        <label className="text-sm text-gray-700">Inicio (Calendario)</label>
                        <input
                          type="date"
                          value={campaignForm.startDate}
                          onChange={(event) => setCampaignForm((prev) => ({ ...prev, startDate: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-700">Fim (Calendario)</label>
                        <input
                          type="date"
                          value={campaignForm.endDate}
                          onChange={(event) => setCampaignForm((prev) => ({ ...prev, endDate: event.target.value }))}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <label className="inline-flex items-center gap-2 pt-7 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={campaignForm.autoActivateByCalendar}
                          onChange={(event) =>
                            setCampaignForm((prev) => ({
                              ...prev,
                              autoActivateByCalendar: event.target.checked
                            }))
                          }
                          className="h-4 w-4 rounded border-gray-300 text-slate-800"
                        />
                        Ativar automatico por calendario
                      </label>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <p className="text-sm font-medium text-gray-800">UTM / Origem de Trafego</p>
                      <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs text-gray-600">utm_source</label>
                          <input
                            value={campaignForm.utmSource}
                            onChange={(event) => setCampaignForm((prev) => ({ ...prev, utmSource: event.target.value }))}
                            placeholder="instagram"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">utm_medium</label>
                          <input
                            value={campaignForm.utmMedium}
                            onChange={(event) => setCampaignForm((prev) => ({ ...prev, utmMedium: event.target.value }))}
                            placeholder="bio | story | qr_mesa"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">utm_campaign</label>
                          <input
                            value={campaignForm.utmCampaign}
                            onChange={(event) => setCampaignForm((prev) => ({ ...prev, utmCampaign: event.target.value }))}
                            placeholder="semana-do-burger"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-600">utm_content (A/B)</label>
                          <input
                            value={campaignForm.utmContent}
                            onChange={(event) => setCampaignForm((prev) => ({ ...prev, utmContent: event.target.value }))}
                            placeholder="banner_a"
                            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        checked={campaignForm.active}
                        onChange={(event) => setCampaignForm((prev) => ({ ...prev, active: event.target.checked }))}
                        className="h-4 w-4 rounded border-gray-300 text-slate-800"
                      />
                      Campanha ativa
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                      onClick={closeCampaignModal}
                      className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={saveCampaign}
                      className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Salvar Campanha
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showFlyerModal && restaurant && (
              <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm p-3 md:p-5 flex items-center justify-center">
                <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 md:px-5">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-sm">
                        <Megaphone size={18} />
                      </span>
                      Criador de Stories
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowFlyerModal(false)}
                      className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[400px_1fr] md:grid-cols-[320px_1fr]">
                    <div className="min-h-0 border-r border-gray-200 bg-white flex flex-col">
                      <div className="flex border-b border-gray-200 md:hidden">
                        <button
                          type="button"
                          onClick={() => setFlyerMobileTab('edit')}
                          className={`flex-1 px-4 py-2 text-sm font-medium ${
                            flyerMobileTab === 'edit' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Pencil size={14} /> Editar
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFlyerMobileTab('preview')}
                          className={`flex-1 px-4 py-2 text-sm font-medium ${
                            flyerMobileTab === 'preview' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Eye size={14} /> Visualizar
                          </span>
                        </button>
                      </div>

                      <div className={`${flyerMobileTab === 'preview' ? 'hidden md:flex' : 'flex'} flex-col h-full overflow-hidden`}>
                        <div className="flex-1 overflow-y-auto p-5 space-y-6">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <label className="text-sm font-semibold text-gray-900">Manchete</label>
                              <span className="text-[10px] text-gray-400">{flyerHeadline.length}/30</span>
                            </div>
                            <input
                              value={flyerHeadline}
                              onChange={(event) => setFlyerHeadline(event.target.value.toUpperCase().slice(0, 30))}
                              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold uppercase tracking-wide focus:border-slate-900 focus:ring-0 transition-colors"
                              placeholder="CONFIRA OS PRECOS"
                            />

                            <p className="mt-5 mb-3 text-sm font-semibold text-gray-900">Tema Visual</p>
                            <div className="grid grid-cols-4 gap-3">
                              {flyerThemes.map((theme) => (
                                <button
                                  key={theme.key}
                                  type="button"
                                  onClick={() => setFlyerThemeKey(theme.key)}
                                  className={`h-16 rounded-xl border-2 p-1 transition-all ${flyerThemeKey === theme.key ? 'border-slate-900 scale-105 shadow-md' : 'border-transparent hover:border-gray-200'}`}
                                >
                                  <div className={`h-full w-full rounded-md ${theme.swatchClass} flex items-center justify-center`}>
                                    <span className={`h-3 w-3 rounded-full ${theme.dotClass}`} />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-gray-100">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="text-sm font-semibold text-gray-900">Selecionar Produtos</p>
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                {flyerSelectedProductIds.length}/4
                              </span>
                            </div>
                            <div className="relative">
                              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input
                                value={flyerProductQuery}
                                onChange={(event) => setFlyerProductQuery(event.target.value)}
                                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm focus:border-slate-400 focus:ring-0"
                                placeholder="Buscar..."
                              />
                            </div>
                            <div className="mt-3 max-h-[320px] overflow-y-auto rounded-xl border border-gray-100 bg-white pr-1">
                              {flyerFilteredProducts.map((product) => {
                                const selected = flyerSelectedProductIds.includes(product.id);
                                return (
                                  <label
                                    key={product.id}
                                    className={`group flex cursor-pointer items-center gap-3 border-b border-gray-50 px-3 py-3 transition-colors last:border-b-0 hover:bg-gray-50 ${
                                      selected ? 'bg-indigo-50/50' : 'bg-transparent'
                                    }`}
                                  >
                                    <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-all ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white group-hover:border-gray-400'}`}>
                                        {selected && <Check size={12} strokeWidth={3} />}
                                    </div>
                                    <input
                                      type="checkbox"
                                      checked={selected}
                                      onChange={() => toggleFlyerProduct(product.id)}
                                      className="hidden"
                                    />
                                    <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-gray-900">{product.name}</p>
                                      <p className="text-xs text-gray-500">{moneyFormatter.format(product.price)}</p>
                                    </div>
                                  </label>
                                );
                              })}
                              {!flyerFilteredProducts.length && (
                                <div className="px-3 py-6 text-center text-sm text-gray-500">Nenhum produto encontrado.</div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-gray-200 p-3 md:hidden">
                          <button
                            type="button"
                            onClick={() => setFlyerMobileTab('preview')}
                            className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-semibold text-white"
                          >
                            Ver Resultado ?
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className={`min-h-0 bg-slate-100 p-4 md:p-8 flex items-center justify-center relative overflow-hidden ${flyerMobileTab === 'edit' ? 'hidden md:flex' : 'flex'}`}>
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                      {/* Phone Mockup */}
                      <div className="relative w-auto h-auto max-h-full max-w-full aspect-[9/16] bg-black rounded-[2.5rem] border-[8px] border-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-900/5 select-none z-10">
                        {/* Status Bar Mockup */}
                        <div className="absolute top-0 inset-x-0 h-8 z-20 flex justify-between px-6 items-center bg-gradient-to-b from-black/40 to-transparent pointer-events-none">
                            <div className="text-[10px] font-medium text-white/90">9:41</div>
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-white/90"></div>
                                <div className="w-1.5 h-1.5 rounded-full bg-white/90"></div>
                                <div className="w-4 h-1.5 rounded-full bg-white/90"></div>
                            </div>
                        </div>

                        <div className={`h-full w-full flex flex-col ${activeFlyerTheme.previewClass} relative p-5 pt-12`}>
                          <div
                            className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay"
                            style={{
                              backgroundImage: 'radial-gradient(rgba(255,255,255,.4) 1px, transparent 1px)',
                              backgroundSize: '24px 24px'
                            }}
                          />
                          
                          <div className="relative text-center mb-6 z-10">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-3 shadow-lg overflow-hidden">
                              {flyerLogoUrl ? (
                                <img src={flyerLogoUrl} alt={`Logo ${restaurant.name}`} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xl font-bold text-white">{restaurant.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 drop-shadow-sm">{restaurant.name}</p>
                          </div>

                          <div
                            className={`relative mx-auto inline-block max-w-[92%] -skew-x-3 rounded-lg px-4 py-3 text-center shadow-xl z-10 ${activeFlyerTheme.titleRibbonClass}`}
                            style={{ width: 'fit-content' }}
                          >
                            <span
                              className="block max-w-full skew-x-3 whitespace-normal break-words font-black uppercase tracking-tight leading-[1.02]"
                              style={{
                                fontSize:
                                  (flyerHeadline || 'OFERTAS DO DIA').length > 28
                                    ? '1.35rem'
                                    : (flyerHeadline || 'OFERTAS DO DIA').length > 18
                                      ? '1.55rem'
                                      : '2rem'
                              }}
                            >
                              {(flyerHeadline || 'OFERTAS DO DIA').toUpperCase()}
                            </span>
                          </div>

                          {flyerSelectedProducts.length === 1 ? (
                            <div className="relative mt-auto mb-auto flex flex-col items-center gap-4 px-2 z-10">
                              <div className="-rotate-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/40">
                                <img
                                  src={flyerSelectedProducts[0].imageUrl}
                                  alt={flyerSelectedProducts[0].name}
                                  className="h-64 w-64 rounded-xl object-cover"
                                />
                              </div>
                              <p className="text-center text-3xl font-black uppercase leading-tight text-white drop-shadow-md px-2">
                                {flyerSelectedProducts[0].name}
                              </p>
                              <div className="inline-flex items-end gap-1 rounded-2xl bg-white px-6 py-3 text-slate-900 shadow-xl">
                                <span className="pb-1.5 text-lg font-bold text-slate-500">R$</span>
                                <span className="text-5xl font-black leading-none tracking-tighter">
                                  {splitPriceParts(flyerSelectedProducts[0].price).intPart}
                                </span>
                                <span className="pb-1.5 text-2xl font-bold text-slate-500">
                                  ,{splitPriceParts(flyerSelectedProducts[0].price).decimalPart}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-6 flex-1 space-y-3 overflow-hidden z-10">
                              {flyerSelectedProducts.length ? (
                                flyerSelectedProducts.map((product) => (
                                  <div key={product.id} className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 backdrop-blur-md p-3 shadow-sm">
                                    <img src={product.imageUrl} alt={product.name} className="h-14 w-14 rounded-lg object-cover shadow-sm" />
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold text-white leading-tight">{product.name}</p>
                                      <p className="text-sm font-black text-white/90 mt-0.5">{moneyFormatter.format(product.price)}</p>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center">
                                  <div className="mb-2 rounded-full bg-white/10 p-3">
                                    <ShoppingBag className="text-white/50" size={24} />
                                  </div>
                                  <p className="text-sm font-medium text-white/70">Selecione produtos ao lado</p>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="relative mt-auto text-center pb-6 z-10">
                            <div className="flex justify-center">
                               <p className="text-[10px] font-medium text-white/90 bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/10">
                                 {marketingLink.replace('https://', '')}
                               </p>
                            </div>
                            <p className="mt-3 text-[8px] font-bold text-white/40 uppercase tracking-widest">pedezap.site</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-gray-200 bg-white px-4 py-4 md:px-6">
                    <button
                      type="button"
                      onClick={() => setShowFlyerModal(false)}
                      className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Fechar
                    </button>
                    <button
                      type="button"
                      onClick={downloadFlyerFromModal}
                      className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Baixar
                    </button>
                    <button
                      type="button"
                        onClick={() =>
                          navigateToExternalLink(
                            `https://wa.me/?text=${encodeURIComponent(`Confira nossas ofertas: ${marketingLink}`)}`
                          )
                        }
                      className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all flex items-center gap-2"
                    >
                      <MessageCircle size={16} />
                      Compartilhar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showBioLinkModal && restaurant && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-sm md:p-5">
                <div className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 md:px-6">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                        <Smartphone size={18} />
                      </span>
                      Bio Link para Instagram
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowBioLinkModal(false)}
                      className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="flex border-b border-gray-200 md:hidden">
                    <button
                      type="button"
                      onClick={() => setBioLinkMobileTab('edit')}
                      className={`flex-1 px-4 py-2 text-sm font-medium ${
                        bioLinkMobileTab === 'edit' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Pencil size={14} /> Editar
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBioLinkMobileTab('preview')}
                      className={`flex-1 px-4 py-2 text-sm font-medium ${
                        bioLinkMobileTab === 'preview' ? 'border-b-2 border-gray-900 text-gray-900' : 'text-gray-500'
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Eye size={14} /> Preview
                      </span>
                    </button>
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[430px_1fr]">
                    <div
                      className={`${bioLinkMobileTab === 'preview' ? 'hidden md:block' : 'block'} min-h-0 overflow-y-auto border-r border-gray-200 bg-white p-5`}
                    >
                      <div className="space-y-5">
                        <section>
                          <h4 className="mb-3 text-sm font-semibold text-gray-900">Aparencia</h4>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { key: 'dark' as const, label: 'Escuro' },
                              { key: 'light' as const, label: 'Claro' },
                              { key: 'brand' as const, label: 'Cor da Marca' }
                            ].map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => setBioLinkSettings((prev) => ({ ...prev, appearance: item.key }))}
                                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                                  bioLinkSettings.appearance === item.key
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </section>

                        <section className="space-y-3 border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-semibold text-gray-900">Conteudo</h4>
                          <div>
                            <label className="text-xs font-semibold uppercase text-gray-500">Frase de destaque</label>
                            <input
                              value={bioLinkSettings.headline}
                              onChange={(event) =>
                                setBioLinkSettings((prev) => ({ ...prev, headline: event.target.value.slice(0, 80) }))
                              }
                              className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm"
                              placeholder="Nossos links oficiais"
                            />
                          </div>

                          <div className="rounded-xl border border-gray-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-800">Botao WhatsApp</span>
                              <input
                                type="checkbox"
                                checked={bioLinkSettings.whatsappEnabled}
                                onChange={(event) =>
                                  setBioLinkSettings((prev) => ({ ...prev, whatsappEnabled: event.target.checked }))
                                }
                                className="h-4 w-4 rounded border-gray-300 text-green-600"
                              />
                            </div>
                            <input
                              value={bioLinkSettings.whatsappValue}
                              onChange={(event) =>
                                setBioLinkSettings((prev) => ({ ...prev, whatsappValue: event.target.value }))
                              }
                              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm"
                              placeholder="Numero com DDD ou link"
                            />
                            <p className="mt-1 text-[11px] text-gray-500">Ex: 11999998888 ou https://wa.me/5511999998888</p>
                          </div>

                          <div className="rounded-xl border border-gray-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-800">Botao Instagram</span>
                              <input
                                type="checkbox"
                                checked={bioLinkSettings.instagramEnabled}
                                onChange={(event) =>
                                  setBioLinkSettings((prev) => ({ ...prev, instagramEnabled: event.target.checked }))
                                }
                                className="h-4 w-4 rounded border-gray-300 text-pink-600"
                              />
                            </div>
                            <input
                              value={bioLinkSettings.instagramValue}
                              onChange={(event) =>
                                setBioLinkSettings((prev) => ({ ...prev, instagramValue: event.target.value }))
                              }
                              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm"
                              placeholder="Link do perfil"
                            />
                            <p className="mt-1 text-[11px] text-gray-500">Ex: @seuperfil ou instagram.com/seuperfil</p>
                          </div>

                          <div className="rounded-xl border border-gray-200 p-3">
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-800">Link Personalizado</span>
                              <input
                                type="checkbox"
                                checked={bioLinkSettings.customEnabled}
                                onChange={(event) =>
                                  setBioLinkSettings((prev) => ({ ...prev, customEnabled: event.target.checked }))
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                              <input
                                value={bioLinkSettings.customLabel}
                                onChange={(event) =>
                                  setBioLinkSettings((prev) => ({ ...prev, customLabel: event.target.value.slice(0, 60) }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm"
                                placeholder="Meu site"
                              />
                              <input
                                value={bioLinkSettings.customUrl}
                                onChange={(event) =>
                                  setBioLinkSettings((prev) => ({ ...prev, customUrl: event.target.value }))
                                }
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm"
                                placeholder="https://..."
                              />
                              <p className="text-[11px] text-gray-500">Aceita URL com ou sem https://</p>
                            </div>
                          </div>
                        </section>
                      </div>
                    </div>

                    <div
                      className={`${bioLinkMobileTab === 'edit' ? 'hidden md:block' : 'block'} relative min-h-0 overflow-y-auto bg-slate-900 p-4 md:p-6`}
                    >
                      <div
                        className="absolute inset-0 opacity-30"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle at 1px 1px, rgba(148,163,184,.45) 1px, transparent 0)',
                          backgroundSize: '20px 20px'
                        }}
                      />
                      <div className="relative z-10 mx-auto flex w-full max-w-[520px] items-center justify-center">
                        <div className={`w-full overflow-hidden rounded-[2rem] border border-white/10 p-0 shadow-[0_24px_80px_rgba(2,6,23,.45)] ${bioPreviewCardClass}`}>
                          <div className="relative pb-10">
                            <div className="h-40 w-full overflow-hidden">
                              <img
                                src={bioPreviewCoverUrl}
                                alt={`Capa ${restaurant.name}`}
                                className="h-full w-full object-cover opacity-90"
                              />
                            </div>
                            <div className="-mt-12 flex justify-center">
                              <div className="relative z-10 h-24 w-24 rounded-full bg-white p-1 shadow-lg ring-4 ring-white/70">
                                <div className="h-full w-full overflow-hidden rounded-full border border-gray-200 bg-white">
                                  {bioPreviewLogoUrl ? (
                                    <img src={bioPreviewLogoUrl} alt={restaurant.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center text-2xl font-black text-slate-900">
                                      {restaurant.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="px-6 text-center md:px-8">
                              <p className="mt-3 text-2xl font-bold leading-tight md:text-[2rem]">{restaurant.name}</p>
                              <p className={`mt-1 text-xs font-medium uppercase tracking-wider ${bioPreviewMutedClass}`}>
                                {bioLinkSettings.headline || 'Nossos links oficiais'}
                              </p>

                              <div className="mt-7 space-y-4 md:space-y-5">
                                <a
                                  href={marketingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`flex min-h-[54px] w-full items-center justify-center rounded-full px-6 text-base font-bold transition-all hover:scale-[1.02] active:scale-95 ${bioPreviewLinkBaseClass}`}
                                >
                                  Ver Cardapio
                                </a>

                                {canUseWhatsApp && (
                                  <a
                                    href={bioWhatsAppHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex min-h-[54px] w-full items-center justify-center rounded-full px-6 text-base font-bold transition-all hover:scale-[1.02] active:scale-95 ${bioPreviewLinkBaseClass}`}
                                  >
                                    Chamar no WhatsApp
                                  </a>
                                )}

                                {canUseInstagram && (
                                  <a
                                    href={bioInstagramHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex min-h-[54px] w-full items-center justify-center rounded-full px-6 text-base font-bold transition-all hover:scale-[1.02] active:scale-95 ${bioPreviewLinkBaseClass}`}
                                  >
                                    Seguir no Instagram
                                  </a>
                                )}

                                {canUseCustomLink && (
                                  <a
                                    href={bioCustomHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`flex min-h-[54px] w-full items-center justify-center rounded-full px-6 text-base font-bold transition-all hover:scale-[1.02] active:scale-95 ${bioPreviewLinkBaseClass}`}
                                  >
                                    {bioLinkSettings.customLabel || 'Link Personalizado'}
                                  </a>
                                )}
                              </div>

                              <p className={`mt-8 text-center text-[10px] uppercase tracking-widest ${bioPreviewMutedClass} opacity-60`}>Made with PedeZap</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-4 md:px-6">
                    <div className="flex w-full items-center gap-2 md:w-auto">
                      <input
                        readOnly
                        value={bioLinkPublicUrl}
                        className="w-full min-w-[260px] rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm md:w-[320px]"
                      />
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(bioLinkPublicUrl)}
                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        <Copy size={14} />
                        Copiar
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowBioLinkModal(false)}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={saveBioLinkAndPublish}
                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700"
                      >
                        <Save size={14} />
                        Salvar e Publicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showDeliveryPamphletModal && restaurant && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm md:p-6">
                <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4 md:px-5">
                    <div className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-500">
                        <TicketPercent size={18} />
                      </span>
                      Panfleto de Entrega
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeliveryPamphletModal(false)}
                      className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[44%_56%]">
                    <div className="min-h-0 overflow-y-auto border-r border-gray-200 bg-white p-5">
                      <p className="mb-4 text-sm text-gray-600">
                        Selecione um cupom ativo para gerar um cartao de agradecimento. Imprima e coloque dentro da sacola.
                      </p>

                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-gray-800">Cupom de Desconto</label>
                        <select
                          value={selectedDeliveryPamphletCoupon?.id ?? ''}
                          onChange={(event) => setDeliveryPamphletCouponId(event.target.value)}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-slate-500 focus:ring-0"
                        >
                          {!activeCoupons.length && <option value="">Nenhum cupom ativo</option>}
                          {activeCoupons.map((coupon) => (
                            <option key={coupon.id} value={coupon.id}>
                              {coupon.code} - {formatCouponDiscount(coupon)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        Dica: imprima 4 folhas por pagina para economizar papel.
                      </div>

                      <button
                        type="button"
                        onClick={downloadDeliveryPamphlet}
                        disabled={!selectedDeliveryPamphletCoupon}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gray-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Download size={15} />
                        Baixar para Imprimir
                      </button>
                    </div>

                    <div className="min-h-0 overflow-y-auto bg-gray-100 p-5 md:p-6">
                      <div className="flex min-h-full items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-5">
                        <div className="w-full max-w-[360px] rounded-sm border border-dashed border-gray-300 bg-white px-6 py-8 shadow-sm">
                          <div className="text-center text-3xl leading-none text-red-500">❤</div>
                          <h4 className="mt-1 text-center text-4xl font-black leading-none text-slate-900">OBRIGADO!</h4>
                          <p className="mt-2 text-center text-sm text-gray-600">Esperamos que ame seu pedido.</p>
                          <div className="my-4 h-px bg-gray-200" />
                          <p className="text-center text-[11px] font-bold uppercase tracking-[0.08em] text-gray-500">
                            Para a sua proxima compra
                          </p>
                          <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3">
                            <p className="text-center text-3xl font-black leading-none text-slate-800">
                              {(selectedDeliveryPamphletCoupon
                                ? formatCouponDiscount(selectedDeliveryPamphletCoupon)
                                : 'SELECIONE UM CUPOM'
                              ).toUpperCase()}
                            </p>
                          </div>
                          <p className="mt-3 text-center text-xs text-gray-500">
                            {selectedDeliveryPamphletCoupon
                              ? selectedDeliveryPamphletCoupon.minOrderValue > 0
                                ? `Em pedidos acima de ${formatMoney(selectedDeliveryPamphletCoupon.minOrderValue)}`
                                : 'Valido em qualquer pedido'
                              : 'Ative um cupom para gerar o panfleto'}
                          </p>
                          <p className="mt-7 text-center text-xl font-extrabold text-slate-900">{restaurant.name}</p>
                          <p className="mt-1 text-center text-[10px] text-slate-400">
                            Peca pelo nosso site: {marketingLink.replace('https://', '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'marketing' && (
              <section className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-4">
                  <h2 className="text-3xl font-semibold text-gray-900">Central de Marketing</h2>
                  <p className="text-sm text-gray-500">Estrategias e dados para vender mais.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
                  <div className="rounded-xl border border-gray-200 bg-white p-2 h-fit">
                    {[
                      { key: 'overview' as const, label: 'Visao Geral', icon: BarChart3, disabled: false },
                      { key: 'performance' as const, label: 'Performance', icon: ShoppingBag, disabled: false },
                      { key: 'tools' as const, label: 'Ferramentas', icon: Share2, disabled: false },
                      { key: 'offers' as const, label: 'Ofertas De/Por', icon: TicketPercent, disabled: false },
                      { key: 'campaigns' as const, label: 'Campanhas', icon: Megaphone, disabled: true }
                    ].map((item) => {
                      const active = marketingSection === item.key;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            if (!item.disabled) setMarketingSection(item.key);
                          }}
                          className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${
                            active
                              ? 'border-l-2 border-slate-900 bg-slate-100 text-slate-900 font-semibold'
                              : 'border-l-2 border-transparent text-gray-700 hover:bg-gray-50'
                          } ${item.disabled ? 'cursor-not-allowed text-gray-400 hover:bg-transparent' : ''}`}
                        >
                          <Icon size={16} />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-4">
                    {marketingSection === 'overview' && (
                      <>
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                              <Eye size={16} />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Acessos (Mes)</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{totalViews.toLocaleString('pt-BR')}</p>
                            <p className="mt-1 text-xs text-slate-800">+12% vs mes anterior</p>
                          </div>
                          <div className="rounded-xl border border-violet-200 bg-white p-4">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                              <BarChart3 size={16} />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Conversao</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{conversionRate.toFixed(1)}%</p>
                            <p className="mt-1 text-xs text-gray-500">Media do setor: 2.5%</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                              <Wallet size={16} />
                            </div>
                            <p className="text-sm font-medium text-gray-600">Vendas Totais</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{moneyFormatter.format(totalSalesThisMonth)}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="text-xl font-semibold text-gray-900">Funil de Vendas</h3>
                            <div className="mt-5 space-y-4">
                              {funnelBars.map((bar) => {
                                const width = totalViews ? Math.max(8, (bar.value / totalViews) * 100) : 8;
                                return (
                                  <div key={bar.label}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                      <span className="text-gray-600">{bar.label}</span>
                                      <span className="font-semibold text-gray-800">{bar.value.toLocaleString('pt-BR')}</span>
                                    </div>
                                    <div className="h-3 rounded-full bg-gray-100">
                                      <div className={`h-3 rounded-full ${bar.color}`} style={{ width: `${Math.min(100, width)}%` }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <h3 className="text-xl font-semibold text-gray-900">Origem do Trafego</h3>
                            <div className="mt-5 flex items-center gap-6">
                              <div
                                className="h-40 w-40 rounded-full"
                                style={{
                                  background: `conic-gradient(#22c55e 0 ${linkDirectPercent}%, #ec4899 ${linkDirectPercent}% ${
                                    linkDirectPercent + instagramPercent
                                  }%, #f59e0b ${linkDirectPercent + instagramPercent}% 100%)`
                                }}
                              >
                                <div className="m-auto mt-5 h-30 w-30 rounded-full bg-white" />
                              </div>
                              <div className="space-y-3 text-sm">
                                <p className="flex items-center gap-2 text-gray-700">
                                  <span className="h-2.5 w-2.5 rounded-full bg-slate-700" /> Link Direto (WhatsApp): {linkDirectPercent}%
                                </p>
                                <p className="flex items-center gap-2 text-gray-700">
                                  <span className="h-2.5 w-2.5 rounded-full bg-pink-500" /> Instagram: {instagramPercent}%
                                </p>
                                <p className="flex items-center gap-2 text-gray-700">
                                  <span className="h-2.5 w-2.5 rounded-full bg-slate-1000" /> Google / Outros: {othersPercent}%
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">Benchmark Interno da Loja</h3>
                              <p className="text-sm text-gray-500">
                                Horarios e dias com maior/menor desempenho ({benchmarkInsights.sourceLabel}).
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                              {benchmarkOrdersBase.length} pedidos
                            </span>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 p-4">
                              <p className="text-sm font-semibold text-gray-900">Top Horarios</p>
                              <div className="mt-3 space-y-2">
                                {benchmarkInsights.peakHours.length > 0 ? benchmarkInsights.peakHours.map((hour) => (
                                  <div key={`peak_${hour.hour}`} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                                    <span className="text-sm text-gray-700">{String(hour.hour).padStart(2, '0')}:00</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                      {hour.orders} pedidos
                                    </span>
                                  </div>
                                )) : (
                                  <p className="text-sm text-gray-500">Sem dados suficientes.</p>
                                )}
                              </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4">
                              <p className="text-sm font-semibold text-gray-900">Dias da Semana</p>
                              <div className="mt-3 space-y-2">
                                {benchmarkInsights.bestWeekday ? (
                                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
                                    <p className="text-xs uppercase tracking-wide text-emerald-700">Melhor dia</p>
                                    <p className="text-base font-semibold text-emerald-900">{benchmarkInsights.bestWeekday.label}</p>
                                    <p className="text-sm text-emerald-800">
                                      {benchmarkInsights.bestWeekday.orders} pedidos • {moneyFormatter.format(benchmarkInsights.bestWeekday.sales)}
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Sem dados suficientes.</p>
                                )}
                                <div className="space-y-1">
                                  {benchmarkInsights.dayParts.map((part) => (
                                    <div key={part.label} className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">{part.label}</span>
                                      <span className="font-medium text-gray-900">
                                        {part.orders} • {moneyFormatter.format(part.sales)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                              <p className="text-sm font-semibold text-amber-900">Janelas Fracas (Oportunidade)</p>
                              <p className="mt-1 text-xs text-amber-800">
                                Use cupom, banner ou campanha para ativar demanda nestes horarios.
                              </p>
                              <div className="mt-3 space-y-2">
                                {benchmarkInsights.weakWindows.length > 0 ? benchmarkInsights.weakWindows.map((hour) => (
                                  <div key={`weak_${hour.hour}`} className="rounded-lg border border-amber-200 bg-white/70 px-3 py-2">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-semibold text-amber-900">
                                        {String(hour.hour).padStart(2, '0')}:00
                                      </span>
                                      <span className="text-xs text-amber-800">{hour.orders} pedidos</span>
                                    </div>
                                    <p className="text-xs text-amber-900">
                                      Ticket medio: {moneyFormatter.format(hour.avgTicket)} • Receita: {moneyFormatter.format(hour.sales)}
                                    </p>
                                  </div>
                                )) : (
                                  <p className="text-sm text-amber-800">Sem dados suficientes.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-blue-200 bg-white p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">Analise de Vendas com IA</h3>
                              <p className="text-sm text-gray-600">
                                Diagnostico automatico com base em pedidos, conversao, produtos e benchmark da loja.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void requestAiSalesAnalysis()}
                              disabled={salesAiLoading}
                              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                            >
                              {salesAiLoading ? 'Analisando...' : 'Gerar analise com IA'}
                            </button>
                          </div>

                          {salesAiAnalysis && (
                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                              <div className="space-y-4">
                                <div className="rounded-xl border border-gray-200 p-4">
                                  <p className="text-xs uppercase tracking-wide text-gray-500">Resumo Executivo</p>
                                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
                                    {salesAiAnalysis.executiveSummary}
                                  </p>
                                </div>
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                  <p className="text-xs uppercase tracking-wide text-amber-700">Alertas</p>
                                  <ul className="mt-2 space-y-2">
                                    {salesAiAnalysis.alerts.length ? (
                                      salesAiAnalysis.alerts.map((item, index) => (
                                        <li key={`sales_ai_alert_${index}`} className="text-sm text-amber-900">
                                          • {item}
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-sm text-amber-900">Nenhum alerta relevante identificado.</li>
                                    )}
                                  </ul>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                  <p className="text-xs uppercase tracking-wide text-emerald-700">Recomendacoes Prioritarias</p>
                                  <ul className="mt-2 space-y-2">
                                    {salesAiAnalysis.recommendations.length ? (
                                      salesAiAnalysis.recommendations.map((item, index) => (
                                        <li key={`sales_ai_rec_${index}`} className="text-sm text-emerald-900">
                                          • {item}
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-sm text-emerald-900">Sem recomendacoes no momento.</li>
                                    )}
                                  </ul>
                                </div>
                                <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
                                  <p className="text-xs uppercase tracking-wide text-violet-700">O que melhorar / implementar</p>
                                  <ul className="mt-2 space-y-2">
                                    {salesAiAnalysis.implementationIdeas.length ? (
                                      salesAiAnalysis.implementationIdeas.map((item, index) => (
                                        <li key={`sales_ai_impl_${index}`} className="text-sm text-violet-900">
                                          • {item}
                                        </li>
                                      ))
                                    ) : (
                                      <li className="text-sm text-violet-900">Sem sugestoes de implementacao no momento.</li>
                                    )}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">Relatorios Completos</h3>
                              <p className="text-sm text-gray-600">
                                Visao consolidada de vendas com exportacao CSV por periodo.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {[
                                { key: '7d' as const, label: '7 dias' },
                                { key: '30d' as const, label: '30 dias' },
                                { key: 'month' as const, label: 'Mes atual' }
                              ].map((option) => (
                                <button
                                  key={option.key}
                                  type="button"
                                  onClick={() => setMarketingReportRange(option.key)}
                                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                                    marketingReportRange === option.key
                                      ? 'border-slate-900 bg-slate-100 text-slate-900'
                                      : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            {(orderMessagesAiTips.length > 0 || orderMessagesAiTone) && (
                              <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Sugestao de configuracao da IA</p>
                                {orderMessagesAiTone ? (
                                  <p className="mt-1 text-xs text-emerald-900">
                                    <span className="font-semibold">Tom recomendado:</span> {orderMessagesAiTone}
                                  </p>
                                ) : null}
                                {orderMessagesAiTips.length > 0 ? (
                                  <ul className="mt-2 space-y-1 text-xs text-emerald-900">
                                    {orderMessagesAiTips.slice(0, 6).map((tip, index) => (
                                      <li key={`${tip}-${index}`}>- {tip}</li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                            )}
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-500">Pedidos</p>
                              <p className="mt-1 text-xl font-bold text-gray-900">{marketingReportSummary.totalOrders}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-500">Vendas</p>
                              <p className="mt-1 text-xl font-bold text-gray-900">{moneyFormatter.format(marketingReportSummary.totalSales)}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-500">Ticket Medio</p>
                              <p className="mt-1 text-xl font-bold text-gray-900">{moneyFormatter.format(marketingReportSummary.avgTicket)}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                              <p className="text-xs uppercase tracking-wide text-gray-500">Descontos</p>
                              <p className="mt-1 text-xl font-bold text-gray-900">{moneyFormatter.format(marketingReportSummary.totalDiscount)}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <div className="rounded-xl border border-gray-200 p-4">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-base font-semibold text-gray-900">Pagamentos e Resumo Diario</h4>
                                <button
                                  type="button"
                                  onClick={exportMarketingOrdersReportCsv}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Exportar Pedidos CSV
                                </button>
                              </div>
                              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                                <div className="rounded-lg bg-slate-100 px-3 py-2 text-center">
                                  <p className="text-xs text-gray-500">PIX</p>
                                  <p className="font-semibold text-gray-900">{marketingReportSummary.ordersByPayment.pix}</p>
                                </div>
                                <div className="rounded-lg bg-slate-100 px-3 py-2 text-center">
                                  <p className="text-xs text-gray-500">Cartao</p>
                                  <p className="font-semibold text-gray-900">{marketingReportSummary.ordersByPayment.card}</p>
                                </div>
                                <div className="rounded-lg bg-slate-100 px-3 py-2 text-center">
                                  <p className="text-xs text-gray-500">Dinheiro</p>
                                  <p className="font-semibold text-gray-900">{marketingReportSummary.ordersByPayment.money}</p>
                                </div>
                              </div>
                              <div className="mt-4 max-h-56 overflow-auto rounded-lg border border-gray-200">
                                <table className="w-full text-sm">
                                  <thead className="sticky top-0 bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs text-gray-500">Data</th>
                                      <th className="px-3 py-2 text-right text-xs text-gray-500">Pedidos</th>
                                      <th className="px-3 py-2 text-right text-xs text-gray-500">Vendas</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {marketingReportSummary.dailyRows.length ? marketingReportSummary.dailyRows.map((row) => (
                                      <tr key={row.date} className="border-t border-gray-100">
                                        <td className="px-3 py-2 text-gray-700">{row.date}</td>
                                        <td className="px-3 py-2 text-right font-medium text-gray-900">{row.orders}</td>
                                        <td className="px-3 py-2 text-right font-medium text-gray-900">{moneyFormatter.format(row.sales)}</td>
                                      </tr>
                                    )) : (
                                      <tr>
                                        <td colSpan={3} className="px-3 py-6 text-center text-sm text-gray-500">
                                          Sem pedidos no periodo selecionado.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-4">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="text-base font-semibold text-gray-900">Produtos (Top Receita / Volume)</h4>
                                <button
                                  type="button"
                                  onClick={exportMarketingProductsReportCsv}
                                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Exportar Produtos CSV
                                </button>
                              </div>
                              <div className="mt-4 space-y-2 max-h-72 overflow-auto">
                                {marketingReportSummary.topProducts.length ? marketingReportSummary.topProducts.map((item, index) => (
                                  <div key={`${item.productId}_${index}`} className="rounded-lg border border-gray-200 px-3 py-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                      <span className="text-xs text-gray-500">{item.qty} un</span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-900 font-medium">
                                      Receita: {moneyFormatter.format(item.revenue)}
                                    </p>
                                  </div>
                                )) : (
                                  <p className="text-sm text-gray-500">Sem vendas no periodo selecionado.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {marketingSection === 'performance' && (
                      <>
                        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                          <div className="border-b border-gray-100 px-4 py-3">
                            <h3 className="text-xl font-semibold text-gray-900">Campeoes de Venda (Curva A)</h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-sm">
                              <thead className="bg-slate-100 text-slate-900">
                                <tr>
                                  <th className="px-4 py-3 text-left">Ranking</th>
                                  <th className="px-4 py-3 text-left">Produto</th>
                                  <th className="px-4 py-3 text-right">Qtd. Vendida</th>
                                  <th className="px-4 py-3 text-right">Receita Gerada</th>
                                </tr>
                              </thead>
                              <tbody>
                                {topProducts.slice(0, 5).map((product, index) => (
                                  <tr key={product.id} className="border-t border-gray-100">
                                    <td className="px-4 py-3 font-semibold text-gray-700">{index + 1}o</td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-3">
                                        <img src={product.imageUrl} alt={product.name} className="h-10 w-10 rounded-lg object-cover" />
                                        <div>
                                          <p className="font-semibold text-gray-900">{product.name}</p>
                                          <p className="text-xs text-gray-500">{moneyFormatter.format(product.price)}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 text-right font-semibold text-gray-900">{product.soldQuantity}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                                      {moneyFormatter.format(product.revenue)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
                          <h4 className="text-lg font-semibold text-slate-900">Oportunidades (Menos Vendidos)</h4>
                          <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                            {leastSoldProducts.map((product) => (
                              <div key={product.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <p className="text-sm font-semibold text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-600">
                                  Vendidos: {product.soldQuantity} | Receita: {moneyFormatter.format(product.revenue)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-xl border border-violet-200 bg-white p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">Sugestao de Campanha com IA</h4>
                              <p className="text-sm text-gray-600">
                                Usa itens menos vendidos + horarios fracos para sugerir campanha, banner e mensagem.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void requestAiCampaignSuggestion()}
                              disabled={campaignAiLoading}
                              className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                            >
                              {campaignAiLoading ? 'Gerando...' : 'Sugerir campanha com IA'}
                            </button>
                          </div>

                          {campaignAiSuggestion && (
                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                              <div className="rounded-xl border border-gray-200 p-4 space-y-3">
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-gray-500">Nome da campanha</p>
                                  <p className="text-base font-semibold text-gray-900">{campaignAiSuggestion.campaignName}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-gray-500">Periodo sugerido</p>
                                  <p className="text-sm text-gray-800">{campaignAiSuggestion.period}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-gray-500">Cupom sugerido</p>
                                  <p className="text-sm font-mono text-gray-900">{campaignAiSuggestion.couponSuggestion}</p>
                                </div>
                                <div>
                                  <p className="text-xs uppercase tracking-wide text-gray-500">Motivo da estrategia</p>
                                  <p className="text-sm text-gray-700">{campaignAiSuggestion.strategyReason}</p>
                                </div>
                                <div className="pt-1">
                                  <button
                                    type="button"
                                    onClick={applyAiSuggestionToCampaignForm}
                                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    Aplicar como nova campanha
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-3">
                                <div className="rounded-xl border border-gray-200 p-4">
                                  <p className="text-xs uppercase tracking-wide text-gray-500">Texto para banner</p>
                                  <p className="mt-2 text-base font-semibold text-gray-900">{campaignAiSuggestion.bannerHeadline}</p>
                                  <p className="mt-1 text-sm text-gray-600">{campaignAiSuggestion.bannerDescription}</p>
                                </div>
                                <div className="rounded-xl border border-gray-200 p-4">
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-xs uppercase tracking-wide text-gray-500">Mensagem para WhatsApp</p>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(campaignAiSuggestion.whatsappMessage)}
                                      className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                    >
                                      Copiar
                                    </button>
                                  </div>
                                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{campaignAiSuggestion.whatsappMessage}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {marketingSection === 'tools' && (
                      <>
                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                          <div className="flex flex-col gap-5 lg:flex-row">
                            <div className="flex w-full flex-col items-center lg:w-[240px]">
                              <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                                <img
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(marketingLink)}&color=${marketingQrColor}&bgcolor=ffffff`}
                                  alt="QR Code do cardapio"
                                  className="h-40 w-40 rounded-lg"
                                />
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                {[
                                  { value: '000000', className: 'bg-black' },
                                  { value: 'ef4444', className: 'bg-red-400' },
                                  { value: '22c55e', className: 'bg-green-500' },
                                  { value: '3b82f6', className: 'bg-blue-500' },
                                  { value: 'a855f7', className: 'bg-purple-500' }
                                ].map((option) => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setMarketingQrColor(option.value)}
                                    className={`h-6 w-6 rounded-full border-2 transition ${
                                      marketingQrColor === option.value ? 'border-slate-900 scale-110' : 'border-transparent'
                                    } ${option.className}`}
                                    title={`Cor ${option.value}`}
                                  />
                                ))}
                              </div>
                            </div>

                            <div className="flex-1 space-y-3">
                              <h3 className="flex items-center gap-2 text-2xl font-semibold text-gray-900">
                                <Share2 size={20} /> Seu Cardapio Digital
                              </h3>
                              <p className="text-sm text-gray-600">
                                Este e o endereco principal da sua loja. Compartilhe em todas as redes sociais.
                              </p>
                              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Link Direto</label>
                              <div className="flex items-center gap-2">
                                <input
                                  readOnly
                                  value={marketingLink}
                                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => navigator.clipboard.writeText(marketingLink)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-50"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigateToExternalLink(marketingLink)}
                                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-50"
                                >
                                  <ExternalLink size={16} />
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <a
                                  href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(marketingLink)}&color=${marketingQrColor}&bgcolor=ffffff`}
                                  download="qrcode-cardapio.png"
                                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black"
                                >
                                  <Printer size={14} /> Baixar QR Code
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigateToExternalLink(
                                      `https://wa.me/?text=${encodeURIComponent(`Confira nosso cardapio: ${marketingLink}`)}`
                                    )
                                  }
                                  className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                                >
                                  <MessageCircle size={14} /> Enviar no WhatsApp
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-5">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">Impulsao de ADS com IA</h3>
                              <p className="mt-1 text-sm text-gray-600">
                                Gere um plano pratico de anuncios para Instagram/Meta com publico, copy e checklist de implementacao.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={requestAiAdsAssistantPlan}
                              disabled={adsAiLoading}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <Megaphone size={14} />
                              {adsAiLoading ? 'Gerando...' : 'Gerar plano de ADS'}
                            </button>
                          </div>

                          {adsAiPlan && (
                            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                              <div className="space-y-4">
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Estrategia sugerida</p>
                                  <p className="mt-2 text-base font-semibold text-gray-900">{adsAiPlan.campaignName}</p>
                                  <p className="mt-1 text-xs font-medium text-blue-700">Periodo sugerido: {adsAiPlan.suggestedPeriod}</p>
                                  <p className="mt-2 text-lg font-semibold text-gray-900">{adsAiPlan.campaignObjective}</p>
                                  <p className="mt-1 text-sm text-gray-700">{adsAiPlan.reason}</p>
                                </div>

                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Publico alvo</p>
                                    <p className="mt-1 text-sm font-medium text-gray-900">{adsAiPlan.targetAudience}</p>
                                  </div>
                                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Raio sugerido</p>
                                    <p className="mt-1 text-sm font-medium text-gray-900">{adsAiPlan.recommendedRadiusKm} km</p>
                                  </div>
                                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Orcamento diario</p>
                                    <p className="mt-1 text-sm font-medium text-gray-900">{adsAiPlan.dailyBudgetSuggestion}</p>
                                  </div>
                                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Canais</p>
                                    <p className="mt-1 text-sm font-medium text-gray-900">{adsAiPlan.channels.join(', ')}</p>
                                  </div>
                                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Cupom sugerido</p>
                                    <p className="mt-1 text-sm font-medium text-gray-900">{adsAiPlan.couponSuggestion}</p>
                                    <p className="mt-1 text-xs text-gray-600">{adsAiPlan.couponDiscountHint}</p>
                                  </div>
                                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Texto de banner</p>
                                    <p className="mt-1 text-sm font-semibold text-gray-900">{adsAiPlan.bannerHeadline}</p>
                                    <p className="mt-1 text-xs text-gray-600">{adsAiPlan.bannerDescription}</p>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Copy principal</p>
                                      <p className="mt-2 text-sm whitespace-pre-wrap text-gray-800">{adsAiPlan.adCopyPrimary}</p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(adsAiPlan.adCopyPrimary)}
                                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-slate-700 hover:bg-gray-50"
                                      title="Copiar copy"
                                    >
                                      <Copy size={15} />
                                    </button>
                                  </div>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Variacoes de anuncio</p>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(adsAiPlan.adCopyVariants.join('\n\n'))}
                                      className="text-xs font-semibold text-slate-900 hover:underline"
                                    >
                                      Copiar variacoes
                                    </button>
                                  </div>
                                  <div className="mt-3 space-y-2">
                                    {adsAiPlan.adCopyVariants.map((variant, index) => (
                                      <div key={`${index}-${variant}`} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-800">
                                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Variacao {index + 1}</p>
                                        <p className="whitespace-pre-wrap">{variant}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Criativo sugerido</p>
                                  <p className="mt-2 text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">Headline:</span> {adsAiPlan.headline}
                                  </p>
                                  <p className="mt-1 text-sm text-gray-700">
                                    <span className="font-semibold text-gray-900">CTA:</span> {adsAiPlan.cta}
                                  </p>
                                </div>

                                <div className="rounded-xl border border-gray-200 bg-white p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Checklist de implementacao</p>
                                    <button
                                      type="button"
                                      onClick={() => navigator.clipboard.writeText(adsAiPlan.implementationChecklist.map((item, i) => `${i + 1}. ${item}`).join('\n'))}
                                      className="text-xs font-semibold text-slate-900 hover:underline"
                                    >
                                      Copiar checklist
                                    </button>
                                  </div>
                                  <ol className="mt-3 space-y-2">
                                    {adsAiPlan.implementationChecklist.map((item, index) => (
                                      <li key={`${index}-${item}`} className="flex items-start gap-2 text-sm text-gray-800">
                                        <span className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full bg-slate-900 text-[11px] font-semibold text-white">
                                          {index + 1}
                                        </span>
                                        <span>{item}</span>
                                      </li>
                                    ))}
                                  </ol>
                                </div>

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Rastreamento / Medicao</p>
                                  <p className="mt-2 text-sm text-emerald-900 whitespace-pre-wrap">{adsAiPlan.trackingSuggestion}</p>
                                </div>

                                <button
                                  type="button"
                                  onClick={applyAdsAiPlanToCampaignForm}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-gray-50"
                                >
                                  <Plus size={14} /> Aplicar como campanha
                                </button>
                                <button
                                  type="button"
                                  onClick={applyAdsAiPlanToBannerForm}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-gray-50"
                                >
                                  <ImageIcon size={14} /> Preencher novo banner
                                </button>
                                <button
                                  type="button"
                                  onClick={applyAdsAiPlanToCouponForm}
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-gray-50"
                                >
                                  <TicketPercent size={14} /> Criar/editar cupom sugerido
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    navigateToExternalLink(
                                      `https://wa.me/?text=${encodeURIComponent(
                                        `Plano de ADS sugerido para ${restaurant?.name ?? 'minha loja'}:\n\nObjetivo: ${adsAiPlan.campaignObjective}\nPublico: ${adsAiPlan.targetAudience}\nOrcamento: ${adsAiPlan.dailyBudgetSuggestion}\nHeadline: ${adsAiPlan.headline}\nCTA: ${adsAiPlan.cta}\n\nLink: ${marketingLink}`
                                      )}`
                                    )
                                  }
                                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-white hover:bg-green-600"
                                >
                                  <MessageCircle size={14} /> Compartilhar plano no WhatsApp
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">Historico de planos de ADS IA</p>
                                <p className="text-xs text-gray-500">Ultimos planos gerados para reutilizar e comparar estrategias.</p>
                              </div>
                              <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-gray-600">
                                {adsAiHistory.length} itens
                              </span>
                            </div>
                            {adsAiHistory.length ? (
                              <div className="mt-3 space-y-2">
                                {adsAiHistory.slice(0, 6).map((item) => (
                                  <div
                                    key={item.id}
                                    className="rounded-lg border border-gray-200 bg-white p-3"
                                  >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                      <div>
                                        <p className="text-sm font-semibold text-gray-900">{item.campaignName}</p>
                                        <p className="text-xs text-gray-500">
                                          {new Date(item.createdAt).toLocaleString('pt-BR')} • {item.suggestedPeriod || 'Sem periodo'}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-700">
                                          {item.campaignObjective} • {item.dailyBudgetSuggestion}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => restoreAdsAiPlanFromHistory(item)}
                                          className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-gray-50"
                                        >
                                          Reabrir plano
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => removeAdsAiHistoryItem(item.id)}
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-white text-red-500 hover:bg-red-50"
                                          title="Excluir historico"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="mt-3 text-xs text-gray-500">Nenhum plano de ADS gerado ainda.</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <h3 className="mb-3 text-xl font-semibold text-gray-900">Criadores de Conteudo</h3>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <button
                              type="button"
                              onClick={openFlyerOffers}
                              className="rounded-xl border border-gray-200 bg-white p-6 text-center hover:bg-gray-50"
                            >
                              <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                                <Megaphone size={22} />
                              </span>
                              <p className="text-xl font-semibold text-gray-900">Criador de Stories</p>
                              <p className="mt-1 text-sm text-gray-600">Crie imagens profissionais de promocao de produtos.</p>
                              <p className="mt-3 text-sm font-semibold text-slate-900">Criar Flyer ?</p>
                            </button>

                            <button
                              type="button"
                              onClick={openBioLinkBuilder}
                              className="rounded-xl border border-gray-200 bg-white p-6 text-center hover:bg-gray-50"
                            >
                              <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-500">
                                <Smartphone size={22} />
                              </span>
                              <p className="text-xl font-semibold text-gray-900">Bio Link para Instagram</p>
                              <p className="mt-1 text-sm text-gray-600">Crie e publique seu bio link oficial da loja.</p>
                              <p className="mt-3 text-sm font-semibold text-purple-600">Criar Bio Link ?</p>
                            </button>

                            <button
                              type="button"
                              onClick={openReviewRequestCard}
                              className="rounded-xl border border-gray-200 bg-white p-6 text-center hover:bg-gray-50"
                            >
                              <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <Star size={22} />
                              </span>
                              <p className="text-xl font-semibold text-gray-900">Pedir Avaliacoes</p>
                              <p className="mt-1 text-sm text-gray-600">Gere um card com QR Code para conseguir 5 estrelas no Google.</p>
                              <p className="mt-3 text-sm font-semibold text-blue-600">Criar Card ?</p>
                            </button>

                            <button
                              type="button"
                              onClick={openDeliveryPamphlet}
                              className="rounded-xl border border-gray-200 bg-white p-6 text-center hover:bg-gray-50"
                            >
                              <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-red-500">
                                <TicketPercent size={22} />
                              </span>
                              <p className="text-xl font-semibold text-gray-900">Panfleto de Entrega</p>
                              <p className="mt-1 text-sm text-gray-600">Imprima cartoes de agradecimento com cupom para a sacola.</p>
                              <p className="mt-3 text-sm font-semibold text-red-500">Gerar ?</p>
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {marketingSection === 'offers' && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">Ofertas no Cardapio (De por)</h3>
                              <p className="text-sm text-gray-500">
                                Defina preco promocional por item. No cardapio aparece selo de oferta e preco "de/por".
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative w-full sm:w-72">
                                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                  value={marketingOfferQuery}
                                  onChange={(event) => setMarketingOfferQuery(event.target.value)}
                                  className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm"
                                  placeholder="Buscar item..."
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => void persistMarketingOffers()}
                                disabled={marketingOffersSaving}
                                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                              >
                                <Save size={14} />
                                {marketingOffersSaving ? 'Salvando...' : 'Salvar ofertas'}
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4 overflow-x-auto">
                          <table className="w-full min-w-[760px] text-sm">
                            <thead className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
                              <tr>
                                <th className="px-3 py-3">Item</th>
                                <th className="px-3 py-3">Preco Atual (De)</th>
                                <th className="px-3 py-3">Ativar Oferta</th>
                                <th className="px-3 py-3">Preco Promocional (Por)</th>
                                <th className="px-3 py-3">Preview</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {marketingOfferProducts.map((product) => {
                                const draft = marketingOfferDrafts[product.id] ?? {
                                  enabled: Boolean(product.offerEnabled),
                                  offerPrice: product.offerPrice && product.offerPrice > 0 ? String(product.offerPrice) : ''
                                };
                                const basePrice = Number(product.price) || 0;
                                const previewOffer = parsePriceInput(draft.offerPrice);
                                const validOffer = draft.enabled && previewOffer > 0 && previewOffer < basePrice;
                                return (
                                  <tr key={product.id}>
                                    <td className="px-3 py-3">
                                      <p className="font-semibold text-gray-900">{product.name}</p>
                                      <p className="text-xs text-gray-500">{product.kind ?? 'padrao'}</p>
                                    </td>
                                    <td className="px-3 py-3 font-semibold text-gray-900">R$ {basePrice.toFixed(2)}</td>
                                    <td className="px-3 py-3">
                                      <label className="inline-flex items-center gap-2 text-gray-700">
                                        <input
                                          type="checkbox"
                                          checked={draft.enabled}
                                          onChange={(event) =>
                                            setMarketingOfferDrafts((prev) => ({
                                              ...prev,
                                              [product.id]: { ...draft, enabled: event.target.checked }
                                            }))
                                          }
                                        />
                                        Ativo
                                      </label>
                                    </td>
                                    <td className="px-3 py-3">
                                      <input
                                        value={draft.offerPrice}
                                        onChange={(event) =>
                                          setMarketingOfferDrafts((prev) => ({
                                            ...prev,
                                            [product.id]: { ...draft, offerPrice: event.target.value }
                                          }))
                                        }
                                        className="w-36 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                        placeholder="Ex: 19,90"
                                        disabled={!draft.enabled}
                                      />
                                    </td>
                                    <td className="px-3 py-3">
                                      {validOffer ? (
                                        <p className="text-xs">
                                          <span className="mr-2 rounded bg-red-100 px-2 py-0.5 font-semibold text-red-700">OFERTA</span>
                                          <span className="mr-1 text-gray-400 line-through">R$ {basePrice.toFixed(2)}</span>
                                          <span className="font-bold text-emerald-700">R$ {previewOffer.toFixed(2)}</span>
                                        </p>
                                      ) : draft.enabled ? (
                                        <p className="text-xs text-amber-600">Informe um valor menor que o preco atual.</p>
                                      ) : (
                                        <p className="text-xs text-gray-400">Sem oferta</p>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                              {!marketingOfferProducts.length && (
                                <tr>
                                  <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                                    Nenhum item encontrado.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {marketingSection === 'campaigns' && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">Campanhas de Marketing</h3>
                              <p className="text-sm text-gray-500">Crie campanhas para organizar cupons, periodos e objetivos.</p>
                            </div>
                            <button
                              onClick={openCreateCampaignModal}
                              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                            >
                              <Plus size={14} />
                              Nova Campanha
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-sm text-gray-600">Total de Campanhas</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">{marketingCampaigns.length}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 bg-white p-4">
                            <p className="text-sm text-gray-600">Campanhas Ativas</p>
                            <p className="mt-1 text-3xl font-bold text-slate-900">
                              {marketingCampaigns.filter((item) => item.active).length}
                            </p>
                          </div>
                          <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-sm text-gray-600">Ultima Atualizacao</p>
                            <p className="mt-1 text-sm font-semibold text-gray-900">
                              {marketingCampaigns[0]?.createdAt
                                ? new Date(marketingCampaigns[0].createdAt).toLocaleString('pt-BR')
                                : 'Sem campanhas'}
                            </p>
                          </div>
                        </div>

                        {marketingCampaigns.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                            {marketingCampaigns.map((campaign) => (
                              <div key={campaign.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="text-lg font-semibold text-gray-900">{campaign.name}</h4>
                                    <p className="text-xs text-gray-500">
                                      Criada em {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                                    </p>
                                  </div>
                                  <span
                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                      campaign.active ? 'bg-slate-100 text-slate-900' : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {campaign.active ? 'Ativa' : 'Inativa'}
                                  </span>
                                </div>

                                <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                                  <p>
                                    <span className="font-semibold">Cupons:</span>{' '}
                                    {(campaign.couponCodes?.length
                                      ? campaign.couponCodes.join(', ')
                                      : campaign.couponCode || 'Nao informado')}
                                  </p>
                                  <p className="mt-1">
                                    <span className="font-semibold">Periodo:</span> {campaign.period || 'Nao informado'}
                                  </p>
                                  <p className="mt-1">
                                    <span className="font-semibold">Banners vinculados:</span> {campaign.bannerIds?.length ?? 0}
                                  </p>
                                  <p className="mt-1">
                                    <span className="font-semibold">Cliques:</span> {campaign.clicks ?? 0}
                                    {' • '}
                                    <span className="font-semibold">Pedidos atrib.:</span> {campaign.attributedOrders ?? 0}
                                  </p>
                                  {(campaign.startDate || campaign.endDate) && (
                                    <p className="mt-1">
                                      <span className="font-semibold">Calendario:</span>{' '}
                                      {campaign.startDate || '--'} ate {campaign.endDate || '--'}
                                      {campaign.autoActivateByCalendar ? ' (auto)' : ''}
                                    </p>
                                  )}
                                  {restaurant?.slug ? (
                                    <div className="mt-2 rounded-md border border-gray-200 bg-white p-2">
                                      <p className="text-[11px] text-gray-500">Link de campanha</p>
                                      <div className="mt-1 flex items-center gap-2">
                                        <input
                                          readOnly
                                          value={`https://pedezap.site/r/${restaurant.slug}?${new URLSearchParams(
                                            Object.fromEntries(
                                              Object.entries({
                                                cupom:
                                                  campaign.targetCouponCode ||
                                                  campaign.couponCodes?.[0] ||
                                                  campaign.couponCode ||
                                                  '',
                                                campaign: campaign.id,
                                                pz_src: 'campaign_link',
                                                utm_source: campaign.utmSource || '',
                                                utm_medium: campaign.utmMedium || '',
                                                utm_campaign: campaign.utmCampaign || '',
                                                utm_content: campaign.utmContent || ''
                                              }).filter(([, v]) => !!String(v).trim())
                                            )
                                          ).toString()}`}
                                          className="w-full rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const qs = new URLSearchParams(
                                              Object.fromEntries(
                                                Object.entries({
                                                  cupom:
                                                    campaign.targetCouponCode ||
                                                    campaign.couponCodes?.[0] ||
                                                    campaign.couponCode ||
                                                    '',
                                                  campaign: campaign.id,
                                                  pz_src: 'campaign_link',
                                                  utm_source: campaign.utmSource || '',
                                                  utm_medium: campaign.utmMedium || '',
                                                  utm_campaign: campaign.utmCampaign || '',
                                                  utm_content: campaign.utmContent || ''
                                                }).filter(([, v]) => !!String(v).trim())
                                              )
                                            );
                                            void navigator.clipboard.writeText(
                                              `https://pedezap.site/r/${restaurant.slug}?${qs.toString()}`
                                            );
                                            setMessage('Link de campanha copiado.');
                                          }}
                                          className="rounded border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700 hover:bg-gray-50"
                                        >
                                          Copiar
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>

                                <div className="mt-4 flex items-center gap-2">
                                  <button
                                    onClick={() => toggleCampaignActive(campaign.id)}
                                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                                      campaign.active
                                        ? 'border border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
                                        : 'border border-slate-200 bg-slate-100 text-slate-900 hover:bg-slate-100'
                                    }`}
                                  >
                                    {campaign.active ? 'Pausar' : 'Ativar'}
                                  </button>
                                  <button
                                    onClick={() => openEditCampaignModal(campaign)}
                                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    onClick={() => removeCampaign(campaign.id)}
                                    className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                  >
                                    Remover
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                              <Megaphone size={20} className="text-gray-500" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900">Nenhuma campanha criada</h3>
                            <p className="mt-1 text-sm text-gray-500">Crie sua primeira campanha para organizar suas acoes.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'support' && (
              <section className="mx-auto max-w-5xl space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
                  <p className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-1000" />
                    Todos os sistemas operacionais
                  </p>
                  <button className="text-xs text-slate-800 hover:text-slate-900">Ver historico</button>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_2fr]">
                  <div className="space-y-4">
                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <h3 className="text-2xl font-semibold text-gray-900">Fale Conosco</h3>
                      </div>
                      <div className="p-4 space-y-3">
                        <button
                          onClick={openSupportChat}
                          disabled={supportOpening}
                          className="w-full rounded-lg bg-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-900 inline-flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                          <MessageSquare size={15} />
                          {supportOpening ? 'Abrindo...' : 'Abrir chamado'}
                        </button>
                        <a
                          href="mailto:support@pedezap.site?subject=Suporte%20PedeZap%20-%20Painel%20Restaurante"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 inline-flex items-center justify-center gap-2"
                        >
                          <Mail size={15} />
                          Enviar Email
                        </a>
                        <p className="pt-1 text-center text-xs text-gray-400">Seg a Sex, das 09h as 18h</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                      <div className="border-b border-gray-100 px-4 py-3">
                        <h3 className="text-2xl font-semibold text-gray-900">Tutoriais em Video</h3>
                      </div>
                      <div className="p-4 space-y-4">
                        {tutorialItems.map((item) => (
                          <button
                            key={item}
                            className="w-full text-left inline-flex items-center gap-3 text-sm text-gray-700 hover:text-gray-900"
                          >
                            <PlayCircle size={18} className="text-red-500" />
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <h3 className="text-2xl font-semibold text-gray-900">Perguntas Frequentes</h3>
                    </div>
                    <div className="p-4">
                      {faqItems.map((question, index) => (
                        <button
                          key={question}
                          className={`w-full py-4 text-left flex items-center justify-between gap-3 ${
                            index !== faqItems.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <span className="text-sm font-medium text-gray-800">{question}</span>
                          <ChevronDown size={16} className="text-gray-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

                        {activeTab === 'plans' && (
              <section className="mx-auto max-w-5xl space-y-5">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-black p-6 text-white shadow-lg">
                  <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full border border-slate-300/40" />
                  <div className="absolute right-10 top-0 h-full w-20 -skew-x-12 bg-slate-400/20" />
                  <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-full bg-white/15 flex items-center justify-center">
                        <ShieldCheck size={30} />
                      </div>
                      <div>
                        <h2 className="text-4xl font-bold leading-none">
                          {subscriptionSummary?.status === 'trial' ? 'Periodo de Teste Ativo' : 'Gestao da Assinatura'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-300">
                          {subscriptionSummary?.status === 'trial'
                            ? `Voce tem ${subscriptionSummary.trialDaysLeft} dia(s) gratis restantes.`
                            : 'Selecione um plano e gerencie sua renovacao com a Stripe.'}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-white/20 bg-white/10 px-5 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-slate-300 font-semibold">Status</p>
                      <p className="mt-1 text-2xl font-bold">{subscriptionStatusLabel}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_1fr]">
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h3 className="text-xl font-semibold text-gray-900">Plano Atual</h3>
                    {currentSubscribedPlan ? (
                      <div className="mt-4 space-y-4">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-lg font-bold text-gray-900">{currentSubscribedPlan.name}</p>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${subscriptionStatusTone}`}>
                              {subscriptionStatusLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">{currentSubscribedPlan.description}</p>
                          <p className="mt-3 text-lg font-bold text-gray-900">
                            {moneyFormatter.format(currentSubscribedPlan.price)} <span className="text-xs text-gray-500">/mes</span>
                          </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {currentSubscribedPlan.features.map((feature) => (
                            <div
                              key={feature}
                              className="rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm font-medium text-gray-700 flex items-center gap-2"
                            >
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-100 text-slate-800 text-xs">
                                ok
                              </span>
                              {feature}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-100 p-4 text-sm text-slate-800">
                        Nenhum plano ativo no momento. Escolha um plano abaixo para efetuar a contratacao.
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5">
                      <h3 className="text-xl font-semibold text-gray-900">Faturamento</h3>
                      <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold">Proxima renovacao</p>
                        <p className="mt-2 text-base font-bold text-gray-900">
                          {subscriptionSummary?.nextBillingAt
                            ? new Date(subscriptionSummary.nextBillingAt).toLocaleDateString('pt-BR')
                            : 'A definir'}
                        </p>
                      </div>
                      {subscriptionSummary?.trialEndsAt && subscriptionSummary.status === 'trial' && (
                        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-100 p-4">
                          <p className="text-[11px] uppercase tracking-wide text-slate-700 font-semibold">Fim do teste gratis</p>
                          <p className="mt-2 text-base font-bold text-slate-900">
                            {new Date(subscriptionSummary.trialEndsAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-4 text-xs text-slate-800">
                      Pagamentos e renovacoes sao processados pela Stripe.
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold text-gray-900">Planos Disponiveis</h3>
                    {plansLoading && <span className="text-xs text-gray-500">Carregando...</span>}
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {availablePlans.map((plan) => {
                      const isCurrent = subscriptionSummary?.subscribedPlanId === plan.id;
                      const actionLabel =
                        subscriptionSummary?.status === 'active' && isCurrent
                          ? 'Plano Atual'
                          : subscriptionSummary?.status === 'active'
                            ? 'Renovar Assinatura'
                            : 'Efetuar Contratacao';
                      return (
                        <div key={plan.id} className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                          <div className="h-1.5" style={{ backgroundColor: plan.color }} />
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-lg font-bold text-gray-900">{plan.name}</p>
                              {isCurrent && (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-900">
                                  Atual
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                            <p className="mt-3 text-2xl font-black text-gray-900">
                              {moneyFormatter.format(plan.price)} <span className="text-xs font-medium text-gray-500">/mes</span>
                            </p>
                            <div className="mt-3 space-y-1">
                              {plan.features.slice(0, 4).map((feature) => (
                                <p key={`${plan.id}_${feature}`} className="text-xs text-gray-600">
                                  - {feature}
                                </p>
                              ))}
                            </div>
                            <button
                              disabled={planCheckoutLoadingId === plan.id || (subscriptionSummary?.status === 'active' && isCurrent)}
                              onClick={() => handleStartPlanCheckout(plan.id)}
                              className="mt-4 w-full rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-60"
                            >
                              {planCheckoutLoadingId === plan.id ? 'Gerando checkout...' : actionLabel}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {!availablePlans.length && (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                        Nenhum plano ativo cadastrado no painel admin.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>

      <ManualOrderModal
        open={showManualOrderModal}
        form={manualOrderForm}
        setForm={setManualOrderForm}
        selectedProductId={manualSelectedProductId}
        setSelectedProductId={setManualSelectedProductId}
        selectedQuantity={manualSelectedQuantity}
        setSelectedQuantity={setManualSelectedQuantity}
        products={manualOrderProducts}
        total={manualOrderTotal}
        creating={creatingManualOrder}
        onClose={() => {
          setShowManualOrderModal(false);
          setManualOrderForm(createDefaultManualOrderForm());
          setManualSelectedProductId('');
          setManualSelectedQuantity(1);
        }}
        onAddItem={addItemToManualOrder}
        onRemoveItem={removeItemFromManualOrder}
        onCreate={createManualOrder}
      />

      {showSupportChat && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl h-[80vh] rounded-2xl border border-gray-200 bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Chat de Suporte</h3>
                <p className="text-xs text-gray-500">
                  {supportTicket ? `Chamado #${supportTicket.id} - ${supportTicket.status}` : 'Abrindo chamado...'}
                </p>
              </div>
              <button
                onClick={() => setShowSupportChat(false)}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Fechar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:18px_18px]">
              {supportError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">{supportError}</p>
              )}
              {!supportMessages.length && !supportOpening && (
                <p className="text-sm text-gray-500">Escreva sua primeira mensagem para abrir o atendimento.</p>
              )}
              {supportMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.authorRole === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow ${
                      msg.authorRole === 'customer'
                        ? 'bg-black text-white'
                        : 'bg-white border border-gray-200 text-gray-700'
                    }`}
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
                              msg.authorRole === 'customer'
                                ? 'border-white/30 text-white/90 hover:bg-white/10'
                                : 'border-gray-200 text-slate-700 hover:bg-gray-50'
                            }`}
                          >
                            Anexo: {attachment.name}
                          </a>
                        ))}
                      </div>
                    ) : null}
                    <span className="mt-2 block text-[10px] opacity-70">
                      {msg.authorName} - {new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 p-4">
              <div className="rounded-xl border border-gray-200 p-3">
                <textarea
                  value={supportDraft}
                  onChange={(event) => setSupportDraft(event.target.value)}
                  placeholder="Descreva seu problema para o suporte..."
                  className="w-full h-24 resize-none text-sm outline-none"
                />
                {supportAttachment ? (
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    <span className="truncate pr-3">Anexo: {supportAttachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setSupportAttachment(null)}
                      className="rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Remover
                    </button>
                  </div>
                ) : null}
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <input
                      id="support-attachment-upload"
                      type="file"
                      className="hidden"
                      onChange={handleSupportAttachmentUpload}
                    />
                    <label
                      htmlFor="support-attachment-upload"
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      <Paperclip size={13} />
                      Anexar arquivo
                    </label>
                  </div>
                  <button
                    onClick={sendSupportMessage}
                    disabled={supportSending || (!supportDraft.trim() && !supportAttachment) || !supportTicket}
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:opacity-60"
                  >
                    {supportSending ? 'Enviando...' : 'Enviar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showProductForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold text-gray-900">{productForm.id ? 'Editar Produto' : 'Novo Produto'}</h3>
                <p className="text-xs text-gray-500">Preencha as informacoes abaixo</p>
              </div>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setProductForm(createDefaultProductForm(selectedCategoryId ?? ''));
                }}
                className="rounded-lg px-2 py-1 text-gray-400 hover:bg-gray-100"
              >
                x
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { key: 'padrao' as const, title: 'Padrao', subtitle: 'Lanches, Pratos, Porcoes', icon: 'PD' },
                  { key: 'pizza' as const, title: 'Pizza', subtitle: 'Sabores, Bordas, Tamanhos', icon: 'PZ' },
                  { key: 'bebida' as const, title: 'Bebida', subtitle: 'Refrigerantes, Sucos, Alcoolicos', icon: 'BB' },
                  { key: 'acai' as const, title: 'Acai', subtitle: 'Tamanhos, Frutas e Coberturas', icon: 'AC' }
                ].map((kind) => {
                  const active = productForm.kind === kind.key;
                  return (
                    <button
                      key={kind.key}
                      onClick={() => setProductForm((prev) => ({ ...prev, kind: kind.key }))}
                      className={`rounded-xl border p-4 text-left transition ${
                        active ? 'border-slate-900 bg-slate-100 shadow-sm' : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{kind.icon}</span>
                        {active && <span className="text-slate-800 text-xs font-semibold">ok</span>}
                      </div>
                      <p className="mt-2 font-semibold text-gray-900">{kind.title}</p>
                      <p className="text-[11px] text-gray-500">{kind.subtitle}</p>
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-[96px_1fr] gap-4">
                  <div className="h-24 w-24 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 bg-gray-50">
                    {productForm.imageUrl ? (
                      <img src={productForm.imageUrl} alt="Preview" className="h-full w-full object-cover rounded-lg" />
                    ) : (
                      <span className="text-xs">Upload</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500">Nome do Produto</label>
                      <input
                        value={productForm.name ?? ''}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, name: event.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder={
                          productForm.kind === 'pizza'
                            ? 'Ex: Pizza Grande (8 Fatias)'
                            : productForm.kind === 'acai'
                            ? 'Ex: Acai 500ml'
                            : 'Ex: X-Bacon'
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <label className="text-xs text-gray-500">Categoria</label>
                          <button
                            type="button"
                            onClick={openCreateCategoryForm}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
                          >
                            <Plus size={12} />
                            Nova categoria
                          </button>
                        </div>
                        <select
                          value={productForm.categoryId ?? ''}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="">Selecione</option>
                          {availableProductCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name} {!category.active ? '(Inativa)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="mt-1 text-[11px] text-slate-500">
                          Crie e gerencie categorias na lateral sem perder o que voce ja preencheu no produto.
                        </p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Imagem do Produto</label>
                        <input
                          id="product-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProductImageUpload}
                        />
                        <div className="mt-1 flex items-center gap-2">
                          <label
                            htmlFor="product-image-upload"
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {productForm.imageUrl ? 'Trocar imagem' : 'Enviar imagem'}
                          </label>
                          {productForm.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => setProductForm((prev) => ({ ...prev, imageUrl: '' }))}
                              className="inline-flex items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              Remover
                            </button>
                          ) : null}
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400">PNG, JPG ou WEBP.</p>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <label className="text-xs text-gray-500">Descricao / Ingredientes</label>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={productAiLoadingMode !== null}
                            onClick={() => void handleProductDescriptionAi('generate')}
                            className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            {productAiLoadingMode === 'generate' ? 'Gerando...' : 'Gerar com IA'}
                          </button>
                          <button
                            type="button"
                            disabled={productAiLoadingMode !== null || !productForm.description?.trim()}
                            onClick={() => void handleProductDescriptionAi('improve')}
                            className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                          >
                            {productAiLoadingMode === 'improve' ? 'Melhorando...' : 'Melhorar texto'}
                          </button>
                        </div>
                      </div>
                      <textarea
                        value={productForm.description ?? ''}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, description: event.target.value }))}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm h-20 resize-none"
                        placeholder="Descreva os detalhes deste item..."
                      />
                      <p className="mt-1 text-[11px] text-gray-400">
                        A IA usa nome, categoria e dados do item para sugerir uma descricao otimizada.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        {productForm.kind === 'pizza' ? 'Preco Base (calculado pelos sabores)' : 'Preco Base'}
                      </label>
                      <input
                        value={productForm.draftBasePrice}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, draftBasePrice: event.target.value }))}
                        disabled={productForm.kind === 'pizza'}
                        className={`w-full rounded-lg border px-3 py-2 text-sm ${
                          productForm.kind === 'pizza'
                            ? 'border-gray-200 bg-gray-100 text-gray-500'
                            : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder={productForm.kind === 'pizza' ? 'Calculado automaticamente' : 'Ex: 25,90'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {productForm.kind === 'pizza' && (
                <>
                  <div className="rounded-xl border border-slate-200">
                    <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">Sabores da Pizza</p>
                        <p className="text-[11px] text-gray-500">Adicione todos os sabores disponiveis</p>
                      </div>
                      <span className="text-[10px] rounded-full bg-slate-100 px-2 py-1 text-slate-800 font-semibold">
                        {productForm.pizzaFlavors.length} sabores
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_44px] gap-2">
                        <input
                          value={productForm.draftFlavorName}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, draftFlavorName: event.target.value }))}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Nome do sabor"
                        />
                        <input
                          value={productForm.draftFlavorIngredients}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, draftFlavorIngredients: event.target.value }))}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="Ingredientes"
                        />
                        <input
                          value={productForm.draftFlavorPrice}
                          onChange={(event) => setProductForm((prev) => ({ ...prev, draftFlavorPrice: event.target.value }))}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          placeholder="R$ 25,90"
                        />
                        <button onClick={addPizzaFlavor} className="rounded-lg bg-slate-1000 text-white hover:bg-slate-900">
                          <Plus size={16} className="mx-auto" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {productForm.pizzaFlavors.map((flavor, idx) => (
                          <div key={`${flavor.name}-${idx}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{flavor.name}</p>
                              <p className="text-xs text-gray-500">{flavor.ingredients}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-800 font-semibold">R$ {flavor.price.toFixed(2)}</span>
                              <button onClick={() => removePizzaFlavor(idx)} className="text-red-500 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                        {!productForm.pizzaFlavors.length && (
                          <div className="rounded-lg bg-gray-50 border border-gray-200 py-6 text-center text-xs text-gray-500">
                            Nenhum sabor adicionado ainda.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-200 p-4">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <input
                        type="checkbox"
                        checked={productForm.hasStuffedCrust}
                        onChange={(event) =>
                          setProductForm((prev) => ({ ...prev, hasStuffedCrust: event.target.checked }))
                        }
                      />
                      Bordas Recheadas
                    </label>
                    {productForm.hasStuffedCrust && (
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_44px] gap-2">
                          <input
                            value={productForm.draftCrustName}
                            onChange={(event) => setProductForm((prev) => ({ ...prev, draftCrustName: event.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Nome da borda (Ex: Catupiry)"
                          />
                          <input
                            value={productForm.draftCrustPrice}
                            onChange={(event) => setProductForm((prev) => ({ ...prev, draftCrustPrice: event.target.value }))}
                            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            placeholder="R$ 0,00"
                          />
                          <button onClick={addPizzaCrust} className="rounded-lg bg-slate-1000 text-white hover:bg-black">
                            <Plus size={16} className="mx-auto" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {productForm.crusts.map((crust, idx) => (
                            <div key={`${crust.name}-${idx}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{crust.name}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-slate-800 font-semibold">R$ {crust.price.toFixed(2)}</span>
                                <button onClick={() => removePizzaCrust(idx)} className="text-red-500 hover:text-red-600">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                          {!productForm.crusts.length && (
                            <div className="rounded-lg bg-gray-50 border border-gray-200 py-6 text-center text-xs text-gray-500">
                              Nenhuma borda adicionada ainda.
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {productForm.kind !== 'pizza' && (
                <div className="rounded-xl border border-gray-200">
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">Complementos opcionais</p>
                      <p className="text-[11px] text-gray-500">Itens extras que o cliente pode adicionar ao produto</p>
                    </div>
                    <span className="text-[10px] rounded-full bg-slate-100 px-2 py-1 text-slate-800 font-semibold">
                      {productForm.complements.length} itens
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_44px] gap-2">
                      <input
                        value={productForm.draftComplementName}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, draftComplementName: event.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Ex: Queijo extra"
                      />
                      <input
                        value={productForm.draftComplementPrice}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, draftComplementPrice: event.target.value }))}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        placeholder="R$ 0,00"
                      />
                      <button onClick={addProductComplement} className="rounded-lg bg-slate-900 text-white hover:bg-black">
                        <Plus size={16} className="mx-auto" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {productForm.complements.map((complement, idx) => (
                        <div key={`${complement.name}-${idx}`} className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{complement.name}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-800 font-semibold">R$ {(Number(complement.price) || 0).toFixed(2)}</span>
                            <button onClick={() => removeProductComplement(idx)} className="text-red-500 hover:text-red-600">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                      {!productForm.complements.length && (
                        <div className="rounded-lg bg-gray-50 border border-gray-200 py-6 text-center text-xs text-gray-500">
                          Nenhum complemento cadastrado.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {productForm.kind === 'acai' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/40">
                  <div className="px-4 py-3 border-b border-emerald-200 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">Abas de complementos do Acai</p>
                      <p className="text-[11px] text-gray-600">Crie abas como Tamanhos, Frutas e Coberturas com regras de selecao</p>
                    </div>
                    <span className="text-[10px] rounded-full bg-white px-2 py-1 text-emerald-800 font-semibold border border-emerald-200">
                      {productForm.acaiComplementGroups.length} abas
                    </span>
                  </div>
                  <div className="p-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => addAcaiPresetGroup('Tamanhos', 1, 1)} className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100">+ Tamanhos</button>
                      <button type="button" onClick={() => addAcaiPresetGroup('Frutas', 0, 3)} className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100">+ Frutas</button>
                      <button type="button" onClick={() => addAcaiPresetGroup('Coberturas', 0, 3)} className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100">+ Coberturas</button>
                      <button type="button" onClick={() => addAcaiPresetGroup('Caldas', 0, 2)} className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100">+ Caldas</button>
                      <button type="button" onClick={() => addAcaiPresetGroup('Adicionais', 0, 2)} className="rounded-full border border-emerald-300 bg-white px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100">+ Adicionais</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[1fr_90px_90px_44px] gap-2">
                      <input
                        value={productForm.draftAcaiGroupName}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, draftAcaiGroupName: event.target.value }))}
                        className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
                        placeholder="Nome da aba (Ex: Granolas)"
                      />
                      <input
                        type="number"
                        min={0}
                        value={productForm.draftAcaiGroupMinSelect}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, draftAcaiGroupMinSelect: event.target.value }))}
                        className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
                        placeholder="Min"
                      />
                      <input
                        type="number"
                        min={0}
                        value={productForm.draftAcaiGroupMaxSelect}
                        onChange={(event) => setProductForm((prev) => ({ ...prev, draftAcaiGroupMaxSelect: event.target.value }))}
                        className="rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm"
                        placeholder="Max"
                      />
                      <button onClick={addAcaiComplementGroup} className="rounded-lg bg-emerald-700 text-white hover:bg-emerald-800">
                        <Plus size={16} className="mx-auto" />
                      </button>
                    </div>

                    <div className="space-y-3">
                      {productForm.acaiComplementGroups.map((group) => {
                        const draft = acaiDraftItemByGroup[group.id] ?? { name: '', price: '0', maxQty: '1' };
                        return (
                          <div key={group.id} className="rounded-xl border border-emerald-200 bg-white p-3 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold text-gray-900">{group.name}</p>
                                <p className="text-xs text-gray-500">Selecao: min {group.minSelect} | max {group.maxSelect}</p>
                              </div>
                              <button type="button" onClick={() => removeAcaiComplementGroup(group.id)} className="text-red-500 hover:text-red-600">
                                <Trash2 size={14} />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-[1fr_100px_100px_44px] gap-2">
                              <input
                                value={draft.name}
                                onChange={(event) =>
                                  setAcaiDraftItemByGroup((prev) => ({
                                    ...prev,
                                    [group.id]: { ...draft, name: event.target.value }
                                  }))
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Item (Ex: Banana)"
                              />
                              <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={draft.price}
                                onChange={(event) =>
                                  setAcaiDraftItemByGroup((prev) => ({
                                    ...prev,
                                    [group.id]: { ...draft, price: event.target.value }
                                  }))
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="0.00"
                              />
                              <input
                                type="number"
                                min={1}
                                value={draft.maxQty}
                                onChange={(event) =>
                                  setAcaiDraftItemByGroup((prev) => ({
                                    ...prev,
                                    [group.id]: { ...draft, maxQty: event.target.value }
                                  }))
                                }
                                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                                placeholder="Qtd max"
                              />
                              <button type="button" onClick={() => addAcaiComplementItem(group.id)} className="rounded-lg bg-emerald-700 text-white hover:bg-emerald-800">
                                <Plus size={16} className="mx-auto" />
                              </button>
                            </div>

                            <div className="space-y-2">
                              {group.items.map((item) => (
                                <div key={item.id} className="rounded-lg border border-gray-200 px-3 py-2 text-sm flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-900">{item.name}</p>
                                    <p className="text-xs text-gray-500">Max por pedido: {item.maxQty}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="text-slate-800 font-semibold">R$ {(Number(item.price) || 0).toFixed(2)}</span>
                                    <button type="button" onClick={() => removeAcaiComplementItem(group.id, item.id)} className="text-red-500 hover:text-red-600">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {!group.items.length && (
                                <div className="rounded-lg bg-gray-50 border border-gray-200 py-5 text-center text-xs text-gray-500">
                                  Nenhum item nesta aba.
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {!productForm.acaiComplementGroups.length && (
                        <div className="rounded-lg border border-dashed border-emerald-300 py-6 text-center text-xs text-gray-600 bg-white/70">
                          Nenhuma aba criada. Use os botoes rapidos ou crie uma aba personalizada.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-gray-100">
                <button onClick={() => setShowProductForm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Cancelar</button>
                <button onClick={saveProduct} className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900">Salvar Produto</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
