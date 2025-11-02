export interface UserProfile {
  personalUrl?: string;
  nickname?: string;
  isContactPublic?: boolean;
  address?: string;
  bio?: string;
  organization?: string;
  country?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    [key: string]: string | undefined;
  };
  contactInfo?: string;
}
