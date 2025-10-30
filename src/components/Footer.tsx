import { Link } from "react-router-dom";
import { Heart, Mail, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="mt-auto border-t border-border bg-card/50 backdrop-blur">
      <div className="mx-auto px-[15px] lg:px-8 max-w-6xl pt-12 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Rehabp.org</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('landing.subtitle')}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t('navigation.dashboard')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('navigation.dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/plan" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('navigation.plan')}
                </Link>
              </li>
              <li>
                <Link to="/progress" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('navigation.progress')}
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('navigation.tools')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t('help.resources')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('navigation.help')}
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('navigation.community')}
                </a>
              </li>
              <li>
                <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('navigation.settings')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">{t('footer.legal')}</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('settings.privacyPolicy')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('settings.termsOfService')}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {t('footer.cookies')}
                </a>
              </li>
              <li>
                <a href="mailto:info@rehabp.org" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-4 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-6">
            {/* About Us Button */}
            <a 
              href="https://somosfelices.substack.com/" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-foreground/80 transition-colors underline"
            >
              Nosotr♡s
            </a>
            
            {/* Contact Email */}
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-foreground" />
              <a 
                href="mailto:somos@felices.org" 
                className="text-foreground hover:text-foreground/80 transition-colors underline"
              >
                somos@felices.org
              </a>
            </div>
          </div>
          
          <a 
            href="https://neurotropy.com/" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground hover:text-foreground/80 transition-colors text-center md:text-right"
          >
            {new Date().getFullYear()} © Neurotropy™
          </a>
        </div>
      </div>
    </footer>
  );
}
