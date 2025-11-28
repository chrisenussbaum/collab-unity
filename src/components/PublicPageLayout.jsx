import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function PublicPageLayout({ children, currentLanguage, onLanguageChange }) {
  const handleAuth = () => {
    window.location.href = "https://collabunity.io/login";
  };

  const navTranslations = {
    en: {
      about: "About",
      demos: "Demos",
      legal: "Legal",
      featureRequest: "Feature Request",
      testimonials: "Testimonials",
      login: "Log In",
      signup: "Sign Up",
      termsOfService: "Terms of Service",
      privacyPolicy: "Privacy Policy",
      contact: "Contact",
      copyright: "© 2025 Collab Unity. All rights reserved.",
      tagline: "Where Ideas Happen"
    },
    es: {
      about: "Acerca de",
      demos: "Demos",
      legal: "Legal",
      featureRequest: "Solicitud de Función",
      testimonials: "Testimonios",
      login: "Iniciar Sesión",
      signup: "Registrarse",
      termsOfService: "Términos de Servicio",
      privacyPolicy: "Política de Privacidad",
      contact: "Contacto",
      copyright: "© 2025 Collab Unity. Todos los derechos reservados.",
      tagline: "Donde Suceden las Ideas"
    },
    fr: {
      about: "À Propos",
      demos: "Démos",
      legal: "Juridique",
      featureRequest: "Demande de Fonctionnalité",
      testimonials: "Témoignages",
      login: "Connexion",
      signup: "S'inscrire",
      termsOfService: "Conditions d'Utilisation",
      privacyPolicy: "Politique de Confidentialité",
      contact: "Contact",
      copyright: "© 2025 Collab Unity. Tous droits réservés.",
      tagline: "Où les Idées Prennent Vie"
    }
  };

  const t = navTranslations[currentLanguage || 'en'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl("Welcome")} className="flex items-center">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                alt="Collab Unity"
                className="w-8 h-8 rounded-lg"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              <Link to={createPageUrl("AboutUs")}>
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  {t.about}
                </Button>
              </Link>
              <Link to={createPageUrl("Demos")}>
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  {t.demos}
                </Button>
              </Link>
              <Link to={createPageUrl("Testimonials")}>
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  {t.testimonials}
                </Button>
              </Link>
              <Link to={createPageUrl("FeatureRequest")}>
                <Button variant="ghost" className="text-gray-700 hover:text-purple-600">
                  {t.featureRequest}
                </Button>
              </Link>
            </nav>
            
            <div className="flex items-center space-x-3">
              {/* Language Switcher */}
              {onLanguageChange && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-700 hover:text-purple-600">
                      <Globe className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onLanguageChange('en')} className="cursor-pointer">
                      🇺🇸 English
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLanguageChange('es')} className="cursor-pointer">
                      🇪🇸 Español
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onLanguageChange('fr')} className="cursor-pointer">
                      🇫🇷 Français
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button
                variant="ghost"
                onClick={handleAuth}
                className="text-gray-700 hover:text-purple-600 hidden sm:inline-flex"
              >
                {t.login}
              </Button>
              <Button
                onClick={handleAuth}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {t.signup}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/689d7b3bdca9ca6bab2aeef8/6c745687e_collab-unity-logo.jpg"
                alt="Collab Unity"
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-xl font-bold text-white">Collab Unity</span>
            </div>
            <p className="text-gray-400 mb-6">
              {t.tagline}
            </p>
            <div className="flex items-center justify-center flex-wrap gap-6 text-sm">
              <Link to={createPageUrl("Contact")} className="hover:text-white transition-colors">
                {t.contact}
              </Link>
              <Link to={createPageUrl("TermsOfService")} className="hover:text-white transition-colors">
                {t.termsOfService}
              </Link>
              <Link to={createPageUrl("PrivacyPolicy")} className="hover:text-white transition-colors">
                {t.privacyPolicy}
              </Link>
            </div>
          </div>
          <p className="text-gray-500 text-sm text-center">
            {t.copyright}
          </p>
        </div>
      </footer>
    </div>
  );
}