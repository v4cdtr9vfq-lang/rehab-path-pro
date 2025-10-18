import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface CommunityUser {
  id: string;
  name: string;
  avatar: string;
  years: number;
  days: number;
  medals: string[];
  availableForHelp: boolean;
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

export default function Community() {
  const [isAvailableForHelp, setIsAvailableForHelp] = useState(false);
  const [userMedals, setUserMedals] = useState<string[]>([]);

  // Calcular las medallas del usuario actual basado en días de sobriedad
  // Este valor debería venir del backend en una implementación real
  const calculateUserMedals = () => {
    // Placeholder - en una implementación real obtendríamos esto del backend
    const sobrietyDays = 45; // Ejemplo
    const medals = [];
    
    if (sobrietyDays >= 180) medals.push("🏆");
    if (sobrietyDays >= 90) medals.push("🥇");
    if (sobrietyDays >= 40) medals.push("🥈");
    if (sobrietyDays >= 0) medals.push("🥉");
    
    setUserMedals(medals);
  };

  useEffect(() => {
    calculateUserMedals();
  }, []);

  const hasAnyMedal = userMedals.length > 0;

  // Sort users by time: years descending, then days descending
  const sortedUsers = [...mockUsers].sort((a, b) => {
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Comunidad</h1>
        <p className="text-muted-foreground">
          Conecta con otros miembros en recuperación y celebra sus logros
        </p>
      </div>

      {/* Availability Toggle - Solo para usuarios con medallas */}
      {hasAnyMedal && (
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="available-help" className="text-base font-semibold">
                  Disponible para asistencia
                </Label>
                <p className="text-sm text-muted-foreground">
                  Indica si estás disponible para ayudar a otros miembros de la comunidad
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

      {/* Community Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Tiempo en Rehabilitación
            <span className="text-2xl">🏆</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Header Legend */}
          <div className="grid grid-cols-[60px_1fr_60px_60px_120px_100px] gap-3 px-4 pb-3 text-sm font-medium text-muted-foreground mb-3">
            <div></div>
            <div>Nombre</div>
            <div className="text-center">Años</div>
            <div className="text-center">Días</div>
            <div className="text-center">Medallas</div>
            <div></div>
          </div>

          <div className="space-y-3">
            {sortedUsers.map((user) => (
              <div
                key={user.id}
                className={`grid grid-cols-[60px_1fr_60px_60px_120px_100px] gap-3 items-center p-4 rounded-xl transition-colors ${
                  user.availableForHelp
                    ? "bg-success/10 border border-success/30"
                    : "bg-muted/30"
                }`}
              >
                {/* Avatar */}
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback 
                    className={`${getAvatarColor(user.years, user.days).className} font-semibold`}
                    style={getAvatarColor(user.years, user.days).style}
                  >
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Name */}
                <h3 className="font-semibold truncate">{user.name.split(" ")[0]}</h3>

                {/* Years */}
                <div className="text-center font-bold text-lg">
                  {user.years.toString().padStart(2, "0")}
                </div>

                {/* Days */}
                <div className="text-center font-bold text-lg">
                  {user.days.toString().padStart(3, "0")}
                </div>

                {/* Medals */}
                <div className="flex gap-1 justify-center">
                  {getMedalsByTime(user.years, user.days).map((medal, idx) => (
                    <span key={idx} className="text-xl">
                      {medal}
                    </span>
                  ))}
                </div>

                {/* Availability Badge */}
                <div className="flex justify-end">
                  {user.availableForHelp && (
                    <Badge variant="secondary" className="flex-shrink-0">
                      Disponible
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
