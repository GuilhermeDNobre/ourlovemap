# Testes

## Framework

Utilize a biblioteca Jest para determinar os cenários de teste e as expectativas.

**Exemplo:**
```typescript
import { describe, it, expect } from '@jest/globals';

describe('UserService', () => {
  it('should create a new user', () => {
    const user = createUser({ name: 'John', email: 'john@example.com' });
    expect(user.name).toBe('John');
  });
});
```

## Execução

Para rodar os testes, utilize o comando:
```bash
npm test
```

## Testes de Rotas Fastify

Para testar rotas HTTP, utilize `fastify.inject()` — não é necessário iniciar um servidor real. Construa uma função factory que retorna uma instância configurada do Fastify para uso nos testes.

**Exemplo:**
```typescript
// test-helpers/build-app.ts
import Fastify from 'fastify';
import { userRoutes } from '../src/routes/user-routes';

export function buildApp() {
  const app = Fastify();
  app.register(userRoutes, { prefix: '/api' });
  return app;
}

// user-routes.test.ts
import { buildApp } from '../test-helpers/build-app';

describe('GET /api/users/:userId', () => {
  it('should return 200 with user data', async () => {
    // Arrange
    const app = buildApp();

    // Act
    const response = await app.inject({
      method: 'GET',
      url: '/api/users/user_123',
    });

    // Assert
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id: 'user_123' });
  });

  it('should return 404 when user does not exist', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/users/nonexistent',
    });
    expect(response.statusCode).toBe(404);
  });
});
```

## Independência

Não crie dependência entre os testes. Deve ser possível rodar cada um deles de forma independente.

**Exemplo:**
```typescript
// ❌ Evite
let sharedUser: User;

it('should create user', () => {
  sharedUser = createUser({ name: 'John' });
});

it('should update user', () => {
  // depende do teste anterior
  updateUser(sharedUser.id, { name: 'Jane' });
});

// ✅ Prefira
it('should create user', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
});

it('should update user', () => {
  const user = createUser({ name: 'John' });
  const updated = updateUser(user.id, { name: 'Jane' });
  expect(updated.name).toBe('Jane');
});
```

## Estrutura AAA/GWT

Siga o princípio **Arrange, Act, Assert** ou **Given, When, Then** para garantir o máximo de organização e legibilidade dentro dos testes.

**Exemplo:**
```typescript
it('should calculate total price with discount', () => {
  // Arrange (Given)
  const items = [
    { price: 100, quantity: 2 },
    { price: 50, quantity: 1 }
  ];
  const discountPercentage = 10;
  
  // Act (When)
  const total = calculateTotal(items, discountPercentage);
  
  // Assert (Then)
  expect(total).toBe(225); // (200 + 50) * 0.9
});
```

## Mocks e Tempo

Se estiver testando algum comportamento que depende de um Date, e isso for importante para o que estiver sendo testado, utilize um Mock para garantir que o teste seja repetível.

**Exemplo:**
```typescript
import { jest } from '@jest/globals';

it('should set created date correctly', () => {
  // Arrange
  const mockDate = new Date('2024-01-01T12:00:00Z');
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
  
  // Act
  const user = createUser({ name: 'John' });
  
  // Assert
  expect(user.createdAt).toEqual(mockDate);
  
  // Cleanup
  jest.restoreAllMocks();
});
```

## Foco e Clareza

Foque em testar um comportamento por teste. Evite escrever testes muito grandes.

**Exemplo:**
```typescript
// ❌ Evite
it('should handle user operations', () => {
  const user = createUser({ name: 'John' });
  expect(user.name).toBe('John');
  
  const updated = updateUser(user.id, { email: 'john@example.com' });
  expect(updated.email).toBe('john@example.com');
  
  deleteUser(user.id);
  const deleted = getUser(user.id);
  expect(deleted).toBeNull();
});

// ✅ Prefira
describe('UserService', () => {
  it('should create a new user', () => {
    const user = createUser({ name: 'John' });
    expect(user.name).toBe('John');
  });
  
  it('should update user email', () => {
    const user = createUser({ name: 'John' });
    const updated = updateUser(user.id, { email: 'john@example.com' });
    expect(updated.email).toBe('john@example.com');
  });
  
  it('should delete user', () => {
    const user = createUser({ name: 'John' });
    deleteUser(user.id);
    const deleted = getUser(user.id);
    expect(deleted).toBeNull();
  });
});
```

## Cobertura

Garanta que o código que está sendo escrito esteja totalmente coberto por testes.

**Exemplo:**
```typescript
// Para verificar cobertura
npm test -- --coverage

// Configure no package.json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## Expectativas Consistentes

Crie expectativas consistentes, garantindo que tudo que estiver sendo testado está de fato sendo conferido.

**Exemplo:**
```typescript
// ❌ Evite
it('should create user with full details', () => {
  const user = createUser({ 
    name: 'John',
    email: 'john@example.com',
    age: 30 
  });
  expect(user.name).toBe('John');
  // faltou testar email e age
});

// ✅ Prefira
it('should create user with full details', () => {
  const user = createUser({ 
    name: 'John',
    email: 'john@example.com',
    age: 30 
  });
  expect(user.name).toBe('John');
  expect(user.email).toBe('john@example.com');
  expect(user.age).toBe(30);
  expect(user.id).toBeDefined();
  expect(user.createdAt).toBeInstanceOf(Date);
});
```

## Nomenclatura de Testes

Use descrições claras e descritivas que expliquem o comportamento esperado.

**Exemplo:**
```typescript
// ❌ Evite
it('test user', () => {});
it('works', () => {});

// ✅ Prefira
it('should create user with valid email', () => {});
it('should throw error when email is invalid', () => {});
it('should return null when user not found', () => {});
```
