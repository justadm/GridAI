import { ref } from 'vue';

export type UserProfile = {
  email?: string;
  role?: string;
};

const profile = ref<UserProfile | null>(null);

export function useUser() {
  const loadProfile = () => {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem('sr-user');
    if (raw) {
      try {
        profile.value = JSON.parse(raw);
      } catch {
        profile.value = null;
      }
    }
  };

  const setProfile = (data: UserProfile | null) => {
    profile.value = data;
    if (typeof window === 'undefined') return;
    if (data) {
      localStorage.setItem('sr-user', JSON.stringify(data));
    } else {
      localStorage.removeItem('sr-user');
    }
  };

  return { profile, loadProfile, setProfile };
}
