// eslint-disable-next-line react/no-unescaped-entities
// eslint-disable-next-line @typescript-eslint/no-unused-vars
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  GraduationCap,
  Headphones,
  Lightbulb,
  MessageCircle,
  Play,
  Puzzle,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { Button } from "@english-app/ui";
import { Input } from "@english-app/ui";
import { Card, CardContent } from "@english-app/ui";
import { Badge } from "@english-app/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@english-app/ui";

import { LandingHeader } from "@/components/LandingHeader";

const testimonials = [
  {
    name: "Marina S.",
    role: "Desenvolvedora Front-End",
    avatar: "M",
    quote:
      "Passei na minha entrevista para uma vaga remota em Londres depois de 3 semanas usando o app.",
    rating: 5,
  },
  {
    name: "Carlos R.",
    role: "Backend Developer",
    avatar: "C",
    quote:
      "O Teacher AI me ajudou a praticar respostas técnicas em inglês. Método realmente eficaz!",
    rating: 5,
  },
  {
    name: "Beatriz L.",
    role: "Data Engineer",
    avatar: "B",
    quote: "Em 2 semanas já sentia muito mais confiança para falar sobre meus projetos em inglês.",
    rating: 5,
  },
];

const benefits = [
  { icon: Brain, title: "Aprendizado guiado por IA", description: "Personalizado para você" },
  {
    icon: Target,
    title: "Conteúdo adaptado à sua área",
    description: "Frontend, Backend, Data, DevOps",
  },
  { icon: Zap, title: "Feedback imediato", description: "Corrija erros em tempo real" },
  { icon: Clock, title: "Blocos curtos de 10-20 min", description: "Encaixa na sua rotina" },
  { icon: TrendingUp, title: "Evolução visual", description: "Acompanhe seu progresso" },
  {
    icon: MessageCircle,
    title: "Simulador de entrevistas",
    description: "Pratique cenários reais",
  },
];

const apaPhases = [
  {
    icon: Headphones,
    phase: "Presentation",
    title: "Apresentação",
    description: "Veja e ouça o inglês em uso real",
  },
  {
    icon: Puzzle,
    phase: "Assimilation",
    title: "Assimilação",
    description: "Reforce vocabulário e estrutura",
  },
  {
    icon: Lightbulb,
    phase: "Active Recall",
    title: "Recordação Ativa",
    description: "Teste o que aprendeu sem dicas",
  },
  {
    icon: Sparkles,
    phase: "Feedback",
    title: "Feedback & Próximo",
    description: "Corrija seus erros e siga evoluindo",
  },
];

