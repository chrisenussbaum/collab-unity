import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageSquare, Send, CheckCircle, Star, Quote, User } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import PublicPageLayout from "@/components/PublicPageLayout";

const translations = {
  en: {
    title: "Testimonials",
    subtitle: "Hear what our community members have to say about their experience with Collab Unity",
    shareTitle: "Share Your Experience",
    shareSubtitle: "Tell us about your journey on Collab Unity",
    nameLabel: "Name",
    namePlaceholder: "Your name...",
    roleLabel: "Role / Title (Optional)",
    rolePlaceholder: "e.g., Designer, Developer...",
    ratingLabel: "Rating",
    testimonialLabel: "Your Testimonial",
    testimonialPlaceholder: "Share your experience with Collab Unity...",
    photoLabel: "Profile Photo (Optional)",
    uploading: "Uploading...",
    submitButton: "Submit Testimonial",
    submitting: "Submitting...",
    visibilityNote: "Your testimonial will be visible to everyone immediately",
    loading: "Loading testimonials...",
    noTestimonials: "No testimonials yet. Be the first to share your experience!",
    thankYouTitle: "Thank You!",
    thankYouMessage: "Your testimonial has been published! Thank you for sharing your experience with our community.",
    backToHome: "Back to Home",
    ago: "ago"
  },
  es: {
    title: "Testimonios",
    subtitle: "Escucha lo que los miembros de nuestra comunidad tienen que decir sobre su experiencia con Collab Unity",
    shareTitle: "Comparte Tu Experiencia",
    shareSubtitle: "Cuéntanos sobre tu viaje en Collab Unity",
    nameLabel: "Nombre",
    namePlaceholder: "Tu nombre...",
    roleLabel: "Rol / Título (Opcional)",
    rolePlaceholder: "ej., Diseñador, Desarrollador...",
    ratingLabel: "Calificación",
    testimonialLabel: "Tu Testimonio",
    testimonialPlaceholder: "Comparte tu experiencia con Collab Unity...",
    photoLabel: "Foto de Perfil (Opcional)",
    uploading: "Subiendo...",
    submitButton: "Enviar Testimonio",
    submitting: "Enviando...",
    visibilityNote: "Tu testimonio será visible para todos inmediatamente",
    loading: "Cargando testimonios...",
    noTestimonials: "Aún no hay testimonios. ¡Sé el primero en compartir tu experiencia!",
    thankYouTitle: "¡Gracias!",
    thankYouMessage: "¡Tu testimonio ha sido publicado! Gracias por compartir tu experiencia con nuestra comunidad.",
    backToHome: "Volver al Inicio",
    ago: "hace"
  },
  fr: {
    title: "Témoignages",
    subtitle: "Découvrez ce que les membres de notre communauté disent de leur expérience avec Collab Unity",
    shareTitle: "Partagez Votre Expérience",
    shareSubtitle: "Racontez-nous votre parcours sur Collab Unity",
    nameLabel: "Nom",
    namePlaceholder: "Votre nom...",
    roleLabel: "Rôle / Titre (Optionnel)",
    rolePlaceholder: "ex., Designer, Développeur...",
    ratingLabel: "Note",
    testimonialLabel: "Votre Témoignage",
    testimonialPlaceholder: "Partagez votre expérience avec Collab Unity...",
    photoLabel: "Photo de Profil (Optionnelle)",
    uploading: "Téléchargement...",
    submitButton: "Soumettre le Témoignage",
    submitting: "Envoi...",
    visibilityNote: "Votre témoignage sera visible par tous immédiatement",
    loading: "Chargement des témoignages...",
    noTestimonials: "Pas encore de témoignages. Soyez le premier à partager votre expérience!",
    thankYouTitle: "Merci!",
    thankYouMessage: "Votre témoignage a été publié! Merci de partager votre expérience avec notre communauté.",
    backToHome: "Retour à l'Accueil",
    ago: "il y a"
  }
};

