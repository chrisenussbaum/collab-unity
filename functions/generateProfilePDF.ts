import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

// Helper function to clean and normalize text for PDF
const cleanTextForPDF = (text) => {
  if (!text) return '';
  
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2022\u2023\u2043]/g, '-')
    .replace(/[áàâäãå]/g, 'a')
    .replace(/[ÁÀÂÄÃÅ]/g, 'A')
    .replace(/[éèêë]/g, 'e')
    .replace(/[ÉÈÊË]/g, 'E')
    .replace(/[íìîï]/g, 'i')
    .replace(/[ÍÌÎÏ]/g, 'I')
    .replace(/[óòôöõ]/g, 'o')
    .replace(/[ÓÒÔÖÕ]/g, 'O')
    .replace(/[úùûü]/g, 'u')
    .replace(/[ÚÙÛÜ]/g, 'U')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
    .replace(/©/g, '(c)')
    .replace(/®/g, '(R)')
    .replace(/™/g, '(TM)')
    .replace(/[^\x20-\x7E]/g, '');
};

// Helper to extract text content from resume using LLM
const extractResumeContent = async (base44, resumeBase64, resumeType) => {
  if (!resumeBase64) return null;
  
  try {
    const byteCharacters = atob(resumeBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    
    const extension = resumeType?.includes('pdf') ? 'pdf' : 'docx';
    const blob = new Blob([byteArray], { type: resumeType });
    
    const { file_url } = await base44.integrations.Core.UploadFile({ 
      file: new File([blob], `resume.${extension}`, { type: resumeType })
    });

    const extractedData = await base44.integrations.Core.ExtractDataFromUploadedFile({
      file_url,
      json_schema: {
        type: "object",
        properties: {
          work_experience: {
            type: "array",
            items: {
              type: "object",
              properties: {
                company: { type: "string" },
                title: { type: "string" },
                dates: { type: "string" },
                description: { type: "string" },
                achievements: { type: "array", items: { type: "string" } }
              }
            }
          },
          education: {
            type: "array",
            items: {
              type: "object",
              properties: {
                institution: { type: "string" },
                degree: { type: "string" },
                field: { type: "string" },
                dates: { type: "string" }
              }
            }
          },
          skills: { type: "array", items: { type: "string" } },
          certifications: { type: "array", items: { type: "string" } },
          summary: { type: "string" }
        }
      }
    });

    if (extractedData.status === 'success') {
      return extractedData.output;
    }
    return null;
  } catch (error) {
    console.error('Error extracting resume content:', error);
    return null;
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username, existingResumeBase64, existingResumeType, includeDeepScrape } = await req.json();
    
    const users = await base44.asServiceRole.entities.User.filter({ username });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const profileUser = users[0];

    // Fetch all projects user is part of
    const allProjects = await base44.asServiceRole.entities.Project.list();
    const userProjects = allProjects.filter(p => 
      p.collaborator_emails?.includes(profileUser.email)
    ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    // Deep scrape: Get comprehensive contribution data
    let completedTasks = [];
    let allToolsUsed = new Set();
    let allSkillsUsed = new Set();
    const projectContributions = new Map();

    if (includeDeepScrape && userProjects.length > 0) {
      const projectIds = userProjects.map(p => p.id);
      
      // Fetch all relevant data in parallel
      const [allTasks, allThoughts, allAssets, allIDEs, allActivities] = await Promise.all([
        base44.asServiceRole.entities.Task.list(),
        base44.asServiceRole.entities.Thought.list(),
        base44.asServiceRole.entities.AssetVersion.list(),
        base44.asServiceRole.entities.ProjectIDE.list(),
        base44.asServiceRole.entities.ActivityLog.list()
      ]);

      // Process data for each project
      for (const project of userProjects) {
        const contributions = {
          tasksCompleted: 0,
          tasksInProgress: 0,
          thoughtsCreated: 0,
          assetsUploaded: 0,
          idesCreated: 0,
          activities: [],
          keyTasks: []
        };

        // Count user's tasks
        const userTasks = allTasks.filter(t => 
          t.project_id === project.id && t.assigned_to === profileUser.email
        );
        contributions.tasksCompleted = userTasks.filter(t => t.status === 'done').length;
        contributions.tasksInProgress = userTasks.filter(t => t.status === 'in_progress').length;
        contributions.keyTasks = userTasks
          .filter(t => t.status === 'done')
          .sort((a, b) => (b.priority === 'urgent' ? 1 : 0) - (a.priority === 'urgent' ? 1 : 0))
          .slice(0, 3);

        // Count thoughts created by user
        contributions.thoughtsCreated = allThoughts.filter(t => 
          t.project_id === project.id && t.created_by === profileUser.email
        ).length;

        // Count assets uploaded by user
        contributions.assetsUploaded = allAssets.filter(a => 
          a.project_id === project.id && a.uploaded_by === profileUser.email
        ).length;

        // Count IDEs created by user
        contributions.idesCreated = allIDEs.filter(ide => 
          ide.project_id === project.id && ide.created_by === profileUser.email
        ).length;

        // Get recent activities
        contributions.activities = allActivities
          .filter(a => a.project_id === project.id && a.user_email === profileUser.email)
          .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
          .slice(0, 5);

        projectContributions.set(project.id, contributions);
      }

      // Aggregate all completed tasks
      completedTasks = allTasks.filter(t => 
        t.assigned_to === profileUser.email && t.status === 'done'
      );

      // Aggregate skills and tools
      userProjects.forEach(project => {
        if (project.tools_needed) {
          project.tools_needed.slice(0, 5).forEach(tool => allToolsUsed.add(tool));
        }
        if (project.skills_needed) {
          project.skills_needed.slice(0, 5).forEach(skill => allSkillsUsed.add(skill));
        }
      });
    }

    // Extract content from existing resume if provided
    let existingResumeData = null;
    if (existingResumeBase64) {
      existingResumeData = await extractResumeContent(base44, existingResumeBase64, existingResumeType);
    }

    // Create PDF with tighter spacing
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 15;
    const margin = 18;
    const lineHeight = 5;
    const sectionGap = 4;
    const footerHeight = 18;
    const purpleColor = [67, 56, 202];

    const checkNewPage = (requiredSpace) => {
      if (yPos + requiredSpace > pageHeight - footerHeight) {
        doc.addPage();
        yPos = 15;
        return true;
      }
      return false;
    };

    const addSectionHeader = (title) => {
      checkNewPage(20);
      yPos += sectionGap;
      doc.setDrawColor(200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 5;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text(title.toUpperCase(), margin, yPos);
      doc.setTextColor(0);
      yPos += 6;
    };

    // Header - Name
    const profileUrl = `https://collabunity.io/user-profile?username=${username}`;
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
    doc.textWithLink(cleanTextForPDF(profileUser.full_name || 'Profile'), pageWidth / 2, yPos, { 
      align: 'center',
      url: profileUrl 
    });
    doc.setTextColor(0);
    yPos += 8;

    // Contact Info - Single line format
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const contactParts = [];
    if (profileUser.email) contactParts.push(profileUser.email);
    if (profileUser.phone_number) contactParts.push(profileUser.phone_number);
    if (profileUser.location) contactParts.push(profileUser.location);
    
    if (contactParts.length > 0) {
      doc.text(cleanTextForPDF(contactParts.join('  |  ')), pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
    }

    // Links on same line
    const linkParts = [];
    if (profileUser.linkedin_url) linkParts.push(profileUser.linkedin_url);
    if (profileUser.website_url) linkParts.push(profileUser.website_url);
    
    if (linkParts.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      const linksText = cleanTextForPDF(linkParts.join('  |  '));
      doc.text(linksText, pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0);
      yPos += 3;
    }

    // Professional Summary
    const summaryText = existingResumeData?.summary || profileUser.bio;
    if (summaryText) {
      addSectionHeader('Professional Summary');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const bioLines = doc.splitTextToSize(cleanTextForPDF(summaryText), pageWidth - 2 * margin);
      doc.text(bioLines, margin, yPos);
      yPos += bioLines.length * lineHeight;
    }

    // Work Experience from existing resume
    if (existingResumeData?.work_experience && existingResumeData.work_experience.length > 0) {
      addSectionHeader('Work Experience');
      
      for (const exp of existingResumeData.work_experience.slice(0, 4)) {
        checkNewPage(30);
        
        // Title and Company on same line
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanTextForPDF(exp.title || ''), margin, yPos);
        
        if (exp.dates) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          const dateWidth = doc.getTextWidth(cleanTextForPDF(exp.dates));
          doc.text(cleanTextForPDF(exp.dates), pageWidth - margin - dateWidth, yPos);
        }
        yPos += 5;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(cleanTextForPDF(exp.company || ''), margin, yPos);
        yPos += 5;
        
        // Achievements as bullet points
        if (exp.achievements && exp.achievements.length > 0) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          for (const achievement of exp.achievements.slice(0, 3)) {
            checkNewPage(8);
            const achText = cleanTextForPDF(`• ${achievement}`);
            const achLines = doc.splitTextToSize(achText, pageWidth - 2 * margin - 5);
            doc.text(achLines, margin + 3, yPos);
            yPos += achLines.length * 4;
          }
        } else if (exp.description) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(cleanTextForPDF(exp.description), pageWidth - 2 * margin);
          doc.text(descLines.slice(0, 3), margin, yPos);
          yPos += Math.min(descLines.length, 3) * 4;
        }
        
        yPos += 3;
      }
    }

    // Education
    const allEducation = [
      ...(profileUser.education || []),
      ...(existingResumeData?.education || []).map(e => ({
        university_name: e.institution,
        degree: e.degree,
        major: e.field,
        graduation_date: e.dates
      }))
    ];
    
    const uniqueEducation = allEducation.reduce((acc, edu) => {
      const key = (edu.university_name || '').toLowerCase();
      if (key && !acc.find(e => (e.university_name || '').toLowerCase() === key)) {
        acc.push(edu);
      }
      return acc;
    }, []);

    if (uniqueEducation.length > 0) {
      addSectionHeader('Education');

      for (const edu of uniqueEducation.slice(0, 3)) {
        checkNewPage(15);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const eduTitle = cleanTextForPDF(`${edu.degree || ''} ${edu.major ? 'in ' + edu.major : ''}`.trim());
        if (eduTitle) {
          doc.text(eduTitle, margin, yPos);
          
          if (edu.graduation_date) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const dateWidth = doc.getTextWidth(cleanTextForPDF(edu.graduation_date));
            doc.text(cleanTextForPDF(edu.graduation_date), pageWidth - margin - dateWidth, yPos);
          }
          yPos += 5;
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(cleanTextForPDF(edu.university_name || ''), margin, yPos);
        yPos += 5;
      }
    }

    // Project Experience
    if (userProjects.length > 0) {
      addSectionHeader('Project Experience');

      for (const project of userProjects.slice(0, 5)) {
        checkNewPage(35);
        
        const projectUrl = `https://collabunity.io/ProjectDetail?id=${project.id}`;
        const isOwner = project.created_by === profileUser.email;
        
        // Project title with role
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
        doc.textWithLink(cleanTextForPDF(project.title), margin, yPos, { url: projectUrl });
        doc.setTextColor(0);
        
        // Role on right side
        const roleText = isOwner ? 'Project Lead' : 'Contributor';
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const roleWidth = doc.getTextWidth(roleText);
        doc.text(roleText, pageWidth - margin - roleWidth, yPos);
        yPos += 5;

        // Project type and team size
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        const metaParts = [];
        if (project.project_type) metaParts.push(project.project_type);
        if (project.collaborator_emails && project.collaborator_emails.length > 1) {
          metaParts.push(`Team of ${project.collaborator_emails.length}`);
        }
        if (project.status) metaParts.push(project.status.replace(/_/g, ' '));
        doc.text(cleanTextForPDF(metaParts.join(' | ')), margin, yPos);
        yPos += 5;

        // Description - 2 lines max
        if (project.description) {
          doc.setFont('helvetica', 'normal');
          const descText = cleanTextForPDF(project.description);
          const descLines = doc.splitTextToSize(descText, pageWidth - 2 * margin);
          doc.text(descLines.slice(0, 2), margin, yPos);
          yPos += Math.min(descLines.length, 2) * 4 + 1;
        }

        // Detailed contributions summary
        if (includeDeepScrape && projectContributions.has(project.id)) {
          const contributions = projectContributions.get(project.id);
          
          // Contribution metrics
          const metrics = [];
          if (contributions.tasksCompleted > 0) {
            metrics.push(`${contributions.tasksCompleted} task${contributions.tasksCompleted > 1 ? 's' : ''} completed`);
          }
          if (contributions.thoughtsCreated > 0) {
            metrics.push(`${contributions.thoughtsCreated} note${contributions.thoughtsCreated > 1 ? 's' : ''}`);
          }
          if (contributions.assetsUploaded > 0) {
            metrics.push(`${contributions.assetsUploaded} asset${contributions.assetsUploaded > 1 ? 's' : ''}`);
          }
          if (contributions.idesCreated > 0) {
            metrics.push(`${contributions.idesCreated} workspace${contributions.idesCreated > 1 ? 's' : ''}`);
          }

          if (metrics.length > 0) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
            doc.text('Contributions:', margin, yPos);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(80);
            doc.text(cleanTextForPDF(metrics.join(' | ')), margin + 25, yPos);
            doc.setTextColor(0);
            yPos += 4;
          }

          // Key tasks completed
          if (contributions.keyTasks && contributions.keyTasks.length > 0) {
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            for (const task of contributions.keyTasks.slice(0, 2)) {
              checkNewPage(5);
              const taskText = cleanTextForPDF(`• ${task.title}`);
              const taskLines = doc.splitTextToSize(taskText, pageWidth - 2 * margin - 5);
              doc.text(taskLines.slice(0, 1), margin + 3, yPos);
              yPos += 4;
            }
          }
        }

        // Skills for this project - inline
        if (project.skills_needed && project.skills_needed.length > 0) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100);
          const skillsText = cleanTextForPDF('Skills: ' + project.skills_needed.slice(0, 5).join(', '));
          doc.text(skillsText, margin, yPos);
          doc.setTextColor(0);
          yPos += 4;
        }

        yPos += 3;
      }
    }

    // Skills Section - Categorized and limited
    const profileSkills = profileUser.skills || [];
    const resumeSkills = existingResumeData?.skills || [];
    const projectSkills = [...allSkillsUsed];
    
    // Combine and dedupe, limit to top 15
    const allSkillsArray = [...new Set([...profileSkills, ...resumeSkills, ...projectSkills])].slice(0, 15);
    
    if (allSkillsArray.length > 0) {
      addSectionHeader('Skills');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Display in a wrapped format with bullets
      const skillsText = cleanTextForPDF(allSkillsArray.join('  •  '));
      const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
      doc.text(skillsLines.slice(0, 3), margin, yPos);
      yPos += Math.min(skillsLines.length, 3) * lineHeight;
    }

    // Technical Tools - Limited
    const profileTools = profileUser.tools_technologies || [];
    const allToolsArray = [...new Set([...profileTools, ...allToolsUsed])].slice(0, 12);
    
    if (allToolsArray.length > 0) {
      addSectionHeader('Tools & Technologies');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const toolsText = cleanTextForPDF(allToolsArray.join('  •  '));
      const toolsLines = doc.splitTextToSize(toolsText, pageWidth - 2 * margin);
      doc.text(toolsLines.slice(0, 2), margin, yPos);
      yPos += Math.min(toolsLines.length, 2) * lineHeight;
    }

    // Certifications & Awards - Combined, limited
    const allAwards = [
      ...(profileUser.awards_certifications || []),
      ...(existingResumeData?.certifications || []).map(c => ({ name: c }))
    ].slice(0, 5);
    
    if (allAwards.length > 0) {
      addSectionHeader('Certifications & Awards');

      for (const award of allAwards) {
        checkNewPage(12);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        
        let awardText = cleanTextForPDF(award.name || '');
        if (award.issuing_organization) {
          awardText += ' - ' + cleanTextForPDF(award.issuing_organization);
        }
        if (award.date_received) {
          doc.setFont('helvetica', 'normal');
          const dateWidth = doc.getTextWidth(cleanTextForPDF(award.date_received));
          doc.text(cleanTextForPDF(award.date_received), pageWidth - margin - dateWidth, yPos);
        }
        
        doc.setFont('helvetica', 'normal');
        doc.text(awardText, margin, yPos);
        yPos += 5;
      }
    }

    // Footer on every page
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 10;
      
      doc.setFontSize(8);
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.textWithLink('Collab Unity', pageWidth / 2 - 15, footerY, { url: 'https://collabunity.io' });
      doc.setTextColor(150);
      doc.text(' - Where Ideas Happen', pageWidth / 2 + 5, footerY);
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${cleanTextForPDF(profileUser.full_name || 'profile')}_Resume.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating profile PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});