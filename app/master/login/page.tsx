'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';

export default function MasterLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const blocked = new URLSearchParams(window.location.search).get('blocked');
    if (blocked === '1') {
      setError('Sistema bloqueado. Entre em contato com o suporte.');
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    const response = await fetch('/api/master/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const payload = (await response.json().catch(() => null)) as
      | { success: boolean; message?: string; user?: { restaurantSlug: string; restaurantName: string; email: string } }
      | null;

    if (!response.ok || !payload?.success || !payload.user) {
      setError(payload?.message ?? 'Falha ao entrar.');
      setLoading(false);
      return;
    }

    localStorage.setItem('pedezap_master_session', JSON.stringify(payload.user));
    router.push('/master');
  }

  return (
    <div className="min-h-screen bg-[#f6f3ee] text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section
          className="relative hidden min-h-screen overflow-hidden lg:block"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(5,10,22,.42), rgba(5,10,22,.92)), url('/imgpainelloginmaster.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(16,185,129,.24),transparent_28%),radial-gradient(circle_at_86%_72%,rgba(255,255,255,.16),transparent_24%)]" />
          <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/75 to-transparent" />

          <div className="relative z-10 flex h-full min-h-screen flex-col justify-between p-12 text-white xl:p-16">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-black tracking-tight">PedeZap</p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.32em] text-emerald-300">Master Panel</p>
              </div>
            </div>

            <div className="max-w-[620px]">
              <h1 className="max-w-[560px] text-6xl font-black leading-[0.95] tracking-tight xl:text-7xl">
                Gestao inteligente para restaurantes de alta performance.
              </h1>
              <p className="mt-7 max-w-xl text-xl font-medium leading-8 text-white/80">
                Domine seus pedidos, fidelize clientes e escale sua operacao com uma central simples, rapida e preparada para crescer.
              </p>
            </div>

            <p className="text-base text-white/75">© 2026 PedeZap Enterprise.</p>
          </div>
        </section>

        <section className="flex min-h-screen items-start justify-center bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,.12),transparent_32%),linear-gradient(180deg,#fff,#f7f4ef)] px-4 py-4 sm:px-6 lg:items-center lg:px-12 lg:py-10">
          <div className="w-full max-w-[500px]">
            <div
              className="relative mb-6 overflow-hidden rounded-[28px] border border-white/20 shadow-2xl shadow-slate-300/40 lg:hidden"
              style={{
            backgroundImage:
                  "linear-gradient(135deg, rgba(5,10,22,.42), rgba(5,10,22,.86)), url('/imgpainelloginmaster.jpeg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="flex h-48 flex-col justify-between p-5 text-white">
                <div>
                  <p className="text-2xl font-black tracking-tight">PedeZap</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-300">Master</p>
                </div>
                <div>
                  <h1 className="max-w-[260px] text-3xl font-black leading-[0.95] tracking-tight">
                    Gestao inteligente para restaurantes de alta performance.
                  </h1>
                  <p className="mt-3 text-[11px] font-medium text-white/70">© 2026 PedeZap LLC</p>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-white bg-white/85 p-6 shadow-2xl shadow-slate-200/70 backdrop-blur sm:p-8 lg:border-slate-200">
              <div className="mb-8">
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-900/20">
                  <ShieldCheck size={21} />
                </div>
                <h2 className="text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Bem-vindo de volta</h2>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-600 sm:text-base">
                  Digite suas credenciais para acessar o painel administrativo do seu restaurante.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-800">Email corporativo</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                    placeholder="admin@restaurante.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-bold text-slate-800">Senha</label>
                  <a href="/master/reset-password" className="text-sm font-semibold text-slate-500 hover:text-slate-950">
                    Esqueceu?
                  </a>
                </div>
                <LockKeyhole size={16} className="mb-2 text-slate-400" />
                <input
                  type="password"
                  className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-slate-900 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="group flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 text-base font-bold text-white shadow-xl shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                disabled={loading}
              >
                {loading ? 'Entrando...' : 'Entrar no painel'}
                {!loading && <ArrowRight size={18} className="transition group-hover:translate-x-1" />}
              </button>

              <div className="flex items-center gap-3 pt-2">
                <div className="h-px flex-1 bg-slate-200" />
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">Acesso restrito</p>
                <div className="h-px flex-1 bg-slate-200" />
              </div>
              <p className="text-center text-xs leading-5 text-slate-400">
                Protegido por sessao segura, criptografia e controle de acesso do PedeZap.
              </p>
            </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
