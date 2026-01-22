import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Send, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import PublicPageLayout from "@/components/PublicPageLayout";

const translations = {
  en: {
    title: "Feature Request",
    subtitle: "Have an idea to improve Collab Unity? We'd love to hear it! Share your suggestions and help us build a better platform.",
    featureTitle: "Feature Title",
    featurePlaceholder: "A brief title for your feature request...",
    category: "Category",
    selectCategory: "Select a category",
    categories: {
      ui_ux: "UI/UX Improvement",
      new_feature: "New Feature",
      collaboration: "Collaboration Tools",
      performance: "Performance",
      mobile: "Mobile Experience",
      other: "Other"
    },
    description: "Description",
    descriptionPlaceholder: "Describe your feature request in detail. What problem does it solve? How would it work?",
    emailLabel: "Email (Optional)",
    emailPlaceholder: "your.email@example.com (we'll keep you updated)",
    emailNote: "We'll only use your email to update you about this feature request",
    submitButton: "Submit Feature Request",
    submitting: "Submitting...",
    thankYou: "Thank You!",
    thankYouMessage: "Your feature request has been submitted successfully. We'll review it and consider it for future updates.",
    backToHome: "Back to Home"
  },
  es: {
    title: "Solicitud de Función",
    subtitle: "¿Tienes una idea para mejorar Collab Unity? ¡Nos encantaría escucharla! Comparte tus sugerencias y ayúdanos a construir una mejor plataforma.",
    featureTitle: "Título de la Función",
    featurePlaceholder: "Un título breve para tu solicitud de función...",
    category: "Categoría",
    selectCategory: "Selecciona una categoría",
    categories: {
      ui_ux: "Mejora de UI/UX",
      new_feature: "Nueva Función",
      collaboration: "Herramientas de Colaboración",
      performance: "Rendimiento",
      mobile: "Experiencia Móvil",
      other: "Otro"
    },
    description: "Descripción",
    descriptionPlaceholder: "Describe tu solicitud de función en detalle. ¿Qué problema resuelve? ¿Cómo funcionaría?",
    emailLabel: "Correo Electrónico (Opcional)",
    emailPlaceholder: "tu.correo@ejemplo.com (te mantendremos informado)",
    emailNote: "Solo usaremos tu correo para actualizarte sobre esta solicitud de función",
    submitButton: "Enviar Solicitud de Función",
    submitting: "Enviando...",
    thankYou: "¡Gracias!",
    thankYouMessage: "Tu solicitud de función ha sido enviada con éxito. La revisaremos y la consideraremos para futuras actualizaciones.",
    backToHome: "Volver al Inicio"
  },
  fr: {
    title: "Demande de Fonctionnalité",
    subtitle: "Vous avez une idée pour améliorer Collab Unity? Nous aimerions l'entendre! Partagez vos suggestions et aidez-nous à construire une meilleure plateforme.",
    featureTitle: "Titre de la Fonctionnalité",
    featurePlaceholder: "Un titre bref pour votre demande de fonctionnalité...",
    category: "Catégorie",
    selectCategory: "Sélectionnez une catégorie",
    categories: {
      ui_ux: "Amélioration UI/UX",
      new_feature: "Nouvelle Fonctionnalité",
      collaboration: "Outils de Collaboration",
      performance: "Performance",
      mobile: "Expérience Mobile",
      other: "Autre"
    },
    description: "Description",
    descriptionPlaceholder: "Décrivez votre demande de fonctionnalité en détail. Quel problème résout-elle? Comment fonctionnerait-elle?",
    emailLabel: "E-mail (Optionnel)",
    emailPlaceholder: "votre.email@exemple.com (nous vous tiendrons informé)",
    emailNote: "Nous utiliserons uniquement votre e-mail pour vous informer de cette demande de fonctionnalité",
    submitButton: "Soumettre la Demande de Fonctionnalité",
    submitting: "Envoi...",
    thankYou: "Merci!",
    thankYouMessage: "Votre demande de fonctionnalité a été soumise avec succès. Nous l'examinerons et l'envisagerons pour les mises à jour futures.",
    backToHome: "Retour à l'Accueil"
  }
};

export default function FeatureRequest() {
  const [language, setLanguage] = useState('en');
  const t = translations[language];
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.FeatureRequest.create(formData);
      
      // Send email notification
      await base44.integrations.Core.SendEmail({
        to: "collabunity@collabunity.io",
        subject: `New Feature Request: ${formData.title}`,
        body: `
Feature Request Details:

Title: ${formData.title}
Category: ${formData.category}

Description:
${formData.description}

${formData.email ? `Contact Email: ${formData.email}` : 'No contact email provided'}
        `
      });
      
      setIsSubmitted(true);
      toast.success("Feature request submitted successfully!");
    } catch (error) {
      console.error("Error submitting feature request:", error);
      toast.error("Failed to submit feature request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <PublicPageLayout currentLanguage={language} onLanguageChange={setLanguage}>
        <div className="flex items-center justify-center p-4 py-20">
          <Card className="max-w-md w-full">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.thankYou}</h2>
              <p className="text-gray-600 mb-6">
                {t.thankYouMessage}
              </p>
              <Link to={createPageUrl("Welcome")}>
                <Button className="cu-button w-full">
                  {t.backToHome}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </PublicPageLayout>
    );
  }

  return (
    <PublicPageLayout currentLanguage={language} onLanguageChange={setLanguage}>
      <div className="py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="cu-card">
          <CardHeader>
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Lightbulb className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t.title}</CardTitle>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                {t.subtitle}
              </p>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">{t.featureTitle} *</Label>
                <Input
                  id="title"
                  placeholder={t.featurePlaceholder}
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">{t.category} *</Label>
                <Select 
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t.selectCategory} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ui_ux">{t.categories.ui_ux}</SelectItem>
                    <SelectItem value="new_feature">{t.categories.new_feature}</SelectItem>
                    <SelectItem value="collaboration">{t.categories.collaboration}</SelectItem>
                    <SelectItem value="performance">{t.categories.performance}</SelectItem>
                    <SelectItem value="mobile">{t.categories.mobile}</SelectItem>
                    <SelectItem value="other">{t.categories.other}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t.description} *</Label>
                <Textarea
                  id="description"
                  placeholder={t.descriptionPlaceholder}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={8}
                  required
                  className="resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t.emailLabel}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t.emailPlaceholder}
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
                <p className="text-xs text-gray-500">
                  {t.emailNote}
                </p>
              </div>

              <Button 
                type="submit" 
                className="cu-button w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  t.submitting
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    {t.submitButton}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </PublicPageLayout>
  );
}