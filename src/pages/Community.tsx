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
import DirectChatDialog from "@/components/DirectChatDialog";

interface CommunityUser {
  id: string;
  name: string;
  avatar: string;
  years: number;
  months: number;
  days: number;
  medals: string[];
  availableForHelp: boolean;
  rehabilitationType: string;
  realMedalsCount?: number;
}

const mockUsers: CommunityUser[] = [
  { id: "1", name: "Carlos Martínez", avatar: "", years: 5, months: 4, days: 7, medals: ["🏆", "⭐", "💎"], availableForHelp: true, rehabilitationType: "narcoticos" },
  { id: "2", name: "Ana García", avatar: "", years: 4, months: 9, days: 19, medals: ["🏆", "⭐", "💎", "🎯"], availableForHelp: true, rehabilitationType: "pornografia" },
  { id: "3", name: "Luis Hernández", avatar: "", years: 3, months: 1, days: 15, medals: ["🏆", "⭐"], availableForHelp: false, rehabilitationType: "narcoticos" },
  { id: "4", name: "María López", avatar: "", years: 3, months: 0, days: 12, medals: ["🏆", "⭐", "💎"], availableForHelp: true, rehabilitationType: "codependencia" },
  { id: "5", name: "Pedro Sánchez", avatar: "", years: 2, months: 11, days: 24, medals: ["🏆", "⭐"], availableForHelp: false, rehabilitationType: "azucar" },
  { id: "6", name: "Laura Rodríguez", avatar: "", years: 2, months: 6, days: 21, medals: ["🏆", "⭐", "💎", "🎯"], availableForHelp: true, rehabilitationType: "pornografia" },
  { id: "7", name: "José Fernández", avatar: "", years: 2, months: 2, days: 27, medals: ["🏆"], availableForHelp: false, rehabilitationType: "videojuegos" },
  { id: "8", name: "Carmen Díaz", avatar: "", years: 1, months: 10, days: 12, medals: ["🏆", "⭐", "💎"], availableForHelp: true, rehabilitationType: "comida" },
  { id: "9", name: "Antonio Ruiz", avatar: "", years: 1, months: 8, days: 27, medals: ["🏆", "⭐"], availableForHelp: true, rehabilitationType: "narcoticos" },
  { id: "10", name: "Isabel Torres", avatar: "", years: 1, months: 6, days: 18, medals: ["🏆"], availableForHelp: false, rehabilitationType: "redes_sociales" },
  { id: "11", name: "Miguel Ramírez", avatar: "", years: 1, months: 5, days: 4, medals: ["🏆", "⭐"], availableForHelp: true, rehabilitationType: "pornografia" },
  { id: "12", name: "Rosa Jiménez", avatar: "", years: 1, months: 2, days: 29, medals: ["🏆"], availableForHelp: false, rehabilitationType: "compras" },
  { id: "13", name: "Francisco Moreno", avatar: "", years: 1, months: 1, days: 15, medals: ["🏆", "⭐"], availableForHelp: true, rehabilitationType: "pornografia" },
  { id: "14", name: "Pilar Álvarez", avatar: "", years: 0, months: 10, days: 21, medals: ["⭐"], availableForHelp: false, rehabilitationType: "drama" },
  { id: "15", name: "David Romero", avatar: "", years: 0, months: 9, days: 19, medals: ["⭐", "💎"], availableForHelp: true, rehabilitationType: "pornografia" },
  { id: "16", name: "Teresa Navarro", avatar: "", years: 0, months: 7, days: 24, medals: ["⭐"], availableForHelp: true, rehabilitationType: "narcoticos" },
  { id: "17", name: "Javier Gil", avatar: "", years: 0, months: 6, days: 7, medals: ["⭐"], availableForHelp: false, rehabilitationType: "videojuegos" },
  { id: "18", name: "Elena Castro", avatar: "", years: 0, months: 5, days: 6, medals: ["⭐", "💎"], availableForHelp: true, rehabilitationType: "codependencia" },
  { id: "19", name: "Manuel Ortiz", avatar: "", years: 0, months: 4, days: 3, medals: ["⭐"], availableForHelp: false, rehabilitationType: "azucar" },
  { id: "20", name: "Lucía Rubio", avatar: "", years: 0, months: 3, days: 8, medals: [], availableForHelp: true, rehabilitationType: "redes_sociales" },
  { id: "21", name: "Sergio Molina", avatar: "", years: 0, months: 2, days: 16, medals: ["⭐"], availableForHelp: true, rehabilitationType: "pornografia" },
  { id: "22", name: "Marta Delgado", avatar: "", years: 0, months: 1, days: 24, medals: [], availableForHelp: false, rehabilitationType: "comida" },
  { id: "23", name: "Raúl Serrano", avatar: "", years: 0, months: 1, days: 2, medals: [], availableForHelp: true, rehabilitationType: "otros" },
  { id: "24", name: "Patricia Vega", avatar: "", years: 0, months: 0, days: 21, medals: [], availableForHelp: false, rehabilitationType: "narcoticos" },
  { id: "25", name: "Alberto Méndez", avatar: "", years: 0, months: 0, days: 14, medals: [], availableForHelp: true, rehabilitationType: "pornografia" },
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
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'videojuegos', label: 'Videojuegos' },
  { id: 'otros', label: 'Otros' },
] as const;

