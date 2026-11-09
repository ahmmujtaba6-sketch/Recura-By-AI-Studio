export type UserRole = 'patient' | 'therapist' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  created_at?: string;
  patient_profile?: PatientProfile;
  therapist_profile?: TherapistProfile;
  plan?: PatientPlan;
}

export interface PatientProfile {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  dob: string;
  gender: string;
  city: string;
  height: number;
  weight: number;
  allergies: string;
  medical_history: string;
  primary_complaint_area: string;
  primary_complaint_duration: string;
  completion_percentage: number;
}

export interface TherapistProfile {
  id: number;
  user_id: number;
  name: string;
  speciality: string;
  registration_no: string;
  experience: number;
  city: string;
  fee: number;
  bio: string;
  status: 'pending' | 'approved' | 'rejected';
  rating: number;
}

export interface PatientPlan {
  id: number;
  patient_id?: number;
  plan: 'free' | 'basic' | 'premium';
  cycle: 'monthly' | 'yearly';
  started_at?: string;
  video_calls_used: number;
  period_start?: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  type: string;
  title: string;
  body: string;
  read: number;
  created_at: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}
