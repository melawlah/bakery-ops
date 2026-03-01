import { NextRequest, NextResponse } from 'next/server'
import { interpretOrderMessage } from '@/lib/ai/interpret-order'
import { supabaseAdmin } from '@/lib/db/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { rawMessage, clientId, businessId } = body

    // Fetch client details
    const { data: client } = await supabaseAdmin
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single()

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    // Fetch available products for this business
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, unit_price')
      .eq('business_id', businessId)
      .eq('active', true)

    // Fetch last week's order for context
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)

    const { data: lastOrder } = await supabaseAdmin
      .from('orders')
      .select(`
        order_items (
          quantity,
          products ( name )
        )
      `)
      .eq('client_id', clientId)
      .gte('week_start', lastWeek.toISOString())
      .single()

    // Format last week's order for the AI context
    const lastWeekFormatted = lastOrder?.order_items?.map((item: any) => ({
      product: item.products?.name,
      quantity: item.quantity
    })) || []

    const productNames = products?.map((p: any) => p.name) || []

    // Call the AI interpretation layer
    const interpretation = await interpretOrderMessage(
      rawMessage,
      client.name,
      lastWeekFormatted,
      productNames
    )

    // Save the order with both raw message and AI interpretation
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        business_id: businessId,
        client_id: clientId,
        week_start: weekStart.toISOString().split('T')[0],
        raw_message: rawMessage,
        ai_interpretation: interpretation,
        status: interpretation.flags.needs_human_review ? 'pending' : 'confirmed',
        admin_approved: !interpretation.flags.needs_human_review
      })
      .select()
      .single()

    if (error) throw error

    // If AI is confident, also save the order items immediately
    if (!interpretation.flags.needs_human_review) {
      for (const item of interpretation.products) {
        const product = products?.find((p: any) => p.name === item.name)
        if (product) {
          await supabaseAdmin.from('order_items').insert({
            order_id: order.id,
            product_id: product.id,
            quantity: item.quantity,
            unit_price: product.unit_price
          })
        }
      }
    }

    return NextResponse.json({
      order,
      interpretation,
      message: interpretation.flags.needs_human_review
        ? 'Order saved but requires human review'
        : 'Order confirmed automatically'
    })

  } catch (error) {
    console.error('Order interpretation error:', error)
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    )
  }
}