export default function Community() {
  const isMobile = useIsMobile();
  const [isAvailableForHelp, setIsAvailableForHelp] = useState(false);
  const [currentUser, setCurrentUser] = useState<CommunityUser | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("todos");
  const [loading, setLoading] = useState(true);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  // Obtener datos reales del usuario
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Obtener perfil y fecha de abstinencia
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, abstinence_start_date, rehabilitation_type')
          .eq('user_id', user.id)
          .single();

        if (profile?.abstinence_start_date) {
          const absDate = new Date(profile.abstinence_start_date);
          const today = new Date();
          
          // Calcular días totales correctamente
          const diffTime = today.getTime() - absDate.getTime();
          const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          
          // Calcular años, meses y días
          const years = Math.floor(totalDays / 365);
          const daysAfterYears = totalDays % 365;
          const months = Math.floor(daysAfterYears / 30);
          const days = daysAfterYears % 30;

          // Obtener medallas reales del usuario desde la base de datos
          const { data: medals } = await supabase
            .from('medals')
            .select('medal_type')
            .eq('user_id', user.id);

          const realMedalsCount = medals?.length || 0;

          setCurrentUser({
            id: user.id,
            name: profile.full_name || user.user_metadata?.full_name || 'Javier',
            avatar: '',
            years,
            months,
            days,
            medals: getMedalsByTime(totalDays),
            availableForHelp: isAvailableForHelp,
            rehabilitationType: profile.rehabilitation_type || 'otros',
            realMedalsCount
          });

          // Establecer filtro por defecto basado en el tipo de rehabilitación del usuario
          // Solo si no hay un filtro guardado previamente
          const savedFilter = localStorage.getItem('community-filter');
          if (!savedFilter && profile.rehabilitation_type) {
            setSelectedFilter(profile.rehabilitation_type);
          } else if (savedFilter) {
            setSelectedFilter(savedFilter);
          }
          
          console.log('Usuario cargado:', {
            name: profile.full_name || user.user_metadata?.full_name || 'Javier',
            years,
            months, 
            days,
            totalDays,
            medalsCount: realMedalsCount,
            rehabilitationType: profile.rehabilitation_type
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

  // Guardar filtro seleccionado en localStorage
  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
    localStorage.setItem('community-filter', value);
  };

  // Solo mostrar el widget cuando tenga TODAS las medallas (4 medallas) en la base de datos
  const hasAllMedals = currentUser ? (currentUser as any).realMedalsCount >= 4 : false;

  // Combinar usuario actual con usuarios mock y ordenar
  const allUsers = currentUser 
    ? [...mockUsers, currentUser]
    : mockUsers;

  // Sort users by time: years descending, then months, then days
  const sortedUsers = allUsers
    .filter((user) => {
      if (selectedFilter === "todos") return true;
      // Filtrar por tipo de rehabilitación
      return user.rehabilitationType === selectedFilter;
    })
    .sort((a, b) => {
      // Sort by years first
      if (a.years !== b.years) {
        return b.years - a.years;
      }
      // Then by months
      if (a.months !== b.months) {
        return b.months - a.months;
      }
      // Finally by days
      return b.days - a.days;
    });

  const getInitials = (name: string) => {
    // Solo tomar la primera letra del nombre
    return name.charAt(0).toUpperCase();
  };

  const getMedalsByTime = (totalDays: number) => {
    const medals = [];
    
    // Medallas basadas en días totales
    if (totalDays >= 180) medals.push("🏆"); // Libertad (6 meses)
    if (totalDays >= 90) medals.push("🥇"); // Recuperación (3 meses)
    if (totalDays >= 40) medals.push("🥈"); // Constancia
    medals.push("🥉"); // Valor (siempre)
    
    return medals;
  };

  const getAvatarColor = (totalDays: number) => {
    // Verde para medallas de oro (90+) y copa (180+)
    if (totalDays >= 90) return { className: "bg-success/20 text-success" };
    // Amarillo específico para medalla de plata (40+)
    if (totalDays >= 40) return { className: "text-[#e6c25c]", style: { backgroundColor: '#e6c25c20' } };
    // Naranja para medalla de bronce (0+)
    return { className: "bg-orange-500/20 text-orange-600" };
  };

  return (
    <>
      <div className="container mx-auto px-4 py-2 max-w-6xl">

      {/* Community Ranking */}
      <Card className="mb-[30px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              Tiempo limpio:
            </CardTitle>
            <Select value={selectedFilter} onValueChange={handleFilterChange}>
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
            <div className="grid grid-cols-[minmax(180px,1fr)_180px_90px_110px] gap-3 px-4 pb-3 text-sm font-medium text-muted-foreground mb-3">
              <div className="pl-[55px]">Nombre:</div>
              <div className="flex gap-1 -ml-[60px]">
                <div className="w-[60px] text-center">Años:</div>
                <div className="w-[60px] text-center">Meses:</div>
                <div className="w-[60px] text-center">Días:</div>
              </div>
              <div className="text-right"></div>
              <div className="text-right">Medallas:</div>
            </div>
          )}

          <div className="space-y-3">
            {sortedUsers.map((user) => {
              const totalDays = user.years * 365 + user.months * 30 + user.days;
              const userHasAllMedals = getMedalsByTime(totalDays).length >= 4;
              const canShowAvailability = userHasAllMedals;
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
                            className={`${getAvatarColor(totalDays).className} font-semibold text-xs`}
                            style={getAvatarColor(totalDays).style}
                          >
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-sm truncate">{user.name.split(" ")[0]}</h3>
                      </div>
                      {user.availableForHelp && canShowAvailability && (
                        <Badge 
                          variant="secondary" 
                          className="flex-shrink-0 bg-success/20 text-success border-success/30 text-xs px-2 py-0 cursor-pointer hover:bg-success/30"
                          onClick={() => {
                            setSelectedUser({ id: user.id, name: user.name });
                            setChatDialogOpen(true);
                          }}
                        >
                          Disponible
                        </Badge>
                      )}
                    </div>

                    {/* Bottom row: Time and Medals */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 items-center text-sm">
                        <span className="font-bold">{user.years.toString().padStart(2, "0")}</span>
                        <span className="text-muted-foreground text-xs">A.</span>
                        <span className="font-bold">{user.months.toString().padStart(2, "0")}</span>
                        <span className="text-muted-foreground text-xs">M.</span>
                        <span className="font-bold">{user.days.toString().padStart(2, "0")}</span>
                        <span className="text-muted-foreground text-xs">D.</span>
                      </div>
                      <div className="flex gap-1">
                        {getMedalsByTime(totalDays).map((medal, idx) => (
                          <span key={idx} className="text-2xl">
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
                  className={`grid grid-cols-[minmax(180px,1fr)_180px_90px_110px] gap-1 items-center p-4 rounded-xl transition-colors overflow-hidden ${
                    isCurrentUser
                      ? "bg-primary/10 border border-primary"
                      : user.availableForHelp && canShowAvailability
                      ? "bg-success/10 border border-success/30"
                      : "bg-muted/30"
                  }`}
                >
                  {/* Avatar and Name */}
                  <div className="flex items-center gap-[15px] min-w-0">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback 
                        className={`${getAvatarColor(totalDays).className} font-semibold`}
                        style={getAvatarColor(totalDays).style}
                      >
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold truncate">{user.name.split(" ")[0]}</h3>
                  </div>

                  {/* Years, Months, Days */}
                  <div className="flex gap-1 items-center justify-start -ml-[60px]">
                    <div className="font-bold text-lg w-[60px] text-center">
                      {user.years.toString().padStart(2, "0")}
                    </div>
                    <div className="font-bold text-lg w-[60px] text-center">
                      {user.months.toString().padStart(2, "0")}
                    </div>
                    <div className="font-bold text-lg w-[60px] text-center">
                      {user.days.toString().padStart(2, "0")}
                    </div>
                  </div>

                  {/* Availability Badge */}
                  <div className="flex justify-end overflow-hidden">
                    {user.availableForHelp && canShowAvailability && (
                      <Badge 
                        variant="secondary" 
                        className="bg-success/20 text-success border-success/30 text-xs px-2 whitespace-nowrap cursor-pointer hover:bg-success/30"
                        onClick={() => {
                          setSelectedUser({ id: user.id, name: user.name });
                          setChatDialogOpen(true);
                        }}
                      >
                        Disponible
                      </Badge>
                    )}
                  </div>

                  {/* Medals */}
                  <div className="flex gap-0.5 justify-end items-center overflow-hidden">
                    {getMedalsByTime(totalDays).map((medal, idx) => (
                      <span key={idx} className="text-2xl flex-shrink-0">
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

      {/* Direct Chat Dialog */}
      {selectedUser && (
        <DirectChatDialog
          open={chatDialogOpen}
          onOpenChange={setChatDialogOpen}
          otherUserId={selectedUser.id}
          otherUserName={selectedUser.name}
        />
      )}
    </>
  );
}
