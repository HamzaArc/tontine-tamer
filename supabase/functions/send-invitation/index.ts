
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.46.7";

// Constants for CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface InvitationRequest {
  invitationId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body
    const { invitationId }: InvitationRequest = await req.json();

    if (!invitationId) {
      throw new Error("Missing invitationId in request");
    }

    console.log(`Processing invitation: ${invitationId}`);

    // Get the invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from("invitations")
      .select(`
        *,
        tontines(name, created_by),
        members(name)
      `)
      .eq("id", invitationId)
      .single();

    if (invitationError) {
      throw new Error(`Error fetching invitation: ${invitationError.message}`);
    }

    if (!invitation) {
      throw new Error(`Invitation not found: ${invitationId}`);
    }

    console.log(`Found invitation for ${invitation.email} with status ${invitation.status}`);

    // Get the tontine creator's profile
    const { data: creatorProfile, error: creatorError } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", invitation.tontines.created_by)
      .single();

    if (creatorError) {
      console.warn(`Error fetching creator profile: ${creatorError.message}`);
    }

    const creatorName = creatorProfile?.full_name || "A user";
    const tontineName = invitation.tontines.name;
    const memberName = invitation.members.name;

    // Prepare message content based on invitation status
    let subject, message;
    const appUrl = Deno.env.get("APP_URL") || "https://your-tontine-app.com";
    const inviteUrl = `${appUrl}/invite/${invitation.token}`;

    if (invitation.status === 'invite') {
      // New user invitation
      subject = `You've been invited to join ${tontineName} on Tontine App`;
      message = `Hello ${memberName},

${creatorName} has invited you to join their tontine group "${tontineName}" on Tontine App.

Tontine App is a platform that helps you manage your savings groups easily and securely.

Click the link below to create your account and join the tontine:
${inviteUrl}

This invitation will expire in 7 days.

Best regards,
The Tontine App Team`;
    } else {
      // Notification for existing user
      subject = `You've been added to a new tontine: ${tontineName}`;
      message = `Hello ${memberName},

${creatorName} has added you to their tontine group "${tontineName}" on Tontine App.

Log in to your account to view the details:
${appUrl}/tontines

Best regards,
The Tontine App Team`;
    }

    // For demonstration, we'll log what would be sent
    // In a real implementation, you would integrate with an email/SMS service
    console.log(`Subject: ${subject}`);
    console.log(`Message: ${message}`);
    console.log(`Would send to email: ${invitation.email}`);
    if (invitation.phone) {
      console.log(`Would send to phone: ${invitation.phone}`);
    }

    // Update the invitation status to sent
    const { error: updateError } = await supabase
      .from("invitations")
      .update({ status: invitation.status === 'invite' ? 'invited' : 'notified' })
      .eq("id", invitationId);

    if (updateError) {
      throw new Error(`Error updating invitation status: ${updateError.message}`);
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully processed invitation for ${invitation.email}`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing invitation:", error.message);
    
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
