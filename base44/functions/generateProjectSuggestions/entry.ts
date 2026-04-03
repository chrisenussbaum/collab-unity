import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectIdea } = await req.json();

    if (!projectIdea || !projectIdea.trim()) {
      return Response.json({ error: 'Project idea is required' }, { status: 400 });
    }

    const prompt = `You are a project planning assistant. Based on the user's project idea, generate structured project details.

User's Project Idea: "${projectIdea}"

Analyze this idea and generate appropriate project details. Be creative but realistic. Generate a compelling title and description. Select the most appropriate classification, industry, and project type. Suggest relevant skills and tools needed for success.

Important guidelines:
- Title should be concise (3-6 words) and engaging
- Description should be 2-3 sentences explaining the project vision
- Area of interest should be very short (max 20 characters), like "Web Dev", "Marketing", "Design"
- Skills and tools should be specific and relevant (3-6 items each)
- Choose values that exactly match the allowed options for project_type, classification, and industry`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A concise, engaging project title (3-6 words)"
          },
          description: {
            type: "string",
            description: "A 2-3 sentence description of the project vision and goals"
          },
          project_type: {
            type: "string",
            enum: ["Personal", "Collaborative"],
            description: "Whether this is a personal or collaborative project"
          },
          classification: {
            type: "string",
            enum: ["educational", "career_development", "hobby", "business", "nonprofit", "startup"],
            description: "The project classification category"
          },
          industry: {
            type: "string",
            enum: ["technology", "healthcare", "finance", "education", "e_commerce_retail", "entertainment_media", "art_design", "science_research", "social_good", "other"],
            description: "The industry this project belongs to"
          },
          area_of_interest: {
            type: "string",
            description: "Short area of focus (max 20 characters)"
          },
          skills_needed: {
            type: "array",
            items: { type: "string" },
            description: "List of 3-6 relevant skills needed"
          },
          tools_needed: {
            type: "array",
            items: { type: "string" },
            description: "List of 3-6 tools/technologies needed"
          }
        },
        required: ["title", "description", "project_type", "classification", "industry", "area_of_interest", "skills_needed", "tools_needed"]
      }
    });

    return Response.json(response);
  } catch (error) {
    console.error("Error generating project suggestions:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});