import { useState } from "react";
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCleanTime = (years: number, days: number) => {
    const yearsStr = years > 0 ? `${years.toString().padStart(2, "0")} ${years === 1 ? "Año" : "Años"}` : "";
    const daysStr = `${days.toString().padStart(2, "0")} ${days === 1 ? "Día" : "Días"}`;
    return yearsStr ? `${yearsStr} ${daysStr}` : daysStr;
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Comunidad</h1>
        <p className="text-muted-foreground">
          Conecta con otros miembros en recuperación y celebra sus logros
        </p>
      </div>

      {/* Availability Toggle */}
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

      {/* Community Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">🏅</span>
            Ranking de Tiempo en Rehabilitación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockUsers.map((user, index) => (
              <div
                key={user.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${
                  user.availableForHelp
                    ? "bg-primary/5 border border-primary/20"
                    : "bg-muted/30"
                }`}
              >
                {/* Ranking Number */}
                <div className="flex-shrink-0 w-8 text-center">
                  <span
                    className={`font-bold text-lg ${
                      index === 0
                        ? "text-yellow-500"
                        : index === 1
                        ? "text-gray-400"
                        : index === 2
                        ? "text-amber-700"
                        : "text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </span>
                </div>

                {/* Avatar */}
                <Avatar className="h-12 w-12">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{user.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Tiempo limpio: {formatCleanTime(user.years, user.days)}
                  </p>
                </div>

                {/* Medals */}
                <div className="flex gap-1">
                  {user.medals.map((medal, idx) => (
                    <span key={idx} className="text-xl">
                      {medal}
                    </span>
                  ))}
                </div>

                {/* Availability Badge */}
                {user.availableForHelp && (
                  <Badge variant="secondary" className="flex-shrink-0">
                    Disponible
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
