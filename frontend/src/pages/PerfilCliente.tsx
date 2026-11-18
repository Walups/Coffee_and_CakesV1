import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Menu, CheckCircle2, AlertCircle } from 'lucide-react';
import logoImg from '../assets/Logo.png';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { SideMenuDrawer } from '../components/SideMenuDrawer';
import {
  usuarioService,
  getStoredUsuario,
  getStoredUserProfile,
  setStoredUserProfile,
} from '../services/usuarioService';
import { enderecoService } from '../services/enderecoService';
import { maskCEP, cleanDigits } from '../utils/validators';

export interface PerfilClienteProps {
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
}

export interface PerfilClienteFormData {
  nome_completo: string;
  email: string;
  rua: string;
  numero: string;
  cep: string;
  complemento: string;
}

export const PerfilCliente: FC<PerfilClienteProps> = ({ onLogout, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const usuario = getStoredUsuario();
  const userId = usuario?.id_usuario;

  // Carregamento inicial de dados salvos localmente
  const initialLocalProfile = getStoredUserProfile(userId);

  const initialValues: PerfilClienteFormData = {
    nome_completo: initialLocalProfile?.nome_completo || usuario?.nome_completo || '',
    email: initialLocalProfile?.email || usuario?.email || '',
    rua: initialLocalProfile?.rua || '',
    numero: initialLocalProfile?.numero || '',
    cep: initialLocalProfile?.cep ? maskCEP(initialLocalProfile.cep) : '',
    complemento: initialLocalProfile?.complemento || '',
  };

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<PerfilClienteFormData>({
    defaultValues: initialValues,
    mode: 'onBlur',
  });

  const handleVoltarVitrine = () => {
    if (onNavigate) {
      onNavigate('/cliente');
    } else if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/cliente');
      if (typeof PopStateEvent !== 'undefined') {
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  // Carregamento de dados adicionais do backend com tolerância a falhas (try/catch)
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    async function carregarDadosBackend() {
      // 1. Tenta carregar dados atualizados do usuário
      try {
        const usuarioBackend = await usuarioService.getMe(signal);
        if (usuarioBackend) {
          if (usuarioBackend.nome_completo && !initialLocalProfile?.nome_completo) {
            setValue('nome_completo', usuarioBackend.nome_completo);
          }
          if (usuarioBackend.email && !initialLocalProfile?.email) {
            setValue('email', usuarioBackend.email);
          }
        }
      } catch (err) {
        // Tolerância caso o backend esteja indisponível ou rota não configurada
        console.warn('Não foi possível obter dados do usuário via backend:', err);
      }

      // 2. Tenta carregar dados de endereço do usuário
      try {
        const enderecoBackend = await enderecoService.getMine(signal);
        if (enderecoBackend) {
          if (enderecoBackend.logradouro && !initialLocalProfile?.rua) {
            setValue('rua', enderecoBackend.logradouro);
          }
          if (enderecoBackend.numero && !initialLocalProfile?.numero) {
            setValue('numero', enderecoBackend.numero);
          }
          if (enderecoBackend.cep && !initialLocalProfile?.cep) {
            setValue('cep', maskCEP(enderecoBackend.cep));
          }
          if (enderecoBackend.complemento && !initialLocalProfile?.complemento) {
            setValue('complemento', enderecoBackend.complemento);
          }
        }
      } catch (err) {
        // Tolerância caso a tabela ou colunas de endereço não existam no banco
        console.warn('Não foi possível obter endereço via backend:', err);
      }
    }

    void carregarDadosBackend();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, [initialLocalProfile, setValue]);

  // Envio do formulário
  async function onSubmit(formData: PerfilClienteFormData) {
    const nomeLimpo = formData.nome_completo.trim();

    if (!nomeLimpo) {
      setError('nome_completo', {
        type: 'manual',
        message: 'Nome completo é obrigatório',
      });
      setErrorMessage('Nome completo é obrigatório.');
      return;
    }

    if (nomeLimpo.length < 3) {
      setError('nome_completo', {
        type: 'manual',
        message: 'Nome completo deve ter pelo menos 3 caracteres',
      });
      setErrorMessage('Nome completo deve ter pelo menos 3 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      // 1. Persistência garantida no localStorage com a chave especificada
      setStoredUserProfile(userId, {
        nome_completo: nomeLimpo,
        email: formData.email.trim(),
        rua: formData.rua.trim(),
        numero: formData.numero.trim(),
        cep: cleanDigits(formData.cep),
        complemento: formData.complemento.trim(),
      });

      // 2. Atualização do nome no contexto/sessão do usuário logado
      const usuarioAtual = getStoredUsuario();
      if (usuarioAtual) {
        const usuarioAtualizado = {
          ...usuarioAtual,
          nome_completo: nomeLimpo,
        };
        localStorage.setItem('usuario', JSON.stringify(usuarioAtualizado));
      }

      // 3. Sincronização segura com o backend (com try/catch independente)
      if (userId) {
        try {
          await usuarioService.updateProfile(userId, { nome_completo: nomeLimpo }, signal);
        } catch (userSyncError) {
          console.warn('Aviso: Falha ao sincronizar perfil no banco:', userSyncError);
        }

        const cepLimpo = cleanDigits(formData.cep);
        if (formData.rua.trim() || formData.numero.trim() || cepLimpo) {
          try {
            await enderecoService.saveOrUpdateMine(
              {
                id_usuario: userId,
                cep: cepLimpo || '80000000',
                logradouro: formData.rua.trim() || 'Não informado',
                numero: formData.numero.trim() || 'S/N',
                cidade: 'Curitiba',
                uf: 'PR',
                complemento: formData.complemento.trim(),
              },
              signal
            );
          } catch (enderecoSyncError) {
            console.warn('Aviso: Falha ao sincronizar endereço no banco:', enderecoSyncError);
          }
        }
      }

      // 4. Feedback visual claro de sucesso
      setSuccessMessage('Cadastro atualizado com sucesso!');
    } catch (err: unknown) {
      console.error('Erro ao atualizar cadastro:', err);
      setErrorMessage('Ocorreu um erro ao salvar as alterações.');
    } finally {
      setLoading(false);
    }
  }

  // Campo CEP com máscara formatada
  const cepField = register('cep');

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#F5D8C7] flex justify-center">
      {/* Container mobile-first com identidade visual #FDE5D7 */}
      <div className="w-full max-w-md min-h-screen bg-[#FDE5D7] flex flex-col relative shadow-2xl">
        {/* =========================================================================
            CABEÇALHO PADRÃO DO CLIENTE
           ========================================================================= */}
        <header className="w-full bg-[#F8C8CE] px-4 py-3 shadow-xs shrink-0 z-30">
          <div className="flex items-center justify-between w-full">
            {/* Botão de voltar para a vitrine */}
            <button
              type="button"
              aria-label="Voltar para a vitrine"
              onClick={handleVoltarVitrine}
              className="p-2 rounded-xl text-[#5B2418] hover:bg-[#5B2418]/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Logo Coffee & Cakes ao centro */}
            <div className="flex items-center justify-center">
              <img
                src={logoImg}
                alt="Coffee & Cakes"
                className="h-10 object-contain pointer-events-none drop-shadow-xs"
              />
            </div>

            {/* Botão de abrir menu lateral para navegação consistente */}
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-xl text-[#5B2418] hover:bg-[#5B2418]/10 active:scale-95 transition-all cursor-pointer"
            >
              <Menu className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>
        </header>

        {/* Menu Lateral Drawer */}
        <SideMenuDrawer
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onLogout={onLogout}
          onNavigateHome={handleVoltarVitrine}
          onNavigateMinhasCompras={() => {
            setMenuOpen(false);
            if (onNavigate) onNavigate('/cliente/pedidos');
          }}
          onNavigateEditarCadastro={() => {
            setMenuOpen(false);
          }}
        />

        {/* =========================================================================
            CONTEÚDO DO FORMULÁRIO DE ATUALIZAÇÃO DE CADASTRO
           ========================================================================= */}
        <main className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
          {/* Botão de atalho discreto para voltar à vitrine */}
          <div className="mb-4">
            <button
              type="button"
              onClick={handleVoltarVitrine}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B2418] hover:underline cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à vitrine</span>
            </button>
          </div>

          {/* Título alinhado à esquerda em negrito */}
          <h1 className="text-2xl font-extrabold text-[#5B2418] text-left mb-6">
            Atualizar cadastro
          </h1>

          {/* Feedback Visual Claro de Sucesso */}
          {successMessage && (
            <div
              role="status"
              data-testid="feedback-sucesso"
              className="mb-6 p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 font-semibold text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={handleVoltarVitrine}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-lg transition-colors cursor-pointer self-start sm:self-auto shrink-0"
              >
                Voltar à vitrine
              </button>
            </div>
          )}

          {/* Mensagem de Erro Geral (se houver) */}
          {errorMessage && (
            <div
              role="alert"
              data-testid="feedback-erro"
              className="mb-6 p-4 rounded-xl bg-red-100 border border-red-300 text-red-800 font-medium text-sm flex items-center gap-2 shadow-xs animate-in fade-in"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e);
            }}
            noValidate
            className="w-full flex flex-col flex-1 justify-between"
          >
            <div className="flex flex-col">
              {/* =====================================================================
                  BLOCO 1: DADOS PESSOAIS
                 ===================================================================== */}
              <div className="flex flex-col gap-3.5">
                <Input
                  placeholder="Nome completo"
                  disabled={loading}
                  defaultValue={initialValues.nome_completo}
                  erro={errors.nome_completo?.message}
                  {...register('nome_completo', {
                    required: 'Nome completo é obrigatório',
                    validate: (val) =>
                      val.trim().length >= 3 ||
                      'Nome completo deve ter pelo menos 3 caracteres',
                  })}
                />

                <Input
                  type="email"
                  placeholder="E-mail"
                  readOnly
                  defaultValue={initialValues.email}
                  title="E-mail da conta (somente leitura)"
                  className="!bg-white/80 !text-zinc-600 cursor-not-allowed select-none"
                  erro={errors.email?.message}
                  {...register('email')}
                />
              </div>

              {/* =====================================================================
                  BLOCO 2: ENDEREÇO (Com espaçamento vertical maior entre bloco 1 e 2)
                 ===================================================================== */}
              <div className="flex flex-col gap-3.5 mt-8">
                <Input
                  placeholder="Rua"
                  disabled={loading}
                  defaultValue={initialValues.rua}
                  erro={errors.rua?.message}
                  {...register('rua')}
                />

                {/* Linha com duas colunas (grid-cols-2 gap-4): Número à esquerda e CEP à direita */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="Número"
                    disabled={loading}
                    defaultValue={initialValues.numero}
                    erro={errors.numero?.message}
                    {...register('numero')}
                  />

                  <Input
                    placeholder="CEP"
                    disabled={loading}
                    defaultValue={initialValues.cep}
                    erro={errors.cep?.message}
                    {...cepField}
                    onChange={(e) => {
                      e.target.value = maskCEP(e.target.value);
                      cepField.onChange(e);
                    }}
                  />
                </div>

                <Input
                  placeholder="Complemento"
                  disabled={loading}
                  defaultValue={initialValues.complemento}
                  erro={errors.complemento?.message}
                  {...register('complemento')}
                />
              </div>
            </div>

            {/* =====================================================================
                AÇÃO FINAL: Botão centralizado na parte inferior com fundo marrom café (#5C2A14)
               ===================================================================== */}
            <div className="pt-10 pb-6 flex justify-center w-full">
              <Button
                type="submit"
                loading={loading}
                className="w-full max-w-xs !bg-[#5C2A14] hover:!bg-[#461f0e] text-white font-bold shadow-[0_13px_7px_rgba(0,0,0,0.15)] active:scale-[0.98] transition-all cursor-pointer"
              >
                Salvar alterações
              </Button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
};

export default PerfilCliente;
