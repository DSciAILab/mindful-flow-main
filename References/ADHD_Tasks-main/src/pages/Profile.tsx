"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useSession } from "@/integrations/supabase/auth";
import { supabaseDb } from "@/lib/supabase/index";
import { User, Download, Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { ProfilePageSkeleton } from "@/components/LoadingSkeletons";
import TimerSettingsCard from "@/components/TimerSettingsCard";
import { exportData, restoreData } from "@/lib/backup"; // Importando as novas funções

interface ProfileData {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

const StatCard = ({ title, value }: { title: string; value: string | number }) => (
  <Card className="text-center p-4">
    <CardTitle className="text-3xl font-bold">{value}</CardTitle>
    <CardDescription className="text-sm text-muted-foreground">{title}</CardDescription>
  </Card>
);

const Profile = () => {
  const { user, isLoading } = useSession();
  const userId = user?.id;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({ first_name: "", last_name: "", avatar_url: null });
  const [stats, setStats] = useState({ completedTasks: 0, totalHabits: 0 });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    const data = await supabaseDb.getProfile(userId);
    if (data) {
      setProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        avatar_url: data.avatar_url,
      });
    } else {
      toast.error("Falha ao carregar o perfil.");
    }
  }, [userId]);

  const fetchStats = useCallback(async () => {
    if (!userId) return;
    const userStats = await supabaseDb.getStats(userId);
    setStats(userStats);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      setLoadingProfile(true);
      Promise.all([fetchProfile(), fetchStats()]).finally(() => setLoadingProfile(false));
    }
  }, [userId, fetchProfile, fetchStats]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setProfile((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async () => {
    if (!userId) {
      toast.error("Você precisa estar logado para salvar o perfil.");
      return;
    }

    const success = await supabaseDb.updateProfile(userId, {
      first_name: profile.first_name,
      last_name: profile.last_name,
      avatar_url: profile.avatar_url,
    });
    if (success) {
      toast.success("Perfil atualizado com sucesso!");
      setIsEditingProfile(false);
      fetchProfile();
    } else {
      toast.error("Falha ao atualizar o perfil.");
    }
  };

  const handleSignOut = async () => {
    const success = await supabaseDb.signOut();
    if (success) {
      toast.info("Você foi desconectado.");
      navigate('/login');
    } else {
      toast.error("Falha ao sair.");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      restoreData(file);
    }
    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (isLoading || loadingProfile) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Por favor, faça login para ver seu perfil.</div>;
  }

  return (
    <Layout onHabitAdded={fetchStats} onTaskAddedToProject={() => {}} onTaskAddedToInbox={() => {}} onTaskAddedToReview={() => {}} onNoteAdded={() => {}}>
      <div className="p-4 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Informações Pessoais</CardTitle>
            <Button variant="outline" onClick={() => setIsEditingProfile(!isEditingProfile)}>
              {isEditingProfile ? "Cancelar" : "Editar"}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold">{profile.first_name} {profile.last_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="first_name">Primeiro Nome</Label>
                <Input id="first_name" value={profile.first_name} onChange={handleInputChange} disabled={!isEditingProfile} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="last_name">Sobrenome</Label>
                <Input id="last_name" value={profile.last_name} onChange={handleInputChange} disabled={!isEditingProfile} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="avatar_url">URL do Avatar</Label>
                <Input id="avatar_url" value={profile.avatar_url || ""} onChange={handleInputChange} disabled={!isEditingProfile} placeholder="https://example.com/avatar.jpg" />
              </div>
            </div>

            {isEditingProfile && (
              <Button onClick={handleSaveProfile} className="w-full">
                Salvar Alterações
              </Button>
            )}
          </CardContent>
        </Card>

        <TimerSettingsCard userId={userId} />

        <Card>
          <CardHeader>
            <CardTitle>Backup e Restauração</CardTitle>
            <CardDescription>Exporte seus dados para um arquivo ou restaure a partir de um backup.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button className="w-full" onClick={() => userId && exportData(userId)}>
              <Download className="mr-2 h-4 w-4" />
              Fazer Backup
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
            <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Restaurar de Arquivo
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Suas Estatísticas</CardTitle>
            <CardDescription>Seu progresso ao longo do tempo.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <StatCard title="Tarefas Concluídas" value={stats.completedTasks} />
            <StatCard title="Hábitos Monitorados" value={stats.totalHabits} />
          </CardContent>
        </Card>

        <Button variant="destructive" onClick={handleSignOut} className="w-full">
          Sair
        </Button>
      </div>
    </Layout>
  );
};

export default Profile;