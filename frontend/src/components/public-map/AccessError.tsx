import { Link } from 'react-router-dom';

interface AccessErrorProps {
  status: number;
  errorCode?: string;
}

export function AccessError({ status, errorCode }: AccessErrorProps) {
  const isExpired = status === 403 && errorCode === 'map_expired';
  return (
    <div className="min-h-screen bg-olm-dark flex flex-col items-center justify-center px-6 text-center">
      {status === 401 && (
        <>
          <h1 className="font-serif text-3xl text-white mb-4">Acesso inválido</h1>
          <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            O link que você acessou não é válido ou o token de acesso está ausente.
          </p>
        </>
      )}
      {isExpired && (
        <>
          <h1 className="font-serif text-3xl text-white mb-4">Seu acesso expirou</h1>
          <p className="text-sm max-w-sm mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
            O período de acesso do seu mapa expirou. Faça upgrade para continuar acessando.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-olm-primary text-white font-medium rounded-pill"
          >
            Fazer upgrade para Premium
          </Link>
        </>
      )}
      {!isExpired && status === 403 && (
        <>
          <h1 className="font-serif text-3xl text-white mb-4">Acesso negado</h1>
          <p className="text-sm max-w-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Você não tem permissão para acessar este mapa.
          </p>
        </>
      )}
    </div>
  );
}
