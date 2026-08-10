import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getDefaultTemplate, type AssessmentSchemaPayload, type ScenarioConfig } from '@/lib/defaultTemplates'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const rawDept = searchParams.get('department') || 'Engineering'

    if (!token) {
      // If no token provided, return default template based on department
      const deptType = (rawDept === 'Engineering' || rawDept === 'Data') ? 'Engineering' : 'General'
      return NextResponse.json({
        template: getDefaultTemplate(deptType),
        department_type: deptType,
      })
    }

    const supabase = createAdminClient()

    // 1. Resolve organization_id and selected_scenario_id from token
    let { data: inviteData, error: inviteErr } = await supabase
      .from('assessment_invites')
      .select(`
        id,
        team_id,
        selected_scenario_id,
        teams (
          id,
          organization_id
        )
      `)
      .eq('token', token)
      .maybeSingle() as unknown as {
        data: {
          id: string
          team_id: string
          selected_scenario_id?: string | null
          teams: {
            id: string
            organization_id: string
          } | null
        } | null
        error: unknown
      }

    if (inviteErr || !inviteData) {
      const fallbackResult = await supabase
        .from('assessment_invites')
        .select(`
          id,
          team_id,
          teams (
            id,
            organization_id
          )
        `)
        .eq('token', token)
        .maybeSingle() as unknown as {
          data: {
            id: string
            team_id: string
            teams: {
              id: string
              organization_id: string
            } | null
          } | null
        }
      if (fallbackResult.data) {
        inviteData = fallbackResult.data
      }
    }

    const orgId = inviteData?.teams?.organization_id
    const deptType = (rawDept === 'Engineering' || rawDept === 'Data') ? 'Engineering' : 'General'

    const scenarioParam = searchParams.get('scenario')
    const effectiveScenarioId = scenarioParam || inviteData?.selected_scenario_id || 'all'

    if (!orgId) {
      return NextResponse.json({
        template: getDefaultTemplate(deptType),
        department_type: deptType,
      })
    }

    // Query custom template for org and deptType
    const { data: templateRow } = await supabase
      .from('assessment_templates')
      .select('schema_payload')
      .eq('organization_id', orgId)
      .eq('department_type', deptType)
      .maybeSingle() as unknown as {
        data: { schema_payload: AssessmentSchemaPayload } | null
      }

    const rawPayload = templateRow?.schema_payload || getDefaultTemplate(deptType)

    let finalPayload = rawPayload
    if (effectiveScenarioId && effectiveScenarioId !== 'all') {
      const scenariosList = finalPayload.scenarios && finalPayload.scenarios.length > 0
        ? finalPayload.scenarios
        : (finalPayload.scenario ? [finalPayload.scenario] : [])

      const targetIds = effectiveScenarioId.split(',').map((s) => s.trim()).filter(Boolean)
      const matchedScenarios: ScenarioConfig[] = []

      for (const targetId of targetIds) {
        let matched: ScenarioConfig | undefined

        // 1. Exact scenario_id match
        matched = scenariosList.find(
          (sc) => sc.scenario_id === targetId || sc.scenario_id === `scenario_${targetId}`
        )

        // 2. Index match (scenario_0, scenario_1, 0, 1)
        if (!matched) {
          const idxMatch = targetId.match(/^(?:scenario_)?(\d+)$/i)
          if (idxMatch) {
            const idx = parseInt(idxMatch[1], 10)
            if (scenariosList[idx]) {
              matched = scenariosList[idx]
            } else if (idx > 0 && scenariosList[idx - 1]) {
              matched = scenariosList[idx - 1]
            }
          }
        }

        // 3. Title substring match
        if (!matched) {
          matched = scenariosList.find(
            (sc) => sc.title && (targetId.toLowerCase().includes(sc.title.toLowerCase()) || sc.title.toLowerCase().includes(targetId.toLowerCase()))
          )
        }

        if (matched && !matchedScenarios.some((s) => (s.scenario_id || s.title) === (matched!.scenario_id || matched!.title))) {
          matchedScenarios.push(matched)
        }
      }

      if (matchedScenarios.length > 0) {
        finalPayload = {
          ...finalPayload,
          scenario: matchedScenarios[0],
          scenarios: matchedScenarios,
        }
      }
    }

    return NextResponse.json({
      template: finalPayload,
      department_type: deptType,
    })
  } catch (err) {
    console.error('Fetch respondent assessment template error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
