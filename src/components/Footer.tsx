import { Link } from "react-router-dom";
import { Heart, Mail, Info } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50 backdrop-blur">
      <div className="container mx-auto px-4 lg:px-8 max-w-6xl py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Rehabp.org</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu compañero en el camino hacia la recuperación y el bienestar.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Enlaces rápidos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Mi Centro
                </Link>
              </li>
              <li>
                <Link to="/plan" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Mi Plan
                </Link>
              </li>
              <li>
                <Link to="/progress" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Progreso
                </Link>
              </li>
              <li>
                <Link to="/tools" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Herramientas
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Recursos</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/help" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Centro de ayuda
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Comunidad
                </a>
              </li>
              <li>
                <Link to="/settings" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Configuración
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Política de privacidad
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Términos de servicio
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Política de cookies
                </a>
              </li>
              <li>
                <a href="mailto:info@rehabp.org" className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  Contacto
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-4 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
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
                href="mailto:info@neurotropy.com" 
                className="text-foreground hover:text-foreground/80 transition-colors underline"
              >
                info@neurotropy.com
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
