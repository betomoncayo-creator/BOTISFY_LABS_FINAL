// lib/database/interface.ts
// CONTRATO UNIVERSAL: Toda BD debe implementar estos métodos

export interface IDatabase {
    // ============ AUTH ============
    getCurrentUser(): Promise<any>
    
    // ============ PROFILES ============
    getProfile(userId: string): Promise<any>
    updateProfile(userId: string, data: any): Promise<void>
    getProfileByEmail(email: string): Promise<any>
    getAllProfiles(role?: string): Promise<any[]>
    createProfile(data: any): Promise<string>
    deleteProfile(userId: string): Promise<void>
  
    // ============ COURSES ============
    getCourses(limit?: number): Promise<any[]>
    getCoursesByRole(userId: string, role: string): Promise<any[]>
    getCourse(courseId: string): Promise<any>
    createCourse(data: any): Promise<string>
    updateCourse(courseId: string, data: any): Promise<void>
    deleteCourse(courseId: string): Promise<void>
  
    // ============ ENROLLMENTS ============
    getEnrollments(courseId: string): Promise<any[]>
    getStudentEnrollments(profileId: string): Promise<any[]>
    addEnrollment(profileId: string, courseId: string): Promise<void>
    removeEnrollment(profileId: string, courseId: string): Promise<void>
    isEnrolled(profileId: string, courseId: string): Promise<boolean>
    bulkAddEnrollments(courseId: string, profileIds: string[]): Promise<void>
    bulkRemoveEnrollments(courseId: string, profileIds: string[]): Promise<void>
  
    // ============ PROGRESS ============
    getProgress(profileId: string, courseId: string): Promise<any>
    updateProgress(profileId: string, courseId: string, data: any): Promise<void>
    createProgress(profileId: string, courseId: string): Promise<void>
  
    // ============ STORAGE ============
    uploadFile(bucket: string, path: string, file: File): Promise<string>
    getPublicUrl(bucket: string, path: string): string
    deleteFile(bucket: string, path: string): Promise<void>
  
    // ============ UTILS ============
    getSession(): Promise<any>
    signOut(): Promise<void>
  }