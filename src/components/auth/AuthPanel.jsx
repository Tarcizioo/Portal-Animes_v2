import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Library,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getAuthErrorMessage } from '@/utils/authErrors';

const EMPTY_FORM = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const BENEFITS = [
  {
    icon: Library,
    title: 'Sua biblioteca, sempre com você',
    description: 'Organize o que está vendo e retome do episódio certo.',
  },
  {
    icon: Sparkles,
    title: 'Um perfil com a sua cara',
    description: 'Escolha favoritos, personalize sua vitrine e acompanhe conquistas.',
  },
  {
    icon: BookOpenCheck,
    title: 'Sua jornada fica registrada',
    description: 'Notas, progresso e estatísticas reunidos em um só lugar.',
  },
];

function AuthField({ id, icon: Icon, label, action, ...inputProps }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-black text-text-primary">
          {label}
        </label>
        {action}
      </div>
      <div className="group relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-primary" />
        <input
          id={id}
          {...inputProps}
          className="h-12 w-full rounded-xl border border-border-color bg-bg-primary/70 pl-11 pr-4 text-sm font-semibold text-text-primary outline-none transition-all placeholder:font-normal placeholder:text-text-secondary/55 focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </div>
    </div>
  );
}

export function AuthPanel({ onAuthenticated, destinationLabel }) {
  const { signInEmail, signUpEmail, resetPassword, signInGoogle } = useAuth();
  const prefix = useId();
  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (feedback?.type === 'error') setFeedback(null);
  };

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setFeedback(null);
    setShowPassword(false);
    setForm((current) => ({
      ...EMPTY_FORM,
      email: current.email,
    }));
  };

  const validate = () => {
    if (!form.email.trim()) return 'Digite seu e-mail para continuar.';

    if (mode === 'signup') {
      if (form.displayName.trim().length < 2) return 'Escolha um nome com pelo menos 2 caracteres.';
      if (form.password.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
      if (form.password !== form.confirmPassword) return 'As senhas não coincidem.';
    }

    if (mode === 'signin' && !form.password) return 'Digite sua senha para continuar.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFeedback(null);

    const validationMessage = validate();
    if (validationMessage) {
      setFeedback({ type: 'error', message: validationMessage });
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'reset') {
        await resetPassword(form.email);
        setFeedback({
          type: 'success',
          message: 'Se existir uma conta com este e-mail, enviaremos as instruções de recuperação.',
        });
        return;
      }

      if (mode === 'signup') {
        const result = await signUpEmail({
          displayName: form.displayName,
          email: form.email,
          password: form.password,
        });
        onAuthenticated?.(result.user);
        return;
      }

      const authUser = await signInEmail(form.email, form.password);
      onAuthenticated?.(authUser);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message) setFeedback({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setFeedback(null);
    try {
      const authUser = await signInGoogle();
      onAuthenticated?.(authUser);
    } catch (error) {
      const message = getAuthErrorMessage(error);
      if (message) setFeedback({ type: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  const isReset = mode === 'reset';
  const isSignUp = mode === 'signup';
  const title = isReset ? 'Recupere seu acesso' : isSignUp ? 'Crie seu perfil' : 'Que bom ter você de volta';
  const description = isReset
    ? 'Informe o e-mail da conta e enviaremos um link seguro.'
    : isSignUp
      ? 'Comece sua biblioteca e monte uma vitrine com os seus favoritos.'
      : destinationLabel
        ? 'Entre para continuar para ' + destinationLabel + '.'
        : 'Entre para continuar sua jornada de onde parou.';

  return (
    <section className="mx-auto w-full max-w-6xl p-3 pb-10 sm:p-6 lg:p-8" aria-labelledby={prefix + '-title'}>
      <div className="relative overflow-hidden rounded-[2rem] border border-border-color bg-bg-secondary shadow-2xl shadow-black/20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,color-mix(in_srgb,var(--primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_90%_85%,color-mix(in_srgb,var(--button-accent)_12%,transparent),transparent_30%)]" />

        <div className="relative grid min-h-[650px] lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-br from-primary/25 via-bg-primary/80 to-cyan-500/10 p-10 lg:flex lg:flex-col">
            <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3.5 w-3.5" /> Seu espaço no PortalAnimes
              </span>
              <h2 className="mt-6 max-w-md text-4xl font-black leading-tight text-text-primary">
                Tudo o que você ama, organizado do seu jeito.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-7 text-text-secondary">
                Descubra novos títulos, acompanhe cada episódio e transforme seu perfil em um retrato da sua jornada.
              </p>
            </div>

            <div className="relative mt-10 space-y-4">
              {BENEFITS.map(({ icon: Icon, title: benefitTitle, description: benefitDescription }) => (
                <div key={benefitTitle} className="flex gap-4 rounded-2xl border border-white/10 bg-bg-primary/35 p-4 backdrop-blur">
                  <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-text-primary">{benefitTitle}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{benefitDescription}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-auto flex items-center gap-2 pt-8 text-xs font-semibold text-text-secondary">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Seus dados de acesso são protegidos pelo Firebase Authentication.
            </div>
          </aside>

          <div className="flex items-center justify-center p-5 sm:p-8 lg:p-12">
            <div className="w-full max-w-md">
              <div className="mb-7 lg:hidden">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                  <Sparkles className="h-3.5 w-3.5" /> PortalAnimes
                </span>
              </div>

              {isReset ? (
                <button
                  type="button"
                  onClick={() => changeMode('signin')}
                  disabled={submitting}
                  className="mb-6 inline-flex items-center gap-2 rounded-lg p-0 text-xs font-black text-text-secondary transition-colors hover:text-primary disabled:opacity-50"
                >
                  <ArrowLeft className="h-4 w-4" /> Voltar para entrar
                </button>
              ) : (
                <div className="mb-7 grid grid-cols-2 rounded-xl border border-border-color bg-bg-primary/50 p-1" role="tablist" aria-label="Escolha como acessar">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'signin'}
                    onClick={() => changeMode('signin')}
                    className={mode === 'signin' ? 'rounded-lg bg-primary px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/20' : 'rounded-lg px-4 py-2.5 text-xs font-black text-text-secondary hover:text-text-primary'}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={mode === 'signup'}
                    onClick={() => changeMode('signup')}
                    className={mode === 'signup' ? 'rounded-lg bg-primary px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-primary/20' : 'rounded-lg px-4 py-2.5 text-xs font-black text-text-secondary hover:text-text-primary'}
                  >
                    Criar conta
                  </button>
                </div>
              )}

              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-primary">
                  {isReset ? 'Segurança da conta' : isSignUp ? 'Novo por aqui?' : 'Acesse seu perfil'}
                </span>
                <h1 id={prefix + '-title'} className="mt-2 text-3xl font-black text-text-primary">{title}</h1>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{description}</p>
              </div>

              <form className="mt-7 space-y-4" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
                {isSignUp && (
                  <AuthField
                    id={prefix + '-name'}
                    icon={UserRound}
                    label="Como você quer aparecer?"
                    type="text"
                    name="displayName"
                    autoComplete="name"
                    maxLength={50}
                    placeholder="Seu nome ou apelido"
                    value={form.displayName}
                    onChange={updateField('displayName')}
                    disabled={submitting}
                    required
                  />
                )}

                <AuthField
                  id={prefix + '-email'}
                  icon={Mail}
                  label="E-mail"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="voce@exemplo.com"
                  value={form.email}
                  onChange={updateField('email')}
                  disabled={submitting}
                  required
                />

                {!isReset && (
                  <AuthField
                    id={prefix + '-password'}
                    icon={LockKeyhole}
                    label="Senha"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    minLength={isSignUp ? 8 : undefined}
                    placeholder={isSignUp ? 'Pelo menos 8 caracteres' : 'Sua senha'}
                    value={form.password}
                    onChange={updateField('password')}
                    disabled={submitting}
                    required
                    action={mode === 'signin' ? (
                      <button
                        type="button"
                        onClick={() => changeMode('reset')}
                        className="rounded p-0 text-[11px] font-black text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    ) : undefined}
                  />
                )}

                {isSignUp && (
                  <AuthField
                    id={prefix + '-confirm-password'}
                    icon={KeyRound}
                    label="Confirme a senha"
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="Digite a senha novamente"
                    value={form.confirmPassword}
                    onChange={updateField('confirmPassword')}
                    disabled={submitting}
                    required
                  />
                )}

                {!isReset && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-pressed={showPassword}
                    className="inline-flex items-center gap-2 rounded p-0 text-[11px] font-bold text-text-secondary hover:text-text-primary"
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  </button>
                )}

                {feedback && (
                  <div
                    role={feedback.type === 'error' ? 'alert' : 'status'}
                    className={feedback.type === 'error'
                      ? 'flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-3 text-xs font-semibold leading-relaxed text-red-300'
                      : 'flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-3 text-xs font-semibold leading-relaxed text-emerald-300'}
                  >
                    {feedback.type === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> : <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />}
                    {feedback.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-black text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30 disabled:cursor-wait disabled:translate-y-0 disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {submitting
                    ? isReset ? 'Enviando...' : isSignUp ? 'Criando conta...' : 'Entrando...'
                    : isReset ? 'Enviar link de recuperação' : isSignUp ? 'Criar meu perfil' : 'Entrar no meu perfil'}
                </button>
              </form>

              {!isReset && (
                <>
                  <div className="my-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.16em] text-text-secondary/70">
                    <span className="h-px flex-1 bg-border-color" />
                    ou continue com
                    <span className="h-px flex-1 bg-border-color" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogle}
                    disabled={submitting}
                    className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border-color bg-bg-primary/60 px-5 text-sm font-black text-text-primary transition-all hover:border-primary/40 hover:bg-bg-tertiary disabled:cursor-wait disabled:opacity-60"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="h-5 w-5 rounded-full bg-white p-0.5" />
                    Continuar com Google
                  </button>
                </>
              )}

              <p className="mt-6 text-center text-[11px] leading-relaxed text-text-secondary">
                Ao continuar, você concorda com os <Link to="/terms" className="font-bold text-text-primary hover:text-primary">Termos de Uso</Link> e a <Link to="/privacy" className="font-bold text-text-primary hover:text-primary">Política de Privacidade</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
