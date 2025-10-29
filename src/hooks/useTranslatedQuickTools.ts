import { useTranslation } from "react-i18next";

export const useTranslatedQuickTools = () => {
  const { t } = useTranslation();
  
  return [{
    emoji: "📔",
    label: t('quickTools.journal'),
    path: "/journal",
    color: "text-primary"
  }, {
    emoji: "😊",
    label: t('quickTools.emotionJournal'),
    path: "/emotion-journal",
    color: "text-primary"
  }, {
    emoji: "🙏",
    label: t('quickTools.gratitude'),
    path: "/gratitude",
    color: "text-accent"
  }, {
    emoji: "🚨",
    label: t('quickTools.emergencyPlan'),
    path: "/tools",
    color: "text-destructive"
  }];
};
