"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Crown, FileText, LogOut, Moon, Settings, Sun, User } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@english-app/ui";

import { cn } from "@/lib/utils";

import {
  learningGlassPanel,
  learningMutedText,
  learningSectionHeading,
  learningSurfaceCard,
} from "./theme";
import { type LearningProfile } from "./types";

interface TopBarProps {
  profile: LearningProfile;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onLogout: () => void;
}

const NOTIFICATIONS = [
  {
    id: 1,
    title: "Nova lição disponível!",
    description: "Dia 2 está pronto para você começar",
    time: "5 min atrás",
    unread: true,
  },
  {
    id: 2,
    title: "Parabéns! 🎉",
    description: "Você completou o Dia 1 com sucesso",
    time: "1 hora atrás",
    unread: true,
  },
  {
    id: 3,
    title: "Dica do Teacher AI",
    description: "Continue praticando para manter seu streak!",
    time: "2 horas atrás",
    unread: false,
  },
];

export function TopBar({ profile, theme, onToggleTheme, onLogout }: TopBarProps) {
  const unreadCount = useMemo(() => NOTIFICATIONS.filter((notif) => notif.unread).length, []);
  const initials = useMemo(
    () =>
      profile.name
        .split(" ")
        .map((value) => value[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "AI",
    [profile.name],
  );

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLightTheme = mounted ? theme === "light" : true;

  return (
    <div
      className={cn("sticky top-0 z-50 border-b-0 transition-all duration-300", learningGlassPanel)}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow shadow-blue-500/30">
            AI
          </div>
          <span className={cn("hidden sm:inline-block", learningSectionHeading)}>
            English AI Tutor
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 p-0 text-[10px] text-white shadow shadow-rose-500/40">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className={cn("w-80 p-0", learningSurfaceCard)} align="end">
              <div className="border-b border-white/40 px-4 py-3 dark:border-neutral-800/60">
                <h3 className={cn("text-sm font-semibold", learningSectionHeading)}>
                  Notificações
                </h3>
                <p className={cn("text-xs", learningMutedText)}>{unreadCount} não lidas</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFICATIONS.map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 text-sm transition-colors",
                      notif.unread
                        ? "bg-gradient-to-r from-blue-100/60 to-purple-100/60 dark:from-blue-500/10 dark:to-purple-500/10"
                        : "hover:bg-white/40 dark:hover:bg-neutral-800/60",
                    )}
                  >
                    {notif.unread && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                    )}
                    <div className="space-y-1">
                      <p className={cn("font-medium", learningSectionHeading)}>{notif.title}</p>
                      <p className={cn("text-xs", learningMutedText)}>{notif.description}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/40 p-2 dark:border-neutral-800/60">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  Ver todas as notificações
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label="Alternar tema"
            className="text-slate-600 hover:bg-white/40 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-neutral-800/60 dark:hover:text-white"
          >
            {isLightTheme ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                <Avatar>
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                      profile.name || "english-app",
                    )}`}
                    alt={profile.name}
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={cn("w-60", learningSurfaceCard)} align="end">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <p className={cn("text-sm font-semibold", learningSectionHeading)}>
                    {profile.name || "English App"}
                  </p>
                  <p className={cn("text-xs", learningMutedText)}>
                    Nível {profile.level || "—"} • {profile.track || "Trilha indefinida"}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuItem>
                <FileText className="mr-2 h-4 w-4" />
                Exportar dados
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-orange-500 focus:text-orange-500">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade para Pro
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-rose-500 focus:text-rose-500" onClick={onLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
