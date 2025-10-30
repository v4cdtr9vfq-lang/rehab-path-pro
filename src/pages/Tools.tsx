import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wind, Anchor, Phone, AlertCircle, HeartPulse } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Tools() {
  const { t } = useTranslation();
  
  const tools = [
    {
      icon: Wind,
      title: t('tools.breathingExercise'),
      description: t('tools.breathingDesc'),
      color: "text-sky-blue",
      bgColor: "bg-sky-blue/10"
    },
    {
      icon: Anchor,
      title: t('tools.anchoringExercise'),
      description: t('tools.anchoringDesc'),
      color: "text-sky-blue",
      bgColor: "bg-sky-blue/10"
    },
    {
      icon: AlertCircle,
      title: t('tools.crisisPlan'),
      description: t('tools.crisisPlanDesc'),
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      icon: HeartPulse,
      title: t('tools.selfCareMenu'),
      description: t('tools.selfCareMenuDesc'),
      color: "text-sky-blue",
      bgColor: "bg-sky-blue/10"
    }
  ];

  return (
    <div className="space-y-[35px] animate-in fade-in duration-500">
      <Card className="border-destructive/30 bg-gradient-to-br from-destructive/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2 text-xl">{t('tools.inCrisis')}</h3>
              <p className="text-sm text-foreground/80 mb-4">
                {t('tools.crisisMessage')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="destructive" className="gap-2">
                  <Phone className="h-4 w-4" />
                  {t('tools.callCrisisLine')}
                </Button>
                <Link to="/support-network">
                  <Button variant="outline" className="w-full sm:w-auto">
                    {t('tools.viewSupportNetwork')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {tools.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <Card
              key={index}
              className="border-primary/20 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
            >
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${tool.bgColor}`}>
                    <Icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <CardTitle className="text-xl">{tool.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/80">{tool.description}</p>
              </CardContent>
            </Card>
          );
        })}

        {/* Mi red de apoyo card with link to dedicated page */}
        <Link to="/support-network" className="md:col-span-2">
          <Card className="border-primary/20 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-sky-blue/10">
                  <Phone className="h-6 w-6 text-sky-blue" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">{t('tools.supportNetwork')}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('tools.supportNetworkDesc')}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
