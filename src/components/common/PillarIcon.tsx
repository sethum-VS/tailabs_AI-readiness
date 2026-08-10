import { Wrench, Workflow, BarChart3, SearchCheck, Target, Pin, Code, type LucideIcon } from 'lucide-react'

export const PILLAR_LUCIDE_MAP: Record<string, LucideIcon> = {
  tool_usage: Wrench,
  workflow_automation: Workflow,
  data_literacy: BarChart3,
  output_evaluation: SearchCheck,
  leadership_buyin: Target,
  tech: Code,
}

interface PillarIconProps {
  pillar: string
  size?: number
  className?: string
  color?: string
}

export function PillarIcon({ pillar, size = 18, className, color }: PillarIconProps) {
  const Icon = PILLAR_LUCIDE_MAP[pillar] ?? Pin
  return <Icon size={size} className={className} color={color} />
}
