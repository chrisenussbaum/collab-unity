import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Send, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import PublicPageLayout from "@/components/PublicPageLayout";

const translations = {
  en: {
    title: "Contact Us",
    subtitle: "We'd love to hear from you",
    sendMessage: "Send us a message",
    nameLabel: "Name",
    namePlaceholder: "Your name",
    emailLabel: "Email",
    emailPlaceholder: "your.email@example.com",
    subjectLabel: "Subject",
    subjectPlaceholder: "What's this about?",
    messageLabel: "Message",
    messagePlaceholder: "Tell us more about your inquiry...",
    sendButton: "Send Message",
    sending: "Sending...",
    thankYou: "Message Sent!",
    thankYouMessage: "Thank you for reaching out. We'll get back to you as soon as possible."
  },
  es: {
    title: "Contáctanos",
    subtitle: "Nos encantaría saber de ti",
    sendMessage: "Envíanos un mensaje",
    nameLabel: "Nombre",
    namePlaceholder: "Tu nombre",
    emailLabel: "Correo Electrónico",
    emailPlaceholder: "tu.correo@ejemplo.com",
    subjectLabel: "Asunto",
    subjectPlaceholder: "¿De qué se trata?",
    messageLabel: "Mensaje",
    messagePlaceholder: "Cuéntanos más sobre tu consulta...",
    sendButton: "Enviar Mensaje",
    sending: "Enviando...",
    thankYou: "¡Mensaje Enviado!",
    thankYouMessage: "Gracias por contactarnos. Te responderemos lo antes posible."
  },
  fr: {
    title: "Nous Contacter",
    subtitle: "Nous aimerions avoir de vos nouvelles",
    sendMessage: "Envoyez-nous un message",
    nameLabel: "Nom",
    namePlaceholder: "Votre nom",
    emailLabel: "E-mail",
    emailPlaceholder: "votre.email@exemple.com",
    subjectLabel: "Sujet",
    subjectPlaceholder: "De quoi s'agit-il?",
    messageLabel: "Message",
    messagePlaceholder: "Parlez-nous de votre demande...",
    sendButton: "Envoyer le Message",
    sending: "Envoi...",
    thankYou: "Message Envoyé!",
    thankYouMessage: "Merci de nous avoir contactés. Nous vous répondrons dans les plus brefs délais."
  }
};

export default function Contact() {
  const [language, setLanguage] = useState('en');
  const t = translations[language];
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAuth = () => {
    window.location.href = "https://collabunity.io/login";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Send email using Base44 integration
      await base44.integrations.Core.SendEmail({
        to: "collabunity@collabunity.io",
        subject: `[Contact Form] ${formData.subject}`,
        body: `
New contact form submission from Collab Unity:

Name: ${formData.name}
Email: ${formData.email}
Subject: ${formData.subject}

Message:
${formData.message}

---
Sent from Collab Unity Contact Form
        `.trim()
      });

      setIsSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", message: "" });
        setIsSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again or email us directly at collabunity@collabunity.io");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <PublicPageLayout currentLanguage={language} onLanguageChange={setLanguage}>
      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{t.title}</h1>
                <p className="text-gray-600">{t.subtitle}</p>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="md:col-span-3"
            >
              <Card className="cu-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Mail className="w-5 h-5 mr-2 text-purple-600" />
                    {t.sendMessage}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {t.thankYou}
                      </h3>
                      <p className="text-gray-600">
                        {t.thankYouMessage}
                      </p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="name">{t.nameLabel} *</Label>
                          <Input
                            id="name"
                            placeholder={t.namePlaceholder}
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t.emailLabel} *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder={t.emailPlaceholder}
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">{t.subjectLabel} *</Label>
                        <Input
                          id="subject"
                          placeholder={t.subjectPlaceholder}
                          value={formData.subject}
                          onChange={(e) => handleChange("subject", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">{t.messageLabel} *</Label>
                        <Textarea
                          id="message"
                          placeholder={t.messagePlaceholder}
                          rows={6}
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          required
                          className="resize-none"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            {t.sending}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {t.sendButton}
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >            
          </motion.div>
        </div>
      </div>
    </PublicPageLayout>
  );
}