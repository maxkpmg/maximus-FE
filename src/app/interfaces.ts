export interface Project {
  id: number;
  name: string;
  active: boolean;
}

export interface User {
  id: number;
  fname: string;
  lname: string;
  phone: string;
  email: string;
  active: boolean;
}

export interface TimeReport {
  id: number;
  date: string;
  user_id: number;
  fname: string;
  lname: string;
  project_id: number;
  hours: number;
  minutes: number;
  description: string;
}
