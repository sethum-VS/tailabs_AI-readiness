import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getDefaultTemplate, type AssessmentSchemaPayload } from '@/lib/defaultTemplates'
import { getAuthOrgId } from '@/lib/apiUtils'

export async function GET(request: NextRequest) {
  try {
    const auth = getAuthOrgId(request)
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }
    const { orgId } = auth

    const { searchParams } = new URL(request.url)
    const departmentType = searchParams.get('department_type') || 'Engineering'

    const supabase = createAdminClient()
    const { data: templateRow, error } = await supabase
      .from('assessment_templates')
      .select('id, schema_payload, updated_at')
      .eq('organization_id', orgId)
      .eq('department_type', departmentType)
      .maybeSingle() as unknown as {
        data: { id: string; schema_payload: AssessmentSchemaPayload; updated_at: string } | null
        error: unknown
      }

    if (error) {
      console.error('Fetch template error:', error)
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
    }

    if (templateRow && templateRow.schema_payload) {
      return NextResponse.json({
        template: templateRow.schema_payload,
        is_custom: true,
        updated_at: templateRow.updated_at,
      })
    }

    // Default template fallback
    return NextResponse.json({
      template: getDefaultTemplate(departmentType),
      is_custom: false,
      updated_at: null,
    })
  } catch (err) {
    console.error('Get admin templates error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = getAuthOrgId(request)
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }
    const { orgId } = auth

    const body = await request.json()
    const { department_type, schema_payload } = body as {
      department_type?: string
      schema_payload?: AssessmentSchemaPayload
    }

    const deptType = department_type || 'Engineering'

    if (!schema_payload || !Array.isArray(schema_payload.pillars)) {
      return NextResponse.json({ error: 'Invalid template schema payload' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: upserted, error } = await supabase
      .from('assessment_templates')
      .upsert(
        {
          organization_id: orgId,
          department_type: deptType,
          schema_payload: schema_payload as unknown,
          updated_at: new Date().toISOString(),
        } as never,
        { onConflict: 'organization_id,department_type' }
      )
      .select('id, schema_payload, updated_at')
      .single() as unknown as {
        data: { id: string; schema_payload: AssessmentSchemaPayload; updated_at: string } | null
        error: unknown
      }

    if (error || !upserted) {
      console.error('Save template error:', error)
      return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      template: upserted.schema_payload,
      is_custom: true,
      updated_at: upserted.updated_at,
    })
  } catch (err) {
    console.error('Put admin templates error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = getAuthOrgId(request)
    if ('errorResponse' in auth) {
      return auth.errorResponse
    }
    const { orgId } = auth

    const { searchParams } = new URL(request.url)
    const departmentType = searchParams.get('department_type') || 'Engineering'

    const supabase = createAdminClient()
    const { error } = await supabase
      .from('assessment_templates')
      .delete()
      .eq('organization_id', orgId)
      .eq('department_type', departmentType)

    if (error) {
      console.error('Delete template error:', error)
      return NextResponse.json({ error: 'Failed to reset template' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      template: getDefaultTemplate(departmentType),
      is_custom: false,
      updated_at: null,
    })
  } catch (err) {
    console.error('Delete admin templates error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
