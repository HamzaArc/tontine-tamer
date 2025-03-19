
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

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get all pending invitations
    const { data: pendingInvitations, error: fetchError } = await supabase
      .from("invitations")
      .select("id")
      .in("status", ["pending"]);

    if (fetchError) {
      throw new Error(`Error fetching pending invitations: ${fetchError.message}`);
    }

    console.log(`Found ${pendingInvitations?.length || 0} pending invitations`);

    // Process each pending invitation
    const results = [];
    for (const invitation of pendingInvitations || []) {
      try {
        // Call the send-invitation function for each invitation
        const response = await fetch(
          `${supabaseUrl}/functions/v1/send-invitation`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ invitationId: invitation.id }),
          }
        );

        const result = await response.json();
        results.push({ id: invitation.id, result });
      } catch (inviteError) {
        console.error(`Error processing invitation ${invitation.id}:`, inviteError);
        results.push({ id: invitation.id, error: inviteError.message });
      }
    }

    // Return results
    return new Response(
      JSON.stringify({
        processed: pendingInvitations?.length || 0,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing pending invitations:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
