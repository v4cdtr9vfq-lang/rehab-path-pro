import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";

interface CommunityUser {
  id: string;
  name: string;
  avatar: string;
  years: number;
  days: number;
  medals: string[];
  availableForHelp: boolean;
  realMedalsCount?: number;
}

const mockUsers: CommunityUser[] = [
  { id: "1", name: "Carlos Martínez", avatar: "", years: 5, days: 127, medals: ["🏆", "⭐", "💎"], availableForHelp: true },
  { id: "2", name: "Ana García", avatar: "", years: 4, days: 289, medals: ["🏆", "⭐", "💎", "🎯"], availableForHelp: true },
  { id: "3", name: "Luis Hernández", avatar: "", years: 3, days: 45, medals: ["🏆", "⭐"], availableForHelp: false },
  { id: "4", name: "María López", avatar: "", years: 3, days: 12, medals: ["🏆", "⭐", "💎"], availableForHelp: true },
  { id: "5", name: "Pedro Sánchez", avatar: "", years: 2, days: 354, medals: ["🏆", "⭐"], availableForHelp: false },
  { id: "6", name: "Laura Rodríguez", avatar: "", years: 2, days: 201, medals: ["🏆", "⭐", "💎", "🎯"], availableForHelp: true },
  { id: "7", name: "José Fernández", avatar: "", years: 2, days: 87, medals: ["🏆"], availableForHelp: false },
  { id: "8", name: "Carmen Díaz", avatar: "", years: 1, days: 312, medals: ["🏆", "⭐", "💎"], availableForHelp: true },
  { id: "9", name: "Antonio Ruiz", avatar: "", years: 1, days: 267, medals: ["🏆", "⭐"], availableForHelp: true },
  { id: "10", name: "Isabel Torres", avatar: "", years: 1, days: 198, medals: ["🏆"], availableForHelp: false },
  { id: "11", name: "Miguel Ramírez", avatar: "", years: 1, days: 154, medals: ["🏆", "⭐"], availableForHelp: true },
  { id: "12", name: "Rosa Jiménez", avatar: "", years: 1, days: 89, medals: ["🏆"], availableForHelp: false },
  { id: "13", name: "Francisco Moreno", avatar: "", years: 1, days: 45, medals: ["🏆", "⭐"], availableForHelp: true },
  { id: "14", name: "Pilar Álvarez", avatar: "", years: 0, days: 321, medals: ["⭐"], availableForHelp: false },
  { id: "15", name: "David Romero", avatar: "", years: 0, days: 289, medals: ["⭐", "💎"], availableForHelp: true },
  { id: "16", name: "Teresa Navarro", avatar: "", years: 0, days: 234, medals: ["⭐"], availableForHelp: true },
  { id: "17", name: "Javier Gil", avatar: "", years: 0, days: 187, medals: ["⭐"], availableForHelp: false },
  { id: "18", name: "Elena Castro", avatar: "", years: 0, days: 156, medals: ["⭐", "💎"], availableForHelp: true },
  { id: "19", name: "Manuel Ortiz", avatar: "", years: 0, days: 123, medals: ["⭐"], availableForHelp: false },
  { id: "20", name: "Lucía Rubio", avatar: "", years: 0, days: 98, medals: [], availableForHelp: true },
  { id: "21", name: "Sergio Molina", avatar: "", years: 0, days: 76, medals: ["⭐"], availableForHelp: true },
  { id: "22", name: "Marta Delgado", avatar: "", years: 0, days: 54, medals: [], availableForHelp: false },
  { id: "23", name: "Raúl Serrano", avatar: "", years: 0, days: 32, medals: [], availableForHelp: true },
  { id: "24", name: "Patricia Vega", avatar: "", years: 0, days: 21, medals: [], availableForHelp: false },
  { id: "25", name: "Alberto Méndez", avatar: "", years: 0, days: 14, medals: [], availableForHelp: true },
];

const REHABILITATION_TYPES = [
  { id: 'todos', label: 'Todos' },
  { id: 'azucar', label: 'Azúcar' },
  { id: 'codependencia', label: 'Codependencia' },
  { id: 'comida', label: 'Comida' },
  { id: 'compras', label: 'Compras' },
  { id: 'drama', label: 'Drama' },
  { id: 'narcoticos', label: 'Narcóticos' },
  { id: 'pornografia', label: 'Pornografía' },
  { id: 'redes_sociales', label: 'Redes Sociales' },
  { id: 'videojuegos', label: 'Videojuegos' },
  { id: 'otros', label: 'Otros' },
] as const;

