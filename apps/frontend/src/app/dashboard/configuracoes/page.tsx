"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  Camera, 
  Mail, 
  Lock, 
  Save, 
  Loader2, 
  KeyRound, 
  AlertCircle, 
  CheckCircle, 
  X, 
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff
} from "lucide-react";
import { usersApi } from "@/lib/api";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { checkPasswordStrength } from "@/lib/validations";

export default function ConfiguracoesPage() {
  // Dados do Perfil
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);

  // Estados de Senha (para o Modal)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Estados de Controle/UX
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Controle do Modal de Senha
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [showModalNewPassword, setShowModalNewPassword] = useState(false);
  const [showModalConfirmPassword, setShowModalConfirmPassword] = useState(false);

  // Controle do Modal de Corte (Cropper)
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  
  // Controle de Arrastar (Drag) no Cropper
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const profile = await usersApi.getProfile();
        setName(profile.name);
        setEmail(profile.email);
        setAvatar(profile.avatar);
      } catch (err: any) {
        setError(err.message || "Erro ao carregar informações do perfil.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo (apenas png, jpeg e jpg)
    const validExtensions = ["png", "jpg", "jpeg"];
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const validMimeTypes = ["image/png", "image/jpeg", "image/jpg"];
    const isValidMime = validMimeTypes.includes(file.type);
    const isValidExtension = validExtensions.includes(fileExtension);

    if (!isValidMime && !isValidExtension) {
      setError("Formato de arquivo inválido. Escolha apenas imagens .png, .jpg ou .jpeg.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Limitar tamanho da imagem (ex: máximo 3MB)
    const MAX_SIZE_MB = 3;
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setError(`A imagem é muito grande. O limite máximo de tamanho permitido é de ${MAX_SIZE_MB}MB.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      setCropImageSrc(event.target?.result as string);
      setCropZoom(1);
      setCropX(0);
      setCropY(0);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatar(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Manipuladores de Arrasto (Mouse e Toque) para Enquadramento do Crop
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropX, y: e.clientY - cropY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setCropX(e.clientX - dragStart.x);
    setCropY(e.clientY - dragStart.y);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - cropX, 
        y: e.touches[0].clientY - cropY 
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setCropX(e.touches[0].clientX - dragStart.x);
    setCropY(e.touches[0].clientY - dragStart.y);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setSaving(true);
    try {
      const updated = await usersApi.updateProfile({
        avatar: avatar,
      });

      // Atualizar dados na localStorage
      const userStr = localStorage.getItem("copa_user");
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        const newUser = {
          ...currentUser,
          avatar: updated.avatar,
        };
        localStorage.setItem("copa_user", JSON.stringify(newUser));
        window.dispatchEvent(new Event("user-profile-updated"));
      }

      setSuccess("Perfil atualizado com sucesso!");
    } catch (err: any) {
      setError(err.message || "Erro ao salvar alterações.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);

    if (!newPassword) {
      setModalError("A nova senha não pode estar vazia.");
      return;
    }
    
    // Validar requisitos de senha da Copa
    const strength = checkPasswordStrength(newPassword);
    if (!strength.allValid) {
      setModalError("A senha não atende a todos os requisitos mínimos de segurança.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setModalError("As senhas inseridas não coincidem.");
      return;
    }

    setPasswordSaving(true);
    try {
      await usersApi.updateProfile({
        password: newPassword,
      });

      setModalSuccess("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");

      // Fecha o modal após 1.5 segundos
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      setModalError(err.message || "Erro ao atualizar a senha.");
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <Loader2 className="w-10 h-10 text-[#ffd700] animate-spin" />
        <p className="text-white/60 text-sm tracking-wide">Carregando suas configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-2xl mx-auto pb-12">
      {/* Title */}
      <div className="relative overflow-hidden p-6 rounded-2xl bg-gradient-to-r from-[#0d2b1a]/40 to-transparent border border-white/5 shadow-2xl">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#ffd700]/5 rounded-full blur-3xl" />
        <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-[#ffd700] animate-pulse" />
          Configurações da <span className="text-[#ffd700] bg-gradient-to-r from-[#ffd700] to-[#f5c800] bg-clip-text text-transparent">Conta</span>
        </h1>
        <p className="text-white/60 text-sm mt-1.5 font-medium">Personalize seu avatar, atualize seus dados e gerencie a segurança de forma simples.</p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmitProfile} className="space-y-6">
        
        {/* Profile Card */}
        <div className="auth-card p-8 border border-white/10 bg-[#0d2b1a]/20 backdrop-blur-md rounded-2xl space-y-8 shadow-2xl relative">
          
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-5">
            <div className="flex items-center gap-2 self-start border-b border-white/5 pb-2 w-full">
              <Camera className="w-4 h-4 text-[#ffd700]" />
              <h3 className="text-xs font-black text-white/70 uppercase tracking-widest">Foto de Perfil</h3>
            </div>
            
            <div className="relative group">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-32 h-32 rounded-full border-2 border-white/10 overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer hover:border-[#ffd700]/60 transition-all duration-300 relative group-hover:scale-105 shadow-inner"
              >
                {avatar ? (
                  <img src={avatar} alt="Avatar do usuário" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#0d2b1a]/60 flex items-center justify-center">
                    <User className="w-14 h-14 text-[#ffd700]/70" />
                  </div>
                )}
                
                {/* Camera Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-full">
                  <div className="bg-white/10 p-2.5 rounded-full backdrop-blur-md border border-white/20">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              {/* Hidden file input constrained to png, jpg, jpeg */}
              <input 
                type="file"
                ref={fileInputRef}
                accept=".png,.jpg,.jpeg"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs font-bold text-[#ffd700] hover:text-[#ffd700]/80 cursor-pointer transition-colors"
              >
                Escolher foto
              </button>
              {avatar && (
                <>
                  <span className="text-white/20 text-xs">|</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-xs font-bold text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                  >
                    Remover foto
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm animate-fade-in">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p className="font-medium">{success}</p>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <User className="w-4 h-4 text-[#ffd700]" />
              <h3 className="text-xs font-black text-white/70 uppercase tracking-widest">Informações Pessoais</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-4.5 rounded-xl border border-white/5 bg-black/20">
              <div className="space-y-1 p-1">
                <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">Nome</span>
                <p className="text-sm font-semibold text-white/90">{name || "Carregando..."}</p>
              </div>
              <div className="space-y-1 p-1">
                <span className="text-[10px] font-bold text-white/40 tracking-wider uppercase">E-mail</span>
                <p className="text-sm font-semibold text-white/90 break-all">{email || "Carregando..."}</p>
              </div>
            </div>
          </div>

          {/* Security Card Section */}
          <div className="space-y-5 border-t border-white/10 pt-6">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Lock className="w-4 h-4 text-[#ffd700]" />
              <h3 className="text-xs font-black text-white/70 uppercase tracking-widest">Segurança</h3>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-white/5 bg-black/30">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  Senha de Acesso
                </h4>
                <p className="text-xs text-white/50">Mantenha sua conta protegida alterando a senha regularmente.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewPassword("");
                  setConfirmPassword("");
                  setModalError(null);
                  setModalSuccess(null);
                  setShowModalNewPassword(false);
                  setShowModalConfirmPassword(false);
                  setIsModalOpen(true);
                }}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#ffd700]/30 hover:border-[#ffd700] bg-[#ffd700]/5 hover:bg-[#ffd700]/10 text-[#ffd700] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
              >
                <KeyRound className="w-4 h-4" />
                Alterar Senha
              </button>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="copa-btn-primary px-8 py-3.5 text-sm flex items-center gap-2 max-w-xs hover:scale-102 cursor-pointer transition-all duration-300 font-black shadow-lg"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>

      {/* Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            onClick={() => !passwordSaving && setIsModalOpen(false)}
            className="fixed inset-0 bg-[#0a0f1e]/85 backdrop-blur-xl transition-all duration-300" 
          />
          
          {/* Modal Content */}
          <div className="relative bg-gradient-to-br from-[#0d2b1a] to-[#04140d] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-[0_0_50px_-12px_rgba(255,215,0,0.15)] z-10 animate-fade-in-up overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="absolute -right-16 -top-16 w-36 h-36 bg-[#ffd700]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-36 h-36 bg-[#2d8a50]/10 rounded-full blur-3xl pointer-events-none" />
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5 relative">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-b from-[#ffd700]/20 to-transparent p-2.5 rounded-xl border border-[#ffd700]/25 shadow-inner">
                  <KeyRound className="w-5 h-5 text-[#ffd700]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white tracking-wide">Alterar Senha</h3>
                  <p className="text-[10px] text-white/50 font-medium">Crie uma nova credencial segura</p>
                </div>
              </div>
              <button
                disabled={passwordSaving}
                onClick={() => setIsModalOpen(false)}
                className="text-white/40 hover:text-white hover:bg-white/5 p-1.5 rounded-lg cursor-pointer transition-all border border-transparent hover:border-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error/Success Feedbacks */}
            {modalError && (
              <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs mb-4.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-semibold">{modalError}</p>
              </div>
            )}

            {modalSuccess && (
              <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs mb-4.5 animate-fade-in">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <p className="font-semibold">{modalSuccess}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-5 relative">
              
              {/* Nova Senha */}
              <div className="space-y-1.5 group/modal-field">
                <label htmlFor="newPass" className="text-xs font-bold text-white/50 tracking-wide uppercase group-focus-within/modal-field:text-[#ffd700] transition-colors">
                  Nova Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/30 group-focus-within/modal-field:text-[#ffd700] transition-colors pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="newPass"
                    type={showModalNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="copa-input w-full pl-10 pr-10 py-3 text-sm focus:border-[#ffd700]/40 focus:ring-0 focus:outline-none transition-all duration-300 shadow-sm focus:shadow-[0_0_12px_rgba(255,215,0,0.06)]"
                    placeholder="Crie uma senha segura"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalNewPassword(!showModalNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    {showModalNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Real-time checklist requirements confirmation */}
                <PasswordChecklist password={newPassword} />
              </div>

              {/* Confirmar Nova Senha */}
              <div className="space-y-1.5 group/modal-field2">
                <label htmlFor="confirmPass" className="text-xs font-bold text-white/50 tracking-wide uppercase group-focus-within/modal-field2:text-[#ffd700] transition-colors">
                  Confirmar Nova Senha
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-white/30 group-focus-within/modal-field2:text-[#ffd700] transition-colors pointer-events-none">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="confirmPass"
                    type={showModalConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="copa-input w-full pl-10 pr-10 py-3 text-sm focus:border-[#ffd700]/40 focus:ring-0 focus:outline-none transition-all duration-300 shadow-sm focus:shadow-[0_0_12px_rgba(255,215,0,0.06)]"
                    placeholder="Repita a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalConfirmPassword(!showModalConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                  >
                    {showModalConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3.5 border-t border-white/5">
                <button
                  type="button"
                  disabled={passwordSaving}
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold cursor-pointer transition-all hover:border-white/20 active:scale-98"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="copa-btn-primary px-5 py-2.5 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer hover:scale-102 active:scale-98"
                >
                  {passwordSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      Confirmar Senha
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Image Cropper Modal */}
      {isCropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            onClick={() => setIsCropModalOpen(false)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md transition-opacity duration-300" 
          />
          
          {/* Modal Content */}
          <div className="relative bg-[#0d2b1a] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl z-10 animate-fade-in-up">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3.5 mb-5">
              <div className="flex items-center gap-2">
                <div className="bg-[#ffd700]/10 p-2 rounded-xl border border-[#ffd700]/25">
                  <Camera className="w-5 h-5 text-[#ffd700]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Ajustar Foto</h3>
                  <p className="text-[10px] text-white/50">Enquadre sua foto de perfil</p>
                </div>
              </div>
              <button
                onClick={() => setIsCropModalOpen(false)}
                className="text-white/40 hover:text-white hover:bg-white/5 p-1.5 rounded-lg cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Interactive Viewport */}
            <div className="flex flex-col items-center justify-center space-y-6">
              
              {/* Viewport Box */}
              <div 
                className="w-60 h-60 overflow-hidden rounded-full border-2 border-[#ffd700] relative bg-black/50 cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUpOrLeave}
                onMouseLeave={handleMouseUpOrLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUpOrLeave}
              >
                <img
                  ref={imgRef}
                  src={cropImageSrc}
                  alt="Prévia do corte"
                  draggable={false}
                  className="absolute origin-center transition-transform duration-75 select-none"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    transform: `scale(${cropZoom}) translate(${cropX / cropZoom}px, ${cropY / cropZoom}px)`,
                  }}
                />
                
                {/* Circular Border Indicator overlay */}
                <div className="absolute inset-0 rounded-full pointer-events-none ring-offset-4 ring-offset-black/40 ring-2 ring-[#ffd700]/20" />
              </div>

              {/* Instructions */}
              <p className="text-[10px] text-white/40 text-center italic">
                💡 Dica: Arraste a imagem diretamente com o mouse ou dedo para posicionar e use a barra de zoom abaixo.
              </p>

              {/* Zoom Control */}
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider">
                  <span>Zoom</span>
                  <span>{cropZoom.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ffd700] outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 w-full pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold cursor-pointer transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const canvas = document.createElement("canvas");
                    canvas.width = 180;
                    canvas.height = 180;
                    const ctx = canvas.getContext("2d");
                    if (ctx && imgRef.current) {
                      ctx.clearRect(0, 0, 180, 180);
                      const factor = 180 / 240;
                      ctx.save();
                      ctx.translate(90, 90);
                      ctx.scale(cropZoom, cropZoom);
                      ctx.translate(cropX * factor / cropZoom, cropY * factor / cropZoom);
                      
                      const img = imgRef.current;
                      const imgRatio = img.naturalWidth / img.naturalHeight;
                      let drawW = 180;
                      let drawH = 180;
                      if (imgRatio > 1) {
                        drawH = drawW / imgRatio;
                      } else {
                        drawW = drawH * imgRatio;
                      }
                      
                      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
                      ctx.restore();
                      
                      const base64 = canvas.toDataURL("image/jpeg", 0.9);
                      setAvatar(base64);
                      setIsCropModalOpen(false);
                      setError(null);
                    }
                  }}
                  className="copa-btn-primary px-5 py-2.5 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Cortar Foto
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
