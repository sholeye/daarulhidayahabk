/**
 * Admin Assignments Page - Parent↔Student links & Instructor↔Class assignments
 */

import React, { useEffect, useMemo, useState } from 'react';
import { FiUsers, FiBookOpen, FiSave, FiSearch, FiLink, FiX } from 'react-icons/fi';
import { useSharedData } from '@/contexts/SharedDataContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { InlineLoader } from '@/components/ui/page-loader';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface RoleProfile {
  id: string;
  full_name: string;
  email: string;
}

export const AssignmentsPage: React.FC = () => {
  const { students, schoolClasses, refreshAll, isLoading } = useSharedData();

  const [parents, setParents] = useState<RoleProfile[]>([]);
  const [instructors, setInstructors] = useState<RoleProfile[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [linkedStudentIds, setLinkedStudentIds] = useState<string[]>([]);
  const [classAssignments, setClassAssignments] = useState<Record<string, string>>({});
  const [parentSearch, setParentSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [isSavingParent, setIsSavingParent] = useState(false);
  const [isSavingClass, setIsSavingClass] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);

  // Load parent & instructor profiles
  useEffect(() => {
    const loadRoles = async () => {
      setIsLoadingRoles(true);
      const { data: roleRows } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['parent', 'instructor']);

      const parentIds = (roleRows || []).filter(r => r.role === 'parent').map(r => r.user_id);
      const instructorIds = (roleRows || []).filter(r => r.role === 'instructor').map(r => r.user_id);
      const allIds = [...new Set([...parentIds, ...instructorIds])];

      if (allIds.length === 0) {
        setParents([]);
        setInstructors([]);
        setIsLoadingRoles(false);
        return;
      }

      const { data: profiles } = await supabase.from('profiles').select('id, full_name, email').in('id', allIds);
      const map = new Map((profiles || []).map(p => [p.id, p]));

      setParents(parentIds.map(id => map.get(id)).filter((p): p is RoleProfile => !!p).sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setInstructors(instructorIds.map(id => map.get(id)).filter((p): p is RoleProfile => !!p).sort((a, b) => a.full_name.localeCompare(b.full_name)));
      setIsLoadingRoles(false);
    };
    loadRoles();
  }, []);

  // Initialize class assignments
  useEffect(() => {
    const init = schoolClasses.reduce((acc: Record<string, string>, c) => {
      acc[c.id] = c.instructorId || '';
      return acc;
    }, {});
    setClassAssignments(init);
  }, [schoolClasses]);

  // Load parent's linked students
  useEffect(() => {
    if (!selectedParentId) { setLinkedStudentIds([]); return; }
    supabase.from('parent_students').select('student_id').eq('parent_id', selectedParentId)
      .then(({ data }) => setLinkedStudentIds((data || []).map(r => r.student_id)));
  }, [selectedParentId]);

  const selectedParent = parents.find(p => p.id === selectedParentId);

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const q = studentSearch.toLowerCase();
    return students.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.studentId.toLowerCase().includes(q) ||
      s.class.toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const handleToggleStudent = (sid: string, checked: boolean) => {
    setLinkedStudentIds(prev => checked ? [...new Set([...prev, sid])] : prev.filter(id => id !== sid));
  };

  const handleSaveParentLinks = async () => {
    if (!selectedParentId) return toast.error('Select a parent first.');
    setIsSavingParent(true);
    try {
      await supabase.from('parent_students').delete().eq('parent_id', selectedParentId);
      if (linkedStudentIds.length > 0) {
        const { error } = await supabase.from('parent_students').insert(
          linkedStudentIds.map(sid => ({ parent_id: selectedParentId, student_id: sid }))
        );
        if (error) throw error;
      }
      toast.success(`Linked ${linkedStudentIds.length} student(s) to ${selectedParent?.full_name}.`);
      await refreshAll();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save.');
    } finally {
      setIsSavingParent(false);
    }
  };

  const handleSaveClassAssignments = async () => {
    setIsSavingClass(true);
    try {
      await Promise.all(
        schoolClasses.map(c =>
          supabase.from('school_classes').update({ instructor_id: classAssignments[c.id] || null }).eq('id', c.id)
        )
      );
      toast.success('Instructor assignments updated.');
      await refreshAll();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save.');
    } finally {
      setIsSavingClass(false);
    }
  };

  if (isLoading || isLoadingRoles) return <InlineLoader />;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assignments</h1>
        <p className="text-muted-foreground mt-1">Link parents to students and assign instructors to classes</p>
      </div>

      <Tabs defaultValue="parents" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="parents" className="gap-2"><FiUsers className="w-4 h-4" /> Parent Links</TabsTrigger>
          <TabsTrigger value="instructors" className="gap-2"><FiBookOpen className="w-4 h-4" /> Class Instructors</TabsTrigger>
        </TabsList>

        {/* ─── PARENT ↔ STUDENT TAB ─── */}
        <TabsContent value="parents" className="space-y-6 mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FiLink className="w-5 h-5 text-primary" /> Link Students to a Parent
            </h2>

            {/* Parent selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Select Parent Account</label>
              {parents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No parent accounts found. Parents need to sign up first.</p>
              ) : (
                <select
                  value={selectedParentId}
                  onChange={e => setSelectedParentId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm"
                >
                  <option value="">Choose a parent…</option>
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name} ({p.email})</option>
                  ))}
                </select>
              )}
            </div>

            {selectedParentId && (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {selectedParent?.full_name?.[0] || 'P'}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{selectedParent?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedParent?.email}</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">{linkedStudentIds.length} linked</Badge>
                </div>

                <div className="relative mb-3">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search students…"
                    className="pl-9"
                  />
                </div>

                <div className="rounded-xl border border-border max-h-80 overflow-y-auto divide-y divide-border">
                  {filteredStudents.length === 0 && (
                    <p className="p-4 text-sm text-muted-foreground text-center">No students found.</p>
                  )}
                  {filteredStudents.map(s => {
                    const checked = linkedStudentIds.includes(s.studentId);
                    return (
                      <label key={s.studentId} className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors">
                        <Checkbox checked={checked} onCheckedChange={v => handleToggleStudent(s.studentId, !!v)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{s.fullName}</p>
                          <p className="text-xs text-muted-foreground">{s.studentId} • {s.class}</p>
                        </div>
                        {checked && <Badge className="bg-primary/10 text-primary text-xs">Linked</Badge>}
                      </label>
                    );
                  })}
                </div>

                <div className="mt-4">
                  <Button onClick={handleSaveParentLinks} disabled={isSavingParent}>
                    <FiSave className="w-4 h-4 mr-2" />
                    {isSavingParent ? 'Saving…' : 'Save Parent Links'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ─── INSTRUCTOR ↔ CLASS TAB ─── */}
        <TabsContent value="instructors" className="space-y-6 mt-6">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <FiBookOpen className="w-5 h-5 text-primary" /> Assign Instructors to Classes
            </h2>

            {instructors.length === 0 && (
              <p className="text-sm text-muted-foreground mb-4">No instructor accounts found. Instructors need to sign up first.</p>
            )}

            <div className="space-y-3">
              {schoolClasses.map(c => {
                const currentInstructor = instructors.find(i => i.id === classAssignments[c.id]);
                return (
                  <div key={c.id} className="p-4 rounded-xl bg-muted/30 border border-border">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.nameArabic} • {c.level}</p>
                      </div>
                      <div className="sm:w-64">
                        <select
                          value={classAssignments[c.id] || ''}
                          onChange={e => setClassAssignments(prev => ({ ...prev, [c.id]: e.target.value }))}
                          className="w-full h-10 px-3 rounded-xl border border-input bg-background text-foreground text-sm"
                        >
                          <option value="">No instructor</option>
                          {instructors.map(i => (
                            <option key={i.id} value={i.id}>{i.full_name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {currentInstructor && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{currentInstructor.email}</Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4">
              <Button onClick={handleSaveClassAssignments} disabled={isSavingClass}>
                <FiSave className="w-4 h-4 mr-2" />
                {isSavingClass ? 'Saving…' : 'Save Assignments'}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