export default function Community() {
  const isMobile = useIsMobile();
  const [isAvailableForHelp, setIsAvailableForHelp] = useState(false);
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("todos");
  const [loading, setLoading] = useState(true);

  // Obtener datos reales del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Obtener perfil y fecha de abstinencia
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, abstinence_start_date')
          .eq('user_id', user.id)
          .single();

        if (profile?.abstinence_start_date) {
          const absDate = new Date(profile.abstinence_start_date);
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - absDate.getTime());
          const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          // Calcular años y días restantes
          const years = Math.floor(totalDays / 365);
          const remainingDays = totalDays % 365;

          // Obtener medallas reales del usuario desde la base de datos
          const { data: medals } = await supabase
            .from('medals')
            .select('medal_type')
            .eq('user_id', user.id);

          // Convertir las medallas de la DB al formato de emojis
          const userMedals = getMedalsByTime(years, remainingDays);
          const realMedalsCount = medals?.length || 0;

          setCurrentUser({
            id: user.id,
            name: profile.full_name || user.user_metadata?.full_name || 'Javier',
            avatar: '',
            years,
            days: remainingDays,
            medals: userMedals,
            availableForHelp: isAvailableForHelp,
            realMedalsCount // Guardamos el conteo real de medallas
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isAvailableForHelp]);

  // Solo mostrar el widget cuando tenga TODAS las medallas (4 medallas) en la base de datos
  const hasAllMedals = currentUser ? (currentUser as any).realMedalsCount >= 4 : false;

  // Combinar usuario actual con usuarios mock y ordenar
  const allUsers = currentUser 
    ? [...mockUsers, currentUser]
    : mockUsers;

  // Sort users by time: years descending, then days descending
  const sortedUsers = allUsers
    .filter((user) => {
      if (selectedFilter === "todos") return true;
      // Filter by rehabilitation type (in real implementation, this would come from user data)
      // For now, we'll show all users when filtering
      return true;
    })
    .sort((a, b) => {
      if (a.years !== b.years) {
        return b.years - a.years;
      }
      return b.days - a.days;
    });

  const getInitials = (name: string) => {
    // Solo tomar el primer nombre
    const firstName = name.split(" ")[0];
    return firstName.slice(0, 2).toUpperCase();
  };

  const getMedalsByTime = (years: number, days: number) => {
    const totalDays = years * 365 + days;
    const medals = [];
    
    // Medallas basadas en días totales
    if (totalDays >= 180) medals.push("🏆"); // Libertad
    if (totalDays >= 90) medals.push("🥇"); // Recuperación
    if (totalDays >= 40) medals.push("🥈"); // Constancia
    medals.push("🥉"); // Valor (siempre)
    
    return medals;
  };

  const getAvatarColor = (years: number, days: number) => {
    const totalDays = years * 365 + days;
    
    // Verde para medallas de oro (90+) y copa (180+)
    if (totalDays >= 90) return { className: "bg-success/20 text-success" };
    // Amarillo específico para medalla de plata (40+)
    if (totalDays >= 40) return { className: "text-[#e6c25c]", style: { backgroundColor: '#e6c25c20' } };
    // Naranja para medalla de bronce (0+)
    return { className: "bg-orange-500/20 text-orange-600" };
  };

  return (
    <div className="container mx-auto px-4 py-2 max-w-6xl">

      {/* Community Ranking */}
      <Card className="mb-[30px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Tiempo limpio:
            </CardTitle>
            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {REHABILITATION_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {/* Header Legend */}
          {!isMobile && (
            <div className="grid grid-cols-[auto_auto_100px_120px] gap-3 px-4 pb-3 text-sm font-medium text-muted-foreground mb-3">
              <div className="pl-[55px]">Nombre:</div>
              <div className="flex gap-1 -ml-[5px]">
                <div className="w-[60px] text-left">Años:</div>
                <div className="w-[60px] text-left">Meses:</div>
                <div className="w-[60px] text-left">Días:</div>
              </div>
              <div></div>
              <div className="text-left pl-0">Medallas:</div>
            </div>
          )}

          <div className="space-y-3">
            {sortedUsers.map((user) => {
              // Calcular meses y días restantes
              const months = Math.floor(user.days / 30);
              const remainingDays = user.days % 30;
              const totalDays = user.years * 365 + user.days;
              const userHasAllMedals = getMedalsByTime(user.years, user.days).length >= 4;
              const canShowAvailability = userHasAllMedals; // Solo mostrar si tiene todas las medallas
              const isCurrentUser = currentUser && user.id === currentUser.id;
              
              if (isMobile) {
                return (
                  <div
                    key={user.id}
                    className={`p-3 rounded-xl transition-colors ${
                      isCurrentUser
                        ? "bg-primary/10 border border-primary"
                        : user.availableForHelp && canShowAvailability
                        ? "bg-success/10 border border-success/30"
                        : "bg-muted/30"
                    }`}
                  >
                    {/* Top row: Avatar, Name, and Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback 
                            className={`${getAvatarColor(user.years, user.days).className} font-semibold text-xs`}
                            style={getAvatarColor(user.years, user.days).style}
                          >
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-sm truncate">{user.name.split(" ")[0]}</h3>
                      </div>
                      {user.availableForHelp && canShowAvailability && (
                        <Badge variant="secondary" className="flex-shrink-0 bg-success/20 text-success border-success/30 text-xs px-2 py-0">
                          Disponible
                        </Badge>
                      )}
                    </div>

                    {/* Bottom row: Time and Medals */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 items-center text-sm">
                        <span className="font-bold">{user.years.toString().padStart(2, "0")}</span>
                        <span className="text-muted-foreground text-xs">A.</span>
                        <span className="font-bold">{months.toString().padStart(2, "0")}</span>
                        <span className="text-muted-foreground text-xs">M.</span>
                        <span className="font-bold">{remainingDays.toString().padStart(2, "0")}</span>
                        <span className="text-muted-foreground text-xs">D.</span>
                      </div>
                      <div className="flex gap-1">
                        {getMedalsByTime(user.years, user.days).map((medal, idx) => (
                          <span key={idx} className="text-base">
                            {medal}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={user.id}
                  className={`grid grid-cols-[auto_auto_100px_120px] gap-3 items-center p-4 rounded-xl transition-colors ${
                    isCurrentUser
                      ? "bg-primary/10 border border-primary"
                      : user.availableForHelp && canShowAvailability
                      ? "bg-success/10 border border-success/30"
                      : "bg-muted/30"
                  }`}
                >
                  {/* Avatar and Name - grouped with smaller gap */}
                  <div className="flex items-center gap-[15px]">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback 
                        className={`${getAvatarColor(user.years, user.days).className} font-semibold`}
                        style={getAvatarColor(user.years, user.days).style}
                      >
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold truncate">{user.name.split(" ")[0]}</h3>
                  </div>

                  {/* Years, Months, Days - grouped with smaller gap */}
                  <div className="flex gap-1 items-center -ml-[5px]">
                    {/* Years */}
                    <div className="font-bold text-lg w-[60px] text-left">
                      {user.years.toString().padStart(2, "0")}
                    </div>

                    {/* Months */}
                    <div className="font-bold text-lg w-[60px] text-left">
                      {months.toString().padStart(2, "0")}
                    </div>

                    {/* Days */}
                    <div className="font-bold text-lg w-[60px] text-left">
                      {remainingDays.toString().padStart(2, "0")}
                    </div>
                  </div>

                  {/* Availability Badge */}
                  <div className="flex justify-center">
                    {user.availableForHelp && canShowAvailability && (
                      <Badge variant="secondary" className="flex-shrink-0 bg-success/20 text-success border-success/30">
                        Disponible
                      </Badge>
                    )}
                  </div>

                  {/* Medals */}
                  <div className="flex gap-1 justify-start">
                    {getMedalsByTime(user.years, user.days).map((medal, idx) => (
                      <span key={idx} className="text-xl">
                        {medal}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Availability Toggle - Solo para usuarios con TODAS las medallas (4) */}
      {hasAllMedals && (
        <Card className="border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="available-help" className="text-base font-semibold">
                  Disponible para asistencia
                </Label>
                <p className="text-sm text-muted-foreground">
                  Has desbloqueado todas las medallas. Indica si estás disponible para ayudar a otros miembros de la comunidad.
                </p>
              </div>
              <Switch
                id="available-help"
                checked={isAvailableForHelp}
                onCheckedChange={setIsAvailableForHelp}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
