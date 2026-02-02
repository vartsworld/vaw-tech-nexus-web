// Edge Function: Payment Reminder Scheduler
// Purpose: Automated daily job to send payment reminder notifications

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Get all pending payment reminders
        const { data: reminders, error: fetchError } = await supabaseAdmin
            .from('payment_reminders')
            .select(`
        *,
        client_profiles!inner(id, email, company_name, contact_person)
      `)
            .in('status', ['pending', 'partially_sent'])

        if (fetchError) {
            throw new Error(`Failed to fetch reminders: ${fetchError.message}`)
        }

        console.log(`Found ${reminders?.length || 0} active payment reminders`)

        const results = []

        for (const reminder of reminders || []) {
            try {
                const dueDate = new Date(reminder.due_date)
                const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

                const schedule = reminder.reminder_schedule || { dates: [], sent: [] }
                const datesToSend: number[] = []

                // Default reminder schedule: 7 days before, 3 days before, 1 day before, on due date, 1 day after
                const defaultSchedule = [7, 3, 1, 0, -1, -3, -7]

                // Check which reminders should be sent today
                for (const daysBefore of defaultSchedule) {
                    if (daysUntilDue === daysBefore && !schedule.sent.includes(daysBefore)) {
                        datesToSend.push(daysBefore)
                    }
                }

                if (datesToSend.length > 0) {
                    // Send reminder notification
                    const { error: notifError } = await supabaseAdmin
                        .from('client_notifications')
                        .insert({
                            client_id: reminder.client_id,
                            title: `Payment Reminder: ${reminder.title}`,
                            message: `Payment of ₹${reminder.amount} is ${daysUntilDue > 0 ? `due in ${daysUntilDue} days` :
                                    daysUntilDue === 0 ? 'due today' :
                                        `overdue by ${Math.abs(daysUntilDue)} days`
                                }. Due date: ${new Date(reminder.due_date).toLocaleDateString()}`,
                            type: 'payment_reminder',
                            category: 'payment',
                            priority: daysUntilDue <= 0 ? 'urgent' : daysUntilDue <= 3 ? 'high' : 'normal',
                            action_url: '/client/dashboard/financials',
                            read: false
                        })

                    if (notifError) {
                        console.error(`Failed to create notification for reminder ${reminder.id}:`, notifError)
                    }

                    // Update reminder schedule
                    const updatedSchedule = {
                        dates: schedule.dates,
                        sent: [...schedule.sent, ...datesToSend]
                    }

                    // Update reminder status
                    let newStatus = reminder.status
                    if (daysUntilDue < 0) {
                        newStatus = 'overdue'
                    } else if (datesToSend.length > 0) {
                        newStatus = 'sent'
                    }

                    const { error: updateError } = await supabaseAdmin
                        .from('payment_reminders')
                        .update({
                            reminder_schedule: updatedSchedule,
                            status: newStatus,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', reminder.id)

                    if (updateError) {
                        console.error(`Failed to update reminder ${reminder.id}:`, updateError)
                    } else {
                        results.push({
                            reminder_id: reminder.id,
                            client: reminder.client_profiles.company_name,
                            amount: reminder.amount,
                            days_until_due: daysUntilDue,
                            notifications_sent: datesToSend.length
                        })
                    }
                }

                // Check if payment is overdue
                if (daysUntilDue < 0 && reminder.status !== 'overdue' && reminder.status !== 'paid') {
                    await supabaseAdmin
                        .from('payment_reminders')
                        .update({ status: 'overdue' })
                        .eq('id', reminder.id)
                }

            } catch (error) {
                console.error(`Error processing reminder ${reminder.id}:`, error)
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Processed ${reminders?.length || 0} reminders`,
                notifications_sent: results.length,
                results: results
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        )

    } catch (error) {
        console.error('Error in payment-reminder-scheduler:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        )
    }
})
