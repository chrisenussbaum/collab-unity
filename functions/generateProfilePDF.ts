import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';
import { jsPDF } from 'npm:jspdf@2.5.1';

// Helper function to clean and normalize text for PDF
const cleanTextForPDF = (text) => {
  if (!text) return '';
  
  return text
    // Replace smart quotes with regular quotes
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // Replace em dash and en dash with regular dash
    .replace(/[\u2013\u2014]/g, '-')
    // Replace ellipsis
    .replace(/\u2026/g, '...')
    // Replace non-breaking space
    .replace(/\u00A0/g, ' ')
    // Replace bullet points
    .replace(/[\u2022\u2023\u2043]/g, '-')
    // Replace other common special characters
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
    // Remove any remaining non-ASCII characters
    .replace(/[^\x20-\x7E]/g, '');
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await req.json();
    
    const users = await base44.asServiceRole.entities.User.filter({ username });
    if (!users || users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    
    const profileUser = users[0];

    const allProjects = await base44.asServiceRole.entities.Project.list();
    const userProjects = allProjects.filter(p => 
      p.collaborator_emails?.includes(profileUser.email)
    );

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

    // User Name (clickable link to profile)
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

    // Professional Summary / Bio
    if (profileUser.bio) {
      checkNewPage(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text('Professional Summary', margin, yPos);
      doc.setTextColor(0);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const bioLines = doc.splitTextToSize(cleanTextForPDF(profileUser.bio), pageWidth - 2 * margin);
      doc.text(bioLines, margin, yPos);
      yPos += bioLines.length * lineHeight + 6;
      addLine();
    }

    // LinkedIn & Website
    if (profileUser.linkedin_url || profileUser.website_url) {
      checkNewPage(20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text('Links', margin, yPos);
      doc.setTextColor(0);
      yPos += 8;

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

    // Education
    if (profileUser.education && profileUser.education.length > 0) {
      checkNewPage(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text('Education', margin, yPos);
      doc.setTextColor(0);
      yPos += 8;

      for (const edu of profileUser.education) {
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

    // Projects
    if (userProjects.length > 0) {
      checkNewPage(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text('Projects', margin, yPos);
      doc.setTextColor(0);
      yPos += 8;

      for (const project of userProjects.slice(0, 10)) {
        checkNewPage(40);
        
        const projectUrl = `https://collabunity.io/ProjectDetail?id=${project.id}`;
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
        doc.textWithLink(cleanTextForPDF(project.title), margin, yPos, { url: projectUrl });
        doc.setTextColor(0);
        yPos += 7;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        const statusLabel = cleanTextForPDF(project.status?.replace(/_/g, ' ') || '');
        const typeLabel = cleanTextForPDF(project.project_type || '');
        doc.text(`${typeLabel}${typeLabel && statusLabel ? ' | ' : ''}${statusLabel}`, margin, yPos);
        yPos += 6;

        if (project.description) {
          doc.setFont('helvetica', 'normal');
          const descText = cleanTextForPDF(project.description.substring(0, 250) + (project.description.length > 250 ? '...' : ''));
          const descLines = doc.splitTextToSize(descText, pageWidth - 2 * margin);
          doc.text(descLines, margin, yPos);
          yPos += descLines.length * lineHeight + 4;
        }

        if (project.skills_needed && project.skills_needed.length > 0) {
          checkNewPage(15);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Skills: ', margin, yPos);
          doc.setFont('helvetica', 'normal');
          const skillsText = cleanTextForPDF(project.skills_needed.slice(0, 8).join(', '));
          const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin - 15);
          doc.text(skillsLines, margin + 15, yPos);
          yPos += skillsLines.length * 5 + 4;
        }

        if (project.tools_needed && project.tools_needed.length > 0) {
          checkNewPage(15);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Tools: ', margin, yPos);
          doc.setFont('helvetica', 'normal');
          const toolsText = cleanTextForPDF(project.tools_needed.slice(0, 8).join(', '));
          const toolsLines = doc.splitTextToSize(toolsText, pageWidth - 2 * margin - 15);
          doc.text(toolsLines, margin + 15, yPos);
          yPos += toolsLines.length * 5 + 4;
        }

        if (project.project_urls && project.project_urls.length > 0) {
          checkNewPage(15);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.text('Links: ', margin, yPos);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
          project.project_urls.slice(0, 2).forEach((url) => {
            checkNewPage(8);
            const displayUrl = cleanTextForPDF(url.length > 50 ? url.substring(0, 47) + '...' : url);
            doc.textWithLink(displayUrl, margin + 15, yPos, { url });
            yPos += 5;
          });
          doc.setTextColor(0);
          yPos += 2;
        }

        yPos += 5;
      }
      
      addLine();
    }

    // Skills
    if (profileUser.skills && profileUser.skills.length > 0) {
      checkNewPage(25);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text('Skills', margin, yPos);
      doc.setTextColor(0);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const skillsText = cleanTextForPDF(profileUser.skills.join(', '));
      const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 2 * margin);
      doc.text(skillsLines, margin, yPos);
      yPos += skillsLines.length * lineHeight + 6;
      addLine();
    }

    // Tools
    if (profileUser.tools_technologies && profileUser.tools_technologies.length > 0) {
      checkNewPage(25);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text('Tools & Technologies', margin, yPos);
      doc.setTextColor(0);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const toolsText = cleanTextForPDF(profileUser.tools_technologies.join(', '));
      const toolsLines = doc.splitTextToSize(toolsText, pageWidth - 2 * margin);
      doc.text(toolsLines, margin, yPos);
      yPos += toolsLines.length * lineHeight + 6;
      addLine();
    }

    // Interests
    if (profileUser.interests && profileUser.interests.length > 0) {
      checkNewPage(25);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text('Interests', margin, yPos);
      doc.setTextColor(0);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const interestsText = cleanTextForPDF(profileUser.interests.join(', '));
      const interestsLines = doc.splitTextToSize(interestsText, pageWidth - 2 * margin);
      doc.text(interestsLines, margin, yPos);
      yPos += interestsLines.length * lineHeight + 6;
      addLine();
    }

    // Awards & Certifications
    if (profileUser.awards_certifications && profileUser.awards_certifications.length > 0) {
      checkNewPage(30);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
      doc.text('Honors & Awards', margin, yPos);
      doc.setTextColor(0);
      yPos += 8;

      for (const award of profileUser.awards_certifications) {
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

    // Footer on every page with proper spacing
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