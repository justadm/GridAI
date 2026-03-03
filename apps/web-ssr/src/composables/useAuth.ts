import { ref, computed, onMounted } from 'vue';

const authed = ref<boolean>(typeof window !== 'undefined' ? localStorage.getItem('sr-authed') === '1' : false);

export function useAuth() {
  const isAuthed = computed(() => authed.value);

  const loadAuth = () => {
    if (typeof window === 'undefined') return;
    authed.value = localStorage.getItem('sr-authed') === '1';
  };

  const setAuthed = (value: boolean) => {
    authed.value = value;
    if (typeof window !== 'undefined') {
      if (value) {
        localStorage.setItem('sr-authed', '1');
      } else {
        localStorage.removeItem('sr-authed');
      }
    }
  };

  onMounted(loadAuth);

  return { isAuthed, loadAuth, setAuthed };
}
