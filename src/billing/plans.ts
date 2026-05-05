import type { WaveLimitCheck, WavePlan } from "./types";

export const DEFAULT_PLANS: WavePlan[] = [
  {
    name: "Gratuito",
    description: "Plano gratuito para começar",
    price: 0,
    billingCycle: "monthly",
    maxUsers: 1,
    maxStudents: 10,
    maxClasses: 3,
    features: [
      "Até 10 alunos",
      "Até 3 turmas",
      "1 usuário",
      "Agendamento básico",
      "Suporte por email",
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 1,
  },
  {
    name: "Iniciante",
    description: "Perfeito para pequenas academias",
    price: 7990,
    billingCycle: "monthly",
    maxUsers: 2,
    maxStudents: 50,
    maxClasses: 10,
    features: [
      "Até 50 alunos",
      "Até 10 turmas",
      "2 usuários",
      "Agendamento avançado",
      "Relatórios básicos",
      "Assistente IA básico",
      "Suporte prioritário",
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 2,
  },
  {
    name: "Profissional",
    description: "Para academias em crescimento",
    price: 14990,
    billingCycle: "monthly",
    maxUsers: 5,
    maxStudents: 200,
    maxClasses: 25,
    features: [
      "Até 200 alunos",
      "Até 25 turmas",
      "5 usuários",
      "Agendamento completo",
      "Relatórios detalhados",
      "Assistente IA avançado",
      "Integração WhatsApp",
      "Geração automática de relatórios",
      "Suporte prioritário",
    ],
    isActive: true,
    isPopular: true,
    sortOrder: 3,
  },
  {
    name: "Empresarial",
    description: "Para grandes academias e franquias",
    price: 29990,
    billingCycle: "monthly",
    maxUsers: 10,
    maxStudents: 1000,
    maxClasses: 100,
    features: [
      "Até 1000 alunos",
      "Até 100 turmas",
      "10 usuários",
      "Todas as funcionalidades",
      "Assistente IA ilimitado",
      "Relatórios personalizados com IA",
      "Análises preditivas",
      "API de integração",
      "Suporte 24/7",
      "Gerente de conta dedicado",
    ],
    isActive: true,
    isPopular: false,
    sortOrder: 4,
  },
];

export function checkPlanLimit({
  current,
  limit,
  planName,
}: {
  current: number;
  limit?: number | null;
  planName?: string | null;
}): WaveLimitCheck {
  const resolvedLimit = limit ?? 0;

  return {
    canAdd: current < resolvedLimit,
    current,
    limit: resolvedLimit,
    planName: planName || "Nenhum plano",
  };
}

export function getCurrentMonthlyBillingPeriod(now = new Date()) {
  const periodStart = new Date(now);
  periodStart.setDate(1);
  periodStart.setHours(0, 0, 0, 0);

  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  return { periodStart, periodEnd };
}

export function getTrialEndsAt(days = 30, now = new Date()) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}
