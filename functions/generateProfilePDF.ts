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
    // Upload the resume temporarily to get a URL
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

    // Extract data from the resume
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
    );

    // Deep scrape: Get tasks, collaborator info, and more details
    let completedTasks = [];
    let allToolsUsed = new Set();
    let allSkillsUsed = new Set();
    let collaboratorCount = 0;

    if (includeDeepScrape && userProjects.length > 0) {
      // Fetch tasks assigned to user
      const allTasks = await base44.asServiceRole.entities.Task.list();
      completedTasks = allTasks.filter(t => 
        t.assigned_to === profileUser.email && t.status === 'done'
      );

      // Aggregate tools and skills from all projects
      userProjects.forEach(project => {
        if (project.tools_needed) {
          project.tools_needed.forEach(tool => allToolsUsed.add(tool));
        }
        if (project.skills_needed) {
          project.skills_needed.forEach(skill => allSkillsUsed.add(skill));
        }
        if (project.project_tools) {
          project.project_tools.forEach(tool => allToolsUsed.add(tool.name));
        }
        // Count unique collaborators
        if (project.collaborator_emails) {
          collaboratorCount += project.collaborator_emails.filter(e => e !== profileUser.email).length;
        }
      });
    }

    // Extract content from existing resume if provided
    let existingResumeData = null;
    if (existingResumeBase64) {
      existingResumeData = await extractResumeContent(base44, existingResumeBase64, existingResumeType);
    }

    // Create PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    const margin = 20;
    const lineHeight = 6;
    const footerHeight = 20;
    const purpleColor = [67, 56, 202];

    const checkNewPage = (requiredSpace) => {
      if (yPos + requiredSpace > pageHeight - footerHeight) {
        doc.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    const addLine = () => {
      doc.setDrawColor(200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 8;
    };

    const addSectionHeader = (title) => {
      checkNewPage(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text(title, margin, yPos);
      doc.setTextColor(0);
      yPos += 8;
    };

    // Header - Name (clickable)
    const profileUrl = `https://collabunity.io/user-profile?username=${username}`;
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
    doc.textWithLink(cleanTextForPDF(profileUser.full_name || 'Profile'), pageWidth / 2, yPos, { 
      align: 'center',
      url: profileUrl 
    });
    doc.setTextColor(0);
    yPos += 12;

    // Contact Info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    if (profileUser.email) {
      doc.text(cleanTextForPDF(profileUser.email), pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    }
    if (profileUser.location) {
      doc.text(cleanTextForPDF(profileUser.location), pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    }
    if (profileUser.phone_number) {
      doc.text(cleanTextForPDF(profileUser.phone_number), pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;
    } else {
      yPos += 4;
    }

    addLine();

    // Professional Summary - Merge with existing resume summary if available
    const summaryText = existingResumeData?.summary || profileUser.bio;
    if (summaryText) {
      addSectionHeader('Professional Summary');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const bioLines = doc.splitTextToSize(cleanTextForPDF(summaryText), pageWidth - 2 * margin);
      doc.text(bioLines, margin, yPos);
      yPos += bioLines.length * lineHeight + 6;
      addLine();
    }

    // LinkedIn & Website
    if (profileUser.linkedin_url || profileUser.website_url) {
      addSectionHeader('Links');
      doc.setFontSize(10);
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      
      if (profileUser.linkedin_url) {
        doc.textWithLink('LinkedIn: ' + cleanTextForPDF(profileUser.linkedin_url), margin, yPos, { 
          url: profileUser.linkedin_url 
        });
        yPos += 6;
      }
      
      if (profileUser.website_url) {
        doc.textWithLink('Website: ' + cleanTextForPDF(profileUser.website_url), margin, yPos, { 
          url: profileUser.website_url 
        });
        yPos += 6;
      }
      
      doc.setTextColor(0);
      addLine();
    }

    // Work Experience from existing resume
    if (existingResumeData?.work_experience && existingResumeData.work_experience.length > 0) {
      addSectionHeader('Work Experience');
      
      for (const exp of existingResumeData.work_experience) {
        checkNewPage(40);
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanTextForPDF(exp.title || ''), margin, yPos);
        yPos += 6;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'italic');
        doc.text(cleanTextForPDF(`${exp.company || ''} | ${exp.dates || ''}`), margin, yPos);
        yPos += 6;
        
        if (exp.description) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          const descLines = doc.splitTextToSize(cleanTextForPDF(exp.description), pageWidth - 2 * margin);
          doc.text(descLines, margin, yPos);
          yPos += descLines.length * lineHeight;
        }
        
        if (exp.achievements && exp.achievements.length > 0) {
          doc.setFontSize(10);
          for (const achievement of exp.achievements.slice(0, 4)) {
            checkNewPage(10);
            const achText = cleanTextForPDF(`- ${achievement}`);
            const achLines = doc.splitTextToSize(achText, pageWidth - 2 * margin - 5);
            doc.text(achLines, margin + 5, yPos);
            yPos += achLines.length * lineHeight;
          }
        }
        
        yPos += 4;
      }
      addLine();
    }

    // Education - Merge profile and existing resume
    const allEducation = [
      ...(profileUser.education || []),
      ...(existingResumeData?.education || []).map(e => ({
        university_name: e.institution,
        degree: e.degree,
        major: e.field,
        graduation_date: e.dates
      }))
    ];
    
    // Deduplicate by institution name
    const uniqueEducation = allEducation.reduce((acc, edu) => {
      const key = (edu.university_name || edu.institution || '').toLowerCase();
      if (!acc.find(e => (e.university_name || '').toLowerCase() === key)) {
        acc.push(edu);
      }
      return acc;
    }, []);

    if (uniqueEducation.length > 0) {
      addSectionHeader('Education');

      for (const edu of uniqueEducation) {
        checkNewPage(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const eduTitle = cleanTextForPDF(`${edu.degree || ''} ${edu.major ? 'in ' + edu.major : ''}`.trim());
        if (eduTitle) {
          doc.text(eduTitle, margin, yPos);
          yPos += 6;
        }

        doc.setFont('helvetica', 'italic');
        doc.text(cleanTextForPDF(edu.university_name || ''), margin, yPos);
        yPos += 6;

        if (edu.graduation_date) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.text(cleanTextForPDF(edu.graduation_date), margin, yPos);
          yPos += 6;
        }

        yPos += 3;
      }
      addLine();
    }

    // Collab Unity Projects Section with enhanced details
    if (userProjects.length > 0) {
      addSectionHeader('Projects (Collab Unity)');

      // Add summary stats if deep scrape was done
      if (includeDeepScrape) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        const statsText = `${userProjects.length} projects | ${completedTasks.length} tasks completed | ${collaboratorCount} collaborators`;
        doc.text(cleanTextForPDF(statsText), margin, yPos);
        doc.setTextColor(0);
        yPos += 8;
      }

      for (const project of userProjects.slice(0, 10)) {
        checkNewPage(50);
        
        const projectUrl = `https://collabunity.io/ProjectDetail?id=${project.id}`;
        const isOwner = project.created_by === profileUser.email;
        
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
        doc.textWithLink(cleanTextForPDF(project.title), margin, yPos, { url: projectUrl });
        doc.setTextColor(0);
        yPos += 7;

        // Role and Status
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const roleText = isOwner ? 'Project Owner' : 'Collaborator';
        const statusLabel = cleanTextForPDF(project.status?.replace(/_/g, ' ') || '');
        const typeLabel = cleanTextForPDF(project.project_type || '');
        doc.text(`${roleText} | ${typeLabel}${typeLabel && statusLabel ? ' | ' : ''}${statusLabel}`, margin, yPos);
        yPos += 6;

        // Team size
        if (project.collaborator_emails && project.collaborator_emails.length > 1) {
          doc.setFont('helvetica', 'normal');
          doc.text(`Team of ${project.collaborator_emails.length} members`, margin, yPos);
          yPos += 6;
        }

        if (project.description) {
          doc.setFont('helvetica', 'normal');
          const descText = cleanTextForPDF(project.description.substring(0, 300) + (project.description.length > 300 ? '...' : ''));
          const descLines = doc.splitTextToSize(descText, pageWidth - 2 * margin);
          doc.text(descLines, margin, yPos);
          yPos += descLines.length * lineHeight + 4;
        }

        // Completed tasks for this project
        if (includeDeepScrape) {
          const projectTasks = completedTasks.filter(t => t.project_id === project.id);
          if (projectTasks.length > 0) {
            checkNewPage(15);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Key Contributions:', margin, yPos);
            yPos += 5;
            doc.setFont('helvetica', 'normal');
            for (const task of projectTasks.slice(0, 3)) {
              checkNewPage(8);
              const taskText = cleanTextForPDF(`- ${task.title}`);
              const taskLines = doc.splitTextToSize(taskText, pageWidth - 2 * margin - 5);
              doc.text(taskLines, margin + 5, yPos);
              yPos += taskLines.length * 5;
            }
            if (projectTasks.length > 3) {
              doc.text(cleanTextForPDF(`  + ${projectTasks.length - 3} more tasks completed`), margin + 5, yPos);
              yPos += 5;
            }
            yPos += 2;
          }
        }

        // Skills used
        if (project.skills_needed && project.skills_needed.length > 0) {
          checkNewPage(15);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Skills: ', margin, yPos);
          doc.setFont('helvetica', 'normal');
          const skillsText = cleanTextForPDF(project.skills_needed.slice(0, 8).join(', '));
          const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin - 15);
          doc.text(skillsLines, margin + 15, yPos);
          yPos += skillsLines.length * 5 + 2;
        }

        // Tools used
        if (project.tools_needed && project.tools_needed.length > 0) {
          checkNewPage(15);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Tools: ', margin, yPos);
          doc.setFont('helvetica', 'normal');
          const toolsText = cleanTextForPDF(project.tools_needed.slice(0, 8).join(', '));
          const toolsLines = doc.splitTextToSize(toolsText, pageWidth - 2 * margin - 15);
          doc.text(toolsLines, margin + 15, yPos);
          yPos += toolsLines.length * 5 + 2;
        }

        yPos += 6;
      }
      
      addLine();
    }

    // Aggregated Skills - Merge profile, resume, and project skills
    const allSkills = new Set([
      ...(profileUser.skills || []),
      ...(existingResumeData?.skills || []),
      ...allSkillsUsed
    ]);
    
    if (allSkills.size > 0) {
      addSectionHeader('Skills');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const skillsText = cleanTextForPDF([...allSkills].join(', '));
      const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
      doc.text(skillsLines, margin, yPos);
      yPos += skillsLines.length * lineHeight + 6;
      addLine();
    }

    // Tools & Technologies
    const allTools = new Set([
      ...(profileUser.tools_technologies || []),
      ...allToolsUsed
    ]);
    
    if (allTools.size > 0) {
      addSectionHeader('Tools & Technologies');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const toolsText = cleanTextForPDF([...allTools].join(', '));
      const toolsLines = doc.splitTextToSize(toolsText, pageWidth - 2 * margin);
      doc.text(toolsLines, margin, yPos);
      yPos += toolsLines.length * lineHeight + 6;
      addLine();
    }

    // Interests
    if (profileUser.interests && profileUser.interests.length > 0) {
      addSectionHeader('Interests');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const interestsText = cleanTextForPDF(profileUser.interests.join(', '));
      const interestsLines = doc.splitTextToSize(interestsText, pageWidth - 2 * margin);
      doc.text(interestsLines, margin, yPos);
      yPos += interestsLines.length * lineHeight + 6;
      addLine();
    }

    // Awards & Certifications - Merge both sources
    const allAwards = [
      ...(profileUser.awards_certifications || []),
      ...(existingResumeData?.certifications || []).map(c => ({ name: c }))
    ];
    
    if (allAwards.length > 0) {
      addSectionHeader('Honors & Certifications');

      for (const award of allAwards) {
        checkNewPage(20);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(cleanTextForPDF(award.name || ''), margin, yPos);
        yPos += 6;

        if (award.issuing_organization) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'italic');
          doc.text(cleanTextForPDF(award.issuing_organization), margin, yPos);
          yPos += 5;
        }

        if (award.date_received) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(cleanTextForPDF(award.date_received), margin, yPos);
          yPos += 5;
        }

        if (award.credential_url) {
          checkNewPage(10);
          doc.setFontSize(9);
          doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
          const credUrl = cleanTextForPDF(award.credential_url.length > 60 ? award.credential_url.substring(0, 57) + '...' : award.credential_url);
          doc.textWithLink(credUrl, margin, yPos, { url: award.credential_url });
          doc.setTextColor(0);
          yPos += 6;
        }

        yPos += 3;
      }
      addLine();
    }

    // Footer on every page
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const footerY = pageHeight - 15;
      
      doc.setFontSize(9);
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.textWithLink('Collab Unity', pageWidth / 2, footerY, { 
        align: 'center',
        url: 'https://collabunity.io'
      });
      
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120);
      doc.text('Where Ideas Happen', pageWidth / 2, footerY + 4, { align: 'center' });
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