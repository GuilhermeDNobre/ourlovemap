import { z } from 'zod';

export const step1Schema = z.object({
  names: z.string().min(3, 'Mínimo de 3 caracteres'),
  buyerName: z.string().min(1, 'Informe seu nome completo'),
  buyerPhone: z.string().min(1, 'Informe seu telefone'),
  startDate: z
    .string()
    .min(1, 'Informe a data')
    .refine((val) => {
      if (!val) return false;
      const date = new Date(val);
      return !isNaN(date.getTime()) && date < new Date();
    }, 'A data deve estar no passado'),
  opening: z.string().max(200, 'Máximo de 200 caracteres').optional().default(''),
});

const placeSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Nome do lugar obrigatório'),
  address: z.string(),
  description: z.string(),
  photo: z.instanceof(File).nullable(),
  latitude: z.number().refine((v) => v !== 0, 'Endereço obrigatório'),
  longitude: z.number().refine((v) => v !== 0, 'Endereço obrigatório'),
});

export const step2Schema = z.object({
  places: z.array(placeSchema).min(1, 'Adicione pelo menos um lugar'),
});

export const step4Schema = z
  .object({
    email: z.string().email('Email inválido'),
    emailConfirm: z.string().email('Email inválido'),
  })
  .refine((data) => data.email === data.emailConfirm, {
    message: 'Os emails não coincidem',
    path: ['emailConfirm'],
  });
