import { createClientFromRequest } from 'npm:@base44/sdk@0.7.1';

const INSTRUCTIONS_SCHEMA = {
  type: "object",
  properties: {
    overview: { 
      type: "string", 
      description: "A one-paragraph, high-level overview of what this project accomplishes and its main goal." 
    },
    setup_phase: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title for the setup phase, e.g., 'Project Setup & Initialization'." },
        description: { type: "string", description: "A brief description of what happens in this phase." },
        steps: { type: "array", items: { type: "string" }, description: "A list of 3-5 concrete, actionable steps for this phase." },
        deliverables: { type: "array", items: { type: "string" }, description: "A list of 1-3 tangible outcomes for this phase (e.g., 'Initialized Git repository')." }
      },
      required: ["title", "description", "steps", "deliverables"]
    },
    development_phase: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title for the development phase, e.g., 'Core Feature Development'." },
        description: { type: "string", description: "A brief description of what happens in this phase." },
        steps: { type: "array", items: { type: "string" }, description: "A list of 3-5 concrete, actionable steps for this phase." },
        deliverables: { type: "array", items: { type: "string" }, description: "A list of 1-3 tangible outcomes for this phase (e.g., 'Functional user authentication')." }
      },
      required: ["title", "description", "steps", "deliverables"]
    },
    launch_phase: {
      type: "object",
      properties: {
        title: { type: "string", description: "Title for the launch phase, e.g., 'Deployment & Finalization'." },
        description: { type: "string", description: "A brief description of what happens in this phase." },
        steps: { type: "array", items: { type: "string" }, description: "A list of 3-5 concrete, actionable steps for this phase." },
        deliverables: { type: "array", items: { type: "string" }, description: "A list of 1-3 tangible outcomes for this phase (e.g., 'Project deployed to a live URL')." }
      },
      required: ["title", "description", "steps", "deliverables"]
    },
    success_criteria: { 
      type: "array", 
      items: { type: "string" }, 
      description: "A list of 3-5 bullet points defining what a successfully completed project looks like." 
    },
    common_challenges: {
      type: "array",
      items: {
        type: "object",
        properties: {
          challenge: { type: "string", description: "A common problem or obstacle." },
          solution: { type: "string", description: "A practical solution or tip to overcome the challenge." }
        },
        required: ["challenge", "solution"]
      },
      description: "A list of 2-3 common challenges and their solutions."
    }
  },
  required: ["overview", "setup_phase", "development_phase", "launch_phase", "success_criteria", "common_challenges"]
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required.' }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const allTemplates = await base44.asServiceRole.entities.ProjectTemplate.list();
    
    const templatesToUpdate = allTemplates.filter(template => 
      !template.project_instructions || Object.keys(template.project_instructions).length === 0
    );

    if (templatesToUpdate.length === 0) {
      return new Response(JSON.stringify({ message: 'All templates already have instructions.', updated_count: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    let updatedCount = 0;

    for (const template of templatesToUpdate) {
      const prompt = `
        Generate a detailed set of project instructions for a project template with the following details:
        - Title: "${template.title}"
        - Description: "${template.description}"
        - Target Skills: ${template.target_skills?.join(', ') || 'Not specified'}
        - Suggested Tools: ${template.suggested_tools?.join(', ') || 'Not specified'}

        The instructions should be practical, clear, and broken down into three phases: Setup, Development, and Launch. 
        Also include an overview, success criteria, and common challenges.
        Please provide the output in a structured JSON format that strictly follows the provided schema.
      `;

      try {
        const { data: generatedInstructions } = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: prompt,
          response_json_schema: INSTRUCTIONS_SCHEMA,
        });

        if (generatedInstructions && Object.keys(generatedInstructions).length > 0) {
          await base44.asServiceRole.entities.ProjectTemplate.update(template.id, {
            project_instructions: generatedInstructions
          });
          updatedCount++;
        }
      } catch (llmError) {
        console.error(`Failed to generate instructions for template "${template.title}":`, llmError);
        // Continue to the next template even if one fails
      }
    }

    return new Response(JSON.stringify({ message: `Successfully generated instructions for ${updatedCount} templates.`, updated_count: updatedCount }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in migrateInstructions function:", error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});