const faqs = [
  {
    question: "O app é totalmente gratuito?",
    answer:
      "O teste de nivelamento e a primeira semana são gratuitos. Você pode experimentar todas as funcionalidades sem compromisso.",
  },
  {
    question: "Preciso falar inglês avançado para começar?",
    answer:
      "Não! A IA adapta tudo ao seu nível atual. Desde iniciantes até avançados podem se beneficiar do método APA.",
  },
  {
    question: "Funciona no celular?",
    answer: "Sim, é 100% responsivo. Você pode estudar no celular, tablet ou computador.",
  },
  {
    question: "O chat é com professor real?",
    answer:
      "É com o Teacher AI, treinado com base em professores certificados e feedback real de alunos. Ele está disponível 24/7!",
  },
  {
    question: "Quanto tempo leva para ver resultados?",
    answer:
      "A maioria dos alunos relata maior confiança já na primeira semana. Resultados significativos aparecem após 3-4 semanas de prática consistente.",
  },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const handleGetStarted = () => {
    if (email) {
      // onUpdateProfile({ name: email.split('@')[0] }); // This function is not available in the current context
    }
    // onGetStarted(); // This function is not available in the current context
  };

  const handleLogin = () => {
    // onLogin(); // This function is not available in the current context
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-blue-50 dark:from-neutral-950 dark:via-purple-950/20 dark:to-neutral-950">
      {/* Landing Header */}
      <LandingHeader
        onLogin={handleLogin}
        onGetStarted={handleGetStarted}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden pt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-purple-500/5 dark:to-pink-500/5" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center max-w-4xl mx-auto space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 px-4 py-2">
                <Sparkles className="w-4 h-4 mr-2" />
                Novo: Simulador de Entrevistas Técnicas
              </Badge>
            </motion.div>

            {/* Headline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-4"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl text-neutral-900 dark:text-white">
                Domine o inglês para{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  entrevistas de TI
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
                Treine com IA, melhore sua fluência e conquiste o emprego dos seus sonhos —
                estudando apenas <strong>20 minutos por dia</strong>.
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto"
            >
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleGetStarted()}
              />
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 px-8"
              >
                Começar teste gratuito
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-sm text-neutral-500 dark:text-neutral-400"
            >
              Leva menos de 5 minutos • Sem cartão de crédito
            </motion.p>

            {/* Tech Logos */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-center justify-center gap-6 pt-8 flex-wrap opacity-40"
            >
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                Preparado para:
              </span>
              {["React", "Node.js", "Python", "AWS", "Docker"].map((tech) => (
                <Badge
                  key={tech}
                  variant="outline"
                  className="text-neutral-600 dark:text-neutral-400"
                >
                  {tech}
                </Badge>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="py-16 sm:py-24 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4 dark:text-white">
              Treine inglês como um desenvolvedor aprende código
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300">
              Metodologia comprovada em 3 passos simples
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                step: "1",
                title: "Teste de Nivelamento Inteligente",
                description: "Avalia seu vocabulário, compreensão e fala em minutos.",
              },
              {
                icon: Calendar,
                step: "2",
                title: "Plano de Estudo Personalizado",
                description:
                  "Gerado por IA conforme seu nível e objetivo (entrevista, fluência, viagem).",
              },
              {
                icon: MessageCircle,
                step: "3",
                title: "Teacher AI Chat",
                description: "Converse, receba correções e simule entrevistas reais com feedback.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 px-4 sm:px-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className="w-6 h-6 rounded-full flex items-center justify-center p-0"
                          >
                            {item.step}
                          </Badge>
                          <h3 className="dark:text-white">{item.title}</h3>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-300 text-sm">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* APA Method */}
      <section
        id="metodo"
        className="py-16 sm:py-24 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-neutral-950 dark:to-purple-950/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              Metodologia Exclusiva
            </Badge>
            <h2 className="text-3xl sm:text-4xl mb-4 dark:text-white">
              Método APA — Automatic Presentation & Assimilation™
            </h2>
            <p className="text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto">
              Cada lição é projetada para <strong>apresentar, assimilar e ativar</strong> o conteúdo
              de forma natural.
              <br />
              Sem traduções. Sem decoreba. Apenas prática real.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {apaPhases.map((phase, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="text-center h-full hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="pt-6 px-4 sm:px-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <phase.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="mb-2 dark:text-white">{phase.title}</h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-300">
                      {phase.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-16 sm:py-24 bg-white dark:bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                <Play className="w-4 h-4 mr-2" />
                Experimente agora
              </Badge>
              <h2 className="text-3xl sm:text-4xl mb-4 dark:text-white">
                Experimente uma aula real
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-300 mb-6">
                Você vai se surpreender com o quanto entende em minutos. Veja como funciona o
                Teacher AI e o feedback instantâneo.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Chat interativo com correção em tempo real",
                  "Quiz de vocabulário técnico",
                  "Gráfico de progresso personalizado",
                ].map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-3 text-neutral-700 dark:text-neutral-300"
                  >
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Fazer meu teste grátis
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-blue-500 to-purple-600 text-white border-0 shadow-2xl">
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm text-white/80">Teacher AI</p>
                        <p className="text-white">Online agora</p>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur rounded-lg p-4 space-y-3"></div>
                    <div className="grid grid-cols-3 gap-2 pt-4">
                      {[
                        { label: "Fluência", value: "85%" },
                        { label: "Vocabulário", value: "92%" },
                        { label: "Gramática", value: "78%" },
                      ].map((stat, idx) => (
                        <div
                          key={idx}
                          className="bg-white/10 backdrop-blur rounded-lg p-3 text-center"
                        >
                          <p className="text-2xl mb-1">{stat.value}</p>
                          <p className="text-xs text-white/80">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section
        id="depoimentos"
        className="py-16 sm:py-24 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/10 dark:to-neutral-950"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Star className="w-4 h-4 mr-2 fill-yellow-400 text-yellow-400" />
              Avaliação média 4,8/5
            </Badge>
            <h2 className="text-3xl sm:text-4xl mb-4 dark:text-white">
              Mais de 5.000 profissionais de TI já estão treinando com IA
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6 px-4 sm:px-6">
                    <div className="flex mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300 mb-4 italic">
                      &quot;{testimonial.quote}&quot;
                    </p>{" "}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <p className="text-sm dark:text-white">{testimonial.name}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section id="beneficios" className="py-16 sm:py-24 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4 dark:text-white">
              Por que escolher o English AI Tutor?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
              >
                <Card className="h-full hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="pt-6 px-4 sm:px-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <benefit.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="mb-1 dark:text-white">{benefit.title}</h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl mb-4 text-white">
              Pronto para dar o próximo passo na sua carreira internacional?
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Comece hoje mesmo seu plano gratuito de 7 dias e descubra seu verdadeiro nível de
              inglês.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              onKeyDown={(e) => e.key === "Enter" && handleGetStarted()}
            />
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="bg-white text-blue-600 hover:bg-white/90 px-8"
            >
              Começar agora — grátis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <p className="text-sm text-white/80">Sem cartão • Cancelamento automático após o teste</p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-16 sm:py-24 bg-white dark:bg-neutral-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl mb-4 dark:text-white">Perguntas Frequentes</h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, idx) => (
              <AccordionItem
                key={idx}
                value={`item-${idx}`}
                className="border rounded-lg px-6 dark:border-neutral-700"
              >
                <AccordionTrigger className="text-left hover:no-underline dark:text-white">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-neutral-600 dark:text-neutral-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 dark:bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg">English AI Tutor</span>
              </div>
              <p className="text-sm text-neutral-400">
                Aprenda inglês com IA para conquistar sua carreira internacional.
              </p>
            </div>

            <div>
              <h4 className="mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Como funciona
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Método APA
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Preços
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Central de Ajuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contato
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Política de Privacidade
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Termos de Uso
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-neutral-400">
              © 2024 English AI Tutor. Desenvolvido no Brasil 🇧🇷 com tecnologia global.
            </p>
            <div className="flex gap-4">
              {["LinkedIn", "Instagram", "YouTube"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-neutral-400 hover:text-white transition-colors text-sm"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
