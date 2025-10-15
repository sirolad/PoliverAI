import { Feature } from "..";
import { useAuth } from "./useAuth";
import { FileCheck, Clock, Shield, Zap, BarChart } from '@poliverai/shared-ui';
import { t } from '../index';


export function useAvailableFeatures(hasCredits: boolean) {
  const { isPro } = useAuth();

  const freeFeatures: Feature[] = [
    {
      icon: FileCheck,
      title: t('dashboard.features.free.policy_verification.title'),
      description: t('dashboard.features.free.policy_verification.desc'),
      available: true,
    },
    {
      icon: Clock,
      title: t('dashboard.features.free.fast_analysis.title'),
      description: t('dashboard.features.free.fast_analysis.desc'),
      available: true,
    },
    {
      icon: Shield,
      title: t('dashboard.features.free.basic_recommendations.title'),
      description: t('dashboard.features.free.basic_recommendations.desc'),
      available: true,
    },
  ];

  const proFeatures: Feature[] = [
    {
      icon: Zap,
      title: t('dashboard.features.pro.ai_analysis.title'),
      description: t('dashboard.features.pro.ai_analysis.desc'),
      available: isPro || hasCredits,
      key: 'analysis',
    },
    {
      icon: BarChart,
      title: t('dashboard.features.pro.reports.title'),
      description: t('dashboard.features.pro.reports.desc'),
      available: isPro || hasCredits,
      key: 'report',
    },
    {
      icon: FileCheck,
      title: t('dashboard.features.pro.policy_generation.title'),
      description: t('dashboard.features.pro.policy_generation.desc'),
      available: isPro || hasCredits,
    },
  ];


  return { freeFeatures, proFeatures };
}

export default useAvailableFeatures;
