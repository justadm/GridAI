import { inject } from 'vue';
import type { Ref } from 'vue';

export function useHead(html: string) {
  const head = inject<Ref<string>>('head');
  if (head) {
    head.value = html;
  }
}
