import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, X } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export const EditBioModal = ({ isOpen, onClose, bio, onSave }) => {
  const [editedBio, setEditedBio] = useState(bio || "");
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => { setEditedBio(bio || ""); }, [bio]);
  const handleSave = async () => {
    setIsSaving(true);
    try { await onSave(editedBio); onClose(); }
    catch { toast.error("Failed to save bio."); }
    finally { setIsSaving(false); }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Edit Biography</DialogTitle><DialogDescription>Share your story, background, and what drives you.</DialogDescription></DialogHeader>
        <div className="py-4">
          <Textarea value={editedBio} onChange={(e) => setEditedBio(e.target.value)} rows={6} placeholder="Tell everyone about yourself..." className="resize-none" />
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="cu-button">{isSaving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const EditEducationModal = ({ isOpen, onClose, education, onSave }) => {
  const [editedEducation, setEditedEducation] = useState(education || []);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [current, setCurrent] = useState({ university_name: '', degree: '', major: '', graduation_date: '' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  useEffect(() => { setEditedEducation(education || []); }, [education]);

  const handleOpen = (index = null) => {
    setEditingIndex(index);
    setCurrent(index !== null ? editedEducation[index] : { university_name: '', degree: '', major: '', graduation_date: '' });
    setIsAddOpen(true);
  };
  const handleSaveItem = () => {
    if (!current.university_name || !current.degree || !current.major || !current.graduation_date) { toast.error("Please fill all fields."); return; }
    const updated = [...editedEducation];
    if (editingIndex !== null) updated[editingIndex] = current; else updated.push(current);
    setEditedEducation(updated); setIsAddOpen(false);
  };
  const handleSave = async () => {
    setIsSaving(true);
    try { await onSave(editedEducation); onClose(); }
    catch { toast.error("Failed to save education."); }
    finally { setIsSaving(false); }
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Education</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <Button variant="outline" onClick={() => handleOpen()} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Education</Button>
            {editedEducation.map((edu, i) => (
              <div key={i} className="p-4 border rounded-lg flex justify-between items-start bg-gray-50">
                <div><p className="font-semibold">{edu.university_name}</p><p className="text-sm text-gray-600">{edu.degree} in {edu.major}</p><p className="text-sm text-gray-500">{edu.graduation_date}</p></div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(i)}><Edit className="w-4 h-4 text-gray-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditedEducation(editedEducation.filter((_, j) => j !== i))}><X className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="cu-button">{isSaving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Education</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="University Name" value={current.university_name} onChange={(e) => setCurrent(p => ({ ...p, university_name: e.target.value }))} />
            <Input placeholder="Degree (e.g., B.A., M.Sc.)" value={current.degree} onChange={(e) => setCurrent(p => ({ ...p, degree: e.target.value }))} />
            <Input placeholder="Major (e.g., Computer Science)" value={current.major} onChange={(e) => setCurrent(p => ({ ...p, major: e.target.value }))} />
            <Input placeholder="Graduation Date (e.g., May 2025)" value={current.graduation_date} onChange={(e) => setCurrent(p => ({ ...p, graduation_date: e.target.value }))} />
          </div>
          <Button onClick={handleSaveItem} className="w-full cu-button">{editingIndex !== null ? 'Update' : 'Add'}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const EditAwardsModal = ({ isOpen, onClose, awards, onSave }) => {
  const [editedAwards, setEditedAwards] = useState(awards || []);
  const [isSaving, setIsSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [current, setCurrent] = useState({ name: '', issuing_organization: '', date_received: '', credential_url: '' });
  const [isAddOpen, setIsAddOpen] = useState(false);
  useEffect(() => { setEditedAwards(awards || []); }, [awards]);

  const handleOpen = (index = null) => {
    setEditingIndex(index);
    setCurrent(index !== null ? editedAwards[index] : { name: '', issuing_organization: '', date_received: '', credential_url: '' });
    setIsAddOpen(true);
  };
  const handleSaveItem = () => {
    if (!current.name || !current.issuing_organization || !current.date_received) { toast.error("Please fill all required fields."); return; }
    const updated = [...editedAwards];
    if (editingIndex !== null) updated[editingIndex] = current; else updated.push(current);
    setEditedAwards(updated); setIsAddOpen(false);
  };
  const handleSave = async () => {
    setIsSaving(true);
    try { await onSave(editedAwards); onClose(); }
    catch { toast.error("Failed to save awards."); }
    finally { setIsSaving(false); }
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Awards & Certifications</DialogTitle></DialogHeader>
          <div className="py-4 space-y-4">
            <Button variant="outline" onClick={() => handleOpen()} className="w-full"><Plus className="w-4 h-4 mr-2" />Add Award/Certification</Button>
            {editedAwards.map((award, i) => (
              <div key={i} className="p-4 border rounded-lg flex justify-between items-start bg-gray-50">
                <div>
                  <p className="font-semibold">{award.name}</p>
                  <p className="text-sm text-gray-600">{award.issuing_organization} • {award.date_received}</p>
                  {award.credential_url && <a href={award.credential_url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline">View Credential</a>}
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpen(i)}><Edit className="w-4 h-4 text-gray-500" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setEditedAwards(editedAwards.filter((_, j) => j !== i))}><X className="w-4 h-4 text-red-500" /></Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving} className="cu-button">{isSaving ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingIndex !== null ? 'Edit' : 'Add'} Award/Certification</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Input placeholder="Award/Certification Name" value={current.name} onChange={(e) => setCurrent(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Issuing Organization" value={current.issuing_organization} onChange={(e) => setCurrent(p => ({ ...p, issuing_organization: e.target.value }))} />
            <Input placeholder="Date Received (e.g., Jan 2023)" value={current.date_received} onChange={(e) => setCurrent(p => ({ ...p, date_received: e.target.value }))} />
            <Input placeholder="Credential URL (Optional)" value={current.credential_url} onChange={(e) => setCurrent(p => ({ ...p, credential_url: e.target.value }))} />
          </div>
          <Button onClick={handleSaveItem} className="w-full cu-button">{editingIndex !== null ? 'Update' : 'Add'}</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};

export const EditWebLinksModal = ({ isOpen, onClose, linkedinUrl, websiteUrl, onSave }) => {
  const [editedLinkedin, setEditedLinkedin] = useState(linkedinUrl || "");
  const [editedWebsite, setEditedWebsite] = useState(websiteUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => { setEditedLinkedin(linkedinUrl || ""); setEditedWebsite(websiteUrl || ""); }, [linkedinUrl, websiteUrl]);
  const handleSave = async () => {
    setIsSaving(true);
    try { await onSave(editedLinkedin, editedWebsite); onClose(); }
    catch { toast.error("Failed to save web links."); }
    finally { setIsSaving(false); }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Web Links</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div><Label className="text-sm font-medium mb-2 block">LinkedIn URL</Label><Input placeholder="https://linkedin.com/in/your-profile" value={editedLinkedin} onChange={(e) => setEditedLinkedin(e.target.value)} /></div>
          <div><Label className="text-sm font-medium mb-2 block">Personal Website</Label><Input placeholder="https://your-website.com" value={editedWebsite} onChange={(e) => setEditedWebsite(e.target.value)} /></div>
        </div>
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="cu-button">{isSaving ? "Saving..." : "Save Changes"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};