export default function Testimonials() {
  const [language, setLanguage] = useState('en');
  const t = translations[language];
  
  const [formData, setFormData] = useState({
    name: "",
    role: "",
    rating: 5,
    testimonial: "",
    photo_url: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);
  const [testimonials, setTestimonials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    try {
      const data = await base44.entities.Testimonial.list("-created_date", 50);
      setTestimonials(data || []);
    } catch (error) {
      console.error("Error loading testimonials:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.testimonial.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await base44.entities.Testimonial.create({
        ...formData,
        is_approved: true
      });
      setIsSubmitted(true);
      toast.success("Testimonial submitted successfully!");
      loadTestimonials();
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      toast.error("Failed to submit testimonial");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.thankYouTitle}</h2>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">{t.title}</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <Card className="cu-card lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-xl">{t.shareTitle}</CardTitle>
                <p className="text-sm text-gray-600">
                  {t.shareSubtitle}
                </p>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.nameLabel} *</Label>
                    <Input
                      id="name"
                      placeholder={t.namePlaceholder}
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">{t.roleLabel}</Label>
                    <Input
                      id="role"
                      placeholder={t.rolePlaceholder}
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t.ratingLabel} *</Label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, rating }))}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            className={`w-8 h-8 ${rating <= formData.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testimonial">{t.testimonialLabel} *</Label>
                    <Textarea
                      id="testimonial"
                      placeholder={t.testimonialPlaceholder}
                      value={formData.testimonial}
                      onChange={(e) => setFormData(prev => ({ ...prev, testimonial: e.target.value }))}
                      rows={6}
                      required
                      className="resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">{t.photoLabel}</Label>
                    <div className="flex items-center gap-3">
                      {formData.photo_url && (
                        <img 
                          src={formData.photo_url} 
                          alt="Preview" 
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <Input
                          ref={photoInputRef}
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setIsUploadingPhoto(true);
                              try {
                                const { file_url } = await base44.integrations.Core.UploadFile({ file });
                                setFormData(prev => ({ ...prev, photo_url: file_url }));
                                toast.success("Photo uploaded!");
                              } catch (error) {
                                console.error("Error uploading photo:", error);
                                toast.error("Failed to upload photo");
                              } finally {
                                setIsUploadingPhoto(false);
                              }
                            }
                          }}
                          className="cursor-pointer"
                          disabled={isUploadingPhoto}
                        />
                        {isUploadingPhoto && (
                          <p className="text-xs text-gray-500 mt-1">{t.uploading}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="cu-button w-full"
                    disabled={isSubmitting || isUploadingPhoto}
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

                  <p className="text-xs text-gray-500 text-center">
                    {t.visibilityNote}
                  </p>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="cu-card animate-pulse">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full" />
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-32" />
                              <div className="h-3 bg-gray-200 rounded w-24" />
                            </div>
                          </div>
                          <div className="h-4 bg-gray-200 rounded w-24" />
                        </div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-full" />
                          <div className="h-4 bg-gray-200 rounded w-5/6" />
                          <div className="h-4 bg-gray-200 rounded w-4/6" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : testimonials.length === 0 ? (
                <Card className="cu-card">
                  <CardContent className="p-12 text-center">
                    <Quote className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">{t.noTestimonials}</p>
                  </CardContent>
                </Card>
              ) : (
                testimonials.map((testimonial) => (
                  <Card key={testimonial.id} className="cu-card">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            {testimonial.photo_url ? (
                              <img 
                                src={testimonial.photo_url} 
                                alt={testimonial.name}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-purple-600" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-bold text-gray-900">{testimonial.name}</h3>
                              {testimonial.role && (
                                <p className="text-sm text-gray-500">{testimonial.role}</p>
                              )}
                            </div>
                          </div>
                        </div>
                        {renderStars(testimonial.rating)}
                      </div>
                      
                      <div className="relative">
                        <Quote className="w-8 h-8 text-purple-200 absolute -top-2 -left-2" />
                        <p className="text-gray-700 leading-relaxed pl-6 italic">
                          "{testimonial.testimonial}"
                        </p>
                      </div>
                      
                      <div className="mt-4 text-xs text-gray-400">
                        {formatDistanceToNow(new Date(testimonial.created_date))} {t.ago}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
}