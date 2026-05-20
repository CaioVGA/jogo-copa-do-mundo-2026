import { ExecutionContext, CallHandler } from '@nestjs/common';
import { LoggingInterceptor } from './logging.interceptor';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('deve ser definido', () => {
    expect(interceptor).toBeDefined();
  });

  describe('Intercepção de Requisições', () => {
    it('deve injetar correlation id e registrar a requisição com campos sensíveis higienizados', async () => {
      const mockRequest: any = {
        method: 'POST',
        url: '/api/auth/login',
        ip: '127.0.0.1',
        headers: {},
        body: {
          email: 'usuario@teste.com',
          password: 'SenhaSecreta123',
          confirmPassword: 'SenhaSecreta123',
        },
      };

      const mockResponse: any = {
        statusCode: 200,
        setHeader: jest.fn(),
      };

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => mockRequest,
          getResponse: () => mockResponse,
        }),
      } as ExecutionContext;

      const mockNext = {
        handle: () => of({ success: true }),
      } as CallHandler;

      // Espiona o logger do interceptor para validar a saída formatada em JSON
      const spyLogger = jest.spyOn(interceptor['logger'], 'log');

      await new Promise<void>((resolve) => {
        interceptor.intercept(mockContext, mockNext).subscribe({
          next: () => {
            resolve();
          },
        });
      });

      // Valida injeção de Correlation ID
      expect(mockRequest.correlationId).toBeDefined();
      expect(typeof mockRequest.correlationId).toBe('string');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('x-correlation-id', mockRequest.correlationId);

      // Verifica que o logger registrou a requisição com segurança
      expect(spyLogger).toHaveBeenCalled();
      
      const loggedJson = JSON.parse(spyLogger.mock.calls[0][0]);
      
      expect(loggedJson.correlationId).toBe(mockRequest.correlationId);
      expect(loggedJson.method).toBe('POST');
      expect(loggedJson.url).toBe('/api/auth/login');
      
      // Garante sanitização de campos de segurança
      expect(loggedJson.body.password).toBe('[REDACTED]');
      expect(loggedJson.body.confirmPassword).toBe('[REDACTED]');
      expect(loggedJson.body.email).toBe('usuario@teste.com');
    });
  });
});
