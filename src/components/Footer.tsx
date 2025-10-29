import { Link } from "react-router-dom";
import { Heart, Mail, Info } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/50 backdrop-blur">
      <div className="mx-auto px-[15px] lg:px-8 max-w-6xl pt-12 pb-[35px]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
...
        </div>

        {/* Bottom Section */}
        <div className="mt-0 pt-[35px] pb-2 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
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
