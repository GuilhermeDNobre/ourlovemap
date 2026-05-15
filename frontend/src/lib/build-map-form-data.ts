import type { WizardStore } from '../stores/wizard-store';

export function buildMapFormData(store: WizardStore): FormData {
  const formData = new FormData();
  formData.append('couple_name', store.names);
  formData.append('buyer_name', store.buyerName);
  formData.append('buyer_phone', store.buyerPhone);
  formData.append('email', store.email);
  formData.append('plan', store.plan);
  formData.append('relationship_start_date', store.startDate);
  if (store.opening) {
    formData.append('opening', store.opening);
  }
  if (store.music.videoId) {
    formData.append('youtube_url', `https://www.youtube.com/watch?v=${store.music.videoId}`);
    formData.append('youtube_start_time', String(store.music.startTime));
    formData.append('youtube_end_time', String(store.music.endTime));
    formData.append('youtube_loop', String(store.music.loop));
  }
  store.places.forEach((place, i) => {
    formData.append(`locations[${i}][title]`, place.title);
    formData.append(`locations[${i}][address]`, place.address);
    formData.append(`locations[${i}][description]`, place.description);
    formData.append(`locations[${i}][latitude]`, String(place.latitude));
    formData.append(`locations[${i}][longitude]`, String(place.longitude));
    formData.append(`locations[${i}][order]`, String(i));
    if (place.photo instanceof File) {
      formData.append(`locations[${i}][photo]`, place.photo);
    }
  });
  return formData;
}
