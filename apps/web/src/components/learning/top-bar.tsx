"use client";

import { useMemo } from "react";
import { Bell, Crown, FileText, LogOut, Moon, Settings, Sun, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

  return (
    <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            AI
          </div>
          <span className="hidden sm:inline-block">English AI Tutor</span>
        </div>

        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 p-0 text-[10px] text-white">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Notificações</h3>
                <p className="text-xs text-muted-foreground">{unreadCount} não lidas</p>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFICATIONS.map((notif) => (
                  <div
                    key={notif.id}
                    className={[
                      "flex gap-3 px-4 py-3 text-sm transition hover:bg-muted/70",
                      notif.unread ? "bg-blue-50/50" : "",
                    ].join(" ")}
                  >
                    {notif.unread && <span className="mt-1 h-2 w-2 rounded-full bg-blue-500" />}
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.description}</p>
                      <p className="text-xs text-muted-foreground/70">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full">
                  Ver todas as notificações
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" onClick={onToggleTheme} aria-label="Alternar tema">
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
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
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60" align="end">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {profile.name || "English App"}
                  </p>
                  <p className="text-xs text-muted-foreground">
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
              <DropdownMenuItem className="text-orange-600 focus:text-orange-600">
                <Crown className="mr-2 h-4 w-4" />
                Upgrade para Pro
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={onLogout}
              >
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
