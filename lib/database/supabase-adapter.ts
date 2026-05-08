// lib/database/supabase-adapter.ts
// IMPLEMENTACIÓN SUPABASE del interface universal

import { createClient } from '@supabase/supabase-js'
import { IDatabase } from './interface'

export class SupabaseAdapter implements IDatabase {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession()
    return session
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser()
    return user
  }

  async getProfile(userId: string) {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data
  }

  async updateProfile(userId: string, data: any) {
    const { error } = await this.supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
    if (error) throw error
  }

  async getProfileByEmail(email: string) {
    const { data } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()
    return data
  }

  async getAllProfiles(role?: string) {
    let query = this.supabase.from('profiles').select('*')
    if (role) query = query.eq('role', role)
    const { data } = await query.order('full_name')
    return data || []
  }

  async createProfile(data: any) {
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return profile.id
  }

  async deleteProfile(userId: string) {
    const { error } = await this.supabase
      .from('profiles')
      .delete()
      .eq('id', userId)
    if (error) throw error
  }

  // ============ COURSES ============

  async getCourses(limit?: number) {
    let query = this.supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (limit) query = query.limit(limit)
    
    const { data } = await query
    return data || []
  }

  async getCoursesByRole(userId: string, role: string) {
    if (role === 'admin') {
      return this.getCourses()
    } else {
      // Estudiante: solo cursos donde está enrolado
      const { data: enrolledCourseIds } = await this.supabase
        .from('enrollments')
        .select('course_id')
        .eq('profile_id', userId)
      
      if (!enrolledCourseIds || enrolledCourseIds.length === 0) return []
      
      const courseIds = enrolledCourseIds.map((e: any) => e.course_id)
      const { data } = await this.supabase
        .from('courses')
        .select('*')
        .in('id', courseIds)
        .order('created_at', { ascending: false })
      
      return data || []
    }
  }

  async getCourse(courseId: string) {
    const { data } = await this.supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single()
    return data
  }

  async createCourse(data: any) {
    const { data: course, error } = await this.supabase
      .from('courses')
      .insert(data)
      .select()
      .single()
    if (error) throw error
    return course.id
  }

  async updateCourse(courseId: string, data: any) {
    const { error } = await this.supabase
      .from('courses')
      .update(data)
      .eq('id', courseId)
    if (error) throw error
  }

  async deleteCourse(courseId: string) {
    const { error } = await this.supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    if (error) throw error
  }

  // ============ ENROLLMENTS ============

  async getEnrollments(courseId: string) {
    const { data } = await this.supabase
      .from('enrollments')
      .select('*')
      .eq('course_id', courseId)
    return data || []
  }

  async getStudentEnrollments(profileId: string) {
    const { data } = await this.supabase
      .from('enrollments')
      .select('*')
      .eq('profile_id', profileId)
    return data || []
  }

  async addEnrollment(profileId: string, courseId: string) {
    const { error } = await this.supabase
      .from('enrollments')
      .insert({ profile_id: profileId, course_id: courseId })
    if (error) throw error
  }

  async removeEnrollment(profileId: string, courseId: string) {
    const { error } = await this.supabase
      .from('enrollments')
      .delete()
      .eq('profile_id', profileId)
      .eq('course_id', courseId)
    if (error) throw error
  }

  async isEnrolled(profileId: string, courseId: string) {
    const { data } = await this.supabase
      .from('enrollments')
      .select('id')
      .eq('profile_id', profileId)
      .eq('course_id', courseId)
      .maybeSingle()
    return !!data
  }

  async bulkAddEnrollments(courseId: string, profileIds: string[]) {
    const enrollments = profileIds.map(pid => ({
      profile_id: pid,
      course_id: courseId
    }))
    const { error } = await this.supabase
      .from('enrollments')
      .insert(enrollments)
    if (error) throw error
  }

  async bulkRemoveEnrollments(courseId: string, profileIds: string[]) {
    const { error } = await this.supabase
      .from('enrollments')
      .delete()
      .eq('course_id', courseId)
      .in('profile_id', profileIds)
    if (error) throw error
  }

  // ============ PROGRESS ============

  async getProgress(profileId: string, courseId: string) {
    const { data } = await this.supabase
      .from('student_progress')
      .select('*')
      .eq('profile_id', profileId)
      .eq('course_id', courseId)
      .maybeSingle()
    return data
  }

  async updateProgress(profileId: string, courseId: string, data: any) {
    const { error } = await this.supabase
      .from('student_progress')
      .update(data)
      .eq('profile_id', profileId)
      .eq('course_id', courseId)
    if (error) throw error
  }

  async createProgress(profileId: string, courseId: string) {
    const { error } = await this.supabase
      .from('student_progress')
      .insert({
        profile_id: profileId,
        course_id: courseId,
        current_score: 0,
        is_completed: false
      })
    if (error) throw error
  }

  // ============ STORAGE ============

  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file)
    
    if (error) throw error
    return this.getPublicUrl(bucket, path)
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  }

  async deleteFile(bucket: string, path: string) {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path])
    if (error) throw error
  }

  // ============ AUTH ============

  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }
}