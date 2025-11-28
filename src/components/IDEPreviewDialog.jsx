import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Monitor, Smartphone } from 'lucide-react';

export default function IDEPreviewDialog({ isOpen, onClose, codeProject, projectTitle }) {
  const [previewMode, setPreviewMode] = useState('desktop');
  const [activeHtmlFile, setActiveHtmlFile] = useState(null);
  const [files, setFiles] = useState([]);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!codeProject) return;
    
    try {
      let parsedFiles = [];
      
      // Try to parse content field (JSON string)
      if (codeProject.content) {
        try {
          const parsed = JSON.parse(codeProject.content);
          if (parsed.files && Array.isArray(parsed.files)) {
            parsedFiles = parsed.files;
          } else if (Array.isArray(parsed)) {
            parsedFiles = parsed;
          }
        } catch (e) {
          console.log("Content is not JSON, treating as raw data");
        }
      }
      
      // Try to parse ide_config field
      if (parsedFiles.length === 0 && codeProject.ide_config) {
        if (typeof codeProject.ide_config === 'string') {
          try {
            const parsed = JSON.parse(codeProject.ide_config);
            if (parsed.files && Array.isArray(parsed.files)) {
              parsedFiles = parsed.files;
            }
          } catch (e) {
            console.log("ide_config is not JSON");
          }
        } else if (typeof codeProject.ide_config === 'object' && codeProject.ide_config.files) {
          parsedFiles = codeProject.ide_config.files;
        }
      }
      
      // Set files and find first HTML file
      if (parsedFiles.length > 0) {
        setFiles(parsedFiles);
        const firstHtml = parsedFiles.find(f => 
          f.type === 'code' && (f.language === 'html' || f.name?.endsWith('.html'))
        );
        
        if (firstHtml) {
          setActiveHtmlFile(firstHtml);
        } else {
          // If no HTML file, create a default one
          const defaultHtml = {
            name: 'index.html',
            type: 'code',
            language: 'html',
            code: '<div style="padding: 20px; text-align: center;"><h1>No HTML file found</h1><p>This project doesn\'t have an HTML file to display.</p></div>'
          };
          setActiveHtmlFile(defaultHtml);
        }
      } else {
        console.log("No files found in project data");
        // Set a fallback message
        const fallbackHtml = {
          name: 'index.html',
          type: 'code',
          language: 'html',
          code: '<div style="padding: 20px; text-align: center; font-family: sans-serif;"><h1>Preview Unavailable</h1><p>Unable to load project files.</p></div>'
        };
        setFiles([fallbackHtml]);
        setActiveHtmlFile(fallbackHtml);
      }
    } catch (error) {
      console.error("Error parsing IDE content:", error);
      // Set error message
      const errorHtml = {
        name: 'index.html',
        type: 'code',
        language: 'html',
        code: '<div style="padding: 20px; text-align: center; font-family: sans-serif; color: #e53e3e;"><h1>Error Loading Preview</h1><p>An error occurred while loading the project files.</p></div>'
      };
      setFiles([errorHtml]);
      setActiveHtmlFile(errorHtml);
    }
  }, [codeProject]);

  useEffect(() => {
    if (isOpen && activeHtmlFile) {
      // Add a small delay to ensure iframe is ready
      const timer = setTimeout(() => {
        updatePreview();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeHtmlFile, files, isOpen, previewMode]);

  const updatePreview = () => {
    if (!iframeRef.current || !activeHtmlFile) return;

    const iframeElement = iframeRef.current;
    
    const updateContent = () => {
      try {
        const iframeDoc = iframeElement.contentDocument || iframeElement.contentWindow?.document;
        if (!iframeDoc) {
          console.log("Cannot access iframe document");
          return;
        }

        let htmlContent = activeHtmlFile.code || '';

        // Collect CSS from all CSS files
        const cssFiles = files.filter(f => 
          f.type === 'code' && (f.language === 'css' || f.name?.endsWith('.css'))
        );
        let cssContent = '';
        cssFiles.forEach(cssFile => {
          cssContent += (cssFile.code || '') + '\n';
        });

        // Collect JS from all JavaScript files
        const jsFiles = files.filter(f => 
          f.type === 'code' && (f.language === 'javascript' || f.name?.endsWith('.js'))
        );
        let jsContent = '';
        jsFiles.forEach(jsFile => {
          jsContent += (jsFile.code || '') + '\n';
        });

        // Replace asset file references with actual URLs
        const assetFiles = files.filter(f => f.type === 'asset' && f.url);
        assetFiles.forEach(file => {
          const fileName = file.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const patterns = [
            new RegExp(`src=["'](?:\.{1,2}/)?(?:[^"']*/)?(${fileName})["']`, 'gi'),
            new RegExp(`href=["'](?:\.{1,2}/)?(?:[^"']*/)?(${fileName})["']`, 'gi'),
            new RegExp(`url\\(["']?(?:\.{1,2}/)?(?:[^)"']*/)?(${fileName})["']?\\)`, 'gi'),
          ];
          
          patterns.forEach(pattern => {
            htmlContent = htmlContent.replace(pattern, (match) => {
              if (match.includes('src=')) return `src="${file.url}"`;
              if (match.includes('href=')) return `href="${file.url}"`;
              if (match.includes('url(')) return `url('${file.url}')`;
              return match;
            });
            cssContent = cssContent.replace(pattern, (match) => {
              if (match.includes('url(')) return `url('${file.url}')`;
              return match;
            });
          });
        });

        // Check if HTML has proper structure
        const hasHtmlTag = /<html/i.test(htmlContent);
        const hasHeadTag = /<head/i.test(htmlContent);
        const hasBodyTag = /<body/i.test(htmlContent);

        let documentContents;

        if (hasHtmlTag && hasHeadTag && hasBodyTag) {
          // Complete HTML document - inject CSS and JS
          documentContents = htmlContent
            .replace(/<\/head>/i, `<style>\n${cssContent}\n</style>\n</head>`)
            .replace(/<\/body>/i, `<script>\ntry {\n${jsContent}\n} catch (error) {\nconsole.error('JS Error:', error);\n}\n</script>\n</body>`);
        } else {
          // HTML snippet - wrap in complete document
          const bodyContent = htmlContent.replace(/<\/?html[^>]*>|<\/?head[^>]*>|<\/?body[^>]*>/gi, '');
          
          documentContents = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>${cssContent}</style>
</head>
<body>
${bodyContent}
<script>
try{${jsContent}}catch(e){console.error('JS Error:',e);}
</script>
</body>
</html>`;
        }

        iframeDoc.open();
        iframeDoc.write(documentContents);
        iframeDoc.close();

        // Set up navigation interception after content is loaded
        setupNavigationInterception(iframeDoc);
      } catch (error) {
        console.error("Error updating preview:", error);
      }
    };

    if (iframeElement.contentDocument?.readyState === 'complete') {
      updateContent();
    } else {
      iframeElement.onload = updateContent;
    }
  };

  const setupNavigationInterception = (iframeDoc) => {
    try {
      // Intercept all link clicks in the iframe
      iframeDoc.addEventListener('click', (e) => {
        const target = e.target.closest('a');
        if (!target) return;

        const href = target.getAttribute('href');
        if (!href) return;

        // Check if it's an internal link to an HTML file
        if (href.endsWith('.html') || href.match(/^[^:/?#]+\.html$/)) {
          e.preventDefault();
          e.stopPropagation();

          // Extract filename
          const fileName = href.split('/').pop();
          
          // Find the HTML file in our files array
          const targetHtmlFile = files.find(f => 
            f.type === 'code' && 
            (f.language === 'html' || f.name?.endsWith('.html')) &&
            f.name === fileName
          );

          if (targetHtmlFile) {
            // Switch to the target HTML file
            setActiveHtmlFile(targetHtmlFile);
          } else {
            console.log(`HTML file not found: ${fileName}`);
          }
        }
        // Allow external links and anchors to work normally
      }, true);
    } catch (error) {
      console.error("Error setting up navigation interception:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-bold mb-2">{codeProject?.title || 'IDE Preview'}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                {projectTitle && (
                  <Badge variant="outline" className="text-xs">
                    {projectTitle}
                  </Badge>
                )}
                {activeHtmlFile && activeHtmlFile.name && (
                  <Badge variant="secondary" className="text-xs">
                    {activeHtmlFile.name}
                  </Badge>
                )}
                {/* Device Mode Toggle */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                  <Button 
                    variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                    size="sm" 
                    className="h-7 px-3 text-xs" 
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="w-3 h-3 mr-1" />
                    Desktop
                  </Button>
                  <Button 
                    variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                    size="sm" 
                    className="h-7 px-3 text-xs" 
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="w-3 h-3 mr-1" />
                    Mobile
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 bg-gray-100 flex items-center justify-center overflow-hidden">
          <div className={`h-full w-full flex items-center justify-center transition-all ${previewMode === 'mobile' ? 'p-4' : ''}`}>
            <div className={`transition-all ${previewMode === 'mobile' ? 'w-[375px] h-[667px] border-8 border-gray-800 rounded-[2rem] shadow-2xl' : 'w-full h-full'}`}>
              <iframe
                ref={iframeRef}
                className={`w-full h-full bg-white ${previewMode === 'mobile' ? 'rounded-[1.2rem]' : ''}`}
                sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                title={`${codeProject?.title || 'Project'} Preview`}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}